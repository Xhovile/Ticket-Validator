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

  const getHeaderVariant = () => {
    if (isDuplicateScan || ticket.status === 'Inside') {
      return {
        cardBg: 'border-amber-200',
        bannerBg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-950',
        title: 'DUPLICATE SCAN — ALREADY INSIDE',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
      };
    }

    if (ticket.status === 'Blocked' || ticket.status === 'Cancelled' || ticket.status === 'Refunded') {
      return {
        cardBg: 'border-rose-200',
        bannerBg: 'bg-rose-50 border-rose-200',
        text: 'text-rose-950',
        title: `ENTRY DENIED — ${ticket.status.toUpperCase()}`,
        icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0" />,
      };
    }

    return {
      cardBg: 'border-emerald-200',
      bannerBg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-950',
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-4 pb-20 backdrop-blur-md animate-in fade-in sm:items-center sm:pb-4"
      onClick={onDismiss}
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border bg-white p-4 shadow-2xl shadow-slate-950/15 space-y-3 ${variant.cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isContinuousMode && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-950">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
              <span>Continuous Mode • Auto-advancing for next scan</span>
            </div>
            <span className="rounded-md bg-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-950">
              AUTO-SCAN
            </span>
          </div>
        )}

        <div className={`flex items-center justify-between rounded-2xl border p-2.5 ${variant.bannerBg}`}>
          <div className="flex items-center gap-2">
            {variant.icon}
            <div className="flex flex-col">
              <span className={`text-xs font-semibold tracking-tight ${variant.text}`}>
                {variant.title}
              </span>
              {isOfflineQueued && (
                <span className="mt-0.5 flex w-max items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                  <Clock className="h-3 w-3" />
                  <span>Validation Queued (Offline)</span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Attendee Name</p>
              <h3 className="text-sm font-semibold leading-tight text-slate-900">{ticket.attendeeName}</h3>
              <p className="text-xs font-medium text-blue-700">{ticket.ticketTier} • {ticket.seatOrZone || 'General'}</p>
            </div>
            <div className="text-right">
              <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-slate-800">
                #{ticket.id}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-600">
            <div>
              <span className="text-[10px] font-normal text-slate-500">Scan Timestamp: </span>
              <span className="font-semibold text-slate-800">{scanTime}</span>
            </div>
            <div>
              <span className="text-[10px] font-normal text-slate-500">Current Status: </span>
              <span className={`font-semibold ${
                ticket.status === 'Inside' ? 'text-emerald-700' :
                ticket.status === 'Outside' ? 'text-slate-700' :
                ticket.status === 'Cancelled' || ticket.status === 'Blocked' || ticket.status === 'Refunded' ? 'text-rose-700' :
                'text-slate-800'
              }`}>{ticket.status}</span>
            </div>
          </div>
        </div>

        {pendingDestructiveStatus && (
          <div className="space-y-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <p className="font-semibold text-rose-900">Confirm Status Change</p>
                <p className="mt-0.5 text-[11px] text-rose-700">
                  Are you sure you want to mark ticket <strong>#{ticket.id}</strong> as <strong>{pendingDestructiveStatus}</strong>?
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                onClick={handleConfirmDestructive}
                className="flex min-h-[36px] items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
              >
                Confirm {pendingDestructiveStatus}
              </button>
              <button
                onClick={() => setPendingDestructiveStatus(null)}
                className="flex min-h-[36px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!pendingDestructiveStatus && (
          <div className="space-y-2 pt-0.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateStatus('Inside')}
                className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-medium transition ${
                  ticket.status === 'Inside'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Inside</span>
              </button>

              <button
                onClick={() => onUpdateStatus('Outside')}
                className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-medium transition ${
                  ticket.status === 'Outside'
                    ? 'border-slate-300 bg-slate-100 text-slate-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Mark Outside</span>
              </button>
            </div>

            <div>
              <button
                onClick={() => setShowDestructiveMenu(!showDestructiveMenu)}
                className="flex min-h-[36px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Protected Actions (Cancel / Refund / Block)</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDestructiveMenu ? 'rotate-180' : ''}`} />
              </button>

              {showDestructiveMenu && (
                <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 p-2 animate-in fade-in">
                  <button
                    onClick={() => setPendingDestructiveStatus('Cancelled')}
                    className="min-h-[36px] rounded-xl bg-rose-600 px-2 py-1.5 text-[10px] font-medium text-white transition hover:bg-rose-700"
                  >
                    Cancel Ticket
                  </button>
                  <button
                    onClick={() => setPendingDestructiveStatus('Refunded')}
                    className="min-h-[36px] rounded-xl bg-rose-600 px-2 py-1.5 text-[10px] font-medium text-white transition hover:bg-rose-700"
                  >
                    Mark Refunded
                  </button>
                  <button
                    onClick={() => setPendingDestructiveStatus('Blocked')}
                    className="min-h-[36px] rounded-xl bg-rose-700 px-2 py-1.5 text-[10px] font-medium text-white transition hover:bg-rose-800"
                  >
                    Block Entry
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onDismiss}
              className="w-full min-h-[40px] rounded-2xl bg-slate-950 py-2.5 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              Scan Next Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
};