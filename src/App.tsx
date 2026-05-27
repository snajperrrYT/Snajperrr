import React, { useEffect, useState, useCallback } from 'react';
import ms from 'ms';
import { 
  Bot, 
  Settings, 
  Server, 
  Activity, 
  Music, 
  Play, 
  Pause, 
  SkipForward,
  SkipBack, 
  Volume2, 
  Clock,
  Terminal,
  Circle,
  Copy,
  List,
  Trash2,
  Search,
  Plus,
  History,
  Bug,
  Info,
  AlertTriangle,
  AlertCircle,
  FileText,
  Download,
  MessageSquare,
  Zap,
  ExternalLink,
  X,
  Sparkles,
  Bell,
  Palette,
  Sliders,
  Globe,
  Shield,
  Shuffle,
  RotateCcw,
  Wand2,
  Gauge,
  Lock,
  Star,
  Radio,
  Repeat,
  Repeat1,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  Mail,
  Send,
  Loader2
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logout as firebaseLogout, getAccessToken } from './lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type BotStatus = {
  state: 'online' | 'offline';
  guilds: number;
  ping: number;
  tag: string;
  uptime: number;
  mockMode?: boolean;
  inviteUrl?: string;
  supportServerUrl?: string;
};

// --- Changelog ---
const CHANGELOG_VERSION = '2.6.0';
const CHANGELOG: { version: string; date: string; title?: string; features: { type: 'new' | 'fix' | 'improvement'; text: string }[] }[] = [
  {
    version: '2.6.0',
    date: '2026-06-01',
    title: 'Tryb Konserwacji i Stabilizacja',
    features: [
      { type: 'new', text: 'Maintenance Mode – dodano możliwość całkowitego zablokowania dostępu do bota przez administratorów w sytuacjach awaryjnych.' },
      { type: 'fix', text: 'Stabilizacja Audio – naprawiono błąd "Streaming data not available" poprzez wdrożenie profilu WEB_EMBEDDED.' },
      { type: 'improvement', text: 'Optymalizacja Bezpieczeństwa – ulepszone sprawdzanie uprawnień administratora przy kluczowych operacjach systemowych.' },
      { type: 'improvement', text: 'Stabilność Połączeń – zoptymalizowany timeout połączenia dla lepszej odporności na mikroprzerwy w sieci.' },
    ],
  },
  {
    version: '2.5.1',
    date: '2026-05-27',
    title: 'Optymalizacja Silnika i Diagnostyka',
    features: [
      { type: 'new', text: 'Komenda Ping – dodano nową komendę /ping pozwalającą sprawdzić opóźnienie WebSocket bota w czasie rzeczywistym.' },
      { type: 'fix', text: 'Stabilizacja Audio – rozwiązano błędy "Streaming data not available" poprzez optymalizację filtrów klienta ANDROID.' },
      { type: 'improvement', text: 'Zarządzanie Logami – zwiększono limit historii logów bota do 150 wpisów dla lepszej widoczności problemów.' },
    ],
  },
];

// --- Default Premium Settings ---
const DEFAULT_PREMIUM_SETTINGS = {
  loopMode: 'none' as 'none' | 'track' | 'queue',
  shuffleEnabled: false,
  crossfadeSeconds: 0,
  volumeNormalize: false,
  volumeLimit: 100,
  autoplay: false,
  queuePriority: false,
  playbackSpeed: '1.0',
  eqPreset: 'flat' as 'flat' | 'bass' | 'treble' | 'rock' | 'pop' | 'jazz' | 'classical' | 'electronic',
  bassBoost: 0,
  reverbLevel: 0,
  stereoWide: false,
  pitchCorrection: false,
  nowPlayingEmbed: true,
  notifyQueueEnd: false,
  notifyError: true,
  dmNotifications: false,
  notifyJoin: false,
  weeklyReport: false,
  accentColor: 'indigo' as 'indigo' | 'blue' | 'purple' | 'emerald' | 'rose' | 'amber',
  animationsEnabled: true,
  compactMode: false,
  showEqViz: false,
  largeThumbnails: false,
  aiRecommendations: false,
  moodAnalysis: false,
  aiAutopilot: false,
  extendedHistory: false,
  aiAssistantEnabled: false,
  explicitFilter: false,
  ytRegion: 'pl' as 'pl' | 'us' | 'gb' | 'de' | 'fr',
  qualityFallback: true,
  richPresence: false,
  botLanguage: 'pl' as 'pl' | 'en' | 'de' | 'fr',
};

