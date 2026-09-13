"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  User,
  Package,
  MapPin,
  Route as RouteIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Clock,
  Navigation,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ArrowUpDown,
  Compass,
  Radio,
  Check,
  Loader2,
  Building,
  Calendar,
  Phone,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MapLibreView, CandidateRouteItem } from "@/components/map/MapLibreView";
import { HUBS } from "@/components/map/MapRoutePlannerDrawer";
import { cn } from "@/lib/utils";

const VEHICLE_TYPES = [
  { label: "Heavy Truck (16T)", capacity: 16.0, desc: "Long-haul interstate freight and bulk relief goods" },
  { label: "Medium Truck (10T)", capacity: 10.0, desc: "Regional corridor distributions and district hubs" },
  { label: "Light Commercial (3.5T)", capacity: 3.5, desc: "Agile mountain pass and urban terminal deliveries" },
  { label: "Tanker (Fuel)", capacity: 12.0, desc: "POL (Petroleum, Oil & Lubricants) corridor transport" },
  { label: "Refrigerated Medical", capacity: 8.0, desc: "Cold-chain vaccines, blood plasma & essential pharmaceuticals" },
  { label: "4x4 Emergency Supply", capacity: 2.5, desc: "High-altitude rough terrain disaster lifeline support" },
];

const CARGO_CATEGORIES = [
  "Medical Supplies",
  "Essential Food Grains",
  "Petroleum/Fuel",
  "Disaster Relief",
  "Construction Materials",
  "Telecom Eqpt",
];

const WIZARD_STEPS = [
  { id: 1, label: "Vehicle", icon: Truck },
  { id: 2, label: "Driver", icon: User },
  { id: 3, label: "Consignment", icon: Package },
  { id: 4, label: "Journey", icon: MapPin },
  { id: 5, label: "Route Selection", icon: RouteIcon },
  { id: 6, label: "Review & Dispatch", icon: CheckCircle2 },
];

