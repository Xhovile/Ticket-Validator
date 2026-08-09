import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { User, EventItem, Ticket, TicketStatus, ActivityLogEntry, CheckInSession } from "./types";
import { Header } from "./components/Header";
import { FooterNavigation, NavTab } from "./components/FooterNavigation";
import { EventsView } from "./components/EventsView";
import { EventDetailView } from "./components/EventDetailView";
import { CheckInSessionModal } from "./components/CheckInSessionModal";
import { ScannerView } from "./components/ScannerView";
import { ScanResultCard } from "./components/ScanResultCard";
import { soundFX } from "./utils/audio";
import { clearOfflineQueue, enqueueValidation, getOfflineQueue, QueuedValidation } from "./utils/offlineSyncManager";
import { fetchValidatorTickets, scanTicket, updateTicketStatus, TOKEN_KEY } from "./lib/buymeshoApi";

const USER_KEY = "buymesho_validator_user";
const ACTIVE_SESSION_KEY = "buymesho_validator_active_session";
const EVENTS_KEY = "buymesho_validator_events";
const TICKETS_KEY = "buymesho_validator_tickets";
const highContrastKey = "buymesho_high_contrast";

type ScanCardState = { ticket: Ticket; scanTime: string; isDuplicate: boolean; isOfflineQueued?: boolean } | null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function toTicket(t: any): Ticket {
  return {
    id: String(t.id),
    qrPayload: String(t.qrPayload ?? t.code ?? t.codeNormalized ?? ""),
    eventId: String(t.eventId ?? t.event_id ?? ""),
    attendeeName: String(t.attendeeName ?? "Verified Buyer"),
    attendeeEmail: String(t.attendeeEmail ?? ""),
    attendeePhone: String(t.attendeePhone ?? ""),
    ticketTier: String(t.ticketTier ?? t.ticket_tier ?? "Ticket"),
    seatOrZone: t.seatOrZone ?? undefined,
    price: Number(t.price ?? 0),
    purchaseDate: String(t.purchaseDate ?? ""),
    status: t.status as TicketStatus,
    lastCheckedInTime: t.lastCheckedInTime ?? undefined,
    lastCheckedOutTime: t.lastCheckedOutTime ?? undefined,
    lastGateName: t.lastGateName ?? undefined,
    lastStaffName: t.lastStaffName ?? undefined,
    notes: t.notes ?? undefined,
  };
}

function toEvent(e: any): EventItem {
  return {
    id: String(e.id),
    name: String(e.event_title ?? e.name ?? "Event"),
    organizerId: String(e.creator_uid ?? e.organizer_id ?? ""),
    organizerName: String(e.organizer_name ?? "BuyMesho Creator"),
    date: String(e.event_date ?? ""),
    venue: String(e.venue ?? ""),
    city: String(e.location ?? ""),
    bannerImage: typeof e.spec_values?.banner_image === "string" ? e.spec_values.banner_image : "https://images.unsplash.com/photo-1470229722913-7c0e2dbb0d7f?w=1200&auto=format&fit=crop&q=80",
    state: e.status === "draft" ? "Upcoming" : e.status === "published" ? "Live" : "Ended",
    totalTicketsSold: Number(e.ticket_count ?? 0),
    checkedInCount: Number(e.checked_in_count ?? 0),
    category: String(e.event_type ?? "Event"),
    gates: Array.isArray(e.spec_values?.gates) ? e.spec_values.gates.filter((g: unknown): g is string => typeof g === "string") : ["Main Gate"],
  };
}

function chooseAction(status: TicketStatus): ActivityLogEntry["action"] {
  if (status === "Inside") return "Checked In (Inside)";
  if (status === "Outside") return "Checked Out (Outside)";
  if (status === "Cancelled") return "Status Changed: Cancelled";
  if (status === "Refunded") return "Status Changed: Refunded";
  if (status === "Blocked") return "Status Changed: Blocked";
  return "Status Changed: Waiting Entry";
}

function log(action: ActivityLogEntry["action"], ticket: Ticket, gateName: string, staffName: string, statusBadge: ActivityLogEntry["statusBadge"], details: string): ActivityLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    eventId: ticket.eventId,
    ticketId: ticket.id,
    attendeeName: ticket.attendeeName,
    action,
    gateName,
    staffName,
    statusBadge,
    details,
  };
}

