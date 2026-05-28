import React from 'react';
import { Server, Activity, Clock, Search, Music, Plus, Play, Pause, SkipBack, SkipForward, Volume2, Trash2, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { 
  BotStatus, 
  PlayerStatus, 
  QueueItem 
} from '../types';
import { cn } from '../lib/utils';
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
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CHANGELOG } from '../constants';

interface DashboardTabProps {
  status: BotStatus | null;
  players: PlayerStatus[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isSearching: boolean;
  searchTargetGuild: string;
  setSearchTargetGuild: (v: string) => void;
  searchResults: any[];
  handlePlayFromWeb: (url: string) => void;
  formatTime: (s: number) => string;
  handlePlaybackToggle: (guildId: string, state: any) => void;
  handleVolumeChange: (guildId: string, vol: number) => void;
  handleSkipForward: (guildId: string) => void;
  setClearConfirmGuildId: (id: string | null) => void;
  handleDragEnd: (event: DragEndEvent, guildId: string) => void;
  handleRemoveTrack: (guildId: string, trackId: string) => void;
  sensors: any;
  setShowChangelog: (v: boolean) => void;
}

function SortableQueueItem({ item, onRemove }: { item: QueueItem, onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.3 : 1
  };
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
        <button onClick={onRemove} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  status, players, searchQuery, setSearchQuery, handleSearch, isSearching, searchTargetGuild, setSearchTargetGuild, searchResults, handlePlayFromWeb, formatTime, handlePlaybackToggle, handleVolumeChange, handleSkipForward, setClearConfirmGuildId, handleDragEnd, handleRemoveTrack, sensors, setShowChangelog
}) => {
  const latestVersion = CHANGELOG[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* What's New Card */}
      <div 
        onClick={() => setShowChangelog(true)}
        className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:border-indigo-500/40 transition-all"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all rotate-12">
          <Sparkles className="w-24 h-24 text-indigo-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Sparkles className="w-7 h-7 text-indigo-400 group-hover:animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">Nowość v{latestVersion.version}</span>
              <h3 className="text-lg font-bold text-white">{latestVersion.title}</h3>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              Dodano {latestVersion.features.length} nowe funkcje i ulepszenia. Kliknij, aby zobaczyć szczegóły aktualizacji.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-indigo-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
            Zobacz zmiany
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl group flex flex-col justify-center transition-all hover:border-emerald-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Server className="w-20 h-20" /></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold">Servers</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-mono text-white">{status?.guilds || 0}</p>
              {status?.state !== 'online' && (
                <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-black animate-pulse uppercase">Connecting...</span>
              )}
            </div>
          </div>
        </div>
        <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl group flex flex-col justify-center transition-all hover:border-emerald-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity className="w-20 h-20" /></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold">Gateway Ping</p>
            <div className="flex items-baseline"><p className="text-3xl font-mono text-emerald-400">{status?.ping || 0}</p><span className="text-sm text-slate-400 ml-1">ms</span></div>
          </div>
        </div>
        <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl group flex flex-col justify-center transition-all hover:border-indigo-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Clock className="w-20 h-20" /></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold">Uptime</p>
            <p className="text-3xl font-mono text-white">{formatTime(status?.uptime || 0)}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#111114] to-[#1a1a20] border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl group flex flex-col justify-center transition-all hover:border-indigo-500/40">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="w-20 h-20 text-indigo-400" /></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold flex items-center gap-2">
              Memory Performance
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-mono text-indigo-400">{status?.memory?.rss || '0'}</p>
              <span className="text-xs text-slate-500 font-bold">/ 3072 MB</span>
            </div>
            <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                 style={{ width: `${Math.min(100, ((status?.memory?.rss || 0) / 3072) * 100)}%` }} 
               />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
               <span className="text-[9px] font-black uppercase text-indigo-500/80 tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded leading-none">Ultra Stable 3GB</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-2xl">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input type="text" placeholder="Search for music..." className="w-full bg-[#18181B] border border-white/10 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#5865F2]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <button type="submit" className="absolute right-1 top-1 bottom-1 bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 rounded-lg text-sm font-bold disabled:opacity-50" disabled={isSearching}>{isSearching ? '...' : 'Search'}</button>
          </div>
          {players.length > 1 && (
            <select className="bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3.5" value={searchTargetGuild} onChange={e => setSearchTargetGuild(e.target.value)}>
              <option value="">Target Server</option>
              {players.map(p => <option key={p.guildId} value={p.guildId}>{p.guildName}</option>)}
            </select>
          )}
        </form>
        {searchResults.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {searchResults.map((track, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-[#18181B] hover:bg-white/5 border border-white/5 rounded-2xl p-3 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-black/50 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                  {track.thumbnail ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-200 truncate">{track.title}</h4>
                  <p className="text-xs text-slate-500 truncate">{track.author}</p>
                </div>
                <span className="text-xs font-mono text-slate-400 hidden sm:block shrink-0 px-2 py-1 bg-black/30 rounded-md">{track.duration}</span>
                <button onClick={() => handlePlayFromWeb(track.url)} className="shrink-0 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-[#5865F2] hover:text-white text-slate-400 rounded-xl transition-all"><Plus className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Music className="w-5 h-5 text-[#5865F2]" />Active Players <span className="bg-white/10 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{players.length}</span></h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {players.map(player => (
            <div key={player.guildId} className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-slate-400 bg-white/5 px-3 py-1.5 rounded-full text-xs font-bold"><Server className="w-4 h-4 text-emerald-400" />{player.guildName} <span className="opacity-60 font-normal">#{player.channelName}</span></div>
                <span className="text-xs text-slate-400 font-mono">{player.queueLength} in queue</span>
              </div>
              <div className="flex gap-6 mb-8">
                <div className="w-32 h-32 rounded-2xl bg-indigo-600/20 shadow-2xl overflow-hidden shrink-0 flex items-center justify-center">
                  {player.nowPlaying ? <img src={player.nowPlaying.thumbnail} alt="" className="w-full h-full object-cover" /> : <Music className="w-10 h-10 text-white/10" />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h2 className="text-2xl font-black text-white truncate leading-tight mb-1">{player.nowPlaying?.title || 'Brak utworu'}</h2>
                  <p className="text-sm text-slate-400 font-medium truncate">{player.nowPlaying?.author || 'Brak autora'}</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
                  <span>{player.nowPlaying ? formatTime(player.nowPlaying.current) : '0:00'}</span>
                  <span>{player.nowPlaying ? (player.nowPlaying.duration === 0 ? 'LIVE' : formatTime(player.nowPlaying.duration)) : '0:00'}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all" style={{ width: !player.nowPlaying ? '0%' : (player.nowPlaying.duration === 0 ? '100%' : `${(player.nowPlaying.current / player.nowPlaying.duration) * 100}%`) }} />
                </div>
              </div>
              <div className="bg-[#5865F2] rounded-2xl p-4 flex items-center gap-4 relative">
                 <div className="flex items-center gap-3">
                   <Volume2 className="w-5 h-5 text-white/70" />
                   <input type="range" min="0" max="100" value={player.volume} onChange={e => handleVolumeChange(player.guildId, parseInt(e.target.value))} className="w-20 h-1 accent-white" />
                 </div>
                 <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                   <button onClick={() => handlePlaybackToggle(player.guildId, player.state)} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-lg hover:scale-105 transition-all">
                     {player.state === 'playing' ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
                   </button>
                   <button onClick={() => handleSkipForward(player.guildId)} className="text-white/80 hover:text-white transition-colors"><SkipForward className="fill-current" /></button>
                 </div>
                 <div className="ml-auto">
                    <button onClick={() => setClearConfirmGuildId(player.guildId)} className="p-2 text-white/50 hover:text-white transition-colors"><Trash2 className="w-5 h-5" /></button>
                 </div>
              </div>
              <div className="mt-8">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Upcoming Next</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {player.queue.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 text-xs font-bold border border-dashed border-white/5 rounded-2xl">Kolejka jest pusta.</div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, player.guildId)}>
                      <SortableContext items={player.queue.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {player.queue.map(item => <SortableQueueItem key={item.id} item={item} onRemove={() => handleRemoveTrack(player.guildId, item.id)} />)}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
