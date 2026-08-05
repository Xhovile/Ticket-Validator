import React, { useState, useEffect } from 'react';
import { Search, Filter, Phone, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Clock, History, X } from 'lucide-react';
import { Ticket, TicketStatus, EventItem } from '../types';

interface AttendeesViewProps {
  event?: EventItem;
  tickets?: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateStatusDirect: (ticketId: string, status: TicketStatus) => void;
  isLoading?: boolean;
}

export const AttendeesSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-1">
        <div className="w-36 h-6 bg-slate-200 rounded-md" />
        <div className="w-52 h-4 bg-slate-200 rounded-md" />
      </div>

      {/* Search Input Skeleton */}
      <div className="w-full h-10 bg-slate-200 rounded-xl" />

      {/* Filter Chips Skeleton */}
      <div className="flex items-center gap-1.5 overflow-hidden">
        <div className="w-16 h-8 bg-slate-200 rounded-lg shrink-0" />
        <div className="w-24 h-8 bg-slate-200 rounded-lg shrink-0" />
        <div className="w-20 h-8 bg-slate-200 rounded-lg shrink-0" />
        <div className="w-20 h-8 bg-slate-200 rounded-lg shrink-0" />
      </div>

      {/* Attendee Roster Cards Skeletons */}
      <div className="space-y-2">
        <div className="w-32 h-3.5 bg-slate-200 rounded" />

        {/* Card skeletons */}
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-28 h-4 bg-slate-200 rounded" />
                  <div className="w-12 h-3.5 bg-slate-100 rounded" />
                </div>
                <div className="w-36 h-3 bg-slate-200 rounded" />
              </div>
              <div className="w-16 h-5 bg-slate-200 rounded" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <div className="w-24 h-3 bg-slate-200 rounded" />
              <div className="w-14 h-3 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RECENT_SEARCHES_KEY = 'buymesho_recent_searches';

export const AttendeesView: React.FC<AttendeesViewProps> = ({
  event,
  tickets = [],
  onSelectTicket,
  isLoading = false,
}) => {
  if (isLoading || !event) {
    return <AttendeesSkeleton />;
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedCategory] = useState<string>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearches = (searches: string[]) => {
    setRecentSearches(searches);
    try {
      sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (err) {
      console.error('Failed to save recent searches:', err);
    }
  };

  const addRecentSearch = (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm || cleanTerm.length < 2) return;
    const filtered = recentSearches.filter(
      (s) => s.toLowerCase() !== cleanTerm.toLowerCase()
    );
    const updated = [cleanTerm, ...filtered].slice(0, 5);
    saveRecentSearches(updated);
  };

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== termToRemove);
    saveRecentSearches(updated);
  };

  const handleClearAllRecent = () => {
    saveRecentSearches([]);
  };

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
    }
  };

  const handleSelectRecent = (term: string) => {
    setSearchQuery(term);
    addRecentSearch(term);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Inside':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Inside</span>
          </span>
        );
      case 'Outside':
        return (
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Outside</span>
          </span>
        );
      case 'Waiting Entry':
        return (
          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Waiting Entry</span>
          </span>
        );
      case 'Cancelled':
      case 'Refunded':
      case 'Blocked':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium">
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
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Attendee Roster</h2>
          <p className="text-xs text-slate-500">{event.name} • {eventTickets.length} Total Registered</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => searchQuery.trim() && addRecentSearch(searchQuery.trim())}
          placeholder="Search by Ticket ID, Name, Phone..."
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition min-h-[40px]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-0.5">
            <span className="flex items-center gap-1">
              <History className="w-3 h-3 text-slate-400" />
              <span>Recent Searches ({recentSearches.length}/5)</span>
            </span>
            <button
              onClick={handleClearAllRecent}
              className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleSelectRecent(term)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium transition ${
                  searchQuery === term
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{term}</span>
                <span
                  onClick={(e) => removeRecentSearch(term, e)}
                  className="p-0.5 rounded hover:bg-slate-300/60 text-slate-400 hover:text-slate-600 transition"
                  title="Remove search"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        {statusOptions.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition min-h-[32px] ${
              statusFilter === st
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Attendee Roster Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Showing {filteredTickets.length} Attendees
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs">
            No attendees match your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  if (searchQuery.trim()) {
                    addRecentSearch(searchQuery.trim());
                  }
                  onSelectTicket(t);
                }}
                className="p-3 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200 transition cursor-pointer space-y-2 group min-h-[56px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">{t.attendeeName}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 font-mono text-slate-600 font-medium">
                        #{t.id}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 font-medium">
                      {t.ticketTier} • <span className="text-slate-500 font-normal">{t.seatOrZone || 'General'}</span>
                    </p>
                  </div>
                  <div>{getStatusBadge(t.status)}</div>
                </div>

                {/* Bottom detail row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-normal">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.attendeePhone}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
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
