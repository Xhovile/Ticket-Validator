import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Phone, Mail, Ticket as TicketIcon, AlertCircle } from 'lucide-react';
import { Ticket, TicketStatus } from '../types';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus) => void;
}

function getTicketNumber(ticketId: string): string {
  const parts = ticketId.split(':');
  const number = parts[parts.length - 1];
  return /^\d+$/.test(number) ? number : '';
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onUpdateStatus,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const ticketNumber = getTicketNumber(ticket.id);

  useEffect(() => {
    QRCode.toDataURL(ticket.qrPayload, {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrUrl(url))
      .catch(() => {});
  }, [ticket.qrPayload]);

  const handleSelectStatus = (st: TicketStatus) => {
    if (st === 'Blocked' || st === 'Cancelled' || st === 'Refunded') {
      setPendingStatus(st);
    } else {
      onUpdateStatus(ticket.id, st);
      onClose();
    }
  };

  const handleConfirmDestructive = () => {
    if (pendingStatus) {
      onUpdateStatus(ticket.id, pendingStatus);
      setPendingStatus(null);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden space-y-3 p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <TicketIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Ticket Details</h3>
              <p className="text-[10px] text-slate-500">{ticketNumber ? `Ticket ${ticketNumber}` : 'Ticket'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Close ticket details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center justify-center space-y-1.5 border border-slate-200">
          {qrUrl ? (
            <img src={qrUrl} alt="Ticket QR" className="w-40 h-40 object-contain" />
          ) : (
            <div className="w-40 h-40 bg-slate-200 animate-pulse rounded-md" />
          )}
          <span className="text-[10px] font-medium text-slate-500">Scan code</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Attendee</p>
            <p className="text-sm font-semibold text-slate-900">{ticket.attendeeName}</p>
            <div className="flex items-center justify-between text-slate-600 pt-1 text-[11px]">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{ticket.attendeeEmail}</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{ticket.attendeePhone}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium uppercase">Ticket Tier</p>
              <p className="font-semibold text-slate-900 text-xs mt-0.5">{ticket.ticketTier}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium uppercase">Zone / Seat</p>
              <p className="font-semibold text-slate-900 text-xs mt-0.5">{ticket.seatOrZone || '—'}</p>
            </div>
          </div>

          {pendingStatus ? (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-900">Confirm Status Change</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Are you sure you want to change ticket status to <strong>{pendingStatus}</strong>?
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={handleConfirmDestructive}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg transition min-h-[36px] flex items-center justify-center"
                >
                  Confirm {pendingStatus}
                </button>
                <button
                  onClick={() => setPendingStatus(null)}
                  className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg transition min-h-[36px] flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 pt-0.5">
              <label className="block text-xs font-semibold text-slate-700">Update Gate Status</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Inside', 'Outside', 'Waiting Entry', 'Blocked'] as TicketStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleSelectStatus(st)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition min-h-[36px] ${
                      ticket.status === st
                        ? st === 'Inside'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : st === 'Blocked'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