export default function ValidatorWorkspace() {
  const [authToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [user, setUser] = useState<User | null>(() => readJson<User | null>(USER_KEY, null));
  const [events, setEvents] = useState<EventItem[]>(() => readJson<EventItem[]>(EVENTS_KEY, []));
  const [tickets, setTickets] = useState<Ticket[]>(() => readJson<Ticket[]>(TICKETS_KEY, []));
  const [session, setSession] = useState<CheckInSession | null>(() => readJson<CheckInSession | null>(ACTIVE_SESSION_KEY, null));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => readJson<EventItem[]>(EVENTS_KEY, [])[0]?.id ?? null);
  const [currentTab, setCurrentTab] = useState<NavTab>("events");
  const [viewState, setViewState] = useState<"list" | "detail">("list");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isContinuousScan, setIsContinuousScan] = useState(true);
  const [scanCard, setScanCard] = useState<ScanCardState>(null);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem(highContrastKey) === "true");
  const [offlineQueue, setOfflineQueue] = useState<QueuedValidation[]>(() => getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedEventId) ?? null, [events, selectedEventId]);
  const selectedUser = user;

  useEffect(() => {
    document.documentElement.classList.toggle("sunlight-high-contrast", isHighContrast);
    localStorage.setItem(highContrastKey, String(isHighContrast));
  }, [isHighContrast]);

  useEffect(() => {
    const sync = () => {
      setUser(readJson<User | null>(USER_KEY, null));
      setEvents(readJson<EventItem[]>(EVENTS_KEY, []));
      setTickets(readJson<Ticket[]>(TICKETS_KEY, []));
      setSession(readJson<CheckInSession | null>(ACTIVE_SESSION_KEY, null));
      setOfflineQueue(getOfflineQueue());
    };
    sync();
    window.addEventListener("buymesho-validator-sync", sync);
    return () => window.removeEventListener("buymesho-validator-sync", sync);
  }, []);

  const persist = (nextEvents: EventItem[], nextTickets: Ticket[]) => {
    setEvents(nextEvents);
    setTickets(nextTickets);
    writeJson(EVENTS_KEY, nextEvents);
    writeJson(TICKETS_KEY, nextTickets);
  };

  const refreshCount = (eventId: string, nextTickets: Ticket[]) =>
    nextTickets.filter((t) => t.eventId === eventId && t.status === "Inside").length;

  const loadEventTickets = async (eventId: string) => {
    if (!authToken) return;
    const bundle = await fetchValidatorTickets(authToken, eventId);
    const nextEvent = toEvent(bundle.event);
    const nextTickets = (bundle.tickets ?? []).map(toTicket);
    const nextEvents = events.map((evt) => (evt.id === eventId ? { ...evt, checkedInCount: nextEvent.checkedInCount, totalTicketsSold: nextEvent.totalTicketsSold } : evt));
    persist(nextEvents, nextTickets);
    setLogs(
      (bundle.audit_logs ?? []).map((a: any) => ({
        id: `log-${a.id ?? Date.now()}`,
        timestamp: new Date(a.created_at ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        eventId: String(a.event_id ?? eventId),
        ticketId: a.ticket_id ? String(a.ticket_id) : undefined,
        action: chooseAction(String(a.result ?? "Waiting Entry")),
        gateName: String(a.gate_name ?? "Main Gate"),
        staffName: String(a.staff_name ?? "Gate Officer"),
        statusBadge: String(a.result ?? "") === "Inside" ? "success" : String(a.result ?? "") === "Outside" ? "warning" : String(a.result ?? "") === "Waiting Entry" ? "info" : "danger",
        details: a.details ? String(a.details) : "Synced from BuyMesho",
      } as ActivityLogEntry)),
    );
    setSelectedEventId(eventId);
  };

  useEffect(() => {
    if (authToken && selectedEventId) {
      void loadEventTickets(selectedEventId).catch((err) => setError(err instanceof Error ? err.message : "Failed to load event"));
    }
  }, [authToken, selectedEventId]);

  const updateLocalTicket = (nextTicket: Ticket, badge: ActivityLogEntry["statusBadge"], details: string, duplicate = false, offlineQueued = false) => {
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const nextTickets = tickets.some((t) => t.id === nextTicket.id) ? tickets.map((t) => (t.id === nextTicket.id ? nextTicket : t)) : [nextTicket, ...tickets];
    const nextEvents = events.map((evt) => evt.id === nextTicket.eventId ? { ...evt, checkedInCount: refreshCount(nextTicket.eventId, nextTickets) } : evt);
    persist(nextEvents, nextTickets);
    setScanCard({ ticket: nextTicket, scanTime: stamp, isDuplicate: duplicate, isOfflineQueued: offlineQueued });
    setLogs((prev) => [log(duplicate ? "Duplicate Scan Warning" : chooseAction(nextTicket.status), nextTicket, session?.gateName ?? "Main Gate", user?.name ?? "Gate Officer", badge, details), ...prev]);
  };

  const syncNow = async () => {
    if (!authToken || offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      for (const item of offlineQueue) {
        await updateTicketStatus(authToken, {
          ticketId: item.ticketId,
          eventId: item.eventId,
          status: item.newStatus,
          gateName: item.gateName,
          staffName: item.staffName,
        });
      }
      clearOfflineQueue();
      setOfflineQueue([]);
      setSyncToastMessage(`Successfully synced ${offlineQueue.length} offline validation${offlineQueue.length > 1 ? "s" : ""} with BuyMesho.`);
      setTimeout(() => setSyncToastMessage(null), 4000);
      if (selectedEventId) await loadEventTickets(selectedEventId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync offline validations");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectEvent = async (event: EventItem) => {
    if (!selectedUser) return;
    if (selectedUser.role !== "organizer" && !selectedUser.assignedEventIds.includes(event.id)) {
      setPermissionError(`Permission Denied: ${selectedUser.name} cannot access ${event.name} on BuyMesho.`);
      return;
    }
    setPermissionError(null);
    setSelectedEventId(event.id);
    setViewState("detail");
    setIsDetailLoading(true);
    try { await loadEventTickets(event.id); } catch (err) { setError(err instanceof Error ? err.message : "Failed to load event"); } finally { setTimeout(() => setIsDetailLoading(false), 200); }
  };

  const handleStartSessionConfirm = (nextSession: CheckInSession) => {
    setSession(nextSession);
    writeJson(ACTIVE_SESSION_KEY, nextSession);
    setShowSessionModal(false);
    setLogs((prev) => [{
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      eventId: nextSession.eventId,
      action: "Check-in Session Started",
      gateName: nextSession.gateName,
      staffName: nextSession.staffName,
      statusBadge: "info",
      details: `Gate scan session initialized for ${nextSession.gateName}`,
    }, ...prev]);
    setCurrentTab("scan");
    soundFX.playSuccess();
  };

  const handleScanTicket = async (scannedCode: string) => {
    if (!selectedEvent || !selectedUser || !session) return;
    const code = scannedCode.trim();
    if (!code) return;

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    const now = Date.now();
    if (lastScanRef.current.code === code.toUpperCase() && now - lastScanRef.current.at < 1500) return;
    lastScanRef.current = { code: code.toUpperCase(), at: now };

    const current = tickets.find((t) => t.qrPayload.toUpperCase() === code.toUpperCase() || t.id.toUpperCase() === code.toUpperCase());
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    if (!navigator.onLine) {
      if (!current) {
        const unknown: Ticket = { id: code.toUpperCase(), qrPayload: code, eventId: selectedEvent.id, attendeeName: "Unknown Attendee / Unrecognized Ticket", attendeeEmail: "unknown@example.com", attendeePhone: "N/A", ticketTier: "Invalid Barcode", price: 0, purchaseDate: "N/A", status: "Blocked", notes: "Barcode not found in BuyMesho database" };
        setScanCard({ ticket: unknown, scanTime: stamp, isDuplicate: false });
        setLogs((prev) => [log("Unauthorized Ticket Scan", unknown, session.gateName, selectedUser.name, "danger", "Invalid ticket QR payload"), ...prev]);
        return;
      }
      enqueueValidation({ ticketId: current.id, eventId: current.eventId, attendeeName: current.attendeeName, ticketTier: current.ticketTier, actionType: "check_in", newStatus: "Inside", previousStatus: current.status, gateName: session.gateName, staffName: selectedUser.name });
      setOfflineQueue(getOfflineQueue());
      const next = { ...current, status: "Inside" as TicketStatus, lastCheckedInTime: stamp, lastGateName: session.gateName, lastStaffName: selectedUser.name };
      updateLocalTicket(next, "success", "Validated Offline (Queued for Sync)", false, true);
      return;
    }

    const response = await scanTicket(authToken, { code, eventId: selectedEvent.id, gateName: session.gateName, staffName: selectedUser.name, allowReentry: false });
    if (response.ok) {
      const next = toTicket(response.data.ticket);
      updateLocalTicket(next, "success", String(response.data.reason ?? "Validated"));
      dismissTimerRef.current = setTimeout(() => setScanCard(null), 1800);
      return;
    }

    const data = response.data ?? {};
    const fallback: Ticket = data.ticket ? toTicket(data.ticket) : { id: code.toUpperCase(), qrPayload: code, eventId: selectedEvent.id, attendeeName: "Unknown Attendee / Unrecognized Ticket", attendeeEmail: "unknown@example.com", attendeePhone: "N/A", ticketTier: "Invalid Barcode", price: 0, purchaseDate: "N/A", status: "Blocked", notes: String(data.reason ?? data.error ?? "Ticket not found") };

    if (response.status === 409 || String(data.result) === "Inside") {
      updateLocalTicket({ ...fallback, status: "Inside" }, "warning", String(data.reason ?? "Duplicate scan"), true, false);
      dismissTimerRef.current = setTimeout(() => setScanCard(null), 2200);
      return;
    }

    if (response.status === 403) {
      updateLocalTicket({ ...fallback, status: String(data.result ?? fallback.status) as TicketStatus }, "danger", String(data.reason ?? "Ticket denied"));
      dismissTimerRef.current = setTimeout(() => setScanCard(null), 2500);
      return;
    }

    setScanCard({ ticket: fallback, scanTime: stamp, isDuplicate: false });
    setLogs((prev) => [log("Unauthorized Ticket Scan", fallback, session.gateName, selectedUser.name, "danger", String(data.reason ?? data.error ?? "Ticket not found")), ...prev]);
    dismissTimerRef.current = setTimeout(() => setScanCard(null), 2500);
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || !selectedUser) return;

    if (!navigator.onLine) {
      enqueueValidation({ ticketId, eventId: ticket.eventId, attendeeName: ticket.attendeeName, ticketTier: ticket.ticketTier, actionType: "status_change", newStatus: status, previousStatus: ticket.status, gateName: session?.gateName ?? "Main Gate", staffName: selectedUser.name });
      setOfflineQueue(getOfflineQueue());
      updateLocalTicket({ ...ticket, status, lastGateName: session?.gateName ?? "Main Gate", lastStaffName: selectedUser.name }, status === "Inside" ? "success" : status === "Outside" ? "warning" : "danger", "Validated Offline (Queued for Sync)", false, true);
      return;
    }

    try {
      const res = await updateTicketStatus(authToken, {
        ticketId,
        eventId: ticket.eventId,
        status,
        gateName: session?.gateName ?? "Main Gate",
        staffName: selectedUser.name,
      });
      updateLocalTicket(toTicket(res.ticket), status === "Inside" ? "success" : status === "Outside" ? "warning" : "danger", "BuyMesho status updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ticket status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(TICKETS_KEY);
    localStorage.removeItem(TOKEN_KEY);
    clearOfflineQueue();
    window.location.reload();
  };

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold">BuyMesho access required</h2>
          <p className="mt-2 text-sm text-slate-600">No verified BuyMesho session was found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Header user={selectedUser} onLogout={handleLogout} onSwitchUser={handleLogout} activeSession={session} activeEventName={selectedEvent?.name} isHighContrast={isHighContrast} onToggleHighContrast={() => setIsHighContrast((v) => !v)} />

      {error && <div className="mx-auto mt-3 max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      {syncToastMessage && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-emerald-400 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{syncToastMessage}</span>
        </div>
      )}

      {scanCard && (
        <ScanResultCard
          ticket={scanCard.ticket}
          scanTime={scanCard.scanTime}
          isDuplicateScan={scanCard.isDuplicate}
          isOfflineQueued={scanCard.isOfflineQueued}
          isContinuousMode={isContinuousScan}
          onUpdateStatus={(status) => { void handleUpdateStatus(scanCard.ticket.id, status); setScanCard(null); soundFX.playClick(); }}
          onDismiss={() => setScanCard(null)}
        />
      )}

      <main className="transition-all duration-200">
        {currentTab === "events" && (
          <>
            {viewState === "list" || !selectedEvent ? (
              <EventsView user={selectedUser} events={events} selectedEvent={selectedEvent} onSelectEvent={handleSelectEvent} permissionError={permissionError} onClearPermissionError={() => setPermissionError(null)} />
            ) : (
              <EventDetailView
                event={selectedEvent}
                isLoading={isDetailLoading}
                onBack={() => setViewState("list")}
                onStartScanning={() => {
                  if (session && session.active && session.eventId === selectedEvent.id) setCurrentTab("scan");
                  else setShowSessionModal(true);
                }}
                onViewAttendees={() => setCurrentTab("scan")}
                activeSession={session}
              />
            )}
          </>
        )}

        {currentTab === "scan" && selectedEvent && (
          <ScannerView
            event={selectedEvent}
            session={session}
            tickets={tickets}
            onScanTicket={(code) => void handleScanTicket(code)}
            onBackToEvent={() => setCurrentTab("events")}
            onStartSessionRequest={() => setShowSessionModal(true)}
            isContinuousScan={isContinuousScan}
            onToggleContinuousScan={() => setIsContinuousScan((v) => !v)}
          />
        )}
      </main>

      {showSessionModal && selectedEvent && (
        <CheckInSessionModal event={selectedEvent} user={selectedUser} onClose={() => setShowSessionModal(false)} onConfirmStartSession={handleStartSessionConfirm} />
      )}

      <FooterNavigation
        currentTab={currentTab}
        onTabChange={(tab) => { setCurrentTab(tab === "attendees" ? "scan" : tab); setPermissionError(null); }}
        isScanningActive={Boolean(session && session.active)}
        hasActiveEvent={Boolean(selectedEvent)}
      />
    </div>
  );
}
