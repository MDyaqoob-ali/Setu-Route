# NE-ROUTE REST & WebSocket API Specification

Base URL: `http://localhost:8008/api/v1` (Production: `https://api.neroute.gov.in/api/v1`)  
WebSocket Gateway: `ws://localhost:8008/ws/{channel}`

---

## 1. Authentication & RBAC

### `POST /auth/login`
Authenticates a user and returns a signed JWT bearer token.
- **Request Body:**
  ```json
  {
    "email": "admin@neroute.gov.in",
    "password": "admin123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": "usr-admin-01",
      "email": "admin@neroute.gov.in",
      "role": "SUPER_ADMIN",
      "district_id": null
    }
  }
  ```

---

## 2. Command Center & Search

### `GET /dashboard/summary`
Returns regional accessibility KPIs, active incident counts, vehicles in transit, and corridor risk levels.

### `GET /dashboard/search?q={query}`
Global categorized search across roads, districts, vehicles, deliveries, and incidents.
- **Response `200 OK`:**
  ```json
  {
    "roads": [{ "id": "road-01", "name": "NH-6", "status": "DISRUPTED", "href": "/map?road=road-01" }],
    "vehicles": [{ "id": "veh-01", "name": "AS-01-GC-4482", "status": "MOVING", "href": "/vehicles" }],
    "deliveries": [{ "id": "del-01", "name": "NER-MED-2026-084", "status": "AT_RISK", "href": "/deliveries" }],
    "incidents": [{ "id": "inc-01", "name": "INC-2026-001", "severity": "CRITICAL", "href": "/incidents" }]
  }
  ```

---

## 3. GIS Telemetry & Spatial Features

### `GET /map/features?bbox={minLng,minLat,maxLng,maxLat}&layers=roads,incidents,vehicles,districts,weather`
Returns standard GeoJSON FeatureCollection with dynamic risk styling and clustered points.

---

## 4. Multi-Criteria Graph Routing & Closed-Loop Detours

### `POST /routes/optimize`
Computes priority-aware candidate routes avoiding blocked roads.
- **Request Body:**
  ```json
  {
    "origin_name": "Guwahati Terminal",
    "origin_lat": 26.1445,
    "origin_lng": 91.7362,
    "destination_name": "Silchar District Hospital",
    "dest_lat": 24.8333,
    "dest_lng": 92.7789,
    "vehicle_type": "Heavy Truck (16T)",
    "cargo_priority": "CRITICAL",
    "avoid_blocked_roads": true
  }
  ```
- **Response `200 OK`:** Array of 4 candidate routes (Recommended, Fastest, Lowest-Risk, Bypass) with distance, duration, risk score, and safety rationale.

### `POST /routes/dynamic-reroute`
Operator confirmation endpoint that updates delivery ETA, sets new detour waypoints, generates an actionable alert, and creates an audit log entry.

---

## 5. Offline Field PWA & Idempotent Sync

### `POST /sync/upload`
Idempotent single incident report synchronization with base64 image saving and deduplication.
- **Request Body:**
  ```json
  {
    "idempotency_key": "sync-uuid-88912",
    "type": "landslide",
    "severity": "CRITICAL",
    "title": "Hillside Slip on NH-6 Km 142",
    "description": "200m debris covering carriageway.",
    "latitude": 25.1142,
    "longitude": 92.3615,
    "district_id": "dist-assam-cachar",
    "reporter_name": "Field Officer Cachar",
    "reporter_role": "FIELD_OFFICER",
    "photo_base64": "data:image/jpeg;base64,..."
  }
  ```

### `POST /sync/batch`
Batched sync endpoint for flushing multiple queued offline actions (incidents, location pings).

---

## 6. Simulation & Demonstration Scenarios

### `POST /simulation/scenarios/run`
Executes guided multi-step operational scenarios (`EMERGENCY_MEDICAL_DELIVERY`, `MONSOON_CLOUDBURST`, `SONAPUR_LANDSLIDE`). Returns step-by-step pipeline execution logs and verified dynamic detour details.

---

## 7. System Health & Observability

### `GET /health` - Basic liveness probe.
### `GET /ready` - Comprehensive readiness check (DB connection, ML models, Redis).
### `GET /admin/system-health` - Granular component health matrix (API, DB, Redis, Weather, Telemetry, Sync Queue).
### `GET /admin/audit` - Searchable immutable audit trail.
