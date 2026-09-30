import React from 'react';
import { 
  Youtube, 
  Layers, 
  History, 
  Eye, 
  Sparkles, 
  UploadCloud, 
  Settings2, 
  CheckCircle2, 
  Smartphone,
  ExternalLink,
  Plus,
  BarChart3
} from 'lucide-react';
import { ChannelInfo } from '../types/youtube';

interface HeaderProps {
  activeTab: 'editor' | 'queue' | 'preview' | 'history' | 'performance';
  setActiveTab: (tab: 'editor' | 'queue' | 'preview' | 'history' | 'performance') => void;
  channel: ChannelInfo;
  mode: 'simulation' | 'direct_api';
  onOpenConnectModal: () => void;
  queuedCount: number;
  isUploading: boolean;
  onNewUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  channel,
  mode,
  onOpenConnectModal,
  queuedCount,
  isUploading,
  onNewUpload,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-zinc-800 text-white px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('editor')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Youtube className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">TubeLaunch</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal">Next-Gen YouTube Uploader</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-red-400" />
              <span>Studio & Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                activeTab === 'queue'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Batch Queue</span>
              {queuedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-red-600 text-white">
                  {queuedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'preview'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Live Mockup</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Published</span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'performance'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              <span>Performance</span>
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* New Upload Button */}
          <button
            onClick={onNewUpload}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Video</span>
          </button>

          {/* Mode Pill & Channel Card */}
          <button
            onClick={onOpenConnectModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all text-left group"
          >
            <div className="relative">
              <img
                src={channel.thumbnail}
                alt={channel.title}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-zinc-700 group-hover:ring-red-500 transition-all"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-900 ${
                mode === 'direct_api' ? 'bg-emerald-500' : 'bg-amber-400'
              }`} />
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-xs font-medium text-zinc-200 max-w-[120px] truncate">{channel.title}</span>
                <span className="text-[10px] text-zinc-500">{channel.subscriberCount}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <span>{mode === 'direct_api' ? 'Live API' : 'Staging Mode'}</span>
                <Settings2 className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-300" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Submenu Tabs */}
      <div className="flex md:hidden items-center justify-around mt-2.5 pt-2 border-t border-zinc-800/80">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-md ${
            activeTab === 'editor' ? 'text-red-400 font-medium bg-zinc-800' : 'text-zinc-400'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-md ${
            activeTab === 'queue' ? 'text-amber-400 font-medium bg-zinc-800' : 'text-zinc-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Queue ({queuedCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-md ${
            activeTab === 'preview' ? 'text-blue-400 font-medium bg-zinc-800' : 'text-zinc-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Mockup</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-md ${
            activeTab === 'history' ? 'text-emerald-400 font-medium bg-zinc-800' : 'text-zinc-400'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-md ${
            activeTab === 'performance' ? 'text-purple-400 font-medium bg-zinc-800' : 'text-zinc-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Metrics</span>
        </button>
      </div>
    </header>
  );
};
