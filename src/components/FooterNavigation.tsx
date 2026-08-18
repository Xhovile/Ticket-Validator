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
        className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
          disabled
            ? 'cursor-not-allowed border-transparent bg-transparent text-zinc-300'
            : active
              ? 'border-indigo-200/80 bg-white/90 text-indigo-700 shadow-[0_5px_14px_-8px_rgba(79,70,229,0.55)]'
              : 'border-white/70 bg-white/35 text-zinc-600 shadow-[0_3px_10px_-8px_rgba(15,23,42,0.4)] hover:border-zinc-200/90 hover:bg-white/70 hover:text-zinc-950 hover:shadow-[0_5px_14px_-9px_rgba(15,23,42,0.35)]'
        }`}
      >
        <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={active ? 2.25 : 2} />
        <span className="text-[11px] font-semibold">{label}</span>
      </button>
    );
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:bottom-4 sm:px-4" aria-label="Primary navigation">
      <div className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-1.5 rounded-[18px] border border-white/70 bg-zinc-50/65 p-1.5 shadow-[0_16px_42px_-18px_rgba(15,23,42,0.38)] backdrop-blur-2xl">
        {item('events', 'Events', Calendar)}
        <button
          type="button"
          onClick={() => onTabChange('scan')}
          disabled={!hasActiveEvent}
          aria-current={currentTab === 'scan' ? 'page' : undefined}
          aria-label="Scan Tickets"
          className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-xl border transition-all ${
            !hasActiveEvent
              ? 'cursor-not-allowed border-transparent bg-transparent text-zinc-300'
              : currentTab === 'scan'
                ? 'border-indigo-300/90 bg-indigo-600 text-white shadow-[0_7px_16px_-8px_rgba(79,70,229,0.7)]'
                : 'border-indigo-400/40 bg-white/85 text-indigo-700 shadow-[0_6px_16px_-9px_rgba(79,70,229,0.55)] hover:bg-white'
          }`}
        >
          <ScanLine className="h-[21px] w-[21px]" strokeWidth={2.25} />
        </button>
        {item('attendees', 'Attendees', Users, !hasActiveEvent)}
      </div>
    </nav>
  );
};
