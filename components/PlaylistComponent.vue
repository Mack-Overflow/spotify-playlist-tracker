<template>
    <div ref="vantaRef" class="relative min-h-screen overflow-hidden">
    <div class="absolute inset-0 z-0" />
    <div class="relative z-10 p-4">
      <div class="my-12 flex gap-2">
        <input
          v-model="newPlaylistId"
          placeholder="Enter Spotify Playlist ID"
          class="border p-2 flex-1 rounded"
        />
        <button @click="addPlaylist" class="px-4 py-2 text-gray-800 rounded bg-gray-200">Add</button>
      </div>

      <div v-if="playlistIds.length === 0" class="text-gray-200 italic mb-6">No playlists added.</div>

      <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        <div
          v-for="pid in playlistIds"
          :key="pid"
          class="bg-white bg-opacity-80 rounded shadow overflow-hidden max-h-96 overflow-y-auto"
        >
          <details>
            <summary class="flex items-center gap-3 p-3 cursor-pointer">
              <img
                v-if="playlistInfo[pid]?.image"
                :src="playlistInfo[pid].image"
                alt="playlist image"
                class="w-10 h-10 object-cover rounded"
              />
              <span class="font-semibold text-lg text-gray-800">
                {{ playlistInfo[pid]?.name || pid }}
              </span>
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
                    <a
                      v-else
                      :href="`https://www.youtube.com/results?search_query=${encodeURIComponent(track.title + ' ' + track.artist)}`"
                      target="_blank"
                      class="text-blue-600 text-sm underline"
                    >Search Video</a>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-700">No tracks.</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
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
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        `playlist-${pid}`,
        JSON.stringify({ playlist: data.value.playlist, tracks: data.value.tracks })
      );
    }
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
  playlistIds.value.forEach(pid => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`playlist-${pid}`);
      if (cached) {
        const { playlist, tracks } = JSON.parse(cached);
        playlistInfo[pid] = playlist;
        playlists[pid] = tracks;
      }
    }
    fetchPlaylist(pid);
  });
});
</script>