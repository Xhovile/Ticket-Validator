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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startRequestRef = useRef(0);
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

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch (_) {}
    try { scanner.clear(); } catch (_) {}
  };

  const getCameraErrorMessage = (error: unknown) => {
    const message = String(error ?? '').toLowerCase();
    if (message.includes('permission') || message.includes('notallowed') || message.includes('denied')) return 'Camera access was blocked. Allow camera permission for Ticket Validator, then tap Retry.';
    if (message.includes('notfound') || message.includes('no camera') || message.includes('device')) return 'No usable camera was found on this device.';
    if (message.includes('secure') || message.includes('https')) return 'Camera access requires a secure (HTTPS) connection.';
    return 'The camera could not start. Tap Retry to try again.';
  };

  const startCamera = async () => {
    const requestId = ++startRequestRef.current;
    await stopScanner();
    setCameraActive(false);
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera API unavailable');

      const permissionStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      permissionStream.getTracks().forEach((track) => track.stop());
      if (requestId !== startRequestRef.current) return;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) throw new Error('No camera devices found');
      const preferredCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ?? cameras[0];
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      await scanner.start(preferredCamera.id, { fps: 10, qrbox: { width: 250, height: 250 } }, (decodedText) => onScanTicket(decodedText), () => {});
      if (requestId !== startRequestRef.current) { await stopScanner(); return; }

      setCameraActive(true);
      setCameraError(null);
      setTimeout(() => applyZoom(zoomLevel), 300);
    } catch (error) {
      if (requestId !== startRequestRef.current) return;
      setCameraActive(false);
      setCameraError(getCameraErrorMessage(error));
      await stopScanner();
    } finally {
      if (requestId === startRequestRef.current) setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (!(session && session.active && event.state === 'Live')) {
      void stopScanner();
      return;
    }
    void startCamera();
    return () => {
      startRequestRef.current += 1;
      void stopScanner();
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
        <ScannerViewport regionId={regionId} cameraActive={cameraActive} cameraError={cameraError} isStartingCamera={isStartingCamera} onRetryCamera={() => { void startCamera(); }} zoomLevel={zoomLevel} zoomOpen={isZoomOpen} onToggleZoom={() => setIsZoomOpen(v => !v)} />
        {isZoomOpen && <ScannerZoomControl zoomLevel={zoomLevel} onZoom={applyZoom} onClose={() => setIsZoomOpen(false)} />}
        <ManualTicketEntry value={manualCode} onChange={setManualCode} onSubmit={handleManualSubmit} />
        <TestScanningTools tickets={sampleTickets} onSimulate={onScanTicket} />
      </div>
    </div>
  );
};
