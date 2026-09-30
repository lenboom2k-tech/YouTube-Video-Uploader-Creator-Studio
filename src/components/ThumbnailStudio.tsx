import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Camera, 
  Sparkles, 
  Type, 
  Sliders, 
  Check, 
  Play, 
  RefreshCw,
  Film,
  Wand2,
  Palette,
  Flame,
  Layers
} from 'lucide-react';
import { VideoItem, AiThumbnailStyle } from '../types/youtube';
import { formatDuration, captureCurrentVideoElementFrame } from '../utils/videoExtractor';
import { 
  AI_THUMBNAIL_PRESETS, 
  renderGenAiThumbnail 
} from '../utils/thumbnailGenerator';

interface ThumbnailStudioProps {
  videoItem: VideoItem;
  onUpdateThumbnail: (thumbUrl: string) => void;
  externalTextSuggestion?: string;
  onShowToast?: (msg: string) => void;
}

export const ThumbnailStudio: React.FC<ThumbnailStudioProps> = ({
  videoItem,
  onUpdateThumbnail,
  externalTextSuggestion,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'frames' | 'editor' | 'upload'>('ai');
  const [selectedStyle, setSelectedStyle] = useState<AiThumbnailStyle>('tech-minimalist');
  const [aiHookText, setAiHookText] = useState(externalTextSuggestion || 'MUST WATCH');
  const [aiTitleText, setAiTitleText] = useState(
    videoItem.metadata.title || videoItem.fileName.replace(/\.[^/.]+$/, '')
  );
  const [aiBadgeColor, setAiBadgeColor] = useState<'yellow' | 'red' | 'cyan' | 'purple' | 'emerald'>('yellow');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Overlay editor state
  const [customText, setCustomText] = useState(externalTextSuggestion || 'MUST WATCH');
  const [badgeColor, setBadgeColor] = useState<'red' | 'yellow' | 'cyan' | 'black'>('red');
  const [textPosition, setTextPosition] = useState<'top-left' | 'bottom-left' | 'center' | 'top-right'>('bottom-left');
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalTextSuggestion) {
      setCustomText(externalTextSuggestion);
      setAiHookText(externalTextSuggestion);
    }
  }, [externalTextSuggestion]);

  useEffect(() => {
    if (videoItem.metadata.title) {
      setAiTitleText(videoItem.metadata.title);
    }
  }, [videoItem.metadata.title]);

  const handleGenerateAi = async (styleToUse = selectedStyle, hookToUse = aiHookText) => {
    setIsGeneratingAi(true);
    try {
      const thumbDataUrl = await renderGenAiThumbnail({
        style: styleToUse,
        title: aiTitleText || videoItem.metadata.title || videoItem.fileName,
        hookText: hookToUse,
        isShort: videoItem.isShort,
        badgeColor: aiBadgeColor,
      });

      onUpdateThumbnail(thumbDataUrl);
      if (onShowToast) {
        onShowToast(`✨ Gen AI Thumbnail applied: ${styleToUse.replace('-', ' ')}`);
      }
    } catch (err: any) {
      console.error('Failed to generate AI thumbnail:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCaptureFrame = () => {
    if (videoRef.current) {
      const frameUrl = captureCurrentVideoElementFrame(videoRef.current);
      if (frameUrl) {
        onUpdateThumbnail(frameUrl);
        if (onShowToast) onShowToast('Video frame captured as thumbnail');
      }
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onUpdateThumbnail(event.target.result as string);
        if (onShowToast) onShowToast('Custom thumbnail uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyTextOverlay = () => {
    if (!videoItem.thumbnailUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = videoItem.thumbnailUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 1280;
      canvas.height = img.height || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (customText.trim()) {
        const text = customText.trim().toUpperCase();
        const fontSize = Math.round(canvas.height * 0.11);
        ctx.font = `900 ${fontSize}px sans-serif`;

        const metrics = ctx.measureText(text);
        const paddingX = fontSize * 0.45;
        const paddingY = fontSize * 0.25;
        const boxWidth = metrics.width + paddingX * 2;
        const boxHeight = fontSize + paddingY * 1.5;

        let posX = 40;
        let posY = canvas.height - boxHeight - 40;

        if (textPosition === 'top-left') {
          posX = 40;
          posY = 40;
        } else if (textPosition === 'center') {
          posX = (canvas.width - boxWidth) / 2;
          posY = (canvas.height - boxHeight) / 2;
        } else if (textPosition === 'top-right') {
          posX = canvas.width - boxWidth - 40;
          posY = 40;
        }

        ctx.fillStyle =
          badgeColor === 'red'
            ? '#ef4444'
            : badgeColor === 'yellow'
            ? '#facc15'
            : badgeColor === 'cyan'
            ? '#06b6d4'
            : '#09090b';

        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(posX, posY, boxWidth, boxHeight, 14);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = badgeColor === 'yellow' ? '#000000' : '#ffffff';
        ctx.fillText(text, posX + paddingX, posY + boxHeight - paddingY * 1.3);
      }

      const composite = canvas.toDataURL('image/jpeg', 0.92);
      onUpdateThumbnail(composite);
      if (onShowToast) onShowToast('Overlay text applied');
    };
  };

  const isShort = videoItem.isShort;

  const hookSuggestions = [
    'MUST WATCH',
    'NEW 2026',
    'GAME CHANGER',
    '10X RESULTS',
    'DON’T MISS',
    'FULL GUIDE',
  ];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-red-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Thumbnail Studio
          </h3>
          <span className="text-[10px] text-zinc-400">
            {isShort ? 'Shorts 9:16' : 'HD 16:9'}
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-semibold shadow-sm'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Gen AI</span>
          </button>
          <button
            onClick={() => setActiveTab('frames')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'frames' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Frames
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'editor' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overlay
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'upload' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Main Preview & Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Thumbnail Preview Card (Left side) */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div
            className={`relative rounded-xl overflow-hidden border border-zinc-700/80 bg-black shadow-xl group w-full ${
              isShort ? 'aspect-[9/16] max-w-[220px]' : 'aspect-video'
            }`}
          >
            {videoItem.thumbnailUrl ? (
              <img
                src={videoItem.thumbnailUrl}
                alt="Thumbnail Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-xs">No thumbnail selected</span>
              </div>
            )}

            {/* YouTube Duration Badge Simulation */}
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-sm text-[11px] font-semibold text-white tracking-wider">
              {formatDuration(videoItem.duration)}
            </div>

            {/* Quality pill */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-600/90 text-[10px] font-bold text-white uppercase tracking-wider">
              {videoItem.width >= 3840 ? '4K' : videoItem.width >= 1920 ? 'HD' : '720p'}
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 text-center">
            {isShort ? '9:16 Shorts Cover Frame' : 'Live YouTube 16:9 Thumbnail Preview'}
          </p>
        </div>

        {/* Tab Controls (Right side) */}
        <div className="md:col-span-6 space-y-4">
          {/* TAB 1: GEN AI THUMBNAIL */}
          {activeTab === 'ai' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gen AI Styles</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Instant 1280x720</span>
              </div>

              {/* Style Presets Grid */}
              <div className="grid grid-cols-2 gap-2">
                {AI_THUMBNAIL_PRESETS.map((preset) => {
                  const isSelected = selectedStyle === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setSelectedStyle(preset.id);
                        if (!aiHookText || aiHookText === 'MUST WATCH') {
                          setAiHookText(preset.defaultHook);
                        }
                        handleGenerateAi(preset.id, preset.defaultHook);
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                          : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {preset.name}
                        </span>
                        <span
                          className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border"
                          style={{
                            color: preset.accent,
                            backgroundColor: `${preset.accent}15`,
                            borderColor: `${preset.accent}30`,
                          }}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Hook Text Input with Suggestion Chips */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-medium text-zinc-300">
                  Hook Badge Text
                </label>
                <input
                  type="text"
                  value={aiHookText}
                  onChange={(e) => setAiHookText(e.target.value)}
                  placeholder="e.g. MUST WATCH, NEW 2026, 10X SPEED"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                />

                <div className="flex flex-wrap gap-1 pt-1">
                  {hookSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setAiHookText(sug);
                        handleGenerateAi(selectedStyle, sug);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        aiHookText === sug
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Color & Title Control */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Badge Color</label>
                  <div className="flex gap-1.5">
                    {[
                      { key: 'yellow', bg: 'bg-yellow-400' },
                      { key: 'red', bg: 'bg-red-500' },
                      { key: 'cyan', bg: 'bg-cyan-400' },
                      { key: 'purple', bg: 'bg-purple-500' },
                      { key: 'emerald', bg: 'bg-emerald-500' },
                    ].map((c) => (
                      <button
                        key={c.key}
                        onClick={() => {
                          setAiBadgeColor(c.key as any);
                          setTimeout(() => handleGenerateAi(selectedStyle, aiHookText), 50);
                        }}
                        className={`w-6 h-6 rounded-lg ${c.bg} transition-all ${
                          aiBadgeColor === c.key ? 'ring-2 ring-white scale-110' : 'opacity-70'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Main Focus Text</label>
                  <input
                    type="text"
                    value={aiTitleText}
                    onChange={(e) => setAiTitleText(e.target.value)}
                    placeholder="Short punchy text"
                    className="w-full bg-black/60 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Primary Generation Button */}
              <button
                type="button"
                onClick={() => handleGenerateAi()}
                disabled={isGeneratingAi}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-xs font-bold text-white rounded-lg shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering Gen AI Thumbnail...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate & Apply AI Thumbnail</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: VIDEO FRAMES */}
          {activeTab === 'frames' && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-zinc-300">Auto-Extracted Video Keyframes</h4>
              {videoItem.extractedFrames && videoItem.extractedFrames.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {videoItem.extractedFrames.map((frame, idx) => (
                    <div
                      key={idx}
                      onClick={() => onUpdateThumbnail(frame)}
                      className={`relative aspect-video rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                        videoItem.thumbnailUrl === frame
                          ? 'border-red-500 ring-2 ring-red-500/30'
                          : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      <img
                        src={frame}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No frames extracted yet</p>
              )}

              {/* Live Video Scrubber Frame Extractor */}
              {videoItem.videoUrl && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Scrub video to grab exact frame:</span>
                    <span className="font-mono text-zinc-300">{formatDuration(currentTime)}</span>
                  </div>

                  <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black">
                    <video
                      ref={videoRef}
                      src={videoItem.videoUrl}
                      muted
                      playsInline
                      className="w-full max-h-36 object-contain"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    />
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={videoItem.duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) {
                        videoRef.current.currentTime = val;
                      }
                    }}
                    className="w-full accent-red-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />

                  <button
                    onClick={handleCaptureFrame}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white rounded-lg flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-red-400" />
                    <span>Capture Current Frame as Thumbnail</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OVERLAY TEXT */}
          {activeTab === 'editor' && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-zinc-300">Add YouTube-Style Graphic Badge</h4>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Overlay Hook Text</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. MUST WATCH, NEW 2026, 10X SPEED"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Badge Color</label>
                  <div className="flex gap-1.5">
                    {[
                      { key: 'red', bg: 'bg-red-500' },
                      { key: 'yellow', bg: 'bg-yellow-400' },
                      { key: 'cyan', bg: 'bg-cyan-400' },
                      { key: 'black', bg: 'bg-zinc-900 border border-zinc-700' },
                    ].map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setBadgeColor(c.key as any)}
                        className={`w-7 h-7 rounded-lg ${c.bg} transition-all ${
                          badgeColor === c.key ? 'ring-2 ring-white scale-110' : 'opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Position</label>
                  <select
                    value={textPosition}
                    onChange={(e) => setTextPosition(e.target.value as any)}
                    className="w-full bg-black/60 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-left">Top Left</option>
                    <option value="center">Center</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleApplyTextOverlay}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-lg shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Render & Apply Text to Thumbnail</span>
              </button>
            </div>
          )}

          {/* TAB 4: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-zinc-300">Upload Custom Image</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Recommended size: 1280x720 pixels (minimum 640x360). Under 2MB. Formats: JPG, PNG, WebP.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleCustomUpload}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl flex flex-col items-center justify-center gap-2 bg-black/40 hover:bg-zinc-800/40 transition-colors"
              >
                <Upload className="w-6 h-6 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-200">Browse Image File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
