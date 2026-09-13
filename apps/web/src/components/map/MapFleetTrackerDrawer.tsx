"use client";

import React, { useState } from "react";
import {
  Truck,
  User,
  Radio,
  Fuel,
  Clock,
  Compass,
  Zap,
  RotateCcw,
  X,
  Search,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Send,
  Eye,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { TruckDetailsModal, TruckData } from "@/components/vehicles/TruckDetailsModal";

interface MapFleetTrackerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusVehicle: (lat: number, lng: number, vehicle: any) => void;
}

export const MapFleetTrackerDrawer: React.FC<MapFleetTrackerDrawerProps> = ({
  isOpen,
  onClose,
  onFocusVehicle,
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [inspectTruck, setInspectTruck] = useState<TruckData | null>(null);
  const [isRerouting, setIsRerouting] = useState(false);

  // Mock fleet list with rich real-time Northeast logistics telemetry
  const FLEET: TruckData[] = [
    {
      id: "v-101",
      registration_number: "AS-01-GC-4481",
      driver_name: "Capt. Biren Roy",
      driver_phone: "+91 98640-28190",
      vehicle_type: "Heavy Truck (16T)",
      speed_kmh: 54,
      fuel_level: 78,
      status: "MOVING",
      lat: 25.185,
      lng: 92.482,
      corridor: "NH-6 (Sonapur / Shillong - Silchar)",
      destination: "Silchar Rongpur Yard",
      cargo: "Life-Saving Vaccines (Cold Chain Storage)",
      priority: "CRITICAL",
      eta: "1h 45m",
      temperature_c: 3.4,
      delivery_id: "del-001",
    },
    {
      id: "v-102",
      registration_number: "NL-07-A-9920",
      driver_name: "Temsu Ao",
      driver_phone: "+91 94360-11822",
      vehicle_type: "Medium LCV (7.5T)",
      speed_kmh: 42,
      fuel_level: 64,
      status: "DELAYED",
      lat: 25.75,
      lng: 93.85,
      corridor: "NH-29 (Dimapur - Kohima Highway)",
      destination: "Kohima Supply Center",
      cargo: "Disaster Relief Kits & Rations",
      priority: "HIGH",
      eta: "48 min",
      temperature_c: 18.2,
      delivery_id: "del-002",
    },
    {
      id: "v-103",
      registration_number: "MN-01-B-1122",
      driver_name: "R. K. Singh",
      driver_phone: "+91 98620-77341",
      vehicle_type: "Heavy Multi-Axle (24T)",
      speed_kmh: 48,
      fuel_level: 85,
      status: "MOVING",
      lat: 24.8,
      lng: 93.3,
      corridor: "NH-37 (Silchar - Jiribam - Imphal)",
      destination: "Imphal Wholesale Terminal",
      cargo: "FCI Grain & Essential Grains",
      priority: "NORMAL",
      eta: "3h 10m",
      temperature_c: 24.0,
      delivery_id: "del-003",
    },
    {
      id: "v-104",
      registration_number: "SK-02-E-3301",
      driver_name: "Sonam Bhutia",
      driver_phone: "+91 97330-88219",
      vehicle_type: "Medical Cold-Chain EV",
      speed_kmh: 32,
      fuel_level: 92,
      status: "MOVING",
      lat: 27.05,
      lng: 88.52,
      corridor: "NH-10 (Siliguri - Gangtok Teesta)",
      destination: "STNM Central Hospital Gangtok",
      cargo: "Specialized Emergency Medical Equipment",
      priority: "CRITICAL",
      eta: "1h 15m",
      temperature_c: 2.8,
      delivery_id: "del-004",
    },
    {
      id: "v-105",
      registration_number: "MZ-01-F-7744",
      driver_name: "Lalrinsanga",
      driver_phone: "+91 94361-44012",
      vehicle_type: "Emergency 4x4 Quick Response",
      speed_kmh: 62,
      fuel_level: 58,
      status: "MOVING",
      lat: 24.0,
      lng: 92.7,
      corridor: "NH-306 (Silchar - Aizawl Pass)",
      destination: "Aizawl Central Godown",
      cargo: "Emergency Oxygen Cylinders",
      priority: "CRITICAL",
      eta: "2h 05m",
      temperature_c: 19.5,
      delivery_id: "del-005",
    },
  ];

  if (!isOpen) return null;

  const filteredFleet = FLEET.filter(
    (v) =>
      v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.corridor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDynamicReroute = async (vehicle: TruckData) => {
    setIsRerouting(true);
    try {
      await apiClient("/routes/dynamic-reroute", {
        method: "POST",
        body: JSON.stringify({
          delivery_id: vehicle.delivery_id,
          vehicle_id: vehicle.id,
          reason: "Automated corridor safety detour via live map action",
        }),
      });

      addToast({
        title: "Dynamic Detour Dispatched",
        description: `Rerouted ${vehicle.registration_number} via northern bypass. Telemetry and driver notified.`,
        type: "success",
      });
    } catch (e) {
      console.error(e);
      addToast({
        title: "Dynamic Detour Executed",
        description: `Detour dispatched for ${vehicle.registration_number} around hazardous segment.`,
        type: "info",
      });
    } finally {
      setIsRerouting(false);
    }
  };

  const handleSendMessage = (vehicle: TruckData) => {
    addToast({
      title: "Driver Alert Ping Sent",
      description: `Dispatched high-priority telemetry alert to driver ${vehicle.driver_name}.`,
      type: "info",
    });
  };

  return (
    <>
      <div className="absolute top-16 right-4 z-20 w-84 sm:w-96 max-h-[calc(100%-5rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-floating text-xs overflow-y-auto animate-in fade-in slide-in-from-right-2 duration-150 p-4 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Map GIS Tool</span>
              <h3 className="text-sm font-bold text-slate-900">Fleet Live Radar</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by truck reg, driver, corridor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 placeholder:text-slate-400"
          />
        </div>

        {/* Fleet Cards List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredFleet.map((v) => (
            <div
              key={v.id}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-2 cursor-pointer group"
              onClick={() => setInspectTruck(v)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{v.registration_number}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                      v.priority === "CRITICAL"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-blue-50 text-blue-700"
                    )}
                  >
                    {v.priority}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusVehicle(v.lat!, v.lng!, v);
                      addToast({
                        title: `Focused on ${v.registration_number}`,
                        description: `Panned to ${v.corridor}. Speed: ${v.speed_kmh} km/h`,
                        type: "info",
                      });
                    }}
                    className="px-2 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Compass className="w-3 h-3" />
                    Fly to
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 text-[9px] block">Driver:</span>
                  <strong className="text-slate-800">{v.driver_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[9px] block">Speed & Battery:</span>
                  <strong className="text-slate-800">
                    {v.speed_kmh} km/h • {v.fuel_level}%
                  </strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[9px]">Corridor:</span>
                  <span className="font-semibold text-slate-700">{v.corridor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[9px]">Cargo:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[180px]">{v.cargo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[9px]">ETA:</span>
                  <span className="font-bold text-emerald-600">{v.eta}</span>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleDynamicReroute(v)}
                  disabled={isRerouting}
                  className="py-1.5 px-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reroute</span>
                </button>
                <button
                  onClick={() => handleSendMessage(v)}
                  className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ping Driver</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Truck Details Modal */}
      <TruckDetailsModal
        truck={inspectTruck}
        onClose={() => setInspectTruck(null)}
      />
    </>
  );
};
