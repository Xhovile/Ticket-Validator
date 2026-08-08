import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, LogIn, ScanLine, ShieldCheck, UserPlus } from 'lucide-react';
import App from '../App';
import { User, UserRole, EventItem, Ticket } from '../types';

const VALIDATOR_USER_KEY = 'buymesho_validator_user';
const VALIDATOR_SESSION_KEY = 'buymesho_validator_session';
const VALIDATOR_EVENTS_KEY = 'buymesho_validator_events';
const VALIDATOR_TICKETS_KEY = 'buymesho_validator_tickets';
const VALIDATOR_SYNC_META_KEY = 'buymesho_validator_sync_meta';
const API_BASE_URL = import.meta.env.VITE_BUYMESHO_API_BASE_URL?.trim() || 'https://buymesho.vercel.app';

type ValidatorIdentity = {
  uid: string;
  email: string | null;
  email_verified?: boolean;
  is_admin?: boolean;
  display_name?: string | null;
};

type ValidatorAccessScope = {
  can_validate_tickets?: boolean;
  is_admin?: boolean;
  role?: 'admin' | 'validator';
  source?: 'buymesho';
  allowed_event_ids?: string[];
  snapshot_version?: string | null;
};

type ValidatorEvent = {
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

type ValidatorTicket = {
  id: string;
  code: string;
  event_id: string;
  event_title: string;
  order_id: string;
  buyer_id: string;
  status: string;
  order_status: string;
  payment_status: string | null;
  updated_at: string;
  version: string;
  metadata: Record<string, unknown>;
};

type ValidatorMeResponse = {
  success?: boolean;
  identity?: ValidatorIdentity;
  creator?: Record<string, unknown> | null;
  access_scope?: ValidatorAccessScope;
  events?: ValidatorEvent[];
};

type ValidatorEventTicketsResponse = {
  success?: boolean;
  event?: ValidatorEvent;
  tickets?: ValidatorTicket[];
  snapshot_version?: string | null;
};

declare global {
  interface Window {
    __buymeshoValidatorRefresh?: (() => Promise<void>) | null;
  }
}

function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Partial<User> & { role?: unknown; assignedEventIds?: unknown };
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || typeof candidate.email !== 'string') {
    return null;
  }
  if (candidate.role !== 'organizer' && candidate.role !== 'gate_staff') return null;

  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    role: candidate.role,
    avatarUrl: typeof candidate.avatarUrl === 'string' ? candidate.avatarUrl : undefined,
    assignedEventIds: Array.isArray(candidate.assignedEventIds)
      ? candidate.assignedEventIds.filter((value): value is string => typeof value === 'string')
      : [],
    assignedGate: typeof candidate.assignedGate === 'string' ? candidate.assignedGate : undefined,
  };
}

function toValidatorUser(identity: ValidatorIdentity, scope: ValidatorAccessScope, events: ValidatorEvent[]): User {
  const email = identity.email ?? '';
  const displayName = identity.display_name ?? email.split('@')[0] ?? 'Verified Staff';
  const role: UserRole = scope.is_admin ? 'organizer' : 'gate_staff';

  return {
    id: identity.uid,
    name: displayName,
    email,
    role,
    assignedEventIds: scope.allowed_event_ids ?? events.map((event) => event.id),
    assignedGate: scope.role ?? 'gate_staff',
  };
}

function buildReturnUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildRedirectUrl(baseUrl: string, mode: 'login' | 'signup') {
  const url = new URL(baseUrl);
  url.searchParams.set('returnTo', buildReturnUrl());
  url.searchParams.set('client', 'ticket-validator');
  url.searchParams.set('mode', mode);
  return url.toString();
}

function getLocationParams() {
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashParams = hash ? new URLSearchParams(hash) : new URLSearchParams();
  return { search, hashParams };
}

function readCallbackToken(): string | null {
  const { search, hashParams } = getLocationParams();
  return (
    search.get('buymesho_session') ??
    search.get('token') ??
    search.get('id_token') ??
    search.get('session') ??
    hashParams.get('buymesho_session') ??
    hashParams.get('token') ??
    hashParams.get('id_token') ??
    hashParams.get('session') ??
    null
  );
}

