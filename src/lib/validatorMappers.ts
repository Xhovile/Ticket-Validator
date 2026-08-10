import type { EventItem, Ticket, TicketStatus } from '../types';
import { getValidatorEventImageUrl } from './validatorImage';

function getString(...values: Array<unknown>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function getNumber(...values: Array<unknown>): number {
  for (const value of values) {
    const number = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function getEventState(eventDate: string, startTime: string, status: string): EventItem['state'] {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes('ended') || normalizedStatus.includes('completed') || normalizedStatus.includes('cancelled') || normalizedStatus.includes('canceled')) return 'Ended';
  const eventDateTime = new Date(`${eventDate}T${startTime}`);
  if (Number.isNaN(eventDateTime.getTime())) return 'Upcoming';
  return eventDateTime.getTime() <= Date.now() ? 'Live' : 'Upcoming';
}

export type ValidatorEventRecord = {
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
  venue?: string;
  location?: string;
  ticketLink?: string | null;
  ticket_link?: string | null;
  status?: string;
  ticket_count?: number | string;
  event_type?: string;
  description?: string;
  ticket_mode?: string;
  ticket_price?: number | string | null;
  contact_whatsapp?: string | null;
  poster_alt?: string | null;
  spec_values?: Record<string, unknown>;
  creator_uid?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ValidatorTicketRecord = { ticketId: string; code: string; ticketTitle: string; ticketType: string; attendeeName: string; attendeeEmail: string; attendeePhone: string; eventDate: string; startTime: string; venue: string; location: string; seatOrZone: string; status: 'Waiting Entry' | 'Inside' | 'Outside' | 'Cancelled' | 'Refunded' | 'Blocked' | 'Duplicate Scan Attempt'; purchaseDate: string; updatedAt: string; };

export function mapValidatorEvent(event: ValidatorEventRecord, organizerId = ''): EventItem {
  const spec = event.spec_values ?? {};
  const name = getString(event.title, event.name, event.event_title, 'Untitled Event');
  const eventDate = getString(event.eventDate, event.event_date);
  const startTime = getString(event.startTime, event.start_time);
  const organizerName = getString(event.organizerName, event.organizer_name);
  const ticketLink = event.ticketLink ?? event.ticket_link ?? null;
  const posterSource = { poster_image_url: spec.poster_image_url ?? spec.posterImageUrl ?? event.poster_alt ?? null, poster_url: spec.poster_url ?? null, poster: spec.poster ?? null };

  return {
    id: event.id,
    name,
    organizerId: getString(event.creator_uid, organizerId),
    organizerName,
    date: eventDate,
    startTime,
    venue: getString(event.venue),
    city: getString(event.location),
    bannerImage: getValidatorEventImageUrl(posterSource),
    state: getEventState(eventDate, startTime, getString(event.status)),
    totalTicketsSold: getNumber(event.ticket_count),
    checkedInCount: 0,
    category: getString(event.event_type, 'Event'),
    gates: ['Main Gate'],
    description: getString(event.description),
    ticketMode: getString(event.ticket_mode),
    ticketPrice: event.ticket_price == null ? null : getNumber(event.ticket_price),
    ticketLink,
    contactWhatsapp: event.contact_whatsapp ?? null,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  };
}

export function mapValidatorTicket(ticket: ValidatorTicketRecord, eventId: string): Ticket { return {
  id: ticket.ticketId, qrPayload: ticket.code, eventId, ticketTitle: getString(ticket.ticketTitle), attendeeName: getString(ticket.attendeeName, 'Ticket Holder'),
  attendeeEmail: getString(ticket.attendeeEmail), attendeePhone: getString(ticket.attendeePhone, 'N/A'), ticketTier: getString(ticket.ticketType, 'General Admission'),
  seatOrZone: getString(ticket.seatOrZone), eventDate: getString(ticket.eventDate), startTime: getString(ticket.startTime), venue: getString(ticket.venue), location: getString(ticket.location),
  price: 0, purchaseDate: getString(ticket.purchaseDate, ticket.updatedAt), status: ticket.status as TicketStatus, notes: '',
}; }
