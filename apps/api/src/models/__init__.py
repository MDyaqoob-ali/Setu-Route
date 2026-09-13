import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from src.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="LOGISTICS_OPERATOR")
    # Roles: SUPER_ADMIN, REGIONAL_ADMIN, DISTRICT_OFFICER, FIELD_OFFICER, LOGISTICS_OPERATOR, DRIVER, VIEW_ONLY
    department = Column(String(100), nullable=True)
    district_id = Column(String(36), ForeignKey("districts.id"), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    district = relationship("District", back_populates="officers")
    reported_incidents = relationship("Incident", back_populates="reporter")


class District(Base):
    __tablename__ = "districts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    # 8 NER States: Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, Sikkim
    code = Column(String(20), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    boundary_geojson = Column(JSON, nullable=True)
    terrain_type = Column(String(50), default="Hilly/Montane")  # Hilly, Valley, Floodplain, High Altitude
    elevation_avg_m = Column(Integer, default=500)
    vulnerability_index = Column(Float, default=0.5)  # 0.0 to 1.0 (flood/landslide vulnerability)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    officers = relationship("User", back_populates="district")
    roads = relationship("Road", back_populates="district")
    incidents = relationship("Incident", back_populates="district")


class Road(Base):
    __tablename__ = "roads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False, index=True)
    code = Column(String(50), nullable=False, index=True)  # e.g., NH-27, NH-37, NH-102
    highway_type = Column(String(50), default="National Highway")  # National Highway, State Highway, Major District Road, Border Road
    state = Column(String(100), nullable=False, index=True)
    district_id = Column(String(36), ForeignKey("districts.id"), nullable=True)
    total_length_km = Column(Float, nullable=False, default=50.0)
    start_point_name = Column(String(100), nullable=False)
    end_point_name = Column(String(100), nullable=False)
    accessibility_status = Column(String(30), default="ACCESSIBLE", index=True)
    # ACCESSIBLE, RESTRICTED, BLOCKED, UNKNOWN
    criticality = Column(String(30), default="HIGH")  # CRITICAL, HIGH, NORMAL
    average_speed_kmh = Column(Float, default=45.0)
    current_risk_score = Column(Float, default=0.2)  # 0.0 (Safe) to 1.0 (Extreme Hazard)
    geometry_geojson = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    district = relationship("District", back_populates="roads")
    segments = relationship("RoadSegment", back_populates="road", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="road")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    road_id = Column(String(36), ForeignKey("roads.id"), nullable=False, index=True)
    segment_index = Column(Integer, nullable=False, default=0)
    name = Column(String(150), nullable=False)
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    geometry_geojson = Column(JSON, nullable=True)
    accessibility_status = Column(String(30), default="ACCESSIBLE", index=True)
    # ACCESSIBLE, RESTRICTED, BLOCKED, UNKNOWN
    risk_score = Column(Float, default=0.1)  # 0.0 - 1.0
    current_speed_kmh = Column(Float, default=45.0)
    elevation_m = Column(Integer, default=350)
    surface_condition = Column(String(50), default="Good")  # Paved Good, Paved Damaged, Unpaved Muddy, Waterlogged
    active_incidents_count = Column(Integer, default=0)
    last_assessed_at = Column(DateTime, default=utc_now, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    road = relationship("Road", back_populates="segments")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_code = Column(String(30), unique=True, index=True, nullable=False)
    type = Column(String(50), nullable=False, index=True)
    # landslide, flood, road_damage, bridge_damage, traffic, severe_weather, accident, rockfall, sinking
    severity = Column(String(30), nullable=False, index=True)
    # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), nullable=False, default="OPEN", index=True)
    # OPEN, ACKNOWLEDGED, INVESTIGATING, RESOLVED
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    address = Column(String(255), nullable=True)
    road_id = Column(String(36), ForeignKey("roads.id"), nullable=True, index=True)
    road_segment_id = Column(String(36), ForeignKey("road_segments.id"), nullable=True)
    district_id = Column(String(36), ForeignKey("districts.id"), nullable=False, index=True)
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reporter_name = Column(String(100), nullable=True)
    reporter_role = Column(String(50), nullable=True)
    reporter_contact = Column(String(50), nullable=True)
    estimated_clearance_time = Column(DateTime, nullable=True)
    affected_traffic_direction = Column(String(50), default="BOTH")  # BOTH, NORTHBOUND, SOUTHBOUND, EASTBOUND, WESTBOUND
    verification_status = Column(String(30), default="VERIFIED")  # VERIFIED, UNVERIFIED, CITIZEN_REPORT, CONFIRMED, CONFLICTING
    photos_json = Column(JSON, default=list)  # list of URLs or paths
    # External Intelligence & Provenance fields
    source_name = Column(String(100), default="Official PWD", nullable=True)
    source_url = Column(String(500), nullable=True)
    source_trust_level = Column(String(50), default="OFFICIAL", nullable=False)  # OFFICIAL, VERIFIED_PROVIDER, REPUTABLE_NEWS, UNVERIFIED
    source_event_id = Column(String(150), nullable=True, index=True)
    raw_source_reference = Column(JSON, default=dict)
    confidence_score = Column(Float, default=0.9)  # 0.0 to 1.0
    affected_road_code = Column(String(50), nullable=True, index=True)
    impact_geometry_type = Column(String(30), default="POINT")  # POINT, LINESTRING, POLYGON
    impact_geometry_geojson = Column(JSON, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    alternative_available = Column(Boolean, default=True)
    is_live_external = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    road = relationship("Road", back_populates="incidents")
    district = relationship("District", back_populates="incidents")
    reporter = relationship("User", back_populates="reported_incidents")
    photos = relationship("IncidentPhoto", back_populates="incident", cascade="all, delete-orphan")


class IncidentPhoto(Base):
    __tablename__ = "incident_photos"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(50), default="image/jpeg")
    caption = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="photos")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    registration_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False)
    # Heavy Truck (16T), Medium Truck (10T), Light Commercial (3.5T), Tanker (Fuel), Refrigerated Medical, 4x4 Emergency
    capacity_tons = Column(Float, default=10.0)
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(30), nullable=False)
    current_status = Column(String(30), default="STOPPED", index=True)
    # MOVING, STOPPED, DELAYED, OFFLINE, ARRIVED, EMERGENCY
    current_lat = Column(Float, nullable=False)
    current_lng = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    heading_deg = Column(Float, default=0.0)
    fuel_percent = Column(Float, default=85.0)
    last_ping_at = Column(DateTime, default=utc_now, nullable=False)
    destination_name = Column(String(100), nullable=True)
    current_delivery_id = Column(String(36), ForeignKey("deliveries.id", use_alter=True, name="fk_vehicles_current_delivery_id"), nullable=True)
    is_sos = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    locations = relationship("VehicleLocation", back_populates="vehicle", cascade="all, delete-orphan")
    deliveries = relationship("Delivery", back_populates="assigned_vehicle", foreign_keys="Delivery.assigned_vehicle_id")


