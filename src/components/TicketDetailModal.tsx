import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Check, Phone, Mail, Ticket as TicketIcon, Calendar, MapPin, ShieldAlert, Clock } from 'lucide-react';
import { Ticket, TicketStatus } from '../types';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onUpdateStatus,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-[#16171b] border border-[#26282e] rounded-2xl shadow-2xl overflow-hidden space-y-4 p-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26282e] pb-3">
          <div className="flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-[#8db600]" />
            <div>
              <h3 className="text-sm font-bold text-white">BuyMeShow Digital Ticket</h3>
              <p className="text-[10px] text-gray-400">ID: #{ticket.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#202228] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic QR Code */}
        <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center space-y-2 border border-[#8db600]/40 shadow-inner">
          {qrUrl ? (
            <img src={qrUrl} alt="Ticket QR" className="w-44 h-44 object-contain" />
          ) : (
            <div className="w-44 h-44 bg-gray-100 animate-pulse rounded-lg" />
          )}
          <span className="font-mono text-[11px] font-bold text-gray-800 tracking-wider">
            {ticket.qrPayload}
          </span>
        </div>

        {/* Attendee Info */}
        <div className="space-y-2 text-xs">
          <div className="bg-[#0f0f0f] p-3 rounded-xl border border-[#26282e] space-y-1">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Attendee Holder</p>
            <p className="text-base font-bold text-white">{ticket.attendeeName}</p>
            <div className="flex items-center justify-between text-gray-400 pt-1 text-[11px]">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#8db600]" />
                <span>{ticket.attendeeEmail}</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#8db600]" />
                <span>{ticket.attendeePhone}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-[#0f0f0f] p-2.5 rounded-xl border border-[#26282e]">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">Ticket Tier</p>
              <p className="font-bold text-[#8db600] text-xs mt-0.5">{ticket.ticketTier}</p>
            </div>
            <div className="bg-[#0f0f0f] p-2.5 rounded-xl border border-[#26282e]">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">Zone / Seat</p>
              <p className="font-bold text-white text-xs mt-0.5">{ticket.seatOrZone || 'General'}</p>
            </div>
          </div>

          {/* Quick Status Override Sheet */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-gray-300">Update Ticket Gate Status</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['Inside', 'Outside', 'Waiting Entry', 'Blocked'] as TicketStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    onUpdateStatus(ticket.id, st);
                    onClose();
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                    ticket.status === st
                      ? 'bg-[#8db600]/20 text-[#8db600] border-[#8db600]/60'
                      : 'bg-[#0f0f0f] hover:bg-[#202228] text-gray-300 border-[#26282e]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
