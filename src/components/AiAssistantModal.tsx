import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Flame, 
  Target, 
  FileText, 
  Tag as TagIcon, 
  MessageSquare, 
  ArrowRight,
  RefreshCw,
  Copy,
  Zap,
  Subtitles,
  Key,
  Download
} from 'lucide-react';
import { VideoItem, AiOptimizationResult } from '../types/youtube';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoItem: VideoItem;
  onApplyTitles: (title: string) => void;
  onApplyDescription: (description: string) => void;
  onApplyTags: (tags: string[]) => void;
  onApplyKeywords?: (keywords: string[]) => void;
  onApplyCaptions?: (captions: string) => void;
  onApplyThumbnailText?: (text: string) => void;
  onApplyAll?: (result: AiOptimizationResult) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  videoItem,
  onApplyTitles,
  onApplyDescription,
  onApplyTags,
  onApplyKeywords,
  onApplyCaptions,
  onApplyThumbnailText,
  onApplyAll,
}) => {
  const [tone, setTone] = useState('Viral & High CTR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiOptimizationResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoItem.metadata.title,
          description: videoItem.metadata.description,
          tags: videoItem.metadata.tags,
          category: videoItem.metadata.categoryId,
          tone,
          isShort: videoItem.isShort,
          duration: videoItem.duration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate recommendations');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI optimizer');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const downloadSrtFile = (srtContent: string) => {
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoItem.fileName.replace(/\.[^/.]+$/, '')}_captions.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyEverything = () => {
    if (!result) return;
    if (onApplyAll) {
      onApplyAll(result);
    } else {
      if (result.titles[0]) onApplyTitles(result.titles[0].title);
      if (result.description) onApplyDescription(result.description);
      if (result.tags) onApplyTags(result.tags);
      if (result.keywords && onApplyKeywords) onApplyKeywords(result.keywords);
      if (result.captionsSrt && onApplyCaptions) onApplyCaptions(result.captionsSrt);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl w-full max-w-4xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Gemini Creator Growth AI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  gemini-3.8-flash
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Auto-generate Captions, Descriptions, Focus Keywords, Keytags & Click-Worthy Titles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Controls Bar */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Desired Content Tone & Style</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Viral & High CTR',
                  'Educational & In-depth',
                  'Tech & Professional Review',
                  'Gaming & Hype',
                  'Storytelling & Vlog',
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                      tone === t
                        ? 'bg-red-500/20 border-red-500/50 text-red-300 font-medium'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Captions & SEO...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Generate All with AI</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-6 animate-in fade-in">
              {/* 1-Click Apply All Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-transparent border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Ready to apply complete AI package?
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Instantly updates Title (#1 choice), Description, Keywords, Keytags, and Timed Captions.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleApplyEverything}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-black text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-black" />
                  <span>1-Click Apply All</span>
                </button>
              </div>

              {/* 1. Viral Titles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-red-400" />
                    <span>Top 5 High-CTR Titles</span>
                  </h3>
                  <span className="text-[11px] text-zinc-500">Click any title to apply</span>
                </div>

                <div className="space-y-2">
                  {result.titles.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between gap-3 group transition-all"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-semibold text-zinc-300 border border-zinc-700">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-red-300 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{item.rationale}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                          {item.ctrScore}% CTR
                        </span>
                        <button
                          onClick={() => {
                            onApplyTitles(item.title);
                            copyToClipboard(item.title, `title_${idx}`);
                          }}
                          className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-medium border border-red-500/30 transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. AI Generated Timed Captions (.SRT) */}
              {result.captionsSrt && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Subtitles className="w-4 h-4 text-purple-400" />
                      <span>AI Generated Timed Captions & Subtitles (.SRT)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadSrtFile(result.captionsSrt!)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs border border-zinc-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .SRT</span>
                      </button>
                      {onApplyCaptions && (
                        <button
                          onClick={() => {
                            onApplyCaptions(result.captionsSrt!);
                            copyToClipboard(result.captionsSrt!, 'captions');
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-medium border border-purple-500/30 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply Captions</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-44 overflow-y-auto bg-black/50 p-3 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {result.captionsSrt}
                  </div>
                </div>
              )}

              {/* 3. SEO Description with Chapters */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>SEO Description & Chapters</span>
                  </h3>
                  <button
                    onClick={() => {
                      onApplyDescription(result.description);
                      copyToClipboard(result.description, 'desc');
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-medium border border-blue-500/30 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Description</span>
                  </button>
                </div>
                <div className="max-h-44 overflow-y-auto bg-black/40 p-3 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {result.description}
                </div>
              </div>

              {/* 4. Focus Keywords & Keytags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Focus Keywords */}
                {result.keywords && result.keywords.length > 0 && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-emerald-400" />
                        <span>Focus Keywords ({result.keywords.length})</span>
                      </h4>
                      {onApplyKeywords && (
                        <button
                          onClick={() => {
                            onApplyKeywords(result.keywords!);
                            copyToClipboard(result.keywords!.join(', '), 'kw');
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          Apply Keywords
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-md text-xs border border-emerald-500/20 font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keytags */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <TagIcon className="w-4 h-4 text-amber-400" />
                      <span>Algorithm Keytags ({result.tags.length})</span>
                    </h4>
                    <button
                      onClick={() => {
                        onApplyTags(result.tags);
                        copyToClipboard(result.tags.join(', '), 'tags');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Apply Keytags
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {result.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-700 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Thumbnail Text & Pinned Comment Ideas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.thumbnailTextSuggestions && result.thumbnailTextSuggestions.length > 0 && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <span>Thumbnail Text Hooks</span>
                    </h4>
                    <div className="space-y-1.5">
                      {result.thumbnailTextSuggestions.map((text, i) => (
                        <div
                          key={i}
                          onClick={() => onApplyThumbnailText?.(text)}
                          className="px-3 py-2 bg-black/40 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 rounded-lg text-xs font-bold text-white tracking-wide cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <span>"{text}"</span>
                          <span className="text-[10px] text-zinc-500">Click to use</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.pinnedComment && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Engagement Pinned Comment</span>
                    </h4>
                    <p className="text-xs text-zinc-300 bg-black/40 p-3 rounded-lg border border-zinc-800 italic">
                      "{result.pinnedComment}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800/80 bg-zinc-900/60">
          <span className="text-xs text-zinc-400">
            {result ? 'AI suggestions ready' : 'Click "Generate All with AI" to analyze video'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Close
            </button>
            {result && (
              <button
                onClick={handleApplyEverything}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply All to Video</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
