<template>
  <div ref="vantaRef" class="relative min-h-screen overflow-hidden">
    <div class="absolute inset-0 z-0" />
    <div class="relative z-10 p-4">
      <h1 class="text-3xl font-bold mb-6 text-white">Spotify Playlist Tracker</h1>
      <div class="mb-6 flex gap-2">
        <input
          v-model="newPlaylistId"
          placeholder="Enter Spotify Playlist ID"
          class="border p-2 flex-1 rounded"
        />
        <button @click="addPlaylist" class="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
      </div>

      <div v-if="playlistIds.length === 0" class="text-gray-200 italic">No playlists added.</div>

      <div v-for="pid in playlistIds" :key="pid" class="mb-6 bg-white bg-opacity-80 rounded shadow">
        <details>
          <summary class="flex items-center gap-3 p-3 cursor-pointer">
            <img
              v-if="playlistInfo[pid]?.image"
              :src="playlistInfo[pid].image"
              alt="playlist image"
              class="w-10 h-10 object-cover rounded"
            />
            <span class="font-semibold text-lg text-gray-800">{{ playlistInfo[pid]?.name || pid }}</span>
            <svg
              v-if="loading[pid]"
              class="w-6 h-6 animate-spin text-blue-600 ml-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </summary>
          <div class="p-4">
            <div v-if="playlists[pid]?.length">
              <div v-for="track in playlists[pid]" :key="track.title" class="border-b py-2">
                <p class="text-gray-900"><strong>{{ track.title }}</strong> by {{ track.artist }}</p>
                <div>
                  <a
                    v-if="track.video"
                    :href="track.video"
                    target="_blank"
                    class="text-blue-600 text-sm underline"
                  >Watch Video</a>
                  <span v-else class="text-red-500 text-sm">No video found</span>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-700">No tracks.</div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useCookie, useFetch } from '#app';

const newPlaylistId = ref('');
const playlistIds = useCookie('playlists', { default: () => [] });
const playlistInfo = reactive({});
const playlists = reactive({});
const loading = reactive({});

const vantaRef = ref(null);
let vantaEffect = null;

function savePlaylists() {
  playlistIds.value = [...playlistIds.value];
}

async function fetchPlaylist(pid) {
  loading[pid] = true;
  const { data } = await useFetch('/api/spotify/playlist', { query: { playlistId: pid } });
  loading[pid] = false;
  if (data.value) {
    playlistInfo[pid] = data.value.playlist;
    playlists[pid] = data.value.tracks;
  }
}

function addPlaylist() {
  const pid = newPlaylistId.value.trim();
  if (pid && !playlistIds.value.includes(pid)) {
    playlistIds.value.push(pid);
    savePlaylists();
    fetchPlaylist(pid);
  }
  newPlaylistId.value = '';
}

onMounted(async () => {
  // Initialize Vanta Waves background
  const VANTA = (await import('vanta/dist/vanta.waves.min')).default;
  const THREE = (await import('three')).default;
  vantaEffect = VANTA({
    el: vantaRef.value,
    THREE,
    color: 0x1e90ff,
    shininess: 50,
    waveHeight: 20,
    waveSpeed: 1.0,
    zoom: 1
  });

  // Load existing playlists
  playlistIds.value.forEach(pid => fetchPlaylist(pid));
});

onBeforeUnmount(() => {
  if (vantaEffect) vantaEffect.destroy();
});
</script>

<style>
.vanta-container {
  width: 100%;
  height: 100%;
}
</style>