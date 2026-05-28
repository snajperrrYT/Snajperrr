import React from 'react';
import { Settings, Sliders, Bell, Palette, Wand2, Shield, Bot, Plus, Music2, Sparkles, Zap, Gauge, Languages, Type, Layout, Activity, Repeat } from 'lucide-react';
import { cn } from '../lib/utils';
import { PremiumSettings } from '../types';

interface SettingsTabProps {
  user: any;
  handleUpdateQuality: (q: string) => void;
  premiumSettings: PremiumSettings;
  handleUpdatePremiumSetting: (key: any, val: any) => void;
  savingPremiumSetting: string | null;
  status: any;
  handleSpotifyLogin: () => void;
  handleSpotifyUnlink: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  user, handleUpdateQuality, premiumSettings, handleUpdatePremiumSetting, savingPremiumSetting, status, handleSpotifyLogin, handleSpotifyUnlink
}) => {
  const isSpotifyLinked = !!user?.spotify_access_token;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <section className="bg-[#111114] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-widest">Globalne Ustawienia</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Personalizacja Konta i Silnika Audio</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-colors group">
            <div>
              <p className="font-bold text-white mb-1">Jakość Dźwięku (Bitrate)</p>
              <p className="text-xs text-slate-500 pr-4">Wyższa jakość wymaga stabilnego łącza internetowego. Tryb Ultra dostępny tylko dla Premium.</p>
            </div>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              {['standard', 'high', 'ultra'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleUpdateQuality(q)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    user?.audio_quality === q ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
                  )}
                  disabled={q === 'ultra' && user?.premium !== 1}
                >
                  {q}
                  {q === 'ultra' && user?.premium !== 1 && ' 🔒'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1DB954]/10 rounded-xl flex items-center justify-center">
                 <Music2 className="w-6 h-6 text-[#1DB954]" />
              </div>
              <div>
                <p className="font-bold text-white mb-0.5">Integracja Spotify</p>
                <p className="text-xs text-slate-500">Połącz konto Spotify, aby odtwarzać swoje playlisty bezpośrednio przez bota.</p>
              </div>
            </div>
            
            {isSpotifyLinked ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Połączono
                </span>
                <button onClick={handleSpotifyUnlink} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors">
                  Odłącz
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSpotifyLogin}
                className="px-6 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#1DB954]/20 transition-all flex items-center gap-2 active:scale-95"
              >
                Połącz Spotify
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#111114] border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <Sparkles className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
               <Zap className="w-7 h-7" />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white leading-tight">Panel Premium</h3>
               <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Ekskluzywne ulepszenia dla Twoich streamów</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#18181B] border border-white/5 rounded-3xl p-6 shadow-xl space-y-1">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Bot className="w-4 h-4" /></div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Odtwarzacz</h4>
              </div>
              
              <div className="flex items-center justify-between py-2.5">
                <div><p className="text-sm text-slate-300 font-medium">Tryb Pętli</p><p className="text-[10px] text-slate-500">Powtarzaj muzykę</p></div>
                <select value={premiumSettings.loopMode} onChange={e => handleUpdatePremiumSetting('loopMode', e.target.value as any)}
                  className="bg-[#18181B] border border-white/10 text-white text-xs rounded-lg px-2 py-1.5">
                  <option value="none">Brak</option>
                  <option value="track">Jeden</option>
                  <option value="queue">Cała Kolejka</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Autoplay</p><p className="text-[10px] text-slate-500">Podobna muzyka na koniec</p></div>
                <button onClick={() => handleUpdatePremiumSetting('autoplay', !premiumSettings.autoplay)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.autoplay ? "bg-indigo-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.autoplay ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Tryb Losowy</p><p className="text-[10px] text-slate-500">Przetasuj kolejkę</p></div>
                <button onClick={() => handleUpdatePremiumSetting('shuffleEnabled', !premiumSettings.shuffleEnabled)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.shuffleEnabled ? "bg-indigo-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.shuffleEnabled ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Prędkość Odtwarzania</p><p className="text-[10px] text-slate-500">Zmień tempo (0.5x - 2.0x)</p></div>
                <select value={premiumSettings.playbackSpeed} onChange={e => handleUpdatePremiumSetting('playbackSpeed', e.target.value)}
                  className="bg-[#18181B] border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1.0">1.0x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2.0">2.0x</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Limit Głośności</p><p className="text-[10px] text-slate-500">Maksimalna głośność bota</p></div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono text-slate-500 w-8">{premiumSettings.volumeLimit}%</span>
                   <input type="range" min="1" max="100" value={premiumSettings.volumeLimit} onChange={e => handleUpdatePremiumSetting('volumeLimit', parseInt(e.target.value))} className="w-20 accent-indigo-500" />
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Priorytet Kolejki</p><p className="text-[10px] text-slate-500">Request priority bypass</p></div>
                <button onClick={() => handleUpdatePremiumSetting('queuePriority', !premiumSettings.queuePriority)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.queuePriority ? "bg-indigo-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.queuePriority ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
            </div>

            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl space-y-1">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Sliders className="w-4 h-4" /></div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Audio & Efekty</h4>
              </div>
              <div className="py-2.5">
                <p className="text-sm text-slate-300 font-medium mb-1.5">Preset Equalizera</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['flat','bass','treble','rock','pop','jazz','classical','electronic'] as const).map(p => (
                    <button key={p} onClick={() => handleUpdatePremiumSetting('eqPreset', p)}
                      className={cn("py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all", premiumSettings.eqPreset === p ? "bg-purple-500 text-white" : "bg-white/5 text-slate-400 hover:text-white")}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Bass Boost</p><p className="text-[10px] text-slate-500">Mocne niskie tony</p></div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono text-slate-500 w-8">{premiumSettings.bassBoost}%</span>
                   <input type="range" min="0" max="100" value={premiumSettings.bassBoost} onChange={e => handleUpdatePremiumSetting('bassBoost', parseInt(e.target.value))} className="w-20 accent-purple-500" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Reverb (Pogłos)</p><p className="text-[10px] text-slate-500">Efekt przestrzeni</p></div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono text-slate-500 w-8">{premiumSettings.reverbLevel}%</span>
                   <input type="range" min="0" max="100" value={premiumSettings.reverbLevel} onChange={e => handleUpdatePremiumSetting('reverbLevel', parseInt(e.target.value))} className="w-20 accent-purple-500" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Stereo Wide</p><p className="text-[10px] text-slate-500">Rozszerzona panorama</p></div>
                <button onClick={() => handleUpdatePremiumSetting('stereoWide', !premiumSettings.stereoWide)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.stereoWide ? "bg-purple-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.stereoWide ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Normalizacja Głośności</p><p className="text-[10px] text-slate-500">Wyrównaj poziomy</p></div>
                <button onClick={() => handleUpdatePremiumSetting('volumeNormalize', !premiumSettings.volumeNormalize)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.volumeNormalize ? "bg-purple-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.volumeNormalize ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
            </div>

            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl space-y-1">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Palette className="w-4 h-4" /></div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Wygląd Panelu</h4>
              </div>
              <div className="py-2.5">
                <p className="text-sm text-slate-300 font-medium mb-1.5">Kolor Akcentu</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['indigo','blue','purple','emerald','rose','amber'] as const).map(c => (
                    <button key={c} onClick={() => handleUpdatePremiumSetting('accentColor', c)}
                      className={cn(
                        "py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all",
                        premiumSettings.accentColor === c ? `bg-${c}-500 text-white border-transparent` : "bg-white/5 text-slate-400 border-white/5"
                      )}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Animacje Web</p><p className="text-[10px] text-slate-500">Płynne przejścia</p></div>
                <button onClick={() => handleUpdatePremiumSetting('animationsEnabled', !premiumSettings.animationsEnabled)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.animationsEnabled ? "bg-emerald-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.animationsEnabled ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Kompaktowe UI</p><p className="text-[10px] text-slate-500">Minimalizm panelu</p></div>
                <button onClick={() => handleUpdatePremiumSetting('compactMode', !premiumSettings.compactMode)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.compactMode ? "bg-emerald-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.compactMode ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Wizualizacja EQ</p><p className="text-[10px] text-slate-500">Dynamiczne paski</p></div>
                <button onClick={() => handleUpdatePremiumSetting('showEqViz', !premiumSettings.showEqViz)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.showEqViz ? "bg-emerald-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.showEqViz ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Duże Miniatury</p><p className="text-[10px] text-slate-500">Czytelna kolejka</p></div>
                <button onClick={() => handleUpdatePremiumSetting('largeThumbnails', !premiumSettings.largeThumbnails)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.largeThumbnails ? "bg-emerald-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.largeThumbnails ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
            </div>

            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl space-y-1">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><Bell className="w-4 h-4" /></div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Powiadomienia</h4>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <div><p className="text-sm text-slate-300 font-medium">Embed „Teraz gra"</p><p className="text-[10px] text-slate-500">Bogata wiadomość</p></div>
                <button onClick={() => handleUpdatePremiumSetting('nowPlayingEmbed', !premiumSettings.nowPlayingEmbed)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.nowPlayingEmbed ? "bg-amber-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.nowPlayingEmbed ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Powiadomienia DM</p><p className="text-[10px] text-slate-500">Info o błędach na priv</p></div>
                <button onClick={() => handleUpdatePremiumSetting('dmNotifications', !premiumSettings.dmNotifications)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.dmNotifications ? "bg-amber-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.dmNotifications ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Koniec Kolejki</p><p className="text-[10px] text-slate-500">Alert o pustej liście</p></div>
                <button onClick={() => handleUpdatePremiumSetting('notifyQueueEnd', !premiumSettings.notifyQueueEnd)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.notifyQueueEnd ? "bg-amber-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.notifyQueueEnd ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                <div><p className="text-sm text-slate-300 font-medium">Raporty Tygodniowe</p><p className="text-[10px] text-slate-500">Statystyki odsłuchań</p></div>
                <button onClick={() => handleUpdatePremiumSetting('weeklyReport', !premiumSettings.weeklyReport)}
                  className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.weeklyReport ? "bg-amber-500" : "bg-white/10")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.weeklyReport ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
            </div>

            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl space-y-1">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                 <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400"><Languages className="w-4 h-4" /></div>
                 <h4 className="font-bold text-white text-sm uppercase tracking-wider">Lokalizacja</h4>
               </div>
               <div className="py-2.5">
                  <p className="text-sm text-slate-300 font-medium mb-1.5">Język Bota (VC)</p>
                  <select value={premiumSettings.botLanguage} onChange={e => handleUpdatePremiumSetting('botLanguage', e.target.value as any)}
                    className="w-full bg-[#18181B] border border-white/10 text-white text-xs rounded-lg px-2 py-2">
                    <option value="pl">Polski (PL)</option>
                    <option value="en">English (US)</option>
                    <option value="de">Deutsch (DE)</option>
                    <option value="fr">Français (FR)</option>
                  </select>
               </div>
               <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                 <div><p className="text-sm text-slate-300 font-medium">Rich Presence</p><p className="text-[10px] text-slate-500">Status na profilu</p></div>
                 <button onClick={() => handleUpdatePremiumSetting('richPresence', !premiumSettings.richPresence)}
                   className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.richPresence ? "bg-rose-500" : "bg-white/10")}>
                   <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.richPresence ? "translate-x-5" : "translate-x-0.5")} />
                 </button>
               </div>
            </div>

            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl space-y-1">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                 <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Wand2 className="w-4 h-4" /></div>
                 <h4 className="font-bold text-white text-sm uppercase tracking-wider">AI Features</h4>
               </div>
               <div className="flex items-center justify-between py-2.5">
                 <div><p className="text-sm text-slate-300 font-medium">AI Autopilot</p><p className="text-[10px] text-slate-500">Inteligentna kolejka</p></div>
                 <button onClick={() => handleUpdatePremiumSetting('aiAutopilot', !premiumSettings.aiAutopilot)}
                   className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.aiAutopilot ? "bg-indigo-500" : "bg-white/10")}>
                   <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.aiAutopilot ? "translate-x-5" : "translate-x-0.5")} />
                 </button>
               </div>
               <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                 <div><p className="text-sm text-slate-300 font-medium">Mood Analysis</p><p className="text-[10px] text-slate-500">Analiza nastroju piosenek</p></div>
                 <button onClick={() => handleUpdatePremiumSetting('moodAnalysis', !premiumSettings.moodAnalysis)}
                   className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.moodAnalysis ? "bg-indigo-500" : "bg-white/10")}>
                   <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.moodAnalysis ? "translate-x-5" : "translate-x-0.5")} />
                 </button>
               </div>
               <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                 <div><p className="text-sm text-slate-300 font-medium">Rekomendacje AI</p><p className="text-[10px] text-slate-500">Sugeruj podobne utwory</p></div>
                 <button onClick={() => handleUpdatePremiumSetting('aiRecommendations', !premiumSettings.aiRecommendations)}
                   className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.aiRecommendations ? "bg-indigo-500" : "bg-white/10")}>
                   <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.aiRecommendations ? "translate-x-5" : "translate-x-0.5")} />
                 </button>
               </div>
               <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                 <div><p className="text-sm text-slate-300 font-medium">Asystent AI</p><p className="text-[10px] text-slate-500">Komendy głosowe LLM</p></div>
                 <button onClick={() => handleUpdatePremiumSetting('aiAssistantEnabled', !premiumSettings.aiAssistantEnabled)}
                   className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.aiAssistantEnabled ? "bg-indigo-500" : "bg-white/10")}>
                   <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.aiAssistantEnabled ? "translate-x-5" : "translate-x-0.5")} />
                 </button>
               </div>
            </div>

            <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl space-y-1">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                 <div className="p-2 bg-slate-500/10 rounded-lg text-slate-400"><Shield className="w-4 h-4" /></div>
                 <h4 className="font-bold text-white text-sm uppercase tracking-wider">Zaawansowane</h4>
               </div>
               <div className="flex items-center justify-between py-2.5">
                 <div><p className="text-sm text-slate-300 font-medium">Filtr Explicit</p><p className="text-[10px] text-slate-500">Blokuj wulgaryzmy</p></div>
                 <button onClick={() => handleUpdatePremiumSetting('explicitFilter', !premiumSettings.explicitFilter)}
                   className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.explicitFilter ? "bg-slate-500" : "bg-white/10")}>
                   <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.explicitFilter ? "translate-x-5" : "translate-x-0.5")} />
                 </button>
               </div>
               <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                 <div><p className="text-sm text-slate-300 font-medium">Quality Fallback</p><p className="text-[10px] text-slate-500">Auto-bitrate reduction</p></div>
                 <button onClick={() => handleUpdatePremiumSetting('qualityFallback', !premiumSettings.qualityFallback)}
                   className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.qualityFallback ? "bg-slate-500" : "bg-white/10")}>
                   <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.qualityFallback ? "translate-x-5" : "translate-x-0.5")} />
                 </button>
               </div>
               <div className="flex items-center justify-between py-2.5 border-t border-white/5">
                 <div><p className="text-sm text-slate-300 font-medium">Powiadom o dołączeniu</p><p className="text-[10px] text-slate-500">Status VC bota</p></div>
                 <button onClick={() => handleUpdatePremiumSetting('notifyJoin', !premiumSettings.notifyJoin)}
                   className={cn("w-11 h-6 rounded-full transition-colors relative", premiumSettings.notifyJoin ? "bg-slate-500" : "bg-white/10")}>
                   <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform", premiumSettings.notifyJoin ? "translate-x-5" : "translate-x-0.5")} />
                 </button>
               </div>
            </div>
          </div>
          
          {savingPremiumSetting && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Zapisywanie ustawień...
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#5865F2] to-[#454FBF] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
           <Bot className="w-40 h-40" />
         </div>
         <div className="relative z-10 max-w-lg">
            <h3 className="text-3xl font-black text-white mb-3">Dodaj SnajperBot do serwera!</h3>
            <p className="text-white/80 font-medium mb-8 leading-relaxed">
              Zaproś bota na swój własny serwer Discord i ciesz się najlepszą jakością muzyki razem ze znajomymi.
            </p>
            <a href={status?.inviteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-white text-[#5865F2] px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
              Zaproś Teraz <Plus className="w-5 h-5" />
            </a>
         </div>
      </section>
    </div>
  );
};
