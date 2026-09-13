from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "LOGISTICS_OPERATOR"
    department: Optional[str] = None
    district_id: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    district_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# District Schemas
class DistrictBase(BaseModel):
    name: str
    state: str
    code: str
    latitude: float
    longitude: float
    terrain_type: str = "Hilly/Montane"
    elevation_avg_m: int = 500
    vulnerability_index: float = 0.5
    boundary_geojson: Optional[Dict[str, Any]] = None

class DistrictResponse(DistrictBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Road & Segment Schemas
class RoadSegmentResponse(BaseModel):
    id: str
    road_id: str
    segment_index: int
    name: str
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    geometry_geojson: Optional[Dict[str, Any]] = None
    accessibility_status: str
    risk_score: float
    current_speed_kmh: float
    elevation_m: int
    surface_condition: str
    active_incidents_count: int
    last_assessed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RoadResponse(BaseModel):
    id: str
    name: str
    code: str
    highway_type: str
    state: str
    district_id: Optional[str] = None
    total_length_km: float
    start_point_name: str
    end_point_name: str
    accessibility_status: str
    criticality: str
    average_speed_kmh: float
    current_risk_score: float
    geometry_geojson: Optional[Dict[str, Any]] = None
    segments: Optional[List[RoadSegmentResponse]] = None

    model_config = ConfigDict(from_attributes=True)

# Incident Schemas
class IncidentCreate(BaseModel):
    type: str  # landslide, flood, road_damage, bridge_damage, traffic, severe_weather, accident, rockfall
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    title: str
    description: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    road_id: Optional[str] = None
    district_id: str
    reporter_name: Optional[str] = "Field Officer"
    reporter_role: Optional[str] = "FIELD_OFFICER"
    reporter_contact: Optional[str] = None
    estimated_clearance_time: Optional[datetime] = None
    affected_traffic_direction: Optional[str] = "BOTH"
    photos_json: Optional[List[str]] = Field(default_factory=list)

class IncidentUpdate(BaseModel):
    status: Optional[str] = None  # OPEN, ACKNOWLEDGED, INVESTIGATING, RESOLVED
    severity: Optional[str] = None
    description: Optional[str] = None
    estimated_clearance_time: Optional[datetime] = None
    affected_traffic_direction: Optional[str] = None
    verification_status: Optional[str] = None

class IncidentResponse(BaseModel):
    id: str
    incident_code: str
    type: str
    severity: str
    status: str
    title: str
    description: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    road_id: Optional[str] = None
    district_id: str
    reporter_name: Optional[str] = None
    reporter_role: Optional[str] = None
    reporter_contact: Optional[str] = None
    estimated_clearance_time: Optional[datetime] = None
    affected_traffic_direction: str
    verification_status: str
    photos_json: List[str] = []
    created_at: datetime
    updated_at: datetime
    road_name: Optional[str] = None
    district_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Vehicle Schemas
class VehicleLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    speed_kmh: float = 0.0
    heading_deg: float = 0.0
    accuracy_m: float = 5.0
    fuel_percent: Optional[float] = None
    is_sos: Optional[bool] = None

class VehicleCreate(BaseModel):
    registration_number: str
    vehicle_type: str = "Heavy Truck (16T)"
    capacity_tons: float = 10.0
    driver_name: str
    driver_phone: str
    current_status: str = "STOPPED"
    current_lat: float = 26.1445
    current_lng: float = 91.7362
    fuel_percent: float = 85.0
    destination_name: Optional[str] = None

class DriverResponse(BaseModel):
    id: Optional[str] = None
    driver_name: str
    driver_phone: str
    status: str = "AVAILABLE"  # AVAILABLE, ASSIGNED, IN_TRANSIT
    current_vehicle_reg: Optional[str] = None

class VehicleResponse(BaseModel):
    id: str
    registration_number: str
    vehicle_type: str
    capacity_tons: float
    driver_name: str
    driver_phone: str
    current_status: str
    current_lat: float
    current_lng: float
    speed_kmh: float
    heading_deg: float
    fuel_percent: float
    last_ping_at: datetime
    destination_name: Optional[str] = None
    current_delivery_id: Optional[str] = None
    is_sos: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Delivery Schemas
class DeliveryCreate(BaseModel):
    title: str
    cargo_category: str
    cargo_description: Optional[str] = None
    weight_tons: float = 5.0
    priority: str = "NORMAL"  # CRITICAL, HIGH, NORMAL
    origin_name: str
    origin_lat: float
    origin_lng: float
    destination_name: str
    destination_lat: float
    destination_lng: float
    assigned_vehicle_id: Optional[str] = None
    planned_departure: datetime
    expected_delivery: datetime

class DeliveryUpdate(BaseModel):
    status: Optional[str] = None
    current_eta: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    delay_minutes: Optional[int] = None
    risk_level: Optional[str] = None
    delay_reason: Optional[str] = None
    assigned_vehicle_id: Optional[str] = None

class DeliveryEventResponse(BaseModel):
    id: str
    delivery_id: str
    event_type: str
    title: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DeliveryResponse(BaseModel):
    id: str
    consignment_code: str
    title: str
    cargo_category: str
    cargo_description: Optional[str] = None
    weight_tons: float
    priority: str
    status: str
    origin_name: str
    origin_lat: float
    origin_lng: float
    destination_name: str
    destination_lat: float
    destination_lng: float
    assigned_vehicle_id: Optional[str] = None
    planned_departure: datetime
    expected_delivery: datetime
    current_eta: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    delay_minutes: int
    risk_level: str
    delay_reason: Optional[str] = None
    created_at: datetime
    vehicle_registration: Optional[str] = None
    driver_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    alert_code: str
    alert_type: str
    severity: str
    title: str
    what_happened: str
    why_it_matters: str
    who_is_affected: str
    recommended_action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    district_id: Optional[str] = None
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Routing Schemas
class WaypointItem(BaseModel):
    name: str
    lat: float
    lng: float

class RouteOptimizeRequest(BaseModel):
    origin_name: str
    origin_lat: float
    origin_lng: float
    destination_name: str
    dest_lat: float
    dest_lng: float
    waypoints: Optional[List[WaypointItem]] = None
    vehicle_type: str = "Heavy Truck (16T)"
    cargo_priority: str = "NORMAL"
    avoid_blocked_roads: bool = True

# Connected Vehicle Journey Schemas
class VehicleJourneyVehicleInfo(BaseModel):
    registration_number: str
    vehicle_type: str = "Heavy Truck (16T)"
    capacity_tons: float = 10.0
    driver_name: str
    driver_phone: str
    initial_status: Optional[str] = "STOPPED"
    fuel_percent: Optional[float] = 90.0

class VehicleJourneyConsignmentInfo(BaseModel):
    title: str
    cargo_category: str
    cargo_description: Optional[str] = None
    weight_tons: float = 5.0
    priority: Optional[str] = "NORMAL"
    package_count: Optional[int] = 1
    instructions: Optional[str] = None

class VehicleJourneyLocationInfo(BaseModel):
    name: str
    lat: float
    lng: float
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    scheduled_time: Optional[datetime] = None

class VehicleJourneySelectedRoute(BaseModel):
    route_name: str
    distance_km: float
    estimated_duration_minutes: int
    risk_score: float = 0.2
    risk_level: str = "LOW"
    waypoints_geojson: Optional[Dict[str, Any]] = None
    route_status: Optional[str] = "CLEAR"
    is_recommended: Optional[bool] = True
    affecting_incidents_count: Optional[int] = 0

class VehicleJourneyCreate(BaseModel):
    vehicle: VehicleJourneyVehicleInfo
    consignment: VehicleJourneyConsignmentInfo
    pickup: VehicleJourneyLocationInfo
    destination: VehicleJourneyLocationInfo
    waypoints: Optional[List[VehicleJourneyLocationInfo]] = None
    selected_route: Optional[VehicleJourneySelectedRoute] = None

class VehicleJourneyResponse(BaseModel):
    success: bool
    message: str
    vehicle: VehicleResponse
    delivery: DeliveryResponse
    route_summary: Optional[Dict[str, Any]] = None


class RouteResultResponse(BaseModel):
    id: str
    route_name: str
    distance_km: float
    estimated_duration_minutes: int
    risk_score: float
    risk_level: str
    risk_breakdown: Dict[str, Any]
    waypoints: Dict[str, Any]  # GeoJSON LineString
    bottlenecks: List[Dict[str, Any]]
    is_recommended: bool

# Dashboard Summary Schema
class DashboardSummaryResponse(BaseModel):
    network_accessibility_percent: float
    total_road_km: float
    accessible_road_km: float
    active_incidents_count: int
    critical_incidents_count: int
    vehicles_in_transit_count: int
    vehicles_delayed_count: int
    vehicles_stopped_count: int
    deliveries_at_risk_count: int
    deliveries_critical_count: int
    high_risk_corridors_count: int
    unacknowledged_alerts_count: int
    recent_events: List[Dict[str, Any]]
    corridor_risks: List[Dict[str, Any]]
    district_summaries: List[Dict[str, Any]]

# Field Offline Sync Schema
class SyncItem(BaseModel):
    client_id: str
    entity_type: str
    action: str
    payload: Dict[str, Any]
    client_timestamp: str

class SyncBatchRequest(BaseModel):
    items: List[SyncItem]

class SyncBatchResponse(BaseModel):
    processed_count: int
    failed_count: int
    results: List[Dict[str, Any]]
