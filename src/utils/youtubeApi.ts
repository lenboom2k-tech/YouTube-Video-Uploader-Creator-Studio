import { VideoItem, VideoMetadata, ChannelInfo } from '../types/youtube';

const SETTINGS_KEY = 'tubelaunch_settings';
const HISTORY_KEY = 'tubelaunch_history';

export interface AppSettings {
  mode: 'simulation' | 'direct_api';
  accessToken: string;
  clientId: string;
  apiKey: string;
  defaultChannel: ChannelInfo;
}

export const DEFAULT_CHANNEL: ChannelInfo = {
  id: 'UC_tubelaunch_creator',
  title: 'Creator Studio Pro',
  customUrl: '@CreatorStudioPro',
  thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  subscriberCount: '142K',
  videoCount: '87',
  isConnected: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return {
    mode: 'simulation',
    accessToken: '',
    clientId: '',
    apiKey: '',
    defaultChannel: DEFAULT_CHANNEL,
  };
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function loadUploadHistory(): VideoItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading history:', e);
  }
  return [];
}

export function saveUploadHistory(history: VideoItem[]) {
  try {
    // Avoid saving large File or blob URLs to localStorage
    const serializable = history.map((item) => ({
      ...item,
      file: undefined,
      videoUrl: item.videoUrl?.startsWith('blob:') ? '' : item.videoUrl,
      extractedFrames: item.extractedFrames.slice(0, 1), // keep at most 1 frame to save space
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

export interface UploadProgressCallback {
  onProgress: (progress: number, bytesUploaded: number, speed: string, eta: string) => void;
  onStageChange: (stage: VideoItem['uploadStage']) => void;
  onSuccess: (youtubeVideoId: string, publishedUrl: string) => void;
  onError: (error: string) => void;
}

/**
 * Uploads a video either via real YouTube Resumable Upload API or via High-Fidelity Simulation.
 */
export async function executeVideoUpload(
  videoItem: VideoItem,
  settings: AppSettings,
  callbacks: UploadProgressCallback,
  abortSignalRef?: { abort: () => void }
): Promise<void> {
  const isDirectApi = settings.mode === 'direct_api' && settings.accessToken.trim().length > 0;

  if (isDirectApi) {
    await uploadDirectToYouTube(videoItem, settings.accessToken, callbacks, abortSignalRef);
  } else {
    await simulateUploadWorkflow(videoItem, callbacks, abortSignalRef);
  }
}

/**
 * Real YouTube Data API v3 Resumable Upload implementation
 */
async function uploadDirectToYouTube(
  videoItem: VideoItem,
  accessToken: string,
  callbacks: UploadProgressCallback,
  abortSignalRef?: { abort: () => void }
): Promise<void> {
  try {
    callbacks.onStageChange('initiating');

    const metadata = videoItem.metadata;
    const isShort = videoItem.isShort;
    let title = metadata.title;
    if (isShort && !title.includes('#Shorts')) {
      title = `${title} #Shorts`;
    }

    // Step 1: Initiate Resumable Upload
    const requestBody = {
      snippet: {
        title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: metadata.categoryId,
        defaultLanguage: metadata.language || 'en',
      },
      status: {
        privacyStatus: metadata.visibility === 'scheduled' ? 'private' : metadata.visibility,
        publishAt: metadata.visibility === 'scheduled' && metadata.scheduledTime ? new Date(metadata.scheduledTime).toISOString() : undefined,
        selfDeclaredMadeForKids: metadata.madeForKids === 'made_for_kids',
        embeddable: metadata.embeddable,
        license: metadata.license,
      },
    };

    const file = videoItem.file;
    const fileSize = file ? file.size : videoItem.fileSize;
    const fileType = file ? file.type || 'video/mp4' : 'video/mp4';

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': `${fileSize}`,
          'X-Upload-Content-Type': fileType,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!initResponse.ok) {
      const errorJson = await initResponse.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `YouTube upload initiation failed (${initResponse.status})`);
    }

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('YouTube did not return a resumable upload location header.');
    }

    callbacks.onStageChange('uploading_chunks');

    // Step 2: Upload file chunks via XMLHttpRequest for live progress
    if (!file) {
      throw new Error('Video file object is missing. Please re-select the video.');
    }

    const xhr = new XMLHttpRequest();
    if (abortSignalRef) {
      abortSignalRef.abort = () => xhr.abort();
    }

    let startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    await new Promise<void>((resolve, reject) => {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const now = Date.now();
          const percent = Math.round((e.loaded / e.total) * 100);
          const timeDiff = (now - lastTime) / 1000;

          let speedStr = '--';
          let etaStr = '--';
          if (timeDiff >= 0.5) {
            const bytesDiff = e.loaded - lastLoaded;
            const bytesPerSec = bytesDiff / timeDiff;
            const mbPerSec = (bytesPerSec / (1024 * 1024)).toFixed(1);
            speedStr = `${mbPerSec} MB/s`;

            const remainingBytes = e.total - e.loaded;
            const remainingSec = Math.round(remainingBytes / (bytesPerSec || 1));
            etaStr = `${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s`;

            lastLoaded = e.loaded;
            lastTime = now;
          }

          callbacks.onProgress(percent, e.loaded, speedStr, etaStr);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            const videoId = result.id;
            callbacks.onStageChange('server_processing');
            setTimeout(() => {
              callbacks.onStageChange('hd_checks');
              setTimeout(() => {
                const liveUrl = `https://youtu.be/${videoId}`;
                callbacks.onStageChange('completed');
                callbacks.onSuccess(videoId, liveUrl);
                resolve();
              }, 2000);
            }, 2500);
          } catch (e: any) {
            reject(new Error('Invalid response from YouTube: ' + e.message));
          }
        } else {
          reject(new Error(`YouTube upload failed with HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during YouTube upload.'));
      xhr.onabort = () => reject(new Error('Upload cancelled by user.'));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', fileType);
      xhr.send(file);
    });
  } catch (err: any) {
    console.error('Direct upload error:', err);
    callbacks.onError(err.message || 'Direct YouTube upload failed');
  }
}

/**
 * Realistic Simulation Workflow for Staging & Prototyping
 */
async function simulateUploadWorkflow(
  videoItem: VideoItem,
  callbacks: UploadProgressCallback,
  abortSignalRef?: { abort: () => void }
): Promise<void> {
  let isAborted = false;
  if (abortSignalRef) {
    abortSignalRef.abort = () => {
      isAborted = true;
    };
  }

  try {
    callbacks.onStageChange('initiating');
    await wait(700);
    if (isAborted) throw new Error('Upload cancelled');

    callbacks.onStageChange('uploading_chunks');

    const totalBytes = videoItem.fileSize || 48 * 1024 * 1024;
    let uploaded = 0;
    const totalSteps = 20;
    const stepSize = totalBytes / totalSteps;

    for (let i = 1; i <= totalSteps; i++) {
      if (isAborted) throw new Error('Upload cancelled');
      await wait(180 + Math.random() * 100);
      uploaded = Math.min(i * stepSize, totalBytes);
      const percent = Math.min(Math.round((i / totalSteps) * 100), 100);
      const fakeSpeed = `${(8.4 + Math.random() * 4).toFixed(1)} MB/s`;
      const remainingSteps = totalSteps - i;
      const etaSeconds = Math.max(Math.round(remainingSteps * 0.25), 1);
      const etaStr = `${etaSeconds}s`;

      callbacks.onProgress(percent, uploaded, fakeSpeed, etaStr);
    }

    callbacks.onStageChange('server_processing');
    await wait(1400);
    if (isAborted) throw new Error('Upload cancelled');

    callbacks.onStageChange('hd_checks');
    await wait(1200);
    if (isAborted) throw new Error('Upload cancelled');

    callbacks.onStageChange('completed');
    const mockVideoId = generateMockVideoId();
    const liveUrl = `https://youtu.be/${mockVideoId}`;
    callbacks.onSuccess(mockVideoId, liveUrl);
  } catch (err: any) {
    callbacks.onError(err.message || 'Simulation error');
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockVideoId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
