"""
Road Geometry Snapping Service for NE-ROUTE.
Snaps corridor and route waypoints directly to the physical road network on OpenStreetMap using OSRM,
applies iterative Ramer-Douglas-Peucker (RDP) curve simplification, and provides robust local fallbacks.
"""

import math
import logging
import asyncio
from typing import List, Tuple, Dict, Any, Optional
import httpx

logger = logging.getLogger("ne_route.road_geometry")

# In-Memory Cache for snapped road geometries: key -> (coordinates_list, distance_km)
_ROAD_GEOMETRY_CACHE: Dict[str, Tuple[List[List[float]], float]] = {}

OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"


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


def rdp_simplify(points: List[List[float]], epsilon: float = 0.00008) -> List[List[float]]:
    """
    Iterative Ramer-Douglas-Peucker (RDP) algorithm.
    Reduces polyline vertex density while preserving sharp mountain highway switchbacks.
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


def catmull_rom_spline(
    control_points: List[List[float]], points_per_segment: int = 15
) -> List[List[float]]:
    """
    Catmull-Rom spline fallback to generate smooth highway-like curve transitions
    when network services are unreachable or offline.
    """
    if len(control_points) < 2:
        return control_points

    # Duplicate start and end to form boundary tangents
    pts = [control_points[0]] + control_points + [control_points[-1]]
    result: List[List[float]] = []

    for i in range(len(pts) - 3):
        p0, p1, p2, p3 = pts[i], pts[i + 1], pts[i + 2], pts[i + 3]
        for t_idx in range(points_per_segment):
            t = t_idx / float(points_per_segment)
            t2 = t * t
            t3 = t2 * t

            # Basis matrix for standard uniform Catmull-Rom
            x = 0.5 * (
                (2.0 * p1[0])
                + (-p0[0] + p2[0]) * t
                + (2.0 * p0[0] - 5.0 * p1[0] + 4.0 * p2[0] - p3[0]) * t2
                + (-p0[0] + 3.0 * p1[0] - 3.0 * p2[0] + p3[0]) * t3
            )
            y = 0.5 * (
                (2.0 * p1[1])
                + (-p0[1] + p2[1]) * t
                + (2.0 * p0[1] - 5.0 * p1[1] + 4.0 * p2[1] - p3[1]) * t2
                + (-p0[1] + 3.0 * p1[1] - 3.0 * p2[1] + p3[1]) * t3
            )
            result.append([round(x, 6), round(y, 6)])

    result.append(control_points[-1])
    return result


class RoadGeometryService:
    @staticmethod
    def _make_cache_key(points: List[Tuple[float, float]]) -> str:
        return ";".join(f"{round(p[0], 4)},{round(p[1], 4)}" for p in points)

    @classmethod
    async def get_road_aligned_geometry(
        cls,
        points: List[Tuple[float, float]],
        input_format: str = "lat_lng"
    ) -> Tuple[List[List[float]], float]:
        """
        Takes a list of waypoint points and returns:
          (coordinates, total_distance_km)
        where coordinates is in GeoJSON LineString format: [[lng, lat], [lng, lat], ...]
        snapped to actual physical roads on OpenStreetMap.
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

        cache_key = cls._make_cache_key(lat_lng_points)
        if cache_key in _ROAD_GEOMETRY_CACHE:
            return _ROAD_GEOMETRY_CACHE[cache_key]

        # Calculate nominal straight-line distance sum as baseline fallback
        fallback_distance = 0.0
        for i in range(len(lat_lng_points) - 1):
            fallback_distance += haversine_km(
                lat_lng_points[i][0], lat_lng_points[i][1],
                lat_lng_points[i + 1][0], lat_lng_points[i + 1][1]
            )

        # Build GeoJSON control points [[lng, lat], ...]
        raw_control_pts = [[p[1], p[0]] for p in lat_lng_points]

        # Try OSRM routing machine
        try:
            # Format coordinates for OSRM: lon,lat;lon,lat;...
            coords_param = ";".join(f"{round(p[1], 5)},{round(p[0], 5)}" for p in lat_lng_points)
            url = f"{OSRM_BASE_URL}/{coords_param}?overview=full&geometries=geojson"

            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)

            if res.status_code == 200:
                data = res.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    primary_route = data["routes"][0]
                    raw_coords = primary_route["geometry"]["coordinates"]
                    dist_km = round(primary_route.get("distance", fallback_distance * 1000.0) / 1000.0, 1)

                    # Optimize vertex density to preserve curves while maintaining lightweight payload
                    simplified = rdp_simplify(raw_coords, epsilon=0.00008)

                    # Safety check: ensure start & end points match exactly
                    if simplified:
                        simplified[0] = raw_control_pts[0]
                        simplified[-1] = raw_control_pts[-1]

                    result = (simplified, dist_km)
                    _ROAD_GEOMETRY_CACHE[cache_key] = result
                    return result
        except Exception as err:
            logger.warning(f"OSRM snapping failed, using smooth Catmull-Rom spline fallback: {err}")

        # Fallback: Generate high-resolution Catmull-Rom splined road curvature
        splined_pts = catmull_rom_spline(raw_control_pts, points_per_segment=12)
        # Approximate real road winding factor (roads in NER are ~1.28x to 1.35x longer than straight lines)
        calibrated_distance = round(fallback_distance * 1.25, 1)

        result = (splined_pts, calibrated_distance)
        _ROAD_GEOMETRY_CACHE[cache_key] = result
        return result

    @classmethod
    async def snap_corridor(
        cls,
        coordinates: List[List[float]]
    ) -> Tuple[List[List[float]], float]:
        """
        Convenience wrapper accepting GeoJSON [[lng, lat], ...] coordinates.
        """
        pts = [(c[1], c[0]) for c in coordinates]
        return await cls.get_road_aligned_geometry(pts, input_format="lat_lng")
