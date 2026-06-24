import React from 'react';
import { Settings, Plus, List, Trash2, Zap, AlertCircle, Info, Activity, Wand2, ShieldCheck, ArrowUpRight, Loader2, Play, Bot, RefreshCw, Terminal, Cpu, HardDrive, Users, Music, Bell, Sparkles, Key, Eye, EyeOff, Save, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { CHANGELOG } from '../constants';

interface AdminTabProps {
  adminTab: 'vouchers' | 'users' | 'logs' | 'bugs' | 'updates' | 'diag' | 'players' | 'news' | 'config';
  setAdminTab: (v: 'vouchers' | 'users' | 'logs' | 'bugs' | 'updates' | 'diag' | 'players' | 'news' | 'config') => void;
  systemLogs: any[];
  systemStats: any;
  voucherType: string;
  setVoucherType: (v: string) => void;
  voucherDuration: string;
  setVoucherDuration: (v: string) => void;
  voucherMaxUses: number;
  setVoucherMaxUses: (v: number) => void;
  handleCreateVoucher: (e: React.FormEvent) => void;
  createdVoucher: any;
  setCreatedVoucher: (v: any) => void;
  vouchers: any[];
  adminUsers: any[];
  handleAdminUserPremium: (id: string, action: any) => void;
  analyzingLogId: number | null;
  handleAnalyzeWithAI: (id: number) => void;
  aiAnalysis: Record<number, string>;
  bugReports: any[];
  handleUpdateBugStatus: (id: number, status: string) => void;
  versionInfo: any;
  checkingVersion: boolean;
  fetchVersionInfo: () => void;
  handleTriggerUpdate: () => void;
  isUpdating: boolean;
  handleSystemRepair: () => void;
  isRepairing: boolean;
  fetchAdminLogs: () => void;
  diagData: any;
  handleDeleteVoucher: (code: string) => void;
  handleSendAnnouncement: (title: string, msg: string) => void;
}

const DiagnosticView = ({ data, handleSystemRepair, isRepairing }: { data: any, handleSystemRepair: () => void, isRepairing: boolean }) => {
  if (!data) return <div className="p-12 text-center text-slate-500">Ładowanie diagnostyki...</div>;

  const discord = data.discord || {};
  const env = data.env || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Bot className="w-6 h-6 text-[#5865F2]" />
          Status Discord Bot
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase">Token Set</span>
            <span className={cn("text-xs font-bold", discord.tokenSet ? "text-emerald-500" : "text-red-500")}>{discord.tokenSet ? 'TAK' : 'BRAK'}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase">Status Połączenia</span>
            <span className={cn("text-xs font-bold", discord.isReady ? "text-emerald-500" : "text-slate-500")}>{discord.isReady ? 'POŁĄCZONY' : 'OFFLINE'}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase">Serwery</span>
            <span className="text-xs font-bold text-white">{discord.guilds}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase">Bot Tag</span>
            <span className="text-xs font-bold text-indigo-400">{discord.user}</span>
          </div>
        </div>
        
        {!discord.isReady && discord.tokenSet && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
             <p className="text-xs text-red-500 font-medium">Bot jest offline mimo ustawionego tokenu. Sprawdź Uprawnienia (Intents) w Discord Developer Portal (Guilds, Voice, Messages).</p>
          </div>
        )}
      </div>

      <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Konfiguracja OAuth
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase">Client ID Set</span>
            <span className={cn("text-xs font-bold", discord.clientIdSet ? "text-emerald-500" : "text-red-500")}>{discord.clientIdSet ? 'TAK' : 'BRAK'}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase">Client Secret Set</span>
            <span className={cn("text-xs font-bold", discord.clientSecretSet ? "text-emerald-500" : "text-red-500")}>{discord.clientSecretSet ? 'TAK' : 'BRAK'}</span>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
             <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Redirect URI (Wklej do Discord Dev Portal)</span>
             <code className="text-[10px] font-mono text-indigo-400 break-all bg-black/60 p-2 rounded block border border-white/5">
               {env.calculatedRedirectUri || 'https://YOUR-APP.run.app/api/auth/callback'}
             </code>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 mt-4">
             <span className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Produkcyjny URL Panelu</span>
             <a href="https://discord-music-bot-dashboard-687529685449.us-west2.run.app/" target="_blank" rel="noreferrer" className="text-[10px] font-mono text-emerald-400 break-all bg-black/60 p-2 rounded block border border-white/5 hover:bg-emerald-500/5 transition-colors">
               https://discord-music-bot-dashboard-687529685449.us-west2.run.app/
             </a>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
           <button onClick={handleSystemRepair} disabled={isRepairing} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl text-[10px] transition-all shadow-lg flex items-center justify-center gap-2">
             <RefreshCw className={cn("w-3 h-3", isRepairing && "animate-spin")} />
             Restartuj Bot & Extractors
           </button>
        </div>
      </div>
    </div>
  );
};

