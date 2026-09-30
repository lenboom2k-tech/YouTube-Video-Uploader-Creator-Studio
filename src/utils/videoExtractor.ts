/**
 * Client-side video metadata probe and frame extractor
 */

export interface VideoProbeResult {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
  isShort: boolean;
  frames: string[];
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function probeVideoFile(file: File | Blob): Promise<VideoProbeResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 0;
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const aspectRatio = width / (height || 1);

        // YouTube Shorts: aspect ratio <= 1 (typically 9:16 = 0.5625) and duration <= 180 seconds (3 mins)
        const isShort = aspectRatio < 1.05 && duration <= 180;

        // Extract keyframes at 15%, 50%, 85%
        const sampleTimestamps = [
          Math.min(Math.max(duration * 0.15, 0.5), duration),
          Math.min(Math.max(duration * 0.5, 1.0), duration),
          Math.min(Math.max(duration * 0.85, 2.0), duration),
        ];

        const frames: string[] = [];
        for (const t of sampleTimestamps) {
          const frame = await extractFrameAtTime(video, t);
          if (frame) frames.push(frame);
        }

        cleanup();
        resolve({
          duration,
          width,
          height,
          aspectRatio,
          isShort,
          frames: frames.length > 0 ? frames : [generateDefaultFallbackThumbnail(width, height)],
        });
      } catch (err) {
        cleanup();
        resolve({
          duration: video.duration || 60,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          aspectRatio: (video.videoWidth || 16) / (video.videoHeight || 9),
          isShort: false,
          frames: [generateDefaultFallbackThumbnail(1920, 1080)],
        });
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video file. Please check format.'));
    };
  });
}

export function extractFrameAtTime(video: HTMLVideoElement, time: number): Promise<string> {
  return new Promise((resolve) => {
    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      } catch (e) {
        console.warn('Canvas frame capture error:', e);
        resolve('');
      }
    };

    video.addEventListener('seeked', handleSeeked);
    video.currentTime = Math.min(Math.max(time, 0), video.duration || time);
  });
}

export function captureCurrentVideoElementFrame(videoElement: HTMLVideoElement): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (err) {
    console.error('Failed to capture frame from video element:', err);
    return '';
  }
}

function generateDefaultFallbackThumbnail(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width || 1280;
  canvas.height = height || 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#1e1b4b');
  grad.addColorStop(0.5, '#312e81');
  grad.addColorStop(1, '#09090b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Play icon placeholder
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 60, canvas.height / 2 - 40, 120, 80, 20);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 15, canvas.height / 2 - 20);
  ctx.lineTo(canvas.width / 2 + 25, canvas.height / 2);
  ctx.lineTo(canvas.width / 2 - 15, canvas.height / 2 + 20);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.8);
}
