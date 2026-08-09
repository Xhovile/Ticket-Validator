import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { User, EventItem, Ticket, TicketStatus, ActivityLogEntry, CheckInSession } from "./types";
import { Header } from "./components/Header";
import { OfflineSyncBanner } from "./components/OfflineSyncBanner";
import { FooterNavigation, NavTab } from "./components/FooterNavigation";
import { LoginView } from "./components/LoginView";
import { EventsView } from "./components/EventsView";
import { EventDetailView } from "./components/EventDetailView";
import { CheckInSessionModal } from "./components/CheckInSessionModal";
import { ScannerView } from "./components/ScannerView";
import { ScanResultCard } from "./components/ScanResultCard";
import { AttendeesView } from "./components/AttendeesView";
import { soundFX } from "./utils/audio";
import { getOfflineQueue, enqueueValidation, clearOfflineQueue, QueuedValidation, registerServiceWorker } from "./utils/offlineSyncManager";
import {
  getStoredToken,
  saveToken,
  clearToken,
  fetchValidatorMe,
  fetchValidatorTickets,
  scanTicket,
  updateTicketStatus,
  syncQueuedValidations,
} from "./lib/buymeshoApi";
import {
  clearAllOfflineData,
  clearQueue,
  deleteQueueItem,
  getEvents as loadEventsFromDb,
  getHistory,
  getQueueItems,
  getSession,
  getSnapshotMeta,
  getTickets as loadTicketsFromDb,
  putSnapshotMeta,
  saveEvents,
  saveQueueItem,
  saveSession,
  saveTickets,
  StoredTicket,
  StoredEvent,
  OfflineQueueItem,
  upsertTicket,
  addHistory,
} from "./lib/offlineDb";
import { OfflineStatusPanel } from "./components/OfflineStatusPanel";

type ScanCardState = { ticket: Ticket; scanTime: string; isDuplicate: boolean; isOfflineQueued?: boolean } | null;

const highContrastKey = "buymesho_high_contrast";

function toEvent(evt: any): EventItem {
  return {
    id: String(evt.id),
    name: evt.event_title,
    organizerId: String(evt.creator_uid ?? ""),
    organizerName: evt.organizer_name,
    date: `${evt.event_date} ${evt.start_time}`.trim(),
    venue: evt.venue,
    city: evt.location,
    bannerImage: typeof evt.spec_values?.banner_image === "string" ? evt.spec_values.banner_image : "/vite.svg",
    state: evt.status === "published" || evt.status === "live" ? "Live" : evt.status === "ended" ? "Ended" : "Upcoming",
    totalTicketsSold: Number(evt.ticket_count ?? 0),
    checkedInCount: Number(evt.checked_in_count ?? 0),
    category: evt.event_type,
    gates: Array.isArray(evt.spec_values?.gates) ? evt.spec_values.gates.filter((v: unknown): v is string => typeof v === "string") : ["Main Gate"],
  };
}

function toTicket(ticket: any): Ticket {
  const metadata = ticket.metadata ?? {};
  return {
    id: String(ticket.id),
    qrPayload: String(ticket.qrPayload ?? ticket.code ?? ""),
    eventId: String(ticket.eventId ?? ticket.event_id ?? ""),
    attendeeName: String(ticket.attendeeName ?? metadata.buyer_name ?? "Verified Buyer"),
    attendeeEmail: String(ticket.attendeeEmail ?? metadata.buyer_email ?? ""),
    attendeePhone: String(ticket.attendeePhone ?? ""),
    ticketTier: String(ticket.ticketTier ?? metadata.item_title ?? "Ticket"),
    seatOrZone: ticket.seatOrZone ?? undefined,
    price: Number(ticket.price ?? metadata.order_total?.amount ?? metadata.unit_price?.amount ?? 0),
    purchaseDate: String(ticket.purchaseDate ?? metadata.paid_at ?? metadata.fulfilled_at ?? ticket.updated_at ?? ""),
    status: ticket.status as TicketStatus,
    lastCheckedInTime: ticket.lastCheckedInTime ?? undefined,
    lastCheckedOutTime: ticket.lastCheckedOutTime ?? undefined,
    lastGateName: ticket.lastGateName ?? undefined,
    lastStaffName: ticket.lastStaffName ?? undefined,
    notes: ticket.notes ?? undefined,
  };
}

