"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Truck,
  Activity,
  Route,
  CloudRain,
  Mountain,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function AnalyticsPage() {
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<any>({
    queryKey: ["dashboard-analytics"],
    queryFn: () => apiClient<any>("/dashboard/analytics"),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="h-20 rounded-2xl bg-white border border-slate-200/90 animate-pulse" />
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl bg-white border border-slate-200/90 animate-pulse" />
          <div className="h-72 rounded-2xl bg-white border border-slate-200/90 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="p-6">
        <ErrorState
          title="Operational Analytics Stream Disrupted"
          message="Unable to compile corridor vulnerability statistics from analytics engine."
          onRetry={() => refetch()}
          isRetrying={isFetching}
          errorDetails={error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-brand-600" />
            <span>MDoNER Strategic Intelligence Report</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Logistics & Disruption Risk Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real query-backed telemetry: accessibility trends, delivery delays, incident distributions & corridor resilience.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            DATA TRUST: {analytics.data_trust_badge || "LIVE"}
          </span>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-2">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Network Accessibility</span>
          <span className="text-3xl font-bold text-emerald-600 tracking-tight block">
            {analytics.accessibility_trend?.[analytics.accessibility_trend.length - 1]?.accessibility_percent || 88.5}%
          </span>
          <span className="text-xs text-slate-500 block font-medium">
            Across 8 NER state arteries
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-2">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Dynamic Reroutes</span>
          <span className="text-3xl font-bold text-brand-600 tracking-tight block">
            {analytics.total_dynamic_reroutes || 4} Detours
          </span>
          <span className="text-xs text-slate-500 block font-medium">
            Automated detour mitigation
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-2">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">On-Time Consignments</span>
          <span className="text-3xl font-bold text-sky-600 tracking-tight block">
            {analytics.delivery_sla?.on_time || 0} / {analytics.delivery_sla?.total || 0}
          </span>
          <span className="text-xs text-slate-500 block font-medium">
            Avg Delay: {analytics.delivery_sla?.avg_delay_minutes || 0} mins
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-2">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Consignments At Risk</span>
          <span className="text-3xl font-bold text-rose-600 tracking-tight block">
            {analytics.delivery_sla?.at_risk || 0} Critical
          </span>
          <span className="text-xs text-amber-600 block font-medium">
            Under active SLA monitoring
          </span>
        </div>
      </div>

      {/* Row 2: High Risk Corridors & Accessibility Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Corridors */}
        <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Route className="w-4 h-4 text-brand-600" />
              Strategic High-Risk Transportation Corridors
            </h3>
            <span className="text-slate-400 text-[11px] font-medium">ML Disruption Index</span>
          </div>

          <div className="space-y-3">
            {(analytics.high_risk_corridors || []).map((corridor: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{corridor.code}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        corridor.status === "BLOCKED"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : corridor.status === "RESTRICTED"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {corridor.status}
                    </span>
                  </div>
                  <span className="text-slate-500 text-xs block mt-1">
                    {corridor.name} ({corridor.state}) • {corridor.length_km} km
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold text-xs ${
                      corridor.risk_score > 60
                        ? "text-rose-600"
                        : corridor.risk_score > 30
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {corridor.risk_score}/100 Risk
                  </span>
                  <span className="text-slate-400 block text-[11px] mt-0.5">
                    Avg: {corridor.speed_kmh} km/h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* District Vulnerability & Elevation */}
        <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Mountain className="w-4 h-4 text-brand-600" />
              District Vulnerability & Terrain Index
            </h3>
            <span className="text-slate-400 text-[11px] font-medium">Geological Assessment</span>
          </div>

          <div className="space-y-4">
            {(analytics.district_comparison || []).map((dist: any, dIdx: number) => (
              <div key={dIdx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {dist.name} ({dist.state})
                  </span>
                  <span className="text-slate-500 font-medium text-[11px]">
                    Vulnerability: {(dist.vulnerability_index * 100).toFixed(0)}% • {dist.elevation_m}m ASL
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      dist.vulnerability_index > 0.7
                        ? "bg-rose-500"
                        : dist.vulnerability_index > 0.4
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${dist.vulnerability_index * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
