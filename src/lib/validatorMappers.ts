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
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function getEventState(eventDate: string, startTime: string, status: string): EventItem['state'] {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus.includes('ended') ||
    normalizedStatus.includes('completed') ||
    normalizedStatus.includes('cancelled') ||
    normalizedStatus.includes('canceled')
  ) {
    return 'Ended';
  }

  const eventDateTime = new Date(`${eventDate}T${startTime}`);

  if (Number.isNaN(eventDateTime.getTime())) {
    return 'Upcoming';
  }

  return eventDateTime.getTime() <= Date.now() ? 'Live' : 'Upcoming';
}

export type ValidatorEventRecord = {
  id: string;
  title: string;
  organizerName: string;
  eventDate: string;
  startTime: string;
  venue: string;
  location: string;
  ticketLink: string | null;
  status: string;
  ticket_count?: number;
};

export type ValidatorTicketRecord = {
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
  status:
    | 'Waiting Entry'
    | 'Inside'
    | 'Outside'
    | 'Cancelled'
    | 'Refunded'
    | 'Blocked'
    | 'Duplicate Scan Attempt';
  purchaseDate: string;
  updatedAt: string;
};

export function mapValidatorEvent(event: ValidatorEventRecord): EventItem {
  const bannerImage = getValidatorEventImageUrl({});

  return {
    id: event.id,
    name: event.title,
    organizerId: '',
    organizerName: event.organizerName,
    date: event.eventDate,
    venue: event.venue,
    city: event.location,
    bannerImage,
    state: getEventState(event.eventDate, event.startTime, event.status),
    totalTicketsSold: event.ticket_count || 0,
    checkedInCount: 0,
    category: 'Event',
    gates: ['Main Gate'],
  };
}

export function mapValidatorTicket(ticket: ValidatorTicketRecord, eventId: string): Ticket {
  return {
    id: ticket.ticketId,
    qrPayload: ticket.code,
    eventId,
    ticketTitle: getString(ticket.ticketTitle),
    attendeeName: getString(ticket.attendeeName, 'Ticket Holder'),
    attendeeEmail: getString(ticket.attendeeEmail),
    attendeePhone: getString(ticket.attendeePhone, 'N/A'),
    ticketTier: getString(ticket.ticketType, 'General Admission'),
    seatOrZone: getString(ticket.seatOrZone),
    eventDate: getString(ticket.eventDate),
    startTime: getString(ticket.startTime),
    venue: getString(ticket.venue),
    location: getString(ticket.location),
    price: 0,
    purchaseDate: getString(ticket.purchaseDate, ticket.updatedAt),
    status: ticket.status as TicketStatus,
    notes: '',
  };
}
