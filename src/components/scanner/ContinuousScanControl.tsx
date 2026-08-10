import React from 'react';
import { Zap } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export const ContinuousScanControl: React.FC<{ active: boolean; onToggle?: () => void }> = ({ active, onToggle }) => (
  <div className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 shadow-sm transition-colors ${active ? 'border-slate-300 bg-white' : 'border-slate-200 bg-white'}`}>
    <div className="flex min-w-0 items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#020617] text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Zap className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-950">Continuous scanning</span>
          {active && <span className="rounded-full bg-[#020617] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-white">On</span>}
        </div>
        <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{active ? 'Automatically prepare for the next ticket' : 'Review each scan result before continuing'}</p>
      </div>
    </div>

    <button
      type="button"
      onClick={() => { onToggle?.(); soundFX.playClick(); }}
      className={`relative ml-3 inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 ${active ? 'border-[#020617] bg-[#020617]' : 'border-slate-300 bg-slate-200'}`}
      role="switch"
      aria-checked={active}
      aria-label="Toggle continuous scanning"
    >
      <span className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);
