import React from 'react';
import { Calendar, QrCode, Users, History } from 'lucide-react';

export type NavTab = 'events' | 'scan' | 'attendees' | 'activity';

interface FooterNavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isScanningActive: boolean;
  hasActiveEvent: boolean;
  activityCount?: number;
}

export const FooterNavigation: React.FC<FooterNavigationProps> = ({
  currentTab,
  onTabChange,
  isScanningActive,
  hasActiveEvent,
  activityCount = 0,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#16171b]/95 backdrop-blur-md border-t border-[#26282e] py-1.5 px-4 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Events Tab */}
        <button
          onClick={() => onTabChange('events')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition ${
            currentTab === 'events'
              ? 'text-[#8db600] font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Events</span>
        </button>

        {/* Scan Tab - Prominent Center Action */}
        <button
          onClick={() => onTabChange('scan')}
          disabled={!hasActiveEvent}
          className={`relative flex flex-col items-center justify-center -mt-5 p-3 rounded-full transition shadow-lg ${
            !hasActiveEvent
              ? 'bg-gray-800 text-gray-500 border border-gray-700 opacity-60 cursor-not-allowed'
              : currentTab === 'scan' || isScanningActive
              ? 'bg-[#8db600] text-[#0f0f0f] shadow-[#8db600]/30 ring-4 ring-[#8db600]/20 scale-105 font-bold'
              : 'bg-[#8db600] text-[#0f0f0f] hover:bg-[#9ef01a] shadow-[#8db600]/30 font-bold'
          }`}
        >
          {isScanningActive && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8db600] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#8db600] border-2 border-[#0f0f0f]"></span>
            </span>
          )}
          <QrCode className="w-6 h-6" />
          <span className="sr-only">Scan Tickets</span>
        </button>

        {/* Attendees Tab */}
        <button
          onClick={() => onTabChange('attendees')}
          disabled={!hasActiveEvent}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition ${
            !hasActiveEvent
              ? 'text-gray-600 cursor-not-allowed'
              : currentTab === 'attendees'
              ? 'text-[#8db600] font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Attendees</span>
        </button>

        {/* Activity Log Tab */}
        <button
          onClick={() => onTabChange('activity')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition ${
            currentTab === 'activity'
              ? 'text-[#8db600] font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Activity</span>
          {activityCount > 0 && (
            <span className="absolute top-1 right-2 px-1 py-0.2 bg-[#8db600]/20 text-[#8db600] border border-[#8db600]/30 text-[9px] font-bold rounded-full">
              {activityCount > 99 ? '99+' : activityCount}
            </span>
          )}
        </button>
      </div>
    </footer>
  );
};
