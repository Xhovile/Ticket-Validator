import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const ScannerHeader: React.FC<{ gateName: string; staffName: string; scanCount: number; onBack: () => void }> = ({ gateName, staffName, scanCount, onBack }) => (
  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
    <button onClick={onBack} className="flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950">
      <ArrowLeft className="h-3.5 w-3.5" /> Event
    </button>
    <div className="min-w-0 px-2 text-center">
      <p className="truncate text-xs font-semibold text-slate-950">{gateName}</p>
      <p className="truncate text-[10px] text-slate-500">{staffName}</p>
    </div>
    <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold tabular-nums text-slate-700">{scanCount} scanned</span>
  </div>
);
