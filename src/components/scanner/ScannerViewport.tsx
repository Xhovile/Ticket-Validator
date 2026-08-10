import React from 'react';
import { Camera, ChevronDown, ChevronUp, ZoomIn } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export const ScannerViewport: React.FC<{ regionId: string; cameraActive: boolean; zoomLevel: number; zoomOpen: boolean; onToggleZoom: () => void }> = ({ regionId, cameraActive, zoomLevel, zoomOpen, onToggleZoom }) => (
  <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm">
    <div id={regionId} className="h-full w-full overflow-hidden" />
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative h-52 w-52">
        <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-lg border-l-2 border-t-2 border-blue-500" />
        <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-lg border-r-2 border-t-2 border-blue-500" />
        <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-2 border-l-2 border-blue-500" />
        <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-lg border-b-2 border-r-2 border-blue-500" />
        <span className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-blue-500/80 animate-pulse" />
      </div>
    </div>
    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
      <div className="rounded-lg bg-black/65 px-2.5 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm">{cameraActive ? 'Camera ready · Scan QR code' : 'Starting camera…'}</div>
      <button type="button" onClick={() => { onToggleZoom(); soundFX.playClick(); }} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm ${zoomOpen ? 'border-blue-400 bg-blue-600' : 'border-white/15 bg-black/65'}`} aria-expanded={zoomOpen}>
        <ZoomIn className="h-3.5 w-3.5 text-white" /><span>{zoomLevel.toFixed(1)}×</span>{zoomOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
    </div>
    {!cameraActive && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/85 px-6 text-center text-white"><Camera className="h-7 w-7 text-slate-300" /><p className="mt-3 text-xs font-semibold text-white">Preparing camera</p><p className="mt-1 text-[10px] leading-5 text-slate-300">Allow camera access and point it at the attendee's QR code.</p></div>}
  </div>
);
