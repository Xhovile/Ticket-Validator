import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { User, EventItem, Ticket, TicketStatus, ActivityLogEntry, CheckInSession } from './types';
import {
  loadStoredUser,
  saveStoredUser,
  loadStoredEvents,
  saveStoredEvents,
  loadStoredTickets,
  saveStoredTickets,
  loadStoredLogs,
  saveStoredLogs,
  loadStoredSession,
  saveStoredSession,
} from './data/mockData';
import { soundFX } from './utils/audio';
import {
  getOfflineQueue,
  enqueueValidation,
  clearOfflineQueue,
  QueuedValidation,
} from './utils/offlineSyncManager';

// Components
import { Header } from './components/Header';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { FooterNavigation, NavTab } from './components/FooterNavigation';
import { LoginView } from './components/LoginView';
import { EventsView } from './components/EventsView';
import { EventDetailView } from './components/EventDetailView';
import { CheckInSessionModal } from './components/CheckInSessionModal';
import { ScannerView } from './components/ScannerView';
import { ScanResultCard } from './components/ScanResultCard';
import { AttendeesView } from './components/AttendeesView';
import { TicketDetailModal } from './components/TicketDetailModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStoredUser());
  const [events, setEvents] = useState<EventItem[]>(() => loadStoredEvents());
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(() => {
    const user = loadStoredUser();
    const evts = loadStoredEvents();
    if (!user) return evts[0] || null;
    const authEvts = evts.filter(e => user.role === 'organizer' ? e.organizerId === user.id : user.assignedEventIds.includes(e.id));
    return authEvts[0] || null;
  });
  const [tickets, setTickets] = useState<Ticket[]>(() => loadStoredTickets());
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => loadStoredLogs());
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(() => loadStoredSession());

  // UI Navigation state
  const [currentTab, setCurrentTab] = useState<NavTab>('events');
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('buymesho_high_contrast') === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('sunlight-high-contrast', isHighContrast);
    localStorage.setItem('buymesho_high_contrast', String(isHighContrast));
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => !prev);
    soundFX.playClick();
  };

  // Modals & Active Overlays
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isContinuousScan, setIsContinuousScan] = useState<boolean>(true);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanThrottleRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const [activeScanResult, setActiveScanResult] = useState<{
    ticket: Ticket;
    scanTime: string;
    isDuplicate: boolean;
    isOfflineQueued?: boolean;
  } | null>(null);

  const handleDismissResult = () => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    setActiveScanResult(null);
  };
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);

  // Offline & Background Sync state
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedValidation[]>(() => getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const handleSyncNow = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    setIsSyncing(true);

    // Simulate background network sync with BuyMesho server
    await new Promise((res) => setTimeout(res, 800));

    const count = queue.length;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const syncLog: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp,
      eventId: selectedEvent?.id || 'evt-neon-2026',
      action: 'Checked In (Inside)',
      gateName: activeSession?.gateName || 'Main Gate',
      staffName: currentUser?.name || 'Gate Officer',
      statusBadge: 'success',
      details: `Background Sync: ${count} offline ticket validation${count > 1 ? 's' : ''} synced with server`,
    };

    setLogs((prev) => [syncLog, ...prev]);
    clearOfflineQueue();
    setOfflineQueue([]);
    setIsSyncing(false);
    soundFX.playSuccess();

    setSyncToastMessage(`Successfully synced ${count} offline ticket validation${count > 1 ? 's' : ''} with BuyMesho server!`);
    setTimeout(() => setSyncToastMessage(null), 4000);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        handleSyncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'BACKGROUND_SYNC_TRIGGERED') {
          handleSyncNow();
        }
      };
      navigator.serviceWorker.addEventListener('message', messageHandler);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save states to localStorage whenever they mutate
  useEffect(() => {
    if (currentUser) saveStoredUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveStoredEvents(events);
  }, [events]);

  useEffect(() => {
    saveStoredTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    saveStoredLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveStoredSession(activeSession);
  }, [activeSession]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setPermissionError(null);
    const userEvts = events.filter(e => user.role === 'organizer' ? e.organizerId === user.id : user.assignedEventIds.includes(e.id));
    setSelectedEvent(userEvts[0] || null);
    soundFX.playSuccess();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSession(null);
    saveStoredSession(null);
    soundFX.playClick();
  };

  const handleSwitchUser = (newUser: User) => {
    setCurrentUser(newUser);
    setPermissionError(null);
    const userEvts = events.filter(e => newUser.role === 'organizer' ? e.organizerId === newUser.id : newUser.assignedEventIds.includes(e.id));
    setSelectedEvent(userEvts[0] || null);
    soundFX.playClick();
  };

  // Event Selection & Permissions Guard
  const handleSelectEvent = (event: EventItem) => {
    if (!currentUser) return;

    // Check permissions requirement:
    // Only allow access to events owned by the organizer or explicitly granted to them
    const hasPermission =
      currentUser.role === 'organizer'
        ? event.organizerId === currentUser.id
        : currentUser.assignedEventIds.includes(event.id);

    if (!hasPermission) {
      soundFX.playError();
      setPermissionError(
        `Permission Denied: Account '${currentUser.name}' does not have gate scanning authorization for '${event.name}'. Contact event organizer on BuyMesho.`
      );
      return;
    }

    setPermissionError(null);
    setSelectedEvent(event);
    setViewState('detail');
    setIsDetailLoading(true);
    setTimeout(() => setIsDetailLoading(false), 300);
    soundFX.playClick();
  };

  // Start Check-in Session
  const handleStartSessionConfirm = (session: CheckInSession) => {
    setActiveSession(session);
    setShowSessionModal(false);

    // Create log
    const newLog: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      eventId: session.eventId,
      action: 'Check-in Session Started',
      gateName: session.gateName,
      staffName: session.staffName,
      statusBadge: 'info',
      details: `Gate scan session initialized for ${session.gateName}`,
    };

    setLogs((prev) => [newLog, ...prev]);
    setCurrentTab('scan');
    soundFX.playSuccess();
  };

  // Scanning Core Logic
  const handleScanTicket = (scannedCode: string) => {
    if (!selectedEvent || !currentUser || !activeSession) return;

    const now = Date.now();
    const cleanCode = scannedCode.trim().toLowerCase();
    const effectiveOffline = !isOnline || isSimulatedOffline;

    // Throttle identical code scans within 1.5s when in continuous scan mode
    if (
      isContinuousScan &&
      lastScanThrottleRef.current.code === cleanCode &&
      now - lastScanThrottleRef.current.time < 1500
    ) {
      return;
    }
    lastScanThrottleRef.current = { code: cleanCode, time: now };

    // Clear any previous auto-dismiss timer
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Schedule helper for continuous mode auto dismissal
    const scheduleAutoDismiss = (delayMs: number = 1800) => {
      if (isContinuousScan) {
        autoDismissTimerRef.current = setTimeout(() => {
          setActiveScanResult(null);
          autoDismissTimerRef.current = null;
        }, delayMs);
      }
    };

    // Find ticket by QR payload or Ticket ID
    const foundTicket = tickets.find(
      (t) =>
        t.eventId === selectedEvent.id &&
        (t.qrPayload.toLowerCase() === cleanCode || t.id.toLowerCase() === cleanCode)
    );

    if (!foundTicket) {
      soundFX.playError();
      // Record failed scan log
      const failLog: ActivityLogEntry = {
        id: `log-${Date.now()}`,
        timestamp,
        eventId: selectedEvent.id,
        action: 'Unauthorized Ticket Scan',
        gateName: activeSession.gateName,
        staffName: currentUser.name,
        statusBadge: 'danger',
        details: `Invalid ticket QR payload: ${scannedCode}`,
      };
      setLogs((prev) => [failLog, ...prev]);

      // Show mock unknown ticket result card
      const unknownTicket: Ticket = {
        id: scannedCode.toUpperCase(),
        qrPayload: scannedCode,
        eventId: selectedEvent.id,
        attendeeName: 'Unknown Attendee / Unrecognized Ticket',
        attendeeEmail: 'unknown@example.com',
        attendeePhone: 'N/A',
        ticketTier: 'Invalid Barcode',
        price: 0,
        purchaseDate: 'N/A',
        status: 'Blocked',
        notes: 'Barcode not found in BuyMesho database',
      };

      setActiveScanResult({
        ticket: unknownTicket,
        scanTime: timestamp,
        isDuplicate: false,
      });
      scheduleAutoDismiss(2500);
      return;
    }

    // Ticket found! Increment session count
    setActiveSession((prev) => (prev ? { ...prev, scanCount: prev.scanCount + 1 } : null));

    // Handle ticket state checks
    if (foundTicket.status === 'Inside') {
      // Duplicate scan warning!
      soundFX.playWarning();
      const dupLog: ActivityLogEntry = {
        id: `log-${Date.now()}`,
        timestamp,
        eventId: selectedEvent.id,
        ticketId: foundTicket.id,
        attendeeName: foundTicket.attendeeName,
        action: 'Duplicate Scan Warning',
        gateName: activeSession.gateName,
        staffName: currentUser.name,
        statusBadge: 'warning',
        details: 'Attempted scan of ticket already checked inside venue',
      };
      setLogs((prev) => [dupLog, ...prev]);

      setActiveScanResult({
        ticket: foundTicket,
        scanTime: timestamp,
        isDuplicate: true,
      });
      scheduleAutoDismiss(2200);
    } else if (foundTicket.status === 'Cancelled' || foundTicket.status === 'Refunded' || foundTicket.status === 'Blocked') {
      // Invalid status scan
      soundFX.playError();
      const invalidLog: ActivityLogEntry = {
        id: `log-${Date.now()}`,
        timestamp,
        eventId: selectedEvent.id,
        ticketId: foundTicket.id,
        attendeeName: foundTicket.attendeeName,
        action: 'Unauthorized Ticket Scan',
        gateName: activeSession.gateName,
        staffName: currentUser.name,
        statusBadge: 'danger',
        details: `Ticket status is ${foundTicket.status}`,
      };
      setLogs((prev) => [invalidLog, ...prev]);

      setActiveScanResult({
        ticket: foundTicket,
        scanTime: timestamp,
        isDuplicate: false,
      });
      scheduleAutoDismiss(2500);
    } else {
      // Valid entry! Auto-check inside
      soundFX.playSuccess();
      updateTicketStatus(foundTicket.id, 'Inside', activeSession.gateName, currentUser.name, timestamp, effectiveOffline);

      const updatedTicket: Ticket = {
        ...foundTicket,
        status: 'Inside',
        lastCheckedInTime: timestamp,
        lastGateName: activeSession.gateName,
        lastStaffName: currentUser.name,
      };

      setActiveScanResult({
        ticket: updatedTicket,
        scanTime: timestamp,
        isDuplicate: false,
        isOfflineQueued: effectiveOffline,
      });
      scheduleAutoDismiss(1800);
    }
  };

  // Status Updater Function
  const updateTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    gateNameOverride?: string,
    staffNameOverride?: string,
    timestampOverride?: string,
    isOfflineAction?: boolean
  ) => {
    const timestamp = timestampOverride || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const gate = gateNameOverride || activeSession?.gateName || 'Main Gate';
    const staff = staffNameOverride || currentUser?.name || 'Gate Officer';
    const effectiveOffline = isOfflineAction !== undefined ? isOfflineAction : (!isOnline || isSimulatedOffline);

    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (targetTicket && effectiveOffline) {
      enqueueValidation({
        ticketId,
        eventId: targetTicket.eventId,
        attendeeName: targetTicket.attendeeName,
        ticketTier: targetTicket.ticketTier,
        actionType: newStatus === 'Inside' ? 'check_in' : 'status_change',
        newStatus,
        previousStatus: targetTicket.status,
        gateName: gate,
        staffName: staff,
      });
      setOfflineQueue(getOfflineQueue());
    }

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const oldStatus = t.status;

          // Update Event Checked-in Counter
          if (oldStatus !== 'Inside' && newStatus === 'Inside') {
            setEvents((evts) =>
              evts.map((e) => (e.id === t.eventId ? { ...e, checkedInCount: e.checkedInCount + 1 } : e))
            );
          } else if (oldStatus === 'Inside' && newStatus !== 'Inside') {
            setEvents((evts) =>
              evts.map((e) => (e.id === t.eventId ? { ...e, checkedInCount: Math.max(0, e.checkedInCount - 1) } : e))
            );
          }

          return {
            ...t,
            status: newStatus,
            lastCheckedInTime: newStatus === 'Inside' ? timestamp : t.lastCheckedInTime,
            lastCheckedOutTime: newStatus === 'Outside' ? timestamp : t.lastCheckedOutTime,
            lastGateName: gate,
            lastStaffName: staff,
          };
        }
        return t;
      })
    );

    // Add activity log entry
    let actionType: ActivityLogEntry['action'] = 'Checked In (Inside)';
    let badge: ActivityLogEntry['statusBadge'] = 'success';

    if (newStatus === 'Inside') {
      actionType = 'Checked In (Inside)';
      badge = 'success';
    } else if (newStatus === 'Outside') {
      actionType = 'Checked Out (Outside)';
      badge = 'warning';
    } else if (newStatus === 'Cancelled') {
      actionType = 'Status Changed: Cancelled';
      badge = 'danger';
    } else if (newStatus === 'Refunded') {
      actionType = 'Status Changed: Refunded';
      badge = 'danger';
    } else if (newStatus === 'Blocked') {
      actionType = 'Status Changed: Blocked';
      badge = 'danger';
    } else {
      actionType = 'Status Changed: Waiting Entry';
      badge = 'info';
    }

    const logEntry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp,
      eventId: selectedEvent?.id || 'evt-neon-2026',
      ticketId,
      attendeeName: targetTicket?.attendeeName,
      action: actionType,
      gateName: gate,
      staffName: staff,
      statusBadge: badge,
      details: effectiveOffline ? 'Validated Offline (Queued for Sync)' : `Gate action: Ticket status updated to ${newStatus}`,
    };

    setLogs((prev) => [logEntry, ...prev]);
  };

  // If not logged in, show Login view
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
        <Header
          user={null}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          activeSession={null}
          isHighContrast={isHighContrast}
          onToggleHighContrast={toggleHighContrast}
        />
        <main>
          <LoginView onLogin={handleLogin} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        activeSession={activeSession}
        activeEventName={selectedEvent?.name}
        isHighContrast={isHighContrast}
        onToggleHighContrast={toggleHighContrast}
      />

      {/* Offline & Background Sync Banner */}
      <OfflineSyncBanner
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        queuedItems={offlineQueue}
        isSyncing={isSyncing}
        onToggleSimulatedOffline={() => setIsSimulatedOffline((prev) => !prev)}
        onSyncNow={handleSyncNow}
        onClearQueue={() => {
          clearOfflineQueue();
          setOfflineQueue([]);
        }}
      />

      {/* Sync Notification Toast */}
      {syncToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{syncToastMessage}</span>
        </div>
      )}

      {/* Main View Container */}
      <main className="transition-all duration-200">
        {currentTab === 'events' && (
          <>
            {viewState === 'list' || !selectedEvent ? (
              <EventsView
                user={currentUser}
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={handleSelectEvent}
                permissionError={permissionError}
                onClearPermissionError={() => setPermissionError(null)}
              />
            ) : (
              <EventDetailView
                event={selectedEvent}
                isLoading={isDetailLoading}
                onBack={() => setViewState('list')}
                onStartScanning={() => {
                  if (activeSession && activeSession.active && activeSession.eventId === selectedEvent.id) {
                    setCurrentTab('scan');
                  } else {
                    setShowSessionModal(true);
                  }
                }}
                onViewAttendees={() => {
                  setCurrentTab('attendees');
                  setIsAttendeesLoading(true);
                  setTimeout(() => setIsAttendeesLoading(false), 300);
                }}
                activeSession={activeSession}
              />
            )}
          </>
        )}

        {currentTab === 'scan' && selectedEvent && (
          <ScannerView
            event={selectedEvent}
            session={activeSession}
            tickets={tickets}
            onScanTicket={handleScanTicket}
            onBackToEvent={() => setCurrentTab('events')}
            onStartSessionRequest={() => setShowSessionModal(true)}
            isContinuousScan={isContinuousScan}
            onToggleContinuousScan={() => setIsContinuousScan((prev) => !prev)}
          />
        )}

        {currentTab === 'attendees' && selectedEvent && (
          <AttendeesView
            event={selectedEvent}
            tickets={tickets}
            isLoading={isAttendeesLoading}
            onSelectTicket={(ticket) => setSelectedTicketForDetail(ticket)}
            onUpdateStatusDirect={(ticketId, status) => {
              updateTicketStatus(ticketId, status);
              soundFX.playClick();
            }}
          />
        )}
      </main>

      {/* Scan Result Overlay Popover */}
      {activeScanResult && (
        <ScanResultCard
          ticket={activeScanResult.ticket}
          scanTime={activeScanResult.scanTime}
          isDuplicateScan={activeScanResult.isDuplicate}
          isOfflineQueued={activeScanResult.isOfflineQueued}
          isContinuousMode={isContinuousScan}
          onUpdateStatus={(newStatus) => {
            updateTicketStatus(activeScanResult.ticket.id, newStatus);
            handleDismissResult();
            soundFX.playClick();
          }}
          onDismiss={handleDismissResult}
        />
      )}

      {/* Check-in Session Setup Modal */}
      {showSessionModal && selectedEvent && (
        <CheckInSessionModal
          event={selectedEvent}
          user={currentUser}
          onClose={() => setShowSessionModal(false)}
          onConfirmStartSession={handleStartSessionConfirm}
        />
      )}

      {/* Ticket Detail Modal */}
      {selectedTicketForDetail && (
        <TicketDetailModal
          ticket={selectedTicketForDetail}
          onClose={() => setSelectedTicketForDetail(null)}
          onUpdateStatus={(ticketId, newStatus) => {
            updateTicketStatus(ticketId, newStatus);
            soundFX.playClick();
          }}
        />
      )}

      {/* Footer Navigation */}
      <FooterNavigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'attendees' && currentTab !== 'attendees') {
            setIsAttendeesLoading(true);
            setTimeout(() => setIsAttendeesLoading(false), 300);
          }
          setCurrentTab(tab);
          setPermissionError(null);
        }}
        isScanningActive={Boolean(activeSession && activeSession.active)}
        hasActiveEvent={Boolean(selectedEvent)}
      />
    </div>
  );
}
