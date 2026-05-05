import React, { useEffect, useState } from 'react';
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
  MessageSquare,
  Zap,
  ExternalLink,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
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
const CHANGELOG_VERSION = '1.3.0';
const CHANGELOG: { version: string; date: string; features: { type: 'new' | 'fix' | 'improvement'; text: string }[] }[] = [
  {
    version: '1.3.0',
    date: '2026-05-05',
    features: [
      { type: 'new', text: 'Dodano przycisk "Dołącz do serwera twórcy" na pasku bocznym.' },
      { type: 'new', text: 'Dodano automatyczny changelog – będziesz informowany o nowych funkcjach.' },
      { type: 'fix', text: 'Naprawiono wyświetlanie statusu bota (Online/Offline) w panelu webowym.' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-04-20',
    features: [
      { type: 'new', text: 'System zgłaszania błędów (Bug Report) dla zalogowanych użytkowników.' },
      { type: 'new', text: 'Panel administracyjny – zarządzanie użytkownikami, voucherami i logami.' },
      { type: 'improvement', text: 'Lepsza jakość dźwięku dzięki optymalizacji extractorów.' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-03-10',
    features: [
      { type: 'new', text: 'Obsługa systemu Premium z voucherami.' },
      { type: 'new', text: 'Logowanie przez Discord OAuth2.' },
      { type: 'improvement', text: 'Drag & drop kolejki odtwarzania.' },
    ],
  },
];

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

// --- Components ---

function formatTime(seconds: number) {
  if (seconds === 0) return 'Live';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface SortableItemProps {
  item: QueueItem;
  onRemove: () => void | Promise<void>;
}

function SortableQueueItem({ item, onRemove }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.3 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex gap-4 items-center bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl group border border-white/5"
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-inner relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
         <div className={cn("absolute inset-0 opacity-30", item.thumbnailColor || "bg-indigo-500")} />
         <Music className="w-4 h-4 text-white/50 relative z-10 group-hover:text-white transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{item.title}</h4>
        <p className="text-xs text-slate-500 truncate">{item.author}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0 px-2 py-1 bg-black/20 rounded-md">
          {formatTime(item.duration)}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'logs' | 'admin' | 'settings'>('dashboard');
  const [clearConfirmGuildId, setClearConfirmGuildId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTargetGuild, setSearchTargetGuild] = useState<string>('');
  
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Changelog state
  const [showChangelog, setShowChangelog] = useState(false);

  // Admin state
  const [voucherType, setVoucherType] = useState('user_premium');
  const [voucherDuration, setVoucherDuration] = useState('30d');
  const [voucherMaxUses, setVoucherMaxUses] = useState(1);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [createdVoucher, setCreatedVoucher] = useState<any>(null);
  const [adminTab, setAdminTab] = useState<'vouchers' | 'users' | 'logs' | 'bugs'>('vouchers');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [analyzingLogId, setAnalyzingLogId] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{[key: number]: string}>({});

  // Bug report state (user)
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugPriority, setBugPriority] = useState('low');
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);

  // Voucher state
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setAdminUsers(data.users);
      }
    } catch {}
  };

  useEffect(() => {
    if (adminTab === 'logs') {
      fetchAdminLogs();
      fetchSystemStats();
    }
    if (adminTab === 'bugs') fetchAdminBugs();
    if (adminTab === 'vouchers') fetchAdminVouchers();
    if (adminTab === 'users') fetchAdminUsers();
  }, [adminTab]);

  const fetchAdminVouchers = async () => {
    try {
      const res = await fetch('/api/admin/vouchers');
      const data = await res.json();
      if (data.success) {
        setVouchers(data.vouchers);
      }
    } catch {}
  };

  const fetchAdminLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      if (data.success) {
        setSystemLogs(data.logs);
      }
    } catch {}
  };

  const fetchAdminBugs = async () => {
    try {
      const res = await fetch('/api/admin/bugs');
      const data = await res.json();
      if (data.success) {
        setBugReports(data.bugs);
      }
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'admin' && user?.is_admin === 1) {
      if (adminTab === 'users') {
        fetchAdminUsers();
      } else if (adminTab === 'vouchers') {
        fetchAdminVouchers();
      } else if (adminTab === 'logs') {
        fetchAdminLogs();
      } else if (adminTab === 'bugs') {
        fetchAdminBugs();
      }
    }
  }, [activeTab, adminTab, user]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.loggedIn) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    // Auto-show changelog if user hasn't seen this version
    const lastSeen = localStorage.getItem('changelog_version');
    if (lastSeen !== CHANGELOG_VERSION) {
      setShowChangelog(true);
    }
    
    // Check for mock checkout success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'success') {
      alert('Dziękujemy! Twój zakup Premium zakończył się pomyślnie.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('checkout') === 'cancel') {
      alert('Anulowano zakup Premium.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUserData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch(`/api/auth/url`);
      if (!res.ok) throw new Error('Failed to fetch auth url');
      const { url } = await res.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) alert('Please allow popups for this site');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateQuality = async (quality: string) => {
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioQuality: quality })
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev: any) => ({ ...prev, audio_quality: quality }));
      } else {
        alert(data.error || 'Błąd przy aktualizacji ustawień.');
      }
    } catch (err) {
      alert('Wystąpił błąd sieciowy.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const handleRedeemVoucher = async (guildIdToUse?: string) => {
    if (!voucherInput.trim()) return;

    try {
      const payload: any = { code: voucherInput.trim() };
      if (guildIdToUse) payload.guildId = guildIdToUse;

      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemMessage({ text: data.message || 'Aktywowano pomyślnie!', type: 'success' });
        setVoucherInput('');
        fetchUserData(); // Refresh user state
      } else {
        if (data.error === 'requires_guild_id') {
           const input = prompt("Ten voucher jest typu Guild Premium! Podaj proszę ID serwera (Guild ID), do którego chcesz przypisać premium:");
           if (input) {
             return handleRedeemVoucher(input.trim());
           } else {
             setRedeemMessage({ text: 'Anulowano. Wymagane ID serwera.', type: 'error' });
           }
        } else {
           setRedeemMessage({ text: `Błąd: ${data.error}`, type: 'error' });
        }
      }
    } catch (err) {
      console.error(err);
      setRedeemMessage({ text: 'Wystąpił błąd serwera.', type: 'error' });
    }
  };

  const handleAdminUserPremium = async (userId: string, action: 'grant' | 'extend' | 'revoke') => {
    let durationStr = '30d';
    if (action !== 'revoke') {
      const input = prompt("Podaj czas trwania (np. 30d, 1y, lifetime):", "30d");
      if (!input) return;
      durationStr = input;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, durationStr })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminUsers();
      } else {
        alert(data.error || 'Wystąpił błąd');
      }
    } catch {
      alert('Wystąpił błąd serwera');
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: voucherType,
          durationStr: voucherDuration,
          maxUses: voucherMaxUses
        })
      });
      const data = await res.json();
      if (data.success) {
        setCreatedVoucher(data);
        fetchAdminVouchers();
      } else {
        alert(data.error || 'Failed to create voucher');
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.tracks);
      } else {
        setSearchResults([]);
      }
    } catch(err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayFromWeb = async (url: string) => {
    let target = searchTargetGuild;
    if (!target && players.length > 0) {
      target = players[0].guildId;
    }
    if (!target) {
      alert("No active player found. Please use /play on Discord first to connect the bot to a voice channel.");
      return;
    }
    try {
      const res = await fetch(`/api/players/${target}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to add track.');
      } else {
        // Track added, optimize local refresh?
      }
    } catch(err) {
      console.error(err);
      alert('Error adding track. Check console.');
    }
  };

  const handleVolumeChange = async (guildId: string, newVolume: number) => {
    // Optimistic local update
    setPlayers(prev => prev.map(p => 
      p.guildId === guildId ? { ...p, volume: newVolume } : p
    ));

    try {
      await fetch(`/api/players/${guildId}/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: newVolume })
      });
    } catch (err) {
      console.error('Failed to update volume', err);
    }
  };

  const handlePlaybackToggle = async (guildId: string, currentState: 'playing' | 'paused') => {
    const newState = currentState === 'playing' ? 'paused' : 'playing';
    
    // Optimistic local update
    setPlayers(prev => prev.map(p => 
      p.guildId === guildId ? { ...p, state: newState } : p
    ));

    try {
      await fetch(`/api/players/${guildId}/playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
    } catch (err) {
      console.error('Failed to update playback state', err);
    }
  };

  const handleSkipForward = async (guildId: string) => {
    try {
      await fetch(`/api/players/${guildId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Failed to skip track', err);
    }
  };

  const handleClearQueue = async (guildId: string) => {
    try {
      await fetch(`/api/players/${guildId}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setClearConfirmGuildId(null);
    } catch (err) {
      console.error('Failed to clear queue', err);
    }
  };

  const handleRemoveTrack = async (guildId: string, trackId: string) => {
    // Optimistic update
    setPlayers(prev => prev.map(p => {
      if (p.guildId === guildId) {
        return {
          ...p,
          queue: p.queue.filter(t => t.id !== trackId),
          queueLength: p.queueLength - 1
        };
      }
      return p;
    }));

    try {
      await fetch(`/api/players/${guildId}/queue/${trackId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to remove track', err);
    }
  };

  const handleSubmitBug = async () => {
    if (!bugTitle || !bugDescription) return;
    setIsSubmittingBug(true);
    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: bugTitle, description: bugDescription, priority: bugPriority })
      });
      const data = await res.json();
      if (data.success) {
        setShowBugModal(false);
        setBugTitle('');
        setBugDescription('');
        alert('Zgłoszenie zostało wysłane. Dziękujemy!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingBug(false);
    }
  };

  const [isRepairing, setIsRepairing] = useState(false);
  const [systemStats, setSystemStats] = useState<{ last_repair?: string }>({});

  const fetchSystemStats = async () => {
    try {
      const res = await fetch('/api/admin/system/stats');
      const data = await res.json();
      if (data.success) setSystemStats(data.stats);
    } catch (err) {}
  };

  const handleSystemRepair = async () => {
    setIsRepairing(true);
    try {
      const res = await fetch('/api/admin/system/repair', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Procedura autonaprawy zakończona sukcesem.');
        fetchAdminLogs();
        fetchSystemStats();
      } else {
        alert('Naprawa się nie powiodła. Sprawdź logi.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleUpdateBugStatus = async (bugId: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/bugs/${bugId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAdminBugs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyzeWithAI = async (logId: number) => {
    setAnalyzingLogId(logId);
    try {
      const res = await fetch(`/api/admin/logs/${logId}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(prev => ({ ...prev, [logId]: data.analysis }));
        // Also refresh logs to get the solution if it was saved
        fetchAdminLogs();
      } else {
        alert(data.error || 'Błąd podczas analizy AI.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Wystąpił błąd sieciowy podczas analizy.');
    } finally {
      setAnalyzingLogId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, guildId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const player = players.find(p => p.guildId === guildId);
      if (!player) return;

      const oldIndex = player.queue.findIndex(t => t.id === active.id);
      const newIndex = player.queue.findIndex(t => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newQueue = arrayMove(player.queue, oldIndex, newIndex);
        
        // Optimistic update
        setPlayers(prev => prev.map(p => 
          p.guildId === guildId ? { ...p, queue: newQueue } : p
        ));

        try {
          await fetch(`/api/players/${guildId}/queue/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: oldIndex, to: newIndex })
          });
        } catch (err) {
          console.error('Failed to move track', err);
        }
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Fetch data periodically
    const fetchData = () => {
      fetch('/api/status')
        .then(async res => {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse /api/status. Response:', text.substring(0, 100));
            throw e;
          }
        })
        .then(data => setStatus(data))
        .catch(console.error);

      fetch('/api/players')
        .then(async res => {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse /api/players. Response:', text.substring(0, 100));
            throw e;
          }
        })
        .then(data => setPlayers(data))
        .catch(console.error);
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-200 font-sans selection:bg-[#5865F2] selection:text-white flex">
      {/* Sidebar */}
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
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide",
              activeTab === 'dashboard' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            <Activity className="w-4 h-4" />
            Dashboard
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide",
              activeTab === 'history' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            <History className="w-4 h-4" />
            History
          </button>
          
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide",
              activeTab === 'logs' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            <Terminal className="w-4 h-4" />
            System Logs
          </button>

          {user?.is_admin === 1 && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide",
                activeTab === 'admin' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
              )}
            >
              <Settings className="w-4 h-4" />
              Panel Administratora
            </button>
          )}

          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide",
              activeTab === 'settings' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        <div className="p-4 bg-[#09090B] border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-slate-300" />
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#09090B]",
                status?.state === 'online' ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
              )} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{status?.tag || 'Loading...'}</p>
              <p className="text-xs text-slate-400 truncate font-mono mt-0.5">
                {status?.mockMode ? 'Mock Mode' : (status?.state === 'online' ? 'Online' : 'Offline')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            {!isLoadingUser && (
              user ? (
                <div className="flex flex-col bg-white/5 p-3 rounded-xl border border-white/5 group">
                  <div className="flex items-center gap-3 mb-3">
                    {user.avatar ? (
                      <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-[#5865F2]" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white truncate">{user.username}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {user.premium === 1 ? <span className="text-yellow-400">Premium User</span> : 'Free Tier'}
                      </span>
                    </div>
                  </div>
                  {user.premium === 0 && (
                    <div className="mt-2">
                      {!showRedeemInput ? (
                        <button onClick={() => setShowRedeemInput(true)} className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all">
                          Zrealizuj Voucher
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            className="w-full bg-black/50 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                            placeholder="Wpisz kod..." 
                            value={voucherInput}
                            onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleRedeemVoucher()} className="flex-1 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition-colors">
                              Potwierdź
                            </button>
                            <button onClick={() => { setShowRedeemInput(false); setVoucherInput(''); setRedeemMessage(null); }} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold rounded-lg transition-colors">
                              Anuluj
                            </button>
                          </div>
                          {redeemMessage && (
                            <div className={`text-[10px] font-bold leading-tight ${redeemMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {redeemMessage.text}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => setShowBugModal(true)} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-xl text-[11px] font-bold transition-all border border-red-500/10 mb-2">
                    <Bug className="w-3.5 h-3.5" />
                    Zgłoś Błąd
                  </button>
                  <button onClick={handleLogout} className="w-full py-1.5 text-[11px] font-bold text-slate-500 hover:text-white transition-colors">
                    Log Out
                  </button>
                </div>
              ) : (
                <button onClick={handleLogin} className="w-full flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77.,77.,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
                  </svg>
                  Login with Discord
                </button>
              )
            )}
          </div>

          {/* Discord support server & changelog buttons */}
          <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
            {status?.supportServerUrl && (
              <a
                href={status.supportServerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] py-2 rounded-xl text-[11px] font-bold transition-all border border-[#5865F2]/20"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77.,77.,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
                Dołącz do serwera twórcy
                <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
              </a>
            )}
            <button
              onClick={() => setShowChangelog(true)}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white py-2 rounded-xl text-[11px] font-bold transition-all border border-white/5"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Co nowego? v{CHANGELOG_VERSION}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#09090B] h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-24 shrink-0 border-b border-white/5 bg-[#09090B] flex items-center px-8 justify-between shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {activeTab === 'dashboard' ? 'Przegląd' : 
             activeTab === 'history' ? 'Historia' : 
             activeTab === 'logs' ? 'Logi Systemu' : 
             activeTab === 'settings' ? 'Ustawienia' :
             'Panel Admina'}
          </h2>
          <div className="flex items-center gap-4">
            {status?.inviteUrl && (
              <a 
                href={status.inviteUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold tracking-wide transition-colors shadow-lg shadow-indigo-600/20"
              >
                Zaproś Bota
              </a>
            )}
            {status?.mockMode && (
              <div className="bg-[#18181B] border border-white/10 px-4 py-2 rounded-full flex gap-3 items-center h-[44px]">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-300">Token Missing • <span className="text-blue-400">Demo Mode</span></span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
          
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* User Profile Section */}
              <section className="bg-[#111114] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Settings className="w-32 h-32 rotate-12" />
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                  <div className="relative">
                    {user?.avatar ? (
                      <img 
                        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`} 
                        className="w-32 h-32 rounded-3xl shadow-2xl border-4 border-white/5 group-hover:border-indigo-500/50 transition-all" 
                        alt="Profile"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
                        <Bot className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    {user?.premium === 1 && (
                      <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg ring-4 ring-[#111114]">
                        Premium
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black text-white mb-2">{user?.username || 'Gość'}</h3>
                    <p className="text-slate-500 font-mono text-sm mb-6 flex items-center justify-center md:justify-start gap-2">
                       ID: {user?.id || '000000000000000000'}
                       <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                       {user?.premium === 1 ? 'Subskrybent Premium' : 'Użytkownik Free'}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {!user ? (
                        <button onClick={handleLogin} className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                          Połącz z Discord
                        </button>
                      ) : (
                        <button onClick={handleLogout} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/10">
                          Wyloguj się
                        </button>
                      )}
                      {user?.premium === 0 && (
                        <button 
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/stripe/checkout', { method: 'POST' });
                              const data = await res.json();
                              if (data.url) window.location.href = data.url;
                            } catch (err) { alert('Błąd przy inicjowaniu płatności.'); }
                          }}
                          className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-yellow-500/20"
                        >
                          Kup Premium
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Account Settings */}
                <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">Zarządzanie Premium</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-2">Voucher Bonusowy</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                          placeholder="Wpisz kod..."
                          value={voucherInput}
                          onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                        />
                        <button 
                          onClick={() => handleRedeemVoucher()}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 rounded-xl text-xs font-bold transition-all"
                        >
                          Zrealizuj
                        </button>
                      </div>
                      {redeemMessage && (
                        <p className={cn("text-[10px] mt-2 font-bold", redeemMessage.type === 'error' ? "text-red-400" : "text-emerald-400")}>
                          {redeemMessage.text}
                        </p>
                      )}
                    </div>
                    
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-2">Twoje Limity</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Długość kolejki</span>
                          <span className="text-white font-bold">{user?.premium === 1 ? 'Nielimitowana' : '50 utworów'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Jakość Audio</span>
                          <span className="text-emerald-400 font-bold">{user?.premium === 1 ? 'Ultra HD (320kbps)' : 'Standard'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Autonaprawa AI</span>
                          <span className="text-white font-bold">{user?.premium === 1 ? 'Priorytetowa' : 'Dostępna'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-3 flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Preferowana Jakość Audio
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'standard', label: 'Standard' },
                          { id: 'high', label: 'High' },
                          { id: 'ultra', label: 'Ultra HD' }
                        ].map((q) => (
                          <button
                            key={q.id}
                            onClick={() => handleUpdateQuality(q.id)}
                            disabled={q.id === 'ultra' && user?.premium !== 1}
                            className={cn(
                              "py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border",
                              (user?.audio_quality || 'standard') === q.id 
                                ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20" 
                                : "bg-[#18181B] border-white/5 text-slate-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                      {user?.premium !== 1 && (
                        <p className="text-[9px] text-slate-500 mt-2 italic font-medium">
                          * Opcja Ultra HD zarezerwowana dla subskrybcji Premium
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Application Info */}
                <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                      <Info className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white uppercase tracking-wider text-sm">O Aplikacji</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-300">Wersja Systemu</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 tracking-tighter">v2.4.0-stable</span>
                    </div>

                    <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                          <Server className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-300">Region Serwera</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 tracking-tighter">Europe-West</span>
                    </div>

                    <div className="pt-4 border-t border-white/5 mt-auto">
                      <button 
                        onClick={() => setShowBugModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-2xl text-xs font-bold transition-all border border-red-500/10"
                      >
                        <Bug className="w-4 h-4" />
                        Zgłoś problem techniczny
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bot Invitation Card */}
              <section className="bg-gradient-to-br from-[#5865F2] to-[#454FBF] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                   <Bot className="w-40 h-40" />
                 </div>
                 <div className="relative z-10 max-w-lg">
                    <h3 className="text-3xl font-black text-white mb-3">Dodaj TuneBot do serwera!</h3>
                    <p className="text-white/80 font-medium mb-8 leading-relaxed">
                      Zaproś bota na swój własny serwer Discord i ciesz się najlepszą jakością muzyki razem ze znajomymi. Wsparcie dla YouTube, Spotify i nie tylko.
                    </p>
                    <a 
                      href={status?.inviteUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 bg-white text-[#5865F2] px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                    >
                      Zaproś Teraz
                      <Plus className="w-5 h-5" />
                    </a>
                 </div>
              </section>

              {/* Legal/Footer */}
              <div className="flex flex-col items-center justify-center pt-8 pb-12 opacity-30 select-none">
                 <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4" />
                    <span className="font-bold tracking-tighter text-sm uppercase">TuneBot Music Engine</span>
                 </div>
                 <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Build with AI Technology • 4882ms Probe</p>
              </div>

            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl group flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Server className="w-20 h-20" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold">Servers</p>
                    <p className="text-3xl font-mono text-white">{status?.guilds || 0}</p>
                  </div>
                </div>

                <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl group flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity className="w-20 h-20" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold">Gateway Ping</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-mono text-emerald-400">{status?.ping || 0}</p>
                      <span className="text-sm text-slate-400 ml-1 font-sans">ms</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl group flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Clock className="w-20 h-20" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold">Uptime</p>
                    <p className="text-3xl font-mono text-white">{formatTime(status?.uptime || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Music Search */}
              <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <form onSubmit={handleSearch} className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search for music to add..."
                      className="w-full bg-[#18181B] border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#5865F2] transition-shadow shadow-inner"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      className="absolute inset-y-1 right-1 bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 rounded-lg text-sm font-bold transition-colors"
                      disabled={isSearching}
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                  {players.length > 1 && (
                    <select 
                      className="bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#5865F2] shadow-inner"
                      value={searchTargetGuild}
                      onChange={(e) => setSearchTargetGuild(e.target.value)}
                    >
                      <option value="">Select Target Server</option>
                      {players.map(p => (
                        <option key={p.guildId} value={p.guildId}>{p.guildName}</option>
                      ))}
                    </select>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {searchResults.map((track, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-[#18181B] hover:bg-white/5 border border-white/5 rounded-2xl p-3 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-black/50 overflow-hidden shrink-0 border border-white/10 relative">
                          {track.thumbnail ? (
                            <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                              <Music className="w-5 h-5 relative z-10" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{track.title}</h4>
                          <p className="text-xs text-slate-500 truncate">{track.author}</p>
                        </div>
                        <span className="text-xs font-mono text-slate-400 hidden sm:block shrink-0 px-2 py-1 bg-black/30 rounded-md">
                          {track.duration}
                        </span>
                        <button
                          onClick={() => handlePlayFromWeb(track.url)}
                          className="shrink-0 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-[#5865F2] hover:text-white text-slate-400 rounded-xl transition-all shadow-sm"
                          title="Add to Queue"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Voice Connections */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-5 h-5 text-[#5865F2]" />
                  <h3 className="text-lg font-bold text-white">Active Players</h3>
                  <span className="bg-white/10 text-slate-300 text-xs font-bold px-2.5 py-0.5 rounded-full ml-2">
                    {players.length}
                  </span>
                </div>

                {players.length === 0 ? (
                  <div className="bg-[#111114] border border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <Music className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-lg font-bold text-white mb-2">No active streams</p>
                    <p className="text-slate-400 text-sm max-w-sm">
                      The bot isn't playing music in any servers right now. Join a voice channel and use <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-xs">/play</code> to begin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {players.length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                        <Music className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-white/50 mb-2">Brak aktywnych odtwarzaczy</h3>
                        <p className="text-sm max-w-sm text-center">
                          Użyj komendy <code className="bg-black/30 px-2 py-1 rounded text-indigo-400">/play</code> na swoim serwerze Discord, aby rozpocząć odtwarzanie muzyki!
                        </p>
                      </div>
                    ) : (
                      players.map((player) => (
                      <div key={player.guildId} className="bg-[#111114] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col shadow-2xl">
                        
                        <div className="flex justify-between items-center mb-6 relative z-10">
                          <div className="flex items-center gap-2 text-slate-400 border border-white/5 bg-white/5 px-3 py-1.5 rounded-full shadow-inner tracking-wide">
                            <Server className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold text-white text-xs truncate max-w-[150px]">{player.guildName}</span>
                            <span className="text-xs ml-1 opacity-60">#{player.channelName}</span>
                          </div>
                          <span className="text-xs bg-white/5 px-2 py-1 rounded text-slate-400 font-mono tracking-tighter">{player.queueLength} in queue</span>
                        </div>

                        <div className="flex gap-6 relative z-10">
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 shadow-2xl flex-shrink-0 relative group overflow-hidden">
                            {player.nowPlaying ? (player.nowPlaying.thumbnail ? (
                              <img src={player.nowPlaying.thumbnail} alt="thumbnail" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-10 h-10 text-white/50" />
                              </div>
                            )) : (
                              <div className="w-full h-full flex items-center justify-center bg-black/40">
                                <Music className="w-10 h-10 text-white/20" />
                              </div>
                            )}

                            {player.nowPlaying && player.state === 'playing' && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="flex items-end gap-[3px] h-8">
                                  <div className="w-1 bg-[#5865F2] animate-[music-wave_1s_ease-in-out_infinite]" style={{ height: '60%' }}></div>
                                  <div className="w-1 bg-[#5865F2] animate-[music-wave_1.2s_ease-in-out_infinite]" style={{ height: '100%' }}></div>
                                  <div className="w-1 bg-[#5865F2] animate-[music-wave_0.8s_ease-in-out_infinite]" style={{ height: '40%' }}></div>
                                  <div className="w-1 bg-[#5865F2] animate-[music-wave_1.1s_ease-in-out_infinite]" style={{ height: '80%' }}></div>
                                </div>
                                <div className="absolute top-2 right-2 bg-indigo-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-lg">
                                  Live
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="text-blue-400 font-bold uppercase tracking-widest text-[10px] mb-2">Currently Playing</span>
                            <h2 className="text-2xl font-extrabold text-white mb-1 leading-tight tracking-tight truncate hover:text-blue-400 cursor-pointer transition-colors">
                              {player.nowPlaying ? player.nowPlaying.title : 'Brak utworu'}
                            </h2>
                            <p className="text-sm text-slate-400 font-medium truncate">
                              {player.nowPlaying ? player.nowPlaying.author : 'Brak autora'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 relative z-10">
                          <div className="flex justify-between text-xs font-mono text-slate-500 mb-2">
                            <span>{player.nowPlaying ? formatTime(player.nowPlaying.current) : '0:00'}</span>
                            <span>{!player.nowPlaying ? '0:00' : player.nowPlaying.duration === 0 ? 'LIVE' : formatTime(player.nowPlaying.duration)}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-full" 
                              style={{ 
                                width: !player.nowPlaying ? '0%' : player.nowPlaying.duration === 0 
                                  ? '100%' 
                                  : `${(player.nowPlaying.current / player.nowPlaying.duration) * 100}%` 
                              }} 
                            />
                          </div>
                        </div>

                        <div className="mt-6 bg-[#5865F2] rounded-3xl p-4 flex items-center shadow-xl shadow-indigo-600/20 relative">
                          {/* Volume Control */}
                          <div className="flex-1 flex items-center gap-3 pl-2">
                            <button 
                              onClick={() => handlePlaybackToggle(player.guildId, player.state)}
                              className="text-white/80 hover:text-white transition-colors block md:hidden lg:block xl:hidden 2xl:block"
                              title={player.state === 'playing' ? "Pause" : "Play"}
                            >
                              {player.state === 'playing' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                            </button>
                            <Volume2 className="w-5 h-5 text-white/80 shrink-0" />
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={player.volume}
                              onChange={(e) => handleVolumeChange(player.guildId, parseInt(e.target.value))}
                              className="w-full max-w-[80px] h-1.5 bg-black/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                            />
                          </div>

                          {/* Center Playback Controls */}
                          <div className="flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                            <button className="text-white/70 hover:text-white transition-colors">
                              <SkipBack className="w-5 h-5 fill-current" />
                            </button>
                            <button 
                              onClick={() => handlePlaybackToggle(player.guildId, player.state)}
                              className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg hover:scale-105 transition-transform"
                            >
                              {player.state === 'playing' ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                            <button 
                              onClick={() => handleSkipForward(player.guildId)}
                              className="text-white/70 hover:text-white transition-colors"
                            >
                              <SkipForward className="w-5 h-5 fill-current" />
                            </button>
                          </div>

                          {/* Spacing for balance */}
                          <div className="flex-1"></div>
                        </div>

                        {/* Queue Section */}
                        {player.queue && player.queue.length > 0 && (
                          <div className="mt-6 border-t border-white/5 pt-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-2 text-slate-300">
                                <List className="w-4 h-4 text-indigo-400" />
                                <h3 className="font-bold text-sm tracking-wide uppercase">Up Next</h3>
                              </div>
                              <button 
                                onClick={() => setClearConfirmGuildId(player.guildId)}
                                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors border border-red-500/20 flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3 h-3" />
                                Clear Queue
                              </button>
                            </div>
                            <div className="space-y-3">
                              <DndContext 
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => handleDragEnd(event, player.guildId)}
                              >
                                <SortableContext 
                                  items={player.queue.slice(0, 10).map(i => i.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {player.queue.slice(0, 10).map((item) => (
                                    <SortableQueueItem 
                                      key={item.id} 
                                      item={item} 
                                      onRemove={() => handleRemoveTrack(player.guildId, item.id)} 
                                    />
                                  ))}
                                </SortableContext>
                              </DndContext>
                              {player.queue.length > 10 && (
                                <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2 hover:text-indigo-400 cursor-pointer transition-colors">
                                  + {player.queue.length - 10} more tracks in queue
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    )))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-6xl mx-auto h-full flex flex-col">
              <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-2xl flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-6 shrink-0">
                  <History className="w-6 h-6 text-[#5865F2]" />
                  <h2 className="text-2xl font-bold text-white tracking-tight">Playback History</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                  {players.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                      <History className="w-16 h-16 mb-4 opacity-20" />
                      <p>Włącz odtwarzanie, aby zobaczyć historię.</p>
                    </div>
                  ) : (
                    players.map(player => (
                      <div key={player.guildId} className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 border-b border-white/5 pb-2">
                          <Server className="w-5 h-5 text-indigo-400" />
                          <h3 className="font-bold text-lg">{player.guildName}</h3>
                        </div>
                        
                        {!player.history || player.history.length === 0 ? (
                          <p className="text-slate-500 text-sm italic">Brak historii dla tego serwera.</p>
                        ) : (
                          <div className="space-y-2">
                            {player.history.map((item, idx) => (
                              <div key={idx} className="flex gap-4 items-center bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl group border border-white/5">
                                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-indigo-500/20 text-indigo-400 relative overflow-hidden">
                                   <Music className="w-4 h-4 text-indigo-300 relative z-10" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                                    {item.url ? (
                                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.title}</a>
                                    ) : item.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                                    {item.author}
                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                    {new Date(item.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0 px-2 py-1 bg-black/20 rounded-md">
                                  {item.duration}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="max-w-6xl mx-auto h-full flex flex-col">
              <div className="bg-[#111114] rounded-3xl flex-1 border border-white/5 shadow-2xl p-6 font-mono text-sm overflow-hidden flex flex-col">
                <div className="text-slate-500 mb-4 pb-4 border-b border-white/5 flex items-center justify-between shrink-0 font-bold uppercase tracking-widest text-[10px]">
                  <span>System Output</span>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  <div className="text-emerald-400">[System] Dashboard initialized.</div>
                  <div className="text-slate-300">[Discord] Attempting connection...</div>
                  {status?.mockMode ? (
                    <>
                      <div className="text-amber-400">[Warning] No DISCORD_TOKEN found in environment.</div>
                      <div className="text-slate-300">[System] Running in fallback Mock Mode for UI demo.</div>
                    </>
                  ) : (
                    <div className="text-emerald-400">[Discord] Successfully authenticated as {status?.tag}</div>
                  )}
                  <div className="text-slate-300">[HTTP] Starting background API polling...</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && user?.is_admin === 1 && (
            <div className="max-w-6xl mx-auto h-full flex flex-col space-y-6">
              <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-2xl flex-shrink-0">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <div className="flex items-center gap-2">
                    <Settings className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-2xl font-bold text-white tracking-tight">Panel Administratora</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#18181B] border border-emerald-500/20 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Zap className="w-5 h-5" />
                         </div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stan Systemu</div>
                      </div>
                      <div className="text-2xl font-black text-white">Aktywny</div>
                      <div className="text-[10px] text-emerald-400 mt-1">Autonaprawa: Włączona</div>
                    </div>
                    
                    <div className="bg-[#18181B] border border-red-500/20 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                            <AlertCircle className="w-5 h-5" />
                         </div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Błędy (24h)</div>
                      </div>
                      <div className="text-2xl font-black text-white">{systemLogs.filter(l => l.level === 'error').length}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Wszystkie logi: {systemLogs.length}</div>
                    </div>

                    <div className="bg-[#18181B] border border-indigo-500/20 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Info className="w-5 h-5" />
                         </div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rozwiązania AI</div>
                      </div>
                      <div className="text-2xl font-black text-white">{systemLogs.filter(l => l.solution).length}</div>
                      <div className="text-[10px] text-indigo-400 mt-1">Skuteczność: 100%</div>
                    </div>
                    
                    <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-white/5 rounded-lg text-white">
                            <Zap className="w-5 h-5" />
                         </div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ostatnia Naprawa</div>
                      </div>
                      <div className="text-2xl font-black text-white">
                        {systemStats.last_repair ? new Date(parseInt(systemStats.last_repair)).toLocaleTimeString() : 'Brak'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {systemStats.last_repair ? new Date(parseInt(systemStats.last_repair)).toLocaleDateString() : 'Kliknij przycisk poniżej, aby wymusić.'}
                      </div>
                    </div>
                  </div>

                  <div className="flex bg-[#18181B] rounded-lg p-1 border border-white/5 mb-6">
                    <button onClick={() => setAdminTab('vouchers')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${adminTab === 'vouchers' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>Vouchery</button>
                    <button onClick={() => setAdminTab('users')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${adminTab === 'users' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>Użytkownicy</button>
                    <button onClick={() => setAdminTab('logs')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${adminTab === 'logs' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>Logi</button>
                    <button onClick={() => setAdminTab('bugs')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${adminTab === 'bugs' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>Błędy</button>
                  </div>
                </div>
                
                {adminTab === 'vouchers' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Tworzenie Vouchera</h3>
                      <form onSubmit={handleCreateVoucher} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Typ Vouchera</label>
                          <select 
                            className="w-full bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                            value={voucherType}
                            onChange={(e) => setVoucherType(e.target.value)}
                          >
                            <option value="user_premium">User Premium</option>
                            <option value="guild_premium">Guild Premium</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Czas Trwania</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['1d', '7d', '30d', '1y', 'lifetime'].map(d => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setVoucherDuration(d)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${voucherDuration === d ? 'bg-indigo-500 text-white border-transparent' : 'bg-[#18181B] text-slate-400 hover:text-white border border-white/10'}`}
                              >
                                {d === '1d' ? '1 Dzień' : d === '7d' ? '1 Tydzień' : d === '30d' ? '1 Miesiąc' : d === '1y' ? '1 Rok' : d === 'lifetime' ? 'Zawsze' : d}
                              </button>
                            ))}
                          </div>
                          <input 
                            type="text" 
                            className="w-full bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                            value={voucherDuration}
                            onChange={(e) => setVoucherDuration(e.target.value)}
                            placeholder="Wpisz własną (np. 14d, 2y, 10h)"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Maks. Użyć</label>
                          <input 
                            type="number" 
                            min="1"
                            className="w-full bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                            value={voucherMaxUses}
                            onChange={(e) => setVoucherMaxUses(parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-600/20"
                        >
                          Utwórz Voucher
                        </button>
                      </form>
                    </div>

                    <div>
                      {createdVoucher ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 h-full flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Voucher Utworzony!</h4>
                             <button onClick={() => setCreatedVoucher(null)} className="text-slate-500 hover:text-white text-xs">Zamknij</button>
                          </div>
                          <div className="bg-black/40 border border-black/20 rounded-xl p-4 mb-4 text-center">
                            <code className="text-3xl font-mono font-bold text-white tracking-widest select-all">{createdVoucher.code}</code>
                          </div>
                          <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Typ</span>
                              <span className="font-bold">{createdVoucher.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Czas Trwania</span>
                              <span className="font-bold">{createdVoucher.duration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Maks. Użyć</span>
                              <span className="font-bold">{createdVoucher.maxUses}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center opacity-40">
                           <List className="w-10 h-10 mb-4" />
                           <p className="text-sm">Tutaj pojawi się kod po utworzeniu.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {adminTab === 'vouchers' && (
                  <div className="mt-12 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">Aktywne Vouchery</h3>
                      <span className="text-xs text-slate-500">{vouchers.length} aktywnych kodów</span>
                    </div>
                    {vouchers.length === 0 ? (
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center text-slate-500 italic text-sm">
                        Brak aktywnych voucherów. Utwórz nowy powyżej.
                      </div>
                    ) : (
                      <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-black/20 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-6 py-3 font-bold">Kod</th>
                              <th className="px-6 py-3 font-bold">Typ</th>
                              <th className="px-6 py-3 font-bold">Czas trwania</th>
                              <th className="px-6 py-3 font-bold">Użycia</th>
                              <th className="px-6 py-3 font-bold">Utworzono</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {vouchers.map(v => (
                              <tr key={v.code} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                  <code className="text-white font-mono font-bold bg-indigo-500/10 px-2 py-1 rounded select-all group-hover:bg-indigo-500/20 transition-colors">
                                    {v.code}
                                  </code>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    v.type === 'user_premium' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                                  )}>
                                    {v.type === 'user_premium' ? 'User' : 'Guild'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                  {v.duration ? ms(v.duration, { long: true }).replace('days', 'dni').replace('year', 'rok') : 'Lifetime'}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white/5 h-1.5 rounded-full w-24 overflow-hidden">
                                      <div className="bg-indigo-500 h-full" style={{ width: `${(v.uses / v.max_uses) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-mono">{v.uses}/{v.max_uses}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-[10px] text-slate-500">
                                  {new Date(v.created_at).toLocaleString('pl-PL')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {adminTab === 'users' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Zarządzanie Użytkownikami</h3>
                    <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-black/20 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Premium Status</th>
                            <th className="px-6 py-3">Wygasa</th>
                            <th className="px-6 py-3 text-right">Akcje</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {adminUsers.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 flex items-center gap-3">
                                {u.avatar && <img src={`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`} className="w-8 h-8 rounded-full" alt="avatar" />}
                                <div>
                                  <div className="font-bold text-white">{u.username}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{u.id}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {u.premium === 1 ? (
                                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-md text-xs font-bold tracking-wide">Premium</span>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded-md text-xs font-bold tracking-wide">Free</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {u.premium_expires_at ? new Date(u.premium_expires_at).toLocaleString('pl-PL') : (u.premium === 1 ? 'Dożywotnio' : '-')}
                              </td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                {u.premium === 1 ? (
                                  <>
                                    <button onClick={() => handleAdminUserPremium(u.id, 'extend')} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors">Przedłuż</button>
                                    <button onClick={() => handleAdminUserPremium(u.id, 'revoke')} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors">Zabierz</button>
                                  </>
                                ) : (
                                  <button onClick={() => handleAdminUserPremium(u.id, 'grant')} className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold transition-colors">Nadaj Premium</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {adminTab === 'bugs' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Zgłoszenia Błędów</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {bugReports.length === 0 ? (
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center text-slate-500 italic">
                          Brak aktywnych zgłoszeń błędów.
                        </div>
                      ) : (
                        bugReports.map((bug: any) => (
                          <div key={bug.id} className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                                  bug.priority === 'high' ? "bg-red-500/10 text-red-400" :
                                  bug.priority === 'medium' ? "bg-amber-500/10 text-amber-400" :
                                  "bg-indigo-500/10 text-indigo-400"
                                )}>
                                  <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-white font-bold">{bug.title}</h4>
                                  <div className="text-[10px] text-slate-500">
                                    Od: <span className="text-slate-300 font-bold">{bug.reporter}</span> • {new Date(bug.created_at).toLocaleString('pl-PL')}
                                  </div>
                                </div>
                              </div>
                              <select 
                                value={bug.status}
                                onChange={(e) => handleUpdateBugStatus(bug.id, e.target.value)}
                                className={cn(
                                  "text-xs font-bold rounded-lg px-3 py-1.5 border border-white/10 bg-black/30",
                                  bug.status === 'open' ? "text-red-400" :
                                  bug.status === 'in_progress' ? "text-amber-400" :
                                  bug.status === 'resolved' ? "text-emerald-400" :
                                  "text-slate-500"
                                )}
                              >
                                <option value="open">Otwarte</option>
                                <option value="in_progress">W trakcie</option>
                                <option value="resolved">Rozwiązane</option>
                                <option value="closed">Zamknięte</option>
                              </select>
                            </div>
                            <p className="text-sm text-slate-400 bg-black/20 p-4 rounded-xl mb-4 leading-relaxed whitespace-pre-wrap">
                              {bug.description}
                            </p>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Priorytet:</span>
                               <span className={cn(
                                 "text-[10px] font-bold uppercase",
                                 bug.priority === 'high' ? "text-red-500" :
                                 bug.priority === 'medium' ? "text-amber-500" :
                                 "text-slate-400"
                               )}>{bug.priority}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {adminTab === 'logs' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                       <div>
                         <h3 className="text-lg font-bold text-white uppercase tracking-wider">Logi Systemowe</h3>
                         <p className="text-[10px] text-slate-500">Monitorowanie błędów i automatyczna diagnostyka AI</p>
                       </div>
                       <div className="flex items-center gap-3">
                         <button 
                           onClick={handleSystemRepair} 
                           disabled={isRepairing}
                           className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[11px] font-bold transition-all border border-emerald-500/10 flex items-center gap-2 group disabled:opacity-50"
                         >
                           <Zap className={cn("w-3.5 h-3.5", isRepairing && "animate-pulse")} />
                           {isRepairing ? 'Naprawianie...' : 'Uruchom Autonaprawę'}
                         </button>
                         <button onClick={fetchAdminLogs} className="p-2 bg-white/5 hover:bg-white/10 text-indigo-400 rounded-xl transition-all">
                            <History className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                    <div className="bg-[#18181B] rounded-xl border border-white/5 overflow-hidden">
                      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-black/20 text-xs uppercase text-slate-500 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-3 font-bold">Czas</th>
                              <th className="px-6 py-3 font-bold">Level</th>
                              <th className="px-6 py-3 font-bold">Źródło</th>
                              <th className="px-6 py-3 font-bold">Wiadomość</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {systemLogs.map((log, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">
                                  {new Date(log.created_at).toLocaleString('pl-PL')}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                    log.level === 'error' ? "bg-red-500/10 text-red-500" :
                                    log.level === 'warn' ? "bg-amber-500/10 text-amber-500" :
                                    "bg-indigo-500/10 text-indigo-500"
                                  )}>
                                    {log.level}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                  {log.source}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="text-white font-medium">{log.message}</div>
                                      
                                      {log.solution && (
                                        <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center">
                                              <Zap className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Auto-Fix & Diagnosis</span>
                                          </div>
                                          <div className="text-xs text-slate-300 leading-relaxed italic">
                                            {log.solution}
                                          </div>
                                        </div>
                                      )}

                                      {log.details && (
                                        <details className="mt-1">
                                          <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-indigo-400 outline-none">Szczegóły techniczne</summary>
                                          <pre className="mt-2 p-3 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono text-slate-500 overflow-x-auto whitespace-pre-wrap max-w-lg">
                                            {log.details}
                                          </pre>
                                        </details>
                                      )}
                                      
                                      {aiAnalysis[log.id] && (
                                        <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                          <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                                              <Plus className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">AI Audit & Repair</span>
                                          </div>
                                          <div className="markdown-body text-xs text-slate-300 leading-relaxed prose prose-invert prose-xs">
                                            <ReactMarkdown>{aiAnalysis[log.id]}</ReactMarkdown>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <button 
                                      onClick={() => handleAnalyzeWithAI(log.id)}
                                      disabled={analyzingLogId === log.id}
                                      className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold transition-all border border-indigo-500/10 disabled:opacity-50"
                                    >
                                      {analyzingLogId === log.id ? (
                                        <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Info className="w-3 h-3" />
                                      )}
                                      {analyzingLogId === log.id ? 'Analizowanie...' : 'Analizuj AI'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Confirmation Modal Overlay */}
      {clearConfirmGuildId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Clear Queue?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Are you sure you want to clear all upcoming songs in this queue? This action cannot be undone.
            </p>
            <div className="flex w-full gap-4">
              <button 
                onClick={() => setClearConfirmGuildId(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleClearQueue(clearConfirmGuildId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-500/20"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111114] border border-white/5 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Bug className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Zgłoś błąd</h3>
                <p className="text-xs text-slate-500">Pomóż nam ulepszyć aplikację.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tytuł błędu</label>
                <input 
                  type="text" 
                  className="w-full bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Krótki opis błędu..."
                  value={bugTitle}
                  onChange={e => setBugTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Opis (kroki do powtórzenia)</label>
                <textarea 
                  className="w-full bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 h-32 resize-none"
                  placeholder="Co się stało? Jak do tego doszło?"
                  value={bugDescription}
                  onChange={e => setBugDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Priorytet</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map(p => (
                    <button 
                      key={p}
                      onClick={() => setBugPriority(p)}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                        bugPriority === p 
                          ? (p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white')
                          : "bg-white/5 text-slate-500 hover:text-white"
                      )}
                    >
                      {p === 'low' ? 'Niski' : p === 'medium' ? 'Średni' : 'Wysoki'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowBugModal(false)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-xl text-sm transition-colors"
                disabled={isSubmittingBug}
              >
                Anuluj
              </button>
              <button 
                onClick={handleSubmitBug}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
                disabled={isSubmittingBug || !bugTitle || !bugDescription}
              >
                {isSubmittingBug ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111114] border border-white/5 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white">Co nowego?</h3>
                <p className="text-xs text-slate-500">Historia aktualizacji TuneBot Dashboard</p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('changelog_version', CHANGELOG_VERSION);
                  setShowChangelog(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-6 pr-1">
              {CHANGELOG.map((entry) => (
                <div key={entry.version} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black rounded-full">
                      v{entry.version}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{entry.date}</span>
                    {entry.version === CHANGELOG_VERSION && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                        Nowość
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {entry.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <span className={cn(
                          "mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[9px] font-black",
                          f.type === 'new' ? "bg-emerald-500/15 text-emerald-400" :
                          f.type === 'fix' ? "bg-red-500/15 text-red-400" :
                          "bg-blue-500/15 text-blue-400"
                        )}>
                          {f.type === 'new' ? 'N' : f.type === 'fix' ? 'F' : 'U'}
                        </span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  localStorage.setItem('changelog_version', CHANGELOG_VERSION);
                  setShowChangelog(false);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/20"
              >
                Rozumiem, zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
