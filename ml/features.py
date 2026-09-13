"""
Feature Engineering Definition for SETU-ROUTE Disruption Risk Model.
Defines all input features, scalers, and domain risk heuristics.
"""

from typing import Dict, Any, List
import math

FEATURE_NAMES = [
    "rainfall_1h_mm",
    "rainfall_6h_mm",
    "rainfall_24h_mm",
    "temperature_c",
    "visibility_km",
    "road_condition_score",  # 1.0 (Paved Good) to 4.0 (Severe Damage/Waterlogged)
    "traffic_level_score",    # 1.0 (Free Flow) to 4.0 (Gridlock)
    "slope_deg",              # Terrain gradient (degrees: 0 to 45)
    "elevation_m",            # Meters above sea level (50 to 3500)
    "historical_slide_freq",  # Frequency index (0.0 to 1.0)
    "active_incidents_near",  # Count of active incidents in 25km radius
    "recent_field_reports",   # Count of field reports in last 12h
    "current_accessibility",  # 0 to 100 accessibility score
    "hour_sin",               # Cyclical time of day
    "hour_cos"
]

ROAD_CONDITION_MAP = {
    "Good": 1.0,
    "Paved Good": 1.0,
    "Fair": 1.8,
    "Paved Damaged": 2.5,
    "Unpaved Muddy": 3.4,
    "Waterlogged": 4.0,
    "Severe Damage": 4.0
}

TRAFFIC_LEVEL_MAP = {
    "Free Flow": 1.0,
    "Low": 1.0,
    "Moderate": 2.0,
    "Heavy": 3.0,
    "Gridlock": 4.0
}

def extract_features(data: Dict[str, Any]) -> List[float]:
    """
    Extracts ordered feature vector from raw telemetry/geological data dictionary.
    """
    rainfall_1h = float(data.get("rainfall_1h_mm", 0.0))
    rainfall_6h = float(data.get("rainfall_6h_mm", rainfall_1h * 3.5))
    rainfall_24h = float(data.get("rainfall_24h_mm", rainfall_6h * 2.8))
    temperature = float(data.get("temperature_c", 22.0))
    visibility = float(data.get("visibility_km", 8.0))
    
    cond_raw = data.get("surface_condition", data.get("road_condition", "Good"))
    road_condition = ROAD_CONDITION_MAP.get(cond_raw, 1.5)
    
    traf_raw = data.get("traffic_level", 1.5)
    if isinstance(traf_raw, str):
        traffic_level = TRAFFIC_LEVEL_MAP.get(traf_raw, 1.5)
    else:
        traffic_level = float(traf_raw)
    slope = float(data.get("slope_deg", data.get("slope", 12.0)))
    elevation = float(data.get("elevation_m", data.get("elevation", 450.0)))
    hist_freq = float(data.get("historical_slide_freq", data.get("vulnerability_index", 0.3)))
    active_incidents = float(data.get("active_incidents_count", data.get("active_incidents_near", 0)))
    field_reports = float(data.get("recent_field_reports", 0))
    current_acc = float(data.get("accessibility_score", data.get("current_accessibility", 85.0)))
    
    hour = float(data.get("hour_of_day", 14.0))
    hour_rad = 2 * math.pi * hour / 24.0
    hour_sin = math.sin(hour_rad)
    hour_cos = math.cos(hour_rad)

    return [
        rainfall_1h,
        rainfall_6h,
        rainfall_24h,
        temperature,
        visibility,
        road_condition,
        traffic_level,
        slope,
        elevation,
        hist_freq,
        active_incidents,
        field_reports,
        current_acc,
        hour_sin,
        hour_cos
    ]
