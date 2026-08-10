import type { EventItem, Ticket, TicketStatus } from '../types';
import { getValidatorEventImageUrl } from './validatorImage';

function getMetadataValue(
  metadata: Record<string, unknown>,
  keys: string[],
  fallback = '',
) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return fallback;
}

function getMetadataNumber(
  metadata: Record<string, unknown>,
  keys: string[],
  fallback = 0,
) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function getEventState(
  eventDate: string,
  startTime: string,
  status: string,
): EventItem['state'] {
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

export type ValidatorTicketRecord = {
  id: string;
  code: string;
  event_id: string;
  event_title: string;
  order_id: string;
  buyer_id: string;
  status:
    | 'Waiting Entry'
    | 'Inside'
    | 'Outside'
    | 'Cancelled'
    | 'Refunded'
    | 'Blocked'
    | 'Duplicate Scan Attempt';
  order_status: string;
  payment_status: string | null;
  updated_at: string;
  version: string;
  metadata: Record<string, unknown>;
};

export function mapValidatorEvent(event: ValidatorEventRecord): EventItem {
  const posterMeta = event.spec_values || {};
  const bannerImage = getValidatorEventImageUrl(posterMeta);

  return {
    id: event.id,
    name: event.event_title,
    organizerId: event.creator_uid || '',
    organizerName: event.organizer_name,
    date: event.event_date,
    venue: event.venue,
    city: event.location,
    bannerImage,
    state: getEventState(
      event.event_date,
      event.start_time,
      event.status,
    ),
    totalTicketsSold: event.ticket_count || 0,
    checkedInCount: 0,
    category: event.event_type || 'Event',
    gates: ['Main Gate'],
  };
}

export function mapValidatorTicket(ticket: ValidatorTicketRecord): Ticket {
  const metadata = ticket.metadata || {};

  return {
    id: ticket.id,
    qrPayload: ticket.code,
    eventId: ticket.event_id,
    attendeeName: getMetadataValue(
      metadata,
      ['attendeeName', 'attendee_name', 'buyerName', 'buyer_name', 'name', 'fullName'],
      'Ticket Holder',
    ),
    attendeeEmail: getMetadataValue(
      metadata,
      ['attendeeEmail', 'attendee_email', 'buyerEmail', 'buyer_email', 'email'],
      '',
    ),
    attendeePhone: getMetadataValue(
      metadata,
      ['attendeePhone', 'attendee_phone', 'buyerPhone', 'buyer_phone', 'phone'],
      'N/A',
    ),
    ticketTier: getMetadataValue(
      metadata,
      ['ticketTier', 'ticket_tier', 'tier', 'ticketType', 'ticket_type', 'item_title'],
      'General Admission',
    ),
    seatOrZone: getMetadataValue(
      metadata,
      ['seatOrZone', 'seat_or_zone', 'seat', 'zone'],
      '',
    ),
    price: getMetadataNumber(
      metadata,
      ['price', 'ticketPrice', 'ticket_price', 'amount', 'unit_price'],
      0,
    ),
    purchaseDate: getMetadataValue(
      metadata,
      ['purchaseDate', 'purchase_date', 'createdAt', 'created_at', 'paid_at'],
      ticket.updated_at,
    ),
    status: ticket.status as TicketStatus,
    notes: getMetadataValue(
      metadata,
      ['notes', 'note'],
      '',
    ),
  };
}
