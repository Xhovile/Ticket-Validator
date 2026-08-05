import React, { useState } from 'react';
import { Search, Filter, Phone, Mail, Ticket as TicketIcon, CheckCircle2, AlertTriangle, XCircle, MoreVertical, ChevronRight } from 'lucide-react';
import { Ticket, TicketStatus, EventItem } from '../types';

interface AttendeesViewProps {
  event: EventItem;
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateStatusDirect: (ticketId: string, status: TicketStatus) => void;
}

export const AttendeesView: React.FC<AttendeesViewProps> = ({
  event,
  tickets,
  onSelectTicket,
  onUpdateStatusDirect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter tickets for current event
  const eventTickets = tickets.filter((t) => t.eventId === event.id);

  // Search by Ticket ID, Name, Phone
  const filteredTickets = eventTickets.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      t.attendeeName.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query) ||
      t.attendeePhone.toLowerCase().includes(query) ||
      t.attendeeEmail.toLowerCase().includes(query) ||
      t.ticketTier.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = selectedCategory === 'All' || t.ticketTier === selectedCategory;

    return matchesQuery && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Inside':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#8db600]/10 border border-[#8db600]/40 text-[#8db600] text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#8db600]" />
            <span>Inside</span>
          </span>
        );
      case 'Outside':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Outside</span>
          </span>
        );
      case 'Waiting Entry':
        return (
          <span className="px-2 py-0.5 rounded-full bg-[#202228] border border-[#26282e] text-gray-300 text-[10px] font-medium">
            Waiting Entry
          </span>
        );
      case 'Cancelled':
      case 'Refunded':
      case 'Blocked':
        return (
          <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-300 text-[10px] font-semibold flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-[#202228] text-gray-400 text-[10px]">
            {status}
          </span>
        );
    }
  };

  const statusOptions: (TicketStatus | 'All')[] = [
    'All',
    'Waiting Entry',
    'Inside',
    'Outside',
    'Cancelled',
    'Refunded',
    'Blocked',
  ];

  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Attendee Roster</h2>
          <p className="text-xs text-gray-400">{event.name} • {eventTickets.length} Total Registered</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Ticket ID, Name, Phone..."
          className="w-full pl-9 pr-3 py-2.5 bg-[#16171b] border border-[#26282e] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8db600] focus:ring-1 focus:ring-[#8db600] transition"
        />
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
        {statusOptions.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap transition ${
              statusFilter === st
                ? 'bg-[#8db600]/20 text-[#8db600] border-[#8db600]/50 font-bold'
                : 'bg-[#16171b] text-gray-400 border-[#26282e] hover:text-gray-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Attendee Roster Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Showing {filteredTickets.length} Attendees
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center bg-[#16171b] border border-[#26282e] rounded-xl text-gray-400 text-xs">
            No attendees match your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className="p-3.5 rounded-xl bg-[#16171b] hover:bg-[#202228] border border-[#26282e] transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#8db600] transition">{t.attendeeName}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0f0f0f] border border-[#26282e] font-mono text-gray-400">
                        #{t.id}
                      </span>
                    </div>
                    <p className="text-xs text-[#8db600] font-medium">
                      {t.ticketTier} • <span className="text-gray-400">{t.seatOrZone || 'General'}</span>
                    </p>
                  </div>
                  <div>{getStatusBadge(t.status)}</div>
                </div>

                {/* Bottom detail row */}
                <div className="pt-2 border-t border-[#26282e] flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-500" />
                      <span>{t.attendeePhone}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[#8db600] group-hover:translate-x-0.5 transition-transform">
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
