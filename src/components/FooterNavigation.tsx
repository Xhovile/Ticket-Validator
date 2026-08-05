import React from 'react';
import { Calendar, ScanLine, Users } from 'lucide-react';

export type NavTab = 'events' | 'scan' | 'attendees';

interface FooterNavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isScanningActive: boolean;
  hasActiveEvent: boolean;
}

export const FooterNavigation: React.FC<FooterNavigationProps> = ({
  currentTab,
  onTabChange,
  isScanningActive,
  hasActiveEvent,
}) => {
  return (
    <div className="fixed bottom-5 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto flex items-center justify-center gap-2.5 pointer-events-auto">
        {/* Events Tab */}
        <button
          onClick={() => onTabChange('events')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-200 shadow-xl ${
            currentTab === 'events'
              ? 'bg-slate-950 border-2 border-blue-500 ring-2 ring-blue-500/25 text-white font-semibold scale-105'
              : 'bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 font-medium'
          }`}
        >
          <Calendar className={`w-4 h-4 transition-colors ${currentTab === 'events' ? 'text-blue-400' : 'text-slate-400'}`} />
          <span className="text-xs tracking-tight">Events</span>
        </button>

        {/* Scan Tab - Central Action */}
        <button
          onClick={() => onTabChange('scan')}
          disabled={!hasActiveEvent}
          title="Scan Tickets"
          aria-label="Scan Tickets"
          className={`w-16 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xl shrink-0 ${
            !hasActiveEvent
              ? 'bg-slate-950/50 backdrop-blur-md border border-slate-800/60 text-slate-600 cursor-not-allowed'
              : currentTab === 'scan'
              ? 'bg-slate-950 border-2 border-blue-500 ring-2 ring-blue-500/25 text-white scale-105'
              : 'bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
        >
          <ScanLine className={`w-7 h-7 transition-colors ${
            !hasActiveEvent ? 'text-slate-600' : currentTab === 'scan' ? 'text-blue-400' : 'text-slate-400'
          }`} />
        </button>

        {/* Attendees Tab */}
        <button
          onClick={() => onTabChange('attendees')}
          disabled={!hasActiveEvent}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-200 shadow-xl ${
            !hasActiveEvent
              ? 'bg-slate-950/50 backdrop-blur-md border border-slate-800/60 text-slate-600 cursor-not-allowed'
              : currentTab === 'attendees'
              ? 'bg-slate-950 border-2 border-blue-500 ring-2 ring-blue-500/25 text-white font-semibold scale-105'
              : 'bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 font-medium'
          }`}
        >
          <Users className={`w-4 h-4 transition-colors ${
            !hasActiveEvent ? 'text-slate-600' : currentTab === 'attendees' ? 'text-blue-400' : 'text-slate-400'
          }`} />
          <span className="text-xs tracking-tight">Attendees</span>
        </button>
      </div>
    </div>
  );
};
