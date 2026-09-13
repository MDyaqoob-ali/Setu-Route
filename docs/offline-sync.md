# NE-ROUTE Offline Field PWA & Edge-to-Cloud Synchronization

The Field Reporting Progressive Web Application (PWA) operates seamlessly in deep mountain valleys with zero cellular reception, guaranteeing zero data loss for on-ground officers.

---

## 1. Offline Architectural Flow

```
[Field Officer on Mountain Road]
                │
                ▼ (No Cellular Network)
    [Capture GPS + Photo]
                │
                ▼
    [Save to IndexedDB Outbox] ────► UI displays "Saved Offline (Outbox: 1)"
                │
                ▼ (Vehicle returns to network zone)
    [Network Reconnection Detected]
                │
                ▼
    [SyncManager Dispatches Outbox]
                │
                ├──► POST /api/v1/sync/upload (with idempotency_key)
                │
                ▼
    [Backend Acknowledges & Creates Incident]
                │
                ▼
    [IndexedDB Item Marked 'SYNCED' -> Removed]
                │
                ▼
    [UI Displays "SYNC COMPLETE: 18:41 IST"]
```

---

## 2. IndexedDB Storage Architecture (`src/lib/offline-store.ts`)

- **Database Name:** `neroute_offline_db` (Version 1).
- **Object Store:** `incident_outbox` (Primary Key: `id` / Client UUID).
- **Indices:**
  - `by_status`: Indexes `PENDING`, `SYNCING`, `SYNCED`, `FAILED`.
  - `by_created`: Sorted chronological queuing.

```typescript
export interface OfflineIncidentReport {
  id: string;              // Client-generated UUID idempotency key
  type: string;            // landslide, rockfall, flood
  severity: string;        // LOW, MEDIUM, HIGH, CRITICAL
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  district_id: string;
  reporter_name: string;
  reporter_role: string;
  photo_base64?: string;   // Local base64 image data
  photo_name?: string;
  sync_status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  retry_count: number;
  created_at: string;
}
```

---

## 3. Global Connection State Machine (`src/lib/connection-store.ts`)

The application continuously tracks 4 connection states:
1. **`ONLINE` (Green)**: Network latency $< 600\text{ ms}$; full real-time telemetry active.
2. **`DEGRADED` (Yellow)**: Network latency $\ge 600\text{ ms}$ or high packet drop; fallback to essential payloads.
3. **`OFFLINE` (Red)**: Browser disconnected; IndexedDB outbox buffering active.
4. **`SYNCING` (Blue)**: Reconnection established; flushing queued records to cloud.

---

## 4. Idempotency & Deduplication Engine

To eliminate duplicate incident creation during network timeouts or erratic packet drops:
1. Every report generates a cryptographic UUIDv4 `idempotency_key` on the field device.
2. When the backend receives `/api/v1/sync/upload`, it queries `SyncQueue` for `client_id == idempotency_key`.
3. If previously processed, the server immediately returns `ALREADY_SYNCED` with the existing `incident_code` without creating duplicate database rows.
