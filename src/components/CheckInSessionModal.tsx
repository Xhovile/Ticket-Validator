import React, { useState } from 'react';
import { Radio, X, Check, ShieldCheck, MapPin } from 'lucide-react';
import { EventItem, CheckInSession, User } from '../types';

interface CheckInSessionModalProps {
  event: EventItem;
  user: User;
  onClose: () => void;
  onConfirmStartSession: (session: CheckInSession) => void;
}

export const CheckInSessionModal: React.FC<CheckInSessionModalProps> = ({
  event,
  user,
  onClose,
  onConfirmStartSession,
}) => {
  const [selectedGate, setSelectedGate] = useState<string>(
    user.assignedGate || event.gates[0] || 'Gate A - Main Entrance'
  );

  const handleStart = () => {
    const newSession: CheckInSession = {
      id: `sess-${Date.now()}`,
      eventId: event.id,
      eventName: event.name,
      gateName: selectedGate,
      staffName: user.name,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      active: true,
      scanCount: 0,
    };
    onConfirmStartSession(newSession);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-[#16171b] border border-[#26282e] rounded-2xl shadow-2xl overflow-hidden space-y-4 p-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#26282e] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8db600]/10 border border-[#8db600]/40 flex items-center justify-center text-[#8db600]">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Initialize Check-in Session</h3>
              <p className="text-[10px] text-gray-400">Set active gate & staff log parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#202228] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event & Staff Summary */}
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-[#0f0f0f] rounded-xl border border-[#26282e] space-y-1">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Event Target</p>
            <p className="font-bold text-white truncate">{event.name}</p>
          </div>

          <div className="p-3 bg-[#0f0f0f] rounded-xl border border-[#26282e] space-y-1">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Gate Officer / Staff</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#8db600]">{user.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#8db600]/10 border border-[#8db600]/30 text-[#8db600] font-medium">
                {user.role === 'organizer' ? 'Organizer' : 'Gate Authorized'}
              </span>
            </div>
          </div>

          {/* Select Gate Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#8db600]" />
              <span>Select Active Gate Station</span>
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {event.gates.map((gate) => (
                <button
                  key={gate}
                  type="button"
                  onClick={() => setSelectedGate(gate)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                    selectedGate === gate
                      ? 'bg-[#8db600]/20 border-[#8db600] text-[#8db600] font-bold'
                      : 'bg-[#0f0f0f] border-[#26282e] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="truncate">{gate}</span>
                  {selectedGate === gate && <Check className="w-4 h-4 text-[#8db600] shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-xl bg-[#8db600]/10 border border-[#8db600]/30 text-[11px] text-[#8db600] flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#8db600] shrink-0 mt-0.5" />
          <span>Starting a session locks scans to <strong>{selectedGate}</strong> and logs all gate actions under <strong>{user.name}</strong>.</span>
        </div>

        {/* Confirm Button */}
        <div className="pt-2">
          <button
            onClick={handleStart}
            className="w-full py-3 bg-[#8db600] hover:bg-[#9ef01a] text-[#0f0f0f] font-bold text-xs rounded-xl shadow-lg shadow-[#8db600]/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            <Radio className="w-4 h-4" />
            <span>Open Scanner for {selectedGate}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
