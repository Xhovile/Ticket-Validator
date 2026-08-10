import React from 'react';
import { Camera, ChevronDown, ChevronUp, ScanLine, ZoomIn } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export const ScannerViewport: React.FC<{
  regionId: string;
  cameraActive: boolean;
  zoomLevel: number;
  zoomOpen: boolean;
  onToggleZoom: () => void;
}> = ({ regionId, cameraActive, zoomLevel, zoomOpen, onToggleZoom }) => (
  <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-[1.25rem] border border-slate-800 bg-[#020617] shadow-lg shadow-slate-950/10">
    <div id={regionId} className="h-full w-full overflow-hidden" />

    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/40" />

    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative h-[min(62vw,260px)] w-[min(62vw,260px)] max-h-[260px] max-w-[260px]">
        <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-2 border-t-2 border-sky-400" />
        <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-2 border-t-2 border-sky-400" />
        <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-sky-400" />
        <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-sky-400" />
        {cameraActive && <span className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-sky-400/90 shadow-[0_0_10px_rgba(56,189,248,0.7)] animate-pulse" />}
      </div>
    </div>

    <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
      <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 text-[10px] font-medium text-white backdrop-blur-md">
        <span className={`h-1.5 w-1.5 rounded-full ${cameraActive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
        <span>{cameraActive ? 'Camera ready' : 'Starting camera'}</span>
      </div>

      <button
        type="button"
        onClick={() => { onToggleZoom(); soundFX.playClick(); }}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md transition ${zoomOpen ? 'border-white/20 bg-[#020617]' : 'border-white/10 bg-black/55 hover:bg-black/70'}`}
        aria-expanded={zoomOpen}
        aria-label="Camera zoom controls"
      >
        <ZoomIn className="h-3.5 w-3.5 text-white" />
        <span>{zoomLevel.toFixed(1)}×</span>
        {zoomOpen ? <ChevronUp className="h-3 w-3 text-white" /> : <ChevronDown className="h-3 w-3 text-white" />}
      </button>
    </div>

    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-center text-[10px] font-medium text-white backdrop-blur-md">
      {cameraActive ? 'Position QR code inside the frame' : 'Preparing camera…'}
    </div>

    {!cameraActive && (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#020617]/90 px-6 text-center text-white backdrop-blur-[2px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200">
          <Camera className="h-6 w-6 text-white" />
        </div>
        <p className="mt-4 text-sm font-semibold text-white">Preparing camera</p>
        <p className="mt-1.5 max-w-[250px] text-[10px] leading-5 text-slate-300">Allow camera access, then point the camera at the attendee's QR code.</p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          <ScanLine className="h-3 w-3" /> Scanner ready when camera connects
        </div>
      </div>
    )}
  </div>
);
