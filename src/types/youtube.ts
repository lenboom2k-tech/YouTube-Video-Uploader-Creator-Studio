export type VideoVisibility = 'public' | 'unlisted' | 'private' | 'scheduled';

export type MadeForKidsOption = 'not_for_kids' | 'made_for_kids';

export type VideoLicense = 'youtube' | 'creativeCommon';

export type CommentVisibilityOption = 
  | 'allow_all' 
  | 'hold_potentially_inappropriate' 
  | 'hold_all' 
  | 'disabled';

export type CommentSortOrder = 'top' | 'newest';

export interface CommentSettings {
  visibility: CommentVisibilityOption;
  strictness: boolean;
  sortBy: CommentSortOrder;
  showRatings: boolean;
  pinnedComment?: string;
}

export type UploadStatus = 'draft' | 'queued' | 'uploading' | 'processing' | 'published' | 'failed' | 'paused';

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  keywords?: string[];
  captions?: string;
  categoryId: string;
  visibility: VideoVisibility;
  scheduledTime?: string;
  isPremiere: boolean;
  madeForKids: MadeForKidsOption;
  ageRestricted: boolean;
  license: VideoLicense;
  embeddable: boolean;
  notifySubscribers: boolean;
  language: string;
  recordingDate: string;
  location: string;
  shortsRemixing: 'all' | 'audio_only' | 'none';
  comments?: CommentSettings;
}

export interface VideoItem {
  id: string;
  file?: File;
  fileName: string;
  fileSize: number;
  duration: number; // in seconds
  trimStart?: number; // in seconds
  trimEnd?: number; // in seconds
  width: number;
  height: number;
  aspectRatio: number;
  isShort: boolean;
  videoUrl: string;
  thumbnailUrl: string;
  extractedFrames: string[];
  metadata: VideoMetadata;
  status: UploadStatus;
  uploadProgress: number; // 0 - 100
  bytesUploaded: number;
  uploadSpeed: string;
  eta: string;
  uploadStage: 'idle' | 'initiating' | 'uploading_chunks' | 'server_processing' | 'hd_checks' | 'completed' | 'error';
  youtubeVideoId?: string;
  publishedUrl?: string;
  publishedAt?: string;
  errorMessage?: string;
  abTest?: ThumbnailAbTest;
}

export interface YouTubeCategory {
  id: string;
  name: string;
}

export const YOUTUBE_CATEGORIES: YouTubeCategory[] = [
  { id: '1', name: 'Film & Animation' },
  { id: '2', name: 'Autos & Vehicles' },
  { id: '10', name: 'Music' },
  { id: '15', name: 'Pets & Animals' },
  { id: '17', name: 'Sports' },
  { id: '19', name: 'Travel & Events' },
  { id: '20', name: 'Gaming' },
  { id: '22', name: 'People & Blogs' },
  { id: '23', name: 'Comedy' },
  { id: '24', name: 'Entertainment' },
  { id: '25', name: 'News & Politics' },
  { id: '26', name: 'Howto & Style' },
  { id: '27', name: 'Education' },
  { id: '28', name: 'Science & Technology' },
  { id: '29', name: 'Nonprofits & Activism' },
];

export interface ChannelInfo {
  id: string;
  title: string;
  customUrl: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  isConnected: boolean;
}

export interface AiOptimizationResult {
  titles: {
    title: string;
    ctrScore: number;
    rationale: string;
  }[];
  description: string;
  tags: string[];
  keywords?: string[];
  captionsSrt?: string;
  pinnedComment: string;
  shortsHook: string;
  thumbnailTextSuggestions: string[];
}

export interface SmartScheduleSlot {
  datetime: string; // YYYY-MM-DDTHH:mm
  dayOfWeek: string;
  timeFormatted: string;
  slotLabel: string;
  velocityBoost: string;
  rationale: string;
}

export interface SmartScheduleResult {
  primarySlot: SmartScheduleSlot;
  alternativeSlots: SmartScheduleSlot[];
  audienceInsights: {
    peakHours: string;
    bestDays: string[];
    processingBufferMinutes: number;
    explanation: string;
  };
}

export type AiThumbnailStyle =
  | 'cinematic-3d'
  | 'cyberpunk-neon'
  | 'tech-minimalist'
  | 'dramatic-creator'
  | 'gold-luxury'
  | 'high-voltage';

export interface AiThumbnailOption {
  id: string;
  style: AiThumbnailStyle;
  title: string;
  prompt: string;
  hookText: string;
  colorScheme: string[];
  previewUrl?: string;
}

export interface ThumbnailVariant {
  id: 'A' | 'B';
  label: string;
  style: AiThumbnailStyle;
  styleName: string;
  thumbnailUrl: string;
  hookText: string;
  badgeColor?: 'yellow' | 'red' | 'cyan' | 'purple' | 'emerald';
  // Simulated metrics
  impressions: number;
  clicks: number;
  ctr: number; // Percentage, e.g. 8.6
  ctrHistory: { time: string; ctr: number }[];
}

export interface ThumbnailAbTest {
  id: string;
  videoId: string;
  status: 'draft' | 'running' | 'completed';
  startedAt?: string;
  completedAt?: string;
  durationHours: number;
  sampleAudienceSize: number;
  variantA: ThumbnailVariant;
  variantB: ThumbnailVariant;
  winner?: 'A' | 'B' | null;
  confidenceScore?: number; // e.g. 96 (%)
  recommendation?: string;
  trafficSourcesSplit?: {
    source: string;
    ctrA: number;
    ctrB: number;
  }[];
}

