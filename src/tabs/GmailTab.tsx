import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, ExternalLink, Calendar, User, Tag } from 'lucide-react';
import { googleSignIn, getAccessToken } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface GmailMessage {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const GmailTab: React.FC = () => {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchInbox = async () => {
    const token = await getAccessToken();
    if (!token) {
      setIsConnected(false);
      return;
    }
    setIsConnected(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      
      if (data.messages) {
        const fullMessages = await Promise.all(data.messages.map(async (m: any) => {
          const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const mData = await mRes.json();
          const headers = mData.payload.headers;
          return {
            id: mData.id,
            snippet: mData.snippet,
            subject: headers.find((h: any) => h.name === 'Subject')?.value,
            from: headers.find((h: any) => h.name === 'From')?.value,
            date: headers.find((h: any) => h.name === 'Date')?.value,
          };
        }));
        setMessages(fullMessages);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[#111114] border border-white/5 rounded-3xl p-12 shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Integracja Gmail</h3>
          <p className="text-slate-400 text-base mb-8 max-w-md mx-auto">
            Połącz swoje konto Google aby zarządzać wiadomościami. Uwaga: Wymagana autoryzacja przy każdej nowej sesji panelu.
          </p>
          <button
            onClick={async () => {
              try {
                const result = await googleSignIn();
                if (result) {
                  setIsConnected(true);
                  fetchInbox();
                }
              } catch (err) {
                console.error('Gmail sign-in failed:', err);
              }
            }}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-lg transition-all shadow-xl shadow-red-600/20 active:scale-95"
          >
            <span className="flex items-center gap-3 justify-center">
              <Mail className="w-5 h-5" />
              Zaloguj przez Google
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Twoja Skrzynka</h2>
          <p className="text-slate-500 text-sm">Ostatnie 10 wiadomości z Twojego konta Gmail.</p>
        </div>
        <button 
          onClick={fetchInbox} 
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/5 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Odśwież
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-sm">
          Błąd: {error}
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {loading && messages.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Pobieranie wiadomości...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <Mail className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Skrzynka jest pusta lub brak uprawnień.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111114] border border-white/5 hover:border-indigo-500/30 rounded-3xl p-6 transition-all group relative shadow-xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/0 group-hover:bg-indigo-500 transition-all" />
                
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                    <Mail className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
                        <h4 className="text-base font-bold text-white truncate leading-tight">{msg.subject || '(Bez tematu)'}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {new Date(msg.date!).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-3 h-3 text-slate-500" />
                      <p className="text-xs text-slate-400 truncate font-medium">{msg.from}</p>
                    </div>
                    
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 italic">
                      "{msg.snippet}"
                    </p>
                  </div>
                  
                  <div className="shrink-0 flex flex-col justify-center">
                    <a 
                      href={`https://mail.google.com/mail/u/0/#inbox/${msg.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
