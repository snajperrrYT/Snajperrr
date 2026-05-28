import React from 'react';
import { Trash2, Bug, Sparkles, X, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { CHANGELOG, CHANGELOG_VERSION } from '../constants';

interface ConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ onCancel, onConfirm }) => (
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
        <button onClick={onCancel} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-sm transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-500/20">Clear All</button>
      </div>
    </div>
  </div>
);

interface BugReportModalProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  priority: string;
  setPriority: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  title, setTitle, description, setDescription, priority, setPriority, onCancel, onConfirm, submitting
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-md">
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
          <input type="text" className="w-full bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder="Krótki opis błędu..." value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Opis (kroki do powtórzenia)</label>
          <textarea className="w-full bg-[#18181B] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 h-32 resize-none" placeholder="Co się stało? Jak do tego doszło?" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Priorytet</label>
          <div className="grid grid-cols-3 gap-2">
            {['low', 'medium', 'high'].map(p => (
              <button key={p} onClick={() => setPriority(p)} className={cn("py-2 rounded-lg text-[10px] font-bold uppercase transition-all", priority === p ? (p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white') : "bg-white/5 text-slate-500 hover:text-white")}>
                {p === 'low' ? 'Niski' : p === 'medium' ? 'Średni' : 'Wysoki'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-xl text-sm transition-colors" disabled={submitting}>Anuluj</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50" disabled={submitting || !title || !description}>
          {submitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
        </button>
      </div>
    </div>
  </div>
);

interface ChangelogModalProps {
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
    <div className="bg-[#111114] border border-white/5 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white">Co nowego?</h3>
          <p className="text-xs text-slate-500">Historia aktualizacji SnajperBot Dashboard</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 space-y-6 pr-1">
        {CHANGELOG.map((entry) => (
          <div key={entry.version} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black rounded-full">v{entry.version}</span>
              <span className="text-xs text-slate-500 font-mono">{entry.date}</span>
              {entry.version === CHANGELOG_VERSION && (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-wider">Nowość</span>
              )}
            </div>
            <ul className="space-y-2">
              {entry.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className={cn("mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black", f.type === 'new' ? "bg-emerald-500/15 text-emerald-400" : f.type === 'fix' ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400")}>
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
        <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/20">Rozumiem, zamknij</button>
      </div>
    </div>
  </div>
);
