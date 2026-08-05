import React, { useState } from 'react';
import { History, Download, Trash2, Filter, CheckCircle2, AlertTriangle, XCircle, Info, ShieldCheck } from 'lucide-react';
import { ActivityLogEntry, EventItem } from '../types';

interface ActivityLogViewProps {
  event: EventItem;
  logs: ActivityLogEntry[];
  onClearLogs: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  event,
  logs,
  onClearLogs,
}) => {
  const [filterAction, setFilterAction] = useState<string>('All');

  // Filter logs for current event
  const eventLogs = logs.filter((l) => l.eventId === event.id);

  const filteredLogs = eventLogs.filter((l) => {
    if (filterAction === 'All') return true;
    return l.action.toLowerCase().includes(filterAction.toLowerCase());
  });

  const getLogIcon = (statusBadge: ActivityLogEntry['statusBadge']) => {
    switch (statusBadge) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#8db600] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'danger':
        return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  const handleExportCSV = () => {
    if (eventLogs.length === 0) return;

    const headers = ['Timestamp', 'Event', 'Ticket ID', 'Attendee Name', 'Action', 'Gate', 'Staff', 'Details'];
    const rows = eventLogs.map((l) => [
      l.timestamp,
      event.name,
      l.ticketId || 'N/A',
      l.attendeeName || 'N/A',
      l.action,
      l.gateName,
      l.staffName,
      l.details || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(x => `"${x}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gate_activity_log_${event.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-24 pt-2 px-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Gate Activity Log</span>
            <span className="px-2 py-0.5 rounded-full bg-[#8db600]/10 text-[#8db600] border border-[#8db600]/30 text-[10px] font-bold">
              {eventLogs.length} Events
            </span>
          </h2>
          <p className="text-xs text-gray-400">{event.name} Audit Trail</p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          disabled={eventLogs.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
            eventLogs.length === 0
              ? 'bg-[#16171b] text-gray-600 border-[#26282e] cursor-not-allowed'
              : 'bg-[#8db600]/10 hover:bg-[#8db600]/20 border-[#8db600]/40 text-[#8db600] shadow-md'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
        {['All', 'Checked In', 'Checked Out', 'Duplicate', 'Status', 'Session'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterAction(f)}
            className={`px-3 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap transition ${
              filterAction === f
                ? 'bg-[#8db600]/20 text-[#8db600] border-[#8db600]/50 font-bold'
                : 'bg-[#16171b] text-gray-400 border-[#26282e] hover:text-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center bg-[#16171b] border border-[#26282e] rounded-xl text-gray-400 text-xs space-y-2">
          <History className="w-8 h-8 text-gray-600 mx-auto" />
          <p>No activity logs recorded for this view yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-[#16171b] border border-[#26282e] flex items-start gap-3 transition"
            >
              <div className="mt-0.5">{getLogIcon(log.statusBadge)}</div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-white">{log.action}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{log.timestamp}</span>
                </div>

                {log.attendeeName && (
                  <p className="text-xs text-[#8db600] font-medium">
                    {log.attendeeName} <span className="text-gray-500 font-mono text-[10px]">(#{log.ticketId})</span>
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#26282e]">
                  <span className="text-[#8db600]">{log.gateName}</span>
                  <span className="text-gray-500">Officer: {log.staffName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
