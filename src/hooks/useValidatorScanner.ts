import { useEffect, useRef, useState } from 'react';
import { Ticket, User, EventItem, CheckInSession } from '../types';
import { soundFX } from '../utils/audio';

type ScanResult = {
  ticket: Ticket;
  scanTime: string;
  isDuplicate: boolean;
  isOfflineQueued?: boolean;
};

type ScannerOptions = {
  selectedEvent: EventItem | null;
  currentUser: User | null;
  activeSession: CheckInSession | null;
  tickets: Ticket[];
  isOnline: boolean;
  isSimulatedOffline: boolean;
  updateTicketStatus: (ticketId: string, newStatus: Ticket['status'], gateNameOverride?: string, staffNameOverride?: string, timestampOverride?: string, isOfflineAction?: boolean) => void;
};

export function useValidatorScanner({ selectedEvent, currentUser, activeSession, tickets, isOnline, isSimulatedOffline, updateTicketStatus }: ScannerOptions) {
  const [isContinuousScan, setIsContinuousScan] = useState(true);
  const [activeScanResult, setActiveScanResult] = useState<ScanResult | null>(null);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanThrottleRef = useRef({ code: '', time: 0 });

  useEffect(() => () => {
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
  }, []);

  const handleDismissResult = () => {
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    autoDismissTimerRef.current = null;
    setActiveScanResult(null);
  };

  const scheduleAutoDismiss = (delay: number) => {
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    autoDismissTimerRef.current = setTimeout(() => {
      setActiveScanResult(null);
      autoDismissTimerRef.current = null;
    }, delay);
  };

  const handleScanTicket = (scannedCode: string) => {
    if (!selectedEvent || !currentUser || !activeSession?.active) return;
    const now = Date.now();
    if (lastScanThrottleRef.current.code === scannedCode && now - lastScanThrottleRef.current.time < 1500) return;
    lastScanThrottleRef.current = { code: scannedCode, time: now };

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const effectiveOffline = !isOnline || isSimulatedOffline;
    const foundTicket = tickets.find((ticket) => ticket.qrPayload === scannedCode || ticket.id === scannedCode);

    if (!foundTicket) {
      soundFX.playError();
      setActiveScanResult(null);
      return;
    }

    if (foundTicket.status !== 'Waiting Entry') {
      soundFX.playError();
      setActiveScanResult({ ticket: foundTicket, scanTime: timestamp, isDuplicate: foundTicket.status === 'Inside', isOfflineQueued: false });
      scheduleAutoDismiss(2500);
      return;
    }

    soundFX.playSuccess();
    updateTicketStatus(foundTicket.id, 'Inside', activeSession.gateName, currentUser.name, timestamp, effectiveOffline);

    const updatedTicket: Ticket = {
      ...foundTicket,
      status: 'Inside',
      lastCheckedInTime: timestamp,
      lastGateName: activeSession.gateName,
      lastStaffName: currentUser.name,
    };

    setActiveScanResult({ ticket: updatedTicket, scanTime: timestamp, isDuplicate: false, isOfflineQueued: effectiveOffline });
    scheduleAutoDismiss(isContinuousScan ? 1800 : 2500);
  };

  return { isContinuousScan, setIsContinuousScan, activeScanResult, handleScanTicket, handleDismissResult };
}

export type ValidatorScanner = ReturnType<typeof useValidatorScanner>;
