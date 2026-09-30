import React, { useState } from 'react';
import { 
  History, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Youtube, 
  Eye, 
  Share2,
  Calendar,
  Layers
} from 'lucide-react';
import { VideoItem } from '../types/youtube';
import { formatBytes, formatDuration } from '../utils/videoExtractor';

interface HistoryListProps {
  history: VideoItem[];
  onClearHistory: () => void;
  onNewUpload: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onClearHistory,
  onNewUpload,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Published Videos History</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              {history.length} Uploaded
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Browse published links, embed codes, and metadata archives
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <h3 className="text-sm font-semibold text-white">No Uploads Yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Once you upload a video through TubeLaunch Studio, its live link, video ID, and stats will appear here.
          </p>
          <button
            onClick={onNewUpload}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-xl shadow-md shadow-red-600/20 transition-all"
          >
            Upload Your First Video
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const url = item.publishedUrl || `https://youtu.be/${item.youtubeVideoId || 'live'}`;

            return (
              <div
                key={item.id}
                className="bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
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
                        {item.metadata.title}
                      </h4>
                      {item.isShort && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Short
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                      <span className="font-mono text-emerald-400">ID: {item.youtubeVideoId}</span>
                      <span>•</span>
                      <span className="capitalize">{item.metadata.visibility}</span>
                      <span>•</span>
                      <span>{item.publishedAt || 'Recently'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Copy & Watch Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => copyLink(url, item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-600/20 transition-all"
                  >
                    <span>Watch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
