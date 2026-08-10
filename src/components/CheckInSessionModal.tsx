import React, { useState } from 'react';
import { ScanLine, X, Check, ShieldCheck, MapPin } from 'lucide-react';
import { EventItem, CheckInSession, User } from '../types';

interface CheckInSessionModalProps {
  event: EventItem;
  user: User;
  onClose: () => void;
  onConfirmStartSession: (gateName: string) => void;
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
    onConfirmStartSession(selectedGate);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden space-y-3.5 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <ScanLine className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Initialize Gate Session</h3>
              <p className="text-[10px] text-slate-500 font-normal">Select gate station and staff logging parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event & Staff Summary */}
        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Event Target</p>
            <p className="font-semibold text-slate-900 truncate">{event.name}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Gate Officer / Staff</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{user.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                {user.role === 'organizer' ? 'Organizer' : 'Gate Authorized'}
              </span>
            </div>
          </div>

          {/* Select Gate Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Gate Station</span>
            </label>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {event.gates.map((gate) => (
                <button
                  key={gate}
                  type="button"
                  onClick={() => setSelectedGate(gate)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition min-h-[40px] ${
                    selectedGate === gate
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{gate}</span>
                  {selectedGate === gate && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-normal flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>Starting a session locks scans to <strong>{selectedGate}</strong> and logs all gate actions under <strong>{user.name}</strong>.</span>
        </div>

        {/* Confirm Button */}
        <div className="pt-1">
          <button
            onClick={handleStart}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-2 min-h-[40px]"
          >
            <ScanLine className="w-4 h-4" />
            <span>Open Scanner for {selectedGate}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
