import React from 'react';
import { 
  Activity, 
  History, 
  Terminal, 
  Settings, 
  Mail, 
  Bot, 
  Bug,
  Trash2,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BotStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  status: BotStatus | null;
  user: any;
  isLoadingUser: boolean;
  handleLogin: () => void;
  handleLogout: () => void;
  setShowBugModal: (val: boolean) => void;
  showRedeemInput: boolean;
  setShowRedeemInput: (val: boolean) => void;
  voucherInput: string;
  setVoucherInput: (val: string) => void;
  handleRedeemVoucher: () => void;
  redeemMessage: { text: string; type: 'error' | 'success' } | null;
  setRedeemMessage: (val: any) => void;
  setShowChangelog: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  status,
  user,
  isLoadingUser,
  handleLogin,
  handleLogout,
  setShowBugModal,
  showRedeemInput,
  setShowRedeemInput,
  voucherInput,
  setVoucherInput,
  handleRedeemVoucher,
  redeemMessage,
  setRedeemMessage,
  setShowChangelog
}) => {
  return (
    <aside className="w-64 bg-[#111114] border-r border-white/5 flex flex-col hidden md:flex">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="1" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="1" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="23" y2="12" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">SnajperBot</h1>
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

        <button 
          onClick={() => setActiveTab('gmail')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide",
            activeTab === 'gmail' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
          )}
        >
          <Mail className="w-4 h-4" />
          Gmail
        </button>

        <button 
          onClick={() => setActiveTab('drive')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide",
            activeTab === 'drive' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
          )}
        >
          <HardDrive className="w-4 h-4" />
          Google Drive
        </button>

        <div className="pt-2">
           <button 
             onClick={() => setShowChangelog(true)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold tracking-wide text-indigo-400 hover:bg-indigo-500/5 group"
           >
             <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
             Co nowego?
           </button>
        </div>
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
                <button onClick={() => setShowBugModal(true)} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-100 py-2 rounded-xl text-[11px] font-bold transition-all border border-red-500/10 mb-2">
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
      </div>
    </aside>
  );
};
