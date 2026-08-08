import type { User, EventItem, Ticket, ActivityLogEntry, CheckInSession } from '../types';

export const INITIAL_USERS: User[] = [];
export const INITIAL_EVENTS: EventItem[] = [];
export const INITIAL_TICKETS: Ticket[] = [];
export const INITIAL_LOGS: ActivityLogEntry[] = [];

const STORAGE_KEYS = {
  USER: 'buymesho_validator_user',
  EVENTS: 'buymesho_validator_events',
  TICKETS: 'buymesho_validator_tickets',
  LOGS: 'buymesho_validator_logs',
  SESSION: 'buymesho_validator_session',
};

export function loadStoredUser(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (data) return JSON.parse(data) as User;
  } catch {}
  return null;
}

export function saveStoredUser(user: User) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {}
}

export function loadStoredEvents(): EventItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (data) return JSON.parse(data) as EventItem[];
  } catch {}
  return [];
}

export function saveStoredEvents(events: EventItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch {}
}

export function loadStoredTickets(): Ticket[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (data) return JSON.parse(data) as Ticket[];
  } catch {}
  return [];
}

export function saveStoredTickets(tickets: Ticket[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  } catch {}
}

export function loadStoredLogs(): ActivityLogEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (data) return JSON.parse(data) as ActivityLogEntry[];
  } catch {}
  return [];
}

export function saveStoredLogs(logs: ActivityLogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch {}
}

export function loadStoredSession(): CheckInSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (data) return JSON.parse(data) as CheckInSession;
  } catch {}
  return null;
}

export function saveStoredSession(session: CheckInSession | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch {}
}

export function resetAllDataToDefault() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch {}
}
