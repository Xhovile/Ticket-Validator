import React, { useState } from 'react';
import { Search, Radio, Clock, AlertCircle, Filter } from 'lucide-react';
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
    if (user.role === 'organizer') {
      return evt.organizerId === user.id;
    }
    return user.assignedEventIds.includes(evt.id);
  });

  const filteredEvents = authorizedEvents.filter((evt) => {
    const matchesSearch = evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || evt.state === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (state: EventItem['state']) => {
    switch (state) {
      case 'Live':
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
            <Radio className="h-3 w-3 text-emerald-600" />
            <span>Live Check-in</span>
          </div>
        );
      case 'Upcoming':
        return (
          <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Upcoming</span>
          </div>
        );
      case 'Ended':
        return (
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            <span>Ended</span>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
            <span>Hello, {user.name.split(' ')[0]}</span>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {user.role === 'organizer' ? 'Organizer' : user.assignedGate || 'Staff'}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Select an event to open check-in gate session</p>
        </div>
      </div>

      {permissionError && (
        <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">Access Restricted</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-rose-700">{permissionError}</p>
            </div>
          </div>
          <button
            onClick={onClearPermissionError}
            className="min-h-[36px] w-full rounded-xl border border-rose-200 bg-white py-1.5 text-[11px] font-medium text-rose-800 transition hover:bg-rose-50"
          >
            Dismiss Alert
          </button>
        </div>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event name, venue..."
            className="min-h-[40px] w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 transition focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
          {(['all', 'Live', 'Upcoming'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`min-h-[32px] whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium capitalize transition ${
                statusFilter === st
                  ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span className="text-[10px] font-semibold uppercase tracking-wider">All Events ({filteredEvents.length})</span>
          <span className="text-[11px]">Tap to open</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-sm">
            No events found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className={`cursor-pointer rounded-2xl border bg-white p-3.5 transition shadow-sm ${
                    isSelected
                      ? 'border-slate-300 ring-1 ring-slate-950/10'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={evt.bannerImage}
                        alt={evt.name}
                        className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {evt.category}
                        </span>
                        <h3 className="text-xs font-semibold leading-snug text-slate-900">{evt.name}</h3>
                        <p className="text-[11px] text-slate-500">{evt.venue} • {evt.city}</p>
                        <p className="text-[10px] text-slate-400">{evt.date}</p>
                      </div>
                    </div>
                    <div>{getStatusBadge(evt.state)}</div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 text-center">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                      <div className="text-[10px] font-medium text-slate-500">Sold</div>
                      <div className="text-xs font-semibold text-slate-900">{evt.totalTicketsSold}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2">
                      <div className="text-[10px] font-medium text-emerald-800">Checked In</div>
                      <div className="text-xs font-semibold text-emerald-700">{evt.checkedInCount}</div>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                      <div className="text-[10px] font-medium text-slate-500">Remaining</div>
                      <div className="text-xs font-semibold text-slate-700">
                        {evt.totalTicketsSold - evt.checkedInCount}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};