import React from 'react';
import { ChevronUp, ZoomIn, ZoomOut } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export const ScannerZoomControl: React.FC<{ zoomLevel: number; onZoom: (level: number) => void; onClose: () => void }> = ({ zoomLevel, onZoom, onClose }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800"><ZoomIn className="h-3.5 w-3.5 text-slate-600" />Camera zoom</div>
      <div className="flex items-center gap-2"><span className="rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">{zoomLevel.toFixed(1)}×</span><button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ChevronUp className="h-3.5 w-3.5" /></button></div>
    </div>
    <div className="mt-2 flex items-center gap-2">
      <button type="button" onClick={() => { onZoom(Math.max(1, Math.round((zoomLevel - .2) * 10) / 10)); soundFX.playClick(); }} disabled={zoomLevel <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"><ZoomOut className="h-4 w-4" /></button>
      <input type="range" min="1" max="3.5" step=".1" value={zoomLevel} onChange={e => onZoom(parseFloat(e.target.value))} className="h-1.5 w-full cursor-pointer accent-slate-900" aria-label="Camera zoom slider" />
      <button type="button" onClick={() => { onZoom(Math.min(3.5, Math.round((zoomLevel + .2) * 10) / 10)); soundFX.playClick(); }} disabled={zoomLevel >= 3.5} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"><ZoomIn className="h-4 w-4" /></button>
    </div>
    <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-100 pt-2">
      {[1, 1.5, 2, 2.5, 3].map(preset => <button key={preset} type="button" onClick={() => { onZoom(preset); soundFX.playClick(); }} className={`flex-1 rounded-md border py-1 text-[10px] font-mono font-bold ${zoomLevel === preset ? 'border-[#020617] bg-[#020617] text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>{preset}×</button>)}
    </div>
  </div>
);
