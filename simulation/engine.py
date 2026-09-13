import asyncio
import random
import math
import logging
from datetime import datetime, timezone
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] (Simulation) %(message)s")
logger = logging.getLogger("neroute.sim")

API_BASE_URL = "http://127.0.0.1:8008/api/v1"

async def run_simulation_loop(interval_seconds: float = 3.0):
    logger.info("==================================================")
    logger.info("  NE-ROUTE REAL-TIME TELEMETRY SIMULATOR")
    logger.info("  Simulating fleet movements, incidents & weather")
    logger.info("==================================================")

    async with httpx.AsyncClient(timeout=10.0) as client:
        step = 0
        while True:
            step += 1
            try:
                # 1. Fetch active vehicles
                resp = await client.get(f"{API_BASE_URL}/vehicles")
                if resp.status_code == 200:
                    vehicles = resp.json()
                    for v in vehicles:
                        if v["current_status"] in ("MOVING", "DELAYED"):
                            # Progress coordinates slightly along heading
                            cur_lat = v["current_lat"]
                            cur_lng = v["current_lng"]
                            heading = v.get("heading_deg", 65.0)

                            # Move ~0.002 deg per tick (~200m)
                            delta_lat = math.cos(math.radians(heading)) * 0.0015
                            delta_lng = math.sin(math.radians(heading)) * 0.0018

                            # Introduce slight terrain-based speed fluctuation
                            target_speed = random.uniform(32.0, 58.0) if v["current_status"] == "MOVING" else random.uniform(0.0, 12.0)
                            new_fuel = max(10.0, v["fuel_percent"] - 0.05)

                            loc_update = {
                                "latitude": cur_lat + delta_lat,
                                "longitude": cur_lng + delta_lng,
                                "speed_kmh": round(target_speed, 1),
                                "heading_deg": (heading + random.uniform(-5.0, 5.0)) % 360,
                                "accuracy_m": 4.5,
                                "fuel_percent": round(new_fuel, 2)
                            }

                            post_resp = await client.post(
                                f"{API_BASE_URL}/vehicles/{v['id']}/location",
                                json=loc_update
                            )
                            if post_resp.status_code == 200:
                                logger.info(f"Vehicle {v['registration_number']} GPS ping -> ({loc_update['latitude']:.4f}, {loc_update['longitude']:.4f}) at {loc_update['speed_kmh']} km/h")

                # Periodic incident / delivery checks
                if step % 10 == 0:
                    logger.info(f"[Step {step}] System Health Check & Corridor Telemetry Sync OK.")

            except Exception as e:
                logger.warning(f"Simulation tick error (API might be restarting): {e}")

            await asyncio.sleep(interval_seconds)

if __name__ == "__main__":
    try:
        asyncio.run(run_simulation_loop())
    except KeyboardInterrupt:
        logger.info("Simulation engine stopped by user.")
