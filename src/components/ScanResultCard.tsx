import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, X, ChevronDown, Check, AlertCircle, Clock, Zap } from 'lucide-react';
import { Ticket, TicketStatus } from '../types';

interface ScanResultCardProps {
  ticket: Ticket;
  scanTime: string;
  isDuplicateScan?: boolean;
  isOfflineQueued?: boolean;
  isContinuousMode?: boolean;
  onUpdateStatus: (newStatus: TicketStatus, notes?: string) => void;
  onDismiss: () => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({
  ticket,
  scanTime,
  isDuplicateScan = false,
  isOfflineQueued = false,
  isContinuousMode = false,
  onUpdateStatus,
  onDismiss,
}) => {
  const [showDestructiveMenu, setShowDestructiveMenu] = useState(false);
  const [pendingDestructiveStatus, setPendingDestructiveStatus] = useState<TicketStatus | null>(null);

  const isValid = !isDuplicateScan && ticket.status !== 'Blocked' && ticket.status !== 'Cancelled' && ticket.status !== 'Refunded';

  // Status visual variants adhering to status color guidelines:
  // Green (#16A34A) for Valid / Inside
  // Amber (#F59E0B) for Warning / Duplicate
  // Red (#DC2626) for Cancelled / Refunded / Blocked / Invalid
  const getHeaderVariant = () => {
    if (isDuplicateScan || ticket.status === 'Inside') {
      return {
        cardBg: 'border-amber-300',
        bannerBg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-900',
        title: 'DUPLICATE SCAN — ALREADY INSIDE',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
      };
    }

    if (ticket.status === 'Blocked' || ticket.status === 'Cancelled' || ticket.status === 'Refunded') {
      return {
        cardBg: 'border-rose-300',
        bannerBg: 'bg-rose-50 border-rose-200',
        text: 'text-rose-900',
        title: `ENTRY DENIED — ${ticket.status.toUpperCase()}`,
        icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0" />,
      };
    }

    return {
      cardBg: 'border-emerald-300',
      bannerBg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-900',
      title: 'VALID TICKET — READY FOR ENTRY',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    };
  };

  const variant = getHeaderVariant();

  const handleConfirmDestructive = () => {
    if (pendingDestructiveStatus) {
      onUpdateStatus(pendingDestructiveStatus);
      setPendingDestructiveStatus(null);
      setShowDestructiveMenu(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-20 sm:pb-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={onDismiss}
    >
      <div
        className={`w-full max-w-md bg-white border rounded-xl shadow-xl p-4 space-y-3 relative overflow-hidden ${variant.cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Continuous Scan Active Indicator Banner */}
        {isContinuousMode && (
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Continuous Mode • Auto-advancing for next scan</span>
            </div>
            <span className="text-[9px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded uppercase tracking-wider">
              AUTO-SCAN
            </span>
          </div>
        )}

        {/* Status Banner */}
        <div className={`p-2.5 rounded-lg border flex items-center justify-between ${variant.bannerBg}`}>
          <div className="flex items-center gap-2">
            {variant.icon}
            <div className="flex flex-col">
              <span className={`text-xs font-semibold tracking-tight ${variant.text}`}>
                {variant.title}
              </span>
              {isOfflineQueued && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded w-max mt-0.5 border border-amber-200">
                  <Clock className="w-3 h-3" />
                  <span>Validation Queued (Offline)</span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Essential Info Only */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Attendee Name</p>
              <h3 className="text-sm font-semibold text-slate-900 leading-tight">{ticket.attendeeName}</h3>
              <p className="text-xs text-blue-600 font-medium">{ticket.ticketTier} • {ticket.seatOrZone || 'General'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-800 font-medium">
                #{ticket.id}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="text-[10px] text-slate-500 font-normal">Scan Timestamp: </span>
              <span className="font-semibold text-slate-800">{scanTime}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-normal">Current Status: </span>
              <span className={`font-semibold ${
                ticket.status === 'Inside' ? 'text-emerald-700' :
                ticket.status === 'Outside' ? 'text-blue-700' :
                ticket.status === 'Cancelled' || ticket.status === 'Blocked' || ticket.status === 'Refunded' ? 'text-rose-700' :
                'text-slate-800'
              }`}>{ticket.status}</span>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog Overlay for Destructive Actions */}
        {pendingDestructiveStatus && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Confirm Status Change</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Are you sure you want to mark ticket <strong>#{ticket.id}</strong> as <strong>{pendingDestructiveStatus}</strong>?
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                onClick={handleConfirmDestructive}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg transition min-h-[36px] flex items-center justify-center"
              >
                Confirm {pendingDestructiveStatus}
              </button>
              <button
                onClick={() => setPendingDestructiveStatus(null)}
                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg transition min-h-[36px] flex items-center justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons Directly With Card */}
        {!pendingDestructiveStatus && (
          <div className="space-y-2 pt-0.5">
            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateStatus('Inside')}
                className={`py-2.5 px-3 font-medium text-xs rounded-lg border transition flex items-center justify-center gap-1.5 min-h-[40px] ${
                  ticket.status === 'Inside'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Inside</span>
              </button>

              <button
                onClick={() => onUpdateStatus('Outside')}
                className={`py-2.5 px-3 font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 min-h-[40px] ${
                  ticket.status === 'Outside'
                    ? 'bg-blue-50 text-blue-800 border border-blue-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <span>Mark Outside</span>
              </button>
            </div>

            {/* Grouped / Protected Destructive Actions with confirmation dialog */}
            <div>
              <button
                onClick={() => setShowDestructiveMenu(!showDestructiveMenu)}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium flex items-center justify-between transition min-h-[36px]"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Protected Actions (Cancel / Refund / Block)</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDestructiveMenu ? 'rotate-180' : ''}`} />
              </button>

              {showDestructiveMenu && (
                <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 grid grid-cols-3 gap-1.5 animate-in fade-in">
                  <button
                    onClick={() => setPendingDestructiveStatus('Cancelled')}
                    className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-medium transition min-h-[36px]"
                  >
                    Cancel Ticket
                  </button>
                  <button
                    onClick={() => setPendingDestructiveStatus('Refunded')}
                    className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-medium transition min-h-[36px]"
                  >
                    Mark Refunded
                  </button>
                  <button
                    onClick={() => setPendingDestructiveStatus('Blocked')}
                    className="py-1.5 px-2 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-[10px] font-medium transition min-h-[36px]"
                  >
                    Block Entry
                  </button>
                </div>
              )}
            </div>

            {/* Scan Next Button */}
            <button
              onClick={onDismiss}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition text-center min-h-[40px]"
            >
              Scan Next Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
