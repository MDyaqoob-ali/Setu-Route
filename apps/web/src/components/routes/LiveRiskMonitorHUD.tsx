"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Radio,
  CloudRain,
  Mountain,
  Waves,
  Car,
  Clock,
  Sparkles,
  Zap,
  Info,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveRiskMonitorHUDProps {
  safetyScore: number;
  logisticsRiskScore: number;
  prevSafetyScore?: number;
  prevRiskScore?: number;
  etaFormatted: string;
  prevEtaFormatted?: string;
  aiConfidencePct: number;
  activeIncidentsCount: number;
  maxRainPct: number;
  maxLandslidePct: number;
  maxFloodPct: number;
  trafficStatus: string;
  verdict: {
    state: string;
    badge: string;
    color: string;
    summary: string;
  };
  onOpenConnectionStatus: () => void;
  onOpenAuditTrail: () => void;
  isSimulationActive?: boolean;
}

export const LiveRiskMonitorHUD: React.FC<LiveRiskMonitorHUDProps> = ({
  safetyScore,
  logisticsRiskScore,
  prevSafetyScore,
  prevRiskScore,
  etaFormatted,
  prevEtaFormatted,
  aiConfidencePct,
  activeIncidentsCount,
  maxRainPct,
  maxLandslidePct,
  maxFloodPct,
  trafficStatus,
  verdict,
  onOpenConnectionStatus,
  onOpenAuditTrail,
  isSimulationActive = false,
}) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    setSecondsAgo(0);
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [safetyScore, logisticsRiskScore]);

  const hasScoreDelta = prevSafetyScore !== undefined && prevSafetyScore !== safetyScore;
  const hasRiskDelta = prevRiskScore !== undefined && prevRiskScore !== logisticsRiskScore;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card space-y-4 relative overflow-hidden">
      {/* Top Banner: Status + Connection Health + Action Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>LIVE DATA CONNECTED</span>
          </div>

          {isSimulationActive && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold animate-pulse">
              <span>🎮 SIMULATION MODE ACTIVE</span>
            </div>
          )}

          <span className="text-[11px] text-slate-400 font-medium">
            Updated {secondsAgo}s ago
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenConnectionStatus}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Telemetry Health</span>
          </button>

          <button
            onClick={onOpenAuditTrail}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Decision Audit Log</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid: Safety, Risk, ETA, AI Confidence */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Safety Score */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 font-medium text-[11px]">
            <span>Safety Index</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {safetyScore}
            </span>
            <span className="text-slate-400 font-medium text-xs">/ 100</span>
            {hasScoreDelta && (
              <span className="text-xs font-bold text-amber-600 flex items-center">
                {prevSafetyScore} → {safetyScore}
              </span>
            )}
          </div>
          <div className="mt-1 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                safetyScore >= 75 ? "bg-emerald-500" : safetyScore >= 50 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${safetyScore}%` }}
            ></div>
          </div>
        </div>

        {/* Logistics Risk Score */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 font-medium text-[11px]">
            <span>Logistics Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {logisticsRiskScore}
            </span>
            <span className="text-slate-400 font-medium text-xs">/ 100</span>
            {hasRiskDelta && (
              <span className="text-xs font-bold text-rose-600 flex items-center">
                {prevRiskScore} → {logisticsRiskScore}
              </span>
            )}
          </div>
          <div className="mt-1 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                logisticsRiskScore < 30 ? "bg-emerald-500" : logisticsRiskScore < 60 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${logisticsRiskScore}%` }}
            ></div>
          </div>
        </div>

        {/* Dynamic Transit ETA */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 font-medium text-[11px]">
            <span>Live Calibrated ETA</span>
            <Clock className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {etaFormatted}
            </span>
            {prevEtaFormatted && prevEtaFormatted !== etaFormatted && (
              <span className="text-xs font-bold text-rose-600">
                ({prevEtaFormatted} → {etaFormatted})
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">Includes weather & terrain drag</span>
        </div>

        {/* AI Confidence Engine */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 font-medium text-[11px]">
            <span>AI Confidence</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700 tracking-tight">
              {aiConfidencePct}%
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
              High
            </span>
          </div>
          <span className="text-[10px] text-slate-400">6 Multi-Source telemetry inputs</span>
        </div>
      </div>

      {/* Live Environmental Sub-Sensors */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-600 text-[11px] font-semibold">Rain Prob</span>
          </div>
          <span className={cn("text-xs font-bold", maxRainPct >= 50 ? "text-rose-600 font-black" : "text-slate-800")}>
            {maxRainPct}%
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Mountain className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-600 text-[11px] font-semibold">Landslide</span>
          </div>
          <span className={cn("text-xs font-bold", maxLandslidePct >= 50 ? "text-rose-600 font-black" : "text-slate-800")}>
            {maxLandslidePct}%
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-500" />
            <span className="text-slate-600 text-[11px] font-semibold">Flood Risk</span>
          </div>
          <span className={cn("text-xs font-bold", maxFloodPct >= 40 ? "text-rose-600 font-black" : "text-slate-800")}>
            {maxFloodPct}%
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 text-[11px] font-semibold">Traffic</span>
          </div>
          <span className="text-xs font-bold text-slate-800">
            {trafficStatus}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-slate-600 text-[11px] font-semibold">Incidents</span>
          </div>
          <span className={cn("text-xs font-bold", activeIncidentsCount > 0 ? "text-rose-600" : "text-emerald-600")}>
            {activeIncidentsCount} Active
          </span>
        </div>
      </div>

      {/* AI Operational Verdict Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-base font-black px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 whitespace-nowrap">
            {verdict.badge}
          </span>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {verdict.summary}
          </p>
        </div>
      </div>
    </div>
  );
};
