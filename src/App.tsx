import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VideoUploadZone } from './components/VideoUploadZone';
import { MetadataEditor } from './components/MetadataEditor';
import { ThumbnailStudio } from './components/ThumbnailStudio';
import { LiveMockup } from './components/LiveMockup';
import { BatchQueue } from './components/BatchQueue';
import { HistoryList } from './components/HistoryList';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { ConnectModal } from './components/ConnectModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { UploadProgressModal } from './components/UploadProgressModal';
import { VideoItem, VideoMetadata } from './types/youtube';
import { 
  loadSettings, 
  saveSettings, 
  loadUploadHistory, 
  saveUploadHistory, 
  executeVideoUpload, 
  AppSettings 
} from './utils/youtubeApi';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'queue' | 'preview' | 'history' | 'performance'>('editor');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [history, setHistory] = useState<VideoItem[]>(() => loadUploadHistory());
  const [batchQueue, setBatchQueue] = useState<VideoItem[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [activeUploadingVideo, setActiveUploadingVideo] = useState<VideoItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const abortRef = useRef<{ abort: () => void }>({ abort: () => {} });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleVideoSelected = (newVideo: VideoItem, additionalVideos?: VideoItem[]) => {
    setCurrentVideo(newVideo);
    if (additionalVideos && additionalVideos.length > 0) {
      setBatchQueue((prev) => [...prev, ...additionalVideos]);
      showToast(`Loaded ${newVideo.fileName} and queued ${additionalVideos.length} additional video(s)!`);
    } else {
      showToast(`Loaded ${newVideo.fileName}! Ready for metadata.`);
    }
    setActiveTab('editor');
  };

  const handleUpdateMetadata = (updated: Partial<VideoMetadata>) => {
    if (!currentVideo) return;
    const updatedVideo: VideoItem = {
      ...currentVideo,
      metadata: {
        ...currentVideo.metadata,
        ...updated,
      },
    };
    setCurrentVideo(updatedVideo);

    // Also update in queue if present
    setBatchQueue((prev) =>
      prev.map((item) => (item.id === updatedVideo.id ? updatedVideo : item))
    );
  };

  const handleUpdateThumbnail = (thumbUrl: string) => {
    if (!currentVideo) return;
    const updatedVideo: VideoItem = {
      ...currentVideo,
      thumbnailUrl: thumbUrl,
    };
    setCurrentVideo(updatedVideo);

    setBatchQueue((prev) =>
      prev.map((item) => (item.id === updatedVideo.id ? updatedVideo : item))
    );
    showToast('Thumbnail updated!');
  };

  const handleUpdateVideoProperties = (updates: Partial<VideoItem>) => {
    if (!currentVideo) return;
    const updatedVideo: VideoItem = {
      ...currentVideo,
      ...updates,
    };
    setCurrentVideo(updatedVideo);

    setBatchQueue((prev) =>
      prev.map((item) => (item.id === updatedVideo.id ? updatedVideo : item))
    );
  };

  const handleAddToQueue = () => {
    if (!currentVideo) return;
    if (batchQueue.some((item) => item.id === currentVideo.id)) {
      showToast('Video is already in the batch queue.');
      return;
    }
    setBatchQueue((prev) => [...prev, { ...currentVideo, status: 'queued' }]);
    showToast(`Added "${currentVideo.metadata.title}" to batch queue!`);
  };

  const handleStartUpload = async (videoToUpload?: VideoItem) => {
    const targetVideo = videoToUpload || currentVideo;
    if (!targetVideo) return;

    setActiveUploadingVideo(targetVideo);
    setIsProgressModalOpen(true);
    setIsUploading(true);

    const updateVideoState = (patch: Partial<VideoItem>) => {
      setActiveUploadingVideo((prev) => (prev ? { ...prev, ...patch } : null));
      setCurrentVideo((prev) => (prev && prev.id === targetVideo.id ? { ...prev, ...patch } : prev));
      setBatchQueue((prev) =>
        prev.map((item) => (item.id === targetVideo.id ? { ...item, ...patch } : item))
      );
    };

    updateVideoState({
      status: 'uploading',
      uploadProgress: 0,
      bytesUploaded: 0,
      uploadStage: 'initiating',
      errorMessage: undefined,
    });

    try {
      await executeVideoUpload(
        targetVideo,
        settings,
        {
          onProgress: (progress, bytes, speed, eta) => {
            updateVideoState({
              uploadProgress: progress,
              bytesUploaded: bytes,
              uploadSpeed: speed,
              eta,
              uploadStage: 'uploading_chunks',
            });
          },
          onStageChange: (stage) => {
            updateVideoState({ uploadStage: stage });
          },
          onSuccess: (videoId, publishedUrl) => {
            const completedVideo: VideoItem = {
              ...targetVideo,
              status: 'published',
              uploadProgress: 100,
              uploadStage: 'completed',
              youtubeVideoId: videoId,
              publishedUrl,
              publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setActiveUploadingVideo(completedVideo);
            setCurrentVideo(completedVideo);

            setBatchQueue((prev) =>
              prev.map((item) => (item.id === completedVideo.id ? completedVideo : item))
            );

            setHistory((prev) => {
              const updatedHistory = [completedVideo, ...prev.filter((h) => h.id !== completedVideo.id)];
              saveUploadHistory(updatedHistory);
              return updatedHistory;
            });

            setIsUploading(false);
            showToast('Video published successfully!');
          },
          onError: (errMsg) => {
            updateVideoState({
              status: 'failed',
              uploadStage: 'error',
              errorMessage: errMsg,
            });
            setIsUploading(false);
          },
        },
        abortRef.current
      );
    } catch (err: any) {
      updateVideoState({
        status: 'failed',
        uploadStage: 'error',
        errorMessage: err.message || 'Upload error',
      });
      setIsUploading(false);
    }
  };

  const handleBulkUpdateTags = (
    videoIds: string[],
    tagsToApply: string[],
    mode: 'append' | 'replace' | 'remove'
  ) => {
    setBatchQueue((prev) =>
      prev.map((item) => {
        if (!videoIds.includes(item.id)) return item;

        let newTags = [...item.metadata.tags];
        if (mode === 'append') {
          const cleanTags = tagsToApply.filter((t) => !newTags.includes(t));
          newTags = [...newTags, ...cleanTags];
        } else if (mode === 'replace') {
          newTags = [...tagsToApply];
        } else if (mode === 'remove') {
          newTags = newTags.filter((t) => !tagsToApply.includes(t));
        }

        // Enforce YouTube 500 characters limit
        let totalLength = newTags.join(',').length;
        while (totalLength > 500 && newTags.length > 0) {
          newTags.pop();
          totalLength = newTags.join(',').length;
        }

        const updated = {
          ...item,
          metadata: {
            ...item.metadata,
            tags: newTags,
          },
        };

        if (currentVideo && currentVideo.id === item.id) {
          setCurrentVideo(updated);
        }

        return updated;
      })
    );

    showToast(`Updated tags across ${videoIds.length} video(s)!`);
  };

  const handleUploadAll = async () => {
    const pendingVideos = batchQueue.filter((v) => v.status !== 'published');
    if (pendingVideos.length === 0) {
      showToast('All queued videos are already published.');
      return;
    }

    for (const vid of pendingVideos) {
      setCurrentVideo(vid);
      await handleStartUpload(vid);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveUploadHistory([]);
    showToast('Upload history cleared.');
  };

  const handleSeedSampleHistory = () => {
    const sampleHistory: VideoItem[] = [
      {
        id: 'seed_tech_4k',
        fileName: 'M4_Mac_Studio_Master.mp4',
        fileSize: 88.4 * 1024 * 1024,
        duration: 384,
        width: 3840,
        height: 2160,
        aspectRatio: 16 / 9,
        isShort: false,
        videoUrl: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        extractedFrames: [],
        status: 'published',
        uploadProgress: 100,
        bytesUploaded: 88.4 * 1024 * 1024,
        uploadSpeed: '12.4 MB/s',
        eta: 'Done',
        uploadStage: 'completed',
        youtubeVideoId: 'M4StudioReview',
        publishedUrl: 'https://youtu.be/M4StudioReview',
        publishedAt: '2 days ago',
        metadata: {
          title: 'Apple M4 Mac Studio Tech Breakdown: Is It Worth Upgrading? (4K)',
          description: 'In-depth architecture analysis, rendering benchmarks, and final buyer recommendation for creative pros.',
          tags: ['m4', 'apple', 'tech', 'benchmarks', '4k', 'review'],
          categoryId: '28',
          visibility: 'public',
          isPremiere: false,
          madeForKids: 'not_for_kids',
          ageRestricted: false,
          license: 'youtube',
          embeddable: true,
          notifySubscribers: true,
          language: 'en',
          recordingDate: '2026-09-25',
          location: 'Cupertino, CA',
          shortsRemixing: 'all',
        },
      },
      {
        id: 'seed_shorts_growth',
        fileName: '3_Viral_Shorts_Hacks.mp4',
        fileSize: 14.2 * 1024 * 1024,
        duration: 48,
        width: 1080,
        height: 1920,
        aspectRatio: 9 / 16,
        isShort: true,
        videoUrl: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        extractedFrames: [],
        status: 'published',
        uploadProgress: 100,
        bytesUploaded: 14.2 * 1024 * 1024,
        uploadSpeed: '10.2 MB/s',
        eta: 'Done',
        uploadStage: 'completed',
        youtubeVideoId: 'ShortsHacks26',
        publishedUrl: 'https://youtu.be/ShortsHacks26',
        publishedAt: '4 days ago',
        metadata: {
          title: '3 Secret YouTube Creator Growth Hacks in 40 Seconds #Shorts',
          description: 'Boost your retention and CTR with these simple algorithm strategies.',
          tags: ['shorts', 'youtubeshorts', 'growth', 'creator', 'tips'],
          categoryId: '27',
          visibility: 'public',
          isPremiere: false,
          madeForKids: 'not_for_kids',
          ageRestricted: false,
          license: 'youtube',
          embeddable: true,
          notifySubscribers: true,
          language: 'en',
          recordingDate: '2026-09-22',
          location: '',
          shortsRemixing: 'all',
        },
      },
      {
        id: 'seed_ue5_mastery',
        fileName: 'Unreal_Engine_5_Tutorial.mp4',
        fileSize: 112.5 * 1024 * 1024,
        duration: 620,
        width: 1920,
        height: 1080,
        aspectRatio: 16 / 9,
        isShort: false,
        videoUrl: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
        extractedFrames: [],
        status: 'published',
        uploadProgress: 100,
        bytesUploaded: 112.5 * 1024 * 1024,
        uploadSpeed: '14.1 MB/s',
        eta: 'Done',
        uploadStage: 'completed',
        youtubeVideoId: 'UE5ProMaster',
        publishedUrl: 'https://youtu.be/UE5ProMaster',
        publishedAt: '6 days ago',
        metadata: {
          title: 'Speedrunning Unreal Engine 5: Photorealism Lighting Masterclass',
          description: 'Lumen, Nanite, and atmospheric lighting setup from blank level to AAA cinematic render.',
          tags: ['unrealengine', 'gamedev', 'tutorial', 'lighting', '3d'],
          categoryId: '20',
          visibility: 'public',
          isPremiere: false,
          madeForKids: 'not_for_kids',
          ageRestricted: false,
          license: 'youtube',
          embeddable: true,
          notifySubscribers: true,
          language: 'en',
          recordingDate: '2026-09-18',
          location: '',
          shortsRemixing: 'all',
        },
      },
    ];

    setHistory(sampleHistory);
    saveUploadHistory(sampleHistory);
    showToast('Loaded demo published videos with analytics!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        channel={settings.defaultChannel}
        mode={settings.mode}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        queuedCount={batchQueue.filter((v) => v.status !== 'published').length}
        isUploading={isUploading}
        onNewUpload={() => {
          setCurrentVideo(null);
          setActiveTab('editor');
        }}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Studio & Editor */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {!currentVideo ? (
              <div className="space-y-6">
                {/* Hero Introduction */}
                <div className="bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-zinc-900/40 border border-red-900/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>YouTube Uploader Studio with Gemini AI</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Publish High-Converting YouTube Videos & Shorts
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Upload video files, extract keyframe thumbnails, generate viral titles and SEO descriptions with Gemini, and simulate or publish live via YouTube Resumable Upload protocol.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl border border-zinc-700 transition-colors"
                    >
                      {settings.mode === 'direct_api' ? 'Live API Connected' : 'Settings & Staging'}
                    </button>
                  </div>
                </div>

                {/* Upload Area */}
                <VideoUploadZone
                  onVideoSelected={handleVideoSelected}
                  hasCurrentVideo={false}
                  onShowToast={showToast}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <MetadataEditor
                  videoItem={currentVideo}
                  queue={
                    batchQueue.some((v) => v.id === currentVideo.id)
                      ? batchQueue
                      : [currentVideo, ...batchQueue]
                  }
                  history={history}
                  channelName={settings.defaultChannel.title}
                  onUpdateMetadata={handleUpdateMetadata}
                  onUpdateThumbnail={handleUpdateThumbnail}
                  onUpdateVideoProperties={handleUpdateVideoProperties}
                  onUpdateQueueVideoMetadata={(id, updatedMeta) => {
                    setBatchQueue((prev) =>
                      prev.map((item) =>
                        item.id === id
                          ? { ...item, metadata: { ...item.metadata, ...updatedMeta } }
                          : item
                      )
                    );
                    if (currentVideo.id === id) {
                      handleUpdateMetadata(updatedMeta);
                    }
                  }}
                  onSelectVideoForEditing={(v) => setCurrentVideo(v)}
                  onOpenAiModal={() => setIsAiModalOpen(true)}
                  onStartUpload={() => handleStartUpload(currentVideo)}
                  onAddToQueue={handleAddToQueue}
                  isUploading={isUploading}
                  onShowToast={showToast}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Batch Queue */}
        {activeTab === 'queue' && (
          <BatchQueue
            queue={batchQueue}
            currentVideoId={currentVideo?.id}
            onSelectVideo={(item) => {
              setCurrentVideo(item);
              setActiveTab('editor');
            }}
            onRemoveFromQueue={(id) => {
              setBatchQueue((prev) => prev.filter((item) => item.id !== id));
              showToast('Removed from queue');
            }}
            onUploadAll={handleUploadAll}
            onNewUpload={() => {
              setCurrentVideo(null);
              setActiveTab('editor');
            }}
            onBulkUpdateTags={handleBulkUpdateTags}
            isUploading={isUploading}
          />
        )}

        {/* Tab 3: Live YouTube Mockup */}
        {activeTab === 'preview' && (
          <LiveMockup
            videoItem={currentVideo}
            channel={settings.defaultChannel}
          />
        )}

        {/* Tab 4: Published History */}
        {activeTab === 'history' && (
          <HistoryList
            history={history}
            onClearHistory={handleClearHistory}
            onNewUpload={() => {
              setCurrentVideo(null);
              setActiveTab('editor');
            }}
          />
        )}

        {/* Tab 5: Performance Analytics */}
        {activeTab === 'performance' && (
          <PerformanceDashboard
            history={history}
            channel={settings.defaultChannel}
            onNewUpload={() => {
              setCurrentVideo(null);
              setActiveTab('editor');
            }}
            onSeedSampleHistory={handleSeedSampleHistory}
          />
        )}
      </main>

      {/* Connect & Mode Settings Modal */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast(`Mode updated to ${newSettings.mode === 'direct_api' ? 'Live YouTube API' : 'Staging Mode'}`);
        }}
      />

      {/* AI Assistant Modal */}
      {currentVideo && (
        <AiAssistantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          videoItem={currentVideo}
          onApplyTitles={(title) => {
            handleUpdateMetadata({ title });
            showToast('Applied title!');
          }}
          onApplyDescription={(description) => {
            handleUpdateMetadata({ description });
            showToast('Applied SEO description & timestamps!');
          }}
          onApplyTags={(tags) => {
            handleUpdateMetadata({ tags });
            showToast('Applied keytags!');
          }}
          onApplyKeywords={(keywords) => {
            handleUpdateMetadata({ keywords });
            showToast('Applied focus keywords!');
          }}
          onApplyCaptions={(captions) => {
            handleUpdateMetadata({ captions });
            showToast('Applied timed captions (.SRT)!');
          }}
          onApplyAll={(aiRes) => {
            handleUpdateMetadata({
              title: aiRes.titles[0]?.title || currentVideo.metadata.title,
              description: aiRes.description || currentVideo.metadata.description,
              tags: aiRes.tags || currentVideo.metadata.tags,
              keywords: aiRes.keywords || currentVideo.metadata.keywords || [],
              captions: aiRes.captionsSrt || currentVideo.metadata.captions || '',
            });
            showToast('✨ Applied complete AI package (Title, Desc, Keytags, Keywords & Captions)!');
          }}
          onApplyThumbnailText={(text) => {
            showToast(`Suggested thumbnail text: "${text}"`);
          }}
        />
      )}

      {/* Upload Progress Modal */}
      {activeUploadingVideo && (
        <UploadProgressModal
          isOpen={isProgressModalOpen}
          onClose={() => setIsProgressModalOpen(false)}
          videoItem={activeUploadingVideo}
          onCancelUpload={() => {
            abortRef.current.abort();
            setIsUploading(false);
          }}
          onNewUpload={() => {
            setCurrentVideo(null);
            setActiveTab('editor');
          }}
        />
      )}
    </div>
  );
}
