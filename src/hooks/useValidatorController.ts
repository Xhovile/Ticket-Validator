import { useState, useEffect } from 'react';
import { User, EventItem, Ticket, TicketStatus, ActivityLogEntry, CheckInSession } from '../types';
import { loadStoredLogs, saveStoredLogs, loadStoredSession, saveStoredSession } from '../data/mockData';
import { soundFX } from '../utils/audio';
import { getOfflineQueue, enqueueValidation, clearOfflineQueue, QueuedValidation } from '../utils/offlineSyncManager';
import { fetchValidatorMe, fetchValidatorTickets, getStoredToken, clearToken } from '../lib/buymeshoApi';
import type { NavTab } from '../components/FooterNavigation';
import { mapValidatorTicket } from '../lib/validatorMappers';
import { buildValidatorSession } from '../lib/validatorSession';
import { useValidatorScanner } from './useValidatorScanner';

function tabFromPathname(pathname: string): NavTab {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/scanner') return 'scan';
  if (path === '/attendees') return 'attendees';
  return 'events';
}

function pathForTab(tab: NavTab): string {
  if (tab === 'scan') return '/scanner';
  if (tab === 'attendees') return '/attendees';
  return '/events';
}

function normalizeStoredSession(session: CheckInSession | null, events: EventItem[]): CheckInSession | null {
  if (!session) return null;
  const event = events.find((item) => item.id === session.eventId);
  if (!event) return null;

  const gateName = typeof session.gateName === 'string' && session.gateName.trim()
    ? session.gateName
    : (event.gates?.[0] || 'Main Gate');

  const eventName = typeof session.eventName === 'string' && session.eventName.trim()
    ? session.eventName
    : event.name;

  const staffName = typeof session.staffName === 'string' && session.staffName.trim()
    ? session.staffName
    : 'Gate Officer';

  const startTime = typeof session.startTime === 'string' && session.startTime.trim()
    ? session.startTime
    : new Date().toISOString();

  const scanCount = typeof session.scanCount === 'number' && Number.isFinite(session.scanCount)
    ? session.scanCount
    : 0;

  return {
    id: typeof session.id === 'string' && session.id.trim() ? session.id : `session-${Date.now()}`,
    eventId: event.id,
    eventName,
    gateName,
    staffName,
    startTime,
    active: session.active === true,
    scanCount,
  };
}

