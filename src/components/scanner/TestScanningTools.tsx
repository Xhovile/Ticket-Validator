import React from 'react';
import { Ticket } from '../../types';
import { soundFX } from '../../utils/audio';

export const TestScanningTools: React.FC<{ tickets: Ticket[]; onSimulate: (code: string) => void }> = ({ tickets, onSimulate }) => {
  if (!tickets.length) return null;
  return (
    <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold text-slate-600">Test scanning tools <span className="ml-1 font-normal text-slate-400">({tickets.length})</span></summary>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
        {tickets.map(t => <button key={t.id} onClick={() => { onSimulate(t.qrPayload); soundFX.playClick(); }} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left text-[10px] font-semibold text-slate-700 hover:bg-slate-100">
          <span className="block truncate">{t.attendeeName}</span><span className="mt-0.5 block truncate font-mono text-[9px] font-normal text-slate-400">{t.id}</span>
        </button>)}
      </div>
    </details>
  );
};
