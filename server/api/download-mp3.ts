// ~/server/api/download-mp3.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const videoUrl = query.url as string;

  if (!videoUrl || !videoUrl.includes('youtube.com')) {
    return { error: 'Invalid or missing YouTube URL.' };
  }

  const filename = `audio-${Date.now()}.mp3`;
  const outputPath = join(tmpdir(), filename);

  try {
    const cmd = `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${videoUrl}"`;
    await execAsync(cmd);

    const fileBuffer = await Bun.file(outputPath).arrayBuffer();

    setHeader(event, 'Content-Type', 'audio/mpeg');
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
    return new Uint8Array(fileBuffer);
  } catch (err: any) {
    return { error: err.message || 'Failed to convert video.' };
  }
});
