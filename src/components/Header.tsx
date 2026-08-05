import React from 'react';
import { QrCode, ShieldCheck, User as UserIcon, LogOut, Radio } from 'lucide-react';
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
  activeEventName,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-[#26282e] px-4 py-3 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & App Identifier */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#8db600]/10 border border-[#8db600]/30 flex items-center justify-center text-[#8db600] shadow-sm">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">BuyMeShow</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8db600] animate-pulse"></span>
            </div>
            <h1 className="text-sm font-bold text-white leading-none tracking-tight flex items-center gap-1">
              Ticket Validator
            </h1>
          </div>
        </div>

        {/* Right Section: Active Gate Badge & User Menu */}
        <div className="flex items-center gap-2">
          {activeSession && activeSession.active ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8db600]/10 border border-[#8db600]/30 text-[#8db600] text-xs font-medium">
              <Radio className="w-3 h-3 text-[#8db600] animate-pulse" />
              <span className="truncate max-w-[100px]">{activeSession.gateName}</span>
            </div>
          ) : null}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full bg-[#16171b] border border-[#26282e] hover:border-gray-700 transition text-left focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-white leading-tight truncate max-w-[90px]">{user.name}</div>
                  <div className="text-[10px] text-[#8db600] capitalize">{user.role === 'organizer' ? 'Organizer' : 'Gate Staff'}</div>
                </div>

                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-[#8db600]/40" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#8db600]/20 text-[#8db600] flex items-center justify-center text-xs font-bold border border-[#8db600]/30">
                    {user.name.charAt(0)}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-[#16171b] border border-[#26282e] rounded-xl shadow-2xl z-50 p-2 text-xs">
                    <div className="p-2 border-b border-[#26282e] mb-1">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-gray-400 text-[11px] truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-[#8db600] text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{user.assignedEventIds.length} Event Permissions Granted</span>
                      </div>
                    </div>

                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                      Switch Demo Account
                    </div>

                    {INITIAL_USERS.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition ${
                          u.id === user.id ? 'bg-[#8db600]/10 text-[#8db600] font-medium border border-[#8db600]/30' : 'text-gray-300 hover:bg-[#202228]'
                        }`}
                      >
                        <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                        <div className="truncate flex-1">
                          <p className="truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-500 capitalize">{u.role} ({u.assignedEventIds.length} events)</p>
                        </div>
                      </button>
                    ))}

                    <div className="mt-1 pt-1 border-t border-[#26282e]">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-950/30 text-left transition"
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
            <span className="text-xs text-gray-400">Not Logged In</span>
          )}
        </div>
      </div>
    </header>
  );
};
