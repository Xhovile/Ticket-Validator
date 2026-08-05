import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Radio, Zap, Search, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { EventItem, CheckInSession, Ticket, TicketStatus } from '../types';
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
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
            setCameraError(null);
          })
          .catch((err) => {
            console.log('Camera start fallback:', err);
            setCameraActive(false);
            setCameraError('Camera access unavailable or blocked. You can use manual entry or quick test scan buttons below.');
          });
      } catch (e) {
        setCameraError('Camera initialization fallback');
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
        <div className="w-16 h-16 rounded-full bg-[#8db600]/10 border border-[#8db600]/40 flex items-center justify-center text-[#8db600] shadow-xl">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">No Active Check-in Session</h2>
          <p className="text-xs text-gray-400">
            You must initialize a gate session for <strong>{event.name}</strong> before scanning tickets.
          </p>
        </div>

        <button
          onClick={onStartSessionRequest}
          className="w-full py-3.5 px-4 bg-[#8db600] hover:bg-[#9ef01a] text-[#0f0f0f] font-bold text-xs rounded-xl shadow-lg shadow-[#8db600]/20 flex items-center justify-center gap-2 transition"
        >
          <Radio className="w-4 h-4" />
          <span>Start Gate Session Now</span>
        </button>

        <button
          onClick={onBackToEvent}
          className="text-xs text-gray-400 hover:text-white underline pt-2"
        >
          Back to Event Details
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-[#0f0f0f] text-white flex flex-col justify-between pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Sleek Top Gate Info */}
      <div className="flex items-center justify-between py-2 border-b border-[#26282e]">
        <button
          onClick={onBackToEvent}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Event</span>
        </button>

        <div className="flex items-center gap-2 text-center">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8db600] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8db600]"></span>
          </span>
          <div>
            <span className="text-xs font-bold text-[#8db600]">{session.gateName}</span>
            <span className="text-[10px] text-gray-400 block">{session.staffName}</span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded bg-[#16171b] border border-[#26282e] text-[10px] text-gray-300 font-mono">
          {session.scanCount} Scanned
        </span>
      </div>

      {/* Main Scanner View - Ultra Clean Design */}
      <div className="my-auto py-4 space-y-4">
        <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-[#16171b] border-2 border-[#8db600]/40 shadow-2xl shadow-[#8db600]/10">
          
          {/* HTML5 QR Code Container */}
          <div id={regionId} className="w-full h-full object-cover overflow-hidden" />

          {/* Scanner Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8">
            {/* Top Bar Label */}
            <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#8db600]/40 text-[11px] font-semibold text-[#8db600] flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#8db600] animate-ping" />
              <span>Ready to Scan</span>
            </div>

            {/* Target Box Corners */}
            <div className="w-48 h-48 relative flex items-center justify-center">
              {/* Top Left Corner */}
              <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#8db600] rounded-tl-xl" />
              {/* Top Right Corner */}
              <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#8db600] rounded-tr-xl" />
              {/* Bottom Left Corner */}
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#8db600] rounded-bl-xl" />
              {/* Bottom Right Corner */}
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#8db600] rounded-br-xl" />

              {/* Laser Scanning Bar */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#8db600] to-transparent shadow-[0_0_12px_#8db600] animate-pulse" />
            </div>

            {/* Bottom Camera Hint */}
            <p className="text-[11px] text-gray-300 font-medium bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
              Center BuyMeShow QR code in frame
            </p>
          </div>

          {!cameraActive && (
            <div className="absolute inset-0 bg-[#0f0f0f]/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
              <Camera className="w-10 h-10 text-[#8db600] animate-bounce" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Camera View Active</p>
                <p className="text-[11px] text-gray-400">Point phone at attendee ticket QR code or tap a test ticket below.</p>
              </div>
            </div>
          )}
        </div>

        {/* Manual Code Entry */}
        <form onSubmit={handleManualSubmit} className="max-w-[320px] mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter Ticket ID (e.g. BMS-8491-01)"
              className="w-full pl-9 pr-3 py-2 bg-[#16171b] border border-[#26282e] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8db600] focus:ring-1 focus:ring-[#8db600]"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-3 bg-[#8db600] hover:bg-[#9ef01a] text-[#0f0f0f] font-bold text-xs rounded-xl transition shrink-0"
          >
            Check
          </button>
        </form>

        {/* Quick Demo Test Buttons */}
        <div className="max-w-[320px] mx-auto space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-1">
            <span>Instant Test QR Triggers</span>
            <span>Tap to simulate scan</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {sampleTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSimulateScan(t.qrPayload)}
                className="p-2 rounded-xl bg-[#16171b] hover:bg-[#202228] border border-[#26282e] text-left transition text-xs space-y-0.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate text-[11px] group-hover:text-[#8db600]">{t.attendeeName}</span>
                  <span className={`text-[9px] px-1 rounded font-mono ${
                    t.status === 'Inside' ? 'bg-amber-950 text-amber-300' :
                    t.status === 'Cancelled' || t.status === 'Blocked' ? 'bg-red-950 text-red-300' :
                    'bg-[#8db600]/20 text-[#8db600]'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
                  <span>#{t.id}</span>
                  <span className="text-gray-500">{t.ticketTier.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
