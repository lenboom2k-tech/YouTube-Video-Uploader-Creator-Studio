import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Scissors, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Clock, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Film, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { VideoItem } from '../types/youtube';
import { formatDuration, formatBytes } from '../utils/videoExtractor';

interface VideoTrimmerProps {
  videoItem: VideoItem;
  onApplyTrim: (newDuration: number, trimStart: number, trimEnd: number, newFile?: File) => void;
  onClose?: () => void;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  videoItem,
  onApplyTrim,
  onClose,
}) => {
  const originalDuration = videoItem.duration || 60;
  const initialStart = videoItem.trimStart ?? 0;
  const initialEnd = videoItem.trimEnd ?? originalDuration;

  const [trimStart, setTrimStart] = useState<number>(initialStart);
  const [trimEnd, setTrimEnd] = useState<number>(initialEnd);
  const [currentTime, setCurrentTime] = useState<number>(initialStart);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [filmstripFrames, setFilmstripFrames] = useState<string[]>(videoItem.extractedFrames || []);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const trimmedDuration = Math.max(0.5, trimEnd - trimStart);
  const cutDuration = Math.max(0, originalDuration - trimmedDuration);
  const cutPercentage = Math.round((cutDuration / (originalDuration || 1)) * 100);

  // Sync video time to current time
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = trimStart;
      setCurrentTime(trimStart);
    }
  }, [videoItem.videoUrl]);

  // Handle video timeupdate and enforce [trimStart, trimEnd] boundary
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    if (time >= trimEnd) {
      videoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime = trimStart;
      setCurrentTime(trimStart);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < trimStart || videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const seekTo = (time: number) => {
    const clamped = Math.max(trimStart, Math.min(trimEnd, time));
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
    setCurrentTime(clamped);
  };

  // Adjust Start trim with step
  const adjustStart = (delta: number) => {
    setTrimStart((prev) => {
      const next = Math.max(0, Math.min(prev + delta, trimEnd - 0.5));
      if (videoRef.current && currentTime < next) {
        videoRef.current.currentTime = next;
        setCurrentTime(next);
      }
      return parseFloat(next.toFixed(2));
    });
  };

  // Adjust End trim with step
  const adjustEnd = (delta: number) => {
    setTrimEnd((prev) => {
      const next = Math.min(originalDuration, Math.max(prev + delta, trimStart + 0.5));
      if (videoRef.current && currentTime > next) {
        videoRef.current.currentTime = next;
        setCurrentTime(next);
      }
      return parseFloat(next.toFixed(2));
    });
  };

  const setStartAtCurrent = () => {
    if (currentTime < trimEnd - 0.5) {
      setTrimStart(parseFloat(currentTime.toFixed(2)));
    }
  };

  const setEndAtCurrent = () => {
    if (currentTime > trimStart + 0.5) {
      setTrimEnd(parseFloat(currentTime.toFixed(2)));
    }
  };

  const resetTrim = () => {
    setTrimStart(0);
    setTrimEnd(originalDuration);
    seekTo(0);
  };

  const handleApply = () => {
    onApplyTrim(trimmedDuration, trimStart, trimEnd);
  };

  // Generate 8 filmstrip keyframe thumbnails across the duration if real video exists
  useEffect(() => {
    if (!videoItem.videoUrl) return;
    const v = document.createElement('video');
    v.src = videoItem.videoUrl;
    v.crossOrigin = 'anonymous';
    v.muted = true;

    v.onloadedmetadata = async () => {
      const count = 8;
      const step = (v.duration || originalDuration) / count;
      const frames: string[] = [];

      for (let i = 0; i < count; i++) {
        const t = Math.max(0.2, i * step);
        const frame = await new Promise<string>((res) => {
          const onSeek = () => {
            v.removeEventListener('seeked', onSeek);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = 160;
              canvas.height = 90;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(v, 0, 0, 160, 90);
              res(canvas.toDataURL('image/jpeg', 0.7));
            } catch {
              res('');
            }
          };
          v.addEventListener('seeked', onSeek);
          v.currentTime = t;
        });
        if (frame) frames.push(frame);
      }
      if (frames.length > 0) {
        setFilmstripFrames(frames);
      }
      v.remove();
    };
  }, [videoItem.videoUrl]);

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Precision Video Trimmer</span>
              {cutDuration > 0 && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  -{formatDuration(cutDuration)} ({cutPercentage}% cut)
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Cut dead air, intro slates, or end screens before uploading to YouTube
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetTrim}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Video Preview Canvas & Player */}
      <div className="relative aspect-video max-h-72 w-full bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center group mx-auto">
        {videoItem.videoUrl ? (
          <video
            ref={videoRef}
            src={videoItem.videoUrl}
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={videoItem.thumbnailUrl}
              alt=""
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Film className="w-12 h-12 text-white/50" />
            </div>
          </div>
        )}

        {/* Floating Quick Play Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <span className="text-[11px] font-mono font-semibold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur">
              {formatDuration(currentTime)} / {formatDuration(originalDuration)}
            </span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-zinc-800"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-center pointer-events-auto">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-300 font-mono">
            <span>Trim Range: {formatDuration(trimStart)} - {formatDuration(trimEnd)}</span>
            <span className="text-amber-300 font-bold">{formatDuration(trimmedDuration)} Output</span>
          </div>
        </div>
      </div>

      {/* Visual Filmstrip & Timeline Slider */}
      <div className="space-y-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
        {/* Timeline Bar with handles */}
        <div className="relative h-16 w-full select-none" ref={timelineRef}>
          {/* Filmstrip Frame Background */}
          <div className="absolute inset-0 rounded-lg overflow-hidden flex border border-zinc-800 opacity-60">
            {filmstripFrames.length > 0 ? (
              filmstripFrames.map((frame, idx) => (
                <div key={idx} className="flex-1 h-full bg-black overflow-hidden border-r border-zinc-900/60 last:border-r-0">
                  <img src={frame} alt="" className="w-full h-full object-cover" />
                </div>
              ))
            ) : (
              <div className="w-full h-full bg-zinc-800/80 flex items-center justify-center text-xs text-zinc-500 font-mono">
                Video Timeline
              </div>
            )}
          </div>

          {/* Left Cut Shaded Zone */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-black/85 backdrop-blur-[1px] border-r-2 border-red-500 z-10 transition-all pointer-events-none"
            style={{ width: `${(trimStart / (originalDuration || 1)) * 100}%` }}
          >
            <div className="absolute top-1 left-2 text-[10px] font-mono text-zinc-400 font-semibold">
              Cut: {formatDuration(trimStart)}
            </div>
          </div>

          {/* Right Cut Shaded Zone */}
          <div
            className="absolute top-0 bottom-0 right-0 bg-black/85 backdrop-blur-[1px] border-l-2 border-red-500 z-10 transition-all pointer-events-none"
            style={{ width: `${100 - (trimEnd / (originalDuration || 1)) * 100}%` }}
          >
            <div className="absolute top-1 right-2 text-[10px] font-mono text-zinc-400 font-semibold">
              Cut: {formatDuration(originalDuration - trimEnd)}
            </div>
          </div>

          {/* Active Highlighted Trim Window */}
          <div
            className="absolute top-0 bottom-0 border-y-2 border-amber-400/80 pointer-events-none z-10"
            style={{
              left: `${(trimStart / (originalDuration || 1)) * 100}%`,
              width: `${(trimmedDuration / (originalDuration || 1)) * 100}%`,
            }}
          />

          {/* Playhead Needle Cursor */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-lg pointer-events-none"
            style={{ left: `${(currentTime / (originalDuration || 1)) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 bg-white rounded-full -translate-x-[4px] -translate-y-1 shadow" />
          </div>

          {/* Native dual slider range inputs overlay */}
          <input
            type="range"
            min="0"
            max={originalDuration}
            step="0.05"
            value={trimStart}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (val < trimEnd - 0.5) {
                setTrimStart(val);
                seekTo(val);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-25 pointer-events-auto"
            title="Drag Start Trim"
          />

          <input
            type="range"
            min="0"
            max={originalDuration}
            step="0.05"
            value={trimEnd}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (val > trimStart + 0.5) {
                setTrimEnd(val);
                seekTo(val);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-25 pointer-events-auto"
            title="Drag End Trim"
          />
        </div>

        {/* Fine-Tuning Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Start Point Controls */}
          <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Start Point (Cut In)</span>
              </span>
              <span className="font-mono text-xs font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                {formatDuration(trimStart)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => adjustStart(-1)}
                className="flex-1 py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700 font-mono"
              >
                -1s
              </button>
              <button
                type="button"
                onClick={() => adjustStart(-0.1)}
                className="flex-1 py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700 font-mono"
              >
                -0.1s
              </button>
              <button
                type="button"
                onClick={() => adjustStart(0.1)}
                className="flex-1 py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700 font-mono"
              >
                +0.1s
              </button>
              <button
                type="button"
                onClick={() => adjustStart(1)}
                className="flex-1 py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700 font-mono"
              >
                +1s
              </button>
              <button
                type="button"
                onClick={setStartAtCurrent}
                title="Set Start Cut at current playhead"
                className="py-1 px-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-[11px] font-semibold rounded border border-red-500/30 transition-colors"
              >
                Set at Playhead
              </button>
            </div>
          </div>

          {/* End Point Controls */}
          <div className="bg-black/50 p-3 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>End Point (Cut Out)</span>
              </span>
              <span className="font-mono text-xs font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                {formatDuration(trimEnd)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => adjustEnd(-1)}
                className="flex-1 py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700 font-mono"
              >
                -1s
              </button>
              <button
                type="button"
                onClick={() => adjustEnd(-0.1)}
                className="flex-1 py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700 font-mono"
              >
                -0.1s
              </button>
              <button
                type="button"
                onClick={() => adjustEnd(0.1)}
                className="flex-1 py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700 font-mono"
              >
                +0.1s
              </button>
              <button
                type="button"
                onClick={() => adjustEnd(1)}
                className="flex-1 py-1 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700 font-mono"
              >
                +1s
              </button>
              <button
                type="button"
                onClick={setEndAtCurrent}
                title="Set End Cut at current playhead"
                className="py-1 px-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-[11px] font-semibold rounded border border-red-500/30 transition-colors"
              >
                Set at Playhead
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-300">
          <div>
            <span className="text-zinc-500 text-[10px] block">ORIGINAL</span>
            <span className="font-semibold">{formatDuration(originalDuration)}</span>
          </div>
          <span className="text-zinc-600 text-base">→</span>
          <div>
            <span className="text-emerald-400 text-[10px] block font-sans font-bold">TRIMMED LENGTH</span>
            <span className="font-bold text-white text-sm">{formatDuration(trimmedDuration)}</span>
          </div>
          {cutDuration > 0 && (
            <div className="hidden sm:block">
              <span className="text-red-400 text-[10px] block font-sans font-medium">REMOVED</span>
              <span className="text-red-400">-{formatDuration(cutDuration)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Trim to Video</span>
          </button>
        </div>
      </div>
    </div>
  );
};
