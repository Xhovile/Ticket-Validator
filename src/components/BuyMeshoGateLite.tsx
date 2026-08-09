import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, LogIn, ScanLine, ShieldCheck, UserPlus } from "lucide-react";
import ValidatorWorkspace from "../ValidatorWorkspace";
import { fetchValidatorMe, fetchValidatorTickets, getStoredToken, saveToken, clearToken, TOKEN_KEY } from "../lib/buymeshoApi";
import type { Ticket } from "../types";

const VALIDATOR_USER_KEY = "buymesho_validator_user";
const VALIDATOR_SESSION_KEY = "buymesho_validator_session";
const VALIDATOR_EVENTS_KEY = "buymesho_validator_events";
const VALIDATOR_TICKETS_KEY = "buymesho_validator_tickets";

function buildReturnUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildRedirectUrl(baseUrl: string, mode: "login" | "signup") {
  const url = new URL(baseUrl);
  url.searchParams.set("returnTo", buildReturnUrl());
  url.searchParams.set("client", "ticket-validator");
  url.searchParams.set("mode", mode);
  return url.toString();
}

function toEventItem(event: any) {
  return {
    id: String(event.id),
    name: String(event.event_title ?? "Event"),
    organizerId: String(event.creator_uid ?? ""),
    organizerName: String(event.organizer_name ?? "BuyMesho Creator"),
    date: String(event.event_date ?? ""),
    venue: String(event.venue ?? ""),
    city: String(event.location ?? ""),
    bannerImage: typeof event.spec_values?.banner_image === "string" ? event.spec_values.banner_image : "https://images.unsplash.com/photo-1470229722913-7c0e2dbb0d7f?w=1200&auto=format&fit=crop&q=80",
    state: event.status === "draft" ? "Upcoming" : event.status === "published" ? "Live" : "Ended",
    totalTicketsSold: Number(event.ticket_count ?? 0),
    checkedInCount: Number(event.checked_in_count ?? 0),
    category: String(event.event_type ?? "Event"),
    gates: Array.isArray(event.spec_values?.gates) ? event.spec_values.gates.filter((g: unknown): g is string => typeof g === "string") : ["Main Gate"],
  };
}

function toTicketItem(ticket: any): Ticket {
  return {
    id: String(ticket.id),
    qrPayload: String(ticket.qrPayload ?? ticket.code ?? ticket.codeNormalized ?? ""),
    eventId: String(ticket.eventId ?? ticket.event_id ?? ""),
    attendeeName: String(ticket.attendeeName ?? "Verified Buyer"),
    attendeeEmail: String(ticket.attendeeEmail ?? ""),
    attendeePhone: String(ticket.attendeePhone ?? ""),
    ticketTier: String(ticket.ticketTier ?? ticket.ticket_tier ?? "Ticket"),
    seatOrZone: ticket.seatOrZone ?? undefined,
    price: Number(ticket.price ?? 0),
    purchaseDate: String(ticket.purchaseDate ?? ""),
    status: String(ticket.status ?? "Waiting Entry") as Ticket["status"],
    lastCheckedInTime: ticket.lastCheckedInTime ?? undefined,
    lastCheckedOutTime: ticket.lastCheckedOutTime ?? undefined,
    lastGateName: ticket.lastGateName ?? undefined,
    lastStaffName: ticket.lastStaffName ?? undefined,
    notes: ticket.notes ?? undefined,
  };
}

export default function BuyMeshoGateLite() {
  const [authToken, setAuthToken] = useState(() => getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(getStoredToken()));
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(Boolean(localStorage.getItem(VALIDATOR_USER_KEY)));

  const loginUrl = useMemo(() => buildRedirectUrl(import.meta.env.VITE_BUYMESHO_LOGIN_URL?.trim() || "https://buymesho.vercel.app/login", "login"), []);
  const signupUrl = useMemo(() => buildRedirectUrl(import.meta.env.VITE_BUYMESHO_SIGNUP_URL?.trim() || "https://buymesho.vercel.app/signup", "signup"), []);

  useEffect(() => {
    const tokenFromUrl = getStoredToken();
    if (tokenFromUrl && tokenFromUrl !== authToken) {
      saveToken(tokenFromUrl);
      setAuthToken(tokenFromUrl);
    }
  }, []);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    void (async () => {
      try {
        setIsLoading(true);
        const me = await fetchValidatorMe(authToken);
        const events = Array.isArray(me.events) ? me.events : [];
        const ticketsByEvent: Record<string, Ticket[]> = {};

        await Promise.all(
          events.map(async (event: any) => {
            const bundle = await fetchValidatorTickets(authToken, String(event.id));
            ticketsByEvent[String(event.id)] = (bundle.tickets ?? []).map(toTicketItem);
          }),
        );

        const user = {
          id: me.identity.uid,
          name: me.identity.display_name ?? me.identity.email ?? "Verified Staff",
          email: me.identity.email ?? "",
          role: me.access_scope?.role === "admin" ? "organizer" : "gate_staff",
          assignedEventIds: me.access_scope?.allowed_event_ids ?? events.map((event: any) => String(event.id)),
          assignedGate: "Main Gate",
        };

        localStorage.setItem(VALIDATOR_USER_KEY, JSON.stringify(user));
        localStorage.setItem(VALIDATOR_SESSION_KEY, authToken);
        localStorage.setItem(VALIDATOR_EVENTS_KEY, JSON.stringify(events.map(toEventItem)));
        localStorage.setItem(VALIDATOR_TICKETS_KEY, JSON.stringify(Object.values(ticketsByEvent).flat()));
        localStorage.setItem(TOKEN_KEY, authToken);

        if (!cancelled) {
          setReady(true);
          setError(null);
          window.dispatchEvent(new Event("buymesho-validator-sync"));
        }
      } catch (err) {
        if (!cancelled) {
          clearToken();
          setError(err instanceof Error ? err.message : "Authentication failed");
          setReady(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  if (ready) {
    return <ValidatorWorkspace />;
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

          {isLoading && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              Syncing your BuyMesho snapshot...
            </div>
          )}

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => { setError(null); window.location.href = loginUrl; }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white/90"
            >
              <LogIn className="h-4 w-4" />
              Continue with BuyMesho
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => { setError(null); window.location.href = signupUrl; }}
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
            <span className="font-medium">Connected validator</span>
          </div>
          <ul className="space-y-2 leading-6">
            <li>• BuyMesho now supplies the creator events and ticket snapshots.</li>
            <li>• Ticket Validator only accepts verified BuyMesho sessions.</li>
            <li>• Scans and status changes are written back to BuyMesho.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
