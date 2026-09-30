import React, { useState } from 'react';
import { 
  Sparkles, 
  Tag as TagIcon, 
  Globe, 
  Lock, 
  EyeOff, 
  Calendar, 
  ShieldAlert, 
  Check, 
  X, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  UploadCloud, 
  Download,
  AlertTriangle,
  Flame,
  Radio,
  Subtitles,
  Key,
  RefreshCw,
  Copy,
  Zap,
  Scissors,
  Columns,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { 
  VideoItem, 
  VideoMetadata, 
  YOUTUBE_CATEGORIES, 
  CommentSettings, 
  SmartScheduleResult 
} from '../types/youtube';
import { ThumbnailStudio } from './ThumbnailStudio';
import { VideoTrimmer } from './VideoTrimmer';
import { SideBySideCompare } from './SideBySideCompare';
import { formatBytes, formatDuration } from '../utils/videoExtractor';
import { generateAutoAiMetadata, generateSmartSchedule } from '../utils/aiGenerator';

interface MetadataEditorProps {
  videoItem: VideoItem;
  queue?: VideoItem[];
  history?: VideoItem[];
  channelName?: string;
  onUpdateMetadata: (updated: Partial<VideoMetadata>) => void;
  onUpdateThumbnail: (thumbUrl: string) => void;
  onUpdateVideoProperties?: (updates: Partial<VideoItem>) => void;
  onUpdateQueueVideoMetadata?: (id: string, updated: Partial<VideoMetadata>) => void;
  onSelectVideoForEditing?: (video: VideoItem) => void;
  onOpenAiModal: () => void;
  onStartUpload: () => void;
  onAddToQueue: () => void;
  isUploading: boolean;
  onShowToast?: (msg: string) => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  videoItem,
  queue = [],
  history = [],
  channelName = 'Creator Studio',
  onUpdateMetadata,
  onUpdateThumbnail,
  onUpdateVideoProperties,
  onUpdateQueueVideoMetadata,
  onSelectVideoForEditing,
  onOpenAiModal,
  onStartUpload,
  onAddToQueue,
  isUploading,
  onShowToast,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [smartScheduleResult, setSmartScheduleResult] = useState<SmartScheduleResult | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [copiedCaptions, setCopiedCaptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'captions'>('details');

  const meta = videoItem.metadata;
  const isShort = videoItem.isShort;

  // Title character length calculation & score
  const titleLen = meta.title.length;
  const titleScore = Math.min(
    100,
    (titleLen >= 30 && titleLen <= 70 ? 50 : 25) +
      (/[A-Z]/.test(meta.title) ? 20 : 0) +
      (/[0-9]/.test(meta.title) ? 15 : 0) +
      (/(How|Why|Secret|Top|Best|Review|vs|Ultimate|Guide|New|2026)/i.test(meta.title) ? 15 : 0)
  );

  // Description character length
  const descLen = meta.description.length;

  // Tags total characters
  const totalTagsChars = meta.tags.join(',').length;

  const handleAddTag = (newTag: string) => {
    const clean = newTag.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    if (meta.tags.includes(clean)) return;
    if (totalTagsChars + clean.length + 1 > 500) {
      alert('YouTube tags limit (500 characters) reached.');
      return;
    }
    onUpdateMetadata({ tags: [...meta.tags, clean] });
    setTagInput('');
  };

  const handleRemoveTag = (index: number) => {
    const updated = meta.tags.filter((_, i) => i !== index);
    onUpdateMetadata({ tags: updated });
  };

  const handleAddKeyword = (newKw: string) => {
    const clean = newKw.trim().toLowerCase();
    if (!clean) return;
    const current = meta.keywords || [];
    if (current.includes(clean)) return;
    onUpdateMetadata({ keywords: [...current, clean] });
    setKeywordInput('');
  };

  const handleRemoveKeyword = (index: number) => {
    const current = meta.keywords || [];
    onUpdateMetadata({ keywords: current.filter((_, i) => i !== index) });
  };

  const insertIntoDescription = (textToAppend: string) => {
    onUpdateMetadata({
      description: meta.description ? `${meta.description}\n\n${textToAppend}` : textToAppend,
    });
  };

  // 1-Click Auto-Generate All with AI
  const handleAutoGenerateAll = async () => {
    setIsAutoGenerating(true);
    try {
      const res = await generateAutoAiMetadata(videoItem);
      onUpdateMetadata({
        title: res.titles[0]?.title || meta.title,
        description: res.description || meta.description,
        tags: res.tags || meta.tags,
        keywords: res.keywords || meta.keywords || [],
        captions: res.captionsSrt || meta.captions || '',
      });
      if (onShowToast) {
        onShowToast('✨ AI auto-generated Captions, Description, Focus Keywords & Keytags!');
      }
    } catch (err: any) {
      console.error('Auto AI error:', err);
      if (onShowToast) {
        onShowToast(`AI generation: ${err.message}`);
      }
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleApplyTrim = (
    newDuration: number,
    trimStart: number,
    trimEnd: number,
    newFile?: File
  ) => {
    if (onUpdateVideoProperties) {
      onUpdateVideoProperties({
        duration: newDuration,
        trimStart,
        trimEnd,
        file: newFile || videoItem.file,
        fileSize: newFile ? newFile.size : videoItem.fileSize,
      });
    }

    setShowTrimmer(false);
    if (onShowToast) {
      onShowToast(`✂️ Trim applied! Video is now ${formatDuration(newDuration)} (cut from ${formatDuration(trimStart)} to ${formatDuration(trimEnd)})`);
    }
  };

  const handleSmartSchedule = async () => {
    setIsLoadingSchedule(true);
    try {
      const res = await generateSmartSchedule(videoItem, history, channelName);
      setSmartScheduleResult(res);
      // Automatically switch to scheduled if not yet scheduled and set primary datetime
      onUpdateMetadata({
        visibility: 'scheduled',
        scheduledTime: res.primarySlot.datetime,
      });
      if (onShowToast) {
        onShowToast(`✨ Gemini suggested: ${res.primarySlot.dayOfWeek} at ${res.primarySlot.timeFormatted}! (${res.primarySlot.velocityBoost})`);
      }
    } catch (err: any) {
      console.error('Smart schedule error:', err);
      if (onShowToast) {
        onShowToast(`Smart schedule: ${err.message || 'Failed to analyze'}`);
      }
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const downloadFile = (content: string, extension: 'srt' | 'vtt') => {
    const baseName = videoItem.fileName.replace(/\.[^/.]+$/, '');
    let finalContent = content;
    if (extension === 'vtt' && !content.startsWith('WEBVTT')) {
      finalContent = 'WEBVTT\n\n' + content.replace(/,/g, '.');
    }
    const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_captions.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCaptions = () => {
    if (!meta.captions) return;
    navigator.clipboard.writeText(meta.captions);
    setCopiedCaptions(true);
    setTimeout(() => setCopiedCaptions(false), 2000);
  };

  const updateCommentSettings = (updated: Partial<CommentSettings>) => {
    const current: CommentSettings = meta.comments || {
      visibility: 'hold_potentially_inappropriate',
      strictness: false,
      sortBy: 'top',
      showRatings: true,
      pinnedComment: '',
    };
    onUpdateMetadata({
      comments: {
        ...current,
        ...updated,
      },
    });
  };

  const exportMetadataJson = () => {
    const payload = {
      snippet: {
        title: meta.title,
        description: meta.description,
        tags: meta.tags,
        keywords: meta.keywords || [],
        categoryId: meta.categoryId,
        defaultLanguage: meta.language,
      },
      status: {
        privacyStatus: meta.visibility,
        publishAt: meta.scheduledTime,
        selfDeclaredMadeForKids: meta.madeForKids === 'made_for_kids',
        embeddable: meta.embeddable,
        license: meta.license,
      },
      comments: meta.comments || {
        visibility: 'hold_potentially_inappropriate',
        strictness: false,
        sortBy: 'top',
        showRatings: true,
        pinnedComment: '',
      },
      captions: meta.captions || '',
      videoFile: {
        fileName: videoItem.fileName,
        fileSize: videoItem.fileSize,
        duration: videoItem.duration,
        resolution: `${videoItem.width}x${videoItem.height}`,
        isShort: videoItem.isShort,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoItem.fileName.replace(/\.[^/.]+$/, '')}_youtube_metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Video File Specs & AI Automation Banner */}
      <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-red-400 shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                {videoItem.fileName}
              </h2>
              {isShort ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  ⚡ YouTube Short
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  📹 Standard Video
                </span>
              )}
              {meta.captions && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Subtitles className="w-3 h-3" /> Captions Ready
                </span>
              )}
              {(videoItem.trimStart !== undefined || videoItem.trimEnd !== undefined) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-amber-400" /> Trimmed: {formatDuration(videoItem.trimStart || 0)} - {formatDuration(videoItem.trimEnd || videoItem.duration)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
              <span>{videoItem.width}x{videoItem.height}</span>
              <span>•</span>
              <span>{formatDuration(videoItem.duration)}</span>
              <span>•</span>
              <span>{formatBytes(videoItem.fileSize)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: 1-Click Auto Gen All, Trim Video */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowTrimmer(!showTrimmer)}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showTrimmer
                ? 'bg-red-600/30 text-red-300 border-red-500/50 shadow-sm ring-1 ring-red-500/30'
                : (videoItem.trimStart !== undefined || videoItem.trimEnd !== undefined)
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-red-400" />
            <span>{showTrimmer ? 'Close Trimmer' : 'Trim Video'}</span>
          </button>

          {queue && queue.length > 1 && (
            <button
              type="button"
              onClick={() => setIsComparing(!isComparing)}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isComparing
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-blue-400" />
              <span>{isComparing ? 'Close Compare' : 'Compare Videos'}</span>
              <span className="text-[10px] bg-zinc-700 px-1.5 py-0.2 rounded-full font-mono text-zinc-300">
                {queue.length}
              </span>
            </button>
          )}

          <button
            onClick={handleAutoGenerateAll}
            disabled={isAutoGenerating}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isAutoGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Everything...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>1-Click Auto-Gen All</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenAiModal}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <span>Custom Prompt</span>
          </button>

          <button
            onClick={exportMetadataJson}
            title="Download YouTube Metadata JSON"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Trimmer Drawer / Tool */}
      {showTrimmer && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <VideoTrimmer
            videoItem={videoItem}
            onApplyTrim={handleApplyTrim}
            onClose={() => setShowTrimmer(false)}
          />
        </div>
      )}

      {/* Side-by-Side Metadata Comparison View */}
      {isComparing && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <SideBySideCompare
            currentVideo={videoItem}
            queue={queue}
            onUpdateVideo={(id, updated) => {
              if (id === videoItem.id) {
                onUpdateMetadata(updated);
              } else if (onUpdateQueueVideoMetadata) {
                onUpdateQueueVideoMetadata(id, updated);
              }
            }}
            onClose={() => setIsComparing(false)}
            onSelectVideoForEditing={(vid) => {
              onSelectVideoForEditing?.(vid);
              setIsComparing(false);
            }}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* Main Metadata Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column (Details, Description, Tags, Captions) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Title Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Video Title</span>
                <span className="text-red-400">*</span>
              </label>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  titleScore >= 75
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : titleScore >= 50
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  SEO Score: {titleScore}/100
                </span>
                <span className={`text-xs font-mono ${titleLen > 100 ? 'text-red-400' : 'text-zinc-500'}`}>
                  {titleLen}/100
                </span>
              </div>
            </div>

            <input
              type="text"
              maxLength={100}
              value={meta.title}
              onChange={(e) => onUpdateMetadata({ title: e.target.value })}
              placeholder="Enter an engaging, click-worthy video title..."
              className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium"
            />

            {isShort && !meta.title.includes('#Shorts') && (
              <div className="flex items-center justify-between text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                <span>Tip: Adding #Shorts helps YouTube identify vertical short-form content.</span>
                <button
                  onClick={() => onUpdateMetadata({ title: `${meta.title} #Shorts`.slice(0, 100) })}
                  className="font-semibold underline ml-2"
                >
                  Add #Shorts
                </button>
              </div>
            )}
          </div>

          {/* Description Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Description
              </label>
              <span className={`text-xs font-mono ${descLen > 5000 ? 'text-red-400' : 'text-zinc-500'}`}>
                {descLen}/5,000
              </span>
            </div>

            {/* Quick Helper Insert Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-500">Quick Insert:</span>
              <button
                type="button"
                onClick={() => insertIntoDescription('⏱️ TIMESTAMPS:\n00:00 - Introduction\n01:15 - Key Breakdown\n03:45 - Hands-on Demo\n07:10 - Final Verdict')}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-md border border-zinc-700"
              >
                + Chapters
              </button>
              <button
                type="button"
                onClick={() => insertIntoDescription('🔗 CONNECT WITH US:\nTwitter/X: https://x.com/creator\nDiscord: https://discord.gg/creator\nWebsite: https://example.com')}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-md border border-zinc-700"
              >
                + Social Links
              </button>
              <button
                type="button"
                onClick={() => insertIntoDescription('⚠️ DISCLAIMER: This video is for educational purposes only. All opinions expressed are our own.')}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-md border border-zinc-700"
              >
                + Disclaimer
              </button>
              <button
                type="button"
                onClick={() => insertIntoDescription('#YouTube #Tutorial #TechReview #Creator #Guide')}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-md border border-zinc-700"
              >
                + Hashtags
              </button>
            </div>

            <textarea
              rows={7}
              maxLength={5000}
              value={meta.description}
              onChange={(e) => onUpdateMetadata({ description: e.target.value })}
              placeholder="Tell viewers what your video is about. Include keywords, chapters, and links..."
              className="w-full bg-black/60 border border-zinc-700 rounded-xl p-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 leading-relaxed font-mono"
            />
          </div>

          {/* Captions & Subtitles Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Subtitles className="w-4 h-4 text-purple-400" />
                <span>AI Captions & Subtitles (.SRT)</span>
              </label>

              <div className="flex items-center gap-2">
                {meta.captions && (
                  <>
                    <button
                      type="button"
                      onClick={copyCaptions}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700"
                    >
                      {copiedCaptions ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCaptions ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile(meta.captions!, 'srt')}
                      className="text-xs text-purple-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600/20 border border-purple-500/30"
                    >
                      <Download className="w-3 h-3" />
                      <span>.SRT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile(meta.captions!, 'vtt')}
                      className="text-xs text-purple-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600/20 border border-purple-500/30"
                    >
                      <Download className="w-3 h-3" />
                      <span>.VTT</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {meta.captions ? (
              <textarea
                rows={6}
                value={meta.captions}
                onChange={(e) => onUpdateMetadata({ captions: e.target.value })}
                placeholder="Timed captions in SubRip (.srt) format..."
                className="w-full bg-black/60 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono leading-relaxed"
              />
            ) : (
              <div className="p-4 rounded-xl bg-black/40 border border-dashed border-zinc-800 text-center space-y-2">
                <p className="text-xs text-zinc-400">
                  No captions generated yet. Generate accurate spoken subtitles with timed timecodes.
                </p>
                <button
                  type="button"
                  onClick={handleAutoGenerateAll}
                  disabled={isAutoGenerating}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-medium rounded-lg border border-purple-500/30 transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Captions with Gemini</span>
                </button>
              </div>
            )}
          </div>

          {/* Focus Keywords Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>Search Intent Focus Keywords</span>
              </label>
              <span className="text-[11px] text-zinc-500">
                {(meta.keywords || []).length} Focus Phrases
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword(keywordInput);
                  }
                }}
                placeholder="Add high-intent search phrase (e.g. how to build 3d game)..."
                className="flex-1 bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleAddKeyword(keywordInput)}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white rounded-lg border border-zinc-700"
              >
                Add Keyword
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black/40 rounded-lg border border-zinc-800">
              {(meta.keywords && meta.keywords.length > 0) ? (
                meta.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/20 font-medium"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(idx)}
                      className="text-emerald-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-500 italic p-1">
                  Click "1-Click Auto-Gen All" above to auto-generate focus keywords
                </span>
              )}
            </div>
          </div>

          {/* Keytags & Search Tags Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Search Keytags</span>
              </label>
              <span className={`text-xs font-mono ${totalTagsChars > 500 ? 'text-red-400' : 'text-zinc-500'}`}>
                {totalTagsChars}/500 chars
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Type tag and press Enter or comma..."
                className="flex-1 bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white rounded-lg border border-zinc-700"
              >
                Add Keytag
              </button>
            </div>

            {/* Tag Badges */}
            <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-black/40 rounded-lg border border-zinc-800">
              {meta.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 text-xs border border-zinc-700 font-mono group"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-zinc-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {meta.tags.length === 0 && (
                <span className="text-xs text-zinc-500 italic p-1">No tags added yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Form Column (Thumbnail, Visibility, Category, Audience) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Thumbnail Studio */}
          <ThumbnailStudio
            videoItem={videoItem}
            onUpdateThumbnail={onUpdateThumbnail}
            onShowToast={onShowToast}
          />

          {/* Visibility & Scheduling Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Visibility & Publishing
              </h3>

              <button
                type="button"
                onClick={handleSmartSchedule}
                disabled={isLoadingSchedule}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-red-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                title="Leverage Gemini to analyze channel historical performance and suggest the best publishing time"
              >
                {isLoadingSchedule ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                    <span>Timing AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>Smart Schedule</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'public', label: 'Public', icon: Globe, desc: 'Everyone can see' },
                { key: 'unlisted', label: 'Unlisted', icon: EyeOff, desc: 'Anyone with link' },
                { key: 'private', label: 'Private', icon: Lock, desc: 'Only you' },
                { key: 'scheduled', label: 'Schedule', icon: Calendar, desc: 'Set date & time' },
              ].map((v) => {
                const Icon = v.icon;
                const isSelected = meta.visibility === v.key;
                return (
                  <div
                    key={v.key}
                    onClick={() => onUpdateMetadata({ visibility: v.key as any })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-red-500/10 border-red-500/50 shadow-sm ring-1 ring-red-500/30'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-red-400' : 'text-zinc-400'}`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                        {v.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500">{v.desc}</p>
                  </div>
                );
              })}
            </div>

            {meta.visibility === 'scheduled' && (
              <div className="p-3.5 bg-black/40 border border-zinc-800 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-400" />
                    <span>Publish At (Date & Time)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleSmartSchedule}
                    disabled={isLoadingSchedule}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isLoadingSchedule ? 'Calculating...' : 'Recalculate Timing'}</span>
                  </button>
                </div>

                <input
                  type="datetime-local"
                  value={meta.scheduledTime || ''}
                  onChange={(e) => onUpdateMetadata({ scheduledTime: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                />

                {/* Smart Schedule Gemini Recommendations Panel */}
                {smartScheduleResult && (
                  <div className="pt-2 border-t border-zinc-800 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Gemini Peak Timing Insights</span>
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {smartScheduleResult.primarySlot.velocityBoost}
                      </span>
                    </div>

                    {/* Primary Recommended Slot */}
                    <div
                      onClick={() => onUpdateMetadata({ scheduledTime: smartScheduleResult.primarySlot.datetime })}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        meta.scheduledTime === smartScheduleResult.primarySlot.datetime
                          ? 'bg-amber-500/15 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{smartScheduleResult.primarySlot.dayOfWeek}, {smartScheduleResult.primarySlot.timeFormatted}</span>
                          <span className="text-[10px] text-amber-400 font-normal">
                            ({smartScheduleResult.primarySlot.slotLabel})
                          </span>
                        </span>
                        {meta.scheduledTime === smartScheduleResult.primarySlot.datetime ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 hover:text-white underline">
                            Select
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        {smartScheduleResult.primarySlot.rationale}
                      </p>
                    </div>

                    {/* Alternative Slots */}
                    {smartScheduleResult.alternativeSlots?.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-zinc-400 block font-medium">
                          Alternative High-Velocity Slots:
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {smartScheduleResult.alternativeSlots.map((slot, idx) => {
                            const isAltSelected = meta.scheduledTime === slot.datetime;
                            return (
                              <div
                                key={idx}
                                onClick={() => onUpdateMetadata({ scheduledTime: slot.datetime })}
                                className={`p-2 rounded-lg border cursor-pointer text-[11px] transition-colors flex items-center justify-between ${
                                  isAltSelected
                                    ? 'bg-amber-500/15 border-amber-500/40 text-white'
                                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                }`}
                              >
                                <div>
                                  <span className="font-semibold text-white">{slot.dayOfWeek} at {slot.timeFormatted}</span>
                                  <span className="text-[10px] text-zinc-400 ml-1.5">• {slot.slotLabel}</span>
                                </div>
                                <span className="text-[10px] text-amber-300 font-mono font-medium">
                                  {slot.velocityBoost}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Audience Habit Metrics */}
                    <div className="text-[10px] text-zinc-500 bg-black/50 p-2 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                      <span>Audience Peak: {smartScheduleResult.audienceInsights.peakHours}</span>
                      <span>Includes 2h 4K buffer</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Premiere Toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-zinc-800">
              <input
                type="checkbox"
                checked={meta.isPremiere}
                onChange={(e) => onUpdateMetadata({ isPremiere: e.target.checked })}
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs text-zinc-300 font-medium">Set as Instant Premiere</span>
            </label>
          </div>

          {/* Category & Audience Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                YouTube Category
              </label>
              <select
                value={meta.categoryId}
                onChange={(e) => onUpdateMetadata({ categoryId: e.target.value })}
                className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {YOUTUBE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audience COPPA Compliance */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center justify-between">
                <span>Audience (COPPA)</span>
                <span className="text-[10px] text-zinc-500">Required</span>
              </label>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="madeForKids"
                    value="not_for_kids"
                    checked={meta.madeForKids === 'not_for_kids'}
                    onChange={() => onUpdateMetadata({ madeForKids: 'not_for_kids' })}
                    className="accent-red-500"
                  />
                  <span>No, it's not made for kids</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="madeForKids"
                    value="made_for_kids"
                    checked={meta.madeForKids === 'made_for_kids'}
                    onChange={() => onUpdateMetadata({ madeForKids: 'made_for_kids' })}
                    className="accent-red-500"
                  />
                  <span>Yes, it's made for kids</span>
                </label>
              </div>
            </div>
          </div>

          {/* Comments & Rating Settings Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Comments & Rating Settings
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Community</span>
            </div>

            {/* Comment Visibility Moderation Radio Options */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Comment Moderation Visibility
              </label>

              <div className="space-y-1.5">
                {[
                  {
                    key: 'allow_all',
                    title: 'Allow all comments',
                    desc: 'Comments appear immediately without filtering.',
                  },
                  {
                    key: 'hold_potentially_inappropriate',
                    title: 'Hold potentially inappropriate comments for review',
                    desc: 'Automated filter flags potential spam, scams, and abuse.',
                    recommended: true,
                  },
                  {
                    key: 'hold_all',
                    title: 'Hold all comments for review',
                    desc: 'Every comment requires manual approval before becoming public.',
                  },
                  {
                    key: 'disabled',
                    title: 'Disable comments',
                    desc: 'Turn off comments completely for this video.',
                  },
                ].map((opt) => {
                  const isChecked =
                    (meta.comments?.visibility || 'hold_potentially_inappropriate') === opt.key;
                  return (
                    <label
                      key={opt.key}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-sm'
                          : 'bg-black/40 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="commentVisibility"
                        value={opt.key}
                        checked={isChecked}
                        onChange={() => updateCommentSettings({ visibility: opt.key as any })}
                        className="accent-emerald-500 mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{opt.title}</span>
                          {opt.recommended && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Recommended
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Increase Strictness Sub-option */}
              {(meta.comments?.visibility || 'hold_potentially_inappropriate') ===
                'hold_potentially_inappropriate' && (
                <div className="ml-5 p-2.5 bg-black/40 rounded-lg border border-zinc-800/80 animate-in fade-in">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.comments?.strictness ?? false}
                      onChange={(e) => updateCommentSettings({ strictness: e.target.checked })}
                      className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-[11px]">
                      Increase strictness (Catch more potentially inappropriate comments)
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Sort Order & Rating Preference */}
            {meta.comments?.visibility !== 'disabled' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Sort Comments By</label>
                  <select
                    value={meta.comments?.sortBy || 'top'}
                    onChange={(e) => updateCommentSettings({ sortBy: e.target.value as any })}
                    className="w-full bg-black/60 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="top">Top comments</option>
                    <option value="newest">Newest first</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-black/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={meta.comments?.showRatings ?? true}
                      onChange={(e) => updateCommentSettings({ showRatings: e.target.checked })}
                      className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="min-w-0">
                      <span className="text-xs text-zinc-200 font-medium block">Show likes count</span>
                      <span className="text-[10px] text-zinc-500 block">Rating preference</span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-black/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={meta.comments?.showRatings ?? true}
                    onChange={(e) => updateCommentSettings({ showRatings: e.target.checked })}
                    className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="min-w-0">
                    <span className="text-xs text-zinc-200 font-medium block">
                      Show how many viewers like this video
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      Rating count remains visible even when comments are disabled
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Pinned Engagement Comment Prompt */}
            {meta.comments?.visibility !== 'disabled' && (
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-300">
                    Pinned Community Comment (Optional)
                  </label>
                  <span className="text-[10px] text-zinc-500">Pinned to top</span>
                </div>
                <input
                  type="text"
                  value={meta.comments?.pinnedComment || ''}
                  onChange={(e) => updateCommentSettings({ pinnedComment: e.target.value })}
                  placeholder="e.g. Which topic should we cover in the next video? Let us know below! 👇"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Advanced Settings Accordion */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:bg-zinc-800/40 transition-colors"
            >
              <span>Advanced Rights, License & Language</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 pt-0 space-y-3 border-t border-zinc-800/60 text-xs text-zinc-300">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Video Language</label>
                    <select
                      value={meta.language}
                      onChange={(e) => onUpdateMetadata({ language: e.target.value })}
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg p-1.5 text-xs text-white"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="pt">Portuguese</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">License</label>
                    <select
                      value={meta.license}
                      onChange={(e) => onUpdateMetadata({ license: e.target.value as any })}
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg p-1.5 text-xs text-white"
                    >
                      <option value="youtube">Standard YouTube License</option>
                      <option value="creativeCommon">Creative Commons - Attribution</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.embeddable}
                      onChange={(e) => onUpdateMetadata({ embeddable: e.target.checked })}
                      className="accent-red-500"
                    />
                    <span className="text-[11px]">Allow embedding on 3rd-party websites</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meta.notifySubscribers}
                      onChange={(e) => onUpdateMetadata({ notifySubscribers: e.target.checked })}
                      className="accent-red-500"
                    />
                    <span className="text-[11px]">Publish to subscriptions feed and notify subscribers</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onAddToQueue}
              className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Add to Batch Queue</span>
            </button>

            <button
              onClick={onStartUpload}
              disabled={isUploading || !meta.title.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload to YouTube</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
