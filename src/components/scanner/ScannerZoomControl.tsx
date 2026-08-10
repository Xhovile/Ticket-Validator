import React from 'react';
import { ChevronUp, ZoomIn, ZoomOut } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export const ScannerZoomControl: React.FC<{ zoomLevel: number; onZoom: (level: number) => void; onClose: () => void }> = ({ zoomLevel, onZoom, onClose }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><ZoomIn className="h-3.5 w-3.5" /></span>
        Camera zoom
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] font-bold text-slate-700">{zoomLevel.toFixed(1)}×</span>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close zoom controls">
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="mt-3 flex items-center gap-2">
      <button type="button" onClick={() => { onZoom(Math.max(1, Math.round((zoomLevel - .2) * 10) / 10)); soundFX.playClick(); }} disabled={zoomLevel <= 1} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </button>
      <input type="range" min="1" max="3.5" step=".1" value={zoomLevel} onChange={e => onZoom(parseFloat(e.target.value))} className="h-1.5 w-full cursor-pointer accent-slate-950" aria-label="Camera zoom slider" />
      <button type="button" onClick={() => { onZoom(Math.min(3.5, Math.round((zoomLevel + .2) * 10) / 10)); soundFX.playClick(); }} disabled={zoomLevel >= 3.5} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </button>
    </div>

    <div className="mt-3 border-t border-slate-100 pt-3">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Quick zoom</p>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 1.5, 2, 2.5, 3].map(preset => (
          <button key={preset} type="button" onClick={() => { onZoom(preset); soundFX.playClick(); }} className={`rounded-lg border py-2 text-[10px] font-mono font-bold transition ${zoomLevel === preset ? 'border-[#020617] bg-[#020617] text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
            {preset}×
          </button>
        ))}
      </div>
    </div>
  </div>
);
