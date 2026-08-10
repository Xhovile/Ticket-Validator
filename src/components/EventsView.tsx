import React, { useState } from 'react';
import { Search, Radio, Clock, AlertCircle, Filter, MapPin, CalendarDays, ArrowUpRight } from 'lucide-react';
import { EventItem, User } from '../types';

interface EventsViewProps {
  user: User;
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  permissionError: string | null;
  onClearPermissionError: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  user,
  events,
  selectedEvent,
  onSelectEvent,
  permissionError,
  onClearPermissionError,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Live' | 'Upcoming'>('all');

  const authorizedEvents = events.filter((evt) => {
    if (user.role === 'organizer') return evt.organizerId === user.id;
    return user.assignedEventIds.includes(evt.id);
  });

  const filteredEvents = authorizedEvents.filter((evt) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || evt.name.toLowerCase().includes(query) || evt.venue.toLowerCase().includes(query) || evt.category.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || evt.state === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (state: EventItem['state']) => {
    switch (state) {
      case 'Live':
        return <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800"><Radio className="h-3 w-3 text-emerald-600" /><span>Live</span></span>;
      case 'Upcoming':
        return <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800"><Clock className="h-3 w-3 text-amber-600" /><span>Upcoming</span></span>;
      case 'Ended':
        return <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"><span>Ended</span></span>;
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-24 pt-3">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Events</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Select an event to manage its check-in.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
            {authorizedEvents.length} {authorizedEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Hello, <span className="font-semibold text-slate-700">{user.name.split(' ')[0]}</span> · {user.role === 'organizer' ? 'Organizer' : user.assignedGate || 'Staff'}</p>
      </div>

      {permissionError && (
        <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div><p className="font-semibold text-rose-900">Access Restricted</p><p className="mt-0.5 text-[11px] leading-relaxed text-rose-700">{permissionError}</p></div>
          </div>
          <button onClick={onClearPermissionError} className="min-h-[36px] w-full rounded-xl border border-rose-200 bg-white py-1.5 text-[11px] font-medium text-rose-800 transition hover:bg-rose-50">Dismiss Alert</button>
        </div>
      )}

      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events, venues, categories..." className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/5" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
          {(['all', 'Live', 'Upcoming'] as const).map((st) => (
            <button key={st} onClick={() => setStatusFilter(st)} className={`min-h-[34px] whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${statusFilter === st ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Available Events</span>
          <span className="text-[10px] text-slate-400">{filteredEvents.length} shown</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-800">No events found</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Try a different search or status filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              const remaining = Math.max(0, evt.totalTicketsSold - evt.checkedInCount);

              return (
                <button key={evt.id} type="button" onClick={() => onSelectEvent(evt)} className={`group w-full rounded-2xl border bg-white p-3.5 text-left shadow-sm transition active:scale-[0.995] ${isSelected ? 'border-slate-400 ring-2 ring-slate-950/5' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                  <div className="flex items-start gap-3">
                    <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img src={evt.bannerImage} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{evt.category}</span>
                        {getStatusBadge(evt.state)}
                      </div>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{evt.name}</h3>
                      <div className="mt-1.5 space-y-1 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-slate-400" />{evt.date}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-400" />{evt.venue} · {evt.city}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-700" />
                  </div>

                  <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <div className="border-r border-slate-200 px-2 py-2.5 text-center"><p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">Sold</p><p className="mt-0.5 text-sm font-semibold text-slate-950">{evt.totalTicketsSold}</p></div>
                    <div className="border-r border-slate-200 bg-emerald-50/50 px-2 py-2.5 text-center"><p className="text-[9px] font-medium uppercase tracking-wide text-emerald-700">Checked In</p><p className="mt-0.5 text-sm font-semibold text-emerald-800">{evt.checkedInCount}</p></div>
                    <div className="px-2 py-2.5 text-center"><p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">Remaining</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{remaining}</p></div>
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