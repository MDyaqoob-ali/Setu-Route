"use client";

import React, { useEffect } from "react";
import { useConnectionStore } from "@/lib/connection-store";
import { syncManager } from "@/lib/sync-manager";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from "lucide-react";

export const ConnectionIndicator: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  const {
    connectionState,
    latencyMs,
    pendingSyncCount,
    syncProgress,
    lastSyncTime,
    refreshPendingCount,
    checkConnectivity,
  } = useConnectionStore();

  useEffect(() => {
    setMounted(true);
    syncManager.initListeners();
    refreshPendingCount();
    checkConnectivity();
  }, [refreshPendingCount, checkConnectivity]);

  const handleManualSync = () => {
    syncManager.syncOutbox();
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-[11px]">ONLINE</span>
          <span className="text-[10px] text-emerald-600/80 font-mono">(45ms)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* State Badge */}
      {connectionState === "ONLINE" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-[11px]">ONLINE</span>
          {latencyMs > 0 && <span className="text-[10px] text-emerald-600/80 font-mono">({latencyMs}ms)</span>}
        </div>
      )}

      {connectionState === "DEGRADED" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          <span className="font-semibold text-[11px]">DEGRADED</span>
          {latencyMs > 0 && <span className="text-[10px] text-amber-600/80 font-mono">({latencyMs}ms)</span>}
        </div>
      )}

      {connectionState === "OFFLINE" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700">
          <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="font-semibold text-[11px]">OFFLINE</span>
        </div>
      )}

      {connectionState === "SYNCING" && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700">
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          <span className="font-semibold text-[11px]">
            {syncProgress ? `SYNCING (${syncProgress.current}/${syncProgress.total})` : "SYNCING..."}
          </span>
        </div>
      )}

      {/* Pending Sync Count Pill / Button */}
      {pendingSyncCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={connectionState === "SYNCING"}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-xs transition-all shadow-xs"
          title="Click to sync outbox queue with server"
        >
          <RefreshCw className={`w-3 h-3 ${connectionState === "SYNCING" ? "animate-spin" : ""}`} />
          <span>{pendingSyncCount} waiting to sync</span>
        </button>
      )}

      {/* Last Sync Timestamp */}
      {lastSyncTime && (
        <div className="hidden 2xl:flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Sync: {lastSyncTime}</span>
        </div>
      )}
    </div>
  );
};

