import type { User, EventItem, Ticket, ActivityLogEntry, CheckInSession } from '../types';

export const INITIAL_USERS: User[] = [];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-neon-2026',
    name: 'Neon Horizon Music Festival 2026',
    organizerId: 'user-alex',
    organizerName: 'BuyMesho Live',
    date: 'Today, 6:00 PM - 2:00 AM',
    venue: 'Skyline Amphitheater',
    city: 'San Francisco, CA',
    bannerImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    state: 'Live',
    totalTicketsSold: 1200,
    checkedInCount: 845,
    category: 'Music Festival',
    gates: ['Gate A - Main Entrance', 'Gate B - VIP FastTrack'],
  },
  {
    id: 'evt-tech-2026',
    name: 'TechPulse Developer Summit 2026',
    organizerId: 'user-alex',
    organizerName: 'TechPulse Media',
    date: 'Tomorrow, 9:00 AM',
    venue: 'Moscone Center West',
    city: 'San Francisco, CA',
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    state: 'Upcoming',
    totalTicketsSold: 500,
    checkedInCount: 0,
    category: 'Conference',
    gates: ['Hall 1 - Registration', 'Hall 2 - VIP Keynote'],
  },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'BMS-8491-01',
    qrPayload: 'TKT-8491-01-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Elena Rostova',
    attendeeEmail: 'elena.r@example.com',
    attendeePhone: '+1 (555) 234-5678',
    ticketTier: 'VIP FastTrack Pass',
    seatOrZone: 'Zone A - Front Row 04',
    price: 185,
    purchaseDate: '2026-07-20',
    status: 'Waiting Entry',
  },
  {
    id: 'BMS-8491-02',
    qrPayload: 'TKT-8491-02-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'David Chen',
    attendeeEmail: 'dchen@example.com',
    attendeePhone: '+1 (555) 345-6789',
    ticketTier: 'General Admission',
    seatOrZone: 'Zone B - Lawn Area',
    price: 75,
    purchaseDate: '2026-07-22',
    status: 'Inside',
    lastCheckedInTime: '6:15 PM Today',
    lastGateName: 'Gate A - Main Entrance',
    lastStaffName: 'BuyMesho Gate Staff',
  },
  {
    id: 'BMS-8491-03',
    qrPayload: 'TKT-8491-03-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Samantha Wright',
    attendeeEmail: 'swright@example.com',
    attendeePhone: '+1 (555) 456-7890',
    ticketTier: 'VIP FastTrack Pass',
    seatOrZone: 'Zone A - Lounge 02',
    price: 185,
    purchaseDate: '2026-07-15',
    status: 'Outside',
    lastCheckedInTime: '6:30 PM Today',
    lastCheckedOutTime: '7:10 PM Today',
    lastGateName: 'Gate B - VIP FastTrack',
    lastStaffName: 'BuyMesho Gate Staff',
    notes: 'Temporarily exited venue for parking item retrieval',
  },
  {
    id: 'BMS-8491-04',
    qrPayload: 'TKT-8491-04-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Marcus Brody',
    attendeeEmail: 'm.brody@example.com',
    attendeePhone: '+1 (555) 567-8901',
    ticketTier: 'General Admission',
    seatOrZone: 'Zone B - General',
    price: 75,
    purchaseDate: '2026-07-25',
    status: 'Cancelled',
    notes: 'Order cancelled by buyer prior to event',
  },
  {
    id: 'BMS-8491-05',
    qrPayload: 'TKT-8491-05-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Chloe Bennett',
    attendeeEmail: 'chloe.b@example.com',
    attendeePhone: '+1 (555) 678-9012',
    ticketTier: 'Early Bird Tier 1',
    seatOrZone: 'Zone B - General',
    price: 60,
    purchaseDate: '2026-06-10',
    status: 'Refunded',
    notes: 'Refund processed via BuyMesho portal',
  },
];

export const INITIAL_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-101',
    timestamp: '7:02:14 PM',
    eventId: 'evt-neon-2026',
    ticketId: 'BMS-8491-02',
    attendeeName: 'David Chen',
    action: 'Checked In (Inside)',
    gateName: 'Gate A - Main Entrance',
    staffName: 'BuyMesho Gate Staff',
    statusBadge: 'success',
    details: 'General Admission - Gate A',
  },
  {
    id: 'log-100',
    timestamp: '6:30:45 PM',
    eventId: 'evt-neon-2026',
    ticketId: 'BMS-8491-03',
    attendeeName: 'Samantha Wright',
    action: 'Checked In (Inside)',
    gateName: 'Gate B - VIP FastTrack',
    staffName: 'BuyMesho Gate Staff',
    statusBadge: 'success',
    details: 'Initial check-in completed',
  },
];

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
  return INITIAL_EVENTS;
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
  return INITIAL_TICKETS;
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
  return INITIAL_LOGS;
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