class VehicleLocation(Base):
    __tablename__ = "vehicle_locations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    heading_deg = Column(Float, default=0.0)
    accuracy_m = Column(Float, default=5.0)
    recorded_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    vehicle = relationship("Vehicle", back_populates="locations")


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    consignment_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    cargo_category = Column(String(50), nullable=False, index=True)
    # Medical Supplies, Essential Food Grains, Petroleum/Fuel, Disaster Relief, Construction Materials, Telecom Eqpt
    cargo_description = Column(Text, nullable=True)
    weight_tons = Column(Float, default=5.0)
    priority = Column(String(30), default="NORMAL", index=True)
    # CRITICAL, HIGH, NORMAL
    status = Column(String(30), default="PLANNED", index=True)
    # PLANNED, IN_TRANSIT, DELAYED, DELIVERED, CANCELLED, AT_RISK
    origin_name = Column(String(100), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_name = Column(String(100), nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    assigned_vehicle_id = Column(String(36), ForeignKey("vehicles.id", use_alter=True, name="fk_deliveries_assigned_vehicle_id"), nullable=True)
    planned_departure = Column(DateTime, nullable=False)
    expected_delivery = Column(DateTime, nullable=False)
    current_eta = Column(DateTime, nullable=True)
    actual_delivery = Column(DateTime, nullable=True)
    delay_minutes = Column(Integer, default=0)
    risk_level = Column(String(30), default="LOW")  # LOW, MEDIUM, HIGH, SEVERE
    delay_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    assigned_vehicle = relationship("Vehicle", back_populates="deliveries", foreign_keys=[assigned_vehicle_id])
    events = relationship("DeliveryEvent", back_populates="delivery", cascade="all, delete-orphan")


class DeliveryEvent(Base):
    __tablename__ = "delivery_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    delivery_id = Column(String(36), ForeignKey("deliveries.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    # CREATED, DISPATCHED, CHECKPOINT_PASSED, REROUTED, DELAYED, AT_RISK_ALERT, DELIVERED, SOS_ALERT
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    delivery = relationship("Delivery", back_populates="events")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_code = Column(String(30), unique=True, index=True, nullable=False)
    alert_type = Column(String(50), nullable=False, index=True)
    # CRITICAL_INCIDENT, ROAD_CLOSURE, PREDICTED_DISRUPTION, DELIVERY_AT_RISK, VEHICLE_DELAY, ROUTE_CHANGE, SYNC_FAILURE, STALE_DATA
    severity = Column(String(30), nullable=False, index=True)
    # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(255), nullable=False)
    what_happened = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    who_is_affected = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=True)  # road, incident, vehicle, delivery
    entity_id = Column(String(36), nullable=True)
    district_id = Column(String(36), ForeignKey("districts.id"), nullable=True)
    is_acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)


