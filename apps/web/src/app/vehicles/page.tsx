"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  Phone,
  Navigation,
  Fuel,
  Activity,
  MapPin,
  Clock,
  AlertCircle,
  Search,
  CheckCircle,
  Radio,
  Gauge,
  User,
  ShieldCheck,
  RotateCcw,
  Thermometer,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Vehicle } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";
import { TruckDetailsModal, TruckData } from "@/components/vehicles/TruckDetailsModal";

export default function VehiclesPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTruck, setActiveTruck] = useState<TruckData | null>(null);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["vehicles", selectedStatus],
    queryFn: () => {
      let endpoint = "/vehicles?";
      if (selectedStatus !== "ALL") endpoint += `status=${selectedStatus}&`;
      return apiClient<Vehicle[]>(endpoint);
    },
    refetchInterval: 4000,
  });

  const filteredVehicles = (vehicles || []).filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.registration_number.toLowerCase().includes(q) ||
      v.driver_name.toLowerCase().includes(q) ||
      v.vehicle_type.toLowerCase().includes(q) ||
      (v.destination_name && v.destination_name.toLowerCase().includes(q))
    );
  });

  const totalMoving = (vehicles || []).filter((v) => v.current_status === "MOVING").length;
  const totalDelayed = (vehicles || []).filter((v) => v.current_status === "DELAYED").length;
  const totalEmergency = (vehicles || []).filter((v) => v.is_sos || v.current_status === "EMERGENCY").length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>MDoNER Live Telemetry Stream</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <span>Active Fleet Convoys & Telemetry</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time GPS surveillance, speed telemetry, emergency SOS alerts & corridor transit tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-emerald-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Truck className="w-3.5 h-3.5" />
            <span>{totalMoving} Trucks In Transit</span>
          </div>
          {totalEmergency > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl text-rose-800 shadow-sm animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{totalEmergency} SOS Alert</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search truck registration, driver, destination or cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-44 bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          >
            <option value="ALL">All Trucks ({vehicles?.length || 0})</option>
            <option value="MOVING">Moving ({totalMoving})</option>
            <option value="DELAYED">Delayed ({totalDelayed})</option>
            <option value="STOPPED">Stopped</option>
            <option value="EMERGENCY">Emergency / SOS</option>
          </select>
        </div>

        <div className="text-xs font-medium text-slate-400 shrink-0 hidden lg:block">
          Showing {filteredVehicles.length} trucks
        </div>
      </div>

      {/* Vehicles Grid */}
      {isLoading ? (
        <LoadingState message="Connecting to vehicle GPS streams..." />
      ) : filteredVehicles.length === 0 ? (
        <EmptyState
          title="No Trucks Matching Filter"
          description="No active fleet units match your current search query or filter selection."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((veh) => {
            const truckData: TruckData = {
              id: veh.id,
              registration_number: veh.registration_number,
              driver_name: veh.driver_name,
              driver_phone: veh.driver_phone,
              vehicle_type: veh.vehicle_type,
              speed_kmh: veh.speed_kmh,
              fuel_level: veh.fuel_percent,
              current_status: veh.current_status,
              current_lat: veh.current_lat,
              current_lng: veh.current_lng,
              destination: veh.destination_name,
              cargo: `Payload: ${veh.capacity_tons} Tons | High Priority Consignment`,
              priority: veh.is_sos ? "CRITICAL" : "HIGH",
              eta: "1h 30m",
              temperature_c: 3.6,
            };

            return (
              <div
                key={veh.id}
                onClick={() => setActiveTruck(truckData)}
                className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-300 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 tracking-tight block">
                        {veh.registration_number}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">{veh.vehicle_type}</p>
                    </div>
                  </div>
                  <StatusBadge status={veh.is_sos ? "EMERGENCY" : veh.current_status} size="sm" />
                </div>

                {/* Stats Box */}
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Speed</span>
                    <span className="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      {veh.speed_kmh} km/h
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Fuel Level</span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            veh.fuel_percent > 40 ? "bg-emerald-500" : veh.fuel_percent > 20 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${veh.fuel_percent}%` }}
                        />
                      </div>
                      <span className="text-slate-700 font-bold text-[11px]">{veh.fuel_percent.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Driver</span>
                    <span className="text-slate-700 font-medium truncate block mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{veh.driver_name}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Destination</span>
                    <span className="text-slate-700 font-medium truncate block mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-500 shrink-0" />
                      <span className="truncate">{veh.destination_name || "Unassigned"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    GPS updated {formatRelativeTime(veh.last_ping_at)}
                  </span>
                  <span className="text-brand-600 font-semibold group-hover:underline text-[11px] flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>Inspect Truck →</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Truck Details Modal */}
      <TruckDetailsModal
        truck={activeTruck}
        onClose={() => setActiveTruck(null)}
      />
    </div>
  );
}
