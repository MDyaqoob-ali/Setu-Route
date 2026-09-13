"""
Script to snap all 18 regional arterial highway corridors in the database
to actual OpenStreetMap physical road geometries.
"""

import os
import sys
import asyncio

_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_api_root = os.path.join(_root, "apps", "api")
if _root not in sys.path:
    sys.path.insert(0, _root)
if _api_root not in sys.path:
    sys.path.insert(0, _api_root)

from sqlalchemy import select
from src.core.database import AsyncSessionLocal
from src.models import Road
from src.services.road_geometry_service import RoadGeometryService


async def snap_corridors():
    print("[*] Connecting to NE-ROUTE database...")
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Road))
        roads = res.scalars().all()
        print(f"[*] Found {len(roads)} road corridors to examine.")

        for r in roads:
            if not r.geometry_geojson or not r.geometry_geojson.get("coordinates"):
                continue

            orig_coords = r.geometry_geojson["coordinates"]
            # Convert [lng, lat] to [(lat, lng), ...]
            pts = [(c[1], c[0]) for c in orig_coords]
            print(f"[*] Snapping {r.code} ({r.name[:35]}...) from {len(orig_coords)} coarse points...")

            snapped_coords, dist_km = await RoadGeometryService.get_road_aligned_geometry(pts, input_format="lat_lng")
            if snapped_coords and len(snapped_coords) > len(orig_coords):
                r.geometry_geojson = {
                    "type": "LineString",
                    "coordinates": snapped_coords
                }
                if dist_km > 0:
                    r.total_length_km = dist_km
                print(f"    -> [SUCCESS] Snapped to {len(snapped_coords)} real road points, {dist_km} km.")
            else:
                print(f"    -> [INFO] Kept existing points ({len(orig_coords)}).")

        await db.commit()
        print("[+] All road corridors updated in database successfully!")


if __name__ == "__main__":
    asyncio.run(snap_corridors())
