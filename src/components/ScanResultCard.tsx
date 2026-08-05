import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, X, ChevronDown, Check } from 'lucide-react';
import { Ticket, TicketStatus } from '../types';

interface ScanResultCardProps {
  ticket: Ticket;
  scanTime: string;
  isDuplicateScan?: boolean;
  onUpdateStatus: (newStatus: TicketStatus, notes?: string) => void;
  onDismiss: () => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({
  ticket,
  scanTime,
  isDuplicateScan = false,
  onUpdateStatus,
  onDismiss,
}) => {
  const [showDestructiveMenu, setShowDestructiveMenu] = useState(false);

  // Status visual variants
  const getHeaderVariant = () => {
    if (isDuplicateScan || ticket.status === 'Inside') {
      return {
        bg: 'bg-amber-950/90 border-amber-500/60',
        text: 'text-amber-300',
        title: 'DUPLICATE SCAN — ALREADY INSIDE',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      };
    }

    if (ticket.status === 'Blocked' || ticket.status === 'Cancelled' || ticket.status === 'Refunded') {
      return {
        bg: 'bg-red-950/90 border-red-500/60',
        text: 'text-red-300',
        title: `ENTRY DENIED — ${ticket.status.toUpperCase()}`,
        icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
      };
    }

    return {
      bg: 'bg-[#8db600]/10 border-[#8db600]/40',
      text: 'text-[#8db600]',
      title: 'VALID TICKET — READY FOR ENTRY',
      icon: <CheckCircle2 className="w-5 h-5 text-[#8db600] shrink-0" />,
    };
  };

  const variant = getHeaderVariant();

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-[#16171b] border border-[#26282e] rounded-2xl shadow-2xl p-4 space-y-3 relative overflow-hidden ring-1 ring-white/10">

        {/* Status Banner */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${variant.bg}`}>
          <div className="flex items-center gap-2">
            {variant.icon}
            <span className={`text-xs font-bold tracking-tight ${variant.text}`}>
              {variant.title}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-black/40 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Essential Info Only (Name, Ticket ID, Checked time) */}
        <div className="bg-[#0f0f0f] rounded-xl p-3 border border-[#26282e] space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Attendee Name</p>
              <h3 className="text-base font-bold text-white leading-tight">{ticket.attendeeName}</h3>
              <p className="text-xs text-[#8db600] font-medium">{ticket.ticketTier} • {ticket.seatOrZone || 'General'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#16171b] border border-[#26282e] font-mono text-gray-300">
                #{ticket.id}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#26282e] flex items-center justify-between text-xs text-gray-400">
            <div>
              <span className="text-[10px] text-gray-500">Scan Timestamp: </span>
              <span className="font-semibold text-gray-300">{scanTime}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500">Current Status: </span>
              <span className="font-semibold text-white">{ticket.status}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Directly With Card */}
        <div className="space-y-2 pt-1">
          {/* Primary Action Buttons: Inside & Outside */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateStatus('Inside')}
              className={`py-2.5 px-3 font-bold text-xs rounded-xl border transition flex items-center justify-center gap-1.5 ${
                ticket.status === 'Inside'
                  ? 'bg-[#8db600]/20 text-[#8db600] border-[#8db600]/60'
                  : 'bg-[#8db600] hover:bg-[#9ef01a] text-[#0f0f0f] border-[#8db600] shadow-md shadow-[#8db600]/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Mark Inside</span>
            </button>

            <button
              onClick={() => onUpdateStatus('Outside')}
              className={`py-2.5 px-3 font-bold text-xs rounded-xl border transition flex items-center justify-center gap-1.5 ${
                ticket.status === 'Outside'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/80'
                  : 'bg-[#0f0f0f] hover:bg-[#202228] text-gray-200 border-[#26282e]'
              }`}
            >
              <span>Mark Outside</span>
            </button>
          </div>

          {/* Grouped / Protected Destructive Actions to avoid accidental mistakes */}
          <div>
            <button
              onClick={() => setShowDestructiveMenu(!showDestructiveMenu)}
              className="w-full py-1.5 px-2 bg-[#0f0f0f] hover:bg-[#202228] border border-[#26282e] rounded-lg text-gray-400 text-[11px] font-medium flex items-center justify-between transition"
            >
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Protected Actions (Cancel / Refund / Block)</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDestructiveMenu ? 'rotate-180' : ''}`} />
            </button>

            {showDestructiveMenu && (
              <div className="mt-2 p-2 rounded-xl bg-red-950/30 border border-red-900/40 grid grid-cols-3 gap-1.5 animate-in fade-in">
                <button
                  onClick={() => onUpdateStatus('Cancelled')}
                  className="py-1.5 px-2 bg-red-900/40 hover:bg-red-900/70 border border-red-700/50 text-red-200 rounded-lg text-[10px] font-semibold transition"
                >
                  Cancel Ticket
                </button>
                <button
                  onClick={() => onUpdateStatus('Refunded')}
                  className="py-1.5 px-2 bg-red-900/40 hover:bg-red-900/70 border border-red-700/50 text-red-200 rounded-lg text-[10px] font-semibold transition"
                >
                  Mark Refunded
                </button>
                <button
                  onClick={() => onUpdateStatus('Blocked')}
                  className="py-1.5 px-2 bg-red-950 hover:bg-red-900 border border-red-600 text-red-300 rounded-lg text-[10px] font-bold transition"
                >
                  Block Entry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scan Next Button */}
        <button
          onClick={onDismiss}
          className="w-full py-2 bg-[#0f0f0f] hover:bg-[#202228] text-gray-300 text-xs font-semibold rounded-xl border border-[#26282e] transition text-center"
        >
          Scan Next Ticket
        </button>
      </div>
    </div>
  );
};
