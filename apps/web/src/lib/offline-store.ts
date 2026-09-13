/**
 * Robust IndexedDB Offline Storage & Sync Queue for NE-ROUTE Field Officers.
 * Supports offline report creation, binary photo caching, idempotency keys,
 * retry backoff, and conflict resolution.
 */

export interface OfflineIncidentReport {
  id: string; // Local UUID or idempotency key
  idempotency_key: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  address?: string;
  road_id?: string;
  district_id: string;
  reporter_name: string;
  reporter_role: string;
  reporter_contact?: string;
  photo_data_base64?: string; // Stored offline in IndexedDB
  photo_name?: string;
  sync_status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  retry_count: number;
  error_message?: string;
  created_at: string;
  synced_at?: string;
}

const DB_NAME = "neroute_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "incident_outbox";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("sync_status", "sync_status", { unique: false });
        store.createIndex("created_at", "created_at", { unique: false });
        store.createIndex("idempotency_key", "idempotency_key", { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStore = {
  /**
   * Save an incident report locally to IndexedDB outbox.
   */
  async saveReport(report: Omit<OfflineIncidentReport, "id" | "sync_status" | "retry_count" | "created_at">): Promise<OfflineIncidentReport> {
    const db = await openDB();
    const id = `off-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fullReport: OfflineIncidentReport = {
      ...report,
      id,
      sync_status: "PENDING",
      retry_count: 0,
      created_at: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fullReport);

      req.onsuccess = () => resolve(fullReport);
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Get all reports in outbox.
   */
  async getAllReports(): Promise<OfflineIncidentReport[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = req.result as OfflineIncidentReport[];
        // Sort descending by creation date
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Get count of pending reports waiting for sync.
   */
  async getPendingCount(): Promise<number> {
    const all = await this.getAllReports();
    return all.filter((r) => r.sync_status === "PENDING" || r.sync_status === "FAILED").length;
  },

  /**
   * Update report sync status.
   */
  async updateStatus(id: string, status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED", error?: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as OfflineIncidentReport;
        if (!item) {
          resolve();
          return;
        }

        item.sync_status = status;
        if (status === "SYNCED") {
          item.synced_at = new Date().toISOString();
        } else if (status === "FAILED") {
          item.retry_count += 1;
          item.error_message = error;
        }

        const putReq = store.put(item);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },

  /**
   * Remove synced report from local outbox.
   */
  async deleteReport(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Clear all synced reports older than 7 days to free storage.
   */
  async cleanupOldSynced(): Promise<void> {
    const reports = await this.getAllReports();
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const r of reports) {
      if (r.sync_status === "SYNCED" && r.synced_at && new Date(r.synced_at).getTime() < cutoff) {
        await this.deleteReport(r.id);
      }
    }
  },
};
