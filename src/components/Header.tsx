import React from 'react';
import { ScanLine, ShieldCheck, User as UserIcon, LogOut, Radio } from 'lucide-react';
import { User, CheckInSession } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onSwitchUser: (newUser: User) => void;
  activeSession: CheckInSession | null;
  activeEventName?: string;
  onOpenSessionModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onSwitchUser,
  activeSession,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & App Identifier */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <ScanLine className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                BuyMesho
              </span>
            </div>
            <h1 className="text-xs font-semibold text-slate-900 leading-tight tracking-tight">
              Ticket Validator
            </h1>
          </div>
        </div>

        {/* Right Section: Active Gate Badge & User Menu */}
        <div className="flex items-center gap-2">
          {activeSession && activeSession.active ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
              <Radio className="w-3 h-3 text-emerald-600" />
              <span className="truncate max-w-[100px]">{activeSession.gateName}</span>
            </div>
          ) : null}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-left focus:outline-none min-h-[36px]"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-slate-900 leading-tight truncate max-w-[90px]">{user.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{user.role === 'organizer' ? 'Organizer' : 'Gate Staff'}</div>
                </div>

                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-lg object-cover border border-slate-200" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold border border-slate-200">
                    {user.name.charAt(0)}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowUserDropdown(false)} />
                  <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 text-xs">
                    <div className="p-2 border-b border-slate-100 mb-1">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1 text-slate-500 text-[10px] font-medium">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        <span>{user.assignedEventIds.length} Assigned Events</span>
                      </div>
                    </div>

                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Switch Demo Account
                    </div>

                    {INITIAL_USERS.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition min-h-[36px] ${
                          u.id === user.id ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="truncate flex-1">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{u.role} ({u.assignedEventIds.length} events)</p>
                        </div>
                      </button>
                    ))}

                    <div className="mt-1 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-600 hover:bg-rose-50 text-left transition font-medium min-h-[36px]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium">Not Logged In</span>
          )}
        </div>
      </div>
    </header>
  );
};
