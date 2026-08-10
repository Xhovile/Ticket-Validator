import React from 'react';
import { Zap } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export const ContinuousScanControl: React.FC<{ active: boolean; onToggle?: () => void }> = ({ active, onToggle }) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
    <div className="flex min-w-0 items-center gap-2.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-[#020617] text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Zap className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-950">Continuous scanning</span>
          {active && <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">On</span>}
        </div>
        <p className="text-[10px] text-slate-500">{active ? 'Ready for the next ticket automatically' : 'Dismiss each result manually'}</p>
      </div>
    </div>
    <button type="button" onClick={() => { onToggle?.(); soundFX.playClick(); }} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${active ? 'bg-[#020617]' : 'bg-slate-300'}`} role="switch" aria-checked={active}>
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);
