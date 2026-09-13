"use client";

import React, { useState } from "react";
import {
  Navigation,
  ArrowRightLeft,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send,
  X,
  RotateCcw,
  TrendingDown,
  Mountain,
  Layers,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

export const HUBS = [
  { name: "Guwahati Logistics Hub (Assam)", lat: 26.1445, lng: 91.7362, state: "Assam" },
  { name: "Shillong Civil Depot (Meghalaya)", lat: 25.5788, lng: 91.8933, state: "Meghalaya" },
  { name: "Silchar Rongpur Yard (Assam/Barak)", lat: 24.8333, lng: 92.7789, state: "Assam" },
  { name: "Imphal Wholesale Terminal (Manipur)", lat: 24.8170, lng: 93.9368, state: "Manipur" },
  { name: "Moreh Indo-Myanmar Trade ICP (Manipur)", lat: 24.2450, lng: 94.3000, state: "Manipur" },
  { name: "Dimapur Railhead Depot (Nagaland)", lat: 25.9068, lng: 93.7270, state: "Nagaland" },
  { name: "Kohima Supply Center (Nagaland)", lat: 25.6751, lng: 94.1086, state: "Nagaland" },
  { name: "Mokokchung Hill Depot (Nagaland)", lat: 26.3200, lng: 94.5200, state: "Nagaland" },
  { name: "Aizawl FCI Godown (Mizoram)", lat: 23.7307, lng: 92.7173, state: "Mizoram" },
  { name: "Lunglei Southern Depot (Mizoram)", lat: 22.8800, lng: 92.7400, state: "Mizoram" },
  { name: "Agartala Central Yard (Tripura)", lat: 23.8315, lng: 91.2868, state: "Tripura" },
  { name: "Sabroom Port Link Terminal (Tripura)", lat: 23.0000, lng: 91.7000, state: "Tripura" },
  { name: "Tezpur Logistics Base (Assam)", lat: 26.6528, lng: 92.7926, state: "Assam" },
  { name: "Dibrugarh Rail-Road Transhipment Terminal (Assam)", lat: 27.4728, lng: 94.9120, state: "Assam" },
  { name: "Itanagar Central Depot (Arunachal)", lat: 27.0844, lng: 93.6053, state: "Arunachal Pradesh" },
  { name: "Pasighat Trans-Arunachal Hub (Arunachal)", lat: 28.0660, lng: 95.3300, state: "Arunachal Pradesh" },
  { name: "Ziro High-Plateau Base (Arunachal)", lat: 27.5300, lng: 93.8300, state: "Arunachal Pradesh" },
  { name: "Tawang High-Altitude Depot (Arunachal)", lat: 27.5861, lng: 91.8594, state: "Arunachal Pradesh" },
  { name: "Gangtok STNM Hub (Sikkim)", lat: 27.3314, lng: 88.6138, state: "Sikkim" },
  { name: "Nathu La Pass High Alpine Post (Sikkim)", lat: 27.3860, lng: 88.8500, state: "Sikkim" },
  { name: "Tura Garo Hills Supply Depot (Meghalaya)", lat: 25.5200, lng: 90.2200, state: "Meghalaya" },
  { name: "Siliguri Gateway Freight Terminal (West Bengal)", lat: 26.7271, lng: 88.3953, state: "West Bengal" },
];

interface MapRoutePlannerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutesCalculated: (routes: any[]) => void;
  onClearRoutes: () => void;
  activeRoute: any | null;
}

