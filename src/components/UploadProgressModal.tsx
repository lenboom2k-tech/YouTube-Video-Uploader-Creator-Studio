import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  UploadCloud, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle,
  Share2,
  Play
} from 'lucide-react';
import { VideoItem } from '../types/youtube';
import { formatBytes } from '../utils/videoExtractor';

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoItem: VideoItem;
  onCancelUpload?: () => void;
  onNewUpload?: () => void;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  isOpen,
  onClose,
  videoItem,
  onCancelUpload,
  onNewUpload,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isOpen) return null;

  const stage = videoItem.uploadStage;
  const isCompleted = stage === 'completed';
  const isError = stage === 'error' || videoItem.status === 'failed';

  const stagesList = [
    { key: 'initiating', label: '1. Initiate Session', desc: 'Acquiring resumable upload token' },
    { key: 'uploading_chunks', label: '2. Streaming Chunks', desc: 'Uploading video payload to YouTube' },
    { key: 'server_processing', label: '3. YouTube Processing', desc: 'Encoding Standard Definition (SD)' },
    { key: 'hd_checks', label: '4. HD & Copyright Checks', desc: 'Validating Content ID & community guidelines' },
    { key: 'completed', label: '5. Published Live', desc: 'Available to viewers on YouTube' },
  ];

  const getStageIndex = (s: string) => {
    switch (s) {
      case 'initiating': return 0;
      case 'uploading_chunks': return 1;
      case 'server_processing': return 2;
      case 'hd_checks': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const currentIdx = getStageIndex(stage);

  const liveUrl = videoItem.publishedUrl || `https://youtu.be/${videoItem.youtubeVideoId || 'sample'}`;
  const embedCode = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoItem.youtubeVideoId || 'sample'}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  const copyText = (text: string, type: 'link' | 'embed') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${
              isCompleted 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : isError 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-red-600/20 text-red-500 border border-red-500/30'
            }`}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isError ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <UploadCloud className="w-5 h-5 animate-bounce" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isCompleted ? 'Video Successfully Published!' : isError ? 'Upload Interrupted' : 'Uploading to YouTube...'}
              </h2>
              <p className="text-xs text-zinc-400 truncate max-w-sm">
                {videoItem.metadata.title}
              </p>
            </div>
          </div>

          {(isCompleted || isError) && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Ongoing Upload View */}
          {!isCompleted && !isError && (
            <div className="space-y-6">
              {/* Main Progress Bar & Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">
                    {stage === 'uploading_chunks' ? 'Streaming video payload' : 'Processing pipeline'}
                  </span>
                  <span className="font-mono text-sm font-bold text-red-400">
                    {videoItem.uploadProgress}%
                  </span>
                </div>

                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-300 shadow-md shadow-red-500/50"
                    style={{ width: `${Math.max(videoItem.uploadProgress, 4)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
                  <span>{formatBytes(videoItem.bytesUploaded)} / {formatBytes(videoItem.fileSize)}</span>
                  <span>Speed: {videoItem.uploadSpeed}</span>
                  <span>ETA: {videoItem.eta}</span>
                </div>
              </div>

              {/* Stepper Timeline */}
              <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  YouTube Pipeline Stages
                </h4>

                <div className="space-y-2.5">
                  {stagesList.map((st, idx) => {
                    const isDone = currentIdx > idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={st.key} className="flex items-start gap-3">
                        <div className="pt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-medium leading-tight ${
                            isCurrent ? 'text-white' : isDone ? 'text-zinc-300' : 'text-zinc-500'
                          }`}>
                            {st.label}
                          </p>
                          <p className="text-[10px] text-zinc-500">{st.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cancel Button */}
              {onCancelUpload && (
                <div className="flex justify-end">
                  <button
                    onClick={onCancelUpload}
                    className="px-4 py-2 text-xs text-zinc-400 hover:text-red-400 font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    Cancel Upload
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error View */}
          {isError && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Upload Failed</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {videoItem.errorMessage || 'An error occurred during video transmission. Please check connection and retry.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white rounded-lg"
                >
                  Return to Studio
                </button>
              </div>
            </div>
          )}

          {/* Success / Completed View */}
          {isCompleted && (
            <div className="space-y-5 animate-in fade-in">
              {/* Video Card Summary */}
              <div className="flex items-center gap-4 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
                <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative">
                  <img
                    src={videoItem.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white drop-shadow" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {videoItem.metadata.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                    <span className="capitalize text-emerald-400 font-medium">{videoItem.metadata.visibility}</span>
                    <span>•</span>
                    <span>HD 1080p Checks Passed</span>
                  </div>
                </div>
              </div>

              {/* Live Link Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">Live YouTube Video URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={liveUrl}
                    className="flex-1 bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 select-all"
                  />
                  <button
                    onClick={() => copyText(liveUrl, 'link')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-xs font-medium text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all"
                  >
                    <span>Watch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Embed Code Snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Embed Code (HTML)</span>
                  <button
                    onClick={() => copyText(embedCode, 'embed')}
                    className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1"
                  >
                    {copiedEmbed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmbed ? 'Copied Snippet' : 'Copy Embed'}</span>
                  </button>
                </div>
                <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-400 truncate">
                  {embedCode}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onNewUpload?.();
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-lg transition-colors"
                >
                  Upload Another Video
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg shadow-md shadow-emerald-600/30 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
