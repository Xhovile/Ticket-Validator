import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Clock, CloudOff } from 'lucide-react';
import { QueuedValidation } from '../utils/offlineSyncManager';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  queuedItems: QueuedValidation[];
  isSyncing: boolean;
  onToggleSimulatedOffline: () => void;
  onSyncNow: () => void;
  onClearQueue: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  isSimulatedOffline,
  queuedItems,
  isSyncing,
  onToggleSimulatedOffline,
  onSyncNow,
  onClearQueue,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const effectiveOffline = !isOnline || isSimulatedOffline;

  return (
    <div className="w-full bg-slate-900 text-slate-100 text-xs border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between flex-wrap gap-2">
        {/* Connection & Queue Info */}
        <div className="flex items-center gap-2">
          {effectiveOffline ? (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>
                {isSimulatedOffline && !isOnline
                  ? 'Offline (No Connection)'
                  : isSimulatedOffline
                  ? 'Simulated Offline'
                  : 'Device Offline'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online & Synced</span>
            </div>
          )}

          {/* Queue Count Pill */}
          {queuedItems.length > 0 ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[11px] font-medium hover:bg-amber-500/25 transition"
            >
              <Clock className="w-3 h-3" />
              <span>{queuedItems.length} Pending Sync</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : (
            effectiveOffline && (
              <span className="text-[11px] text-slate-400 font-normal">
                Scans will queue locally
              </span>
            )
          )}
        </div>

        {/* Actions Controls */}
        <div className="flex items-center gap-2">
          {/* Manual Sync Now Button */}
          {queuedItems.length > 0 && (
            <button
              onClick={onSyncNow}
              disabled={isSyncing || (!isOnline && !isSimulatedOffline)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-[11px] transition shadow-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}

          {/* Simulated Offline Toggle */}
          <button
            onClick={onToggleSimulatedOffline}
            className={`px-2.5 py-1 rounded-md border text-[10px] font-medium transition flex items-center gap-1 ${
              isSimulatedOffline
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80'
            }`}
            title="Toggle offline mode for testing queue"
          >
            <CloudOff className="w-3 h-3" />
            <span>{isSimulatedOffline ? 'Disable Test Offline' : 'Test Offline Mode'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Queue Drawer */}
      {isExpanded && queuedItems.length > 0 && (
        <div className="bg-slate-950 border-t border-slate-800 p-3 max-h-60 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
            <span>QUEUED VALIDATIONS ({queuedItems.length})</span>
            <button
              onClick={onClearQueue}
              className="text-rose-400 hover:text-rose-300 text-[10px] underline"
            >
              Clear Queue
            </button>
          </div>

          <div className="space-y-1.5">
            {queuedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">#{item.ticketId}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 text-[10px] font-medium border border-amber-500/20">
                      {item.newStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.attendeeName} • Gate: {item.gateName} • {item.timestamp}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-[11px] font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Queued</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
