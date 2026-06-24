import React, { useState, useEffect } from 'react';
import { 
  AnimatePresence, 
  motion 
} from 'motion/react';
import { arrayMove } from '@dnd-kit/sortable';
import { 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// Types and Constants
import { 
  BotStatus, 
  PlayerStatus, 
  PremiumSettings, 
  DEFAULT_PREMIUM_SETTINGS 
} from './types';
import { CHANGELOG_VERSION } from './constants';

// Components
import { Sidebar } from './components/Sidebar';
import { ConfirmModal, BugReportModal, ChangelogModal } from './components/Modals';

// Tabs
import { DashboardTab } from './tabs/DashboardTab';
import { HistoryTab } from './tabs/HistoryTab';
import { LogsTab } from './tabs/LogsTab';
import { AdminTab } from './tabs/AdminTab';
import { SettingsTab } from './tabs/SettingsTab';
import { GmailTab } from './tabs/GmailTab';
import { GoogleDriveTab } from './tabs/GoogleDriveTab';

export default function App() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'logs' | 'admin' | 'settings' | 'gmail' | 'drive'>('dashboard');
  const [clearConfirmGuildId, setClearConfirmGuildId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTargetGuild, setSearchTargetGuild] = useState<string>('');
  
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Changelog state
  const [showChangelog, setShowChangelog] = useState(false);

  // Premium settings state
  const [premiumSettings, setPremiumSettings] = useState<PremiumSettings>({ ...DEFAULT_PREMIUM_SETTINGS });
  const [savingPremiumSetting, setSavingPremiumSetting] = useState<string | null>(null);

  // Admin state
  const [voucherType, setVoucherType] = useState('user_premium');
  const [voucherDuration, setVoucherDuration] = useState('30d');
  const [voucherMaxUses, setVoucherMaxUses] = useState(1);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [createdVoucher, setCreatedVoucher] = useState<any>(null);
  const [adminTab, setAdminTab] = useState<'vouchers' | 'users' | 'logs' | 'bugs' | 'updates' | 'diag' | 'players' | 'news' | 'config'>('vouchers');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [analyzingLogId, setAnalyzingLogId] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, string>>({});
  const [diagData, setDiagData] = useState<any>(null);

  const [versionInfo, setVersionInfo] = useState<{current: string, latest: string, needsUpdate: boolean} | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if GEMINI_API_KEY is available (in Vite it would need to be VITE_GEMINI_API_KEY if on client)
  const geminiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';

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
      if (data.success) setAdminUsers(data.users);
    } catch {}
  };

  const fetchAdminVouchers = async () => {
    try {
      const res = await fetch('/api/admin/vouchers');
      const data = await res.json();
      if (data.success) setVouchers(data.vouchers);
    } catch {}
  };

  const fetchAdminLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      if (data.success) setSystemLogs(data.logs);
    } catch {}
  };

  const fetchAdminBugs = async () => {
    try {
      const res = await fetch('/api/admin/bugs');
      const data = await res.json();
      if (data.success) setBugReports(data.bugs);
    } catch {}
  };

  const [systemStats, setSystemStats] = useState<{ last_repair?: string }>({});
  const fetchSystemStats = async () => {
    try {
      const res = await fetch('/api/admin/system/stats');
      const data = await res.json();
      if (data.success) setSystemStats(data.stats);
    } catch {}
  };

  const fetchVersionInfo = async () => {
    setCheckingVersion(true);
    try {
      const res = await fetch('/api/admin/system/version');
      const data = await res.json();
      if (data.success) {
        setVersionInfo({
          current: data.current,
          latest: data.latest,
          needsUpdate: data.needsUpdate
        });
      }
    } catch (err) {
      console.error('Fetch version error:', err);
    } finally {
      setCheckingVersion(false);
    }
  };

  const fetchDiagData = async () => {
    try {
      const res = await fetch('/api/admin/system/diag');
      const data = await res.json();
      if (data.success) setDiagData(data.diag);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'admin' && user?.is_admin === 1) {
      if (adminTab === 'users') fetchAdminUsers();
      else if (adminTab === 'vouchers') fetchAdminVouchers();
      else if (adminTab === 'logs') { fetchAdminLogs(); fetchSystemStats(); }
      else if (adminTab === 'bugs') fetchAdminBugs();
      else if (adminTab === 'updates') fetchVersionInfo();
      else if (adminTab === 'diag' || adminTab === 'players') fetchDiagData();
    }
  }, [activeTab, adminTab, user]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.loggedIn) {
        setUser(data.user);
        if (data.user.premium_settings && typeof data.user.premium_settings === 'object') {
          setPremiumSettings(prev => ({ ...prev, ...data.user.premium_settings }));
        }
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
    const lastSeen = localStorage.getItem('changelog_version');
    if (lastSeen !== CHANGELOG_VERSION) setShowChangelog(true);
    
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
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' || event.data?.type === 'SPOTIFY_AUTH_SUCCESS') fetchUserData();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch(`/api/auth/url`);
      const { url } = await res.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) alert('Please allow popups');
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const handleSpotifyLogin = async () => {
    try {
      const res = await fetch('/api/auth/spotify/login');
      const { url, error } = await res.json();
      if (error) return alert(error);
      const authWindow = window.open(url, 'spotify_popup', 'width=600,height=700');
      if (!authWindow) alert('Please allow popups');
    } catch (err) { console.error(err); }
  };

  const handleSpotifyUnlink = async () => {
    if (!confirm('Czy na pewno chcesz odłączyć konto Spotify?')) return;
    try {
      const res = await fetch('/api/user/spotify/unlink', { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchUserData();
    } catch (err) { console.error(err); }
  };

  const handleUpdateQuality = async (quality: string) => {
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioQuality: quality })
      });
      const data = await res.json();
      if (data.success) setUser((prev: any) => ({ ...prev, audio_quality: quality }));
      else alert(data.error || 'Błąd');
    } catch (err) { alert('Błąd sieciowy'); }
  };

  const handleUpdatePremiumSetting = async <K extends keyof PremiumSettings>(key: K, value: PremiumSettings[K]) => {
    const previousSettings = { ...premiumSettings };
    const newSettings = { ...premiumSettings, [key]: value };
    setPremiumSettings(newSettings);
    setSavingPremiumSetting(key);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premiumSettings: newSettings })
      });
      if (!res.ok) setPremiumSettings(previousSettings);
    } catch (err) { setPremiumSettings(previousSettings); }
    finally { setSavingPremiumSetting(null); }
  };

  const handleRedeemVoucher = async (guildIdToUse?: string) => {
    if (!voucherInput.trim()) return;
    try {
      const payload: any = { code: voucherInput.trim() };
      if (guildIdToUse) payload.guildId = guildIdToUse;
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemMessage({ text: data.message || 'Aktywowano!', type: 'success' });
        setVoucherInput('');
        fetchUserData();
      } else if (data.error === 'requires_guild_id') {
        const input = prompt("Podaj ID serwera (Guild ID):");
        if (input) handleRedeemVoucher(input.trim());
        else setRedeemMessage({ text: 'Wymagane ID serwera.', type: 'error' });
      } else setRedeemMessage({ text: `Błąd: ${data.error}`, type: 'error' });
    } catch (err) { setRedeemMessage({ text: 'Błąd serwera.', type: 'error' }); }
  };

  const handleAdminUserPremium = async (userId: string, action: 'grant' | 'extend' | 'revoke') => {
    let durationStr = '30d';
    if (action !== 'revoke') {
      const input = prompt("Czas trwania (np. 30d, 1y, lifetime):", "30d");
      if (!input) return;
      durationStr = input;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/premium`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, durationStr })
      });
      if ((await res.json()).success) fetchAdminUsers();
      else alert('Błąd');
    } catch { alert('Błąd serwera'); }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voucherType, durationStr: voucherDuration, maxUses: voucherMaxUses })
      });
      const data = await res.json();
      if (data.success) { setCreatedVoucher(data); fetchAdminVouchers(); }
      else alert(data.error || 'Failed');
    } catch(err) { console.error(err); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.success ? data.tracks : []);
    } catch(err) { setSearchResults([]); }
    finally { setIsSearching(false); }
  };

  const handlePlayFromWeb = async (url: string) => {
    let target = searchTargetGuild || (players.length > 0 ? players[0].guildId : '');
    if (!target) return alert("No active player found.");
    try {
      const res = await fetch(`/api/players/${target}/play`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!(await res.json()).success) alert('Failed to add track.');
    } catch(err) { alert('Error adding track.'); }
  };

  const handleVolumeChange = async (guildId: string, newVolume: number) => {
    setPlayers(prev => prev.map(p => p.guildId === guildId ? { ...p, volume: newVolume } : p));
    try {
      await fetch(`/api/players/${guildId}/volume`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: newVolume })
      });
    } catch {}
  };

  const handlePlaybackToggle = async (guildId: string, currentState: 'playing' | 'paused') => {
    const newState = currentState === 'playing' ? 'paused' : 'playing';
    setPlayers(prev => prev.map(p => p.guildId === guildId ? { ...p, state: newState } : p));
    try {
      await fetch(`/api/players/${guildId}/playback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
    } catch {}
  };

  const handleSkipForward = async (guildId: string) => {
    try { await fetch(`/api/players/${guildId}/skip`, { method: 'POST' }); } catch {}
  };

  const handleClearQueue = async (guildId: string) => {
    try {
      await fetch(`/api/players/${guildId}/clear`, { method: 'POST' });
      setClearConfirmGuildId(null);
    } catch {}
  };

  const handleRemoveTrack = async (guildId: string, trackId: string) => {
    setPlayers(prev => prev.map(p => p.guildId === guildId ? { ...p, queue: p.queue.filter(t => t.id !== trackId), queueLength: p.queueLength - 1 } : p));
    try { await fetch(`/api/players/${guildId}/queue/${trackId}`, { method: 'DELETE' }); } catch {}
  };

  const handleSubmitBug = async () => {
    if (!bugTitle || !bugDescription) return;
    setIsSubmittingBug(true);
    try {
      const res = await fetch('/api/bugs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: bugTitle, description: bugDescription, priority: bugPriority })
      });
      if ((await res.json()).success) {
        setShowBugModal(false); setBugTitle(''); setBugDescription(''); alert('Wysłano zgłoszenie!');
      }
    } catch {}
    finally { setIsSubmittingBug(false); }
  };

  const [isRepairing, setIsRepairing] = useState(false);
  const handleSystemRepair = async () => {
    setIsRepairing(true);
    try {
      const res = await fetch('/api/admin/system/repair', { method: 'POST' });
      if ((await res.json()).success) { alert('Naprawiono!'); fetchAdminLogs(); fetchSystemStats(); }
      else alert('Błąd naprawy.');
    } catch {}
    finally { setIsRepairing(false); }
  };

  const handleUpdateBugStatus = async (bugId: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/bugs/${bugId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchAdminBugs();
    } catch {}
  };

  // Helper to call server-side GenAI endpoint (prevents bundling server SDK into client)
  async function callGenAI(prompt: string) {
    const res = await fetch('/api/genai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GenAI error: ${res.status} ${txt}`);
    }
    const data = await res.json();
    return data?.text ?? data?.data ?? data;
  }

  const handleAnalyzeWithAI = async (logId: number) => {
    if (!geminiKey) return alert("AI not configured (Missing VITE_GEMINI_API_KEY)");
    setAnalyzingLogId(logId);
    try {
      const log = systemLogs.find(l => l.id === logId);
      const prompt = `Analizuj błąd: ${log.message}. Podaj krótkie rozwiązanie (Markdown, PL).`;
      const response = await callGenAI(prompt);
      const analysis = typeof response === 'string' ? response : (response.text || "Błąd analizy AI.");
      setAiAnalysis(prev => {
        const next = { ...prev };
        next[logId] = analysis;
        return next;
      });
      await fetch(`/api/admin/logs/${logId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution: analysis })
      });
      fetchAdminLogs();
    } catch (e) { console.error(e); alert('Błąd AI'); }
    finally { setAnalyzingLogId(null); }
  };

  const handleDragEnd = async (event: DragEndEvent, guildId: string) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const player = players.find(p => p.guildId === guildId);
      if (!player) return;
      const oldIndex = player.queue.findIndex(t => t.id === active.id);
      const newIndex = player.queue.findIndex(t => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setPlayers(prev => prev.map(p => p.guildId === guildId ? { ...p, queue: arrayMove(p.queue, oldIndex, newIndex) } : p));
        try {
          await fetch(`/api/players/${guildId}/queue/move`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: oldIndex, to: newIndex })
          });
        } catch {}
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/status').then(res => res.json()).then(setStatus).catch(() => {});
      fetch('/api/players').then(res => res.json()).then(setPlayers).catch(() => {});
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    if (!s || s === 0) return '0:00';
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTriggerUpdate = async () => {
    if (!confirm("Czy na pewno?")) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/system/update', { method: 'POST' });
      const data = await res.json();
      if (data.success) alert(data.message);
    } finally { setIsUpdating(false); }
  };

  const handleDeleteVoucher = async (code: string) => {
    if (!window.confirm(`Czy na pewno usunąć voucher ${code}?`)) return;
    const res = await fetch(`/api/admin/vouchers/${code}`, { method: 'DELETE' });
    if (res.ok) {
       setVouchers(prev => prev.filter(v => v.code !== code));
    }
  };

  const handleSendAnnouncement = async (title: string, message: string) => {
    if (!message) return;
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message })
    });
    const data = await res.json();
    if (data.success) {
       alert(`Wysłano do ${data.sentCount} serwerów.`);
    } else {
       alert('Błąd podczas wysyłania ogłoszenia.');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-200 font-sans selection:bg-[#5865F2] selection:text-white flex overflow-hidden">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} status={status} user={user} isLoadingUser={isLoadingUser} 
        handleLogin={handleLogin} handleLogout={handleLogout} setShowBugModal={setShowBugModal} 
        showRedeemInput={showRedeemInput} setShowRedeemInput={setShowRedeemInput} 
        voucherInput={voucherInput} setVoucherInput={setVoucherInput} 
        handleRedeemVoucher={handleRedeemVoucher} redeemMessage={redeemMessage} setRedeemMessage={setRedeemMessage}
        setShowChangelog={setShowChangelog}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
        <header className="h-20 flex items-center justify-between px-8 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
           <div className="flex items-center gap-3">
              <div className="md:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                 <Bot className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-black text-white capitalize tracking-tight">{activeTab}</h2>
           </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  status={status} players={players} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
                  handleSearch={handleSearch} isSearching={isSearching} searchTargetGuild={searchTargetGuild} 
                  setSearchTargetGuild={setSearchTargetGuild} searchResults={searchResults} handlePlayFromWeb={handlePlayFromWeb} 
                  formatTime={formatTime} handlePlaybackToggle={handlePlaybackToggle} handleVolumeChange={handleVolumeChange} 
                  handleSkipForward={handleSkipForward} setClearConfirmGuildId={setClearConfirmGuildId} 
                  handleDragEnd={handleDragEnd} handleRemoveTrack={handleRemoveTrack} sensors={sensors}
                  setShowChangelog={setShowChangelog}
                />
              )}
              {activeTab === 'history' && <HistoryTab players={players} />}
              {activeTab === 'logs' && <LogsTab systemLogs={systemLogs} user={user} handleAnalyzeWithAI={handleAnalyzeWithAI} analyzingLogId={analyzingLogId} aiAnalysis={aiAnalysis} />}
              {activeTab === 'admin' && user?.is_admin === 1 && (
                <AdminTab 
                  adminTab={adminTab} setAdminTab={setAdminTab} systemLogs={systemLogs} systemStats={systemStats} 
                  voucherType={voucherType} setVoucherType={setVoucherType} voucherDuration={voucherDuration} 
                  setVoucherDuration={setVoucherDuration} voucherMaxUses={voucherMaxUses} setVoucherMaxUses={setVoucherMaxUses} 
                  handleCreateVoucher={handleCreateVoucher} createdVoucher={createdVoucher} setCreatedVoucher={setCreatedVoucher} 
                  vouchers={vouchers} adminUsers={adminUsers} handleAdminUserPremium={handleAdminUserPremium} 
                  analyzingLogId={analyzingLogId} handleAnalyzeWithAI={handleAnalyzeWithAI} aiAnalysis={aiAnalysis} 
                  bugReports={bugReports} handleUpdateBugStatus={handleUpdateBugStatus} versionInfo={versionInfo} 
                  checkingVersion={checkingVersion} fetchVersionInfo={fetchVersionInfo} handleTriggerUpdate={handleTriggerUpdate} 
                  isUpdating={isUpdating} handleSystemRepair={handleSystemRepair} isRepairing={isRepairing}
                  fetchAdminLogs={fetchAdminLogs} diagData={diagData}
                  handleDeleteVoucher={handleDeleteVoucher} handleSendAnnouncement={handleSendAnnouncement}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab 
                  user={user} handleUpdateQuality={handleUpdateQuality} premiumSettings={premiumSettings} 
                  handleUpdatePremiumSetting={handleUpdatePremiumSetting} savingPremiumSetting={savingPremiumSetting} status={status} 
                  handleSpotifyLogin={handleSpotifyLogin} handleSpotifyUnlink={handleSpotifyUnlink}
                />
              )}
              {activeTab === 'gmail' && <GmailTab />}
              {activeTab === 'drive' && <GoogleDriveTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {clearConfirmGuildId && <ConfirmModal onCancel={() => setClearConfirmGuildId(null)} onConfirm={() => handleClearQueue(clearConfirmGuildId)} />}
      {showBugModal && <BugReportModal title={bugTitle} setTitle={setBugTitle} description={bugDescription} setDescription={setBugDescription} priority={bugPriority} setPriority={setBugPriority} onCancel={() => setShowBugModal(false)} onConfirm={handleSubmitBug} submitting={isSubmittingBug} />}
      {showChangelog && <ChangelogModal onClose={() => { localStorage.setItem('changelog_version', CHANGELOG_VERSION); setShowChangelog(false); }} />}
    </div>
  );
}

import { Bot, RefreshCw } from 'lucide-react';
