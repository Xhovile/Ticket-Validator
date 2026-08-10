import React from 'react';
import { ArrowLeft, ScanLine } from 'lucide-react';

export const ScannerEmptyState: React.FC<{ eventName: string; onStart: () => void; onBack: () => void }> = ({ eventName, onStart, onBack }) => (
  <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center px-5 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700"><ScanLine className="h-7 w-7" /></div>
    <div className="mt-5 space-y-1.5"><h2 className="text-lg font-semibold tracking-tight text-slate-950">No Active Check-in Session</h2><p className="mx-auto max-w-xs text-xs leading-5 text-slate-500">Start a gate session for <strong className="font-semibold text-slate-700">{eventName}</strong> before scanning tickets.</p></div>
    <button onClick={onStart} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#020617] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"><ScanLine className="h-4 w-4 text-white" />Start Gate Session</button>
    <button onClick={onBack} className="mt-2 flex min-h-10 items-center justify-center gap-1.5 px-4 text-xs font-medium text-slate-500 transition hover:text-slate-900"><ArrowLeft className="h-3.5 w-3.5" />Back to Event</button>
  </div>
);
