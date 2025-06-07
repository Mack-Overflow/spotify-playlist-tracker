import { writeFile, appendFile, access, constants } from 'fs/promises';
import { join } from 'path';
import { QueryObject } from 'ufo';

const lastSnapshotIds = new Map();

function parseISO8601Duration(iso: string) {
  const m = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const minutes = m && m[1] ? parseInt(m[1], 10) : 0;
  const seconds = m && m[2] ? parseInt(m[2], 10) : 0;
  return minutes * 60 + seconds;
}

function getPlaylistId(query: QueryObject) {
  let raw = query.playlistId;
  if (Array.isArray(raw)) raw = raw[0];
  return typeof raw === 'string' ? raw : '';
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const playlistId = getPlaylistId(query);
  if (!playlistId) return { error: 'playlistId is required' };

  const config = useRuntimeConfig();
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${config.spotifyClientId}:${config.spotifyClientSecret}`
      ).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  });
  const { access_token } = await tokenRes.json();

  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const playlistData = await res.json();
  lastSnapshotIds.set(playlistId, playlistData.snapshot_id);

  const playlistInfo = {
    id: playlistData.id,
    name: playlistData.name,
    image: playlistData.images[0]?.url || ''
  };

  const results = [];
  // Reverse track order
  const items = playlistData.tracks.items || [];
  const reversed = [...items].reverse();
  for (const item of reversed) {
    const { name: title, artists, duration_ms } = item.track;
    const artist = artists.map(a => a.name).join(', ');
    const durationMin = Math.round(duration_ms / 1000 / 60);

    const q = encodeURIComponent(`${title} ${artist}`);
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${q}&key=${config.public.youtubeApiKey}`
    );
    const searchJson = await searchRes.json();
    const ids = (searchJson.items || []).map(i => i.id.videoId).filter(Boolean).join(',');

    let videoUrl = '';
    if (ids) {
      const detRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${config.public.youtubeApiKey}`
      );
      const detJson = await detRes.json();
      const match = (detJson.items || []).find(i => {
        const secs = parseISO8601Duration(i.contentDetails.duration);
        return Math.abs(secs - durationMin * 60) <= 10;
      });
      if (match?.id) videoUrl = `https://www.youtube.com/watch?v=${match.id}`;
    }

    const csvPath = join(process.cwd(), 'new-songs.csv');
    const safe = str => `"${(str || '').replace(/"/g, '""')}"`;
    const line = `${safe(title)},${safe(artist)},${safe(videoUrl)}\n`;
    await access(csvPath, constants.F_OK).catch(() =>
      writeFile(csvPath, '"Title","Artist","YouTube URL"\n')
    );
    await appendFile(csvPath, line).catch(() => {});

    results.push({ title, artist, video: videoUrl });
  }

  return { playlist: playlistInfo, tracks: results };
});