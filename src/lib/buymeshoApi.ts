import { auth, getFreshIdToken } from '../firebase';

const API_BASE_URL = '';
const VALIDATOR_ACCESS_DENIED_STATUS = 460;

export type ValidatorIdentity = {
  uid: string;
  email: string | null;
  email_verified?: boolean;
  is_admin?: boolean;
  display_name?: string | null;
};

export type ValidatorAccessScope = {
  can_validate_tickets?: boolean;
  is_admin?: boolean;
  role?: "admin" | "validator";
  source?: "buymesho";
  allowed_event_ids?: string[];
  snapshot_version?: string | null;
};

export type ValidatorEvent = {
  id: string;
  title?: string;
  name?: string;
  event_title?: string;
  organizerName?: string;
  organizer_name?: string;
  eventDate?: string;
  event_date?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  venue?: string;
  location?: string;
  ticketLink?: string | null;
  ticket_link?: string | null;
  status?: string;
  publication_status?: "draft" | "published" | "paused" | "cancelled";
  publication_mode?: "immediate" | "scheduled";
  publication_at?: string | null;
  runtime_mode?: "automatic" | "force_live" | "force_upcoming";
  event_type?: string;
  description?: string;
  ticket_mode?: string;
  ticket_price?: number | null;
  contact_whatsapp?: string | null;
  poster_alt?: string | null;
  creator_uid?: string | null;
  spec_values?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  ticket_count?: number;
};

export type PublicValidatorTicket = {
  ticketId: string;
  code: string;
  ticketTitle: string;
  ticketType: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  eventDate: string;
  startTime: string;
  venue: string;
  location: string;
  seatOrZone: string;
  status: "Waiting Entry" | "Inside" | "Outside" | "Cancelled" | "Refunded" | "Blocked";
  purchaseDate: string;
  updatedAt: string;
};

export type ValidatorMeResponse = { success?: boolean; identity: ValidatorIdentity; creator?: Record<string, unknown> | null; access_scope: ValidatorAccessScope; events: ValidatorEvent[] };
export type ValidatorEventTicketsResponse = { success?: boolean; event: ValidatorEvent; tickets: PublicValidatorTicket[]; snapshot_version: string | null };
export type BulkSyncResult = { success: boolean; applied: Array<{ queueId: string; ticketId: string; eventId: string; result: "accepted" | "already_applied" | "rejected"; reason?: string; serverTicket?: PublicValidatorTicket }>; conflicts: Array<{ queueId: string; ticketId: string; eventId: string; reason: string; expectedStatus?: string; actualStatus?: string }> };
export type ScanResponse = { ok: boolean; status: number; data?: { result: "accepted" | "already_applied" | "rejected"; reason: string; ticket?: PublicValidatorTicket; serverVersion?: string | null } };
type SessionExchangeResponse = { success: boolean; customToken: string };

async function requireFreshFirebaseToken(forceRefresh = false) { if (!auth.currentUser) throw Object.assign(new Error('No authenticated Firebase user.'), { status: 401 }); return getFreshIdToken(forceRefresh); }
async function requestJson<T>(path: string, token: string, init?: RequestInit): Promise<{ response: Response; payload: T | Record<string, unknown> }> { const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } }); const payload = await response.json().catch(() => ({})); return { response, payload }; }
function buildApiError(response: Response, payload: unknown) { const error = payload && typeof payload === "object" && "error" in payload ? String((payload as { error?: unknown }).error ?? "Request failed") : "Request failed"; return Object.assign(new Error(error), { status: response.status, payload }); }
async function fetchJson<T>(path: string, _unusedToken?: string, init?: RequestInit): Promise<T> { let effectiveToken = await requireFreshFirebaseToken(); let result: { response: Response; payload: T | Record<string, unknown> }; try { result = await requestJson<T>(path, effectiveToken, init); } catch (error) { throw Object.assign(new Error(`Unable to reach BuyMesho Validator API: ${error instanceof Error ? error.message : String(error)}`), { status: 0, cause: error }); } if (result.response.status === 401) { effectiveToken = await requireFreshFirebaseToken(true); try { result = await requestJson<T>(path, effectiveToken, init); } catch (error) { throw Object.assign(new Error(`Unable to reach BuyMesho Validator API: ${error instanceof Error ? error.message : String(error)}`), { status: 0, cause: error }); } if (result.response.status === 401) { await signOutValidator().catch(() => undefined); throw buildApiError(result.response, result.payload); } } if (!result.response.ok) { const error = buildApiError(result.response, result.payload); if (error.status === 403) error.status = VALIDATOR_ACCESS_DENIED_STATUS; throw error; } return result.payload as T; }

export async function exchangeValidatorSession(token: string) { try { const response = await fetch(`${API_BASE_URL}/api/validator/session`, { method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({}) }); const payload = await response.json().catch(() => ({})); if (!response.ok) { const error = payload && typeof payload === 'object' && "error" in payload ? String((payload as { error?: unknown }).error ?? "Request failed") : `BuyMesho returned HTTP ${response.status}`; throw Object.assign(new Error(error), { status: response.status, payload }); } if (!payload || typeof payload.customToken !== "string" || !payload.customToken) throw Object.assign(new Error("BuyMesho returned an invalid Validator session response."), { status: 502, payload }); return payload as SessionExchangeResponse; } catch (error) { if (error && typeof error === 'object' && 'status' in error) throw error; throw Object.assign(new Error(`Unable to reach BuyMesho Validator API: ${error instanceof Error ? error.message : String(error)}`), { status: 0, cause: error }); } }
export async function fetchValidatorMe(token?: string) { return fetchJson<ValidatorMeResponse>("/api/validator/me", token); }
export async function fetchValidatorTickets(token: string | undefined, eventId: string) { return fetchJson<ValidatorEventTicketsResponse>(`/api/validator/public/events/${encodeURIComponent(eventId)}/tickets`, token); }
export async function scanTicket(token: string | undefined, input: { code: string; eventId: string; gateName: string; staffName: string; allowReentry: boolean; clientSnapshotVersion?: string | null }) { return fetchJson<ScanResponse>("/api/validator/scan", token, { method: "POST", body: JSON.stringify(input) }); }
export async function updateTicketStatus(token: string | undefined, input: { ticketId: string; eventId: string; status: string; gateName: string; staffName: string; clientSnapshotVersion?: string | null }) { return fetchJson<ScanResponse>("/api/validator/status", token, { method: "POST", body: JSON.stringify(input) }); }
export async function syncQueuedValidations(token: string | undefined, input: { queue: Array<any>; eventId: string; clientSnapshotVersion?: string | null }) { return fetchJson<BulkSyncResult>("/api/validator/sync", token, { method: "POST", body: JSON.stringify(input) }); }
export function getStoredToken() { return auth.currentUser ? 'firebase-authenticated' : ''; }
export function saveToken(_token: string) {}
export async function signOutValidator() { await auth.signOut(); }
export function clearToken() { void signOutValidator(); }
