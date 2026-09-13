# SETU-ROUTE Deployment & Operations Guide

This guide covers local developer setup, Docker containerization, and production cloud deployment for the SETU-ROUTE platform.

---

## 1. Prerequisites

- **Node.js**: v20+ LTS
- **Python**: v3.11+
- **Docker & Docker Compose**: v24+
- **PostgreSQL 16 + PostGIS**: (Optional for production; SQLite provided for standalone runtime)

---

## 2. Local Developer Quickstart

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/MDyaqoob-ali/Setu-Route.git
cd Setu-Route
cp .env.example .env
```

### Step 2: Backend Setup
```bash
cd apps/api
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt email-validator
# Database tables and seed data automatically initialize on first startup
uvicorn src.main:app --host 0.0.0.0 --port 8008 --reload
```

### Step 3: Frontend Web Setup
```bash
cd apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Production Docker Deployment

### Multi-Container Stack (`infrastructure/docker-compose.yml`)
```bash
cd infrastructure
docker compose up -d --build
```

### Container Services:
1. **`neroute-web`**: Next.js 14 SSR frontend served on port `3000`.
2. **`neroute-api`**: FastAPI ASGI server with Uvicorn workers on port `8000`.
3. **`neroute-postgres`**: PostGIS 16 spatial database with automatic schema initialization.
4. **`neroute-redis`**: Redis 7 in-memory cache and real-time Pub/Sub broker.

### Health Probes:
- **Liveness:** `http://localhost:8000/health` (HTTP 200)
- **Readiness:** `http://localhost:8000/ready` (HTTP 200 + DB/Model validation)
- **Observability:** `http://localhost:8000/api/v1/admin/system-health`

---

## 4. Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `ENVIRONMENT` | `production` | Deployment environment mode |
| `DATABASE_URL` | `sqlite+aiosqlite:///./neroute.db` | SQLAlchemy async connection URI |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis caching & WebSocket broker |
| `SECRET_KEY` | `***` | JWT signing secret key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | JWT token validity window (8 hours) |
| `UPLOAD_DIR` | `uploads/` | Storage location for incident photo assets |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8008/api/v1` | Frontend API gateway base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8008/ws` | Frontend WebSocket gateway URI |
