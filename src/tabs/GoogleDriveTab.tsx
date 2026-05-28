import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, LogIn, Disc, Play, Pause, DownloadCloud, Loader2, ListMusic, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react';
import { googleSignIn, initAuth, getAccessToken, logout } from '../lib/firebase';
import { User } from 'firebase/auth';

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function GoogleDriveTab() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [files, setFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  const [ytUrl, setYtUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Player State
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => {
        setNeedsAuth(false);
        setUser(u);
        setToken(t);
        fetchFiles(t);
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        fetchFiles(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchFiles = async (t: string) => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType contains "audio" and trashed = false&fields=files(id,name,mimeType,webContentLink)', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch (error) {
      console.error('Failed to fetch Drive files', error);
      if (typeof error === "object" && !!error && "message" in error && String(error.message).includes("Unauthorized")) {
        setNeedsAuth(true); // Token expired
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDownloadToDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim() || !token) return;
    setIsDownloading(true);
    try {
      const res = await fetch('/api/yt-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ytUrl, accessToken: token })
      });
      const data = await res.json();
      if (data.success) {
        setYtUrl('');
        alert('Successfully downloaded and saved to Google Drive!');
        fetchFiles(token);
      } else {
        alert(data.error || 'Failed to download to drive');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsDownloading(false);
    }
  };

  const togglePlay = async (index: number) => {
    if (currentFileIndex === index) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play().catch(e => alert("Please open Google Drive and authorize playback: "+e.message));
      }
      setIsPlaying(!isPlaying);
      return;
    }

    const file = files[index];
    const streamUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&access_token=${token}`;

    if (audioRef.current) {
        audioRef.current.src = streamUrl;
        audioRef.current.play().catch(e => alert("Autoplay blocked or stream error. Try clicking play again."));
        setCurrentFileIndex(index);
        setIsPlaying(true);
    }
  };

  const skipRelative = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = time;
    setProgress(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted && volume === 0) {
        setVolume(1);
        audioRef.current.volume = 1;
      }
    }
  };

  const playNext = () => {
    if (currentFileIndex !== null && currentFileIndex < files.length - 1) {
      togglePlay(currentFileIndex + 1);
    }
  };

  const playPrev = () => {
    if (currentFileIndex !== null && currentFileIndex > 0) {
      togglePlay(currentFileIndex - 1);
    }
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="w-20 h-20 bg-indigo-500/10 flex items-center justify-center rounded-2xl border border-indigo-500/20">
            <HardDrive className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Google Drive Integration</h2>
            <p className="text-slate-400 mt-2 max-w-sm">
                Connect your Google Drive to browse and play your music, or download directly from YouTube to your Personal Cloud.
            </p>
        </div>
        <button 
           onClick={handleLogin} disabled={isLoggingIn}
           className="gsi-material-button pr-4 pl-1 outline-none border-none bg-white flex items-center gap-4 rounded font-medium text-[#3c4043] cursor-pointer hover:bg-gray-100 transition shadow disabled:opacity-50"
           style={{height: '40px'}}
        >
          <div className="gsi-material-button-icon p-2 bg-white rounded-l">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '18px', height: '18px' }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          </div>
          <span className="gsi-material-button-contents text-sm tracking-wide">
            {isLoggingIn ? "Signing in..." : "Sign in with Google"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
        <audio 
            ref={audioRef} 
            onEnded={() => { setIsPlaying(false); playNext(); }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            style={{ display: 'none' }}
        />

        <div className="flex flex-col md:flex-row gap-8">
            {/* Player Main Panel */}
            <div className="flex-[2]">
                <div className="bg-gradient-to-b from-[#18181B] to-black border border-white/5 rounded-3xl p-8 h-full shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="flex flex-col items-center justify-center flex-1 py-8 relative z-10 w-full">
                        <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-indigo-500/20 flex items-center justify-center mb-8 relative bg-black shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                            <Disc className={`w-24 h-24 sm:w-32 sm:h-32 text-indigo-400 opacity-80 mix-blend-screen transition-all duration-1000 ${isPlaying ? 'animate-[spin_4s_linear_infinite] scale-110' : 'scale-100'}`} />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none" />
                            {isPlaying && (
                                <>
                                  <div className="absolute inset-[-20%] border border-indigo-500/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                  <div className="absolute inset-[-40%] border border-indigo-500/5 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
                                </>
                            )}
                        </div>

                        <div className="text-center w-full max-w-sm px-4">
                            <h3 className="text-2xl sm:text-3xl text-white font-bold tracking-tight truncate">
                                {currentFileIndex !== null && files[currentFileIndex] ? files[currentFileIndex].name.replace(/\.[^/.]+$/, "") : 'No Track Selected'}
                            </h3>
                            <p className="text-indigo-300/80 mt-2 text-sm sm:text-base font-medium uppercase tracking-widest">
                                {currentFileIndex !== null ? 'Google Drive Audio' : 'Select a track below'}
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-xl mx-auto mt-auto relative z-10">
                        {/* Progress */}
                        <div className="flex items-center gap-4 mb-6 text-xs text-slate-400 font-mono font-medium">
                            <span className="w-12 text-right">{formatTime(progress)}</span>
                            <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden group cursor-pointer group hover:bg-white/20 transition-colors">
                                <div 
                                    className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full w-full origin-left transition-transform duration-100 ease-out" 
                                    style={{ transform: `scaleX(${duration > 0 ? progress / duration : 0})` }}
                                />
                                <input 
                                    type="range" min="0" max={duration || 100} value={progress}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <span className="w-12">{formatTime(duration)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors p-2">
                                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                                <input 
                                    type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 sm:w-24 h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                                />
                            </div>

                            <div className="flex items-center gap-4 sm:gap-6">
                                <button onClick={playPrev} disabled={currentFileIndex === null || currentFileIndex === 0} className="text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-slate-400 p-2">
                                    <SkipBack className="w-6 h-6 fill-current" />
                                </button>

                                <button 
                                    onClick={() => currentFileIndex !== null ? togglePlay(currentFileIndex) : null}
                                    disabled={currentFileIndex === null}
                                    className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                </button>

                                <button onClick={playNext} disabled={currentFileIndex === null || currentFileIndex === files.length - 1} className="text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-slate-400 p-2">
                                    <SkipForward className="w-6 h-6 fill-current" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="text-slate-400 hover:text-white transition-colors p-2 opacity-50"><Repeat className="w-5 h-5" /></button>
                                <button className="text-slate-400 hover:text-white transition-colors p-2 opacity-50"><Shuffle className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Panel */}
            <div className="flex-1">
                <div className="bg-[#18181B] border border-white/5 p-6 sm:p-8 rounded-3xl h-full shadow-xl flex flex-col justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                        <DownloadCloud className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">YouTube to Drive</h3>
                    <p className="text-slate-400/80 mt-2 text-sm max-w-sm mb-8 leading-relaxed">
                        Directly bypass local storage. Fetch any YouTube URL as ultra-high-quality audio and sync it seamlessly into your connected Google Workspace.
                    </p>

                    <form onSubmit={handleDownloadToDrive} className="space-y-5">
                        <div className="relative group">
                            <input 
                                type="url" 
                                value={ytUrl}
                                onChange={(e) => setYtUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all font-mono text-sm shadow-inner group-hover:border-white/20"
                                required
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                <ListMusic className="w-5 h-5" />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isDownloading || !ytUrl.trim()}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] disabled:hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                        >
                            {isDownloading ? <><Loader2 className="w-5 h-5 animate-spin" /> Synchronizing...</> : "Start Sync"}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* Playlist Section */}
        <div className="bg-[#18181B] border border-white/5 rounded-3xl shadow-xl overflow-hidden mt-8">
            <div className="px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/20">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Your Cloud Library</h3>
                    <p className="text-slate-400 text-sm mt-1">Audio files detected in your Google Drive root</p>
                </div>
                <button onClick={() => fetchFiles(token!)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-colors border border-white/5">
                    Refresh Library
                </button>
            </div>
            <div className="p-4">
                {isLoadingFiles ? (
                    <div className="py-24 flex flex-col items-center justify-center text-indigo-400/50 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <span className="text-sm font-medium tracking-widest uppercase">Indexing Drive Vault...</span>
                    </div>
                ) : files.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4">
                            <ListMusic className="w-8 h-8 text-slate-500" />
                        </div>
                        <h4 className="text-lg font-medium text-white mb-2">Library Empty</h4>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto">No audio files found. Download a track from YouTube above to populate your cloud vault.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <AnimatePresence>
                            {files.map((file, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05, duration: 0.2 }}
                                    key={file.id} 
                                    onClick={() => togglePlay(i)}
                                    className={`group cursor-pointer flex items-center gap-4 p-4 rounded-2xl transition-all border ${currentFileIndex === i ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                                >
                                    <div 
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-lg ${currentFileIndex === i && isPlaying ? 'bg-indigo-500 text-white scale-105 shadow-indigo-500/20' : 'bg-black border border-white/10 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500'}`}
                                    >
                                        {currentFileIndex === i && isPlaying ? (
                                            <div className="flex gap-1 items-center justify-center h-4">
                                                <div className="w-1 bg-white animate-[bounce_1s_infinite_0s] rounded-full h-full" />
                                                <div className="w-1 bg-white animate-[bounce_1s_infinite_0.2s] rounded-full h-full" />
                                                <div className="w-1 bg-white animate-[bounce_1s_infinite_0.4s] rounded-full h-full" />
                                            </div>
                                        ) : <Play className="w-5 h-5 fill-current ml-1" />}
                                    </div>
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className={`truncate font-semibold tracking-tight ${currentFileIndex === i ? 'text-indigo-400' : 'text-slate-200 group-hover:text-white'}`}>
                                            {file.name.replace(/\.[^/.]+$/, "")}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mt-1 opacity-70">
                                            {file.mimeType.split('/')[1] || 'AUDIO'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
