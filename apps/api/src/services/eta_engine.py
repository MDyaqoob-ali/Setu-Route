"""
ETA Prediction Engine for SETU-ROUTE.
Computes calibrated arrival times considering vehicle physics, mountain gradient,
rainfall intensity, and active road bottlenecks.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple

# Vehicle nominal base speeds (km/h) in standard conditions
VEHICLE_BASE_SPEEDS = {
    "Heavy Truck (16T)": 45.0,
    "Medium Truck (10T)": 50.0,
    "Light Commercial (3.5T)": 55.0,
    "Tanker (Fuel)": 42.0,
    "Refrigerated Medical": 52.0,
    "4x4 Emergency Supply": 58.0
}

class ETAPredictionResult:
    def __init__(
        self,
        estimated_arrival: datetime,
        estimated_duration_minutes: int,
        nominal_duration_minutes: int,
        delay_minutes: int,
        delay_reason: str,
        effective_speed_kmh: float
    ):
        self.estimated_arrival = estimated_arrival
        self.estimated_duration_minutes = estimated_duration_minutes
        self.nominal_duration_minutes = nominal_duration_minutes
        self.delay_minutes = delay_minutes
        self.delay_reason = delay_reason
        self.effective_speed_kmh = effective_speed_kmh

    def to_dict(self) -> Dict[str, Any]:
        return {
            "estimated_arrival": self.estimated_arrival.isoformat(),
            "estimated_duration_minutes": self.estimated_duration_minutes,
            "nominal_duration_minutes": self.nominal_duration_minutes,
            "delay_minutes": self.delay_minutes,
            "delay_reason": self.delay_reason,
            "effective_speed_kmh": round(self.effective_speed_kmh, 1)
        }

class ETAEngine:
    @staticmethod
    def calculate_eta(
        remaining_distance_km: float,
        vehicle_type: str = "Heavy Truck (16T)",
        road_condition: str = "Good",
        weather_rain_1h_mm: float = 0.0,
        elevation_gain_m: float = 400.0,
        bottleneck_count: int = 0,
        current_speed_kmh: float = 0.0,
        departure_time: datetime = None
    ) -> ETAPredictionResult:
        if departure_time is None:
            departure_time = datetime.now(timezone.utc)

        base_speed = VEHICLE_BASE_SPEEDS.get(vehicle_type, 45.0)

        # 1. Surface Condition Multiplier
        cond_multiplier = 1.0
        if "Waterlogged" in road_condition:
            cond_multiplier = 0.45
        elif "Unpaved Muddy" in road_condition or "Damaged" in road_condition:
            cond_multiplier = 0.65
        elif "Fair" in road_condition:
            cond_multiplier = 0.85

        # 2. Precipitation Reduction Factor
        rain_multiplier = 1.0
        if weather_rain_1h_mm > 25.0:
            rain_multiplier = 0.60
        elif weather_rain_1h_mm > 10.0:
            rain_multiplier = 0.80

        # 3. Elevation & Mountain Gradient Gradient Factor
        grade_multiplier = max(0.65, 1.0 - (elevation_gain_m / 8000.0))

        # Effective travel speed
        effective_speed = max(12.0, base_speed * cond_multiplier * rain_multiplier * grade_multiplier)

        # Base nominal time (no adverse weather/damage)
        nominal_hours = remaining_distance_km / base_speed
        nominal_minutes = int(nominal_hours * 60)

        # Actual estimated time + bottleneck queue additions
        actual_hours = remaining_distance_km / effective_speed
        bottleneck_minutes = bottleneck_count * 45  # 45 mins delay per active critical sector
        actual_minutes = int(actual_hours * 60) + bottleneck_minutes

        delay_minutes = max(0, actual_minutes - nominal_minutes)

        # Formulate human-readable delay reason
        delay_reasons = []
        if cond_multiplier < 0.9:
            delay_reasons.append("degraded road surface and mud accumulation")
        if rain_multiplier < 0.9:
            delay_reasons.append(f"monsoon cloudburst ({weather_rain_1h_mm:.1f} mm/h)")
        if elevation_gain_m > 800:
            delay_reasons.append("high-altitude mountain pass crawl (25 km/h limit)")
        if bottleneck_count > 0:
            delay_reasons.append(f"{bottleneck_count} active clearance bottlenecks along sector")

        delay_reason = "On-schedule free flow conditions"
        if delay_reasons:
            delay_reason = f"Transit delayed due to {', '.join(delay_reasons)}."

        estimated_arrival = departure_time + timedelta(minutes=actual_minutes)

        return ETAPredictionResult(
            estimated_arrival=estimated_arrival,
            estimated_duration_minutes=actual_minutes,
            nominal_duration_minutes=nominal_minutes,
            delay_minutes=delay_minutes,
            delay_reason=delay_reason,
            effective_speed_kmh=effective_speed
        )
