import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Film, 
  Sparkles, 
  FileVideo, 
  Smartphone, 
  CheckCircle,
  Play,
  ArrowRight,
  Subtitles,
  Key,
  Tag as TagIcon,
  Zap,
  Check
} from 'lucide-react';
import { VideoItem } from '../types/youtube';
import { probeVideoFile, formatBytes, formatDuration } from '../utils/videoExtractor';
import { generateAutoAiMetadata } from '../utils/aiGenerator';

interface VideoUploadZoneProps {
  onVideoSelected: (newVideo: VideoItem, additionalVideos?: VideoItem[]) => void;
  hasCurrentVideo: boolean;
  onShowToast?: (msg: string) => void;
}

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  onVideoSelected,
  hasCurrentVideo,
  onShowToast,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [autoAiGen, setAutoAiGen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setProcessingStatus('Probing video dimensions & extracting keyframes...');

    try {
      const items: VideoItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
          continue;
        }

        const probe = await probeVideoFile(file);
        const videoUrl = URL.createObjectURL(file);
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const cleanTitle = baseName
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const defaultThumb = probe.frames.length > 0 ? probe.frames[0] : '';

        const item: VideoItem = {
          id: 'vid_' + Date.now() + '_' + i,
          file,
          fileName: file.name,
          fileSize: file.size,
          duration: probe.duration,
          width: probe.width,
          height: probe.height,
          aspectRatio: probe.aspectRatio,
          isShort: probe.isShort,
          videoUrl,
          thumbnailUrl: defaultThumb,
          extractedFrames: probe.frames,
          status: 'draft',
          uploadProgress: 0,
          bytesUploaded: 0,
          uploadSpeed: '--',
          eta: '--',
          uploadStage: 'idle',
          metadata: {
            title: cleanTitle.slice(0, 100),
            description: `Welcome to this video! Today we explore ${cleanTitle}.\n\n⏱️ TIMESTAMPS:\n00:00 - Introduction\n01:15 - Key Breakdown\n03:45 - Live Demo\n06:20 - Summary & Next Steps\n\n🔔 Don't forget to Like & Subscribe for more weekly uploads!\n#YouTube #${cleanTitle.replace(/\s+/g, '')}`,
            tags: [
              cleanTitle.toLowerCase(),
              'tutorial',
              'guide',
              'review',
              'trending',
              ...(probe.isShort ? ['shorts', 'youtubeshorts'] : []),
            ],
            keywords: [cleanTitle.toLowerCase(), 'tutorial', 'review', 'guide'],
            captions: '',
            categoryId: '28', // Science & Technology
            visibility: 'public',
            isPremiere: false,
            madeForKids: 'not_for_kids',
            ageRestricted: false,
            license: 'youtube',
            embeddable: true,
            notifySubscribers: true,
            language: 'en',
            recordingDate: new Date().toISOString().split('T')[0],
            location: '',
            shortsRemixing: 'all',
            comments: {
              visibility: 'hold_potentially_inappropriate',
              strictness: false,
              sortBy: 'top',
              showRatings: true,
              pinnedComment: '',
            },
          },
        };

        // If Auto AI is enabled, auto-generate captions, description, keywords & keytags
        if (autoAiGen && i === 0) {
          try {
            setProcessingStatus('✨ AI generating Captions, Description, Focus Keywords & Keytags...');
            const aiData = await generateAutoAiMetadata(item);
            if (aiData) {
              item.metadata.title = aiData.titles[0]?.title || item.metadata.title;
              item.metadata.description = aiData.description || item.metadata.description;
              item.metadata.tags = aiData.tags || item.metadata.tags;
              item.metadata.keywords = aiData.keywords || item.metadata.keywords;
              item.metadata.captions = aiData.captionsSrt || '';
              if (aiData.pinnedComment && item.metadata.comments) {
                item.metadata.comments.pinnedComment = aiData.pinnedComment;
              }
            }
          } catch (aiErr) {
            console.warn('Auto AI generation skipped:', aiErr);
          }
        }

        items.push(item);
      }

      if (items.length > 0) {
        onVideoSelected(items[0], items.slice(1));
        if (onShowToast) {
          onShowToast(
            autoAiGen
              ? '✨ Uploaded! AI auto-generated Captions, Description, Keywords & Keytags.'
              : `Uploaded ${items[0].fileName}!`
          );
        }
      }
    } catch (err) {
      console.error('Error processing video files:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Generate synthetic sample video directly in browser canvas for immediate test flight
  const loadSampleVideo = async (type: 'tech' | 'short' | 'gaming') => {
    setIsProcessing(true);
    setProcessingStatus('Probing sample video specs...');

    try {
      const isShort = type === 'short';
      const width = isShort ? 1080 : 1920;
      const height = isShort ? 1920 : 1080;
      const duration = isShort ? 45 : 185;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (type === 'tech') {
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#020617');
      } else if (type === 'short') {
        grad.addColorStop(0, '#4c0519');
        grad.addColorStop(0.5, '#881337');
        grad.addColorStop(1, '#1e1b4b');
      } else {
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#042f2e');
        grad.addColorStop(1, '#022c22');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, width - 120, height - 120);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const s = Math.min(width, height) * 0.05;
      ctx.moveTo(width / 2 - s, height / 2 - s * 1.3);
      ctx.lineTo(width / 2 + s * 1.5, height / 2);
      ctx.lineTo(width / 2 - s, height / 2 + s * 1.3);
      ctx.closePath();
      ctx.fill();

      const sampleTitle =
        type === 'tech'
          ? 'Next-Gen M4 Ultra Tech Breakdown (4K)'
          : type === 'short'
          ? '3 Secret YouTube Creator Hacks #Shorts'
          : 'Speedrunning Unreal Engine 5 Pro Tips';

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(Math.min(width, height) * 0.06)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(sampleTitle, width / 2, height * 0.28);

      const thumbUrl =
        type === 'tech'
          ? '/src/assets/images/yt_thumb_tech_ai_1790724690916.jpg'
          : canvas.toDataURL('image/jpeg', 0.9);
      const frames = [thumbUrl, thumbUrl, thumbUrl];

      const item: VideoItem = {
        id: 'sample_' + Date.now(),
        fileName: `${type === 'short' ? 'Viral_Shorts_Clip.mp4' : 'Studio_Master_Render.mp4'}`,
        fileSize: isShort ? 14.8 * 1024 * 1024 : 88.4 * 1024 * 1024,
        duration,
        width,
        height,
        aspectRatio: width / height,
        isShort,
        videoUrl: '',
        thumbnailUrl: thumbUrl,
        extractedFrames: frames,
        status: 'draft',
        uploadProgress: 0,
        bytesUploaded: 0,
        uploadSpeed: '--',
        eta: '--',
        uploadStage: 'idle',
        metadata: {
          title: sampleTitle,
          description: `🚀 In this video, we break down: ${sampleTitle}!\n\n📌 In-depth analysis, benchmark comparisons, and practical real-world workflow tips.\n\n⏱️ CHAPTERS:\n00:00 - Intro & First Look\n01:20 - Core Architecture Breakdown\n03:10 - Performance Benchmarks\n05:40 - Verdict & Recommendation\n\n🔔 Subscribe to stay ahead in creator tech!\n#YouTube #${type} #CreatorStudio`,
          tags: [
            type,
            'creator',
            'review',
            'benchmarks',
            'tutorial',
            'guide',
            ...(isShort ? ['shorts', 'youtubeshorts'] : ['4k', 'tech']),
          ],
          keywords: [type, 'benchmarks', 'review', 'guide', 'tutorial'],
          captions: `1\n00:00:01,000 --> 00:00:04,500\nWelcome to this comprehensive breakdown of ${sampleTitle}!\n\n2\n00:00:05,000 --> 00:00:08,800\nToday we test performance, real-world benchmarks, and key features.\n\n3\n00:00:09,000 --> 00:00:13,500\nMake sure to subscribe and drop a comment below with your thoughts!`,
          categoryId: type === 'gaming' ? '20' : '28',
          visibility: 'public',
          isPremiere: false,
          madeForKids: 'not_for_kids',
          ageRestricted: false,
          license: 'youtube',
          embeddable: true,
          notifySubscribers: true,
          language: 'en',
          recordingDate: new Date().toISOString().split('T')[0],
          location: 'San Francisco, CA',
          shortsRemixing: 'all',
          comments: {
            visibility: 'hold_potentially_inappropriate',
            strictness: false,
            sortBy: 'top',
            showRatings: true,
            pinnedComment: 'What is your favorite tip from this video? Let us know below! 👇',
          },
        },
      };

      // Trigger Auto-AI generation for sample video too if active!
      if (autoAiGen) {
        try {
          setProcessingStatus('✨ AI generating Captions, Description, Focus Keywords & Keytags...');
          const aiData = await generateAutoAiMetadata(item);
          if (aiData) {
            item.metadata.title = aiData.titles[0]?.title || item.metadata.title;
            item.metadata.description = aiData.description || item.metadata.description;
            item.metadata.tags = aiData.tags || item.metadata.tags;
            item.metadata.keywords = aiData.keywords || item.metadata.keywords;
            item.metadata.captions = aiData.captionsSrt || item.metadata.captions;
            if (aiData.pinnedComment && item.metadata.comments) {
              item.metadata.comments.pinnedComment = aiData.pinnedComment;
            }
          }
        } catch (e) {
          console.warn('AI sample generation fallback');
        }
      }

      onVideoSelected(item);
      if (onShowToast) {
        onShowToast('✨ Loaded preset with AI-generated Captions, Description & Keytags!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-AI Generator Switch Banner */}
      <div className="bg-gradient-to-r from-red-950/30 via-zinc-900/60 to-zinc-900/40 border border-red-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 fill-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Auto-Generate with Gemini AI on Upload</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Automatically creates timed captions (.SRT), SEO description with chapters, focus keywords & keytags
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer self-end sm:self-center shrink-0">
          <input
            type="checkbox"
            checked={autoAiGen}
            onChange={(e) => setAutoAiGen(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-red-600 focus:ring-red-500"
          />
          <span className="text-xs font-medium text-zinc-300">
            {autoAiGen ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Drag & Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 group overflow-hidden ${
          isDragging
            ? 'border-red-500 bg-red-500/10 scale-[1.01]'
            : 'border-zinc-700/80 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.mkv,.avi"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-red-500 group-hover:scale-110 group-hover:text-red-400 group-hover:border-red-500/40 shadow-xl transition-all mb-4">
            {isProcessing ? (
              <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
            {isProcessing ? processingStatus || 'Analyzing Video & Generating...' : 'Drag and drop video files to upload'}
          </h3>

          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            {isProcessing
              ? 'Extracting keyframes, generating timed captions and optimizing keywords...'
              : 'Supports MP4, WebM, MOV, MKV up to 4K resolution. Auto-generates captions, tags and descriptions.'}
          </p>

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-600/25 transition-all group-hover:shadow-red-600/40"
            >
              Select Files
            </button>
            <span className="text-xs text-zinc-500">or drop them here</span>
          </div>
        </div>
      </div>

      {/* Quick Sample Video Loaders */}
      <div className="bg-zinc-900/40 border border-zinc-800/70 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-medium text-zinc-300">Try an instant video preset with AI metadata:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadSampleVideo('tech')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span>4K Tech Review (16:9)</span>
          </button>

          <button
            onClick={() => loadSampleVideo('short')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-400" />
            <span>YouTube Short (9:16)</span>
          </button>

          <button
            onClick={() => loadSampleVideo('gaming')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gaming Masterclass</span>
          </button>
        </div>
      </div>
    </div>
  );
};
