import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, ScanLine, Search, ArrowLeft } from 'lucide-react';
import { EventItem, CheckInSession, Ticket } from '../types';

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = 'html5qr-code-full-region';

  // Fast test scan triggers for demo evaluate
  const sampleTickets = tickets.slice(0, 6);

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
            {/* Top Bar Label */}
            <div className="px-3 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-[10px] font-medium text-slate-200 flex items-center gap-1.5">
              <span>Ready to Scan</span>
            </div>

            {/* Target Box Corners */}
            <div className="w-44 h-44 relative flex items-center justify-center">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg" />

              {/* Laser Scanning Bar */}
              <div className="w-full h-0.5 bg-blue-500/80 animate-pulse" />
            </div>

            {/* Bottom Camera Hint */}
            <p className="text-[10px] text-slate-300 font-medium bg-slate-900/80 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              Align QR code within reticle
            </p>
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
