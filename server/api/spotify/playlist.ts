import { writeFile, appendFile, access, constants } from 'fs/promises';
import { join } from 'path';

let lastSnapshotId = '';

interface SpotifyTrackItem {
  track: {
    name: string;
    duration_ms: number;
    artists: {
      name: string;
    }[];
  };
}

interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
}

interface YouTubeVideoDetail {
  id: string;
  contentDetails: {
    duration: string;
  };
}

function parseISO8601Duration(isoDuration: string) {
  const match = isoDuration.match(/PT(\d+M)?(\d+S)?/);
  const minutes = parseInt(match?.[1] || '0');
  const seconds = parseInt(match?.[2] || '0');
  return minutes * 60 + seconds;
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const playlistRes = await fetch(
    `https://api.spotify.com/v1/playlists/${config.public.playlistId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const playlistData = await playlistRes.json();

  if (playlistData.snapshot_id === lastSnapshotId) {
    return { updated: false, tracks: [] };
  }

  lastSnapshotId = playlistData.snapshot_id;

  const tracks = (playlistData.tracks.items as SpotifyTrackItem[]).map((item) => ({
    title: item.track.name,
    artist: item.track.artists.map((a) => a.name).join(', '),
    durationMs: item.track.duration_ms,
  }));

  const results = [];
  for (const track of tracks) {
    const { title, artist, durationMs } = track;
    const searchQuery = `${title} ${artist}`;
    const durationMin = Math.round(durationMs / 1000 / 60);

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(searchQuery)}&key=${config.public.youtubeApiKey}`
    );
    const searchResults = await searchRes.json();

    const videoIds = (searchResults.items as YouTubeSearchItem[])
      .map((item) => item.id.videoId)
      .join(',');

    const detailsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${config.public.youtubeApiKey}`
    );
    const detailsData = await detailsRes.json();

    const matchingVideo = (detailsData.items as YouTubeVideoDetail[]).find((item) => {
      const durationSec = parseISO8601Duration(item.contentDetails.duration);
      return Math.abs(durationSec - durationMin * 60) <= 10;
    });

    const videoUrl = matchingVideo ? `https://www.youtube.com/watch?v=${matchingVideo.id}` : null;

    if (videoUrl && title && artist) {
      const filePath = join(process.cwd(), 'new-songs.csv');
      const line = `"${title.replace(/"/g, '""')}","${artist.replace(/"/g, '""')}","${videoUrl}"\n`;

      try {
        await access(filePath, constants.F_OK).catch(() =>
          writeFile(filePath, `"Title","Artist","YouTube URL"\n`)
        );
        await appendFile(filePath, line);
      } catch (err) {
        console.error('Failed to write to CSV:', err);
      }
    }

    results.push({ title, artist, video: videoUrl });
  }

  return {
    updated: true,
    tracks: results,
  };
});