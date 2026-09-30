import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MousePointerClick, 
  Clock, 
  Users, 
  ThumbsUp, 
  ArrowUpRight, 
  Calendar, 
  Sparkles, 
  Play, 
  ExternalLink,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { VideoItem, ChannelInfo } from '../types/youtube';
import { formatBytes, formatDuration } from '../utils/videoExtractor';

interface PerformanceDashboardProps {
  history: VideoItem[];
  channel: ChannelInfo;
  onNewUpload: () => void;
  onSeedSampleHistory?: () => void;
}

interface SimulatedMetrics {
  viewsOverTime: { time: string; views: number; impressions: number }[];
  ctrTimeline: { time: string; ctr: number; benchmark: number }[];
  retentionCurve: { percent: string; retention: number }[];
  trafficSources: { name: string; value: number; color: string }[];
  kpis: {
    totalViews: number;
    totalImpressions: number;
    avgCtr: number;
    avgWatchDuration: string;
    subscribersGained: number;
    likes: number;
  };
}

// Generate deterministic pseudo-metrics for any video based on its ID/title
function generateMetricsForVideo(video: VideoItem): SimulatedMetrics {
  const seed = (video.id || video.metadata.title)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const baseViews = 1500 + (seed % 14000);
  const baseImpressions = Math.round(baseViews * (10 + (seed % 8)));
  const avgCtr = parseFloat(((baseViews / baseImpressions) * 100).toFixed(1));
  const isShort = video.isShort;

  // 7-day or 24-hour timeline
  const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  let currentViews = 0;
  let currentImpressions = 0;

  const viewsOverTime = days.map((day, i) => {
    const dailyViews = Math.round(baseViews * (0.1 + (i === 1 || i === 2 ? 0.35 : 0.1) * (0.8 + (seed % 5) * 0.1)));
    const dailyImpressions = Math.round(dailyViews * (9 + (seed % 6)));
    currentViews += dailyViews;
    currentImpressions += dailyImpressions;

    return {
      time: day,
      views: currentViews,
      impressions: currentImpressions,
    };
  });

  const ctrTimeline = days.map((day, i) => {
    const dailyCtr = Math.max(3.5, Math.min(14.0, avgCtr + Math.sin(i + (seed % 4)) * 1.8));
    return {
      time: day,
      ctr: parseFloat(dailyCtr.toFixed(1)),
      benchmark: 5.0, // YouTube 5% benchmark
    };
  });

  // Audience Retention Curve
  const retentionCurve = [
    { percent: '0%', retention: 100 },
    { percent: '10%', retention: Math.max(78, 88 - (seed % 8)) },
    { percent: '25%', retention: Math.max(65, 75 - (seed % 8)) },
    { percent: '50%', retention: Math.max(48, 60 - (seed % 8)) },
    { percent: '75%', retention: Math.max(38, 48 - (seed % 8)) },
    { percent: '90%', retention: Math.max(28, 36 - (seed % 8)) },
    { percent: '100%', retention: Math.max(20, 28 - (seed % 8)) },
  ];

  const trafficSources = isShort
    ? [
        { name: 'Shorts Feed', value: 68, color: '#ef4444' },
        { name: 'YouTube Search', value: 16, color: '#3b82f6' },
        { name: 'Channel Pages', value: 9, color: '#10b981' },
        { name: 'Other', value: 7, color: '#8b5cf6' },
      ]
    : [
        { name: 'YouTube Search', value: 44, color: '#3b82f6' },
        { name: 'Browse Features', value: 31, color: '#ef4444' },
        { name: 'Suggested Videos', value: 16, color: '#10b981' },
        { name: 'External / Social', value: 9, color: '#f59e0b' },
      ];

  const duration = video.duration || 180;
  const avgSeconds = Math.round(duration * (retentionCurve[3].retention / 100));

  return {
    viewsOverTime,
    ctrTimeline,
    retentionCurve,
    trafficSources,
    kpis: {
      totalViews: currentViews,
      totalImpressions: currentImpressions,
      avgCtr,
      avgWatchDuration: formatDuration(avgSeconds),
      subscribersGained: Math.max(12, Math.round(currentViews * 0.024)),
      likes: Math.max(34, Math.round(currentViews * 0.082)),
    },
  };
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  history,
  channel,
  onNewUpload,
  onSeedSampleHistory,
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    history.length > 0 ? history[0].id : 'all'
  );
  const [timeRange, setTimeRange] = useState<'7d' | '28d' | 'all'>('7d');

  // Selected video item
  const selectedVideo = useMemo(
    () => history.find((v) => v.id === selectedVideoId) || history[0],
    [history, selectedVideoId]
  );

  // Computed metrics for active video
  const metrics = useMemo(() => {
    if (!selectedVideo) return null;
    return generateMetricsForVideo(selectedVideo);
  }, [selectedVideo]);

  // Aggregate metrics across all videos for comparison chart
  const comparisonData = useMemo(() => {
    return history.slice(0, 6).map((item) => {
      const m = generateMetricsForVideo(item);
      const shortTitle = item.metadata.title.length > 20
        ? item.metadata.title.slice(0, 18) + '...'
        : item.metadata.title;
      return {
        id: item.id,
        name: shortTitle,
        views: m.kpis.totalViews,
        ctr: m.kpis.avgCtr,
      };
    });
  }, [history]);

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-semibold text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-mono">
              {entry.name}: {entry.value.toLocaleString()}
              {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Video Selector */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Video Engagement & Performance Analytics</h2>
              <p className="text-xs text-zinc-400">
                Simulated YouTube Studio analytics, view velocity, click-through rates & retention
              </p>
            </div>
          </div>
        </div>

        {/* Video Dropdown Selector */}
        {history.length > 0 && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs text-zinc-400 shrink-0">Inspect Video:</span>
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 max-w-xs truncate"
            >
              {history.map((vid) => (
                <option key={vid.id} value={vid.id}>
                  {vid.metadata.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-400 space-y-4">
          <BarChart3 className="w-12 h-12 mx-auto opacity-30 text-red-400" />
          <h3 className="text-sm font-semibold text-white">No Published Videos to Analyze Yet</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Upload videos through the Studio or click below to populate sample published videos with full engagement metrics.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onNewUpload}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-xl shadow-md shadow-red-600/20 transition-all"
            >
              Upload Video
            </button>
            {onSeedSampleHistory && (
              <button
                onClick={onSeedSampleHistory}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-xl border border-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Demo Analytics</span>
              </button>
            )}
          </div>
        </div>
      ) : metrics && selectedVideo ? (
        <div className="space-y-6">
          {/* Active Video Header Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative border border-zinc-800">
                <img
                  src={selectedVideo.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white line-clamp-1">
                  {selectedVideo.metadata.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                  <span className="font-mono text-emerald-400">ID: {selectedVideo.youtubeVideoId || 'live'}</span>
                  <span>•</span>
                  <span>{formatDuration(selectedVideo.duration)}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedVideo.metadata.visibility}</span>
                </div>
              </div>
            </div>

            <a
              href={selectedVideo.publishedUrl || `https://youtu.be/${selectedVideo.youtubeVideoId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 transition-colors shrink-0"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              {
                label: 'Total Views',
                value: metrics.kpis.totalViews.toLocaleString(),
                icon: Eye,
                color: 'text-blue-400',
                delta: '+24.5%',
              },
              {
                label: 'Impressions',
                value: metrics.kpis.totalImpressions.toLocaleString(),
                icon: ArrowUpRight,
                color: 'text-indigo-400',
                delta: '+18.2%',
              },
              {
                label: 'CTR (Click-Through)',
                value: `${metrics.kpis.avgCtr}%`,
                icon: MousePointerClick,
                color: 'text-emerald-400',
                delta: metrics.kpis.avgCtr >= 5.0 ? 'Above Avg' : 'Normal',
              },
              {
                label: 'Avg Watch Time',
                value: metrics.kpis.avgWatchDuration,
                icon: Clock,
                color: 'text-amber-400',
                delta: '54% Retention',
              },
              {
                label: 'Subscribers',
                value: `+${metrics.kpis.subscribersGained}`,
                icon: Users,
                color: 'text-rose-400',
                delta: 'High conversion',
              },
              {
                label: 'Likes',
                value: metrics.kpis.likes.toLocaleString(),
                icon: ThumbsUp,
                color: 'text-purple-400',
                delta: '98.4% Ratio',
              },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between space-y-2 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-medium truncate">{kpi.label}</span>
                    <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white font-mono leading-tight">
                      {kpi.value}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
                      {kpi.delta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Charts Row: Views/Impressions AreaChart + CTR LineChart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Views Velocity & Impressions */}
            <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span>Views & Impressions Growth Curve</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">Cumulative performance over first 7 days</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.viewsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#viewsGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#impressionsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Traffic Sources Donut / Pie */}
            <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Traffic Sources Breakdown
                </h4>
                <p className="text-[11px] text-zinc-400">Where viewers discover your video</p>
              </div>

              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.trafficSources}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {metrics.trafficSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Share']}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {metrics.trafficSources.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-zinc-300 truncate">{s.name}</span>
                    <span className="font-mono text-zinc-400 text-[11px] ml-auto">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Charts Row: CTR vs Benchmark + Audience Retention */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 3: Click-Through Rate (CTR) LineChart */}
            <div className="lg:col-span-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-emerald-400" />
                    <span>Impressions Click-Through Rate (CTR %)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    High CTR signifies strong thumbnail appeal & title curiosity
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Avg: {metrics.kpis.avgCtr}%
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.ctrTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 16]}
                      unit="%"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="ctr"
                      name="Your Video CTR (%)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981' }}
                      unit="%"
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      name="YouTube Average (5.0%)"
                      stroke="#71717a"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                      unit="%"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Audience Retention Curve */}
            <div className="lg:col-span-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Audience Retention Curve</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Viewer drop-off across video timeline (0% to 100%)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {metrics.kpis.avgWatchDuration} Avg
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.retentionCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="percent" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="retention"
                      name="Retention (%)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#retentionGrad)"
                      unit="%"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Video Comparison BarChart if multiple videos in history */}
          {comparisonData.length > 1 && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span>Upload History Views Comparison</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">Comparing total reach across recent uploads</p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="views" name="Total Views" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