type PremiumSettings = typeof DEFAULT_PREMIUM_SETTINGS;

type QueueItem = {
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnailColor?: string;
};

type HistoryItem = {
  title: string;
  author: string;
  duration: string;
  playedAt: number;
  url: string;
};

type PlayerStatus = {
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

// --- Helpers ---
function formatTime(seconds: number) {
  if (seconds === 0) return 'Live';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function SortableQueueItem({ item, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto', opacity: isDragging ? 0.3 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex gap-4 items-center bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl group border border-white/5">
      <div {...attributes} {...listeners} className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-inner relative overflow-hidden cursor-grab active:cursor-grabbing">
         <div className={cn("absolute inset-0 opacity-30", item.thumbnailColor || "bg-indigo-500")} />
         <Music className="w-4 h-4 text-white/50 relative z-10 group-hover:text-white transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{item.title}</h4>
        <p className="text-xs text-slate-500 truncate">{item.author}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0 px-2 py-1 bg-black/20 rounded-md">{formatTime(item.duration)}</span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'logs' | 'admin' | 'settings' | 'gmail'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showChangelog, setShowChangelog] = useState(false);
  const [gmailToken, setGmailToken] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.loggedIn) setUser(data.user);
      else setUser(null);
    } catch(err) {
      console.error(err);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    const lastSeen = localStorage.getItem('changelog_version');
    if (lastSeen !== CHANGELOG_VERSION) setShowChangelog(true);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch(`/api/auth/url`);
      const { url } = await res.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/status').then(res => res.json()).then(data => setStatus(data)).catch(() => {});
      fetch('/api/players').then(res => res.json()).then(data => setPlayers(data)).catch(() => {});
    };
    const interval = setInterval(fetchData, 10000);
    fetchData();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-200 font-sans selection:bg-[#5865F2] selection:text-white flex">
      <aside className="w-64 bg-[#111114] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5865F2] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Bot className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">TuneBot</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">Control Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {['dashboard', 'history', 'logs', 'settings', 'gmail'].map((tab: any) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide capitalize",
                activeTab === tab ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
              )}
            >
              <Activity className="w-4 h-4" />
              {tab}
            </button>
          ))}
          {user?.is_admin === 1 && (
            <button onClick={() => setActiveTab('admin')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide", activeTab === 'admin' ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-slate-300")}>
              <Shield className="w-4 h-4" /> Admin Panel
            </button>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-[#111114]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-4">
            <div className="h-8 w-[2px] bg-indigo-500 rounded-full" />
            <h2 className="text-xl font-bold text-white tracking-tight capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
               <div className="flex items-center gap-4 p-1 bg-white/5 rounded-2xl border border-white/5 pr-4 group transition-all">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white/50" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-white leading-none mb-1">{user.username}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {user.id}</p>
                  </div>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors ml-2"><X className="w-4 h-4" /></button>
               </div>
            ) : (
               <button onClick={handleLogin} className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20">Connect Discord</button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
              <div className="max-w-4xl mx-auto p-12 text-center bg-[#111114] rounded-3xl border border-white/5 shadow-2xl">
                <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter capitalize">{activeTab} Content</h2>
                <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">Panel został uproszczony do celów stabilizacji. Wszystkie dane są bezpieczne.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 text-left">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Status Systemu</h3>
                    <p className="text-xs text-slate-500">Bot Online. Ping: {status?.ping || '---'}ms</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Music className="w-4 h-4 text-indigo-400" /> Aktywne Serwery</h3>
                    <p className="text-xs text-slate-500">TuneBot obsługuje {status?.guilds || 0} serwerów.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {showChangelog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#111114] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 text-center shadow-2xl">
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Aktualizacja {CHANGELOG_VERSION}</h3>
            <p className="text-slate-400 text-sm mb-8">Wprowadziliśmy poprawki stabilności i wydajności interfejsu.</p>
            <button onClick={() => { localStorage.setItem('changelog_version', CHANGELOG_VERSION); setShowChangelog(false); }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20">Rozumiem</button>
          </div>
        </div>
      )}
    </div>
  );
}
