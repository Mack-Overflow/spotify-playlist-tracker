import { writeFile, appendFile, access, constants } from 'fs/promises';
import { join } from 'path';

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

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();
  const title = String(query.title || '');
  const artist = String(query.artist || '');
  const durationMs = Number(query.durationMs || 0);
  const apiKey = config.public.youtubeApiKey;

  const searchQuery = `${title} ${artist}`;
  console.log(searchQuery);
  const durationMin = Math.round(Number(durationMs) / 1000 / 60);

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
      searchQuery
    )}&key=${apiKey}`
  );
  const searchResults = await res.json();

  const videoIds = (searchResults.items as YouTubeSearchItem[])
    .map((item) => item.id.videoId)
    .join(',');

  const detailsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
  );
  const detailsData = await detailsRes.json();

  function parseISO8601Duration(isoDuration: string) {
    const match = isoDuration.match(/PT(\d+M)?(\d+S)?/);
    const minutes = parseInt(match?.[1] || '0');
    const seconds = parseInt(match?.[2] || '0');
    return minutes * 60 + seconds;
  }

  const matchingVideo = (detailsData.items as YouTubeVideoDetail[]).find((item) => {
    const durationSec = parseISO8601Duration(item.contentDetails.duration);
    return Math.abs(durationSec - durationMin * 60) <= 10;
  });

  const videoUrl = matchingVideo ? `https://www.youtube.com/watch?v=${matchingVideo.id}` : null;

  return {
    video: videoUrl,
  };
});
