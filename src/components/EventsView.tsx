import React, { useState } from 'react';
import { Search, Radio, Clock, AlertCircle, ChevronRight, Sparkles, Filter } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'Live' | 'Upcoming' | 'Ended'>('all');

  // Filter events based on logged in user's assignedEventIds or if organizer owns it.
  const authorizedEvents = events.filter((evt) => {
    if (user.role === 'organizer') {
      return evt.organizerId === user.id;
    }
    return user.assignedEventIds.includes(evt.id);
  });

  // Recent events (first 2 authorized events)
  const recentEvents = authorizedEvents.slice(0, 2);

  // Filtered list strictly from authorized creator events
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
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
            <Radio className="w-3 h-3 text-emerald-600" />
            <span>Live Check-in</span>
          </div>
        );
      case 'Upcoming':
        return (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Upcoming</span>
          </div>
        );
      case 'Ended':
        return (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium">
            <span>Ended</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Personalized Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hello, {user.name.split(' ')[0]}</span>
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              {user.role === 'organizer' ? 'Organizer' : user.assignedGate || 'Staff'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Select an event to open check-in gate session</p>
        </div>
      </div>

      {/* Permission Error Banner */}
      {permissionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Access Restricted</p>
              <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5">{permissionError}</p>
            </div>
          </div>
          <button
            onClick={onClearPermissionError}
            className="w-full py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-medium rounded-lg border border-rose-200 transition min-h-[36px]"
          >
            Dismiss Alert
          </button>
        </div>
      )}

      {/* Recent Events Section */}
      {recentEvents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Recent Accessible Events
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {recentEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;

              return (
                <button
                  key={`recent-${evt.id}`}
                  onClick={() => onSelectEvent(evt)}
                  className={`w-full p-3 rounded-xl border text-left transition min-h-[56px] flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-50 border-blue-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={evt.bannerImage}
                      alt={evt.name}
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 leading-tight line-clamp-1">{evt.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{evt.date} • {evt.venue}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-emerald-700">
                          {evt.checkedInCount} / {evt.totalTicketsSold} checked in
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(evt.state)}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event name, venue..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition min-h-[40px]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {(['all', 'Live', 'Upcoming', 'Ended'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium capitalize whitespace-nowrap transition min-h-[32px] ${
                statusFilter === st
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* All Events List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px]">All Events ({filteredEvents.length})</span>
          <span className="text-[11px]">Select to inspect gate</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs">
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
                  className={`cursor-pointer rounded-xl border transition p-3.5 relative bg-white ${
                    isSelected
                      ? 'border-blue-600 bg-slate-50/50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={evt.bannerImage}
                        alt={evt.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          {evt.category}
                        </span>
                        <h3 className="text-xs font-semibold text-slate-900 leading-snug">{evt.name}</h3>
                        <p className="text-[11px] text-slate-500">{evt.venue} • {evt.city}</p>
                        <p className="text-[10px] text-slate-400">{evt.date}</p>
                      </div>
                    </div>
                    <div>{getStatusBadge(evt.state)}</div>
                  </div>

                  {/* Progress Stats */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">Sold</div>
                      <div className="text-xs font-semibold text-slate-900">{evt.totalTicketsSold}</div>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <div className="text-[10px] text-emerald-800 font-medium">Checked In</div>
                      <div className="text-xs font-semibold text-emerald-700">{evt.checkedInCount}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">Remaining</div>
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
