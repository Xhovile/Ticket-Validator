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
  isHighContrast = false,
  onToggleHighContrast,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-4 py-2.5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm shadow-slate-950/15">
            <ScanLine className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                BuyMesho
              </span>
            </div>
            <h1 className="text-xs font-semibold tracking-tight text-slate-900 leading-tight">
              Ticket Validator
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSession && activeSession.active ? (
            <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 sm:flex">
              <Radio className="h-3 w-3 text-emerald-600" />
              <span className="truncate max-w-[100px]">{activeSession.gateName}</span>
            </div>
          ) : null}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex min-h-[36px] items-center gap-2 rounded-2xl border p-1 pl-2.5 text-left transition focus:outline-none ${
                  isHighContrast
                    ? 'border-amber-300 bg-amber-50/90 ring-1 ring-amber-400/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="hidden text-right sm:block">
                  <div className="max-w-[90px] truncate text-xs font-medium leading-tight text-slate-900">{user.name}</div>
                  <div className="text-[10px] capitalize text-slate-500">{user.role === 'organizer' ? 'Organizer' : 'Gate Staff'}</div>
                </div>

                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-xl border border-slate-200 object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                    {user.name.charAt(0)}
                  </div>
                )}
              </button>

              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm" onClick={() => setShowUserDropdown(false)} />
                  <div className="absolute right-0 z-50 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-xs shadow-xl shadow-slate-950/10">
                    <div className="mb-1 border-b border-slate-100 p-2">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-500">
                        <ShieldCheck className="h-3 w-3 text-blue-600" />
                        <span>{user.assignedEventIds.length} Assigned Events</span>
                      </div>
                    </div>

                    <div className="mb-1 space-y-2 rounded-xl border-b border-slate-100 bg-slate-50/80 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-lg p-1.5 ${isHighContrast ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                            <Sun className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold leading-tight text-slate-900">Sunlight High Contrast</p>
                            <p className="text-[10px] text-slate-500">Outdoor legibility boost</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleHighContrast) onToggleHighContrast();
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isHighContrast ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                          role="switch"
                          aria-checked={isHighContrast}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              isHighContrast ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-blue-50 p-1.5 text-blue-700">
                            <Smartphone className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold leading-tight text-slate-900">Haptic Feedback</p>
                            <p className="text-[10px] text-slate-500">Concert gate vibration</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => soundFX.playSuccess()}
                          className="rounded-lg border border-slate-200 bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-slate-800"
                          title="Test vibration on your mobile device"
                        >
                          Test Haptic
                        </button>
                      </div>
                    </div>

                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Switch Demo Account
                    </div>

                    {INITIAL_USERS.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`flex min-h-[36px] w-full items-center gap-2 rounded-xl p-2 text-left transition ${
                          u.id === user.id ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div className="flex-1 truncate">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="text-[10px] capitalize text-slate-500">{u.role} ({u.assignedEventIds.length} events)</p>
                        </div>
                      </button>
                    ))}

                    <div className="mt-1 border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="flex min-h-[36px] w-full items-center gap-2 rounded-xl p-2 text-left font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500">Not Logged In</span>
          )}
        </div>
      </div>
    </header>
  );
};