function toStoredTicket(ticket: Ticket): StoredTicket {
  return {
    id: ticket.id,
    eventId: ticket.eventId,
    qrPayload: ticket.qrPayload,
    attendeeName: ticket.attendeeName,
    attendeeEmail: ticket.attendeeEmail,
    attendeePhone: ticket.attendeePhone,
    ticketTier: ticket.ticketTier,
    seatOrZone: ticket.seatOrZone,
    price: ticket.price,
    purchaseDate: ticket.purchaseDate,
    status: ticket.status,
    lastCheckedInTime: ticket.lastCheckedInTime,
    lastCheckedOutTime: ticket.lastCheckedOutTime,
    lastGateName: ticket.lastGateName,
    lastStaffName: ticket.lastStaffName,
    notes: ticket.notes,
  };
}

function makeLog(action: ActivityLogEntry["action"], ticket: Ticket, gateName: string, staffName: string, badge: ActivityLogEntry["statusBadge"], details: string): ActivityLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    eventId: ticket.eventId,
    ticketId: ticket.id,
    attendeeName: ticket.attendeeName,
    action,
    gateName,
    staffName,
    statusBadge: badge,
    details,
  };
}

function nextLocalStatus(ticket: Ticket, allowReentry = false) {
  if (ticket.status === "Inside") return { allowed: false, status: "Inside" as TicketStatus, duplicate: true, reason: "Duplicate scan" };
  if (ticket.status === "Cancelled" || ticket.status === "Refunded" || ticket.status === "Blocked") {
    return { allowed: false, status: ticket.status, reason: `Ticket is ${ticket.status.toLowerCase()}` };
  }
  if (ticket.status === "Outside" && !allowReentry) {
    const note = ticket.notes?.toLowerCase() ?? "";
    if (!note.includes("re-entry")) return { allowed: false, status: "Outside" as TicketStatus, reason: "Re-entry not permitted" };
  }
  return { allowed: true, status: "Inside" as TicketStatus, reason: ticket.status === "Outside" ? "Re-entry permitted" : "Validated" };
}

function statusFromTicket(status: string): TicketStatus {
  if (status === "Inside" || status === "Outside" || status === "Cancelled" || status === "Refunded" || status === "Blocked" || status === "Waiting Entry") return status;
  return "Waiting Entry";
}

