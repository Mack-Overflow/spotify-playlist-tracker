// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    public: {
      youtubeApiKey: process.env.YOUTUBE_DATA_API_KEY
    }
  },
  modules: ['@nuxtjs/tailwindcss'],
  build: {
    transpile: ['vanta', 'three']
  }
})