export type UserRole =
  | "SUPER_ADMIN"
  | "REGIONAL_ADMIN"
  | "DISTRICT_OFFICER"
  | "FIELD_OFFICER"
  | "LOGISTICS_OPERATOR"
  | "DRIVER"
  | "VIEW_ONLY";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  district_id?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export type AccessibilityStatus = "ACCESSIBLE" | "RESTRICTED" | "BLOCKED" | "UNKNOWN";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "INVESTIGATING" | "RESOLVED";
export type VehicleStatus = "MOVING" | "STOPPED" | "DELAYED" | "OFFLINE" | "ARRIVED" | "EMERGENCY";
export type DeliveryPriority = "CRITICAL" | "HIGH" | "NORMAL";
export type DeliveryStatus = "PLANNED" | "IN_TRANSIT" | "DELAYED" | "DELIVERED" | "CANCELLED" | "AT_RISK";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface District {
  id: string;
  name: string;
  state: string;
  code: string;
  latitude: number;
  longitude: number;
  terrain_type: string;
  elevation_avg_m: number;
  vulnerability_index: number;
  boundary_geojson?: any;
}

export interface RoadSegment {
  id: string;
  road_id: string;
  segment_index: number;
  name: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  accessibility_status: AccessibilityStatus;
  risk_score: number;
  current_speed_kmh: number;
  elevation_m: number;
  surface_condition: string;
  active_incidents_count: number;
  last_assessed_at: string;
  geometry_geojson?: any;
}

export interface Road {
  id: string;
  name: string;
  code: string;
  highway_type: string;
  state: string;
  district_id?: string;
  total_length_km: number;
  start_point_name: string;
  end_point_name: string;
  accessibility_status: AccessibilityStatus;
  criticality: string;
  average_speed_kmh: number;
  current_risk_score: number;
  geometry_geojson?: any;
  segments?: RoadSegment[];
}

export interface Incident {
  id: string;
  incident_code: string;
  type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  road_id?: string;
  district_id: string;
  reporter_name?: string;
  reporter_role?: string;
  reporter_contact?: string;
  estimated_clearance_time?: string;
  affected_traffic_direction: string;
  verification_status: string;
  photos_json: string[];
  created_at: string;
  updated_at: string;
  road_name?: string;
  district_name?: string;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  capacity_tons: number;
  driver_name: string;
  driver_phone: string;
  current_status: VehicleStatus;
  current_lat: number;
  current_lng: number;
  speed_kmh: number;
  heading_deg: number;
  fuel_percent: number;
  last_ping_at: string;
  destination_name?: string;
  current_delivery_id?: string;
  is_sos: boolean;
  created_at: string;
}

export interface VehicleLocation {
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg: number;
  recorded_at: string;
}

export interface Delivery {
  id: string;
  consignment_code: string;
  title: string;
  cargo_category: string;
  cargo_description?: string;
  weight_tons: number;
  priority: DeliveryPriority;
  status: DeliveryStatus;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  assigned_vehicle_id?: string;
  planned_departure: string;
  expected_delivery: string;
  current_eta?: string;
  actual_delivery?: string;
  delay_minutes: number;
  risk_level: string;
  delay_reason?: string;
  created_at: string;
  vehicle_registration?: string;
  driver_name?: string;
}

export interface DeliveryEvent {
  id: string;
  delivery_id: string;
  event_type: string;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface Alert {
  id: string;
  alert_code: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  what_happened: string;
  why_it_matters: string;
  who_is_affected: string;
  recommended_action: string;
  entity_type?: string;
  entity_id?: string;
  district_id?: string;
  is_acknowledged: boolean;
  acknowledged_at?: string;
  created_at: string;
}

export interface DashboardSummary {
  network_accessibility_percent: number;
  total_road_km: number;
  accessible_road_km: number;
  active_incidents_count: number;
  critical_incidents_count: number;
  vehicles_in_transit_count: number;
  vehicles_delayed_count: number;
  vehicles_stopped_count: number;
  deliveries_at_risk_count: number;
  deliveries_critical_count: number;
  high_risk_corridors_count: number;
  unacknowledged_alerts_count: number;
  recent_events: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    severity: string;
    entity_type: string;
    entity_id: string;
  }>;
  corridor_risks: Array<{
    id: string;
    code: string;
    name: string;
    status: AccessibilityStatus;
    risk_score: number;
    avg_speed: number;
    state: string;
    length_km: number;
  }>;
  district_summaries: Array<{
    id: string;
    name: string;
    state: string;
    code: string;
    vulnerability: number;
    elevation: number;
  }>;
}

export interface RouteResult {
  id: string;
  route_name: string;
  distance_km: number;
  estimated_duration_minutes: number;
  risk_score: number;
  risk_level: string;
  risk_breakdown: {
    terrain_hazard?: number;
    incident_factor?: number;
    weather_warning?: string;
  };
  waypoints: {
    type: string;
    coordinates: number[][];
  };
  bottlenecks: Array<{
    location: string;
    severity: string;
    reason: string;
  }>;
  is_recommended: boolean;
  safety_rationale?: string;
}
