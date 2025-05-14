export default defineEventHandler(async () => {
    const config = useRuntimeConfig();
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    return await res.json();
  });