function readStoredAuthUser(): User | null {
  try {
    const raw = localStorage.getItem(VALIDATOR_USER_KEY);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveVerifiedSession(user: User, sessionToken: string) {
  localStorage.setItem(VALIDATOR_USER_KEY, JSON.stringify(user));
  localStorage.setItem(VALIDATOR_SESSION_KEY, sessionToken);
}

function clearVerifiedSession() {
  localStorage.removeItem(VALIDATOR_USER_KEY);
  localStorage.removeItem(VALIDATOR_SESSION_KEY);
}

function toEventItem(event: ValidatorEvent, creatorUid: string | null): EventItem {
  const state = event.status === 'draft' ? 'Upcoming' : event.status === 'published' ? 'Live' : 'Ended';

  return {
    id: event.id,
    name: event.event_title,
    organizerId: creatorUid ?? event.creator_uid ?? 'buymesho-creator',
    organizerName: event.organizer_name,
    date: `${event.event_date} ${event.start_time}`.trim(),
    venue: event.venue,
    city: event.location,
    bannerImage: typeof event.spec_values.banner_image === 'string'
      ? event.spec_values.banner_image
      : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    state,
    totalTicketsSold: Number(event.ticket_count || 0),
    checkedInCount: 0,
    category: event.event_type,
    gates: Array.isArray(event.spec_values.gates)
      ? event.spec_values.gates.filter((value): value is string => typeof value === 'string')
      : [],
  };
}

function toTicketItem(ticket: ValidatorTicket): Ticket {
  const metadata = ticket.metadata ?? {};
  const ticketPrice = metadata.unit_price as { amount?: number; currency?: string } | undefined;
  const orderTotal = metadata.order_total as { amount?: number; currency?: string } | undefined;
  const ticketTier = typeof metadata.item_title === 'string' ? metadata.item_title : 'Event Ticket';
  const purchaseDate = typeof metadata.paid_at === 'string'
    ? metadata.paid_at
    : typeof metadata.fulfilled_at === 'string'
      ? metadata.fulfilled_at
      : ticket.updated_at;

  return {
    id: ticket.id,
    qrPayload: ticket.code,
    eventId: ticket.event_id,
    attendeeName: typeof metadata.buyer_id === 'string' ? `Buyer ${metadata.buyer_id}` : 'Verified Buyer',
    attendeeEmail: '',
    attendeePhone: '',
    ticketTier,
    seatOrZone: typeof metadata.venue === 'string' ? metadata.venue : undefined,
    price: Number(ticketPrice?.amount ?? orderTotal?.amount ?? 0),
    purchaseDate,
    status: ticket.status as Ticket['status'],
    lastGateName: typeof metadata.venue === 'string' ? metadata.venue : undefined,
    notes: `Order ${ticket.order_id} · ${ticket.order_status}`,
  };
}

function storeRemoteSnapshot(events: ValidatorEvent[], ticketsByEvent: Record<string, ValidatorTicket[]>) {
  const tickets = Object.values(ticketsByEvent).flat();
  localStorage.setItem(VALIDATOR_EVENTS_KEY, JSON.stringify(events.map((event) => toEventItem(event, event.creator_uid))));
  localStorage.setItem(VALIDATOR_TICKETS_KEY, JSON.stringify(tickets.map(toTicketItem)));
  localStorage.setItem(
    VALIDATOR_SYNC_META_KEY,
    JSON.stringify({
      synced_at: new Date().toISOString(),
      event_versions: events.map((event) => ({ id: event.id, version: event.version, updated_at: event.updated_at })),
    }),
  );
}

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload ? String((payload as { error?: unknown }).error ?? 'Request failed') : 'Request failed';
    throw new Error(message);
  }
  return payload as T;
}