export function useValidatorController() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => loadStoredLogs());
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(() => loadStoredSession());
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavTab>(() => tabFromPathname(window.location.pathname));
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => localStorage.getItem('buymesho_high_contrast') === 'true');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedValidation[]>(() => getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const targetPath = pathForTab(currentTab);
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    if (currentPath !== targetPath) {
      window.history.pushState({}, document.title, `${targetPath}${window.location.search}${window.location.hash}`);
    }
  }, [currentTab]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(tabFromPathname(window.location.pathname));
      setViewState('list');
      setPermissionError(null);
      setSelectedTicketForDetail(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('sunlight-high-contrast', isHighContrast);
    localStorage.setItem('buymesho_high_contrast', String(isHighContrast));
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => !prev);
    soundFX.playClick();
  };

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
          setAuthError('Your BuyMesho account does not have permission to validate tickets.');
          setIsAuthenticating(false);
          return;
        }
        const { user, events: mappedEvents } = buildValidatorSession(response);
        setCurrentUser(user);
        setEvents(mappedEvents);
        const storedSession = normalizeStoredSession(loadStoredSession(), mappedEvents);
        if (storedSession) saveStoredSession(storedSession);
        setActiveSession(storedSession);
        setSelectedEvent(mappedEvents.find((event) => event.id === storedSession?.eventId) || mappedEvents[0] || null);
        setCurrentTab(tabFromPathname(window.location.pathname));
        setViewState('list');
        setIsAuthenticating(false);
      } catch (error: any) {
        if (cancelled) return;
        if (error?.status === 401 || error?.status === 403) {
          clearToken();
          setAuthError('Your BuyMesho session is no longer valid or does not have Ticket Validator access.');
        } else {
          setAuthError(error?.message || 'Unable to verify your BuyMesho account. Please try again.');
        }
        setCurrentUser(null);
        setEvents([]);
        setSelectedEvent(null);
        setTickets([]);
        setIsAuthenticating(false);
      }
    };
    authenticateWithBuyMesho();
    return () => { cancelled = true; };
  }, []);

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
        const response = await fetchValidatorTickets(token, selectedEvent.id);
        if (cancelled) return;
        const mappedTickets = response.tickets.map((ticket) => mapValidatorTicket(ticket, selectedEvent.id));
        setTickets(mappedTickets);
        setEvents((previousEvents) => previousEvents.map((event) => event.id === selectedEvent.id ? {
          ...event,
          totalTicketsSold: mappedTickets.length,
          checkedInCount: mappedTickets.filter((ticket) => ticket.status === 'Inside').length,
        } : event));
      } catch (error: any) {
        if (cancelled) return;
        if (error?.status === 401 || error?.status === 403) {
          clearToken();
          setAuthError('Your BuyMesho session has expired. Please sign in again.');
          setCurrentUser(null);
        } else {
          setPermissionError(error?.message || 'Unable to load tickets for this event.');
        }
        setTickets([]);
      } finally {
        if (!cancelled) setIsTicketsLoading(false);
      }
    };
    loadTickets();
    return () => { cancelled = true; };
  }, [selectedEvent?.id]);

  const handleSyncNow = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const count = queue.length;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const syncLog: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp,
      eventId: selectedEvent?.id || '',
      action: 'Checked In (Inside)',
      gateName: activeSession?.gateName || 'Main Gate',
      staffName: currentUser?.name || 'Gate Officer',
      statusBadge: 'success',
      details: `Synced ${count} offline validation${count === 1 ? '' : 's'} successfully.`,
    };
    setLogs((previous) => [syncLog, ...previous]);
    saveStoredLogs([syncLog, ...logs]);
    clearOfflineQueue();
    setOfflineQueue([]);
    setSyncToastMessage(`${count} offline validation${count === 1 ? '' : 's'} synced successfully.`);
    setIsSyncing(false);
    window.setTimeout(() => setSyncToastMessage(null), 3000);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSelectEvent = (event: EventItem) => {
    setSelectedEvent(event);
    setViewState('detail');
    setCurrentTab('events');
    setPermissionError(null);
  };

  const handleStartSessionConfirm = (gateName: string) => {
    if (!selectedEvent || !currentUser) return;
    const session: CheckInSession = {
      id: `session-${Date.now()}`,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      gateName,
      staffName: currentUser.name,
      startTime: new Date().toISOString(),
      active: true,
      scanCount: 0,
    };
    setActiveSession(session);
    saveStoredSession(session);
    setShowSessionModal(false);
    setCurrentTab('scan');
  };

  const updateTicketStatus = (ticketId: string, newStatus: TicketStatus, gateNameOverride?: string, staffNameOverride?: string, timestampOverride?: string, isOfflineAction?: boolean) => {
    const timestamp = timestampOverride || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const gate = gateNameOverride || activeSession?.gateName || 'Main Gate';
    const staff = staffNameOverride || currentUser?.name || 'Gate Officer';
    const effectiveOffline = isOfflineAction !== undefined ? isOfflineAction : !isOnline || isSimulatedOffline;
    const targetTicket = tickets.find((ticket) => ticket.id === ticketId);
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
    setTickets((previousTickets) => previousTickets.map((ticket) => ticket.id === ticketId ? {
      ...ticket,
      status: newStatus,
      lastCheckedInTime: newStatus === 'Inside' ? timestamp : ticket.lastCheckedInTime,
      lastCheckedOutTime: newStatus === 'Outside' ? timestamp : ticket.lastCheckedOutTime,
      lastGateName: gate,
      lastStaffName: staff,
    } : ticket));
    if (selectedEvent) {
      setEvents((previousEvents) => previousEvents.map((event) => event.id === selectedEvent.id ? {
        ...event,
        checkedInCount: tickets.filter((ticket) => ticket.id === ticketId ? newStatus === 'Inside' : ticket.status === 'Inside').length,
      } : event));
    }
    let actionType = 'Status Changed';
    let badge: ActivityLogEntry['statusBadge'] = 'success';
    if (newStatus === 'Inside') { actionType = 'Checked In (Inside)'; badge = 'success'; }
    else if (newStatus === 'Outside') { actionType = 'Checked Out (Outside)'; badge = 'warning'; }
    else if (newStatus === 'Cancelled') { actionType = 'Status Changed: Cancelled'; badge = 'danger'; }
    else if (newStatus === 'Refunded') { actionType = 'Status Changed: Refunded'; badge = 'danger'; }
    else if (newStatus === 'Blocked') { actionType = 'Status Changed: Blocked'; badge = 'danger'; }
    else { actionType = 'Status Changed: Waiting Entry'; badge = 'info'; }
    const logEntry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      timestamp,
      eventId: selectedEvent?.id || '',
      ticketId,
      attendeeName: targetTicket?.attendeeName,
      action: actionType as ActivityLogEntry['action'],
      gateName: gate,
      staffName: staff,
      statusBadge: badge,
      details: effectiveOffline ? 'Validated Offline (Queued for Sync)' : `Gate action: Ticket status updated to ${newStatus}`,
    };
    setLogs((previous) => [logEntry, ...previous]);
  };

  const scanner = useValidatorScanner({
    selectedEvent,
    currentUser,
    activeSession,
    tickets,
    isOnline,
    isSimulatedOffline,
    updateTicketStatus,
  });

  const handleLogout = () => {
    clearToken();
    setCurrentUser(null);
    setEvents([]);
    setSelectedEvent(null);
    setTickets([]);
    setActiveSession(null);
    clearOfflineQueue();
    setOfflineQueue([]);
    window.location.reload();
  };

  const handleSwitchUser = (newUser: User) => {
    setCurrentUser(newUser);
    setSelectedEvent(events.find((event) => newUser.assignedEventIds.includes(event.id)) || events[0] || null);
    setCurrentTab('events');
    setViewState('list');
  };

  return {
    currentUser, events, selectedEvent, tickets, logs, activeSession,
    isAuthenticating, authError, isTicketsLoading, currentTab, viewState,
    permissionError, isDetailLoading, isAttendeesLoading, isHighContrast,
    showSessionModal,
    isContinuousScan: scanner.isContinuousScan,
    activeScanResult: scanner.activeScanResult,
    selectedTicketForDetail,
    isOnline, isSimulatedOffline, offlineQueue, isSyncing, syncToastMessage,
    setCurrentTab, setViewState, setPermissionError, setIsAttendeesLoading,
    setIsSimulatedOffline, setOfflineQueue, setSelectedTicketForDetail,
    setShowSessionModal, setIsContinuousScan: scanner.setIsContinuousScan,
    handleDismissResult: scanner.handleDismissResult,
    handleSyncNow, handleSelectEvent, handleStartSessionConfirm,
    handleScanTicket: scanner.handleScanTicket, handleLogout, handleSwitchUser,
    toggleHighContrast, updateTicketStatus,
  };
}

export type ValidatorController = ReturnType<typeof useValidatorController>;
