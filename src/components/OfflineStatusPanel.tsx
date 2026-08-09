import React from "react";
import { WifiOff, Wifi, Clock3, RefreshCw, TriangleAlert } from "lucide-react";
import type { OfflineQueueItem } from "../lib/offlineDb";

export function OfflineStatusPanel({
  isOnline,
  isSyncing,
  queuedItems,
  lastSyncAt,
  onSyncNow,
  onClearQueue,
}: {
  isOnline: boolean;
  isSyncing: boolean;
  queuedItems: OfflineQueueItem[];
  lastSyncAt: string | null;
  onSyncNow: () => void;
  onClearQueue: () => void;
}) {
  const pendingCount = queuedItems.filter((item) => item.status === "pending" || item.status === "sending").length;

  return (
    <div className="mx-auto mt-3 max-w-md space-y-2 px-4">
      <div className={`rounded-2xl border p-3 text-xs shadow-sm ${isOnline ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        <div className="flex items-start gap-2">
          {isOnline ? <Wifi className="mt-0.5 h-4 w-4" /> : <WifiOff className="mt-0.5 h-4 w-4" />}
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{isOnline ? "Live mode" : "Offline mode"}</div>
            <div className="mt-0.5 text-[11px] leading-5">
              {isOnline
                ? `Validator is connected. ${pendingCount} queued validation${pendingCount === 1 ? "" : "s"} waiting to sync.`
                : "No network. The validator is using the downloaded snapshot and will queue scans locally."}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock3 className="h-4 w-4" />
            <span className="font-medium">Sync status</span>
          </div>
          <div className="text-[11px] text-slate-500">{lastSyncAt ? `Last sync: ${lastSyncAt}` : "No successful sync yet"}</div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onSyncNow}
            disabled={!isOnline || isSyncing || pendingCount === 0}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-[11px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync now"}
          </button>
          <button
            type="button"
            onClick={onClearQueue}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear queue
          </button>
        </div>
      </div>

      {queuedItems.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <TriangleAlert className="h-4 w-4 text-amber-600" />
            <span className="font-medium">Unsynced actions</span>
          </div>
          <div className="mt-2 space-y-2">
            {queuedItems.slice(0, 4).map((item) => (
              <div key={item.queueId} className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-[11px]">
                <div className="font-medium text-slate-800">{item.ticketId}</div>
                <div className="mt-0.5 text-slate-500">
                  {item.newStatus} · {item.gateName} · {item.staffName}
                </div>
                <div className="mt-0.5 text-slate-400">{item.status === "accepted" ? "Synced" : item.status === "sending" ? "Sending..." : "Queued"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
