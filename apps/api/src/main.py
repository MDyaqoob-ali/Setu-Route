import os
import sys
from contextlib import asynccontextmanager

# Add project root so ml package is accessible
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

import logging
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from src.core.config import settings
from src.core.database import init_db
from src.ws.connection_manager import ws_manager
import asyncio
from src.routers import (
    auth, dashboard, incidents, vehicles, deliveries, roads, map, alerts, routes, sync, risk, simulation, admin, statistics, intelligence
)
from src.services.external_intelligence import ingestion_coordinator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("neroute.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure upload dir and database tables exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("Initializing NE-ROUTE database...")
    await init_db()
    logger.info("NE-ROUTE Database initialized successfully.")

    # Trigger background ingestion cycle for external real-time intelligence
    logger.info("Triggering background external intelligence ingestion cycle...")
    asyncio.create_task(ingestion_coordinator.sync_all_sources())

    yield
    logger.info("Shutting down NE-ROUTE API...")

app = FastAPI(
    title="NE-ROUTE API",
    description="AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (MDoNER - SIH 2026)",
    version="1.0.0",
    lifespan=lifespan
)

# GZip compression for fast network payloads
app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local dev & demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded incident photos
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(vehicles.router, prefix=settings.API_V1_STR)
app.include_router(deliveries.router, prefix=settings.API_V1_STR)
app.include_router(roads.router, prefix=settings.API_V1_STR)
app.include_router(roads.router)  # Also mount at root for /roads/{id}/health
app.include_router(map.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(routes.router, prefix=settings.API_V1_STR)
app.include_router(sync.router, prefix=settings.API_V1_STR)
app.include_router(risk.router, prefix=settings.API_V1_STR)
app.include_router(risk.router)  # Also mount at root for /risk/corridors/{id}
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(statistics.router, prefix=settings.API_V1_STR)
app.include_router(intelligence.router, prefix=settings.API_V1_STR)
app.include_router(intelligence.router)  # Also mount at root for direct /intelligence/summary

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "NE-ROUTE API",
        "version": "1.0.0",
        "region": "North Eastern Region (NER)",
        "agency": "Ministry of Development of North Eastern Region (MDoNER)"
    }

@app.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "database": "connected",
        "prediction_engine": "online",
        "disruption_model": "loaded",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Real-time WebSocket Gateway
@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await ws_manager.connect(websocket, channel)
    try:
        while True:
            # Keep-alive ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel)
    except Exception as e:
        logger.warning(f"WebSocket error on channel {channel}: {e}")
        ws_manager.disconnect(websocket, channel)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host=settings.HOST, port=settings.PORT, reload=True)
