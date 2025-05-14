<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Spotify Playlist Tracker</h1>
    <div v-if="updated">
      <div v-for="track in tracks" :key="track.title" class="mb-4 border-b pb-2">
        <p><strong>{{ track.title }}</strong> by {{ track.artist }} ({{ formatDuration(track.durationMs) }})</p>
        <button @click="searchYoutube(track)" class="mt-1 text-blue-500 underline text-sm">Find on YouTube</button>
        <div v-if="youtubeLinks[track.title] !== 'No Match Found'">
          <a :href="youtubeLinks[track.title]" target="_blank" class="text-green-600 text-sm">Watch Video</a>
        </div>
      </div>
    </div>
    <div v-else>No new updates.</div>
  </div>
</template>

<script setup>
const { data } = await useFetch('/api/spotify/playlist');
const updated = data.value?.updated;
const tracks = data.value?.tracks || [];
const youtubeLinks = reactive({});

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function searchYoutube(track) {
  const { title, artist, durationMs } = track;
  const res = await fetch(`/api/youtube/search?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&durationMs=${durationMs}`);
  const result = await res.json();
  if (result.video) {
    youtubeLinks[track.title] = result.video;
  } else {
    youtubeLinks[track.title] = 'No match found';
  }
}
</script>