class RouteRequest(Base):
    __tablename__ = "route_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    origin_name = Column(String(100), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_name = Column(String(100), nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    vehicle_type = Column(String(50), default="Heavy Truck (16T)")
    cargo_priority = Column(String(30), default="NORMAL")
    avoid_blocked_roads = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    results = relationship("RouteResult", back_populates="request", cascade="all, delete-orphan")


class RouteResult(Base):
    __tablename__ = "route_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), ForeignKey("route_requests.id"), nullable=False, index=True)
    route_name = Column(String(150), nullable=False)
    distance_km = Column(Float, nullable=False)
    estimated_duration_minutes = Column(Integer, nullable=False)
    risk_score = Column(Float, default=0.2)
    risk_level = Column(String(30), default="LOW")
    risk_breakdown_json = Column(JSON, default=dict)
    waypoints_geojson = Column(JSON, nullable=False)
    bottlenecks_json = Column(JSON, default=list)
    is_recommended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    request = relationship("RouteRequest", back_populates="results")


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    district_id = Column(String(36), ForeignKey("districts.id"), nullable=False, index=True)
    station_name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rainfall_last_3h_mm = Column(Float, default=0.0)
    rainfall_24h_mm = Column(Float, default=0.0)
    temperature_c = Column(Float, default=24.0)
    wind_speed_kmh = Column(Float, default=12.0)
    humidity_percent = Column(Float, default=80.0)
    flood_warning_level = Column(String(30), default="GREEN")  # GREEN, YELLOW, ORANGE, RED
    landslide_risk_index = Column(Float, default=0.1)  # 0.0 to 1.0
    recorded_at = Column(DateTime, default=utc_now, nullable=False, index=True)


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    road_segment_id = Column(String(36), ForeignKey("road_segments.id"), nullable=False, index=True)
    district_id = Column(String(36), ForeignKey("districts.id"), nullable=False, index=True)
    prediction_horizon_hours = Column(Integer, default=12)
    risk_level = Column(String(30), default="LOW")  # LOW, MEDIUM, HIGH, SEVERE
    risk_score = Column(Float, default=0.2)
    primary_hazard = Column(String(50), default="Flash Flood / Waterlogging")
    disruption_probability = Column(Float, default=0.15)
    confidence_score = Column(Float, default=0.88)
    explanation = Column(Text, nullable=False)
    factors_json = Column(JSON, default=dict)
    generated_at = Column(DateTime, default=utc_now, nullable=False)


class SyncQueue(Base):
    __tablename__ = "sync_queue"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    client_id = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)  # incident, vehicle_location, delivery_event
    action = Column(String(30), nullable=False)  # CREATE, UPDATE, DELETE
    payload_json = Column(JSON, nullable=False)
    sync_status = Column(String(30), default="PENDING")  # PENDING, SYNCED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    synced_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=True)
    details_json = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)


class SourceHealth(Base):
    __tablename__ = "source_health"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_name = Column(String(100), unique=True, index=True, nullable=False)
    source_category = Column(String(50), nullable=False)  # SEISMIC, WEATHER, DISASTER, ROAD_AGENCY, NEWS
    trust_level = Column(String(50), nullable=False)  # OFFICIAL, VERIFIED_PROVIDER, REPUTABLE_NEWS, UNVERIFIED
    status = Column(String(30), default="ONLINE")  # ONLINE, DEGRADED, OFFLINE
    last_sync_at = Column(DateTime, default=utc_now, nullable=False)
    sync_interval_sec = Column(Integer, default=300)
    incident_count = Column(Integer, default=0)
    last_latency_ms = Column(Integer, default=0)
    last_error_message = Column(Text, nullable=True)
    endpoint_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

