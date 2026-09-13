"""
Production-Grade Road Geometry & Network Routing Service for Northeast India.
Queries OpenStreetMap road routing engines (FOSSGIS OSM & Project-OSRM),
stitches multi-waypoint road segments, applies precision curve simplification,
and persists an in-memory & on-disk cache for lightning-fast performance.
"""

import os
import json
import math
import logging
import asyncio
from typing import List, Tuple, Dict, Any, Optional
import httpx

logger = logging.getLogger("neroute.road_geometry")

# Routing engine endpoints (prioritize HTTPS OSM mirrors with high uptime)
ROUTING_ENDPOINTS = [
    "https://routing.openstreetmap.de/routed-car/route/v1/driving",
    "https://router.project-osrm.org/route/v1/driving",
]

DEFAULT_HEADERS = {
    "User-Agent": "SETU-ROUTE-Geospatial-Routing/1.0 (MDoNER-SIH2026; contact@seturoute.gov.in)",
    "Accept": "application/json",
}

# Cache file path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE_DIR = os.path.join(BASE_DIR, "data")
CACHE_FILE = os.path.join(CACHE_DIR, "road_geometry_cache.json")

# In-Memory Cache: cache_key -> (coordinates_list, distance_km)
_ROAD_GEOMETRY_CACHE: Dict[str, Tuple[List[List[float]], float]] = {}


def _load_disk_cache():
    global _ROAD_GEOMETRY_CACHE
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for k, v in data.items():
                    if isinstance(v, list) and len(v) == 2:
                        _ROAD_GEOMETRY_CACHE[k] = (v[0], float(v[1]))
            logger.info(f"Loaded {len(_ROAD_GEOMETRY_CACHE)} cached road geometries from disk.")
    except Exception as e:
        logger.warning(f"Could not load disk cache: {e}")


def _save_disk_cache():
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        # Limit disk cache to latest 2000 routes
        cache_data = {}
        for k, v in list(_ROAD_GEOMETRY_CACHE.items())[-2000:]:
            cache_data[k] = [v[0], v[1]]
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache_data, f)
    except Exception as e:
        logger.warning(f"Could not save disk cache: {e}")


# Initialize cache on module load
_load_disk_cache()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in km between two lat/lon coordinates."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def rdp_simplify(points: List[List[float]], epsilon: float = 0.00004) -> List[List[float]]:
    """
    Iterative Ramer-Douglas-Peucker (RDP) algorithm.
    Preserves all sharp mountain switchbacks, bends, and road curvature
    while discarding redundant collinear points.
    Input/Output points: [[lng, lat], ...]
    """
    if len(points) <= 2:
        return points

    keep = [False] * len(points)
    keep[0] = True
    keep[-1] = True

    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        if end - start <= 1:
            continue

        x1, y1 = points[start][0], points[start][1]
        x2, y2 = points[end][0], points[end][1]
        dx = x2 - x1
        dy = y2 - y1
        denom = math.hypot(dx, dy)

        dmax = 0.0
        index = start
        for i in range(start + 1, end):
            x, y = points[i][0], points[i][1]
            if denom == 0.0:
                dist = math.hypot(x - x1, y - y1)
            else:
                dist = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / denom

            if dist > dmax:
                index = i
                dmax = dist

        if dmax > epsilon:
            keep[index] = True
            stack.append((start, index))
            stack.append((index, end))

    return [points[i] for i in range(len(points)) if keep[i]]


