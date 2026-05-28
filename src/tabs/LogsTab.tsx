import React from 'react';
import { Terminal, Copy, AlertTriangle, AlertCircle, Info, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface LogsTabProps {
  systemLogs: any[];
  user: any;
  analyzingLogId: number | null;
  handleAnalyzeWithAI: (id: number) => void;
  aiAnalysis: {[key: number]: string};
}

export const LogsTab: React.FC<LogsTabProps> = ({ 
  systemLogs, user, analyzingLogId, handleAnalyzeWithAI, aiAnalysis 
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">System Control Unit</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-50">Real-time Event Logging & Diagnostics</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live Monitor</span>
           </div>
        </div>
      </div>

      <div className="bg-[#111114] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-[#18181B] px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black text-white uppercase tracking-widest">Logs Console</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">Last {systemLogs.length} events retrieved</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Level</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Source</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Event Data</th>
                <th className="px-6 py-4 text-[10px] uppercase font-black text-slate-500 tracking-widest">Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {systemLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-600 font-bold italic">No system events logged in this session.</td>
                </tr>
              ) : (
                systemLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className={cn(
                      "hover:bg-white/5 transition-colors group text-xs",
                      log.level === 'error' ? 'bg-red-500/[0.02]' : (log.level === 'warn' ? 'bg-amber-500/[0.02]' : '')
                    )}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-black inline-flex items-center gap-1.5 uppercase tracking-tighter border",
                          log.level === 'error' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                          log.level === 'warn' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                          "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        )}>
                          {log.level === 'error' ? <AlertCircle className="w-3 h-3" /> : (log.level === 'warn' ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />)}
                          {log.level}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 font-bold font-mono tracking-tighter">{log.source}</span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex flex-col">
                           <p className="text-white font-medium leading-relaxed">{log.message}</p>
                           <p className="text-[10px] text-slate-600 font-mono mt-1">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           {log.level === 'error' && !log.solution && !aiAnalysis[log.id] && (
                             <button
                               onClick={() => handleAnalyzeWithAI(log.id)}
                               disabled={analyzingLogId === log.id}
                               className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                             >
                               {analyzingLogId === log.id ? (
                                 <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizowanie...</>
                               ) : (
                                 <><Sparkles className="w-3 h-3" /> AI Diagnose</>
                               )}
                             </button>
                           )}
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(`LOG ID: ${log.id}\nLEVEL: ${log.level}\nSOURCE: ${log.source}\nMESSAGE: ${log.message}\nDETAILS: ${log.details}`);
                             }}
                             className="p-2 text-slate-600 hover:text-white transition-colors"
                             title="Copy metadata"
                           >
                             <Copy className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                    {(log.solution || aiAnalysis[log.id]) && (
                      <tr className="bg-indigo-500/[0.03]">
                         <td colSpan={4} className="px-10 py-6">
                            <div className="flex gap-4">
                               <div className="shrink-0 p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400 h-fit border border-indigo-500/10">
                                  <Wand2 className="w-8 h-8" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h5 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                     Suggested Intelligence Solution
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  </h5>
                                  <div className="prose prose-invert prose-sm max-w-none text-slate-400 bg-[#18181b]/50 p-4 rounded-2xl border border-indigo-500/10">
                                     <ReactMarkdown>{log.solution || aiAnalysis[log.id]}</ReactMarkdown>
                                  </div>
                               </div>
                            </div>
                         </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
