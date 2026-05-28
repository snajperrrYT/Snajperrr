import React from 'react';
import { History, Music, ExternalLink, Activity } from 'lucide-react';
import { PlayerStatus, HistoryItem } from '../types';

interface HistoryTabProps {
  players: PlayerStatus[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ players }) => {
  const allHistory = players.flatMap(p => 
    p.history.map(h => ({ ...h, guildName: p.guildName }))
  ).sort((a, b) => b.playedAt - a.playedAt);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <History className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-white">Recent Tracks</h2>
      </div>

      {allHistory.length === 0 ? (
        <div className="bg-[#111114] border border-white/5 rounded-3xl p-12 text-center shadow-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Activity className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-bold mb-1">No history data yet</p>
          <p className="text-slate-400 text-sm">Once the bot starts playing music, your session history will appear here.</p>
        </div>
      ) : (
        <div className="bg-[#111114] border border-white/5 rounded-3xl p-4 shadow-2xl overflow-hidden">
          <div className="space-y-1">
            {allHistory.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors rounded-2xl group border border-transparent hover:border-white/5">
                <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/10">
                  <Music className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                    {item.author} 
                    <span className="w-1 h-1 bg-slate-800 rounded-full" /> 
                    <span className="text-[10px] font-black uppercase text-indigo-500/70">{(item as any).guildName}</span>
                  </p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-mono text-slate-500">{new Date(item.playedAt).toLocaleTimeString()}</p>
                    <p className="text-[10px] uppercase font-black text-slate-700 tracking-wider">Played</p>
                  </div>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
