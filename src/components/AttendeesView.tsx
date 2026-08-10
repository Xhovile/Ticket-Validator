import React, { useState } from 'react';
import { Search, Filter, Phone, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Clock, History, X, Ticket as TicketIcon, Mail } from 'lucide-react';
import { Ticket, TicketStatus, EventItem } from '../types';

interface AttendeesViewProps {
  event?: EventItem;
  tickets?: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateStatusDirect: (ticketId: string, status: TicketStatus) => void;
  isLoading?: boolean;
}

export const AttendeesSkeleton: React.FC = () => (
  <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-3 animate-pulse">
    <div className="space-y-1"><div className="h-6 w-36 rounded-md bg-slate-200" /><div className="h-4 w-52 rounded-md bg-slate-200" /></div>
    <div className="h-11 w-full rounded-2xl bg-slate-200" />
    <div className="flex gap-2 overflow-hidden"><div className="h-8 w-16 shrink-0 rounded-full bg-slate-200" /><div className="h-8 w-24 shrink-0 rounded-full bg-slate-200" /><div className="h-8 w-20 shrink-0 rounded-full bg-slate-200" /></div>
    <div className="space-y-2">{[1, 2, 3, 4, 5].map((idx) => <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3.5"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-slate-200" /><div className="flex-1 space-y-1.5"><div className="h-3.5 w-32 rounded bg-slate-200" /><div className="h-3 w-24 rounded bg-slate-200" /></div><div className="h-5 w-16 rounded-full bg-slate-200" /></div><div className="mt-3 h-8 rounded-xl bg-slate-100" /></div>)}</div>
  </div>
);

const RECENT_SEARCHES_KEY = 'buymesho_recent_searches';

export const AttendeesView: React.FC<AttendeesViewProps> = ({ event, tickets = [], onSelectTicket, isLoading = false }) => {
  if (isLoading || !event) return <AttendeesSkeleton />;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const saveRecentSearches = (searches: string[]) => {
    setRecentSearches(searches);
    try { sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches)); } catch { /* storage may be unavailable */ }
  };

  const addRecentSearch = (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm || cleanTerm.length < 2) return;
    saveRecentSearches([cleanTerm, ...recentSearches.filter((s) => s.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 5));
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveRecentSearches(recentSearches.filter((s) => s !== term));
  };

  const eventTickets = tickets.filter((t) => t.eventId === event.id);
  const filteredTickets = eventTickets.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || [t.attendeeName, t.attendeeEmail, t.attendeePhone, t.id, t.ticketTier, t.ticketTitle, t.eventDate, t.startTime].some((value) => (value || '').toLowerCase().includes(query));
    return matchesQuery && (statusFilter === 'All' || t.status === statusFilter);
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Inside': return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800"><CheckCircle2 className="h-3 w-3 text-emerald-600" />Inside</span>;
      case 'Outside': return <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700"><AlertTriangle className="h-3 w-3 text-amber-600" />Outside</span>;
      case 'Waiting Entry': return <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800"><Clock className="h-3 w-3 text-blue-600" />Waiting</span>;
      case 'Cancelled':
      case 'Refunded':
      case 'Blocked': return <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800"><XCircle className="h-3 w-3 text-rose-600" />{status}</span>;
      default: return <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">{status}</span>;
    }
  };

  const statusOptions: (TicketStatus | 'All')[] = ['All', 'Waiting Entry', 'Inside', 'Outside', 'Cancelled', 'Refunded', 'Blocked'];

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-24 pt-3">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Attendees</h2>
            <p className="mt-1 max-w-[290px] truncate text-xs text-slate-500">{event.name} · {eventTickets.length} registered</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">{filteredTickets.length} shown</span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRecentSearch(searchQuery)} placeholder="Search name, ticket ID, email..." className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/5" />
          {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>}
        </div>

        {recentSearches.length > 0 && <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5 text-[10px] font-medium text-slate-500"><span className="flex items-center gap-1"><History className="h-3 w-3 text-slate-400" />Recent searches</span><button type="button" onClick={() => saveRecentSearches([])} className="text-slate-400 hover:text-slate-700">Clear all</button></div>
          <div className="flex flex-wrap gap-1.5">{recentSearches.map((term) => <button type="button" key={term} onClick={() => { setSearchQuery(term); addRecentSearch(term); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-200"><span>{term}</span><span onClick={(e) => removeRecentSearch(term, e)} className="rounded p-0.5 text-slate-400 hover:bg-slate-300 hover:text-slate-700"><X className="h-2.5 w-2.5" /></span></button>)}</div>
        </div>}

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
          {statusOptions.map((st) => <button type="button" key={st} onClick={() => setStatusFilter(st)} className={`min-h-[34px] whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${statusFilter === st ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{st}</button>)}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Attendee Roster</span><span className="text-[10px] text-slate-400">Tap to manage</span></div>

        {filteredTickets.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><p className="text-sm font-semibold text-slate-800">No attendees found</p><p className="mt-1 text-xs leading-5 text-slate-500">Try another search or status filter.</p></div> : (
          <div className="space-y-2.5">
            {filteredTickets.map((t) => {
              const initials = t.attendeeName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
              return (
                <button key={t.id} type="button" onClick={() => { if (searchQuery.trim()) addRecentSearch(searchQuery.trim()); onSelectTicket(t); }} className="group w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.995]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">{initials || <TicketIcon className="h-4 w-4" />}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-semibold text-slate-950">{t.attendeeName}</h4>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500"><TicketIcon className="h-3 w-3 text-slate-400" /><span className="font-mono">#{t.id}</span></p>
                        </div>
                        {getStatusBadge(t.status)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700">{t.ticketTier}</span>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700">{t.ticketTitle}</span>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700">{t.eventDate || '—'}{t.startTime ? ` · ${t.startTime}` : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500"><Mail className="h-3 w-3 shrink-0 text-slate-400" /><span className="truncate">{t.attendeeEmail || '—'}</span></span>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-slate-600 group-hover:text-slate-950"><span>Manage</span><ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex min-w-0 items-center gap-1.5"><Phone className="h-3 w-3 shrink-0 text-slate-400" /><span className="truncate">{t.attendeePhone || '—'}</span></span>
                    <span className="truncate">{t.venue || '—'}{t.location ? ` • ${t.location}` : ''}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
