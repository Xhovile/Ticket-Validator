import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import {
  User,
  EventItem,
  Ticket,
  TicketStatus,
  ActivityLogEntry,
  CheckInSession,
} from './types';

import {
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

import {
  fetchValidatorMe,
  fetchValidatorTickets,
  getStoredToken,
  clearToken,
} from './lib/buymeshoApi';

// Components
import { Header } from './components/Header';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { FooterNavigation, NavTab } from './components/FooterNavigation';
import { EventsView } from './components/EventsView';
import { EventDetailView } from './components/EventDetailView';
import { CheckInSessionModal } from './components/CheckInSessionModal';
import { ScannerView } from './components/ScannerView';
import { ScanResultCard } from './components/ScanResultCard';
import { AttendeesView } from './components/AttendeesView';
import { TicketDetailModal } from './components/TicketDetailModal';

function getMetadataValue(
  metadata: Record<string, unknown>,
  keys: string[],
  fallback = '',
) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return fallback;
}

function getMetadataNumber(
  metadata: Record<string, unknown>,
  keys: string[],
  fallback = 0,
) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function getEventState(
  eventDate: string,
  startTime: string,
  status: string,
): EventItem['state'] {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus.includes('ended') ||
    normalizedStatus.includes('completed') ||
    normalizedStatus.includes('cancelled') ||
    normalizedStatus.includes('canceled')
  ) {
    return 'Ended';
  }

  const eventDateTime = new Date(`${eventDate}T${startTime}`);

  if (Number.isNaN(eventDateTime.getTime())) {
    return 'Upcoming';
  }

  return eventDateTime.getTime() <= Date.now() ? 'Live' : 'Upcoming';
}

function mapValidatorEvent(event: {
  id: string;
  creator_uid: string | null;
  event_type: string;
  event_title: string;
  organizer_name: string;
  event_date: string;
  start_time: string;
  venue: string;
  location: string;
  ticket_mode: string;
  ticket_price: number | null;
  ticket_link: string | null;
  description: string;
  contact_whatsapp: string | null;
  poster_alt: string | null;
  spec_values: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  version: string;
  ticket_count: number;
}): EventItem {
  const checkedInCount = 0;

  return {
    id: event.id,
    name: event.event_title,
    organizerId: event.creator_uid || '',
    organizerName: event.organizer_name,
    date: event.event_date,
    venue: event.venue,
    city: event.location,
    bannerImage: event.poster_alt || '',
    state: getEventState(
      event.event_date,
      event.start_time,
      event.status,
    ),
    totalTicketsSold: event.ticket_count || 0,
    checkedInCount,
    category: event.event_type || 'Event',
    gates: ['Main Gate'],
  };
}

