// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    public: {
      playlistId: process.env.PLAYLIST_ID,
      youtubeApiKey: process.env.YOUTUBE_DATA_API_KEY
    }
  },
  modules: ['@nuxtjs/tailwindcss'],
})
