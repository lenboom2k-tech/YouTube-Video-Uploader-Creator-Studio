import React, { useState } from 'react';
import { 
  X, 
  Youtube, 
  Key, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { ChannelInfo } from '../types/youtube';
import { AppSettings, saveSettings } from '../utils/youtubeApi';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [mode, setMode] = useState<'simulation' | 'direct_api'>(settings.mode);
  const [accessToken, setAccessToken] = useState(settings.accessToken);
  const [clientId, setClientId] = useState(settings.clientId);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    success?: boolean;
    message?: string;
    channel?: ChannelInfo;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerifyToken = async () => {
    if (!accessToken.trim()) {
      setVerifyStatus({
        success: false,
        message: 'Please enter a valid Google OAuth Access Token',
      });
      return;
    }

    setIsVerifying(true);
    setVerifyStatus(null);

    try {
      const res = await fetch('/api/youtube/verify-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: accessToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate channel');
      }

      const verifiedChannel: ChannelInfo = {
        id: data.id,
        title: data.title,
        customUrl: data.customUrl || '@' + data.title.toLowerCase().replace(/\s+/g, ''),
        thumbnail: data.thumbnail,
        subscriberCount: Number(data.subscriberCount) > 1000
          ? `${(Number(data.subscriberCount) / 1000).toFixed(1)}K`
          : data.subscriberCount,
        videoCount: data.videoCount,
        isConnected: true,
      };

      setVerifyStatus({
        success: true,
        message: `Connected successfully to "${data.title}"!`,
        channel: verifiedChannel,
      });
    } catch (err: any) {
      setVerifyStatus({
        success: false,
        message: err.message || 'Token verification failed. Check permissions.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    const updatedChannel = verifyStatus?.channel || settings.defaultChannel;
    const newSettings: AppSettings = {
      ...settings,
      mode,
      accessToken: accessToken.trim(),
      clientId: clientId.trim(),
      defaultChannel: updatedChannel,
    };

    saveSettings(newSettings);
    onSaveSettings(newSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <Youtube className="w-5 h-5 fill-red-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">YouTube Connection & Mode</h2>
              <p className="text-xs text-zinc-400">Choose between Safe Staging / Prototype mode or Live YouTube API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setMode('simulation')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                mode === 'simulation'
                  ? 'bg-red-500/10 border-red-500/50 shadow-inner ring-1 ring-red-500/30'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" /> Staging & Prototype
                </span>
                {mode === 'simulation' && <CheckCircle2 className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-xs text-zinc-300 font-medium">Safe Sandbox & Live Preview</p>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Zero configuration needed. Test full video uploads, AI metadata generation, thumbnail extraction, and YouTube desktop/mobile mockup.
              </p>
            </div>

            <div
              onClick={() => setMode('direct_api')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                mode === 'direct_api'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-inner ring-1 ring-emerald-500/30'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Live YouTube API
                </span>
                {mode === 'direct_api' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-zinc-300 font-medium">Publish directly to Channel</p>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Uses official YouTube Data API v3 Resumable protocol. Streams video bytes directly to your verified channel.
              </p>
            </div>
          </div>

          {/* Direct API Token Fields */}
          {mode === 'direct_api' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Google OAuth Access Token</span>
                  <a
                    href="https://developers.google.com/oauthplayground/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <span>Get via OAuth Playground</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="ya29.a0AfH6SM..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="flex-1 bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                  <button
                    onClick={handleVerifyToken}
                    disabled={isVerifying || !accessToken}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-medium text-zinc-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {isVerifying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                    ) : (
                      <Key className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span>{isVerifying ? 'Checking...' : 'Verify'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Required Scope: <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-[10px]">https://www.googleapis.com/auth/youtube.upload</code>
                </p>
              </div>

              {/* Verification Message */}
              {verifyStatus && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                    verifyStatus.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  {verifyStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{verifyStatus.message}</p>
                    {verifyStatus.channel && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-500/20">
                        <img
                          src={verifyStatus.channel.thumbnail}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-semibold text-white">{verifyStatus.channel.title}</span>
                        <span className="text-emerald-400">({verifyStatus.channel.subscriberCount} Subscribers)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Channel Details */}
          <div className="border border-zinc-800/80 bg-zinc-900/40 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Active Channel Profile</h4>
            <div className="flex items-center gap-3">
              <img
                src={settings.defaultChannel.thumbnail}
                alt=""
                className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-700"
              />
              <div>
                <h5 className="text-sm font-semibold text-white">{settings.defaultChannel.title}</h5>
                <p className="text-xs text-zinc-400">{settings.defaultChannel.customUrl}</p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                  <span>{settings.defaultChannel.subscriberCount} Subscribers</span>
                  <span>•</span>
                  <span>{settings.defaultChannel.videoCount} Uploads</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800/80 bg-zinc-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