const CONFIG_FIELDS = [
  { key: 'DISCORD_TOKEN', label: 'Discord Bot Token', description: 'Token bota Discord z Developer Portal', sensitive: true },
  { key: 'DISCORD_CLIENT_ID', label: 'Discord Client ID', description: 'Client ID aplikacji Discord OAuth2', sensitive: false },
  { key: 'DISCORD_CLIENT_SECRET', label: 'Discord Client Secret', description: 'Client Secret aplikacji Discord OAuth2', sensitive: true },
  { key: 'SPOTIFY_CLIENT_ID', label: 'Spotify Client ID', description: 'Client ID z Spotify Developer Dashboard', sensitive: false },
  { key: 'SPOTIFY_CLIENT_SECRET', label: 'Spotify Client Secret', description: 'Client Secret z Spotify Developer Dashboard', sensitive: true },
  { key: 'GEMINI_API_KEY', label: 'Gemini API Key', description: 'Klucz API Google Gemini (AI)', sensitive: true },
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', description: 'Klucz tajny Stripe do obsługi płatności', sensitive: true },
  { key: 'JWT_SECRET', label: 'JWT Secret', description: 'Sekret do podpisywania tokenów JWT (auth)', sensitive: true },
  { key: 'YOUTUBE_COOKIES', label: 'YouTube Cookies', description: 'Cookies YouTube dla lepszej ekstrakcji audio', sensitive: true },
  { key: 'APP_URL', label: 'App URL', description: 'Publiczny URL panelu (np. https://your-app.run.app)', sensitive: false },
];

