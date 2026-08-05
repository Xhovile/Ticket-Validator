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

  // Filter events based on logged in user's assignedEventIds
  // Or if organizer owns it.
  const authorizedEvents = events.filter((evt) => {
    if (user.role === 'organizer') {
      return evt.organizerId === user.id;
    }
    return user.assignedEventIds.includes(evt.id);
  });

  // Recent events (first 2 authorized events)
  const recentEvents = authorizedEvents.slice(0, 2);

  // Filtered list
  const filteredEvents = events.filter((evt) => {
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8db600]/10 border border-[#8db600]/40 text-[#8db600] text-[11px] font-semibold">
            <Radio className="w-3 h-3 text-[#8db600] animate-pulse" />
            <span>Live Check-in</span>
          </div>
        );
      case 'Upcoming':
        return (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-medium">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Upcoming</span>
          </div>
        );
      case 'Ended':
        return (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#202228] border border-[#26282e] text-gray-400 text-[11px] font-medium">
            <span>Ended</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-5 pb-20 pt-2 px-4 max-w-md mx-auto">
      {/* Personalized Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Hello, {user.name.split(' ')[0]}</span>
            <span className="text-xs font-normal text-[#8db600] bg-[#8db600]/10 border border-[#8db600]/30 px-2 py-0.5 rounded-full">
              {user.role === 'organizer' ? 'Organizer' : user.assignedGate || 'Staff'}
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Select an event to load check-in gate session</p>
        </div>
      </div>

      {/* Permission Error Banner */}
      {permissionError && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs shadow-lg space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Access Restricted</p>
              <p className="text-[11px] text-red-200/90 leading-relaxed mt-0.5">{permissionError}</p>
            </div>
          </div>
          <button
            onClick={onClearPermissionError}
            className="w-full py-1.5 bg-red-900/50 hover:bg-red-900 text-red-200 text-[11px] font-medium rounded-lg border border-red-700 transition"
          >
            Dismiss Alert
          </button>
        </div>
      )}

      {/* Recent Events Section */}
      {recentEvents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#8db600]" />
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
                  className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#8db600]/10 border-[#8db600]/60 shadow-lg shadow-[#8db600]/10'
                      : 'bg-[#16171b] border-[#26282e] hover:border-gray-700 hover:bg-[#202228]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={evt.bannerImage}
                      alt={evt.name}
                      className="w-11 h-11 rounded-lg object-cover border border-[#26282e] shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight line-clamp-1">{evt.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{evt.date} • {evt.venue}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-[#8db600]">
                          {evt.checkedInCount} / {evt.totalTicketsSold} checked in
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(evt.state)}
                    <ChevronRight className="w-4 h-4 text-gray-500" />
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
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event name, venue..."
            className="w-full pl-9 pr-3 py-2.5 bg-[#16171b] border border-[#26282e] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8db600] focus:ring-1 focus:ring-[#8db600] transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
          {(['all', 'Live', 'Upcoming', 'Ended'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg border text-[11px] font-medium capitalize whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-[#8db600]/20 text-[#8db600] border-[#8db600]/50 font-bold'
                  : 'bg-[#16171b] text-gray-400 border-[#26282e] hover:text-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* All Events List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">All Events ({filteredEvents.length})</span>
          <span>Tap to view & scan</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-[#16171b] border border-[#26282e] rounded-xl text-gray-400 text-xs">
            No events found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              const hasPermission = user.role === 'organizer'
                ? evt.organizerId === user.id
                : user.assignedEventIds.includes(evt.id);

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className={`cursor-pointer rounded-2xl border transition p-4 relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#1a1b20] border-[#8db600]/70 shadow-xl shadow-[#8db600]/10 ring-1 ring-[#8db600]/30'
                      : 'bg-[#16171b] border-[#26282e] hover:border-gray-700 hover:bg-[#202228]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={evt.bannerImage}
                        alt={evt.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#26282e] shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-[#8db600] uppercase tracking-wide">
                            {evt.category}
                          </span>
                          {!hasPermission && (
                            <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800 text-[9px] font-semibold">
                              Restricted
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug">{evt.name}</h3>
                        <p className="text-xs text-gray-400">{evt.venue} • {evt.city}</p>
                        <p className="text-[11px] text-gray-500">{evt.date}</p>
                      </div>
                    </div>
                    <div>{getStatusBadge(evt.state)}</div>
                  </div>

                  {/* Progress Stats */}
                  <div className="mt-4 pt-3 border-t border-[#26282e] grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#0f0f0f] p-2 rounded-lg border border-[#26282e]">
                      <div className="text-[10px] text-gray-400 font-medium">Sold</div>
                      <div className="text-sm font-bold text-white">{evt.totalTicketsSold}</div>
                    </div>
                    <div className="bg-[#8db600]/10 p-2 rounded-lg border border-[#8db600]/30">
                      <div className="text-[10px] text-[#8db600] font-medium">Checked In</div>
                      <div className="text-sm font-bold text-[#8db600]">{evt.checkedInCount}</div>
                    </div>
                    <div className="bg-[#0f0f0f] p-2 rounded-lg border border-[#26282e]">
                      <div className="text-[10px] text-gray-400 font-medium">Remaining</div>
                      <div className="text-sm font-bold text-gray-200">
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
