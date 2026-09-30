import React, { useState } from 'react';
import { 
  Columns, 
  ArrowLeftRight, 
  Check, 
  Copy, 
  ArrowRight, 
  ArrowLeft, 
  Tag as TagIcon, 
  FileText, 
  Sliders, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Layers,
  Film
} from 'lucide-react';
import { VideoItem, VideoMetadata, YOUTUBE_CATEGORIES } from '../types/youtube';
import { formatDuration, formatBytes } from '../utils/videoExtractor';

interface SideBySideCompareProps {
  currentVideo: VideoItem;
  queue: VideoItem[];
  onUpdateVideo: (id: string, updatedMetadata: Partial<VideoMetadata>) => void;
  onClose: () => void;
  onSelectVideoForEditing: (video: VideoItem) => void;
  onShowToast?: (msg: string) => void;
}

export const SideBySideCompare: React.FC<SideBySideCompareProps> = ({
  currentVideo,
  queue,
  onUpdateVideo,
  onClose,
  onSelectVideoForEditing,
  onShowToast,
}) => {
  // Candidate videos for comparison: all queued videos except currentVideo
  const candidateVideos = queue.filter((v) => v.id !== currentVideo.id);

  const [compareVideoId, setCompareVideoId] = useState<string>(
    candidateVideos.length > 0 ? candidateVideos[0].id : ''
  );

  const compareVideo = queue.find((v) => v.id === compareVideoId) || candidateVideos[0];

  const metaA = currentVideo.metadata;
  const metaB = compareVideo?.metadata;

  // Compute shared and unique tags
  const tagsA = metaA.tags || [];
  const tagsB = metaB?.tags || [];

  const sharedTags = tagsA.filter((t) => tagsB.includes(t));
  const uniqueTagsA = tagsA.filter((t) => !tagsB.includes(t));
  const uniqueTagsB = tagsB.filter((t) => !tagsA.includes(t));

  // Category name lookup
  const getCategoryName = (id: string) => {
    return YOUTUBE_CATEGORIES.find((c) => c.id === id)?.name || id;
  };

  // Sync actions
  const syncTitleAtoB = () => {
    if (!compareVideo) return;
    onUpdateVideo(compareVideo.id, { title: metaA.title });
    onShowToast?.(`Copied title to "${compareVideo.fileName}"!`);
  };

  const syncTitleBtoA = () => {
    if (!compareVideo) return;
    onUpdateVideo(currentVideo.id, { title: metaB.title });
    onShowToast?.(`Updated current video title!`);
  };

  const syncDescriptionAtoB = () => {
    if (!compareVideo) return;
    onUpdateVideo(compareVideo.id, { description: metaA.description });
    onShowToast?.(`Copied description to "${compareVideo.fileName}"!`);
  };

  const syncDescriptionBtoA = () => {
    if (!compareVideo) return;
    onUpdateVideo(currentVideo.id, { description: metaB.description });
    onShowToast?.(`Updated current video description!`);
  };

  const syncAllTagsAtoB = () => {
    if (!compareVideo) return;
    const merged = Array.from(new Set([...tagsB, ...tagsA]));
    onUpdateVideo(compareVideo.id, { tags: merged });
    onShowToast?.(`Merged all tags into "${compareVideo.fileName}"!`);
  };

  const syncAllTagsBtoA = () => {
    if (!compareVideo) return;
    const merged = Array.from(new Set([...tagsA, ...tagsB]));
    onUpdateVideo(currentVideo.id, { tags: merged });
    onShowToast?.(`Merged all tags into current video!`);
  };

  const syncCategoryAtoB = () => {
    if (!compareVideo) return;
    onUpdateVideo(compareVideo.id, { categoryId: metaA.categoryId });
    onShowToast?.(`Category synced!`);
  };

  const syncCategoryBtoA = () => {
    if (!compareVideo) return;
    onUpdateVideo(currentVideo.id, { categoryId: metaB.categoryId });
    onShowToast?.(`Category synced!`);
  };

  if (!compareVideo) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
        <Columns className="w-12 h-12 text-zinc-500 mx-auto" />
        <h3 className="text-base font-semibold text-white">Need At Least 2 Videos in Queue to Compare</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          You currently have 1 video in the workspace. Add or queue another video from the editor or batch queue to compare metadata side-by-side.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl border border-zinc-700"
        >
          Return to Standard Editor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Comparison Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Columns className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>Metadata Consistency & Comparison View</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Compare titles, descriptions, keytags, and category consistency across queued episodes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Comparison Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Compare With:</span>
            <select
              value={compareVideoId}
              onChange={(e) => setCompareVideoId(e.target.value)}
              className="bg-black/60 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-xs truncate"
            >
              {candidateVideos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.metadata.title || v.fileName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close Comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Video Cards Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Video: Active Current Video */}
        <div className="bg-zinc-900/60 border border-blue-500/40 rounded-2xl p-4 space-y-3 relative ring-1 ring-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Video A (Active Studio Video)</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">ID: {currentVideo.id.slice(0, 12)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative border border-zinc-800">
              <img src={currentVideo.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white">
                {formatDuration(currentVideo.duration)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate">{currentVideo.metadata.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{currentVideo.fileName}</p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                <span>{currentVideo.width}x{currentVideo.height}</span>
                <span>•</span>
                <span>{formatBytes(currentVideo.fileSize)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Video: Compare Video */}
        <div className="bg-zinc-900/60 border border-purple-500/40 rounded-2xl p-4 space-y-3 relative ring-1 ring-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Video B (Queued Target)</span>
            </span>
            <button
              onClick={() => onSelectVideoForEditing(compareVideo)}
              className="text-[11px] text-purple-300 hover:text-white underline font-medium"
            >
              Switch to Edit This Video
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative border border-zinc-800">
              <img src={compareVideo.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white">
                {formatDuration(compareVideo.duration)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate">{compareVideo.metadata.title}</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{compareVideo.fileName}</p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                <span>{compareVideo.width}x{compareVideo.height}</span>
                <span>•</span>
                <span>{formatBytes(compareVideo.fileSize)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. TITLE COMPARISON SECTION */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <span>Video Titles</span>
            {metaA.title === metaB.title ? (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded-full font-bold">
                Identical
              </span>
            ) : (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.2 rounded-full font-bold">
                Different
              </span>
            )}
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={syncTitleAtoB}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
              title="Copy Title from Video A to Video B"
            >
              <span>Copy A → B</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={syncTitleBtoA}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
              title="Copy Title from Video B to Video A"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Copy B → A</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold text-blue-400">Video A Title</span>
              <span className="font-mono">{metaA.title.length}/100</span>
            </div>
            <p className="text-xs font-medium text-white select-all">{metaA.title}</p>
          </div>

          <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold text-purple-400">Video B Title</span>
              <span className="font-mono">{metaB.title.length}/100</span>
            </div>
            <p className="text-xs font-medium text-white select-all">{metaB.title}</p>
          </div>
        </div>
      </div>

      {/* 2. TAGS & KEYWORDS COMPARISON SECTION */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <TagIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Tags & Keywords Comparison</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Identify shared channel tags vs. video-specific tags
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={syncAllTagsAtoB}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
              title="Merge all Video A tags into Video B"
            >
              <span>Merge A → B</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={syncAllTagsBtoA}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
              title="Merge all Video B tags into Video A"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Merge B → A</span>
            </button>
          </div>
        </div>

        {/* Shared Tags Pill Display */}
        <div className="bg-black/40 p-3.5 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Shared Common Tags ({sharedTags.length})</span>
            </span>
            <span className="text-[11px] text-zinc-500">Present in both videos</span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[32px]">
            {sharedTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/20 font-mono"
              >
                #{tag}
              </span>
            ))}
            {sharedTags.length === 0 && (
              <span className="text-xs text-zinc-500 italic">No shared tags between these two videos</span>
            )}
          </div>
        </div>

        {/* Unique Tags Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-400">Unique to Video A ({uniqueTagsA.length})</span>
              <span className="text-[10px] text-zinc-500">{tagsA.join(',').length}/500 chars</span>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {uniqueTagsA.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20 font-mono"
                >
                  #{tag}
                </span>
              ))}
              {uniqueTagsA.length === 0 && (
                <span className="text-xs text-zinc-500 italic">No unique tags</span>
              )}
            </div>
          </div>

          <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-400">Unique to Video B ({uniqueTagsB.length})</span>
              <span className="text-[10px] text-zinc-500">{tagsB.join(',').length}/500 chars</span>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {uniqueTagsB.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20 font-mono"
                >
                  #{tag}
                </span>
              ))}
              {uniqueTagsB.length === 0 && (
                <span className="text-xs text-zinc-500 italic">No unique tags</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DESCRIPTIONS COMPARISON SECTION */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Description & Chapters Consistency</span>
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={syncDescriptionAtoB}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
            >
              <span>Copy A → B</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={syncDescriptionBtoA}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Copy B → A</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold text-blue-400">Video A Description</span>
              <span className="font-mono">{metaA.description.length}/5,000</span>
            </div>
            <div className="h-48 overflow-y-auto bg-black/50 p-3 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {metaA.description || <span className="italic text-zinc-600">No description entered</span>}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold text-purple-400">Video B Description</span>
              <span className="font-mono">{metaB.description.length}/5,000</span>
            </div>
            <div className="h-48 overflow-y-auto bg-black/50 p-3 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {metaB.description || <span className="italic text-zinc-600">No description entered</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SETTINGS & TAXONOMY MATRIX */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
          Channel Taxonomy & Rights Matrix
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Category */}
          <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 block">Category</span>
            <div className="flex items-center justify-between">
              <span className="text-blue-300 font-medium truncate">{getCategoryName(metaA.categoryId)}</span>
              <span className="text-zinc-500 mx-1">vs</span>
              <span className="text-purple-300 font-medium truncate">{getCategoryName(metaB.categoryId)}</span>
            </div>
            {metaA.categoryId !== metaB.categoryId && (
              <button
                onClick={syncCategoryAtoB}
                className="text-[10px] text-amber-400 hover:underline pt-1 block"
              >
                Sync category to match Video A
              </button>
            )}
          </div>

          {/* Visibility */}
          <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 block">Visibility</span>
            <div className="flex items-center justify-between capitalize">
              <span className="text-blue-300 font-medium">{metaA.visibility}</span>
              <span className="text-zinc-500 mx-1">vs</span>
              <span className="text-purple-300 font-medium">{metaB.visibility}</span>
            </div>
          </div>

          {/* Audience COPPA */}
          <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 block">Audience (COPPA)</span>
            <div className="flex items-center justify-between">
              <span className="text-blue-300 font-medium">
                {metaA.madeForKids === 'made_for_kids' ? 'Made for Kids' : 'Not for Kids'}
              </span>
              <span className="text-zinc-500 mx-1">vs</span>
              <span className="text-purple-300 font-medium">
                {metaB.madeForKids === 'made_for_kids' ? 'Made for Kids' : 'Not for Kids'}
              </span>
            </div>
          </div>

          {/* Comments Visibility */}
          <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 block">Comments Setting</span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-blue-300 font-medium capitalize truncate">
                {(metaA.comments?.visibility || 'Hold for review').replace(/_/g, ' ')}
              </span>
              <span className="text-zinc-500 mx-1">vs</span>
              <span className="text-purple-300 font-medium capitalize truncate">
                {(metaB.comments?.visibility || 'Hold for review').replace(/_/g, ' ')}
              </span>
            </div>
            {metaA.comments && (
              <button
                onClick={() => {
                  onUpdateVideo(compareVideo.id, { comments: metaA.comments });
                  onShowToast?.(`Comments settings synced!`);
                }}
                className="text-[10px] text-amber-400 hover:underline pt-1 block"
              >
                Sync comments to match Video A
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
