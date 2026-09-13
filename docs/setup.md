# NE-ROUTE Setup & Deployment Guide

## Quick Start (Local Development)

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 2. Backend Setup
```bash
cd apps/api

# Install dependencies
pip install -r requirements.txt email-validator

# Run Seed Data (Populates realistic NER geography, roads, vehicles, incidents)
python src/seeds/seed.py

# Run Automated Test Suite
pytest -v

# Start FastAPI Server
uvicorn src.main:app --reload --port 8000
```
Backend API will be running at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup
```bash
cd apps/web

# Install dependencies
npm install

# Start Next.js Development Server
npm run dev
```
Web Command Center will be running at `http://localhost:3000`.

---

### 4. Telemetry Simulator (Optional Demo Daemon)
To simulate live moving vehicles, GPS breadcrumbs, and speed telemetry:
```bash
cd simulation
python engine.py
```

---

## Production Docker Deployment
```bash
# From repository root:
docker-compose -f infrastructure/docker-compose.yml up --build -d
```
All containers (PostgreSQL+PostGIS, Redis, FastAPI, Next.js Web) will be automatically provisioned and networked.