function randomId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [authToken, setAuthToken] = useState(() => getStoredToken());
  const [identity, setIdentity] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [activeSession, setActiveSession] = useState<CheckInSession | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("events");
  const [viewState, setViewState] = useState<"list" | "detail">("list");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isContinuousScan, setIsContinuousScan] = useState(true);
  const [activeScanResult, setActiveScanResult] = useState<ScanCardState>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedValidation[]>(() => getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem(highContrastKey) === "true");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) ?? null, [events, selectedEventId]);

  useEffect(() => { registerServiceWorker(); }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("sunlight-high-contrast", isHighContrast);
    localStorage.setItem(highContrastKey, String(isHighContrast));
  }, [isHighContrast]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => { saveToken(authToken); }, [authToken]);

  useEffect(() => {
    if (activeSession) saveSession({ eventId: activeSession.eventId, gateName: activeSession.gateName, staffName: activeSession.staffName, startedAt: activeSession.startTime });
  }, [activeSession]);

  useEffect(() => {
    const q = getQueueItems().then(setOfflineQueue);
    const meta = selectedEventId ? getSnapshotMeta(selectedEventId) : Promise.resolve(null);
    void q;
    void meta.then((m) => { if (m?.syncedAt) setLastSyncAt(m.syncedAt); });
  }, [selectedEventId]);

  useEffect(() => {
    if (!authToken) return;
    void bootstrap(authToken);
  }, [authToken]);

  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      if (event.data?.type === "BACKGROUND_SYNC_TRIGGERED") void syncNow();
    };
    navigator.serviceWorker?.addEventListener("message", onMsg as any);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg as any);
  }, [authToken, offlineQueue, selectedEventId]);

  const selectedUser: User | null = useMemo(() => {
    if (!identity) return null;
    return {
      id: identity.uid,
      name: identity.display_name ?? identity.email ?? "BuyMesho Validator",
      email: identity.email ?? "",
      role: identity.access_scope?.role === "admin" ? "organizer" : "gate_staff",
      assignedEventIds: identity.access_scope?.allowed_event_ids ?? [],
      assignedGate: activeSession?.gateName,
    };
  }, [identity, activeSession?.gateName]);

  const refreshEventCount = (eventId: string, nextTickets: Ticket[]) => {
    const checkedIn = nextTickets.filter((ticket) => ticket.eventId === eventId && ticket.status === "Inside").length;
    setEvents((prev) => prev.map((event) => event.id === eventId ? { ...event, checkedInCount: checkedIn } : event));
  };

  const upsertLocalTicket = async (nextTicket: Ticket) => {
    setTickets((prev) => {
      const next = prev.some((item) => item.id === nextTicket.id)
        ? prev.map((item) => item.id === nextTicket.id ? nextTicket : item)
        : [nextTicket, ...prev];
      refreshEventCount(nextTicket.eventId, next);
      return next;
    });
    await upsertTicket(toStoredTicket(nextTicket));
  };

  const pushLog = (entry: ActivityLogEntry) => setLogs((prev) => [entry, ...prev]);

  const queueValidation = async (ticket: Ticket, status: TicketStatus, actionType: "check_in" | "check_out" | "status_change", gateName: string, staffName: string) => {
    const item: QueuedValidation = {
      queueId: randomId("queue"),
      ticketId: ticket.id,
      eventId: ticket.eventId,
      attendeeName: ticket.attendeeName,
      ticketTier: ticket.ticketTier,
      actionType,
      newStatus: status,
      previousStatus: ticket.status,
      gateName,
      staffName,
      notes: `Snapshot queued while offline`,
    };
    enqueueValidation(item);
    const queueItem: OfflineQueueItem = {
      queueId: item.queueId,
      ticketId: item.ticketId,
      eventId: item.eventId,
      actionType: item.actionType,
      previousStatus: item.previousStatus,
      newStatus: item.newStatus,
      gateName: item.gateName,
      staffName: item.staffName,
      timestamp: item.timestamp,
      clientSnapshotVersion: identity?.access_scope?.snapshot_version ?? "",
      idempotencyKey: randomId("idem"),
      status: "pending",
    };
    await saveQueueItem(queueItem);
    setOfflineQueue(await getQueueItems());
    await addHistory(`Queued ${status} for ticket ${ticket.id} at ${gateName}`);
  };

  const applyLocalValidation = async (ticket: Ticket, gateName: string, staffName: string, outcomeStatus: TicketStatus, isDuplicate = false, isOfflineQueued = false) => {
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const nextTicket: Ticket = {
      ...ticket,
      status: outcomeStatus,
      lastCheckedInTime: outcomeStatus === "Inside" ? stamp : ticket.lastCheckedInTime,
      lastCheckedOutTime: outcomeStatus === "Outside" ? stamp : ticket.lastCheckedOutTime,
      lastGateName: gateName,
      lastStaffName: staffName,
    };
    await upsertLocalTicket(nextTicket);
    pushLog(makeLog(
      isDuplicate ? "Duplicate Scan Warning" : outcomeStatus === "Inside" ? "Checked In (Inside)" : outcomeStatus === "Outside" ? "Checked Out (Outside)" : outcomeStatus === "Cancelled" ? "Status Changed: Cancelled" : outcomeStatus === "Refunded" ? "Status Changed: Refunded" : outcomeStatus === "Blocked" ? "Status Changed: Blocked" : "Status Changed: Waiting Entry",
      nextTicket,
      gateName,
      staffName,
      isDuplicate ? "warning" : outcomeStatus === "Inside" ? "success" : outcomeStatus === "Outside" ? "warning" : "danger",
      isOfflineQueued ? "Validated Offline (Queued for Sync)" : isDuplicate ? "Attempted scan of ticket already checked inside venue" : `Ticket status updated to ${outcomeStatus}`,
    ));
    setActiveScanResult({ ticket: nextTicket, scanTime: stamp, isDuplicate, isOfflineQueued });
    if (isOfflineQueued) {
      setOfflineQueue(await getQueueItems());
    }
  };

  const loadEventBundle = async (token: string, eventId: string) => {
    const bundle = await fetchValidatorTickets(token, eventId);
    const nextTickets = bundle.tickets.map(toTicket);
    setTickets(nextTickets);
    setEvents((prev) => prev.map((evt) => evt.id === bundle.event.id ? toEvent(bundle.event) : evt));
    setSelectedEventId(bundle.event.id);
    setOfflineQueue(await getQueueItems());
    await saveEvents([toEvent(bundle.event) as StoredEvent]);
    await saveTickets(nextTickets.map(toStoredTicket));
    await putSnapshotMeta({ id: bundle.event.id, eventId: bundle.event.id, version: bundle.snapshot_version ?? bundle.event.version, syncedAt: new Date().toISOString() });
    await addHistory(`Synced snapshot for ${bundle.event.event_title}`);
  };

  const bootstrap = async (token: string) => {
    setLoadingAuth(true);
    setAppError(null);
    try {
      const me = await fetchValidatorMe(token);
      setIdentity(me);
      setCurrentUser({
        id: me.identity.uid,
        name: me.identity.display_name ?? me.identity.email ?? "BuyMesho Validator",
        email: me.identity.email ?? "",
        role: me.access_scope.role === "admin" ? "organizer" : "gate_staff",
        assignedEventIds: me.access_scope.allowed_event_ids,
        assignedGate: undefined,
      });
      const remoteEvents = me.events.map(toEvent);
      setEvents(remoteEvents);
      await saveEvents(remoteEvents as StoredEvent[]);
      const firstEventId = remoteEvents[0]?.id ?? null;
      setSelectedEventId(firstEventId);
      if (firstEventId) {
        await loadEventBundle(token, firstEventId);
      } else {
        setTickets([]);
        setLogs([]);
      }
    } catch (error) {
      clearToken();
      setAuthToken("");
      setIdentity(null);
      setCurrentUser(null);
      setEvents([]);
      setTickets([]);
      setLogs([]);
      setSelectedEventId(null);
      setAppError(error instanceof Error ? error.message : "Unable to load BuyMesho session");
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    if (authToken) return;
    const queryToken = new URLSearchParams(window.location.search).get("token") ?? new URLSearchParams(window.location.search).get("access_token");
    if (queryToken) {
      saveToken(queryToken);
      setAuthToken(queryToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const syncNow = async () => {
    if (!authToken || offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      const pending = await getQueueItems();
      const response = await syncQueuedValidations(authToken, {
        queue: pending,
        eventId: selectedEventId ?? "",
        clientSnapshotVersion: identity?.access_scope?.snapshot_version ?? null,
      });

      for (const applied of response.applied) {
        if (applied.serverTicket) {
          const nextTicket = toTicket(applied.serverTicket);
          await upsertLocalTicket(nextTicket);
        }
        await deleteQueueItem(applied.queueId);
      }

      if (response.conflicts.length > 0) {
        for (const conflict of response.conflicts) {
          await addHistory(`Conflict on ${conflict.ticketId}: ${conflict.reason}`);
        }
      }

      await clearQueue();
      setOfflineQueue(await getQueueItems());
      setLastSyncAt(new Date().toISOString());
      await putSnapshotMeta({ id: selectedEventId ?? "global", eventId: selectedEventId ?? "global", version: identity?.access_scope?.snapshot_version ?? "unknown", syncedAt: new Date().toISOString() });
      setSyncToastMessage(`Synced ${response.applied.length} queued validation${response.applied.length === 1 ? "" : "s"} with BuyMesho.`);
      setTimeout(() => setSyncToastMessage(null), 4000);
      if (selectedEventId) await loadEventBundle(authToken, selectedEventId);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "Failed to sync offline validations");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) void syncNow();
  }, [isOnline]);

  const handleSelectEvent = async (event: EventItem) => {
    if (!selectedUser) return;
    if (!selectedUser.assignedEventIds.includes(event.id) && selectedUser.role !== "organizer") {
      setPermissionError(`Permission Denied: ${selectedUser.name} cannot access ${event.name} on BuyMesho.`);
      return;
    }
    setPermissionError(null);
    setSelectedEventId(event.id);
    setViewState("detail");
    setIsDetailLoading(true);
    try {
      if (authToken) await loadEventBundle(authToken, event.id);
      else {
        const cachedEvents = await loadEventsFromDb();
        const cachedTickets = await loadTicketsFromDb(event.id);
        setEvents(cachedEvents.map((evt) => ({ ...evt, state: evt.state } as EventItem)));
        setTickets(cachedTickets.map((ticket) => toTicket(ticket)));
      }
    } finally {
      setTimeout(() => setIsDetailLoading(false), 250);
    }
  };

  const handleStartSessionConfirm = (session: CheckInSession) => {
    setActiveSession(session);
    setShowSessionModal(false);
    pushLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      eventId: session.eventId,
      action: "Check-in Session Started",
      gateName: session.gateName,
      staffName: session.staffName,
      statusBadge: "info",
      details: `Gate scan session initialized for ${session.gateName}`,
    });
    void saveSession({ eventId: session.eventId, gateName: session.gateName, staffName: session.staffName, startedAt: session.startTime });
    setCurrentTab("scan");
    soundFX.playSuccess();
  };

  const handleLogout = () => {
    setAuthToken("");
    setIdentity(null);
    setCurrentUser(null);
    setEvents([]);
    setTickets([]);
    setLogs([]);
    setSelectedEventId(null);
    setActiveSession(null);
    clearToken();
    void clearAllOfflineData();
    soundFX.playClick();
  };

  const handleSwitchUser = () => handleLogout();

  const handleDismissResult = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
    setActiveScanResult(null);
  };

  const handleScanTicket = async (scannedCode: string) => {
    if (!selectedEvent || !currentUser || !activeSession) return;
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;
    const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

    const duplicated = lastScanRef.current.code === cleanCode.toUpperCase() && Date.now() - lastScanRef.current.at < 1500;
    lastScanRef.current = { code: cleanCode.toUpperCase(), at: Date.now() };
    if (duplicated) return;

    const ticket = tickets.find((t) => t.qrPayload.toUpperCase() === cleanCode.toUpperCase() || t.id.toUpperCase() === cleanCode.toUpperCase());
    const offline = !isOnline || isSimulatedOffline;
    const clientSnapshotVersion = identity?.access_scope?.snapshot_version ?? null;

    if (offline) {
      if (!ticket) {
        const unknown: Ticket = { id: cleanCode.toUpperCase(), qrPayload: cleanCode, eventId: selectedEvent.id, attendeeName: "Unknown Attendee / Unrecognized Ticket", attendeeEmail: "unknown@example.com", attendeePhone: "N/A", ticketTier: "Invalid Barcode", price: 0, purchaseDate: "N/A", status: "Blocked", notes: "Barcode not found in BuyMesho database" };
        setActiveScanResult({ ticket: unknown, scanTime: nowLabel, isDuplicate: false });
        pushLog(makeLog("Unauthorized Ticket Scan", unknown, activeSession.gateName, currentUser.name, "danger", "Invalid ticket QR payload"));
        return;
      }
      const decision = nextLocalStatus(ticket, false);
      if (!decision.allowed) {
        await applyLocalValidation(ticket, activeSession.gateName, currentUser.name, decision.status, Boolean(decision.duplicate), false);
        return;
      }
      await applyLocalValidation(ticket, activeSession.gateName, currentUser.name, decision.status, false, true);
      await queueValidation(ticket, decision.status, "check_in", activeSession.gateName, currentUser.name);
      setOfflineQueue(await getQueueItems());
      return;
    }

    try {
      const response = await scanTicket(authToken, {
        code: cleanCode,
        eventId: selectedEvent.id,
        gateName: activeSession.gateName,
        staffName: currentUser.name,
        allowReentry: false,
        clientSnapshotVersion,
      });

      const stamp = nowLabel;
      if (response.ok && response.data?.ticket) {
        const nextTicket = toTicket(response.data.ticket);
        await upsertLocalTicket(nextTicket);
        pushLog(makeLog(
          "Checked In (Inside)",
          nextTicket,
          activeSession.gateName,
          currentUser.name,
          "success",
          response.data.reason || "Validated",
        ));
        setActiveScanResult({ ticket: nextTicket, scanTime: stamp, isDuplicate: false, isOfflineQueued: false });
        dismissTimerRef.current = setTimeout(() => setActiveScanResult(null), 1800);
        return;
      }

      const data = response.data ?? {};
      const fallbackTicket: Ticket = data.ticket ? toTicket(data.ticket) : {
        id: cleanCode.toUpperCase(),
        qrPayload: cleanCode,
        eventId: selectedEvent.id,
        attendeeName: "Unknown Attendee / Unrecognized Ticket",
        attendeeEmail: "unknown@example.com",
        attendeePhone: "N/A",
        ticketTier: "Invalid Barcode",
        price: 0,
        purchaseDate: "N/A",
        status: "Blocked",
        notes: String(data.reason ?? data.error ?? "Ticket not found"),
      };

      if (response.status === 409 || String(data.result) === "already_applied") {
        const insideTicket = { ...fallbackTicket, status: "Inside" as TicketStatus };
        await upsertLocalTicket(insideTicket);
        pushLog(makeLog("Duplicate Scan Warning", insideTicket, activeSession.gateName, currentUser.name, "warning", String(data.reason ?? "Duplicate scan")));
        setActiveScanResult({ ticket: insideTicket, scanTime: stamp, isDuplicate: true });
        dismissTimerRef.current = setTimeout(() => setActiveScanResult(null), 2200);
        return;
      }

      if (response.status === 403) {
        await upsertLocalTicket({ ...fallbackTicket, status: statusFromTicket(String(data.reason ?? fallbackTicket.status)) });
        pushLog(makeLog("Unauthorized Ticket Scan", fallbackTicket, activeSession.gateName, currentUser.name, "danger", String(data.reason ?? "Ticket denied")));
        setActiveScanResult({ ticket: fallbackTicket, scanTime: stamp, isDuplicate: false });
        dismissTimerRef.current = setTimeout(() => setActiveScanResult(null), 2500);
        return;
      }

      pushLog(makeLog("Unauthorized Ticket Scan", fallbackTicket, activeSession.gateName, currentUser.name, "danger", String(data.reason ?? data.error ?? "Ticket not found")));
      setActiveScanResult({ ticket: fallbackTicket, scanTime: stamp, isDuplicate: false });
      dismissTimerRef.current = setTimeout(() => setActiveScanResult(null), 2500);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "Failed to validate ticket");
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    if (!selectedEvent || !currentUser) return;
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) return;

    const offline = !isOnline || isSimulatedOffline;
    const gateName = activeSession?.gateName ?? "Main Gate";
    const snapshotVersion = identity?.access_scope?.snapshot_version ?? null;
    if (offline) {
      await applyLocalValidation(ticket, gateName, currentUser.name, status, false, true);
      await queueValidation(ticket, status, "status_change", gateName, currentUser.name);
      setOfflineQueue(await getQueueItems());
      return;
    }

    try {
      const result = await updateTicketStatus(authToken, {
        ticketId,
        eventId: ticket.eventId,
        status,
        gateName,
        staffName: currentUser.name,
        clientSnapshotVersion: snapshotVersion,
      });
      const nextTicket = toTicket(result.data?.ticket ?? ticket);
      await upsertLocalTicket(nextTicket);
      pushLog(makeLog(
        status === "Inside" ? "Checked In (Inside)" : status === "Outside" ? "Checked Out (Outside)" : status === "Cancelled" ? "Status Changed: Cancelled" : status === "Refunded" ? "Status Changed: Refunded" : status === "Blocked" ? "Status Changed: Blocked" : "Status Changed: Waiting Entry",
        nextTicket,
        gateName,
        currentUser.name,
        status === "Inside" ? "success" : status === "Outside" ? "warning" : "danger",
        "BuyMesho status updated",
      ));
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "Failed to update ticket status");
    }
  };

  const retryConflicts = async () => {
    if (!authToken) return;
    const pending = await getQueueItems();
    for (const item of pending) {
      item.status = "pending";
      await saveQueueItem(item);
    }
    setOfflineQueue(await getQueueItems());
    if (isOnline) await syncNow();
  };

  if (!authToken || !selectedUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
        <Header user={null} onLogout={handleLogout} onSwitchUser={handleSwitchUser} activeSession={null} isHighContrast={isHighContrast} onToggleHighContrast={() => setIsHighContrast((v) => !v)} />
        <main><LoginView /></main>
        {appError && <div className="mx-auto mt-3 max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{appError}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Header user={selectedUser} onLogout={handleLogout} onSwitchUser={handleSwitchUser} activeSession={activeSession} activeEventName={selectedEvent?.name} isHighContrast={isHighContrast} onToggleHighContrast={() => setIsHighContrast((v) => !v)} />
      <OfflineStatusPanel
        isOnline={isOnline}
        isSyncing={isSyncing}
        queuedItems={offlineQueue as OfflineQueueItem[]}
        lastSyncAt={lastSyncAt}
        onSyncNow={() => void syncNow()}
        onClearQueue={() => { void clearQueue(); setOfflineQueue([]); }}
      />
      <OfflineSyncBanner
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        queuedItems={offlineQueue}
        isSyncing={isSyncing}
        onToggleSimulatedOffline={() => setIsSimulatedOffline((v) => !v)}
        onSyncNow={() => void syncNow()}
        onClearQueue={() => { clearOfflineQueue(); void clearQueue(); setOfflineQueue([]); }}
      />
      {syncToastMessage && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-emerald-400 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{syncToastMessage}</span>
        </div>
      )}
      {loadingAuth && <div className="mx-auto mt-3 max-w-md rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-sm">Connecting to BuyMesho...</div>}
      {appError && <div className="mx-auto mt-3 max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{appError}</div>}
      <main className="transition-all duration-200">
        {currentTab === "events" && (
          <>
            {viewState === "list" || !selectedEvent ? (
              <EventsView user={selectedUser} events={events} selectedEvent={selectedEvent} onSelectEvent={handleSelectEvent} permissionError={permissionError} onClearPermissionError={() => setPermissionError(null)} />
            ) : (
              <EventDetailView event={selectedEvent} isLoading={isDetailLoading} onBack={() => setViewState("list")} onStartScanning={() => { if (activeSession && activeSession.active && activeSession.eventId === selectedEvent.id) setCurrentTab("scan"); else setShowSessionModal(true); }} onViewAttendees={() => { setCurrentTab("attendees"); setIsAttendeesLoading(true); setTimeout(() => setIsAttendeesLoading(false), 250); }} activeSession={activeSession} />
            )}
          </>
        )}
        {currentTab === "scan" && selectedEvent && (
          <ScannerView event={selectedEvent} session={activeSession} tickets={tickets} onScanTicket={(code) => void handleScanTicket(code)} onBackToEvent={() => setCurrentTab("events")} onStartSessionRequest={() => setShowSessionModal(true)} isContinuousScan={isContinuousScan} onToggleContinuousScan={() => setIsContinuousScan((v) => !v)} />
        )}
        {currentTab === "attendees" && selectedEvent && (
          <AttendeesView event={selectedEvent} tickets={tickets} isLoading={isAttendeesLoading} onSelectTicket={(ticket) => setActiveScanResult({ ticket, scanTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), isDuplicate: false })} onUpdateStatusDirect={(ticketId, status) => { void handleUpdateStatus(ticketId, status); soundFX.playClick(); }} />
        )}
      </main>
      {activeScanResult && (
        <ScanResultCard ticket={activeScanResult.ticket} scanTime={activeScanResult.scanTime} isDuplicateScan={activeScanResult.isDuplicate} isOfflineQueued={activeScanResult.isOfflineQueued} isContinuousMode={isContinuousScan} onUpdateStatus={(status) => { void handleUpdateStatus(activeScanResult.ticket.id, status); handleDismissResult(); soundFX.playClick(); }} onDismiss={handleDismissResult} />
      )}
      {showSessionModal && selectedEvent && (
        <CheckInSessionModal event={selectedEvent} user={selectedUser} onClose={() => setShowSessionModal(false)} onConfirmStartSession={handleStartSessionConfirm} />
      )}
      <FooterNavigation currentTab={currentTab} onTabChange={(tab) => { if (tab === "attendees" && currentTab !== "attendees") { setIsAttendeesLoading(true); setTimeout(() => setIsAttendeesLoading(false), 250); } setCurrentTab(tab); setPermissionError(null); }} isScanningActive={Boolean(activeSession && activeSession.active)} hasActiveEvent={Boolean(selectedEvent)} />
    </div>
  );
}
