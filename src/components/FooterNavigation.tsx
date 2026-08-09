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
  hasActiveEvent,
}) => {
  const item = (tab: NavTab, label: string, Icon: typeof Calendar, disabled = false) => {
    const active = currentTab === tab;
    return (
      <button
        type="button"
        onClick={() => onTabChange(tab)}
        disabled={disabled}
        aria-current={active ? 'page' : undefined}
        className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
          disabled
            ? 'cursor-not-allowed text-zinc-300'
            : active
              ? 'bg-zinc-950 text-white shadow-sm'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
      >
        <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={active ? 2.25 : 2} />
        <span className="text-[11px] font-semibold">{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pointer-events-none sm:bottom-4 sm:px-4" aria-label="Primary navigation">
      <div className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-1 rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-[0_12px_36px_-16px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        {item('events', 'Events', Calendar)}
        <button
          type="button"
          onClick={() => onTabChange('scan')}
          disabled={!hasActiveEvent}
          aria-current={currentTab === 'scan' ? 'page' : undefined}
          aria-label="Scan Tickets"
          className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-xl transition-colors ${
            !hasActiveEvent
              ? 'cursor-not-allowed bg-zinc-100 text-zinc-300'
              : currentTab === 'scan'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'bg-zinc-950 text-white hover:bg-zinc-800'
          }`}
        >
          <ScanLine className="h-[21px] w-[21px]" strokeWidth={2.25} />
        </button>
        {item('attendees', 'Attendees', Users, !hasActiveEvent)}
      </div>
    </nav>
  );
};