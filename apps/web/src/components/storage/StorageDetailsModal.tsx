"use client";

import React from "react";
import {
  Snowflake,
  Warehouse,
  Thermometer,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  Truck,
  CheckCircle2,
  AlertTriangle,
  X,
  Navigation,
  Send,
  Building2,
  Layers,
  Droplets,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

export interface StorageUnitData {
  id: string;
  name: string;
  type: "COLD_STORAGE" | "DRY_STORAGE" | "CRYO_PHARMA";
  state: string;
  corridor: string;
  lat: number;
  lng: number;
  total_capacity_mt: number;
  occupied_capacity_mt: number;
  temperature_c?: number;
  humidity_pct?: number;
  power_backup_status: string;
  primary_commodities: string[];
  active_docking_bays: number;
  total_docking_bays: number;
  manager_name: string;
  manager_phone: string;
  emergency_buffer_days: number;
}

interface StorageDetailsModalProps {
  storage: StorageUnitData | null;
  onClose: () => void;
  onSelectAsRouteNode?: (storage: StorageUnitData, isOrigin: boolean) => void;
}

export const StorageDetailsModal: React.FC<StorageDetailsModalProps> = ({
  storage,
  onClose,
  onSelectAsRouteNode,
}) => {
  const { addToast } = useToast();

  if (!storage) return null;

  const isCold = storage.type === "COLD_STORAGE" || storage.type === "CRYO_PHARMA";
  const utilizationPct = Math.round((storage.occupied_capacity_mt / storage.total_capacity_mt) * 100);

  const handleSetRoute = (isOrigin: boolean) => {
    if (onSelectAsRouteNode) {
      onSelectAsRouteNode(storage, isOrigin);
    }
    addToast({
      title: isOrigin ? "Set as Origin Hub" : "Set as Destination Terminal",
      description: `${storage.name} loaded into AI Route Optimizer.`,
      type: "success",
    });
    onClose();
  };

  const handleDispatch = () => {
    addToast({
      title: "Consignment Dispatched to Storage",
      description: `Automated transport manifest generated for ${storage.name}.`,
      type: "success",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-2xl shadow-floating p-6 space-y-5 text-xs animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm",
                isCold
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20"
                  : "bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20"
              )}
            >
              {isCold ? <Snowflake className="w-6 h-6 animate-spin-slow" /> : <Warehouse className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    isCold
                      ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  )}
                >
                  {isCold ? "❄️ Cold Storage & Cold Chain Hub" : "🏢 Strategic Food & Dry Warehouse"}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {storage.state}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                {storage.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Temperature (for cold) or Security */}
          {isCold ? (
            <div className="bg-cyan-50/70 p-3 rounded-xl border border-cyan-200/80 space-y-1">
              <span className="text-cyan-700 text-[10px] font-medium flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-cyan-600" /> Chamber Temp
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-cyan-950">{storage.temperature_c}°C</span>
              </div>
              <span className="text-[10px] text-cyan-700 font-semibold block">Cryo Safe Range</span>
            </div>
          ) : (
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 space-y-1">
              <span className="text-emerald-700 text-[10px] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Security Rating
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-emerald-950">Grade A</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">CWC Certified</span>
            </div>
          )}

          {/* Total Capacity Utilization */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-brand-600" /> Stock Utilization
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900">{utilizationPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  utilizationPct > 85 ? "bg-rose-500" : utilizationPct > 65 ? "bg-emerald-500" : "bg-blue-500"
                )}
                style={{ width: `${utilizationPct}%` }}
              />
            </div>
          </div>

          {/* Docking Bays */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-blue-600" /> Docking Bays
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900">
                {storage.active_docking_bays} / {storage.total_docking_bays}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block">Available for Unload</span>
          </div>

          {/* Backup Power / Buffer Days */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Power Backup
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-900 truncate">{storage.power_backup_status}</span>
            </div>
            <span className="text-[10px] text-slate-500 block">{storage.emergency_buffer_days}d Food Reserve</span>
          </div>
        </div>

        {/* Capacity Details & Inventory Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Capacity Tonnage:</span>
            <strong className="text-slate-900">
              {storage.occupied_capacity_mt.toLocaleString()} MT / {storage.total_capacity_mt.toLocaleString()} MT Total
            </strong>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", isCold ? "bg-cyan-500" : "bg-emerald-500")}
              style={{ width: `${utilizationPct}%` }}
            />
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Primary Stockpiled Commodities:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {storage.primary_commodities.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-medium shadow-2xs"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Geographic Highway Corridor Location */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-600" /> Transit Corridor Link
            </span>
            <strong className="text-slate-900 block">{storage.corridor}</strong>
            <span className="font-mono text-[10px] text-slate-500">
              {storage.lat.toFixed(4)}° N, {storage.lng.toFixed(4)}° E
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Depot Manager</span>
            <strong className="text-slate-800 block">{storage.manager_name}</strong>
            <span className="text-[10px] text-slate-500">{storage.manager_phone}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSetRoute(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-brand-600" />
              <span>Route From Here</span>
            </button>
            <button
              onClick={() => handleSetRoute(false)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Route To Here</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDispatch}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Consignment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
