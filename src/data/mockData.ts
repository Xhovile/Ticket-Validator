import { User, EventItem, Ticket, ActivityLogEntry, CheckInSession } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-sarah',
    name: 'Sarah Jenkins',
    email: 'sarah@buymeshow.com',
    role: 'gate_staff',
    assignedEventIds: ['evt-neon-2026', 'evt-tech-2026'],
    assignedGate: 'Gate A - Main Entrance',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-alex',
    name: 'Alex Vance',
    email: 'alex@buymeshow.com',
    role: 'organizer',
    assignedEventIds: ['evt-neon-2026', 'evt-tech-2026', 'evt-indie-2026'],
    assignedGate: 'Organizer Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-marcus',
    name: 'Marcus Reed (Unauthorized)',
    email: 'marcus@gate.com',
    role: 'gate_staff',
    assignedEventIds: [], // Explicitly no permission
    assignedGate: 'Unassigned Gate',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-neon-2026',
    name: 'Neon Horizon Music Festival 2026',
    organizerId: 'user-alex',
    organizerName: 'BuyMeShow Live & Alex Vance',
    date: 'Today, 6:00 PM - 2:00 AM',
    venue: 'Skyline Amphitheater',
    city: 'San Francisco, CA',
    bannerImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    state: 'Live',
    totalTicketsSold: 1200,
    checkedInCount: 845,
    category: 'Music Festival',
    gates: ['Gate A - Main Entrance', 'Gate B - VIP FastTrack', 'North Gate - General', 'South Gate - Staff & Press'],
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
  {
    id: 'evt-indie-2026',
    name: 'Indie Film Showcase Gala',
    organizerId: 'user-alex',
    organizerName: 'Independent Cinema Guild',
    date: 'Yesterday, 7:00 PM',
    venue: 'Roxie Theater',
    city: 'San Francisco, CA',
    bannerImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    state: 'Ended',
    totalTicketsSold: 300,
    checkedInCount: 285,
    category: 'Film & Media',
    gates: ['Cinema Entrance 1'],
  },
  {
    id: 'evt-unauth-2026',
    name: 'Restricted Underground Rave (No Staff Access)',
    organizerId: 'user-external',
    organizerName: 'Secret Beats Syndicate',
    date: 'Tonight, 11:00 PM',
    venue: 'Warehouse 42',
    city: 'Oakland, CA',
    bannerImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    state: 'Live',
    totalTicketsSold: 450,
    checkedInCount: 120,
    category: 'Private Party',
    gates: ['Back Door - Restricted'],
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
    lastStaffName: 'Sarah Jenkins',
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
    lastStaffName: 'Sarah Jenkins',
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
    notes: 'Refund processed via BuyMeShow portal',
  },
  {
    id: 'BMS-8491-06',
    qrPayload: 'TKT-8491-06-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Vikram Patel',
    attendeeEmail: 'v.patel@example.com',
    attendeePhone: '+1 (555) 789-0123',
    ticketTier: 'Backstage Artist Pass',
    seatOrZone: 'All-Access Backstage',
    price: 350,
    purchaseDate: '2026-07-01',
    status: 'Blocked',
    notes: 'Security block requested by event organizer - invalid credentials',
  },
  {
    id: 'BMS-8491-07',
    qrPayload: 'TKT-8491-07-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Jessica Morales',
    attendeeEmail: 'jmorales@example.com',
    attendeePhone: '+1 (555) 890-1234',
    ticketTier: 'General Admission',
    seatOrZone: 'Zone B - General',
    price: 75,
    purchaseDate: '2026-07-28',
    status: 'Waiting Entry',
  },
  {
    id: 'BMS-8491-08',
    qrPayload: 'TKT-8491-08-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Jordan Miller',
    attendeeEmail: 'jmiller@example.com',
    attendeePhone: '+1 (555) 901-2345',
    ticketTier: 'VIP FastTrack Pass',
    seatOrZone: 'Zone A - Balcony 12',
    price: 185,
    purchaseDate: '2026-07-29',
    status: 'Inside',
    lastCheckedInTime: '7:02 PM Today',
    lastGateName: 'Gate A - Main Entrance',
    lastStaffName: 'Sarah Jenkins',
  },
  {
    id: 'BMS-8491-09',
    qrPayload: 'TKT-8491-09-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Hannah Abbott',
    attendeeEmail: 'habbott@example.com',
    attendeePhone: '+1 (555) 012-3456',
    ticketTier: 'General Admission',
    seatOrZone: 'Zone B - Lawn',
    price: 75,
    purchaseDate: '2026-07-30',
    status: 'Waiting Entry',
  },
  {
    id: 'BMS-8491-10',
    qrPayload: 'TKT-8491-10-NEON',
    eventId: 'evt-neon-2026',
    attendeeName: 'Liam O\'Connor',
    attendeeEmail: 'liamo@example.com',
    attendeePhone: '+1 (555) 123-4567',
    ticketTier: 'General Admission',
    seatOrZone: 'Zone B - Lawn',
    price: 75,
    purchaseDate: '2026-07-31',
    status: 'Waiting Entry',
  },
];

export const INITIAL_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-101',
    timestamp: '7:02:14 PM',
    eventId: 'evt-neon-2026',
    ticketId: 'BMS-8491-08',
    attendeeName: 'Jordan Miller',
    action: 'Checked In (Inside)',
    gateName: 'Gate A - Main Entrance',
    staffName: 'Sarah Jenkins',
    statusBadge: 'success',
    details: 'VIP FastTrack - Scanned OK',
  },
  {
    id: 'log-100',
    timestamp: '6:30:45 PM',
    eventId: 'evt-neon-2026',
    ticketId: 'BMS-8491-03',
    attendeeName: 'Samantha Wright',
    action: 'Checked In (Inside)',
    gateName: 'Gate B - VIP FastTrack',
    staffName: 'Sarah Jenkins',
    statusBadge: 'success',
    details: 'Initial check-in completed',
  },
  {
    id: 'log-099',
    timestamp: '6:15:22 PM',
    eventId: 'evt-neon-2026',
    ticketId: 'BMS-8491-02',
    attendeeName: 'David Chen',
    action: 'Checked In (Inside)',
    gateName: 'Gate A - Main Entrance',
    staffName: 'Sarah Jenkins',
    statusBadge: 'success',
    details: 'General Admission - Gate A',
  },
  {
    id: 'log-098',
    timestamp: '6:00:00 PM',
    eventId: 'evt-neon-2026',
    action: 'Check-in Session Started',
    gateName: 'Gate A - Main Entrance',
    staffName: 'Sarah Jenkins',
    statusBadge: 'info',
    details: 'Gate session opened by Sarah Jenkins',
  },
];

// Helper functions for storage management
const STORAGE_KEYS = {
  USER: 'buymeshow_validator_user',
  EVENTS: 'buymeshow_validator_events',
  TICKETS: 'buymeshow_validator_tickets',
  LOGS: 'buymeshow_validator_logs',
  SESSION: 'buymeshow_validator_session',
};

export function loadStoredUser(): User {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (data) return JSON.parse(data);
  } catch {
    // Fallback
  }
  return INITIAL_USERS[0]; // Default Sarah Jenkins
}

export function saveStoredUser(user: User) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {}
}

export function loadStoredEvents(): EventItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (data) return JSON.parse(data);
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
    if (data) return JSON.parse(data);
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
    if (data) return JSON.parse(data);
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
    if (data) return JSON.parse(data);
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
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.EVENTS);
  localStorage.removeItem(STORAGE_KEYS.TICKETS);
  localStorage.removeItem(STORAGE_KEYS.LOGS);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}
