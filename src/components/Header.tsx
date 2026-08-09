import React from 'react';
import { ScanLine, ShieldCheck, User as UserIcon, LogOut, Radio, Sun, Smartphone } from 'lucide-react';
import { User, CheckInSession } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { soundFX } from '../utils/audio';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onSwitchUser: (newUser: User) => void;
  activeSession: CheckInSession | null;
  activeEventName?: string;
  onOpenSessionModal?: () => void;
  isHighContrast?: boolean;
  onToggleHighContrast?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onSwitchUser,
  activeSession,
  activeEventName,
  isHighContrast = false,
  onToggleHighContrast,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[64px] w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <ScanLine className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">BuyMesho</span>
              <span className="h-1 w-1 rounded-full bg-amber-500" />
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <h1 className="truncate text-[13px] font-semibold tracking-tight text-zinc-950">Ticket Validator</h1>
              {activeEventName && (
                <>
                  <span className="hidden text-zinc-300 sm:inline">/</span>
                  <span className="hidden max-w-[220px] truncate text-xs font-medium text-zinc-500 sm:inline">{activeEventName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {activeSession?.active && (
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              <span className="max-w-[130px] truncate text-[11px] font-semibold text-emerald-800">{activeSession.gateName}</span>
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown((open) => !open)}
                className="flex min-h-9 items-center gap-2 rounded-[10px] border border-zinc-200 bg-white p-1 pl-2 transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none"
                aria-expanded={showUserDropdown}
                aria-haspopup="menu"
              >
                <div className="hidden max-w-[110px] text-right sm:block">
                  <div className="truncate text-[11px] font-semibold leading-tight text-zinc-900">{user.name}</div>
                  <div className="mt-0.5 text-[10px] capitalize leading-tight text-zinc-500">{user.role === 'organizer' ? 'Organizer' : 'Gate Staff'}</div>
                </div>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-lg border border-zinc-200 object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                    {user.name.charAt(0)}
                  </div>
                )}
              </button>

              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.22)]">
                    <div className="border-b border-zinc-100 px-3 py-2.5">
                      <p className="text-xs font-semibold text-zinc-900">{user.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{user.assignedEventIds.length} Assigned Events</span>
                      </div>
                    </div>

                    <div className="my-1.5 space-y-2 rounded-lg bg-zinc-50 p-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-lg p-1.5 ${isHighContrast ? 'bg-amber-100 text-amber-700' : 'bg-white text-zinc-500 ring-1 ring-zinc-200'}`}>
                            <Sun className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold leading-tight text-zinc-900">Sunlight High Contrast</p>
                            <p className="mt-0.5 text-[10px] text-zinc-500">Outdoor legibility boost</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onToggleHighContrast}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none ${isHighContrast ? 'bg-amber-500' : 'bg-zinc-300'}`}
                          role="switch"
                          aria-checked={isHighContrast}
                        >
                          <span className={`pointer-events-none h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${isHighContrast ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-zinc-200/70 pt-2">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600"><Smartphone className="h-3.5 w-3.5" /></div>
                          <div>
                            <p className="text-[11px] font-semibold leading-tight text-zinc-900">Haptic Feedback</p>
                            <p className="mt-0.5 text-[10px] text-zinc-500">Concert gate vibration</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => soundFX.playSuccess()} className="rounded-lg bg-zinc-950 px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-zinc-800">Test</button>
                      </div>
                    </div>

                    <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">Switch Demo Account</div>
                    {INITIAL_USERS.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { onSwitchUser(u); setShowUserDropdown(false); }}
                        className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left transition ${u.id === user.id ? 'bg-indigo-50 text-indigo-900' : 'text-zinc-700 hover:bg-zinc-50'}`}
                      >
                        <UserIcon className={`h-3.5 w-3.5 shrink-0 ${u.id === user.id ? 'text-indigo-600' : 'text-zinc-400'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium">{u.name}</p>
                          <p className="truncate text-[10px] capitalize text-zinc-500">{u.role} · {u.assignedEventIds.length} events</p>
                        </div>
                      </button>
                    ))}

                    <div className="mt-1 border-t border-zinc-100 pt-1">
                      <button type="button" onClick={() => { setShowUserDropdown(false); onLogout(); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] font-semibold text-red-600 transition hover:bg-red-50">
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-medium text-zinc-500">Not Logged In</span>
          )}
        </div>
      </div>
    </header>
  );
};