export type BotStatus = {
  state: 'online' | 'offline';
  guilds: number;
  ping: number;
  tag: string;
  uptime: number;
  mockMode?: boolean;
  inviteUrl?: string;
  supportServerUrl?: string;
  memory?: {
    rss: number;
    heapUsed: number;
  };
};

export type QueueItem = {
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnailColor?: string;
};

export type HistoryItem = {
  title: string;
  author: string;
  duration: string;
  playedAt: number;
  url: string;
};

export type PlayerStatus = {
  guildId: string;
  guildName: string;
  channelName: string;
  nowPlaying: {
    title: string;
    author: string;
    duration: number;
    current: number;
    thumbnail: string;
  } | null;
  queueLength: number;
  queue: QueueItem[];
  history: HistoryItem[];
  state: 'playing' | 'paused';
  volume: number;
};

export const DEFAULT_PREMIUM_SETTINGS = {
  // Player
  loopMode: 'none' as 'none' | 'track' | 'queue',
  shuffleEnabled: false,
  crossfadeSeconds: 0,
  volumeNormalize: false,
  volumeLimit: 100,
  autoplay: false,
  queuePriority: false,
  playbackSpeed: '1.0',
  // Audio Effects
  eqPreset: 'flat' as 'flat' | 'bass' | 'treble' | 'rock' | 'pop' | 'jazz' | 'classical' | 'electronic',
  bassBoost: 0,
  reverbLevel: 0,
  stereoWide: false,
  pitchCorrection: false,
  // Notifications
  nowPlayingEmbed: true,
  notifyQueueEnd: false,
  notifyError: true,
  dmNotifications: false,
  notifyJoin: false,
  weeklyReport: false,
  // UI
  accentColor: 'indigo' as 'indigo' | 'blue' | 'purple' | 'emerald' | 'rose' | 'amber',
  animationsEnabled: true,
  compactMode: false,
  showEqViz: false,
  largeThumbnails: false,
  // AI
  aiRecommendations: false,
  moodAnalysis: false,
  aiAutopilot: false,
  extendedHistory: false,
  aiAssistantEnabled: false,
  // Advanced
  explicitFilter: false,
  ytRegion: 'pl' as 'pl' | 'us' | 'gb' | 'de' | 'fr',
  qualityFallback: true,
  richPresence: false,
  botLanguage: 'pl' as 'pl' | 'en' | 'de' | 'fr',
};

export type PremiumSettings = typeof DEFAULT_PREMIUM_SETTINGS;

export type ChangelogFeature = {
  type: 'new' | 'fix' | 'improvement';
  text: string;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  title?: string;
  features: ChangelogFeature[];
};
