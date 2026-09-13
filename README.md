# SETU-ROUTE: AI-Based Smart Logistics & Accessibility Intelligence Platform for North Eastern Region (NER)

**Smart India Hackathon 2026**  
**Problem Statement ID:** 26002  
**Ministry / Organization:** Ministry of Development of North Eastern Region (MDoNER), Government of India  
**Tagline:** *See the road before you send the vehicle.*

---

## 1. Executive Summary & Mission

The North Eastern Region (NER) of India comprises critical yet geographically vulnerable supply chain lifelines across 8 states: **Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, and Sikkim**. Mountainous arteries routinely suffer from severe landslides, cloudburst flooding, and subgrade collapses during monsoon periods, threatening deliveries of life-saving medical consignments, FCI food grains, and petroleum convoys.

**SETU-ROUTE** is a production-grade logistics intelligence command platform that connects field telemetry, meteorological risk prediction, and multi-criteria routing into a closed-loop operational workflow:

```
FIELD TELEMETRY / GPS / WEATHER
               │
               ▼
   NETWORK ACCESSIBILITY MAP (8 CORRIDORS)
               │
               ▼
   DISRUPTION RISK ML PREDICTOR (0-100)
               │
               ▼
   MULTI-CRITERIA GRAPH SOLVER (4 CANDIDATE ROUTES)
               │
               ▼
   OPERATOR CONFIRMATION & DYNAMIC REROUTING
               │
               ▼
   PHYSICS-AWARE ETA CALIBRATION (+DELAY DIAGNOSIS)
               │
               ▼
   4-PART ACTIONABLE ALERT GENERATION
               │
               ▼
   IMMUTABLE AUDIT TRAIL & SYSTEM HEALTH MATRIX
```

---

## 2. Key Production Features

1. **Restrained Operational Landing Page (`/landing`):** Authoritative MDoNER portal with regional corridor health indicators, live telemetry status, and quick-launch links.
2. **Interactive Command Center (`/`):** Real-time KPI summaries, active hazard feeds, high-risk corridor alerts, and instantaneous incident triage.
3. **Offline Field Reporting PWA (`/reports`):** Service Worker and IndexedDB store-and-forward outbox with GPS auto-capture, local photo caching, connection state awareness (`ONLINE`, `DEGRADED`, `OFFLINE`, `SYNCING`), and idempotent deduplication.
4. **Multilingual Localization Engine:** Full support for **English (`en`)**, **Hindi (`hi`)**, **Assamese (`as`)**, and **Bengali (`bn`)** across navigation, forms, telemetry metrics, and alerts.
5. **Global Categorized Search (`Ctrl+K` / `Cmd+K`):** Instant grouped search across Roads, Districts, Vehicles, Deliveries, and Incidents.
6. **Notification Center (`/alerts`):** Categorized operational feed (Unread, Critical, All) with direct entity navigation and 1-click acknowledgment.
7. **Live GIS Interactive Map (`/map`):** PostGIS-backed viewport queries, corridor color-grading (`ACCESSIBLE`, `RESTRICTED`, `BLOCKED`), incident markers, and terrain layer switcher.
8. **Multi-Criteria Route Optimizer (`/routes`):** Dijkstra graph optimization providing 4 distinct candidate paths (Recommended, Fastest, Lowest-Risk, Bypass) with safety rationales.
9. **Guided Demonstration Mode & Scenario Launcher:** 11-step interactive runner for the **Emergency Medical Delivery** scenario, simulating cloudburst rainfall, road blockage, automated detour calculation, ETA update, and alert broadcasting.
10. **System Observability & Audit Trail (`/admin`):** Subsystem health matrix (API, DB, Redis, Weather, Telemetry, Sync Queue) and immutable audit log viewer.
11. **Logistics Intelligence & Operational Analytics (`/statistics`):** Executive KPIs (efficiency gains, ETA saved, accessibility, risk reduction), before-vs-after modernization matrix, cost optimization projections, corridor health rankings, and printable MDoNER management impact reports.

---

## 3. Technology Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Vanilla Tailwind CSS, Leaflet/MapLibre GIS, Zustand, IndexedDB, Service Worker PWA, Lucide Icons.
- **Backend:** Python 3.11, FastAPI (ASGI), SQLAlchemy 2.0 Async, PostGIS 16 / SQLite, Redis 7 Pub/Sub, WebSockets, Pydantic V2, Scikit-Learn (Gradient Boosting).
- **Quality Assurance:** pytest (26 automated tests passing 100%), custom high-concurrency load testing suite.
- **Containerization:** Docker multi-stage builds and Docker Compose orchestration.