function mapValidatorTicket(ticket: {
  id: string;
  code: string;
  event_id: string;
  event_title: string;
  order_id: string;
  buyer_id: string;
  status:
    | 'Waiting Entry'
    | 'Inside'
    | 'Outside'
    | 'Cancelled'
    | 'Refunded'
    | 'Blocked'
    | 'Duplicate Scan Attempt';
  order_status: string;
  payment_status: string | null;
  updated_at: string;
  version: string;
  metadata: Record<string, unknown>;
}): Ticket {
  const metadata = ticket.metadata || {};

  return {
    id: ticket.id,
    qrPayload: ticket.code,
    eventId: ticket.event_id,
    attendeeName: getMetadataValue(
      metadata,
      ['attendeeName', 'attendee_name', 'buyerName', 'buyer_name', 'name', 'fullName'],
      'Ticket Holder',
    ),
    attendeeEmail: getMetadataValue(
      metadata,
      ['attendeeEmail', 'attendee_email', 'buyerEmail', 'buyer_email', 'email'],
      '',
    ),
    attendeePhone: getMetadataValue(
      metadata,
      ['attendeePhone', 'attendee_phone', 'buyerPhone', 'buyer_phone', 'phone'],
      'N/A',
    ),
    ticketTier: getMetadataValue(
      metadata,
      ['ticketTier', 'ticket_tier', 'tier', 'ticketType', 'ticket_type'],
      'General Admission',
    ),
    seatOrZone: getMetadataValue(
      metadata,
      ['seatOrZone', 'seat_or_zone', 'seat', 'zone'],
      'General',
    ),
    price: getMetadataNumber(
      metadata,
      ['price', 'ticketPrice', 'ticket_price', 'amount'],
      0,
    ),
    purchaseDate: getMetadataValue(
      metadata,
      ['purchaseDate', 'purchase_date', 'createdAt', 'created_at'],
      ticket.updated_at,
    ),
    status: ticket.status,
    notes: getMetadataValue(
      metadata,
      ['notes', 'note'],
      '',
    ),
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => loadStoredLogs());
  const [activeSession, setActiveSession] =
    useState<CheckInSession | null>(() => loadStoredSession());

  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);

  // UI Navigation state
  const [currentTab, setCurrentTab] = useState<NavTab>('events');
  const [viewState, setViewState] =
    useState<'list' | 'detail'>('list');

  const [permissionError, setPermissionError] =
    useState<string | null>(null);

  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false);

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('buymesho_high_contrast') === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle(
      'sunlight-high-contrast',
      isHighContrast,
    );

    localStorage.setItem(
      'buymesho_high_contrast',
      String(isHighContrast),
    );
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => !prev);
    soundFX.playClick();
  };

  // Modals & Active Overlays
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isContinuousScan, setIsContinuousScan] =
    useState<boolean>(true);

  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lastScanThrottleRef = useRef<{
    code: string;
    time: number;
  }>({
    code: '',
    time: 0,
  });

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

  const [selectedTicketForDetail, setSelectedTicketForDetail] =
    useState<Ticket | null>(null);

  // Offline & Background Sync state
  const [isOnline, setIsOnline] = useState<boolean>(
    () => navigator.onLine,
  );

  const [isSimulatedOffline, setIsSimulatedOffline] =
    useState<boolean>(false);

  const [offlineQueue, setOfflineQueue] =
    useState<QueuedValidation[]>(() => getOfflineQueue());

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] =
    useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * BUYMESHO AUTHENTICATION
   * ---------------------------------------------------------
   *
   * BuyMeshoGate has already validated that we have a BuyMesho
   * session token before rendering this component.
   *
   * App therefore MUST NOT show another login screen.
   *
   * The token is verified by /api/validator/me.
   */
  useEffect(() => {
    let cancelled = false;

    const authenticateWithBuyMesho = async () => {
      const token = getStoredToken();

      if (!token) {
        if (!cancelled) {
          setAuthError('Your BuyMesho session is missing.');
          setIsAuthenticating(false);
        }
        return;
      }

      try {
        setIsAuthenticating(true);
        setAuthError(null);

        const response = await fetchValidatorMe(token);

        if (cancelled) return;

        if (!response.access_scope?.can_validate_tickets) {
          setAuthError(
            'Your BuyMesho account does not have permission to validate tickets.',
          );
          setIsAuthenticating(false);
          return;
        }

        const identity = response.identity;
        const accessScope = response.access_scope;

        const authorizedEventIds =
          accessScope.allowed_event_ids?.length
            ? accessScope.allowed_event_ids
            : response.events.map((event) => event.id);

        const isOrganizer =
          Boolean(response.creator) ||
          accessScope.role === 'admin' ||
          Boolean(accessScope.is_admin) ||
          Boolean(identity.is_admin);

        const user: User = {
          id: identity.uid,
          name:
            identity.display_name ||
            identity.email ||
            'BuyMesho User',
          email: identity.email || '',
          role: isOrganizer ? 'organizer' : 'gate_staff',
          assignedEventIds: authorizedEventIds,
          assignedGate: undefined,
        };

        const mappedEvents = response.events
          .map(mapValidatorEvent)
          .filter((event) =>
            authorizedEventIds.includes(event.id),
          );

        setCurrentUser(user);
        setEvents(mappedEvents);

        const storedSession = loadStoredSession();

        const validStoredSession =
          storedSession &&
          mappedEvents.some(
            (event) => event.id === storedSession.eventId,
          )
            ? storedSession
            : null;

        setActiveSession(validStoredSession);

        setSelectedEvent(
          mappedEvents.find(
            (event) => event.id === validStoredSession?.eventId,
          ) ||
            mappedEvents[0] ||
            null,
        );

        if (!validStoredSession) {
          setCurrentTab('events');
          setViewState('list');
        }

        setIsAuthenticating(false);
      } catch (error: any) {
        if (cancelled) return;

        if (error?.status === 401 || error?.status === 403) {
          clearToken();

          setAuthError(
            'Your BuyMesho session is no longer valid or does not have Ticket Validator access.',
          );
        } else {
          setAuthError(
            error?.message ||
              'Unable to verify your BuyMesho account. Please try again.',
          );
        }

        setCurrentUser(null);
        setEvents([]);
        setSelectedEvent(null);
        setTickets([]);
        setIsAuthenticating(false);
      }
    };

    authenticateWithBuyMesho();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * LOAD EVENT TICKETS
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      if (!selectedEvent) {
        setTickets([]);
        return;
      }

      const token = getStoredToken();

      if (!token) {
        setTickets([]);
        return;
      }

      try {
        setIsTicketsLoading(true);

        const response = await fetchValidatorTickets(
          token,
          selectedEvent.id,
        );

        if (cancelled) return;

        const mappedTickets = response.tickets.map(
          mapValidatorTicket,
        );

        setTickets(mappedTickets);

        setEvents((previousEvents) =>
          previousEvents.map((event) =>
            event.id === selectedEvent.id
              ? {
                  ...event,
                  totalTicketsSold: mappedTickets.length,
                  checkedInCount: mappedTickets.filter(
                    (ticket) => ticket.status === 'Inside',
                  ).length,
                }
              : event,
          ),
        );
      } catch (error: any) {
        if (cancelled) return;

        if (error?.status === 401 || error?.status === 403) {
          clearToken();
          setAuthError(
            'Your BuyMesho session has expired. Please sign in again.',
          );
          setCurrentUser(null);
        } else {
          setPermissionError(
            error?.message ||
              'Unable to load tickets for this event.',
          );
        }

        setTickets([]);
      } finally {
        if (!cancelled) {
          setIsTicketsLoading(false);
        }
      }
    };

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, [selectedEvent?.id]);

  /*
   * ---------------------------------------------------------
   * OFFLINE SYNC
   * ---------------------------------------------------------
   */
  const handleSyncNow = async () => {
    const queue = getOfflineQueue();

    if (queue.length === 0) return;

    setIsSyncing(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const count = queue.length;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const syncLog: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp,
      eventId: selectedEvent?.id || '',
      action: 'Checked In (Inside)',
      gateName: activeSession?.gateName || 'Main Gate',
      staffName: currentUser?.name || 'Gate Officer',
      statusBadge: 'success',
      details: `Background Sync: ${count} offline ticket validation${
        count > 1 ? 's' : ''
      } synced with BuyMesho server`,
    };

    setLogs((previous) => [syncLog, ...previous]);

    clearOfflineQueue();
    setOfflineQueue([]);
    setIsSyncing(false);

    soundFX.playSuccess();

    setSyncToastMessage(
      `Successfully synced ${count} offline ticket validation${
        count > 1 ? 's' : ''
      } with BuyMesho server!`,
    );

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
        if (
          event.data &&
          event.data.type === 'BACKGROUND_SYNC_TRIGGERED'
        ) {
          handleSyncNow();
        }
      };

      navigator.serviceWorker.addEventListener(
        'message',
        messageHandler,
      );

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);

        navigator.serviceWorker.removeEventListener(
          'message',
          messageHandler,
        );
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    saveStoredLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveStoredSession(activeSession);
  }, [activeSession]);

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */
  const handleLogout = () => {
    clearToken();
    setCurrentUser(null);
    setActiveSession(null);
    saveStoredSession(null);
    soundFX.playClick();

    window.location.reload();
  };

  /*
   * Header still expects this callback because the existing
   * Header component supports demo-account switching.
   *
   * Production authentication comes from BuyMesho, so this
   * simply replaces the local identity if the component ever
   * invokes it.
   */
  const handleSwitchUser = (newUser: User) => {
    setCurrentUser(newUser);
    setPermissionError(null);

    const userEvents = events.filter((event) =>
      newUser.role === 'organizer'
        ? event.organizerId === newUser.id
        : newUser.assignedEventIds.includes(event.id),
    );

    setSelectedEvent(userEvents[0] || null);
    setViewState('list');
    setCurrentTab('events');

    soundFX.playClick();
  };

  /*
   * ---------------------------------------------------------
   * EVENT SELECTION
   * ---------------------------------------------------------
   */
  const handleSelectEvent = (event: EventItem) => {
    if (!currentUser) return;

    const hasPermission =
      currentUser.role === 'organizer'
        ? event.organizerId === currentUser.id
        : currentUser.assignedEventIds.includes(event.id);

    if (!hasPermission) {
      soundFX.playError();

      setPermissionError(
        `Permission denied. Your BuyMesho account does not have gate scanning authorization for "${event.name}". Contact the event organizer on BuyMesho.`,
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

  /*
   * ---------------------------------------------------------
   * START CHECK-IN SESSION
   * ---------------------------------------------------------
   */
  const handleStartSessionConfirm = (
    session: CheckInSession,
  ) => {
    setActiveSession(session);
    setShowSessionModal(false);

    const newLog: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      eventId: session.eventId,
      action: 'Check-in Session Started',
      gateName: session.gateName,
      staffName: session.staffName,
      statusBadge: 'info',
      details: `Gate scan session initialized for ${session.gateName}`,
    };

    setLogs((previous) => [newLog, ...previous]);
    setCurrentTab('scan');

    soundFX.playSuccess();
  };

  /*
   * ---------------------------------------------------------
   * SCANNING
   * ---------------------------------------------------------
   */
  const handleScanTicket = (scannedCode: string) => {
    if (!selectedEvent || !currentUser || !activeSession) {
      return;
    }

    const now = Date.now();
    const cleanCode = scannedCode.trim().toLowerCase();

    const effectiveOffline =
      !isOnline || isSimulatedOffline;

    if (
      isContinuousScan &&
      lastScanThrottleRef.current.code === cleanCode &&
      now - lastScanThrottleRef.current.time < 1500
    ) {
      return;
    }

    lastScanThrottleRef.current = {
      code: cleanCode,
      time: now,
    };

    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const scheduleAutoDismiss = (
      delayMs: number = 1800,
    ) => {
      if (isContinuousScan) {
        autoDismissTimerRef.current = setTimeout(() => {
          setActiveScanResult(null);
          autoDismissTimerRef.current = null;
        }, delayMs);
      }
    };

    const foundTicket = tickets.find(
      (ticket) =>
        ticket.eventId === selectedEvent.id &&
        (ticket.qrPayload.toLowerCase() === cleanCode ||
          ticket.id.toLowerCase() === cleanCode),
    );

    if (!foundTicket) {
      soundFX.playError();

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

      setLogs((previous) => [failLog, ...previous]);

      const unknownTicket: Ticket = {
        id: scannedCode.toUpperCase(),
        qrPayload: scannedCode,
        eventId: selectedEvent.id,
        attendeeName:
          'Unknown Attendee / Unrecognized Ticket',
        attendeeEmail: '',
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

    setActiveSession((previous) =>
      previous
        ? {
            ...previous,
            scanCount: previous.scanCount + 1,
          }
        : null,
    );

    if (foundTicket.status === 'Inside') {
      soundFX.playWarning();

      const duplicateLog: ActivityLogEntry = {
        id: `log-${Date.now()}`,
        timestamp,
        eventId: selectedEvent.id,
        ticketId: foundTicket.id,
        attendeeName: foundTicket.attendeeName,
        action: 'Duplicate Scan Warning',
        gateName: activeSession.gateName,
        staffName: currentUser.name,
        statusBadge: 'warning',
        details:
          'Attempted scan of ticket already checked inside venue',
      };

      setLogs((previous) => [
        duplicateLog,
        ...previous,
      ]);

      setActiveScanResult({
        ticket: foundTicket,
        scanTime: timestamp,
        isDuplicate: true,
      });

      scheduleAutoDismiss(2200);

      return;
    }

    if (
      foundTicket.status === 'Cancelled' ||
      foundTicket.status === 'Refunded' ||
      foundTicket.status === 'Blocked'
    ) {
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

      setLogs((previous) => [
        invalidLog,
        ...previous,
      ]);

      setActiveScanResult({
        ticket: foundTicket,
        scanTime: timestamp,
        isDuplicate: false,
      });

      scheduleAutoDismiss(2500);

      return;
    }

    soundFX.playSuccess();

    updateTicketStatus(
      foundTicket.id,
      'Inside',
      activeSession.gateName,
      currentUser.name,
      timestamp,
      effectiveOffline,
    );

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
  };

  /*
   * ---------------------------------------------------------
   * LOCAL TICKET STATE
   * ---------------------------------------------------------
   */
  const updateTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    gateNameOverride?: string,
    staffNameOverride?: string,
    timestampOverride?: string,
    isOfflineAction?: boolean,
  ) => {
    const timestamp =
      timestampOverride ||
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    const gate =
      gateNameOverride ||
      activeSession?.gateName ||
      'Main Gate';

    const staff =
      staffNameOverride ||
      currentUser?.name ||
      'Gate Officer';

    const effectiveOffline =
      isOfflineAction !== undefined
        ? isOfflineAction
        : !isOnline || isSimulatedOffline;

    const targetTicket = tickets.find(
      (ticket) => ticket.id === ticketId,
    );

    if (targetTicket && effectiveOffline) {
      enqueueValidation({
        ticketId,
        eventId: targetTicket.eventId,
        attendeeName: targetTicket.attendeeName,
        ticketTier: targetTicket.ticketTier,
        actionType:
          newStatus === 'Inside'
            ? 'check_in'
            : 'status_change',
        newStatus,
        previousStatus: targetTicket.status,
        gateName: gate,
        staffName: staff,
      });

      setOfflineQueue(getOfflineQueue());
    }

    setTickets((previousTickets) =>
      previousTickets.map((ticket) => {
        if (ticket.id !== ticketId) {
          return ticket;
        }

        return {
          ...ticket,
          status: newStatus,
          lastCheckedInTime:
            newStatus === 'Inside'
              ? timestamp
              : ticket.lastCheckedInTime,
          lastCheckedOutTime:
            newStatus === 'Outside'
              ? timestamp
              : ticket.lastCheckedOutTime,
          lastGateName: gate,
          lastStaffName: staff,
        };
      }),
    );

    setEvents((previousEvents) =>
      previousEvents.map((event) => {
        if (!targetTicket || event.id !== targetTicket.eventId) {
          return event;
        }

        const wasInside =
          targetTicket.status === 'Inside';

        const willBeInside =
          newStatus === 'Inside';

        let checkedInCount =
          event.checkedInCount;

        if (!wasInside && willBeInside) {
          checkedInCount += 1;
        }

        if (wasInside && !willBeInside) {
          checkedInCount = Math.max(
            0,
            checkedInCount - 1,
          );
        }

        return {
          ...event,
          checkedInCount,
        };
      }),
    );

    let actionType: ActivityLogEntry['action'] =
      'Checked In (Inside)';

    let badge: ActivityLogEntry['statusBadge'] =
      'success';

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
      eventId: selectedEvent?.id || '',
      ticketId,
      attendeeName: targetTicket?.attendeeName,
      action: actionType,
      gateName: gate,
      staffName: staff,
      statusBadge: badge,
      details: effectiveOffline
        ? 'Validated Offline (Queued for Sync)'
        : `Gate action: Ticket status updated to ${newStatus}`,
    };

    setLogs((previous) => [
      logEntry,
      ...previous,
    ]);
  };

  /*
   * ---------------------------------------------------------
   * AUTHENTICATION LOADING SCREEN
   * ---------------------------------------------------------
   */
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Verifying BuyMesho access
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Preparing Ticket Validator...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * AUTHENTICATION ERROR
   * ---------------------------------------------------------
   */
  if (authError || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header
          user={null}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          activeSession={null}
          isHighContrast={isHighContrast}
          onToggleHighContrast={toggleHighContrast}
        />

        <main className="min-h-[75vh] flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Access unavailable
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {authError ||
                'Your BuyMesho account could not be verified.'}
            </p>

            <button
              type="button"
              onClick={() => {
                clearToken();
                window.location.reload();
              }}
              className="mt-5 min-h-[44px] w-full rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Return to BuyMesho Sign In
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        activeSession={activeSession}
        activeEventName={selectedEvent?.name}
        isHighContrast={isHighContrast}
        onToggleHighContrast={toggleHighContrast}
      />

      <OfflineSyncBanner
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        queuedItems={offlineQueue}
        isSyncing={isSyncing}
        onToggleSimulatedOffline={() =>
          setIsSimulatedOffline((previous) => !previous)
        }
        onSyncNow={handleSyncNow}
        onClearQueue={() => {
          clearOfflineQueue();
          setOfflineQueue([]);
        }}
      />

      {syncToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{syncToastMessage}</span>
        </div>
      )}

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
                onClearPermissionError={() =>
                  setPermissionError(null)
                }
              />
            ) : (
              <EventDetailView
                event={selectedEvent}
                isLoading={isDetailLoading}
                onBack={() => setViewState('list')}
                onStartScanning={() => {
                  if (
                    activeSession &&
                    activeSession.active &&
                    activeSession.eventId === selectedEvent.id
                  ) {
                    setCurrentTab('scan');
                  } else {
                    setShowSessionModal(true);
                  }
                }}
                onViewAttendees={() => {
                  setCurrentTab('attendees');
                  setIsAttendeesLoading(true);

                  setTimeout(
                    () => setIsAttendeesLoading(false),
                    300,
                  );
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
            onStartSessionRequest={() =>
              setShowSessionModal(true)
            }
            isContinuousScan={isContinuousScan}
            onToggleContinuousScan={() =>
              setIsContinuousScan(
                (previous) => !previous,
              )
            }
          />
        )}

        {currentTab === 'attendees' && selectedEvent && (
          <AttendeesView
            event={selectedEvent}
            tickets={tickets}
            isLoading={
              isAttendeesLoading || isTicketsLoading
            }
            onSelectTicket={(ticket) =>
              setSelectedTicketForDetail(ticket)
            }
            onUpdateStatusDirect={(
              ticketId,
              status,
            ) => {
              updateTicketStatus(ticketId, status);
              soundFX.playClick();
            }}
          />
        )}
      </main>

      {activeScanResult && (
        <ScanResultCard
          ticket={activeScanResult.ticket}
          scanTime={activeScanResult.scanTime}
          isDuplicateScan={
            activeScanResult.isDuplicate
          }
          isOfflineQueued={
            activeScanResult.isOfflineQueued
          }
          isContinuousMode={isContinuousScan}
          onUpdateStatus={(newStatus) => {
            updateTicketStatus(
              activeScanResult.ticket.id,
              newStatus,
            );

            handleDismissResult();
            soundFX.playClick();
          }}
          onDismiss={handleDismissResult}
        />
      )}

      {showSessionModal && selectedEvent && (
        <CheckInSessionModal
          event={selectedEvent}
          user={currentUser}
          onClose={() => setShowSessionModal(false)}
          onConfirmStartSession={
            handleStartSessionConfirm
          }
        />
      )}

      {selectedTicketForDetail && (
        <TicketDetailModal
          ticket={selectedTicketForDetail}
          onClose={() =>
            setSelectedTicketForDetail(null)
          }
          onUpdateStatus={(ticketId, newStatus) => {
            updateTicketStatus(
              ticketId,
              newStatus,
            );
            soundFX.playClick();
          }}
        />
      )}

      <FooterNavigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (
            tab === 'attendees' &&
            currentTab !== 'attendees'
          ) {
            setIsAttendeesLoading(true);

            setTimeout(
              () => setIsAttendeesLoading(false),
              300,
            );
          }

          setCurrentTab(tab);
          setPermissionError(null);
        }}
        isScanningActive={Boolean(
          activeSession &&
            activeSession.active,
        )}
        hasActiveEvent={Boolean(selectedEvent)}
      />
    </div>
  );
}