const ConfigPanel = () => {
  const [configValues, setConfigValues] = React.useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [showSecret, setShowSecret] = React.useState<Record<string, boolean>>({});
  const [saving, setSaving] = React.useState<string | null>(null);
  const [restartingBot, setRestartingBot] = React.useState(false);
  const [generatingSecret, setGeneratingSecret] = React.useState(false);
  const [successKey, setSuccessKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) setConfigValues(data.config);
      });
  }, []);

  const handleSave = async (key: string) => {
    if (!editValue.trim()) return;
    setSaving(key);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValue })
      });
      const data = await res.json();
      if (data.success) {
        setConfigValues(prev => ({ ...prev, [key]: key === 'APP_URL' || key === 'DISCORD_CLIENT_ID' || key === 'SPOTIFY_CLIENT_ID' ? editValue : '••••••' + editValue.slice(-4) }));
        setEditingKey(null);
        setEditValue('');
        setSuccessKey(key);
        setTimeout(() => setSuccessKey(null), 3000);
      } else {
        alert(data.error || 'Błąd zapisu');
      }
    } catch { alert('Błąd serwera'); }
    finally { setSaving(null); }
  };

  const handleRestartBot = async () => {
    if (!window.confirm('Czy na pewno chcesz zrestartować bota z nową konfiguracją? Bot będzie offline przez kilka sekund.')) return;
    setRestartingBot(true);
    try {
      const res = await fetch('/api/admin/config/restart-bot', { method: 'POST' });
      const data = await res.json();
      if (data.success) alert(data.message);
      else alert('Błąd restartu bota.');
    } catch { alert('Błąd serwera'); }
    finally { setRestartingBot(false); }
  };

  const handleGenerateSecret = async () => {
    if (!window.confirm('Czy na pewno chcesz wygenerować nowy sekret JWT? Wszyscy zalogowani użytkownicy będą musieli zalogować się ponownie.')) return;
    setGeneratingSecret(true);
    try {
      const res = await fetch('/api/admin/config/generate-secret', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setConfigValues(prev => ({ ...prev, JWT_SECRET: '••••••(nowy)' }));
        setSuccessKey('JWT_SECRET');
        setTimeout(() => setSuccessKey(null), 3000);
        alert(data.message);
      } else {
        alert('Błąd generowania sekretu.');
      }
    } catch { alert('Błąd serwera'); }
    finally { setGeneratingSecret(false); }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
              <Key className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Zarządzanie Kluczami & Sekretami</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Konfiguracja interfejsu webowego i bota</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateSecret}
              disabled={generatingSecret}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 text-white font-black uppercase tracking-widest rounded-xl text-[10px] transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2"
              title="Wygeneruj nowy losowy sekret JWT dla interfejsu webowego"
            >
              {generatingSecret ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
              Nowy Sekret JWT
            </button>
            <button
              onClick={handleRestartBot}
              disabled={restartingBot}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-black uppercase tracking-widest rounded-xl text-[10px] transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              {restartingBot ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Restartuj Bota
            </button>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-400/80 leading-relaxed">
              Zmiana kluczy zostanie zastosowana natychmiast w pamięci. Aby bot użył nowego tokenu Discord, kliknij "Restartuj Bota". Kliknij "Nowy Sekret JWT" aby wygenerować nowy klucz bezpieczeństwa interfejsu webowego — spowoduje to wylogowanie wszystkich użytkowników. Klucze są przechowywane bezpiecznie w bazie danych i przywracane automatycznie po restarcie serwera.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {CONFIG_FIELDS.map(field => (
            <div key={field.key} className="bg-black/40 border border-white/5 rounded-2xl p-5 group hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{field.label}</span>
                    {field.sensitive && <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[8px] font-black uppercase rounded border border-red-500/20">SECRET</span>}
                    {successKey === field.key && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded border border-emerald-500/20">ZAPISANO</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{field.description}</p>
                </div>
                {editingKey !== field.key && (
                  <div className="flex gap-2">
                    {field.key === 'JWT_SECRET' && (
                      <button
                        onClick={handleGenerateSecret}
                        disabled={generatingSecret}
                        className="px-3 py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 font-black uppercase tracking-widest rounded-lg text-[9px] transition-all border border-amber-600/20 flex items-center gap-1.5"
                        title="Wygeneruj losowy nowy sekret"
                      >
                        {generatingSecret ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
                        Generuj
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingKey(field.key); setEditValue(''); }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-lg text-[9px] transition-all border border-white/5"
                    >
                      Zmień
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {editingKey === field.key ? (
                  <div className="flex-1 flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={field.sensitive && !showSecret[field.key] ? 'password' : 'text'}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        placeholder={`Wpisz nowy ${field.label}...`}
                        className="w-full bg-[#09090B] border border-indigo-500/30 text-white rounded-xl px-4 py-3 text-sm font-mono pr-10 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      {field.sensitive && (
                        <button
                          onClick={() => setShowSecret(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showSecret[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleSave(field.key)}
                      disabled={saving === field.key || !editValue.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-black uppercase rounded-xl text-[10px] transition-all flex items-center gap-2"
                    >
                      {saving === field.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Zapisz
                    </button>
                    <button
                      onClick={() => { setEditingKey(null); setEditValue(''); }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase rounded-xl text-[10px] transition-all"
                    >
                      Anuluj
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 bg-[#09090B] border border-white/5 rounded-xl px-4 py-3">
                    <code className="text-xs font-mono text-slate-400">
                      {configValues[field.key] || <span className="text-slate-600 italic">Nie ustawiono</span>}
                    </code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminTab: React.FC<AdminTabProps> = ({
  adminTab, setAdminTab, systemLogs, systemStats, voucherType, setVoucherType, voucherDuration, setVoucherDuration, voucherMaxUses, setVoucherMaxUses, handleCreateVoucher, createdVoucher, setCreatedVoucher, vouchers, adminUsers, handleAdminUserPremium, analyzingLogId, handleAnalyzeWithAI, aiAnalysis, bugReports, handleUpdateBugStatus, versionInfo, checkingVersion, fetchVersionInfo, handleTriggerUpdate, isUpdating, handleSystemRepair, isRepairing, fetchAdminLogs, diagData, handleDeleteVoucher, handleSendAnnouncement
}) => {
  const [newsTitle, setNewsTitle] = React.useState('');
  const [newsBody, setNewsBody] = React.useState('');
  const [pastAnnouncements, setPastAnnouncements] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (adminTab === 'news') {
      fetch('/api/admin/broadcasts')
        .then(res => res.json())
        .then(data => {
            if (data.success) setPastAnnouncements(data.broadcasts);
        });
    }
  }, [adminTab]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <div className="bg-[#111114] border border-white/5 rounded-[40px] p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Settings className="w-48 h-48 rotate-12" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
               <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
               <h2 className="text-3xl font-black text-white">Centralny Panel Sterowania</h2>
               <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Narzędzia Administracyjne & Diagnostics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-[#18181B] border border-emerald-500/20 rounded-2xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Cpu className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">Uptime Systemu</div>
               </div>
               <div className="text-2xl font-black text-white">{diagData ? `${Math.floor(diagData.system.uptime / 3600)}h ${Math.floor((diagData.system.uptime % 3600) / 60)}m` : '...'}</div>
               <div className="text-[10px] text-emerald-400 mt-1">CPU: Stabilne</div>
            </div>
            <div className="bg-[#18181B] border border-red-500/20 rounded-2xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-400"><AlertCircle className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">Błędy (24h)</div>
               </div>
               <div className="text-2xl font-black text-white">{systemLogs.filter(l => l.level === 'error').length}</div>
               <div className="text-[10px] text-red-400 mt-1">Krytyczne: {systemLogs.filter(l => l.level === 'error' && l.source === 'system').length}</div>
            </div>
            <div className="bg-[#18181B] border border-indigo-500/20 rounded-2xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Users className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">Serwery Bot</div>
               </div>
               <div className="text-2xl font-black text-white">{diagData?.discord?.guilds || 0}</div>
               <div className="text-[10px] text-indigo-400 mt-1">Aktywne: {systemStats.active_sessions || 0}</div>
            </div>
            <div className="bg-[#18181B] border border-indigo-500/30 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all rotate-12">
                  <Zap className="w-24 h-24 text-indigo-400" />
               </div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><HardDrive className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">Pamięć RAM (3GB Limit)</div>
               </div>
               <div className="text-2xl font-black text-white flex items-center gap-2">
                  {diagData ? `${Math.floor(diagData.system.memory.rss / 1024 / 1024)}MB` : '...'}
                  <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">Ultra Mode</span>
               </div>
               <div className="text-[10px] text-slate-500 mt-1 flex justify-between items-center">
                  <span>Heap: {diagData ? `${Math.floor(diagData.system.memory.heapUsed / 1024 / 1024)}MB` : '...'}</span>
                  <span className="text-indigo-400 font-black">Optymalizacja Aktywna</span>
               </div>
            </div>
          </div>

          <div className="flex bg-[#18181B] rounded-2xl p-1.5 border border-white/5 mb-8 overflow-x-auto whitespace-nowrap">
            {[
              { id: 'vouchers', label: 'Vouchery', icon: List },
              { id: 'users', label: 'Użytkownicy', icon: Activity },
              { id: 'players', label: 'Aktywni Gracze', icon: Music },
              { id: 'logs', label: 'System Logs', icon: Terminal },
              { id: 'diag', label: 'Diagnostyka', icon: ShieldCheck },
              { id: 'config', label: 'Konfiguracja', icon: Key },
              { id: 'news', label: 'Ogłoszenia', icon: Bell },
              { id: 'bugs', label: 'Zgłoszenia Błędów', icon: Activity },
              { id: 'updates', label: 'Co nowego', icon: Sparkles },
            ].map(tab => (
              <button key={tab.id} onClick={() => setAdminTab(tab.id as any)} className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2", adminTab === tab.id ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-white")}>
                 <tab.icon className="w-3.5 h-3.5" />
                 {tab.label}
              </button>
            ))}
          </div>

          {adminTab === 'vouchers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-8">
                  <h3 className="text-lg font-bold text-white mb-6">Generuj vouchery premium</h3>
                  <form onSubmit={handleCreateVoucher} className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Typ Nagrody</label>
                       <select value={voucherType} onChange={e => setVoucherType(e.target.value)} className="w-full bg-[#09090B] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm font-bold">
                          <option value="user_premium">User Premium (Global)</option>
                          <option value="guild_premium">Guild Premium (Serwer)</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Czas Trwania</label>
                       <div className="flex flex-wrap gap-2 mb-3">
                          {['7d','30d','90d','1y','lifetime'].map(d => (
                            <button key={d} type="button" onClick={() => setVoucherDuration(d)} className={cn("px-4 py-2 rounded-lg text-[10px] font-black border uppercase transition-all", voucherDuration === d ? "bg-indigo-500 text-white border-transparent" : "bg-black/40 text-slate-500 border-white/5")}>{d}</button>
                          ))}
                       </div>
                       <input type="text" value={voucherDuration} onChange={e => setVoucherDuration(e.target.value)} className="w-full bg-[#09090B] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm font-bold" placeholder="Inny czas (np. 14d, 2y)" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Maksymalna Liczba Użyć</label>
                       <input type="number" min="1" value={voucherMaxUses} onChange={e => setVoucherMaxUses(parseInt(e.target.value) || 1)} className="w-full bg-[#09090B] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm font-bold" />
                    </div>
                    <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl text-xs transition-all shadow-xl shadow-indigo-600/20">Generuj Kod</button>
                  </form>
               </div>
               <div className="space-y-4">
                  {createdVoucher ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden group">
                       <h4 className="text-emerald-500 font-black uppercase tracking-widest text-[10px] mb-2">Success! Kod wygenerowany:</h4>
                       <div className="bg-black/60 border border-white/5 p-6 rounded-2xl text-center mb-4">
                          <code className="text-4xl font-mono font-black text-white tracking-widest select-all">{createdVoucher.code}</code>
                       </div>
                       <button onClick={() => setCreatedVoucher(null)} className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors">Wyczyść</button>
                    </div>
                  ) : (
                    <div className="bg-[#18181B]/30 border border-dashed border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full opacity-50">
                       <Plus className="w-10 h-10 text-slate-600 mb-4" />
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tutaj pojawi się kod</p>
                    </div>
                  )}
                  <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-6">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Ostatnio wygenerowane</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                       {vouchers.slice(0, 10).map((v, i) => (
                         <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 group">
                            <div>
                               <code className="text-xs font-mono font-bold text-slate-300">{v.code}</code>
                               <div className="text-[9px] text-slate-500 uppercase font-black">{v.uses}/{v.max_uses} użyć</div>
                            </div>
                            <button onClick={() => handleDeleteVoucher(v.code)} className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                               <Trash2 className="w-3.5 h-3.5" />
                            </button>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {adminTab === 'users' && (
             <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-black/40 border-b border-white/5">
                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Użytkownik</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Premium</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Zarządzaj</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {adminUsers.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-xs">{u.username?.[0] || '?'}</div>
                                 <span className="font-bold text-sm text-white">{u.username}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-xs font-mono text-slate-500">{u.id}</td>
                           <td className="px-6 py-4">
                              <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border", u.premium === 1 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20")}>
                                 {u.premium === 1 ? 'Active' : 'No'}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex gap-2">
                                 <button onClick={() => handleAdminUserPremium(u.id, u.premium === 1 ? 'revoke' : 'grant')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", u.premium === 1 ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20")}>
                                    {u.premium === 1 ? 'Revoke' : 'Grant Premium'}
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}

          {adminTab === 'news' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-8">
                   <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                     <Bell className="w-6 h-6 text-indigo-400" />
                     Globalne Ogłoszenie
                   </h3>
                   <div className="space-y-4">
                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Tytuł</label>
                         <input type="text" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-bold" placeholder="np. Nowa Aktualizacja!" />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Wiadomość</label>
                         <textarea rows={5} value={newsBody} onChange={e => setNewsBody(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-medium resize-none" placeholder="Treść ogłoszenia..." />
                      </div>
                      <button 
                        onClick={() => { handleSendAnnouncement(newsTitle, newsBody); setNewsTitle(''); setNewsBody(''); }}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl text-xs transition-all shadow-xl shadow-indigo-600/20"
                      >
                         Wyślij do wszystkich serwerów
                      </button>
                   </div>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                     <ShieldCheck className="w-32 h-32" />
                   </div>
                   <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Informacja</h4>
                   <p className="text-sm text-slate-400 leading-relaxed mb-6">
                      Wysłanie ogłoszenia wyśle sformatowany Embed do domyślnych kanałów tekstowych na każdym serwerze, na którym znajduje się bot. 
                      Używaj tej funkcji tylko do ważnych komunikatów technicznych lub nowości.
                   </p>
                   <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Podgląd Odbiorców</span>
                       </div>
                       <div className="text-2xl font-black text-white">{diagData?.discord?.guilds || 0} serwerów</div>
                   </div>
                </div>

                <div className="md:col-span-2 bg-[#18181B]/50 border border-white/5 rounded-3xl p-8">
                   <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                     <List className="w-6 h-6 text-slate-400" />
                     Historia Wysłanych Ogłoszeń
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pastAnnouncements.length === 0 ? (
                        <div className="md:col-span-2 py-12 text-center text-slate-600 font-bold italic border border-dashed border-white/5 rounded-3xl">Brak historii ogłoszeń.</div>
                      ) : (
                        pastAnnouncements.map(ann => (
                          <div key={ann.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Bell className="w-12 h-12" />
                             </div>
                             <div className="flex justify-between items-start mb-3">
                                <h4 className="text-white font-bold">{ann.title}</h4>
                                <span className="text-[10px] font-mono text-slate-500">{new Date(ann.created_at).toLocaleString()}</span>
                             </div>
                             <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">{ann.body}</p>
                             <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase text-slate-600 tracking-widest">
                                <span>Autor ID: {ann.created_by}</span>
                                <span className="text-indigo-400">Broadcast Success</span>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>
          )}

          {adminTab === 'bugs' && (
            <div className="space-y-4">
               {bugReports.length === 0 ? (
                 <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-12 text-center text-slate-600 font-bold italic">Brak aktywnych zgłoszeń błędów.</div>
               ) : (
                 bugReports.map(bug => (
                   <div key={bug.id} className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-6">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase", bug.priority === 'high' ? 'bg-red-500 text-white' : bug.priority === 'medium' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white')}>{bug.priority}</span>
                            <h4 className="text-white font-bold">{bug.title}</h4>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleUpdateBugStatus(bug.id, 'fixed')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500/20">Resolved</button>
                            <button onClick={() => handleUpdateBugStatus(bug.id, 'closed')} className="px-3 py-1.5 bg-white/5 text-slate-500 rounded-lg text-[10px] font-black uppercase hover:bg-white/10">Archive</button>
                         </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{bug.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                         <span>Zgłosił ID: {bug.user_id}</span>
                         <span>Status: <span className="text-indigo-400">{bug.status}</span> • {new Date(bug.created_at).toLocaleString()}</span>
                      </div>
                   </div>
                 ))
               )}
            </div>
          )}

          {adminTab === 'updates' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all rotate-12">
                      <Sparkles className="w-32 h-32" />
                   </div>
                   <h3 className="text-xl font-black text-white mb-6">Aktualizacja Systemu & Naprawa</h3>
                   <div className="space-y-4 mb-10">
                      <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                         <span className="text-[10px] font-black text-slate-500 uppercase">Aktualna Wersja</span>
                         <span className="text-sm font-mono font-bold text-emerald-400">{versionInfo?.current || 'Scanning...'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                         <span className="text-[10px] font-black text-slate-500 uppercase">Najnowsza Dostępna</span>
                         <span className="text-sm font-mono font-bold text-white">{versionInfo?.latest || 'Connecting...'}</span>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <button onClick={handleTriggerUpdate} disabled={isUpdating} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-black uppercase tracking-widest rounded-2xl text-xs transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3">
                         {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                         Wymuś Aktualizację Extractors
                      </button>
                      <button onClick={handleSystemRepair} disabled={isRepairing} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl text-xs transition-all border border-white/5 flex items-center justify-center gap-3">
                         {isRepairing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                         Procedura Autonaprawy Systemu
                      </button>
                   </div>
                </div>

                <div className="bg-[#18181B]/30 border border-white/5 rounded-3xl p-8">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                     Ostatnie Aktualizacje (v{CHANGELOG[0].version})
                   </h4>
                   <div className="space-y-5">
                      {CHANGELOG[0].features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex gap-4 group">
                           <div className={cn(
                             "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                             f.type === 'new' ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20" : 
                             f.type === 'fix' ? "bg-red-500/10 text-red-400 group-hover:bg-red-500/20" : 
                             "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20"
                           )}>
                              {f.type === 'new' ? <Plus className="w-5 h-5" /> : f.type === 'fix' ? <AlertCircle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                           </div>
                           <div className="flex-1">
                              <div className={cn("text-[10px] font-black uppercase tracking-wider mb-0.5", 
                                f.type === 'new' ? "text-emerald-500" : f.type === 'fix' ? "text-red-500" : "text-indigo-500"
                              )}>
                                 {f.type === 'new' ? 'Nowość' : f.type === 'fix' ? 'Poprawka' : 'Ulepszenie'}
                              </div>
                              <p className="text-xs text-slate-300 font-medium leading-relaxed">{f.text}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="mt-8 pt-6 border-t border-white/5">
                      <p className="text-[10px] text-slate-500 font-bold italic">
                        Pełna historia zmian dostępna jest w oknie powitalnym przy starcie aplikacji.
                      </p>
                   </div>
                </div>

                <div className="md:col-span-2 bg-[#18181B]/50 border border-white/5 rounded-3xl p-8">
                   <h3 className="text-xl font-black text-white mb-6">Historia Zmian (Full Changelog)</h3>
                   <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      {CHANGELOG.map((entry) => (
                        <div key={entry.version} className="relative pl-8 border-l border-white/5">
                           <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                           <div className="flex items-center gap-3 mb-3">
                              <span className="text-xs font-black text-white px-2 py-1 bg-white/5 rounded-lg border border-white/5">v{entry.version}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{entry.date}</span>
                           </div>
                           <ul className="space-y-2">
                              {entry.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
                                   <div className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", f.type === 'new' ? 'bg-emerald-500' : f.type === 'fix' ? 'bg-red-500' : 'bg-indigo-500')} />
                                   {f.text}
                                </li>
                              ))}
                           </ul>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {adminTab === 'players' && (
             <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-black/40 border-b border-white/5">
                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Serwer (Guild)</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kolejka</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Teraz Gra</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {diagData?.players?.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold italic">Brak aktywnych odtwarzaczy.</td></tr>
                      ) : (
                        (diagData?.activePlayers || []).map((p: any) => (
                           <tr key={p.guildId} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                 <div>
                                    <div className="font-bold text-sm text-white">{p.guildName}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{p.guildId}</div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase", p.state === 'playing' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                                    {p.state}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="text-xs text-white font-bold">{p.queueLength} utworów</div>
                                 <div className="text-[10px] text-slate-500">Vol: {p.volume}%</div>
                              </td>
                              <td className="px-6 py-4 max-w-xs">
                                 {p.nowPlaying ? (
                                    <div className="truncate">
                                       <span className="text-indigo-400 font-bold text-xs">{p.nowPlaying.title}</span>
                                       <span className="text-slate-500 text-[10px] ml-2">by {p.nowPlaying.author}</span>
                                    </div>
                                 ) : (
                                    <span className="text-slate-600 text-[10px] italic">Nic nie gra</span>
                                 )}
                              </td>
                           </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          )}

          {adminTab === 'config' && (
            <ConfigPanel />
          )}

          {adminTab === 'diag' && (
            <DiagnosticView data={diagData} handleSystemRepair={handleSystemRepair} isRepairing={isRepairing} />
          )}

          {adminTab === 'logs' && (
             <div className="space-y-4">
                <div className="bg-[#18181B]/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                   <div className="bg-black/40 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ostatnie Logi Systemowe</span>
                      <button onClick={fetchAdminLogs} className="p-2 text-slate-500 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
                   </div>
                   <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-black/20 text-[10px] font-black text-slate-600 uppercase border-b border-white/5">
                               <th className="px-6 py-3">Typ</th>
                               <th className="px-6 py-3">Źródło</th>
                               <th className="px-6 py-3">Wiadomość</th>
                               <th className="px-6 py-3">AI / Diagnostic</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                            {systemLogs.map(log => (
                               <React.Fragment key={log.id}>
                                  <tr className={cn("hover:bg-white/[0.01] transition-colors text-[11px]", log.level === 'error' ? 'bg-red-500/[0.02]' : '')}>
                                     <td className="px-6 py-4">
                                        <span className={cn("px-2 py-0.5 rounded font-black uppercase text-[9px]", log.level === 'error' ? "bg-red-500 text-white" : (log.level === 'warn' ? "bg-amber-500 text-white" : "bg-indigo-500 text-white"))}>{log.level}</span>
                                     </td>
                                     <td className="px-6 py-4 font-mono font-bold text-slate-500 tracking-tighter">{log.source}</td>
                                     <td className="px-6 py-4 text-slate-300 max-w-xs truncate">{log.message}</td>
                                     <td className="px-6 py-4">
                                        {log.level === 'error' && !log.solution && !aiAnalysis[log.id] && (
                                           <button onClick={() => handleAnalyzeWithAI(log.id)} disabled={analyzingLogId === log.id} className="text-indigo-400 font-black uppercase text-[10px] hover:text-white flex items-center gap-2">
                                              {analyzingLogId === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                              Analyze
                                           </button>
                                        )}
                                        {(log.solution || aiAnalysis[log.id]) && <span className="text-emerald-400 font-bold text-[10px] uppercase">Solution OK</span>}
                                     </td>
                                  </tr>
                                  {(log.solution || aiAnalysis[log.id]) && (
                                     <tr className="bg-indigo-500/[0.03]">
                                        <td colSpan={4} className="px-6 py-4">
                                           <div className="bg-[#09090B] p-4 rounded-xl border border-indigo-500/10 text-[11px] text-slate-400">
                                              <ReactMarkdown>{log.solution || aiAnalysis[log.id]}</ReactMarkdown>
                                           </div>
                                        </td>
                                     </tr>
                                  )}
                               </React.Fragment>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
