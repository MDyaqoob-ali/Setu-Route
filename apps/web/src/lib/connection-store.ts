/**
 * Global Connection State & Network Quality Monitor for NE-ROUTE.
 * Senses browser online/offline status, measures live backend latency,
 * and maintains sync progress counters.
 */

import { create } from "zustand";
import { offlineStore } from "./offline-store";

export type ConnectionState = "ONLINE" | "DEGRADED" | "OFFLINE" | "SYNCING";

interface ConnectionStore {
  connectionState: ConnectionState;
  latencyMs: number;
  pendingSyncCount: number;
  syncProgress: { current: number; total: number } | null;
  lastSyncTime: string | null;
  setConnectionState: (state: ConnectionState) => void;
  setLatency: (ms: number) => void;
  setPendingCount: (count: number) => void;
  setSyncProgress: (progress: { current: number; total: number } | null) => void;
  setLastSyncTime: (time: string) => void;
  refreshPendingCount: () => Promise<void>;
  checkConnectivity: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connectionState: "ONLINE",
  latencyMs: 45,
  pendingSyncCount: 0,
  syncProgress: null,
  lastSyncTime: null,

  setConnectionState: (state) => set({ connectionState: state }),
  setLatency: (ms) => set({ latencyMs: ms }),
  setPendingCount: (count) => set({ pendingSyncCount: count }),
  setSyncProgress: (progress) => set({ syncProgress: progress }),
  setLastSyncTime: (time) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("neroute_last_sync", time);
    }
    set({ lastSyncTime: time });
  },

  refreshPendingCount: async () => {
    try {
      const count = await offlineStore.getPendingCount();
      set({ pendingSyncCount: count });
    } catch {
      // IndexedDB might not be available during SSR
    }
  },

  checkConnectivity: async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      set({ connectionState: "OFFLINE", latencyMs: -1 });
      return;
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/health", { signal: controller.signal, cache: "no-store" });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        set({
          connectionState: latency > 1200 ? "DEGRADED" : "ONLINE",
          latencyMs: latency,
        });
      } else {
        set({ connectionState: "DEGRADED", latencyMs: latency });
      }
    } catch {
      set({ connectionState: "OFFLINE", latencyMs: -1 });
    }
  },
}));
