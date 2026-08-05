import React from 'react';
import { Radio, Clock, AlertTriangle, ArrowLeft, Users, ScanLine } from 'lucide-react';
import { EventItem, CheckInSession } from '../types';

interface EventDetailViewProps {
  event?: EventItem;
  onBack: () => void;
  onStartScanning: () => void;
  onViewAttendees: () => void;
  activeSession: CheckInSession | null;
  isLoading?: boolean;
}

export const EventDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto animate-pulse">
      {/* Back button header */}
      <div className="flex items-center justify-between">
        <div className="w-36 h-9 bg-slate-200 rounded-lg" />
        <div className="w-20 h-6 bg-slate-200 rounded-md" />
      </div>

      {/* Main Event Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Banner image skeleton */}
        <div className="relative h-40 bg-slate-200 p-4 flex flex-col justify-end">
          <div className="w-16 h-4 bg-slate-300 rounded mb-2" />
          <div className="w-3/4 h-5 bg-slate-300 rounded mb-1.5" />
          <div className="w-1/2 h-3.5 bg-slate-300 rounded" />
        </div>

        {/* Minimal Stats Section */}
        <div className="p-4 space-y-3.5">
          {/* Progress Bar skeleton */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <div className="w-28 h-3.5 bg-slate-200 rounded" />
              <div className="w-20 h-3.5 bg-slate-200 rounded" />
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full" />
          </div>

          {/* 3 Core Numbers */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-100 p-3 rounded-lg h-14" />
            <div className="bg-slate-100 p-3 rounded-lg h-14" />
            <div className="bg-slate-100 p-3 rounded-lg h-14" />
          </div>

          {/* Gate info skeleton */}
          <div className="h-12 bg-slate-100 rounded-lg" />

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="h-10 bg-slate-200 rounded-lg w-full" />
            <div className="h-10 bg-slate-200 rounded-lg w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  event,
  onBack,
  onStartScanning,
  onViewAttendees,
  activeSession,
  isLoading = false,
}) => {
  if (isLoading || !event) {
    return <EventDetailSkeleton />;
  }

  const remainingCount = Math.max(0, event.totalTicketsSold - event.checkedInCount);
  const checkInPercentage = event.totalTicketsSold > 0
    ? Math.round((event.checkedInCount / event.totalTicketsSold) * 100)
    : 0;

  const isLive = event.state === 'Live';
  const isUpcoming = event.state === 'Upcoming';
  const isEnded = event.state === 'Ended';

  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Back button header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </button>

        {/* State Tag */}
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              <Radio className="w-3 h-3 text-emerald-600" />
              <span>LIVE EVENT</span>
            </span>
          )}
          {isUpcoming && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>UPCOMING</span>
            </span>
          )}
          {isEnded && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium">
              <span>ENDED</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Event Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="relative h-40">
          <img src={event.bannerImage} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm">
              {event.category}
            </span>
            <h1 className="text-base font-bold text-white mt-1 leading-tight">{event.name}</h1>
            <p className="text-xs text-slate-200 mt-0.5">{event.venue} • {event.date}</p>
          </div>
        </div>

        {/* Minimal Stats Section */}
        <div className="p-4 space-y-3.5">
          {/* Real-time Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Gate Entry Progress</span>
              <span className="text-blue-600 font-semibold">{checkInPercentage}% Checked In</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${checkInPercentage}%` }}
              />
            </div>
          </div>

          {/* 3 Core Numbers */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Tickets Sold</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{event.totalTicketsSold}</p>
            </div>
            <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-800">Checked In</p>
              <p className="text-sm font-semibold text-emerald-700 mt-0.5">{event.checkedInCount}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Remaining</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{remainingCount}</p>
            </div>
          </div>

          {/* Active Session Gate Info */}
          {activeSession && activeSession.active && activeSession.eventId === event.id && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Check-in Session Active</p>
                <p className="text-[11px] text-slate-500">Gate: {activeSession.gateName} • Started {activeSession.startTime}</p>
              </div>
              <span className="px-2 py-0.5 bg-white rounded-md font-mono text-[10px] text-slate-800 font-semibold border border-slate-200">
                {activeSession.scanCount} Scans
              </span>
            </div>
          )}

          {/* State Warnings & Main Action Buttons */}
          <div className="space-y-2 pt-1">
            {isUpcoming && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Scanning is disabled because this event is marked <strong>Upcoming</strong>.</span>
              </div>
            )}

            {isEnded && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 shrink-0" />
                <span>This event has <strong>Ended</strong>. Check-in records are locked in read-only mode.</span>
              </div>
            )}

            {/* Primary Action 1: Solid Blue Button */}
            <button
              onClick={onStartScanning}
              disabled={isUpcoming || isEnded}
              className={`w-full py-2.5 px-4 font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition min-h-[40px] ${
                isUpcoming || isEnded
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>
                {activeSession && activeSession.active && activeSession.eventId === event.id
                  ? 'Resume Gate Scanner'
                  : 'Start Check-in Session'}
              </span>
            </button>

            {/* Primary Action 2: Secondary White Button with Gray Border */}
            <button
              onClick={onViewAttendees}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition min-h-[40px]"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>View Attendee Roster ({event.totalTicketsSold})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
