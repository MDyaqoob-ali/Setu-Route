"use client";

import React, { useState } from "react";
import {
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  AlertTriangle,
  X,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

interface MapWeatherRadarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusStation: (lat: number, lng: number, name: string) => void;
}

export const WEATHER_STATIONS = [
  {
    name: "Cherrapunji / Sohra (Meghalaya)",
    state: "Meghalaya",
    lat: 25.27,
    lng: 91.73,
    rainfall_1h_mm: 28.4,
    rainfall_6h_mm: 94.2,
    flood_status: "WARNING",
    temp_c: 21,
    humidity_pct: 98,
    visibility_km: 3.2,
    wind_kmh: 34,
  },
  {
    name: "Guwahati Borjhar Airport (Assam)",
    state: "Assam",
    lat: 26.10,
    lng: 91.58,
    rainfall_1h_mm: 4.2,
    rainfall_6h_mm: 18.0,
    flood_status: "NORMAL",
    temp_c: 28,
    humidity_pct: 82,
    visibility_km: 9.0,
    wind_kmh: 12,
  },
  {
    name: "Silchar Kumbhirgram (Assam/Barak)",
    state: "Assam",
    lat: 24.91,
    lng: 92.97,
    rainfall_1h_mm: 19.5,
    rainfall_6h_mm: 68.0,
    flood_status: "ALERT",
    temp_c: 25,
    humidity_pct: 92,
    visibility_km: 5.4,
    wind_kmh: 22,
  },
  {
    name: "Kohima High-Altitude Station (Nagaland)",
    state: "Nagaland",
    lat: 25.67,
    lng: 94.10,
    rainfall_1h_mm: 14.8,
    rainfall_6h_mm: 52.1,
    flood_status: "ALERT",
    temp_c: 19,
    humidity_pct: 89,
    visibility_km: 4.1,
    wind_kmh: 26,
  },
  {
    name: "Gangtok STNM Station (Sikkim)",
    state: "Sikkim",
    lat: 27.33,
    lng: 88.61,
    rainfall_1h_mm: 11.0,
    rainfall_6h_mm: 45.0,
    flood_status: "ALERT",
    temp_c: 17,
    humidity_pct: 88,
    visibility_km: 4.8,
    wind_kmh: 18,
  },
  {
    name: "Imphal Tulihal Airport (Manipur)",
    state: "Manipur",
    lat: 24.76,
    lng: 93.89,
    rainfall_1h_mm: 8.2,
    rainfall_6h_mm: 24.5,
    flood_status: "NORMAL",
    temp_c: 26,
    humidity_pct: 79,
    visibility_km: 8.0,
    wind_kmh: 14,
  },
];

export const MapWeatherRadarOverlay: React.FC<MapWeatherRadarOverlayProps> = ({
  isOpen,
  onClose,
  onFocusStation,
}) => {
  const { addToast } = useToast();
  const [selectedStation, setSelectedStation] = useState(WEATHER_STATIONS[0]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-20 w-84 sm:w-96 max-h-[calc(100%-5rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-floating text-xs overflow-y-auto animate-in fade-in slide-in-from-right-2 duration-150 p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IMD Live Radar</span>
            <h3 className="text-sm font-bold text-slate-900">Weather & Flood Radar</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Overview Banner */}
      <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-sky-800 font-bold block text-xs">Monsoon Precipitation Active</span>
          <span className="text-[11px] text-sky-600">6 Doppler radars streaming live telematics</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
      </div>

      {/* Stations List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {WEATHER_STATIONS.map((st, idx) => (
          <div
            key={idx}
            className={cn(
              "p-3 rounded-xl border transition-all space-y-2",
              st.flood_status === "WARNING"
                ? "bg-rose-50/70 border-rose-200 hover:bg-rose-50"
                : st.flood_status === "ALERT"
                ? "bg-amber-50/70 border-amber-200 hover:bg-amber-50"
                : "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                {st.name}
              </span>
              <button
                onClick={() => {
                  setSelectedStation(st);
                  onFocusStation(st.lat, st.lng, st.name);
                  addToast({
                    title: `Centered on ${st.name}`,
                    description: `Rainfall 1h: ${st.rainfall_1h_mm} mm. Flood Status: ${st.flood_status}`,
                    type: "info",
                  });
                }}
                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center gap-1"
              >
                <Compass className="w-3 h-3 text-sky-600" />
                Focus
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
              <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 text-[9px] block">Rainfall 1h/6h</span>
                <strong className="text-slate-800">
                  {st.rainfall_1h_mm} / {st.rainfall_6h_mm} mm
                </strong>
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 text-[9px] block">Temp / Hum</span>
                <strong className="text-slate-800">
                  {st.temp_c}°C • {st.humidity_pct}%
                </strong>
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 text-[9px] block">Flood Status</span>
                <strong
                  className={cn(
                    "text-[10px]",
                    st.flood_status === "WARNING"
                      ? "text-rose-600"
                      : st.flood_status === "ALERT"
                      ? "text-amber-600"
                      : "text-emerald-600"
                  )}
                >
                  {st.flood_status}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
