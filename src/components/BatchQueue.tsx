import React, { useState } from 'react';
import { 
  Layers, 
  Play, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UploadCloud, 
  Smartphone,
  Film,
  Plus,
  Tag as TagIcon,
  CheckSquare,
  Square,
  Sparkles,
  X,
  Check,
  Filter,
  RefreshCw,
  Hash
} from 'lucide-react';
import { VideoItem, ChannelInfo } from '../types/youtube';
import { formatBytes, formatDuration } from '../utils/videoExtractor';

interface BatchQueueProps {
  queue: VideoItem[];
  currentVideoId?: string;
  onSelectVideo: (item: VideoItem) => void;
  onRemoveFromQueue: (id: string) => void;
  onUploadAll: () => void;
  onNewUpload: () => void;
  onBulkUpdateTags?: (videoIds: string[], tags: string[], mode: 'append' | 'replace' | 'remove') => void;
  isUploading: boolean;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  queue,
  currentVideoId,
  onSelectVideo,
  onRemoveFromQueue,
  onUploadAll,
  onNewUpload,
  onBulkUpdateTags,
  isUploading,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkTagEditorOpen, setIsBulkTagEditorOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagsToApply, setTagsToApply] = useState<string[]>(['creator', 'youtube', '2026']);
  const [bulkMode, setBulkMode] = useState<'append' | 'replace' | 'remove'>('append');
  const [inlineTagInputId, setInlineTagInputId] = useState<string | null>(null);
  const [inlineTagText, setInlineTagText] = useState('');

  const totalSize = queue.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
  const totalDuration = queue.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  const allSelected = queue.length > 0 && selectedIds.length === queue.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < queue.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queue.map((v) => v.id));
    }
  };

  const toggleSelectVideo = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddTagToApply = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    if (tagsToApply.includes(clean)) return;
    setTagsToApply([...tagsToApply, clean]);
    setTagInput('');
  };

  const handleRemoveTagToApply = (tag: string) => {
    setTagsToApply(tagsToApply.filter((t) => t !== tag));
  };

  const handleExecuteBulkTags = () => {
    if (tagsToApply.length === 0) return;
    const targetIds = selectedIds.length > 0 ? selectedIds : queue.map((v) => v.id);
    if (targetIds.length === 0) return;

    if (onBulkUpdateTags) {
      onBulkUpdateTags(targetIds, tagsToApply, bulkMode);
    }
    setIsBulkTagEditorOpen(false);
  };

  const handleAddInlineTag = (videoId: string) => {
    const clean = inlineTagText.trim().toLowerCase().replace(/^#/, '');
    if (!clean) {
      setInlineTagInputId(null);
      return;
    }
    if (onBulkUpdateTags) {
      onBulkUpdateTags([videoId], [clean], 'append');
    }
    setInlineTagText('');
    setInlineTagInputId(null);
  };

  const commonPresets = [
    'tutorial',
    'review',
    'guide',
    '4k',
    'shorts',
    'tech',
    'gaming',
    'creator',
    'trending',
    'education',
    'vlog',
  ];

  return (
    <div className="space-y-6">
      {/* Queue Header Summary */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white">Batch Upload Queue</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-700">
              {queue.length} {queue.length === 1 ? 'Video' : 'Videos'}
            </span>
            {selectedIds.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-semibold">
                {selectedIds.length} Selected
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Total Queue: {formatBytes(totalSize)} • {formatDuration(totalDuration)} total playtime
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {queue.length > 0 && (
            <button
              onClick={() => setIsBulkTagEditorOpen(!isBulkTagEditorOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                isBulkTagEditorOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Tag Editor</span>
            </button>
          )}

          <button
            onClick={onNewUpload}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Videos</span>
          </button>

          <button
            onClick={onUploadAll}
            disabled={isUploading || queue.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload All in Queue</span>
          </button>
        </div>
      </div>

      {/* Bulk Tag Editor Collapsible Panel */}
      {isBulkTagEditorOpen && (
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <TagIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Bulk Tag Editor</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {selectedIds.length > 0
                      ? `Targeting ${selectedIds.length} Selected Video(s)`
                      : `Targeting All ${queue.length} Queue Videos`}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Quickly apply, merge, or replace common tags across your queued videos in one click
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsBulkTagEditorOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                mode: 'append',
                label: 'Merge / Append',
                desc: 'Add tags while preserving existing video tags',
              },
              {
                mode: 'replace',
                label: 'Replace All',
                desc: 'Overwrite all existing tags on selected videos',
              },
              {
                mode: 'remove',
                label: 'Remove Specific',
                desc: 'Strip these specified tags from selected videos',
              },
            ].map((m) => (
              <div
                key={m.mode}
                onClick={() => setBulkMode(m.mode as any)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  bulkMode === m.mode
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${bulkMode === m.mode ? 'text-amber-300' : 'text-zinc-300'}`}>
                    {m.label}
                  </span>
                  {bulkMode === m.mode && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[10px] text-zinc-500">{m.desc}</p>
              </div>
            ))}
          </div>

          {/* Tag Input Field & Tags Bank */}
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTagToApply(tagInput);
                    }
                  }}
                  placeholder="Type common tag and press Enter or comma (e.g. channelname, podcast, review)..."
                  className="w-full bg-black/60 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTagToApply(tagInput)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl border border-zinc-700 transition-colors"
              >
                Add Tag
              </button>
            </div>

            {/* Current Tags to Apply Chips */}
            <div className="p-3 bg-black/40 rounded-xl border border-zinc-800 min-h-[46px] flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-zinc-500 mr-1">Tags to {bulkMode}:</span>
              {tagsToApply.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs border border-zinc-700 font-mono group"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTagToApply(tag)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tagsToApply.length === 0 && (
                <span className="text-xs text-zinc-500 italic">No tags selected to apply</span>
              )}
            </div>

            {/* Quick Presets Bank */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                Quick Presets:
              </span>
              {commonPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddTagToApply(preset)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                    tagsToApply.includes(preset)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <span className="text-[11px] text-zinc-400">
              {selectedIds.length > 0
                ? `Will modify tags on ${selectedIds.length} checked videos.`
                : `No videos checked: will apply to all ${queue.length} videos in queue.`}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTagsToApply([])}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Clear Tags
              </button>

              <button
                type="button"
                onClick={handleExecuteBulkTags}
                disabled={tagsToApply.length === 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  Apply to {selectedIds.length > 0 ? `${selectedIds.length} Videos` : 'All Videos'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select All Controls Bar */}
      {queue.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-red-500" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600" />
              )}
              <span className="font-medium">
                {allSelected ? 'Deselect All Videos' : 'Select All Videos'}
              </span>
            </button>
            <span className="text-zinc-600">•</span>
            <span>
              {selectedIds.length} of {queue.length} selected
            </span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-400">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <h3 className="text-sm font-semibold text-white">Batch Queue is Empty</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Drag & drop multiple video files onto the upload zone or click "Add to Batch Queue" from the studio editor.
          </p>
          <button
            onClick={onNewUpload}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white rounded-lg border border-zinc-700 transition-colors"
          >
            Upload Video Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item, idx) => {
            const isSelected = item.id === currentVideoId;
            const isChecked = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-zinc-900/60 border rounded-xl p-4 flex flex-col gap-3 transition-all ${
                  isChecked
                    ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20'
                    : isSelected
                    ? 'border-red-500/60 bg-red-500/5 ring-1 ring-red-500/20'
                    : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Top Row: Checkbox, Thumbnail, Metadata, Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Checkbox + Thumbnail + Details */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Selection Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectVideo(item.id)}
                      className="p-1 text-zinc-500 hover:text-white transition-colors"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </button>

                    <span className="text-xs font-mono text-zinc-500 w-5 text-right hidden sm:inline">
                      #{idx + 1}
                    </span>

                    <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative border border-zinc-800">
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white">
                        {formatDuration(item.duration)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-white truncate max-w-md">
                          {item.metadata.title || item.fileName}
                        </h4>
                        {item.isShort && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Short
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 mt-1">
                        <span>{item.fileName}</span>
                        <span>•</span>
                        <span>{formatBytes(item.fileSize)}</span>
                        <span>•</span>
                        <span className="capitalize">{item.metadata.visibility}</span>
                      </div>

                      {/* Progress Bar if uploading */}
                      {item.status === 'uploading' && (
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div
                            className="bg-red-500 h-full transition-all duration-300"
                            style={{ width: `${item.uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Pill & Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                      item.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : item.status === 'uploading'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : item.status === 'failed'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {item.status === 'uploading' ? `${item.uploadProgress}%` : item.status}
                    </span>

                    <button
                      onClick={() => onSelectVideo(item)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Edit in Studio"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onRemoveFromQueue(item.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Remove from Queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Tags Badges on the Video Card */}
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <TagIcon className="w-2.5 h-2.5" /> Tags ({item.metadata.tags.length}):
                    </span>
                    {item.metadata.tags.length > 0 ? (
                      <>
                        {item.metadata.tags.slice(0, 5).map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[11px] font-mono border border-zinc-700/60"
                          >
                            #{t}
                          </span>
                        ))}
                        {item.metadata.tags.length > 5 && (
                          <span className="text-[10px] text-zinc-500 font-medium">
                            +{item.metadata.tags.length - 5} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic">No tags</span>
                    )}
                  </div>

                  {/* Inline Tag Adder */}
                  {inlineTagInputId === item.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        autoFocus
                        value={inlineTagText}
                        onChange={(e) => setInlineTagText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddInlineTag(item.id);
                          if (e.key === 'Escape') setInlineTagInputId(null);
                        }}
                        placeholder="Tag name..."
                        className="bg-black border border-zinc-700 rounded px-2 py-0.5 text-xs text-white w-24 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <button
                        onClick={() => handleAddInlineTag(item.id)}
                        className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setInlineTagInputId(null)}
                        className="p-1 text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setInlineTagInputId(item.id);
                        setInlineTagText('');
                      }}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3 h-3 text-zinc-500" />
                      <span>Tag</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
