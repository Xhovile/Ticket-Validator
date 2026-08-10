import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { EventItem, CheckInSession, Ticket } from '../types';
import { soundFX } from '../utils/audio';
import { ScannerHeader } from './scanner/ScannerHeader';
import { ContinuousScanControl } from './scanner/ContinuousScanControl';
import { ScannerViewport } from './scanner/ScannerViewport';
import { ScannerZoomControl } from './scanner/ScannerZoomControl';
import { ManualTicketEntry } from './scanner/ManualTicketEntry';
import { TestScanningTools } from './scanner/TestScanningTools';
import { ScannerEmptyState } from './scanner/ScannerEmptyState';

interface ScannerViewProps {
  event: EventItem;
  session: CheckInSession | null;
  tickets: Ticket[];
  onScanTicket: (scannedCode: string) => void;
  onBackToEvent: () => void;
  onStartSessionRequest: () => void;
  isContinuousScan?: boolean;
  onToggleContinuousScan?: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ event, session, tickets, onScanTicket, onBackToEvent, onStartSessionRequest, isContinuousScan = false, onToggleContinuousScan }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = 'html5qr-code-full-region';
  const sampleTickets = tickets.slice(0, 6);

  const applyZoom = (level: number) => {
    setZoomLevel(level);
    if (scannerRef.current && (scannerRef.current as any).getRunningTrackCapabilities) {
      try {
        const capabilities = (scannerRef.current as any).getRunningTrackCapabilities();
        if (capabilities && capabilities.zoom) (scannerRef.current as any).applyVideoConstraints({ advanced: [{ zoom: level }] });
      } catch (_) {}
    }
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
        html5QrCode.start({ facingMode: 'environment' }, config, decodedText => onScanTicket(decodedText), () => {})
          .then(() => { setCameraActive(true); setTimeout(() => applyZoom(zoomLevel), 300); })
          .catch(() => setCameraActive(false));
      } catch (_) { setCameraActive(false); }
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => { scannerRef.current = null; });
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

  if (!session || !session.active) return <ScannerEmptyState eventName={event.name} onStart={onStartSessionRequest} onBack={onBackToEvent} />;

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-md flex-col bg-[#fafafa] px-3 pb-24 pt-2 text-slate-900 sm:px-0">
      <ScannerHeader gateName={session.gateName} staffName={session.staffName} scanCount={session.scanCount} onBack={onBackToEvent} />
      <div className="my-auto space-y-3 py-3">
        <ContinuousScanControl active={isContinuousScan} onToggle={onToggleContinuousScan} />
        <ScannerViewport regionId={regionId} cameraActive={cameraActive} zoomLevel={zoomLevel} zoomOpen={isZoomOpen} onToggleZoom={() => setIsZoomOpen(v => !v)} />
        {isZoomOpen && <ScannerZoomControl zoomLevel={zoomLevel} onZoom={applyZoom} onClose={() => setIsZoomOpen(false)} />}
        <ManualTicketEntry value={manualCode} onChange={setManualCode} onSubmit={handleManualSubmit} />
        <TestScanningTools tickets={sampleTickets} onSimulate={onScanTicket} />
      </div>
    </div>
  );
};