interface DriverItem {
  id?: string | null;
  driver_name: string;
  driver_phone: string;
  status: "AVAILABLE" | "IN_TRANSIT";
  current_vehicle_reg?: string | null;
}

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export default function AddVehiclePage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Vehicle Details
  const [registration, setRegistration] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0].label);
  const [capacityTons, setCapacityTons] = useState<number>(VEHICLE_TYPES[0].capacity);
  const [fuelPercent, setFuelPercent] = useState<number>(90);
  const [initialStatus, setInitialStatus] = useState<string>("STOPPED");
  const [isCheckingReg, setIsCheckingReg] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Step 2: Driver Details
  const [driverMode, setDriverMode] = useState<"existing" | "new">("existing");
  const [availableDrivers, setAvailableDrivers] = useState<DriverItem[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedDriverIdx, setSelectedDriverIdx] = useState<number>(-1);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");

  // Step 3: Consignment Details
  const [consignmentTitle, setConsignmentTitle] = useState("");
  const [cargoCategory, setCargoCategory] = useState(CARGO_CATEGORIES[0]);
  const [cargoDescription, setCargoDescription] = useState("");
  const [weightTons, setWeightTons] = useState<number>(5.0);
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "CRITICAL">("HIGH");
  const [packageCount, setPackageCount] = useState<number>(100);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Step 4: Locations & Waypoints
  const [originIdx, setOriginIdx] = useState(0); // Guwahati
  const [destIdx, setDestIdx] = useState(3); // Imphal
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [scheduledDeparture, setScheduledDeparture] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  // Step 5: Route Calculation & Selection
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [candidateRoutes, setCandidateRoutes] = useState<any[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [routeCalcError, setRouteCalcError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Auto-update capacity when vehicle type changes if not manually modified
  const handleVehicleTypeChange = (typeName: string) => {
    setVehicleType(typeName);
    const found = VEHICLE_TYPES.find((v) => v.label === typeName);
    if (found) {
      setCapacityTons(found.capacity);
    }
  };

  // Check registration availability with debouncing
  useEffect(() => {
    if (!registration.trim() || registration.trim().length < 4) {
      setRegError(null);
      setRegSuccess(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingReg(true);
      try {
        const res = await apiClient<{ registration_number: string; available: boolean; message: string }>(
          `/vehicles/check-reg?reg=${encodeURIComponent(registration.trim())}`
        );
        if (res.available) {
          setRegError(null);
          setRegSuccess("Registration available for fleet dispatch");
        } else {
          setRegSuccess(null);
          setRegError(`Vehicle '${registration.trim().toUpperCase()}' is already registered in fleet.`);
        }
      } catch {
        setRegError(null);
        setRegSuccess(null);
      } finally {
        setIsCheckingReg(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [registration]);

  // Fetch drivers list on mount
  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoadingDrivers(true);
      try {
        const data = await apiClient<DriverItem[]>("/vehicles/drivers");
        setAvailableDrivers(data);
        if (data.length > 0) {
          // Select first available driver by default
          const firstAvail = data.findIndex((d) => d.status === "AVAILABLE");
          setSelectedDriverIdx(firstAvail >= 0 ? firstAvail : 0);
        }
      } catch (err) {
        console.error("Failed to load driver directory:", err);
      } finally {
        setIsLoadingDrivers(false);
      }
    };
    fetchDrivers();
  }, []);

  // Payload Capacity Validation
  const isPayloadExceeded = weightTons > capacityTons;

  // Add Waypoint helper
  const handleAddWaypoint = () => {
    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: HUBS[1].name, // Default Shillong
      lat: HUBS[1].lat,
      lng: HUBS[1].lng,
    };
    setWaypoints((prev) => [...prev, newWp]);
    setHasCalculated(false); // Invalidate existing routes
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    setHasCalculated(false);
  };

  const handleUpdateWaypoint = (id: string, hubIndex: number) => {
    const hub = HUBS[hubIndex];
    setWaypoints((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, name: hub.name, lat: hub.lat, lng: hub.lng }
          : w
      )
    );
    setHasCalculated(false);
  };

  const handleMoveWaypoint = (index: number, direction: "up" | "down") => {
    setWaypoints((prev) => {
      const arr = [...prev];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      const temp = arr[index];
      arr[index] = arr[targetIdx];
      arr[targetIdx] = temp;
      return arr;
    });
    setHasCalculated(false);
  };

  // Route calculation using existing /routes/optimize endpoint
  const calculateRoutes = async () => {
    setIsCalculatingRoutes(true);
    setRouteCalcError(null);
    try {
      const origin = HUBS[originIdx];
      const dest = HUBS[destIdx];

      const wpPayload = waypoints.map((w) => ({
        name: w.name,
        lat: w.lat,
        lng: w.lng,
      }));

      const data = await apiClient<any[]>("/routes/optimize", {
        method: "POST",
        body: JSON.stringify({
          origin_name: origin.name,
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          destination_name: dest.name,
          dest_lat: dest.lat,
          dest_lng: dest.lng,
          waypoints: wpPayload.length > 0 ? wpPayload : null,
          vehicle_type: vehicleType,
          cargo_priority: priority,
          avoid_blocked_roads: true,
        }),
      });

      if (!data || data.length === 0) {
        setRouteCalcError("Unable to calculate a viable road corridor for these locations.");
        setCandidateRoutes([]);
      } else {
        setCandidateRoutes(data);
        setSelectedRouteIdx(0);
        setHasCalculated(true);
      }
    } catch (err: any) {
      setRouteCalcError(err?.message || "Failed to calculate routes. Please check network connection.");
    } finally {
      setIsCalculatingRoutes(false);
    }
  };

  // Automatically trigger route calculation when stepping into Step 5 if not yet calculated
  useEffect(() => {
    if (currentStep === 5 && !hasCalculated && !isCalculatingRoutes) {
      calculateRoutes();
    }
  }, [currentStep, hasCalculated]);

  // Step Validation Checkers
  const canProceedStep1 = registration.trim().length >= 4 && !regError && capacityTons > 0;
  const canProceedStep2 =
    driverMode === "existing"
      ? selectedDriverIdx >= 0 && availableDrivers[selectedDriverIdx]
      : newDriverName.trim().length >= 2 && newDriverPhone.trim().length >= 6;
  const canProceedStep3 = consignmentTitle.trim().length >= 3 && weightTons > 0 && !isPayloadExceeded;
  const canProceedStep4 = originIdx !== destIdx;
  const canProceedStep5 = candidateRoutes.length > 0 && selectedRouteIdx >= 0;

  // Selected driver resolution
  const activeDriverInfo = useMemo(() => {
    if (driverMode === "existing" && selectedDriverIdx >= 0 && availableDrivers[selectedDriverIdx]) {
      const d = availableDrivers[selectedDriverIdx];
      return { name: d.driver_name, phone: d.driver_phone };
    }
    return { name: newDriverName.trim() || "Unassigned", phone: newDriverPhone.trim() || "+91 90000 00000" };
  }, [driverMode, selectedDriverIdx, availableDrivers, newDriverName, newDriverPhone]);

  // Selected route resolution
  const activeSelectedRoute = useMemo(() => {
    if (candidateRoutes.length > 0 && selectedRouteIdx < candidateRoutes.length) {
      return candidateRoutes[selectedRouteIdx];
    }
    return null;
  }, [candidateRoutes, selectedRouteIdx]);

  // Final Submission
  const handleConfirmAndSave = async () => {
    setIsSubmitting(true);
    try {
      const origin = HUBS[originIdx];
      const dest = HUBS[destIdx];

      const payload = {
        vehicle: {
          registration_number: registration.trim().toUpperCase(),
          vehicle_type: vehicleType,
          capacity_tons: capacityTons,
          driver_name: activeDriverInfo.name,
          driver_phone: activeDriverInfo.phone,
          initial_status: initialStatus,
          fuel_percent: fuelPercent,
        },
        consignment: {
          title: consignmentTitle.trim(),
          cargo_category: cargoCategory,
          cargo_description: cargoDescription.trim(),
          weight_tons: weightTons,
          priority: priority,
          package_count: packageCount,
          instructions: specialInstructions.trim(),
        },
        pickup: {
          name: origin.name,
          lat: origin.lat,
          lng: origin.lng,
          address: `${origin.name}, Northeast Region`,
          scheduled_time: scheduledDeparture ? new Date(scheduledDeparture).toISOString() : null,
        },
        destination: {
          name: dest.name,
          lat: dest.lat,
          lng: dest.lng,
          address: `${dest.name}, Northeast Region`,
        },
        waypoints: waypoints.map((w) => ({
          name: w.name,
          lat: w.lat,
          lng: w.lng,
        })),
        selected_route: activeSelectedRoute
          ? {
              route_name: activeSelectedRoute.route_name,
              distance_km: activeSelectedRoute.distance_km,
              estimated_duration_minutes: activeSelectedRoute.estimated_duration_minutes,
              risk_score: activeSelectedRoute.risk_score || 0.2,
              risk_level: activeSelectedRoute.risk_level || "LOW",
              waypoints_geojson: activeSelectedRoute.waypoints,
              route_status: activeSelectedRoute.route_status || "CLEAR",
              is_recommended: activeSelectedRoute.is_recommended ?? true,
              affecting_incidents_count: activeSelectedRoute.affecting_incidents?.length || 0,
            }
          : null,
      };

      const res = await apiClient<any>("/vehicles/journey", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      addToast({
        title: "Vehicle & Journey Dispatched",
        description: `Vehicle ${res.vehicle.registration_number} registered with consignment ${res.delivery.consignment_code}.`,
        type: "success",
      });

      // Redirect directly to fleet vehicles list
      router.push("/vehicles");
    } catch (err: any) {
      addToast({
        title: "Dispatch Failed",
        description: err?.message || "Failed to create vehicle record. Please try again.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600 transition-colors">SETU-ROUTE</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href="/vehicles" className="hover:text-slate-600 transition-colors">Vehicles</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-brand-600 font-semibold">Add Vehicle Journey</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <span>Add Vehicle & Dispatch Connected Journey</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register new fleet equipment, assign drivers, manifest cargo, and calculate risk-aware road routes.
          </p>
        </div>

        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Fleet</span>
        </Link>
      </div>

      {/* 6-Step Wizard Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {WIZARD_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => {
                  // Only allow jumping back or jumping forward if valid
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={step.id > currentStep}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                  isCurrent
                    ? "bg-brand-600 text-white shadow-xs font-semibold"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 cursor-pointer font-medium"
                    : "bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                    isCurrent
                      ? "bg-white/20 text-white"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <div className="truncate min-w-0">
                  <div className="text-[10px] uppercase tracking-wider opacity-80 leading-none">
                    Step {step.id}
                  </div>
                  <div className="text-xs truncate font-medium mt-0.5">{step.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Content Area */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs">
        {/* STEP 1: VEHICLE DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-600" />
                <span>Step 1: Vehicle Identification & Capacity</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter the official state registration and assign standard equipment classification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Registration Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Registration Number *</span>
                  {isCheckingReg && <span className="text-[11px] text-slate-400">Verifying...</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. AS-01-HC-9821"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    className={cn(
                      "w-full bg-slate-50/80 border rounded-xl px-3.5 py-2.5 text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 transition-all",
                      regError
                        ? "border-rose-400 focus:ring-rose-400/20 text-rose-800"
                        : regSuccess
                        ? "border-emerald-400 focus:ring-emerald-400/20 text-slate-900"
                        : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20 text-slate-900"
                    )}
                  />
                  {regSuccess && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                  {regError && (
                    <AlertTriangle className="w-4 h-4 text-rose-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {regError && <p className="text-[11px] text-rose-600 font-medium">{regError}</p>}
                {regSuccess && <p className="text-[11px] text-emerald-600 font-medium">{regSuccess}</p>}
                <p className="text-[11px] text-slate-400">
                  Standard Northeast regional format (e.g. AS-01-XX-1234, ML-05-D-8821).
                </p>
              </div>

              {/* Vehicle Classification */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Vehicle Classification *</label>
                <select
                  value={vehicleType}
                  onChange={(e) => handleVehicleTypeChange(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                >
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v.label} value={v.label}>
                      {v.label} ({v.capacity}T capacity)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  {VEHICLE_TYPES.find((v) => v.label === vehicleType)?.desc}
                </p>
              </div>

              {/* Maximum Payload Capacity (Tons) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Maximum Payload Capacity (Tons) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="60"
                  value={capacityTons}
                  onChange={(e) => setCapacityTons(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Consignment manifest weights will be strictly validated against this limit.
                </p>
              </div>

              {/* Initial Fuel Level */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Initial Fuel Tank Level</span>
                  <span className="font-mono text-brand-600">{fuelPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={fuelPercent}
                  onChange={(e) => setFuelPercent(parseInt(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Reserve (10%)</span>
                  <span>Half (50%)</span>
                  <span>Full (100%)</span>
                </div>
              </div>

              {/* Initial Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Initial Fleet Status</label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                >
                  <option value="STOPPED">STOPPED (Stationary at Depot)</option>
                  <option value="AVAILABLE">AVAILABLE (Ready for Assignment)</option>
                  <option value="MOVING">MOVING (Immediate Corridor Transit)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedStep1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all"
              >
                <span>Continue to Driver Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DRIVER DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-brand-600" />
                <span>Step 2: Driver Assignment & Telemetry Contact</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select an available driver from the fleet directory or register a new commercial driver.
              </p>
            </div>

            {/* Mode Toggle: Existing vs New */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl max-w-sm">
              <button
                type="button"
                onClick={() => setDriverMode("existing")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all",
                  driverMode === "existing" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Select Existing Driver ({availableDrivers.length})
              </button>
              <button
                type="button"
                onClick={() => setDriverMode("new")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all",
                  driverMode === "new" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                + Register New Driver
              </button>
            </div>

            {driverMode === "existing" ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700">Driver Directory</label>
                {isLoadingDrivers ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading fleet drivers...</div>
                ) : availableDrivers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                    No drivers found. Please register a new driver.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {availableDrivers.map((driver, idx) => {
                      const isSelected = selectedDriverIdx === idx;
                      const isAvailable = driver.status === "AVAILABLE";

                      return (
                        <div
                          key={`${driver.driver_name}-${idx}`}
                          onClick={() => setSelectedDriverIdx(idx)}
                          className={cn(
                            "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                            isSelected
                              ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                              : "border-slate-200/90 hover:border-slate-300 bg-white"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                              {driver.driver_name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-semibold text-slate-900 truncate">
                                {driver.driver_name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{driver.driver_phone}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                isAvailable
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              )}
                            >
                              {isAvailable ? "Available" : "In Transit"}
                            </span>
                            {driver.current_vehicle_reg && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                {driver.current_vehicle_reg}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Driver Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra Das"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Driver Emergency Contact *</label>
                  <input
                    type="tel"
                    placeholder="+91 94350 00000"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedStep2}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all"
              >
                <span>Continue to Consignment</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONSIGNMENT DETAILS */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <span>Step 3: Consignment Manifest & Cargo Payload</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter cargo classifications, consignment priority, and verified freight tonnage.
              </p>
            </div>

            {/* Capacity vs Weight Warning Banner */}
            {isPayloadExceeded && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold">Payload Exceeds Vehicle Capacity!</div>
                  <div className="text-xs mt-0.5">
                    Consignment weight of <strong>{weightTons} Tons</strong> exceeds the selected vehicle maximum capacity of{" "}
                    <strong>{capacityTons} Tons</strong> ({vehicleType}). Please decrease weight or return to Step 1 to select a heavier commercial vehicle.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Title */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Consignment Manifest Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Essential Medical Vaccines & Cold-Chain Insulin"
                  value={consignmentTitle}
                  onChange={(e) => setConsignmentTitle(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              {/* Cargo Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Cargo Category *</label>
                <select
                  value={cargoCategory}
                  onChange={(e) => setCargoCategory(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                >
                  {CARGO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Operational Priority *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                >
                  <option value="CRITICAL">CRITICAL (Emergency Lifeline Corridor)</option>
                  <option value="HIGH">HIGH (Expedited Transit)</option>
                  <option value="NORMAL">NORMAL (Standard Logistics)</option>
                </select>
              </div>

              {/* Weight (Tons) with capacity comparison */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Consignment Weight (Tons) *</span>
                  <span className="text-slate-400 font-normal">Max: {capacityTons}T</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="50"
                  value={weightTons}
                  onChange={(e) => setWeightTons(parseFloat(e.target.value) || 0)}
                  className={cn(
                    "w-full bg-slate-50/80 border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 transition-all",
                    isPayloadExceeded
                      ? "border-rose-400 text-rose-900 focus:ring-rose-400/20"
                      : "border-slate-200 text-slate-900 focus:border-brand-500 focus:ring-brand-500/20"
                  )}
                />
              </div>

              {/* Package Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Number of Packages / Crates</label>
                <input
                  type="number"
                  min="1"
                  value={packageCount}
                  onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-mono"
                />
              </div>

              {/* Handling Instructions */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Special Handling Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Temperature-controlled dry ice container. Fragile cargo. Avoid unpaved detour bypasses."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                disabled={!canProceedStep3}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all"
              >
                <span>Continue to Journey Locations</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PICKUP, DESTINATION & WAYPOINTS */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                <span>Step 4: Pickup, Destination & Intermediate Stops</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure regional origin, optional intermediate waypoints, and final destination depot.
              </p>
            </div>

            <div className="space-y-4">
              {/* Pickup / Origin Hub */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      A
                    </span>
                    <span className="text-xs font-bold text-slate-900">Pickup Origin *</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Hub Coordinates: {HUBS[originIdx].lat}, {HUBS[originIdx].lng}</span>
                </div>
                <select
                  value={originIdx}
                  onChange={(e) => {
                    setOriginIdx(parseInt(e.target.value));
                    setHasCalculated(false);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium cursor-pointer"
                >
                  {HUBS.map((h, i) => (
                    <option key={h.name} value={i} disabled={i === destIdx}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Waypoints / Intermediate Stops */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-slate-400" />
                    <span>Intermediate Stops / Waypoints ({waypoints.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddWaypoint}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Intermediate Stop</span>
                  </button>
                </div>

                {waypoints.length === 0 ? (
                  <div className="p-3.5 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No intermediate stops added. Route will calculate directly from Origin to Destination.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {waypoints.map((wp, idx) => (
                      <div
                        key={wp.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="flex-1">
                          <select
                            value={HUBS.findIndex((h) => h.name === wp.name)}
                            onChange={(e) => handleUpdateWaypoint(wp.id, parseInt(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium cursor-pointer"
                          >
                            {HUBS.map((h, i) => (
                              <option key={h.name} value={i}>
                                {h.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveWaypoint(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveWaypoint(idx, "down")}
                            disabled={idx === waypoints.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWaypoint(wp.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 transition-colors"
                            title="Remove Stop"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Hub */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                      B
                    </span>
                    <span className="text-xs font-bold text-slate-900">Destination Depot *</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Hub Coordinates: {HUBS[destIdx].lat}, {HUBS[destIdx].lng}</span>
                </div>
                <select
                  value={destIdx}
                  onChange={(e) => {
                    setDestIdx(parseInt(e.target.value));
                    setHasCalculated(false);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium cursor-pointer"
                >
                  {HUBS.map((h, i) => (
                    <option key={h.name} value={i} disabled={i === originIdx}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Departure Time */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Scheduled Departure Window</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDeparture}
                  onChange={(e) => setScheduledDeparture(e.target.value)}
                  className="w-full sm:w-72 bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                disabled={!canProceedStep4}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all"
              >
                <span>Calculate & Select Route</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: ROUTE CALCULATION & MAP SELECTION */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <RouteIcon className="w-5 h-5 text-brand-600" />
                  <span>Step 5: Road-Network Routing & Real-Time Intelligence</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated using MDoNER Graph Engine with dynamic terrain, weather, and incident correlation.
                </p>
              </div>

              <button
                type="button"
                onClick={calculateRoutes}
                disabled={isCalculatingRoutes}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors shrink-0"
              >
                <RotateCcw className={cn("w-3.5 h-3.5", isCalculatingRoutes && "animate-spin")} />
                <span>Recalculate Routes</span>
              </button>
            </div>

            {/* Error Banner */}
            {routeCalcError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{routeCalcError}</span>
                </div>
                <button
                  onClick={calculateRoutes}
                  className="underline font-bold hover:text-rose-900 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Route Cards + Interactive MapLibre Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[480px]">
              {/* Left 5 Cols: Candidate Route Cards */}
              <div className="lg:col-span-5 space-y-3 order-2 lg:order-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Active Corridor ({candidateRoutes.length} options)
                </div>

                {isCalculatingRoutes ? (
                  <div className="p-12 text-center text-xs text-slate-400 border rounded-2xl flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                    <span>Calculating real road routes and correlating active incidents...</span>
                  </div>
                ) : candidateRoutes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-2xl">
                    No routes calculated. Click Recalculate to generate options.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidateRoutes.map((route, idx) => {
                      const isSelected = selectedRouteIdx === idx;
                      const isBlocked = route.is_blocked || route.route_status === "BLOCKED";
                      const isRecommended = route.is_recommended;
                      const affectingCount = route.affecting_incidents?.length || 0;

                      return (
                        <div
                          key={route.id || idx}
                          onClick={() => setSelectedRouteIdx(idx)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer relative",
                            isSelected
                              ? "border-brand-500 bg-brand-50/30 ring-2 ring-brand-500/20 shadow-xs"
                              : "border-slate-200/90 hover:border-slate-300 bg-white"
                          )}
                        >
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              {isRecommended && (
                                <span className="px-2 py-0.5 rounded-md bg-brand-600 text-white font-bold text-[10px] tracking-wide uppercase">
                                  ★ Recommended
                                </span>
                              )}
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase",
                                  isBlocked
                                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                                    : route.route_status === "CAUTION"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                )}
                              >
                                {route.route_status || (isBlocked ? "BLOCKED" : "CLEAR")}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono text-slate-500 font-semibold">
                              Risk Score: {Math.round((route.risk_score || 0.2) * 100)}/100
                            </span>
                          </div>

                          {/* Route Name */}
                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            {route.route_name}
                          </div>

                          {/* Distance & ETA */}
                          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mt-2.5 pt-2.5 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono font-bold">{route.distance_km} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {Math.floor(route.estimated_duration_minutes / 60)}h{" "}
                                {route.estimated_duration_minutes % 60}m
                              </span>
                            </div>
                            {affectingCount > 0 ? (
                              <div className="flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{affectingCount} Active Incident{affectingCount > 1 ? "s" : ""}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>0 Incidents</span>
                              </div>
                            )}
                          </div>

                          {/* Safety Rationale or Incident Summary */}
                          {route.safety_rationale && (
                            <div className="text-[11px] text-brand-700 bg-brand-50 p-2 rounded-lg mt-2 font-medium">
                              {route.safety_rationale}
                            </div>
                          )}
                          {route.incident_summary && isBlocked && (
                            <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg mt-2 font-medium">
                              {route.incident_summary}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right 7 Cols: Interactive Map */}
              <div className="lg:col-span-7 h-96 lg:h-auto min-h-[420px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs relative order-1 lg:order-2">
                <MapLibreView
                  className="w-full h-full"
                  candidateRoutes={candidateRoutes.map((r, i) => ({
                    id: r.id || `r-${i}`,
                    name: r.route_name,
                    waypoints: r.waypoints,
                    distance_km: r.distance_km,
                    eta_formatted: `${Math.floor(r.estimated_duration_minutes / 60)}h ${r.estimated_duration_minutes % 60}m`,
                    logistics_risk_score: r.risk_score,
                    is_recommended: r.is_recommended,
                    is_blocked: r.is_blocked,
                    color: i === 0 ? "#1E40AF" : i === 1 ? "#0D9488" : "#F59E0B",
                  }))}
                  activeRouteIndex={selectedRouteIdx}
                  onSelectRoute={(idx) => setSelectedRouteIdx(idx)}
                  showToolbox={false}
                  showLayerController={false}
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                disabled={!canProceedStep5}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all"
              >
                <span>Review & Confirm</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & CONFIRM */}
        {currentStep === 6 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-600" />
                <span>Step 6: Review Complete Vehicle Journey</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verify all operational specifications before saving the atomic connected record.
              </p>
            </div>

            <div className="space-y-4">
              {/* Card 1: Vehicle Details */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Truck className="w-4 h-4 text-brand-600" />
                    <span>Vehicle Specifications</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-brand-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Registration</span>
                    <span className="font-mono font-bold text-slate-900">{registration.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Classification</span>
                    <span className="font-medium text-slate-800">{vehicleType}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Capacity Limit</span>
                    <span className="font-mono font-bold text-slate-900">{capacityTons} Tons</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Initial Status / Fuel</span>
                    <span className="font-medium text-slate-800">
                      {initialStatus} ({fuelPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Driver Details */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <User className="w-4 h-4 text-brand-600" />
                    <span>Assigned Driver</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-brand-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Driver Name</span>
                    <span className="font-medium text-slate-900">{activeDriverInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Emergency Contact</span>
                    <span className="font-mono text-slate-800">{activeDriverInfo.phone}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Consignment Cargo */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Package className="w-4 h-4 text-brand-600" />
                    <span>Consignment Manifest</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-brand-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="col-span-2">
                    <span className="text-[11px] text-slate-400 block">Manifest Title</span>
                    <span className="font-semibold text-slate-900">{consignmentTitle}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Category</span>
                    <span className="font-medium text-slate-800">{cargoCategory}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Weight / Capacity</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {weightTons}T / {capacityTons}T
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Journey & Selected Route */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <RouteIcon className="w-4 h-4 text-brand-600" />
                    <span>Route & Transit Corridor</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-xs text-brand-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-bold text-emerald-600">Origin:</span>
                    <span>{HUBS[originIdx].name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-rose-600">Dest:</span>
                    <span>{HUBS[destIdx].name}</span>
                  </div>
                  {waypoints.length > 0 && (
                    <div className="text-[11px] text-slate-500">
                      Via {waypoints.length} Intermediate Stop{waypoints.length > 1 ? "s" : ""}:{" "}
                      {waypoints.map((w) => w.name).join(" → ")}
                    </div>
                  )}
                  {activeSelectedRoute && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs mt-2">
                      <span className="font-bold text-slate-900">{activeSelectedRoute.route_name}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span>{activeSelectedRoute.distance_km} km</span>
                        <span>
                          {Math.floor(activeSelectedRoute.estimated_duration_minutes / 60)}h{" "}
                          {activeSelectedRoute.estimated_duration_minutes % 60}m
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            activeSelectedRoute.route_status === "CLEAR"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {activeSelectedRoute.route_status || "CLEAR"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={isSubmitting}
                id="btn-confirm-dispatch-vehicle"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-brand-500/20 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transacting & Dispatching...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Dispatch Vehicle Journey</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
