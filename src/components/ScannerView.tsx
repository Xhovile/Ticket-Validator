import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, ScanLine, Search, ArrowLeft, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';
import { EventItem, CheckInSession, Ticket } from '../types';
import { soundFX } from '../utils/audio';

interface ScannerViewProps {
  event: EventItem;
  session: CheckInSession | null;
  tickets: Ticket[];
  onScanTicket: (scannedCode: string) => void;
  onBackToEvent: () => void;
  onStartSessionRequest: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  event,
  session,
  tickets,
  onScanTicket,
  onBackToEvent,
  onStartSessionRequest,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = 'html5qr-code-full-region';

  // Fast test scan triggers for demo evaluate
  const sampleTickets = tickets.slice(0, 6);

  // Apply zoom to hardware camera track if available, as well as CSS scale transform fallback
  const applyZoom = (level: number) => {
    setZoomLevel(level);

    // 1. Try Hardware Camera Track Zoom API
    if (scannerRef.current && (scannerRef.current as any).getRunningTrackCapabilities) {
      try {
        const capabilities = (scannerRef.current as any).getRunningTrackCapabilities();
        if (capabilities && capabilities.zoom) {
          (scannerRef.current as any).applyVideoConstraints({
            advanced: [{ zoom: level }]
          });
        }
      } catch (err) {
        // Fall back to CSS transform
      }
    }

    // 2. CSS Magnification Fallback on Video Element
    const videoElem = document.querySelector(`#${regionId} video`) as HTMLVideoElement | null;
    if (videoElem) {
      videoElem.style.transform = `scale(${level})`;
      videoElem.style.transformOrigin = 'center center';
      videoElem.style.transition = 'transform 0.15s ease-out';
    }
  };

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (session && session.active && event.state === 'Live') {
      try {
        html5QrCode = new Html5Qrcode(regionId);
        scannerRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode
          .start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              // Successfully scanned QR code!
              onScanTicket(decodedText);
            },
            () => {
              // Scan frame error (normal frame scanning)
            }
          )
          .then(() => {
            setCameraActive(true);
            // Re-apply current zoom setting after camera starts
            setTimeout(() => applyZoom(zoomLevel), 300);
          })
          .catch((err) => {
            console.log('Camera start fallback:', err);
            setCameraActive(false);
          });
      } catch (e) {
        setCameraActive(false);
      }
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [session, event.state]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanTicket(manualCode.trim());
      setManualCode('');
    }
  };

  const handleSimulateScan = (code: string) => {
    onScanTicket(code);
  };

  // If session is not started yet or event is not Live
  if (!session || !session.active) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-md">
          <ScanLine className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">No Active Check-in Session</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            You must initialize a gate session for <strong>{event.name}</strong> before scanning tickets.
          </p>
        </div>

        {/* Solid Deep Blue Primary Button */}
        <button
          onClick={onStartSessionRequest}
          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition min-h-[44px]"
        >
          <ScanLine className="w-4 h-4" />
          <span>Start Gate Session Now</span>
        </button>

        <button
          onClick={onBackToEvent}
          className="text-xs text-slate-500 hover:text-slate-900 underline pt-2 font-medium min-h-[40px] flex items-center justify-center"
        >
          Back to Event Details
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-slate-50 text-slate-900 flex flex-col justify-between pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Sleek Top Gate Info */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200 bg-white px-3 rounded-xl border">
        <button
          onClick={onBackToEvent}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition min-h-[32px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Event</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-900">{session.gateName}</span>
          <span className="text-[10px] text-slate-500 block">{session.staffName}</span>
        </div>

        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-mono font-medium">
          {session.scanCount} Scanned
        </span>
      </div>

      {/* Main Scanner View - Outdoor High Contrast Design */}
      <div className="my-auto py-3 space-y-4">
        <div className="relative w-full aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
          
          {/* HTML5 QR Code Container */}
          <div id={regionId} className="w-full h-full object-cover overflow-hidden" />

          {/* Scanner Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-5">
            {/* Top spacer */}
            <div className="h-2" />

            {/* Target Box Corners */}
            <div className="w-44 h-44 relative flex items-center justify-center">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg" />

              {/* Laser Scanning Bar */}
              <div className="w-full h-0.5 bg-blue-500/80 animate-pulse" />
            </div>

            {/* Bottom Right Accordion ZOOM Button */}
            <div className="w-full flex items-center justify-end pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setIsZoomOpen(!isZoomOpen);
                  soundFX.playClick();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-md transition-all ${
                  isZoomOpen
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/30'
                    : 'bg-slate-900/90 text-slate-100 border border-slate-700 hover:bg-slate-800 hover:border-slate-500'
                }`}
                aria-expanded={isZoomOpen}
                title="Toggle camera zoom controls"
              >
                <ZoomIn className="w-3.5 h-3.5 text-blue-300" />
                <span className="tracking-wide">ZOOM</span>
                <span className="text-[10px] font-mono bg-black/40 px-1 py-0.2 rounded font-semibold text-blue-200">
                  {zoomLevel.toFixed(1)}x
                </span>
                {isZoomOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!cameraActive && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 text-white">
              <Camera className="w-8 h-8 text-slate-400" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">Camera View Active</p>
                <p className="text-[11px] text-slate-400">Point camera at attendee ticket QR code or tap a test ticket below.</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Optical / Digital Zoom Slider Accordion Card */}
        {isZoomOpen && (
          <div className="max-w-[300px] mx-auto bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between text-xs font-medium text-slate-800">
              <div className="flex items-center gap-1.5 text-slate-700">
                <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-semibold">Camera Zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {zoomLevel.toFixed(1)}x
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                  title="Close Zoom"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextLevel = Math.max(1, Math.round((zoomLevel - 0.2) * 10) / 10);
                  applyZoom(nextLevel);
                  soundFX.playClick();
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 transition min-h-[32px] min-w-[32px] flex items-center justify-center disabled:opacity-40"
                title="Zoom out"
                disabled={zoomLevel <= 1}
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1"
                max="3.5"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => applyZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                aria-label="Camera zoom slider"
              />

              <button
                type="button"
                onClick={() => {
                  const nextLevel = Math.min(3.5, Math.round((zoomLevel + 0.2) * 10) / 10);
                  applyZoom(nextLevel);
                  soundFX.playClick();
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 transition min-h-[32px] min-w-[32px] flex items-center justify-center disabled:opacity-40"
                title="Zoom in"
                disabled={zoomLevel >= 3.5}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Zoom Chips */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
              {[1, 1.5, 2, 2.5, 3].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    applyZoom(preset);
                    soundFX.playClick();
                  }}
                  className={`flex-1 py-1 text-[10px] font-mono font-bold rounded transition border ${
                    zoomLevel === preset
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Code Entry */}
        <form onSubmit={handleManualSubmit} className="max-w-[300px] mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter Ticket ID (e.g. BMS-8491-01)"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 min-h-[40px]"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl transition shrink-0 min-h-[40px]"
          >
            Check
          </button>
        </form>

        {/* Quick Demo Test Buttons */}
        <div className="max-w-[300px] mx-auto space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1">
            <span>Instant Test Triggers</span>
            <span>Tap to simulate</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {sampleTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSimulateScan(t.qrPayload)}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition text-xs space-y-0.5 group min-h-[44px] shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 truncate text-[11px] group-hover:text-blue-600">{t.attendeeName}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                    t.status === 'Inside' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    t.status === 'Cancelled' || t.status === 'Blocked' || t.status === 'Refunded' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between font-medium">
                  <span>#{t.id}</span>
                  <span className="text-slate-400">{t.ticketTier.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