---

## 4. Quickstart Guide (Local Execution)

### Prerequisites
- Node.js v20+ LTS
- Python 3.11+
- PowerShell (Windows) or Bash (Linux/macOS)

### Step 1: Start FastAPI Backend
```bash
cd apps/api
# Set PATH if needed:
$env:PATH = "d:\tools\node;d:\tools\python;d:\tools\python\Scripts;$env:PATH"

# Run migrations/seeds and start ASGI server:
uvicorn src.main:app --host 0.0.0.0 --port 8008 --reload
```
*Backend Swagger Docs:* [http://localhost:8008/docs](http://localhost:8008/docs)  
*Readiness Check:* [http://localhost:8008/ready](http://localhost:8008/ready)

### Step 2: Start Next.js Frontend
```bash
cd apps/web
$env:PATH = "d:\tools\node;d:\tools\python;d:\tools\python\Scripts;$env:PATH"
npm run dev
```
*Frontend Application:* [http://localhost:3000](http://localhost:3000)  
*Landing Overview:* [http://localhost:3000/landing](http://localhost:3000/landing)

### Step 3: Run Automated Test Suite
```bash
cd apps/api
python -m pytest tests/ -v
```
*(All 26 Unit, Integration, Intelligence, Scenario, and Statistics tests will execute and pass).*

### Step 4: Run High-Concurrency Load Benchmark
```bash
python scripts/load_test.py
```

---

## 5. Demonstration Mode & Scenario Instructions

To showcase the platform to evaluators and government officials:

1. Navigate to the **Command Center** at [http://localhost:3000](http://localhost:3000).
2. Click **"DEMO MODE"** in the top header.
3. Select **"Medical Delivery"** and click **"Run Step-by-Step Scenario"**.
4. Observe the 11-step closed-loop progression:
   - *Step 1:* Critical medicine consignment NER-MED-2026-084 in-transit on NH-6.
   - *Step 2:* Cloudburst rainfall recorded by IMD sensor (48.5 mm/h).
   - *Step 3:* Disruption Risk ML Model predicts elevated hazard (82/100, CRITICAL).
   - *Step 4:* Landslide occurs at Sonapur Valley KM-142; NH-6 marked BLOCKED.
   - *Step 5:* System flags affected vehicle AS-01-GC-4482.
   - *Step 6:* Multi-criteria graph solver calculates alternate bypass via Western Meghalaya SH.
   - *Step 7:* Operator inspects *"Why this Route?"* explainability rationale.
   - *Step 8:* Vehicle dynamically rerouted; waypoints updated.
   - *Step 9:* ETA calibrated (+47 min delay diagnosis).
   - *Step 10:* 4-part actionable alert ALT-DEL-8924 generated.
   - *Step 11:* Audit trail record created in `/admin`.

---

## 6. Default RBAC Credentials

| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin (MDoNER HQ)** | `admin@neroute.gov.in` | `admin123` | Full National Control & System Health |
| **Command Dispatcher** | `regional.assam@neroute.gov.in` | `admin123` | Road Clearance & Reroute Authority |
| **Field Officer (Cachar)** | `field.cachar@neroute.gov.in` | `field123` | Offline Mobile Field Incident Reporting |
| **Fleet Driver** | `driver.biren@neroute.gov.in` | `driver123` | Vehicle Portal & GPS Breadcrumbs |
| **Public Viewer** | `viewer@neroute.gov.in` | `viewer123` | Read-only Regional Accessibility Kiosk |

---

## 7. Documentation Index

- [Architecture & Design Details](docs/architecture.md)
- [REST & WebSocket API Reference](docs/api.md)
- [Database Schema & Data Models](docs/database.md)
- [Multi-Criteria Routing & ETA Engine](docs/routing.md)
- [Machine Learning Disruption Predictor](docs/ml.md)
- [Offline Field PWA & Sync Protocol](docs/offline-sync.md)
- [Deployment & Infrastructure Guide](docs/deployment.md)
- [Testing & Quality Assurance Report](docs/testing.md)
- [Security Audit & Vulnerability Review](docs/security.md)
