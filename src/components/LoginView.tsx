import React, { useState } from 'react';
import { QrCode, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('sarah@buymeshow.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const foundUser = INITIAL_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Invalid BuyMeShow credentials. Try one of the quick test accounts below.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#8db600]/10 border border-[#8db600]/30 text-[#8db600] shadow-xl shadow-[#8db600]/10 mb-1">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="inline-block px-3 py-0.5 rounded-full bg-[#8db600]/10 border border-[#8db600]/30 text-[11px] font-semibold text-[#8db600] tracking-wide uppercase">
            BuyMeShow Gate Extension
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Ticket Validator</h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Ultra-fast gate check-in and ticket status management for BuyMeShow event staff.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#16171b] border border-[#26282e] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8db600]/5 rounded-full blur-2xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@buymeshow.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0f0f0f] border border-[#26282e] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#8db600] focus:ring-1 focus:ring-[#8db600] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0f0f0f] border border-[#26282e] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#8db600] focus:ring-1 focus:ring-[#8db600] transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#8db600] hover:bg-[#9ef01a] text-[#0f0f0f] font-bold text-xs rounded-xl shadow-lg shadow-[#8db600]/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <span>Sign In to Gate Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#26282e]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#16171b] px-2 text-gray-500">Or Continue With</span>
            </div>
          </div>

          {/* Sign in with BuyMeShow Option */}
          <button
            onClick={() => onLogin(INITIAL_USERS[0])}
            className="w-full py-2.5 px-4 bg-[#0f0f0f] hover:bg-[#202228] border border-[#26282e] text-gray-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-[#8db600]" />
            <span>Sign in with BuyMeShow OAuth</span>
          </button>
        </div>

        {/* Demo Quick Accounts Presets */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-center">
            Instant Test Demo Accounts
          </div>
          <div className="grid grid-cols-1 gap-2">
            {INITIAL_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => onLogin(u)}
                className="p-3 bg-[#16171b] hover:bg-[#202228] border border-[#26282e] rounded-xl flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-[#26282e]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#8db600]/10 text-[#8db600] flex items-center justify-center text-xs font-bold border border-[#8db600]/30">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-[#8db600] transition flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.assignedEventIds.length === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-red-950/80 text-red-400 text-[9px]">No Permission</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {u.role === 'organizer' ? 'Organizer Admin' : u.assignedGate || 'Gate Staff'} • {u.email}
                    </div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-gray-600 group-hover:text-[#8db600] transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
