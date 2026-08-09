import { auth, getFreshIdToken } from '../firebase';

// Use the BuyMesho backend directly when configured. This avoids depending on
// the Vercel rewrite for the authentication handoff while keeping same-origin
// behavior as the fallback for existing deployments.
const API_BASE_URL = (import.meta.env.VITE_BUYMESHO_API_BASE_URL ?? '').trim().replace(/\/$/, '');

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
};

export type ValidatorTicket = {
  id: string;
  code: string;
  event_id: string;
  event_title: string;
  order_id: string;
  buyer_id: string;
  status: "Waiting Entry" | "Inside" | "Outside" | "Cancelled" | "Refunded" | "Blocked" | "Duplicate Scan Attempt";
  order_status: string;
  payment_status: string | null;
  updated_at: string;
  version: string;
  metadata: Record<string, unknown>;
};

export type ValidatorMeResponse = {
  success?: boolean;
  identity: ValidatorIdentity;
  creator?: Record<string, unknown> | null;
  access_scope: ValidatorAccessScope;
  events: ValidatorEvent[];
};

export type ValidatorEventTicketsResponse = {
  success?: boolean;
  event: ValidatorEvent;
  tickets: ValidatorTicket[];
  snapshot_version: string | null;
};

export type BulkSyncResult = {
  success: boolean;
  applied: Array<{ queueId: string; ticketId: string; eventId: string; result: "accepted" | "already_applied" | "rejected"; reason?: string; serverTicket?: ValidatorTicket }>;
  conflicts: Array<{ queueId: string; ticketId: string; eventId: string; reason: string; expectedStatus?: string; actualStatus?: string }>;
};

export type ScanResponse = {
  ok: boolean;
  status: number;
  data?: {
    result: "accepted" | "already_applied" | "rejected";
    reason: string;
    ticket?: ValidatorTicket;
    serverVersion?: string | null;
  };
};

type SessionExchangeResponse = {
  success: boolean;
  customToken: string;
};

async function requireFreshFirebaseToken() {
  if (!auth.currentUser) {
    throw Object.assign(new Error('No authenticated Firebase user.'), { status: 401 });
  }

  return getFreshIdToken();
}

async function fetchJson<T>(path: string, _unusedToken?: string, init?: RequestInit): Promise<T> {
  const effectiveToken = await requireFreshFirebaseToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${effectiveToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error?: unknown }).error ?? "Request failed")
      : "Request failed";

    throw Object.assign(new Error(error), { status: response.status, payload });
  }

  return payload as T;
}

export async function exchangeValidatorSession(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/validator/session`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error ?? "Request failed")
        : `BuyMesho returned HTTP ${response.status}`;

      throw Object.assign(new Error(error), { status: response.status, payload });
    }

    if (!payload || typeof payload.customToken !== "string" || !payload.customToken) {
      throw Object.assign(new Error("BuyMesho returned an invalid Validator session response."), {
        status: 502,
        payload,
      });
    }

    return payload as SessionExchangeResponse;
  } catch (error) {
    // Preserve HTTP errors so the gate can distinguish authorization failures
    // from genuine network/CORS/backend failures.
    if (error && typeof error === 'object' && 'status' in error) throw error;

    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(
      new Error(`Unable to reach BuyMesho Validator API: ${message}`),
      { cause: error },
    );
  }
}

export async function fetchValidatorMe(token?: string) {
  return fetchJson<ValidatorMeResponse>("/api/validator/me", token);
}

export async function fetchValidatorTickets(token: string | undefined, eventId: string) {
  return fetchJson<ValidatorEventTicketsResponse>(
    `/api/validator/events/${encodeURIComponent(eventId)}/tickets`,
    token,
  );
}

export async function scanTicket(
  token: string | undefined,
  input: {
    code: string;
    eventId: string;
    gateName: string;
    staffName: string;
    allowReentry: boolean;
    clientSnapshotVersion?: string | null;
  },
) {
  return fetchJson<ScanResponse>("/api/validator/scan", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTicketStatus(
  token: string | undefined,
  input: {
    ticketId: string;
    eventId: string;
    status: string;
    gateName: string;
    staffName: string;
    clientSnapshotVersion?: string | null;
  },
) {
  return fetchJson<ScanResponse>("/api/validator/status", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function syncQueuedValidations(
  token: string | undefined,
  input: {
    queue: Array<any>;
    eventId: string;
    clientSnapshotVersion?: string | null;
  },
) {
  return fetchJson<BulkSyncResult>("/api/validator/sync", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getStoredToken() {
  return auth.currentUser ? 'firebase-authenticated' : '';
}

export function saveToken(_token: string) {
  // Intentionally no-op. Firebase Auth owns session persistence.
}

export async function signOutValidator() {
  await auth.signOut();
}

export function clearToken() {
  void auth.signOut();
}
