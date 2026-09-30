import React, { useState } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Download, 
  MoreHorizontal, 
  CheckCircle2, 
  Bell, 
  MessageSquare, 
  Music, 
  Disc,
  Play,
  Volume2
} from 'lucide-react';
import { VideoItem, ChannelInfo } from '../types/youtube';
import { formatDuration } from '../utils/videoExtractor';

interface LiveMockupProps {
  videoItem: VideoItem | null;
  channel: ChannelInfo;
}

export const LiveMockup: React.FC<LiveMockupProps> = ({ videoItem, channel }) => {
  const [viewMode, setViewMode] = useState<'watch' | 'search' | 'shorts'>(
    videoItem?.isShort ? 'shorts' : 'watch'
  );
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  if (!videoItem) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
        <Monitor className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <h3 className="text-base font-semibold text-white">No Video Loaded</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Upload or select a sample video from the Editor tab to preview YouTube mockups.
        </p>
      </div>
    );
  }

  const meta = videoItem.metadata;
  const isShort = videoItem.isShort;

  return (
    <div className="space-y-6">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
        <div>
          <h2 className="text-base font-semibold text-white">YouTube Live Presentation Mockup</h2>
          <p className="text-xs text-zinc-400">
            Preview how your thumbnail, title truncation, and description appear to real viewers
          </p>
        </div>

        <div className="flex items-center bg-zinc-800/90 p-1 rounded-xl border border-zinc-700/80 text-xs">
          <button
            onClick={() => setViewMode('watch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'watch' ? 'bg-zinc-700 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Player</span>
          </button>

          <button
            onClick={() => setViewMode('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'search' ? 'bg-zinc-700 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Result</span>
          </button>

          <button
            onClick={() => setViewMode('shorts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'shorts' ? 'bg-zinc-700 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Shorts Feed</span>
          </button>
        </div>
      </div>

      {/* Main Mockup Canvas */}
      <div className="flex justify-center">
        {/* 1. Desktop Watch Page Mockup */}
        {viewMode === 'watch' && (
          <div className="w-full max-w-4xl bg-[#0f0f0f] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl text-white">
            {/* 16:9 Video Canvas */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
              {videoItem.thumbnailUrl ? (
                <img
                  src={videoItem.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-zinc-600">Video Canvas</div>
              )}

              {/* YouTube Player Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                <div className="text-xs font-semibold text-white drop-shadow">
                  {meta.title}
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer">
                    <Play className="w-7 h-7 fill-white translate-x-0.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <span>0:00 / {formatDuration(videoItem.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-white">
                      HD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Details & Interaction */}
            <div className="p-5 space-y-4">
              {/* Title & Hashtags */}
              <div>
                <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
                  {meta.tags.slice(0, 3).map((t, i) => (
                    <span key={i}>#{t}</span>
                  ))}
                </div>
                <h1 className="text-lg font-bold text-white leading-snug">
                  {meta.title || 'Untitled Video'}
                </h1>
              </div>

              {/* Channel Row & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <img
                    src={channel.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{channel.title}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 fill-zinc-400 text-black" />
                    </div>
                    <span className="text-xs text-zinc-400">{channel.subscriberCount} subscribers</span>
                  </div>

                  <button
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    className={`ml-3 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      isSubscribed
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                </div>

                {/* Right Reaction Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-zinc-800 rounded-full overflow-hidden text-xs">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className={`flex items-center gap-1.5 px-3 py-2 hover:bg-zinc-700 transition-colors ${
                        isLiked ? 'text-red-400' : 'text-zinc-200'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-400' : ''}`} />
                      <span>
                        {meta.comments?.showRatings === false
                          ? 'Like'
                          : isLiked
                          ? '1.5K'
                          : '1.4K'}
                      </span>
                    </button>
                    <div className="w-[1px] h-4 bg-zinc-700" />
                    <button className="px-3 py-2 hover:bg-zinc-700 text-zinc-200 transition-colors">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-full text-zinc-200 transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-full text-zinc-200 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* YouTube Description Box */}
              <div
                onClick={() => setDescExpanded(!descExpanded)}
                className="bg-zinc-900 hover:bg-zinc-800/80 p-4 rounded-xl text-xs text-zinc-300 cursor-pointer transition-colors space-y-2"
              >
                <div className="flex items-center gap-3 font-semibold text-white">
                  <span>12,482 views</span>
                  <span>•</span>
                  <span>{meta.recordingDate || 'Today'}</span>
                  <span>•</span>
                  <span className="uppercase text-[11px] text-zinc-400 font-normal">
                    {meta.categoryId ? `Category: ${meta.categoryId}` : ''}
                  </span>
                </div>

                <div
                  className={`whitespace-pre-wrap leading-relaxed font-sans ${
                    descExpanded ? '' : 'line-clamp-3'
                  }`}
                >
                  {meta.description}
                </div>

                <span className="text-[11px] font-bold text-zinc-400 hover:text-white block pt-1">
                  {descExpanded ? 'Show less' : '...more'}
                </span>
              </div>

              {/* YouTube Comments Preview */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {meta.comments?.visibility === 'disabled' ? 'Comments' : '24 Comments'}
                    </span>
                    {meta.comments?.visibility !== 'disabled' && (
                      <span className="text-xs text-zinc-400">
                        • Sorted by {meta.comments?.sortBy === 'newest' ? 'Newest' : 'Top comments'}
                      </span>
                    )}
                  </div>
                </div>

                {meta.comments?.visibility === 'disabled' ? (
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-400">
                    🔒 Comments are turned off for this video.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Pinned comment if configured */}
                    {meta.comments?.pinnedComment && (
                      <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl space-y-1 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <span className="font-semibold text-white">📌 Pinned by {channel.title}</span>
                          <span>• 1 hour ago</span>
                        </div>
                        <p className="text-xs text-zinc-200">{meta.comments.pinnedComment}</p>
                      </div>
                    )}

                    {/* Sample Community Comment */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                        JD
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-zinc-200">@techcreator</span>
                          <span className="text-[11px] text-zinc-500">2 hours ago</span>
                        </div>
                        <p className="text-xs text-zinc-300">
                          Great breakdown! Exactly the workflow insights I was looking for.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. YouTube Search Result Card Mockup */}
        {viewMode === 'search' && (
          <div className="w-full max-w-3xl bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row gap-4 group cursor-pointer">
              {/* Thumbnail with duration */}
              <div className="relative w-full sm:w-72 aspect-video rounded-xl overflow-hidden bg-black shrink-0">
                <img
                  src={videoItem.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[11px] font-semibold text-white font-mono">
                  {formatDuration(videoItem.duration)}
                </div>
                <div className="absolute top-2 left-2 px-1 py-0.5 rounded bg-red-600 text-[10px] font-bold text-white uppercase">
                  HD
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-base font-medium text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                  {meta.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>8.9K views</span>
                  <span>•</span>
                  <span>2 hours ago</span>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <img
                    src={channel.thumbnail}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-medium text-zinc-300">{channel.title}</span>
                  <CheckCircle2 className="w-3 h-3 text-zinc-400 fill-zinc-400 text-black" />
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {meta.description}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                    New
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                    4K
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                    CC
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. YouTube Shorts Mobile View Mockup */}
        {viewMode === 'shorts' && (
          <div className="relative w-[340px] aspect-[9/18] bg-black border-4 border-zinc-800 rounded-[38px] overflow-hidden shadow-2xl flex flex-col justify-between p-4 text-white">
            {/* Background Video Frame */}
            {videoItem.thumbnailUrl ? (
              <img
                src={videoItem.thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

            {/* Top Bar (Phone Notch & Audio) */}
            <div className="relative z-10 flex items-center justify-between text-xs pt-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                ⚡ Shorts
              </span>
              <div className="w-12 h-3.5 bg-black/80 rounded-full mx-auto" />
              <Search className="w-4 h-4 text-white" />
            </div>

            {/* Bottom Content & Right Floating Actions */}
            <div className="relative z-10 flex items-end justify-between gap-3 pb-2">
              {/* Left Details (Channel & Title) */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <img
                    src={channel.thumbnail}
                    alt=""
                    className="w-8 h-8 rounded-full border border-white"
                  />
                  <span className="text-xs font-bold text-white truncate">{channel.customUrl || '@' + channel.title}</span>
                  <button className="px-3 py-1 bg-red-600 text-[10px] font-bold text-white rounded-full">
                    Subscribe
                  </button>
                </div>

                <p className="text-xs font-medium text-white line-clamp-2 leading-snug drop-shadow-md">
                  {meta.title}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Music className="w-3 h-3 text-white" />
                  <span className="truncate">Original audio - {channel.title}</span>
                </div>
              </div>

              {/* Right Vertical Action Column */}
              <div className="flex flex-col items-center gap-4 shrink-0 pb-1">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer">
                    <ThumbsUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold">48K</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer">
                    <ThumbsDown className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold">Dislike</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold">1.2K</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold">Share</span>
                </div>

                <div className="w-9 h-9 rounded-lg bg-zinc-800 border-2 border-white/40 overflow-hidden animate-spin duration-3000">
                  <img src={channel.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
