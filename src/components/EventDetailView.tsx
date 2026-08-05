import React from 'react';
import { Radio, Clock, AlertTriangle, ArrowLeft, Users, QrCode, Ticket as TicketIcon } from 'lucide-react';
import { EventItem, CheckInSession } from '../types';

interface EventDetailViewProps {
  event: EventItem;
  onBack: () => void;
  onStartScanning: () => void;
  onViewAttendees: () => void;
  activeSession: CheckInSession | null;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  event,
  onBack,
  onStartScanning,
  onViewAttendees,
  activeSession,
}) => {
  const remainingCount = Math.max(0, event.totalTicketsSold - event.checkedInCount);
  const checkInPercentage = event.totalTicketsSold > 0
    ? Math.round((event.checkedInCount / event.totalTicketsSold) * 100)
    : 0;

  const isLive = event.state === 'Live';
  const isUpcoming = event.state === 'Upcoming';
  const isEnded = event.state === 'Ended';

  return (
    <div className="space-y-5 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Back button header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16171b] border border-[#26282e] text-xs text-gray-300 hover:text-white hover:border-gray-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </button>

        {/* State Tag */}
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8db600]/10 border border-[#8db600]/40 text-[#8db600] text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-[#8db600] animate-pulse" />
              <span>LIVE EVENT</span>
            </span>
          )}
          {isUpcoming && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>UPCOMING</span>
            </span>
          )}
          {isEnded && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#202228] border border-[#26282e] text-gray-400 text-xs font-bold">
              <span>ENDED</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Event Card */}
      <div className="bg-[#16171b] border border-[#26282e] rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative h-44">
          <img src={event.bannerImage} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16171b] via-[#16171b]/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8db600] bg-[#8db600]/10 px-2 py-0.5 rounded border border-[#8db600]/30 backdrop-blur-sm">
              {event.category}
            </span>
            <h1 className="text-xl font-bold text-white mt-1 leading-tight">{event.name}</h1>
            <p className="text-xs text-gray-300 mt-0.5">{event.venue} • {event.date}</p>
          </div>
        </div>

        {/* Minimal Stats Section */}
        <div className="p-4 space-y-4">
          {/* Real-time Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Gate Entry Progress</span>
              <span className="text-[#8db600] font-bold">{checkInPercentage}% Checked In</span>
            </div>
            <div className="h-2.5 w-full bg-[#0f0f0f] rounded-full overflow-hidden border border-[#26282e]">
              <div
                className="h-full bg-gradient-to-r from-[#8db600] to-[#9ef01a] transition-all duration-500 rounded-full"
                style={{ width: `${checkInPercentage}%` }}
              />
            </div>
          </div>

          {/* 3 Core Numbers Required */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0f0f0f] p-3 rounded-xl border border-[#26282e] text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Tickets Sold</p>
              <p className="text-lg font-bold text-white mt-0.5">{event.totalTicketsSold}</p>
            </div>
            <div className="bg-[#8db600]/10 p-3 rounded-xl border border-[#8db600]/30 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#8db600]">Checked In</p>
              <p className="text-lg font-bold text-[#8db600] mt-0.5">{event.checkedInCount}</p>
            </div>
            <div className="bg-[#0f0f0f] p-3 rounded-xl border border-[#26282e] text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Remaining</p>
              <p className="text-lg font-bold text-gray-200 mt-0.5">{remainingCount}</p>
            </div>
          </div>

          {/* Active Session Gate Info */}
          {activeSession && activeSession.active && activeSession.eventId === event.id && (
            <div className="p-3 rounded-xl bg-[#8db600]/10 border border-[#8db600]/30 text-[#8db600] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8db600] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8db600]"></span>
                </span>
                <div>
                  <p className="font-semibold text-white">Check-in Session Active</p>
                  <p className="text-[10px] text-[#8db600]/90">Gate: {activeSession.gateName} • Started {activeSession.startTime}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#8db600]/20 rounded font-bold text-[10px] text-[#8db600]">
                {activeSession.scanCount} Scans
              </span>
            </div>
          )}

          {/* State Warnings & Main Action Buttons */}
          <div className="space-y-2 pt-1">
            {isUpcoming && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Scanning is disabled because this event is marked <strong>Upcoming</strong>.</span>
              </div>
            )}

            {isEnded && (
              <div className="p-3 rounded-xl bg-[#0f0f0f] border border-[#26282e] text-gray-400 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>This event has <strong>Ended</strong>. Check-in records are locked in read-only mode.</span>
              </div>
            )}

            {/* Primary Action 1: Start Check-in / Resume Scanning */}
            <button
              onClick={onStartScanning}
              disabled={isUpcoming || isEnded}
              className={`w-full py-3.5 px-4 font-bold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.99] ${
                isUpcoming || isEnded
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  : 'bg-[#8db600] hover:bg-[#9ef01a] text-[#0f0f0f] shadow-[#8db600]/20'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>
                {activeSession && activeSession.active && activeSession.eventId === event.id
                  ? 'Resume Gate Scanner'
                  : 'Start Check-in Session'}
              </span>
            </button>

            {/* Primary Action 2: View Attendees */}
            <button
              onClick={onViewAttendees}
              className="w-full py-3 px-4 bg-[#0f0f0f] hover:bg-[#202228] border border-[#26282e] text-gray-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Users className="w-4 h-4 text-[#8db600]" />
              <span>View Attendee Roster ({event.totalTicketsSold})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
