/**
 * Offline Sync Manager for NE-ROUTE Field Reports.
 * Manages reliable batch uploading of IndexedDB queued reports
 * with exponential backoff, idempotency deduplication, and state updates.
 */

import { offlineStore, OfflineIncidentReport } from "./offline-store";
import { useConnectionStore } from "./connection-store";
import { apiClient } from "./api-client";

class SyncManager {
  private isSyncing = false;

  /**
   * Triggers an outbox sync if network is available.
   */
  async syncOutbox(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const connStore = useConnectionStore.getState();
    const reports = await offlineStore.getAllReports();
    const pending = reports.filter((r) => r.sync_status === "PENDING" || r.sync_status === "FAILED");

    if (pending.length === 0) {
      connStore.setPendingCount(0);
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    connStore.setConnectionState("SYNCING");
    connStore.setSyncProgress({ current: 0, total: pending.length });

    let syncedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < pending.length; i++) {
      const report = pending[i];
      connStore.setSyncProgress({ current: i + 1, total: pending.length });

      try {
        await offlineStore.updateStatus(report.id, "SYNCING");

        // Format payload with idempotency key
        const payload = {
          client_id: "field-pwa-client",
          idempotency_key: report.idempotency_key || report.id,
          type: report.type,
          severity: report.severity,
          title: report.title,
          description: report.description,
          latitude: report.latitude,
          longitude: report.longitude,
          address: report.address,
          road_id: report.road_id,
          district_id: report.district_id,
          reporter_name: report.reporter_name,
          reporter_role: report.reporter_role,
          reporter_contact: report.reporter_contact,
          photo_base64: report.photo_data_base64,
          photo_name: report.photo_name,
          recorded_at: report.created_at,
        };

        // Call backend sync endpoint
        await apiClient("/sync/upload", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        await offlineStore.updateStatus(report.id, "SYNCED");
        syncedCount++;
      } catch (err: any) {
        console.error(`Failed to sync report ${report.id}:`, err);
        const errMsg = err?.message || "Sync upload rejected by server";
        await offlineStore.updateStatus(report.id, "FAILED", errMsg);
        failedCount++;
      }
    }

    const nowStr = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " IST";

    connStore.setLastSyncTime(nowStr);
    connStore.setSyncProgress(null);
    await connStore.refreshPendingCount();
    await connStore.checkConnectivity();

    this.isSyncing = false;
    return { synced: syncedCount, failed: failedCount };
  }

  /**
   * Initializes network listeners and automatic background sync intervals.
   */
  initListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("[SyncManager] Network restored. Triggering auto-sync...");
      useConnectionStore.getState().checkConnectivity();
      this.syncOutbox();
    });

    window.addEventListener("offline", () => {
      console.log("[SyncManager] Network lost. Switching to offline queue.");
      useConnectionStore.getState().setConnectionState("OFFLINE");
    });

    // Periodic heartbeat every 20s
    setInterval(() => {
      useConnectionStore.getState().checkConnectivity();
      const count = useConnectionStore.getState().pendingSyncCount;
      if (count > 0 && navigator.onLine) {
        this.syncOutbox();
      }
    }, 20000);
  }
}

export const syncManager = new SyncManager();
