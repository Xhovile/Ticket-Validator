import React from 'react';
import { Search } from 'lucide-react';

export const ManualTicketEntry: React.FC<{ value: string; onChange: (value: string) => void; onSubmit: (e: React.FormEvent) => void }> = ({ value, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <div className="mb-2 flex items-center gap-1.5"><Search className="h-3.5 w-3.5 text-slate-500" /><span className="text-[11px] font-semibold text-slate-800">Manual ticket entry</span></div>
    <div className="flex gap-2">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Enter ticket code" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white" />
      <button type="submit" disabled={!value.trim()} className="rounded-lg bg-[#020617] px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Validate</button>
    </div>
  </form>
);