async function syncValidatorSnapshot(token: string) {
  const me = await fetchJson<ValidatorMeResponse>('/api/validator/me', token);
  const identity = me.identity;
  const scope = me.access_scope ?? {};
  const events = Array.isArray(me.events) ? me.events : [];

  if (!identity?.uid) {
    throw new Error('BuyMesho returned an incomplete validator identity');
  }

  const ticketsByEvent: Record<string, ValidatorTicket[]> = {};
  await Promise.all(
    events.map(async (event) => {
      const ticketsRes = await fetchJson<ValidatorEventTicketsResponse>(`/api/validator/events/${encodeURIComponent(event.id)}/tickets`, token);
      ticketsByEvent[event.id] = Array.isArray(ticketsRes.tickets) ? ticketsRes.tickets : [];
    }),
  );

  const user = toValidatorUser(identity, scope, events);
  saveVerifiedSession(user, token);
  storeRemoteSnapshot(events, ticketsByEvent);
  window.__buymeshoValidatorRefresh = async () => {
    await syncValidatorSnapshot(token);
  };
  window.dispatchEvent(new Event('buymesho-validator-sync'));
  return user;
}

function RedirectButton({
  children,
  href,
  primary = false,
}: {
  children: React.ReactNode;
  href: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        primary
          ? 'flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800'
          : 'flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50'
      }
    >
      {children}
    </a>
  );
}

export default function BuyMeshoGate() {
  const [authUser, setAuthUser] = useState<User | null>(() => readStoredAuthUser());
  const [loading, setLoading] = useState<boolean>(() => Boolean(readCallbackToken()) && !readStoredAuthUser());
  const [error, setError] = useState<string | null>(null);

  const loginUrl = useMemo(() => buildRedirectUrl(import.meta.env.VITE_BUYMESHO_LOGIN_URL?.trim() || 'https://buymesho.vercel.app/login', 'login'), []);
  const signupUrl = useMemo(() => buildRedirectUrl(import.meta.env.VITE_BUYMESHO_SIGNUP_URL?.trim() || 'https://buymesho.vercel.app/signup', 'signup'), []);

  useEffect(() => {
    const token = readCallbackToken();
    const storedUser = readStoredAuthUser();

    if (storedUser) {
      setAuthUser(storedUser);
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const user = await syncValidatorSnapshot(token);
        if (cancelled) return;
        setAuthUser(user);
        setError(null);
        setLoading(false);
        window.history.replaceState({}, '', buildReturnUrl());
      } catch (err) {
        if (cancelled) return;
        clearVerifiedSession();
        setAuthUser(null);
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onAuthChange = () => setAuthUser(readStoredAuthUser());
    window.addEventListener('buymesho-validator-sync', onAuthChange);
    return () => window.removeEventListener('buymesho-validator-sync', onAuthChange);
  }, []);

  const handleStart = () => {
    setError(null);
    window.location.href = loginUrl;
  };

  const handleSignup = () => {
    setError(null);
    window.location.href = signupUrl;
  };

  if (authUser) {
    return <App />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
              <ScanLine className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">BuyMesho identity required</div>
              <h1 className="text-2xl font-semibold tracking-tight">Syncing remote snapshot</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Fetching your creator events and ticket snapshots from BuyMesho.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
              <ScanLine className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">BuyMesho identity required</div>
              <h1 className="text-2xl font-semibold tracking-tight">Ticket Validator</h1>
            </div>
          </div>

          <p className="text-sm leading-6 text-white/70">
            Only BuyMesho creators and approved gate staff can continue.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white/90"
            >
              <LogIn className="h-4 w-4" />
              Continue with BuyMesho
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSignup}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <UserPlus className="h-4 w-4" />
              BuyMesho creator sign-up
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm text-white/65">
          <div className="mb-3 flex items-center gap-2 text-white">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Phase 2 sync</span>
          </div>
          <ul className="space-y-2 leading-6">
            <li>• BuyMesho now provides the creator events and ticket snapshots.</li>
            <li>• Ticket Validator only caches the synced read model.</li>
            <li>• Scan/write actions stay out until the next phase.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
