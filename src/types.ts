export type UserRole = 'organizer' | 'gate_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  assignedEventIds: string[];
  assignedGate?: string;
}

export type EventState = 'Upcoming' | 'Live' | 'Ended';

export interface EventItem {
  id: string;
  name: string;
  organizerId: string;
  organizerName: string;
  date: string;
  startTime?: string;
  venue: string;
  city: string;
  bannerImage: string;
  state: EventState;
  totalTicketsSold: number;
  checkedInCount: number;
  category: string;
  gates: string[];
  description?: string;
  ticketMode?: string;
  ticketPrice?: number | null;
  ticketLink?: string | null;
  contactWhatsapp?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TicketStatus = 
  | 'Waiting Entry'
  | 'Inside'
  | 'Outside'
  | 'Cancelled'
  | 'Refunded'
  | 'Blocked'
  | 'Duplicate Scan Attempt';

export interface Ticket {
  id: string;
  qrPayload: string;
  eventId: string;
  ticketTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  ticketTier: string;
  seatOrZone?: string;
  eventDate?: string;
  startTime?: string;
  venue?: string;
  location?: string;
  price: number;
  purchaseDate: string;
  status: TicketStatus;
  lastCheckedInTime?: string;
  lastCheckedOutTime?: string;
  lastGateName?: string;
  lastStaffName?: string;
  notes?: string;
}

export interface CheckInSession {
  id: string;
  eventId: string;
  eventName: string;
  gateName: string;
  staffName: string;
  startTime: string;
  active: boolean;
  scanCount: number;
}

export type ActivityAction = 
  | 'Checked In (Inside)'
  | 'Checked Out (Outside)'
  | 'Status Changed: Cancelled'
  | 'Status Changed: Refunded'
  | 'Status Changed: Blocked'
  | 'Status Changed: Waiting Entry'
  | 'Duplicate Scan Warning'
  | 'Unauthorized Ticket Scan'
  | 'Check-in Session Started';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  eventId: string;
  ticketId?: string;
  attendeeName?: string;
  action: ActivityAction;
  gateName: string;
  staffName: string;
  statusBadge: 'success' | 'warning' | 'danger' | 'info';
  details?: string;
}
