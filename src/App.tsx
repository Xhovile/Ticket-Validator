import React, { useState, useEffect } from 'react';
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
  resetAllDataToDefault,
} from './data/mockData';
import { soundFX } from './utils/audio';

// Components
import { Header } from './components/Header';
import { FooterNavigation, NavTab } from './components/FooterNavigation';
import { LoginView } from './components/LoginView';
import { EventsView } from './components/EventsView';
import { EventDetailView } from './components/EventDetailView';
import { CheckInSessionModal } from './components/CheckInSessionModal';
import { ScannerView } from './components/ScannerView';
import { ScanResultCard } from './components/ScanResultCard';
import { AttendeesView } from './components/AttendeesView';
import { ActivityLogView } from './components/ActivityLogView';
import { TicketDetailModal } from './components/TicketDetailModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStoredUser());
  const [events, setEvents] = useState<EventItem[]>(() => loadStoredEvents());
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(() => events[0] || null);
  const [tickets, setTickets] = useState<Ticket[]>(() => loadStoredTickets());
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => loadStoredLogs());
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(() => loadStoredSession());

  // UI Navigation state
  const [currentTab, setCurrentTab] = useState<NavTab>('events');
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Modals & Active Overlays
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeScanResult, setActiveScanResult] = useState<{
    ticket: Ticket;
    scanTime: string;
    isDuplicate: boolean;
  } | null>(null);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);

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
        `Permission Denied: Account '${currentUser.name}' does not have gate scanning authorization for '${event.name}'. Contact event organizer on BuyMeShow.`
      );
      return;
    }

    setPermissionError(null);
    setSelectedEvent(event);
    setViewState('detail');
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

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cleanCode = scannedCode.trim().toLowerCase();

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
        notes: 'Barcode not found in BuyMeShow database',
      };

      setActiveScanResult({
        ticket: unknownTicket,
        scanTime: timestamp,
        isDuplicate: false,
      });
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
    } else {
      // Valid entry! Auto-check inside
      soundFX.playSuccess();
      updateTicketStatus(foundTicket.id, 'Inside', activeSession.gateName, currentUser.name, timestamp);

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
      });
    }
  };

  // Status Updater Function
  const updateTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    gateNameOverride?: string,
    staffNameOverride?: string,
    timestampOverride?: string
  ) => {
    const timestamp = timestampOverride || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const gate = gateNameOverride || activeSession?.gateName || 'Main Gate';
    const staff = staffNameOverride || currentUser?.name || 'Gate Officer';

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

    const targetTicket = tickets.find((t) => t.id === ticketId);

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
      details: `Gate action: Ticket status updated to ${newStatus}`,
    };

    setLogs((prev) => [logEntry, ...prev]);
  };

  // If not logged in, show Login view
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0c0d10] text-gray-100 font-sans selection:bg-emerald-500 selection:text-black">
        <Header
          user={null}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          activeSession={null}
        />
        <main>
          <LoginView onLogin={handleLogin} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0d10] text-gray-100 font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Sleek Simple Header */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        activeSession={activeSession}
        activeEventName={selectedEvent?.name}
      />

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
                onBack={() => setViewState('list')}
                onStartScanning={() => {
                  if (activeSession && activeSession.active && activeSession.eventId === selectedEvent.id) {
                    setCurrentTab('scan');
                  } else {
                    setShowSessionModal(true);
                  }
                }}
                onViewAttendees={() => setCurrentTab('attendees')}
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
          />
        )}

        {currentTab === 'attendees' && selectedEvent && (
          <AttendeesView
            event={selectedEvent}
            tickets={tickets}
            onSelectTicket={(ticket) => setSelectedTicketForDetail(ticket)}
            onUpdateStatusDirect={(ticketId, status) => {
              updateTicketStatus(ticketId, status);
              soundFX.playClick();
            }}
          />
        )}

        {currentTab === 'activity' && selectedEvent && (
          <ActivityLogView
            event={selectedEvent}
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        )}
      </main>

      {/* Scan Result Overlay Popover */}
      {activeScanResult && (
        <ScanResultCard
          ticket={activeScanResult.ticket}
          scanTime={activeScanResult.scanTime}
          isDuplicateScan={activeScanResult.isDuplicate}
          onUpdateStatus={(newStatus) => {
            updateTicketStatus(activeScanResult.ticket.id, newStatus);
            setActiveScanResult(null);
            soundFX.playClick();
          }}
          onDismiss={() => setActiveScanResult(null)}
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

      {/* Sleek Simple Footer Navigation */}
      <FooterNavigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setPermissionError(null);
        }}
        isScanningActive={Boolean(activeSession && activeSession.active)}
        hasActiveEvent={Boolean(selectedEvent)}
        activityCount={logs.filter((l) => l.eventId === selectedEvent?.id).length}
      />
    </div>
  );
}