class RoadGeometryService:
    @staticmethod
    def _make_cache_key(points: List[Tuple[float, float]]) -> str:
        return ";".join(f"{round(p[0], 5)},{round(p[1], 5)}" for p in points)

    @classmethod
    async def _query_osrm_single_leg(
        cls,
        p1: Tuple[float, float],
        p2: Tuple[float, float]
    ) -> Optional[Tuple[List[List[float]], float]]:
        """
        Queries OSRM / OpenStreetMap routing engine for a single leg between two (lat, lng) points.
        Returns (coordinates, distance_km) with actual road geometry.
        """
        # Coordinate order for OSRM URL: lon,lat;lon,lat
        coords_str = f"{round(p1[1], 5)},{round(p1[0], 5)};{round(p2[1], 5)},{round(p2[0], 5)}"
        
        async with httpx.AsyncClient(timeout=8.0, headers=DEFAULT_HEADERS, follow_redirects=True) as client:
            for base_url in ROUTING_ENDPOINTS:
                url = f"{base_url}/{coords_str}?overview=full&geometries=geojson"
                try:
                    res = await client.get(url)
                    if res.status_code == 200:
                        data = res.json()
                        if data.get("code") == "Ok" and data.get("routes"):
                            route = data["routes"][0]
                            coords = route["geometry"]["coordinates"]
                            dist_km = round(route.get("distance", 0.0) / 1000.0, 2)
                            if coords and len(coords) >= 2:
                                return coords, dist_km
                except Exception as e:
                    logger.debug(f"Routing request to {base_url} failed: {e}")
                    continue
        return None

    @classmethod
    async def get_road_aligned_geometry(
        cls,
        points: List[Tuple[float, float]],
        input_format: str = "lat_lng"
    ) -> Tuple[List[List[float]], float]:
        """
        Takes a sequence of waypoints and returns:
          (coordinates, total_road_distance_km)
        where coordinates is a dense GeoJSON LineString format [[lng, lat], ...]
        that strictly follows the actual physical road network on OpenStreetMap.
        """
        if not points or len(points) < 2:
            return ([], 0.0)

        # Normalize to (lat, lng)
        lat_lng_points: List[Tuple[float, float]] = []
        for p in points:
            if input_format == "lat_lng":
                lat_lng_points.append((p[0], p[1]))
            else:
                lat_lng_points.append((p[1], p[0]))

        # Deduplicate consecutive points
        dedup_pts = [lat_lng_points[0]]
        for p in lat_lng_points[1:]:
            if abs(p[0] - dedup_pts[-1][0]) > 0.0003 or abs(p[1] - dedup_pts[-1][1]) > 0.0003:
                dedup_pts.append(p)

        if len(dedup_pts) < 2:
            return ([[dedup_pts[0][1], dedup_pts[0][0]]], 0.0)

        cache_key = cls._make_cache_key(dedup_pts)
        if cache_key in _ROAD_GEOMETRY_CACHE:
            return _ROAD_GEOMETRY_CACHE[cache_key]

        # First, try routing all points together if count <= 12
        if len(dedup_pts) <= 12:
            coords_param = ";".join(f"{round(p[1], 5)},{round(p[0], 5)}" for p in dedup_pts)
            async with httpx.AsyncClient(timeout=10.0, headers=DEFAULT_HEADERS, follow_redirects=True) as client:
                for base_url in ROUTING_ENDPOINTS:
                    url = f"{base_url}/{coords_param}?overview=full&geometries=geojson"
                    try:
                        res = await client.get(url)
                        if res.status_code == 200:
                            data = res.json()
                            if data.get("code") == "Ok" and data.get("routes"):
                                route = data["routes"][0]
                                raw_coords = route["geometry"]["coordinates"]
                                dist_km = round(route.get("distance", 0.0) / 1000.0, 1)
                                if raw_coords and len(raw_coords) >= 2:
                                    simplified = rdp_simplify(raw_coords, epsilon=0.00004)
                                    result = (simplified, dist_km)
                                    _ROAD_GEOMETRY_CACHE[cache_key] = result
                                    _save_disk_cache()
                                    return result
                    except Exception as e:
                        logger.debug(f"Direct multi-point route failed on {base_url}: {e}")

        # If direct multi-point route failed or points > 12: query segment by segment and stitch!
        stitched_coords: List[List[float]] = []
        total_dist_km = 0.0
        success_legs = 0

        for i in range(len(dedup_pts) - 1):
            p_start = dedup_pts[i]
            p_end = dedup_pts[i + 1]
            leg_res = await cls._query_osrm_single_leg(p_start, p_end)
            if leg_res:
                leg_coords, leg_dist = leg_res
                success_legs += 1
                total_dist_km += leg_dist
                if not stitched_coords:
                    stitched_coords.extend(leg_coords)
                else:
                    # Avoid duplicate vertex at joint
                    stitched_coords.extend(leg_coords[1:])
            else:
                logger.warning(f"Leg {p_start} -> {p_end} could not be routed by OSRM.")

        if stitched_coords and len(stitched_coords) >= 2:
            simplified = rdp_simplify(stitched_coords, epsilon=0.00004)
            result = (simplified, round(total_dist_km, 1))
            _ROAD_GEOMETRY_CACHE[cache_key] = result
            _save_disk_cache()
            return result

        # If all routing engines failed, return empty geometry with 0.0 distance
        # DO NOT return a straight line!
        logger.error(f"Failed to find road network route for points: {dedup_pts}")
        return ([], 0.0)

    @classmethod
    async def snap_corridor(
        cls,
        coordinates: List[List[float]]
    ) -> Tuple[List[List[float]], float]:
        """
        Snaps a series of GeoJSON [[lng, lat], ...] road coordinates to the physical road network.
        """
        pts = [(c[1], c[0]) for c in coordinates]
        return await cls.get_road_aligned_geometry(pts, input_format="lat_lng")
