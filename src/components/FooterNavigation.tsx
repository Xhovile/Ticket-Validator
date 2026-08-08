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
        <button
          onClick={() => onTabChange('events')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-2xl transition-all duration-200 border shadow-sm backdrop-blur-md ${
            currentTab === 'events'
              ? 'bg-slate-950 text-white border-slate-950 shadow-lg shadow-slate-950/20 scale-[1.03]'
              : 'bg-white/95 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Calendar className={`w-4 h-4 transition-colors ${currentTab === 'events' ? 'text-blue-300' : 'text-slate-400'}`} />
          <span className="text-xs tracking-tight font-medium">Events</span>
        </button>

        <button
          onClick={() => onTabChange('scan')}
          disabled={!hasActiveEvent}
          title="Scan Tickets"
          aria-label="Scan Tickets"
          className={`w-16 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border shadow-lg shrink-0 ${
            !hasActiveEvent
              ? 'bg-slate-100/90 text-slate-400 border-slate-200 cursor-not-allowed'
              : currentTab === 'scan'
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 scale-[1.03]'
              : 'bg-slate-950 text-white border-slate-950 hover:bg-slate-900'
          }`}
        >
          <ScanLine className={`w-7 h-7 transition-colors ${
            !hasActiveEvent ? 'text-slate-400' : currentTab === 'scan' ? 'text-white' : 'text-slate-200'
          }`} />
        </button>

        <button
          onClick={() => onTabChange('attendees')}
          disabled={!hasActiveEvent}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-2xl transition-all duration-200 border shadow-sm backdrop-blur-md ${
            !hasActiveEvent
              ? 'bg-slate-100/90 text-slate-400 border-slate-200 cursor-not-allowed'
              : currentTab === 'attendees'
              ? 'bg-slate-950 text-white border-slate-950 shadow-lg shadow-slate-950/20 scale-[1.03]'
              : 'bg-white/95 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Users className={`w-4 h-4 transition-colors ${
            !hasActiveEvent ? 'text-slate-400' : currentTab === 'attendees' ? 'text-blue-300' : 'text-slate-400'
          }`} />
          <span className="text-xs tracking-tight font-medium">Attendees</span>
        </button>
      </div>
    </div>
  );
};