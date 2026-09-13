"use client";

import React, { useState } from "react";
import {
  CloudRain,
  Mountain,
  Wind,
  Eye,
  Waves,
  ShieldAlert,
  Clock,
  Compass,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentData {
  segment_index: number;
  name: string;
  distance_km: number;
  duration_min: number;
  elevation_m: number;
  slope_deg: number;
  rain_probability_pct: number;
  rainfall_intensity_mmh: number;
  wind_speed_kmh: number;
  visibility_km: number;
  flood_risk_pct: number;
  landslide_risk_pct: number;
  status: string;
  hazard_note: string;
  is_mountain_section: boolean;
}

interface JourneyRainfallData {
  departure_time: string;
  arrival_time: string;
  timeline: Array<{
    time: string;
    probability_pct: number;
    rainfall_mm: number;
  }>;
  peak_probability_pct: number;
  peak_exposure_window: string;
  summary: string;
}

interface SegmentWeatherTimelineProps {
  segments: SegmentData[];
  journeyRainfall: JourneyRainfallData;
}

export const SegmentWeatherTimeline: React.FC<SegmentWeatherTimelineProps> = ({
  segments,
  journeyRainfall,
}) => {
  const [expandedSegIdx, setExpandedSegIdx] = useState<number | null>(null);

  const toggleSegment = (idx: number) => {
    setExpandedSegIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="space-y-4">
      {/* 1. Journey Rainfall Exposure Window */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CloudRain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Predictive Rainfall Exposure During Transit Window
              </h3>
              <p className="text-[11px] text-slate-500">
                Departure: <span className="font-semibold text-slate-700">{journeyRainfall.departure_time}</span> • Estimated Arrival: <span className="font-semibold text-slate-700">{journeyRainfall.arrival_time}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Peak Probability</span>
            <span className={cn("text-xs font-black px-2 py-0.5 rounded", journeyRainfall.peak_probability_pct >= 50 ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700")}>
              {journeyRainfall.peak_probability_pct}% exposure
            </span>
          </div>
        </div>

        {/* Rainfall Timeline Bar Visualizer */}
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100">
          {journeyRainfall.timeline.map((point, idx) => {
            const isPeak = point.probability_pct === journeyRainfall.peak_probability_pct;
            return (
              <div
                key={idx}
                className={cn(
                  "p-2.5 rounded-xl border text-center transition-all flex flex-col justify-between",
                  isPeak
                    ? "bg-blue-50/80 border-blue-300 ring-1 ring-blue-300 shadow-xs"
                    : "bg-slate-50/60 border-slate-200/80"
                )}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
                  <span>{point.time}</span>
                  {isPeak && <span className="text-[9px] bg-blue-600 text-white px-1 rounded font-bold">PEAK</span>}
                </div>
                <div className="my-1.5 flex flex-col items-center">
                  <div className="w-full bg-slate-200 h-10 rounded-lg flex items-end p-0.5 overflow-hidden">
                    <div
                      className={cn(
                        "w-full rounded-md transition-all duration-500",
                        point.probability_pct >= 60 ? "bg-rose-500" : point.probability_pct >= 35 ? "bg-blue-600" : "bg-sky-400"
                      )}
                      style={{ height: `${Math.max(15, point.probability_pct)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-baseline text-[11px] font-extrabold text-slate-800">
                  <span>{point.probability_pct}%</span>
                  <span className="text-[10px] text-slate-400 font-medium">{point.rainfall_mm} mm</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between border border-slate-200/80">
          <span className="font-medium">
            💡 {journeyRainfall.summary}
          </span>
          <span className="font-semibold text-brand-700 shrink-0 ml-2">
            Peak: {journeyRainfall.peak_exposure_window}
          </span>
        </div>
      </div>

      {/* 2. Corridor Segments Hazard Breakdown */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Corridor Segment Hazard & Landslide Analysis ({segments.length} Sectors)
              </h3>
              <p className="text-[11px] text-slate-500">
                Segment-by-segment terrain slope, Doppler rain intensity, and roadbed accessibility.
              </p>
            </div>
          </div>
        </div>

        {/* Segments List */}
        <div className="space-y-2 pt-1">
          {segments.map((seg, idx) => {
            const isExpanded = expandedSegIdx === idx;
            const isBlocked = seg.status === "BLOCKED";
            const isRestricted = seg.status === "RESTRICTED";
            const isHighRisk = seg.landslide_risk_pct >= 50 || seg.rain_probability_pct >= 60;

            return (
              <div
                key={idx}
                className={cn(
                  "rounded-xl border transition-all overflow-hidden",
                  isBlocked
                    ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-200"
                    : isRestricted || isHighRisk
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-slate-50/50 border-slate-200/80 hover:border-slate-300"
                )}
              >
                {/* Segment Header */}
                <button
                  onClick={() => toggleSegment(idx)}
                  className="w-full p-3 flex items-center justify-between text-left gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-white shadow-xs border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                      {seg.segment_index}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {seg.name}
                        </span>
                        {seg.is_mountain_section && (
                          <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded shrink-0">
                            ⛰️ Alpine Pass
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {seg.distance_km} km • ~{seg.duration_min} min • Elev: {seg.elevation_m}m (Slope: {seg.slope_deg}°)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Status Pill */}
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide",
                        isBlocked
                          ? "bg-rose-600 text-white"
                          : isRestricted
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {seg.status}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Telemetry & Landslide Gauge */}
                {isExpanded && (
                  <div className="p-3.5 pt-0 border-t border-slate-200/60 bg-white/70 space-y-3">
                    <div className="p-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{seg.hazard_note}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">Rainfall Intensity</span>
                        <span className="text-xs font-extrabold text-blue-700">
                          {seg.rainfall_intensity_mmh} mm/h ({seg.rain_probability_pct}%)
                        </span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">Landslide Risk</span>
                        <span className={cn("text-xs font-extrabold", seg.landslide_risk_pct >= 50 ? "text-rose-600" : "text-amber-700")}>
                          {seg.landslide_risk_pct}% (Slope {seg.slope_deg}°)
                        </span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">Wind & Visibility</span>
                        <span className="text-xs font-extrabold text-slate-700">
                          {seg.wind_speed_kmh} km/h • {seg.visibility_km} km
                        </span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">Flood Probability</span>
                        <span className="text-xs font-extrabold text-cyan-700">
                          {seg.flood_risk_pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
