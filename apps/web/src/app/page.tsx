"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Truck,
  Package,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Clock,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { DashboardSummary } from "@/types";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MapLibreView } from "@/components/map/MapLibreView";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";

export default function CommandCenterPage() {
  const { data: summary, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient<DashboardSummary>("/dashboard/summary"),
    refetchInterval: 10000,
  });

  const { data: timeline } = useQuery<any[]>({
    queryKey: ["dashboard-timeline"],
    queryFn: () => apiClient<any[]>("/dashboard/timeline?limit=15"),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <LoadingState message="Aggregating North-East logistics telemetry and corridor risk models..." />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6">
        <EmptyState
          title="Network Connection Failed"
          description="Unable to connect to NE-ROUTE API server. Ensure backend is running on http://127.0.0.1:8008."
          actionLabel="Retry Connection"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner / Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              NER Logistics & Accessibility Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
              ● LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time transportation accessibility, dynamic hazard triage & convoy monitoring across 8 North-Eastern states.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/routes"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
          >
            <Radio className="w-3.5 h-3.5" />
            Route Optimizer
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Live GIS Map
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            Field Report
          </Link>
        </div>
      </div>

      {/* Summary KPI Metrics Row (5 modern cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Network Accessibility"
          value={`${summary.network_accessibility_percent}%`}
          subtitle={`${summary.accessible_road_km} km of ${summary.total_road_km} km accessible`}
          icon={Activity}
          href="/map"
          severity={summary.network_accessibility_percent > 80 ? "success" : "warning"}
          progress={summary.network_accessibility_percent}
          trend={{ value: "+2.4% vs monsoon avg", isPositive: true }}
        />

        <MetricCard
          title="Active Incidents"
          value={summary.active_incidents_count}
          subtitle={`${summary.critical_incidents_count} Critical severity`}
          icon={AlertTriangle}
          href="/incidents"
          severity={summary.critical_incidents_count > 0 ? "critical" : "normal"}
        />

        <MetricCard
          title="Fleet In Transit"
          value={summary.vehicles_in_transit_count}
          subtitle={`${summary.vehicles_delayed_count} Delayed, ${summary.vehicles_stopped_count} Stopped`}
          icon={Truck}
          href="/vehicles"
          severity="normal"
        />

        <MetricCard
          title="Deliveries At Risk"
          value={summary.deliveries_at_risk_count}
          subtitle={`${summary.deliveries_critical_count} Critical medical consignments`}
          icon={Package}
          href="/deliveries"
          severity={summary.deliveries_at_risk_count > 0 ? "critical" : "normal"}
        />

        <MetricCard
          title="High-Risk Corridors"
          value={summary.high_risk_corridors_count}
          subtitle="Monsoon/Landslide hazard watch"
          icon={ShieldAlert}
          href="/map"
          severity={summary.high_risk_corridors_count > 0 ? "warning" : "normal"}
        />
      </div>

      {/* Main Grid: Operational Map (70% width) & Auditable Timeline Feed (30% width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Operational Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live NER Arterial Corridor Map
              </h2>
            </div>
            <Link
              href="/map"
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              <span>Inspect All Corridors</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-[440px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-card bg-white">
            <MapLibreView showLayerController={false} />
          </div>
        </div>

        {/* Right 1 Col: Auditable Operational Event Timeline Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Auditable Event Timeline
              </h2>
            </div>
            <Link
              href="/alerts"
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
            >
              All Alerts ({summary.unacknowledged_alerts_count})
            </Link>
          </div>

          <div className="h-[440px] rounded-2xl border border-slate-200/90 bg-white p-3.5 overflow-y-auto space-y-2.5 shadow-card">
            {!timeline || timeline.length === 0 ? (
              <EmptyState
                title="No Operational Events"
                description="All monitored arterial corridors are currently operating normally."
              />
            ) : (
              timeline.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        evt.category === "INCIDENT"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : evt.category === "DELIVERY_EVENT"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : evt.category === "ALERT"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {evt.category.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {evt.time_formatted || formatRelativeTime(evt.timestamp)}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {evt.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Table: Critical Highway Corridor Accessibility Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Strategic Highway Corridors Status
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {summary.corridor_risks.length} Monitored Lifelines
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3.5 px-5">Highway Code</th>
                <th className="py-3.5 px-4">Corridor Name</th>
                <th className="py-3.5 px-4">State / Sector</th>
                <th className="py-3.5 px-4">Length</th>
                <th className="py-3.5 px-4">Avg Speed</th>
                <th className="py-3.5 px-4">Disruption Risk Index</th>
                <th className="py-3.5 px-5 text-right">Accessibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary.corridor_risks.map((corridor) => (
                <tr key={corridor.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    <Link
                      href={`/map`}
                      className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                    >
                      {corridor.code}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{corridor.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{corridor.state}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{corridor.length_km} km</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{corridor.avg_speed} km/h</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            corridor.risk_score > 0.6
                              ? "bg-rose-500"
                              : corridor.risk_score > 0.3
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${corridor.risk_score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{(corridor.risk_score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <StatusBadge status={corridor.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

