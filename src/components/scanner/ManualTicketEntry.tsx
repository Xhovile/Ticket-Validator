import React from 'react';
import { Search } from 'lucide-react';

export const ManualTicketEntry: React.FC<{ value: string; onChange: (value: string) => void; onSubmit: (e: React.FormEvent) => void }> = ({ value, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Search className="h-3.5 w-3.5" /></span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-900">Enter ticket code</p>
        <p className="text-[10px] text-slate-400">Use this if the QR code cannot be scanned.</p>
      </div>
    </div>
    <div className="mt-3 flex gap-2">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Ticket code" autoComplete="off" spellCheck={false} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 transition focus:border-slate-400 focus:bg-white" aria-label="Ticket code" />
      <button type="submit" disabled={!value.trim()} className="rounded-lg bg-[#020617] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">Validate</button>
    </div>
  </form>
);
