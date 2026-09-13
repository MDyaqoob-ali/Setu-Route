"""
Weather Provider Abstraction for NE-ROUTE.
Provides normalized meteorological telemetry for North Eastern Region stations.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import random

class WeatherData:
    def __init__(
        self,
        station_name: str,
        district_code: str,
        latitude: float,
        longitude: float,
        rainfall_1h_mm: float,
        rainfall_6h_mm: float,
        rainfall_24h_mm: float,
        temperature_c: float,
        wind_speed_kmh: float,
        humidity_percent: float,
        visibility_km: float,
        flood_warning_level: str,  # GREEN, YELLOW, ORANGE, RED
        landslide_risk_index: float, # 0.0 to 1.0
        recorded_at: datetime
    ):
        self.station_name = station_name
        self.district_code = district_code
        self.latitude = latitude
        self.longitude = longitude
        self.rainfall_1h_mm = rainfall_1h_mm
        self.rainfall_6h_mm = rainfall_6h_mm
        self.rainfall_24h_mm = rainfall_24h_mm
        self.temperature_c = temperature_c
        self.wind_speed_kmh = wind_speed_kmh
        self.humidity_percent = humidity_percent
        self.visibility_km = visibility_km
        self.flood_warning_level = flood_warning_level
        self.landslide_risk_index = landslide_risk_index
        self.recorded_at = recorded_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "station_name": self.station_name,
            "district_code": self.district_code,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "rainfall_1h_mm": self.rainfall_1h_mm,
            "rainfall_6h_mm": self.rainfall_6h_mm,
            "rainfall_24h_mm": self.rainfall_24h_mm,
            "temperature_c": self.temperature_c,
            "wind_speed_kmh": self.wind_speed_kmh,
            "humidity_percent": self.humidity_percent,
            "visibility_km": self.visibility_km,
            "flood_warning_level": self.flood_warning_level,
            "landslide_risk_index": self.landslide_risk_index,
            "recorded_at": self.recorded_at.isoformat()
        }

class WeatherProvider(ABC):
    @abstractmethod
    async def get_observation_for_location(self, latitude: float, longitude: float) -> WeatherData:
        pass

    @abstractmethod
    def inject_weather_anomaly(self, target_station: str, rainfall_1h: float, rainfall_6h: float = 0.0):
        pass

class MockWeatherProvider(WeatherProvider):
    def __init__(self):
        self.stations = [
            {"name": "Guwahati Borjhar Met Station", "code": "AS-KM", "lat": 26.1060, "lng": 91.5859, "rain_1h": 2.5, "temp": 28.5, "wind": 11.0, "flood": "GREEN", "landslide": 0.12},
            {"name": "Sohra (Cherrapunji) Automatic Station", "code": "ML-EK", "lat": 25.2700, "lng": 91.7300, "rain_1h": 24.5, "temp": 18.2, "wind": 28.0, "flood": "ORANGE", "landslide": 0.88},
            {"name": "Khliehriat Slope Station (NH-6)", "code": "ML-EJ", "lat": 25.3500, "lng": 92.3800, "rain_1h": 32.0, "temp": 19.0, "wind": 22.0, "flood": "RED", "landslide": 0.94},
            {"name": "Noney Hill Hydro Telemetry (NH-37)", "code": "MN-NN", "lat": 24.7800, "lng": 93.6000, "rain_1h": 18.5, "temp": 22.4, "wind": 15.0, "flood": "ORANGE", "landslide": 0.81},
            {"name": "Sela Ridge High Altitude Tower (13,700 ft)", "code": "AR-TW", "lat": 27.5000, "lng": 92.1000, "rain_1h": 28.0, "temp": 5.5, "wind": 38.0, "flood": "RED", "landslide": 0.96},
            {"name": "Teesta Basin Met Post 4 (NH-10)", "code": "SK-ES", "lat": 27.0800, "lng": 88.5400, "rain_1h": 14.0, "temp": 20.1, "wind": 18.0, "flood": "ORANGE", "landslide": 0.74}
        ]

    def inject_weather_anomaly(self, target_station: str, rainfall_1h: float, rainfall_6h: float = 0.0):
        for s in self.stations:
            if target_station.lower() in s["name"].lower() or target_station.lower() in s["code"].lower():
                s["rain_1h"] = rainfall_1h
                s["flood"] = "RED" if rainfall_1h > 35 else "ORANGE"
                s["landslide"] = 0.98 if rainfall_1h > 35 else 0.85
                return
        # If not matched, update the second station
        self.stations[1]["rain_1h"] = rainfall_1h
        self.stations[1]["flood"] = "RED"
        self.stations[1]["landslide"] = 0.95

    async def get_observation_for_location(self, latitude: float, longitude: float) -> WeatherData:
        # Find nearest telemetry station
        best = self.stations[0]
        min_d = float("inf")
        for s in self.stations:
            d = (s["lat"] - latitude)**2 + (s["lng"] - longitude)**2
            if d < min_d:
                min_d = d
                best = s

        now = datetime.now(timezone.utc)
        r1 = best["rain_1h"]
        r6 = r1 * 3.8
        r24 = r6 * 2.6
        return WeatherData(
            station_name=best["name"],
            district_code=best["code"],
            latitude=best["lat"],
            longitude=best["lng"],
            rainfall_1h_mm=r1,
            rainfall_6h_mm=r6,
            rainfall_24h_mm=r24,
            temperature_c=best["temp"],
            wind_speed_kmh=best["wind"],
            humidity_percent=88.0,
            visibility_km=max(1.0, 10.0 - (r1 * 0.2)),
            flood_warning_level=best["flood"],
            landslide_risk_index=best["landslide"],
            recorded_at=now
        )

    async def get_all_stations(self) -> List[WeatherData]:
        now = datetime.now(timezone.utc)
        res = []
        for s in self.stations:
            r1 = s["rain_1h"]
            res.append(WeatherData(
                station_name=s["name"],
                district_code=s["code"],
                latitude=s["lat"],
                longitude=s["lng"],
                rainfall_1h_mm=r1,
                rainfall_6h_mm=r1 * 3.8,
                rainfall_24h_mm=r1 * 8.5,
                temperature_c=s["temp"],
                wind_speed_kmh=s["wind"],
                humidity_percent=88.0,
                visibility_km=max(1.0, 10.0 - (r1 * 0.2)),
                flood_warning_level=s["flood"],
                landslide_risk_index=s["landslide"],
                recorded_at=now
            ))
        return res

# Default singleton provider
weather_provider: WeatherProvider = MockWeatherProvider()