export const MapRoutePlannerDrawer: React.FC<MapRoutePlannerDrawerProps> = ({
  isOpen,
  onClose,
  onRoutesCalculated,
  onClearRoutes,
  activeRoute,
}) => {
  const { addToast } = useToast();
  const [originIdx, setOriginIdx] = useState(0); // Guwahati
  const [destIdx, setDestIdx] = useState(3); // Imphal
  const [vehicleType, setVehicleType] = useState("Heavy Truck (16T)");
  const [cargoPriority, setCargoPriority] = useState("CRITICAL");
  const [avoidBlocked, setAvoidBlocked] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [candidateRoutes, setCandidateRoutes] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!isOpen) return null;

  const handleSwap = () => {
    const temp = originIdx;
    setOriginIdx(destIdx);
    setDestIdx(temp);
  };

  const handleCalculateRoute = async () => {
    setIsLoading(true);
    try {
      const origin = HUBS[originIdx];
      const dest = HUBS[destIdx];

      const data = await apiClient<any[]>("/routes/optimize", {
        method: "POST",
        body: JSON.stringify({
          origin_name: origin.name,
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          destination_name: dest.name,
          dest_lat: dest.lat,
          dest_lng: dest.lng,
          vehicle_type: vehicleType,
          cargo_priority: cargoPriority,
          avoid_blocked_roads: avoidBlocked,
        }),
      });

      if (!data || data.length === 0 || !data[0]?.waypoints?.coordinates || data[0].waypoints.coordinates.length < 2) {
        addToast({
          title: "No Drivable Route",
          description: "No drivable road route could be found between these locations.",
          type: "error",
        });
        return;
      }

      setCandidateRoutes(data);
      setSelectedIdx(0);
      onRoutesCalculated(data);

      addToast({
        title: "Road Route Calculated",
        description: `Generated ${data.length} candidate road paths via actual highway network.`,
        type: "success",
      });
    } catch (e) {
      console.error(e);
      addToast({
        title: "No Drivable Route",
        description: "No drivable road route could be found between these locations.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = (idx: number) => {
    setSelectedIdx(idx);
    const reordered = [
      candidateRoutes[idx],
      ...candidateRoutes.filter((_, i) => i !== idx),
    ];
    onRoutesCalculated(reordered);
  };

  const handleDispatch = () => {
    const current = candidateRoutes[selectedIdx] || activeRoute;
    addToast({
      title: "Consignment Dispatched Along Route",
      description: `Dispatched via ${current?.route_name || "Primary Corridor"}. Telemetry linked to command center.`,
      type: "success",
    });
  };

  return (
    <div className="absolute top-16 left-4 z-20 w-84 sm:w-96 max-h-[calc(100%-5rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-floating text-xs overflow-y-auto animate-in fade-in slide-in-from-left-2 duration-150 p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Map GIS Tool</span>
            <h3 className="text-sm font-bold text-slate-900">AI Route Planner</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          aria-label="Close route planner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Origin & Destination */}
      <div className="space-y-2 relative">
        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
            Origin Hub (Start)
          </label>
          <select
            value={originIdx}
            onChange={(e) => setOriginIdx(Number(e.target.value))}
            className="w-full bg-transparent border-0 text-slate-900 font-semibold text-xs focus:ring-0 cursor-pointer p-0"
          >
            {HUBS.map((h, i) => (
              <option key={i} value={i} disabled={i === destIdx}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap button */}
        <div className="flex justify-center -my-1.5 relative z-10">
          <button
            onClick={handleSwap}
            title="Swap Origin and Destination"
            className="p-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-slate-600 hover:text-brand-600 hover:bg-slate-50 transition-all hover:scale-110"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
            Destination Terminal
          </label>
          <select
            value={destIdx}
            onChange={(e) => setDestIdx(Number(e.target.value))}
            className="w-full bg-transparent border-0 text-slate-900 font-semibold text-xs focus:ring-0 cursor-pointer p-0"
          >
            {HUBS.map((h, i) => (
              <option key={i} value={i} disabled={i === originIdx}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle & Cargo Priority Controls */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/80">
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vehicle Type</label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full bg-transparent border-0 text-slate-800 font-medium text-xs focus:ring-0 cursor-pointer p-0"
          >
            <option value="Heavy Truck (16T)">Heavy Truck (16T)</option>
            <option value="Medium LCV (7.5T)">Medium LCV (7.5T)</option>
            <option value="Medical Cold-Chain EV">Medical Cold-Chain EV</option>
            <option value="Emergency 4x4 Quick Response">Emergency 4x4 QRF</option>
          </select>
        </div>

        <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/80">
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cargo Priority</label>
          <select
            value={cargoPriority}
            onChange={(e) => setCargoPriority(e.target.value)}
            className="w-full bg-transparent border-0 text-slate-800 font-medium text-xs focus:ring-0 cursor-pointer p-0"
          >
            <option value="CRITICAL">🔴 Critical Medical</option>
            <option value="HIGH">🟡 High / Essential</option>
            <option value="NORMAL">🟢 Normal Freight</option>
          </select>
        </div>
      </div>

      {/* Avoid Blocked Road Checkbox */}
      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/60 border border-slate-200/60 cursor-pointer">
        <input
          type="checkbox"
          checked={avoidBlocked}
          onChange={(e) => setAvoidBlocked(e.target.checked)}
          className="rounded text-brand-600 focus:ring-0 border-slate-300"
        />
        <span className="text-[11px] font-medium text-slate-700">Avoid Active Landslide / Flood Corridors</span>
      </label>

      {/* Calculate Button */}
      <div className="flex gap-2">
        <button
          onClick={handleCalculateRoute}
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
          <span>{isLoading ? "Calculating road route..." : "Calculate Route on Map"}</span>
        </button>

        {candidateRoutes.length > 0 && (
          <button
            onClick={() => {
              setCandidateRoutes([]);
              onClearRoutes();
              addToast({ title: "Routes Cleared", description: "Removed route paths from map canvas.", type: "info" });
            }}
            title="Clear route from map"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Candidate Route Result Cards */}
      {candidateRoutes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Generated Candidate Routes ({candidateRoutes.length})
          </span>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {candidateRoutes.map((r, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectCandidate(idx)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer space-y-1.5",
                    isSelected
                      ? "bg-brand-50/70 border-brand-300 shadow-xs ring-1 ring-brand-400"
                      : "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                      {r.route_name}
                    </span>
                    {r.is_recommended ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                        Recommended
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                        Alternative
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-600 pt-0.5">
                    <div>
                      <span className="text-slate-400 text-[9px] block">Distance</span>
                      <strong className="text-slate-800">{r.distance_km} km</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] block">Duration</span>
                      <strong className="text-slate-800">
                        {Math.floor(r.estimated_duration_minutes / 60)}h {r.estimated_duration_minutes % 60}m
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] block">Risk Score</span>
                      <strong className={cn(r.risk_level === "CRITICAL" ? "text-rose-600" : r.risk_level === "HIGH" ? "text-amber-600" : "text-emerald-600")}>
                        {r.risk_score} / 100
                      </strong>
                    </div>
                  </div>

                  {r.safety_rationale && (
                    <p className="text-[10px] text-slate-500 leading-snug pt-1 border-t border-slate-200/60">
                      {r.safety_rationale}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Direct Dispatch Action */}
          <button
            onClick={handleDispatch}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Fleet on Selected Route</span>
          </button>
        </div>
      )}
    </div>
  );
};
