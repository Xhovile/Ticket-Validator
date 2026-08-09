import type { ActivityLogEntry, EventItem, Ticket, TicketStatus } from "../types";

const API_BASE_URL = import.meta.env.VITE_BUYMESHO_VALIDATOR_API_BASE_URL ?? "https://buymesho.vercel.app";
export const TOKEN_KEY = "buymesho_validator_session";

async function requestJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? data?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

async function requestRaw(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

export function getStoredToken() {
  const query = new URLSearchParams(window.location.search);
  return query.get("token") ?? query.get("access_token") ?? localStorage.getItem(TOKEN_KEY) ?? "";
}

export function saveToken(token: string) {
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchValidatorMe(token: string) {
  return requestJson<any>("/api/validator/me", token);
}

export async function fetchValidatorTickets(token: string, eventId: string) {
  return requestJson<{ success: true; event: any; tickets: Ticket[]; audit_logs: ActivityLogEntry[]; snapshot_version: string | null }>(`/api/validator/events/${encodeURIComponent(eventId)}/tickets`, token);
}

export async function scanTicket(token: string, payload: { code: string; eventId: string; gateName: string; staffName: string; allowReentry?: boolean }) {
  return requestRaw("/api/validator/scan", token, { method: "POST", body: JSON.stringify(payload) });
}

export async function updateTicketStatus(token: string, payload: { ticketId: string; eventId: string; status: TicketStatus; gateName: string; staffName: string }) {
  return requestJson<{ success: true; ticket: Ticket; event: any | null; audit_entry?: ActivityLogEntry | null }>(`/api/validator/tickets/${encodeURIComponent(payload.ticketId)}/status`, token, { method: "POST", body: JSON.stringify(payload) });
}
