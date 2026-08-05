import React, { useState } from 'react';
import { ScanLine, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('sarah@buymesho.com');
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
      setError('Invalid BuyMesho credentials. Try one of the quick test accounts below.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-sm mb-1">
            <ScanLine className="w-6 h-6" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-medium tracking-wide uppercase text-slate-700">
            Gate Control System
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Ticket Validator</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            High-speed gate access control and ticket validation console.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@buymesho.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition min-h-[40px]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition min-h-[40px]"
                  required
                />
              </div>
            </div>

            {/* Primary Button: Solid Blue */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-2 min-h-[40px]"
            >
              <span>Sign In to Gate Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-medium">
              <span className="bg-white px-2 text-slate-400">Or Continue With</span>
            </div>
          </div>

          {/* Secondary Button: White with Gray Border */}
          <button
            onClick={() => onLogin(INITIAL_USERS[0])}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition min-h-[40px]"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Single Sign-On (SSO)</span>
          </button>
        </div>

        {/* Demo Quick Accounts Presets */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 text-center">
            Demo Personnel Credentials
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {INITIAL_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => onLogin(u)}
                className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-left transition group min-h-[48px]"
              >
                <div className="flex items-center gap-2.5">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold border border-slate-200">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-medium text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.assignedEventIds.length === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-medium">No Scope</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {u.role === 'organizer' ? 'Organizer Admin' : u.assignedGate || 'Gate Staff'} • {u.email}
                    </div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
