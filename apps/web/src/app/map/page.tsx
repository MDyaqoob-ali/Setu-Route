"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapLibreView } from "@/components/map/MapLibreView";
import {
  Layers,
  MapPin,
  Truck,
  AlertTriangle,
  ShieldCheck,
  Filter,
  Compass,
  Zap,
  Play,
  RotateCcw,
  Activity,
  CloudRain,
  Mountain,
  Info,
  ChevronRight,
  ChevronDown,
  X,
  Radio,
  Sliders,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Wind,
  Droplets,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";
import { AlertDetailModal } from "@/components/alerts/AlertDetailModal";

const KEY_CORRIDORS = [
  { code: "NH-6", name: "Shillong - Silchar Corridor (Meghalaya/Barak)", defaultLat: 25.185, defaultLng: 92.482 },
  { code: "NH-29", name: "Dimapur - Kohima Highway (Nagaland)", defaultLat: 25.75, defaultLng: 93.85 },
  { code: "NH-37", name: "Silchar - Jiribam - Imphal Highway (Manipur)", defaultLat: 24.8, defaultLng: 93.3 },
  { code: "NH-10", name: "Siliguri - Gangtok Teesta Corridor (Sikkim)", defaultLat: 27.05, defaultLng: 88.52 },
  { code: "NH-27", name: "Guwahati - Nagaon East-West Artery (Assam)", defaultLat: 26.2, defaultLng: 92.2 },
  { code: "NH-306", name: "Silchar - Aizawl Mountain Pass (Mizoram)", defaultLat: 24.0, defaultLng: 92.7 },
];

export default function LiveMapPage() {
  const { addToast } = useToast();
  const { summary: alertSummary, acknowledgeAlert, isAcknowledging } = useRealtimeAlerts();
  const [selectedAlertModal, setSelectedAlertModal] = useState<any | null>(null);
  const [selectedCorridorCode, setSelectedCorridorCode] = useState<string | null>("NH-6");
  const [showSimDrawer, setShowSimDrawer] = useState<boolean>(false);
  const [simScenario, setSimScenario] = useState<string>("landslide");
  const [simSeverity, setSimSeverity] = useState<string>("CRITICAL");
  const [simTargetCorridor, setSimTargetCorridor] = useState<string>("NH-6");
  const [simResult, setSimResult] = useState<any>(null);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState<boolean>(false);
  const [expandedFactorIdx, setExpandedFactorIdx] = useState<number | null>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Fetch Risk & Explainability Data for Selected Corridor
  const { data: corridorRisk, isLoading: isRiskLoading, refetch: refetchRisk } = useQuery({
    queryKey: ["corridorRisk", selectedCorridorCode],
    queryFn: () => apiClient<any>(`/risk/corridors/${selectedCorridorCode}`),
    enabled: !!selectedCorridorCode,
    refetchInterval: 10000,
  });

  // Fetch Corridor Health
  const { data: corridorHealth, isLoading: isHealthLoading } = useQuery({
    queryKey: ["corridorHealth", selectedCorridorCode],
    queryFn: () => apiClient<any>(`/roads/${selectedCorridorCode}/health`),
    enabled: !!selectedCorridorCode,
    refetchInterval: 10000,
  });

  // Trigger Simulation Scenario Mutation
  const simMutation = useMutation({
    mutationFn: async () => {
      return apiClient<any>("/simulation/scenario", {
        method: "POST",
        body: JSON.stringify({
          scenario_type: simScenario,
          corridor_code: simTargetCorridor,
          severity: simSeverity,
        }),
      });
    },
    onSuccess: (data) => {
      setSimResult(data);
      refetchRisk();
      addToast({
        title: "Simulation Scenario Executed",
        description: `${simTargetCorridor} updated with ${simScenario.replace(/_/g, " ")}. Risk adjusted.`,
        type: "warning",
      });
    },
    onError: () => {
      addToast({
        title: "Simulation Failed",
        description: "Unable to run scenario on backend engine.",
        type: "error",
      });
    },
  });

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-4 text-xs">
      {/* Top Header Bar with Corridor Quick Selector & Run Simulation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-xs shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              North Eastern Region GIS Telemetry & Spatial Intelligence
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct map route planning, hazard dropper, live fleet radar, and real-time corridor intelligence.
            </p>
          </div>
        </div>

        {/* Quick Corridor Selector & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-xs">
            <label className="text-slate-500 font-medium text-xs">Inspect Corridor:</label>
            <select
              value={selectedCorridorCode || ""}
              onChange={(e) => setSelectedCorridorCode(e.target.value)}
              className="bg-transparent border-0 text-slate-800 text-xs font-semibold focus:ring-0 cursor-pointer focus:outline-none"
            >
              {KEY_CORRIDORS.map((c) => (
                <option key={c.code} value={c.code} className="bg-white text-slate-800">
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Corridor Sidebar */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse Intelligence Panel" : "Expand Intelligence Panel"}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
          >
            {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>

          {/* Simulation Trigger Button */}
          <button
            onClick={() => setShowSimDrawer(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-purple hover:from-brand-700 hover:to-purple-700 text-white font-semibold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>⚡ Run Simulation</span>
          </button>
        </div>
      </div>

      {/* Main Map + Intelligence Sidebar Container */}
      <div className="flex-1 w-full relative flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Map Container (Full or Split screen) */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-card min-h-[400px]">
          <MapLibreView
            className="w-full h-full"
            showLayerController={true}
            showToolbox={true}
            showFilterToolbar={true}
            showLegend={true}
            onSelectCorridor={(code) => setSelectedCorridorCode(code)}
          />

          {/* Real-Time Operational Threat HUD Badge on Map */}
          {alertSummary?.latest_threat && (
            <div className="absolute top-18 left-4 z-20 max-w-sm w-full bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-rose-300 shadow-floating text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <span className="font-bold text-slate-900 text-xs truncate">
                    {alertSummary.latest_threat.title}
                  </span>
                </div>
                <StatusBadge status={alertSummary.latest_threat.severity} size="sm" />
              </div>

              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {alertSummary.latest_threat.what_happened}
              </p>

              <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-100">
                <button
                  onClick={() => setSelectedAlertModal(alertSummary.latest_threat)}
                  className="font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>4-Part Briefing</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <Link
                  href="/alerts"
                  className="text-slate-500 hover:text-slate-800 font-semibold"
                >
                  {alertSummary.total_unacknowledged} Active Alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Floating Corridor Intelligence Panel */}
        {isSidebarOpen && selectedCorridorCode && corridorRisk && (
          <div className="w-full lg:w-96 flex flex-col bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card space-y-4 overflow-y-auto max-h-full animate-in fade-in slide-in-from-right-2 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Corridor Intelligence
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <Activity className="w-4 h-4 text-brand-600" />
                  {corridorRisk.corridor_code}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {corridorRisk.data_trust_badge || "LIVE"}
              </span>
            </div>

            {/* Health & Risk Metrics */}
            <div className="grid grid-cols-2 gap-3">
              {/* Corridor Health Card */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-slate-500 block text-[11px] font-medium">Corridor Health</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {corridorHealth ? corridorHealth.corridor_health_score : 78}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 100</span>
                </div>
                {/* Micro Progress */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${corridorHealth ? corridorHealth.corridor_health_score : 78}%` }}
                  />
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 pt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  {corridorHealth?.trend || "Improving"}
                </span>
              </div>

              {/* Disruption Risk Card */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-slate-500 block text-[11px] font-medium">Disruption Risk</span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      corridorRisk.level === "CRITICAL"
                        ? "text-rose-600"
                        : corridorRisk.level === "HIGH"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    )}
                  >
                    {corridorRisk.score}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 100</span>
                </div>
                {/* Horizontal Risk Meter */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      corridorRisk.level === "CRITICAL"
                        ? "bg-rose-500"
                        : corridorRisk.level === "HIGH"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, corridorRisk.score)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold block pt-0.5 uppercase tracking-wide",
                    corridorRisk.level === "CRITICAL"
                      ? "text-rose-600"
                      : corridorRisk.level === "HIGH"
                      ? "text-amber-600"
                      : "text-emerald-600"
                  )}
                >
                  {corridorRisk.level} RISK
                </span>
              </div>
            </div>

            {/* Prediction Window */}
            <div className="bg-brand-50/60 p-3 rounded-xl border border-brand-100 flex items-center justify-between text-xs text-brand-900">
              <span className="font-medium text-brand-700">Prediction Horizon:</span>
              <strong className="font-bold text-brand-900">{corridorRisk.prediction_window || "Next 6 hours"}</strong>
            </div>

            {/* Interactive Contributing Risk Factors */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Contributing Risk Factors
              </span>
              <div className="space-y-2">
                {corridorRisk.top_contributing_factors?.map((f: any, fIdx: number) => {
                  const isExpanded = expandedFactorIdx === fIdx;

                  return (
                    <div
                      key={fIdx}
                      className={cn(
                        "rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                        isExpanded
                          ? "bg-white border-slate-300 shadow-sm"
                          : "bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                      )}
                      onClick={() => setExpandedFactorIdx(isExpanded ? null : fIdx)}
                    >
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className={cn("w-4 h-4 shrink-0", f.severity === "CRITICAL" ? "text-rose-500" : "text-amber-500")} />
                          <span className="font-semibold text-slate-800 text-xs truncate">{f.factor}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
                              f.severity === "CRITICAL"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            )}
                          >
                            {f.severity}
                          </span>
                          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-100 text-xs text-slate-500 space-y-2 bg-slate-50/50">
                          <p className="leading-relaxed text-[11px]">{f.detail}</p>
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToast({
                                  title: "Focused on Incident",
                                  description: `Centered view on ${f.factor}.`,
                                  type: "info",
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              View on map
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weather Telemetry Widget */}
            {corridorRisk.weather_telemetry && (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsWeatherExpanded(!isWeatherExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-brand-600" />
                    <div>
                      <span className="font-bold text-slate-900 text-xs">Weather Telemetry</span>
                      <p className="text-[10px] text-slate-400">{corridorRisk.weather_telemetry.station || "Guwahati Borjhar"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                      {corridorRisk.weather_telemetry.flood_warning_level || "GREEN"}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isWeatherExpanded && "rotate-180")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] block font-medium">Rainfall 1h / 6h</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {corridorRisk.weather_telemetry.rainfall_1h_mm} mm / {corridorRisk.weather_telemetry.rainfall_6h_mm} mm
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] block font-medium">Flood Warning</span>
                    <span className="font-bold text-emerald-600 text-xs">
                      NORMAL
                    </span>
                  </div>
                </div>

                {isWeatherExpanded && (
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 text-[10px] block">Temp</span>
                      <span className="font-bold text-slate-800">28°C</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 text-[10px] block">Humidity</span>
                      <span className="font-bold text-slate-800">84%</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 text-[10px] block">Visibility</span>
                      <span className="font-bold text-slate-800">8.5 km</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Model Metadata & Timestamp */}
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Model: {corridorRisk.model_version || "GBM-NER-v2.1"}</span>
              <span>Updated: {corridorRisk.updated_ist || "Live IST"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Simulation Scenario Modal */}
      {showSimDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-floating p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Run Disruption Scenario Simulation
                  </h3>
                  <p className="text-[11px] text-slate-400">Dynamic closed-loop AI stress test</p>
                </div>
              </div>
              <button
                onClick={() => setShowSimDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Exercise the real-time closed loop intelligence pipeline across meteorological inputs, graph rerouting, and fleet telematics:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold text-xs">Scenario Type</label>
                <select
                  value={simScenario}
                  onChange={(e) => setSimScenario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-brand-500"
                >
                  <option value="landslide">Landslide & Slope Failure</option>
                  <option value="rainfall_increase">Torrential Monsoon Cloudburst</option>
                  <option value="road_closure">Emergency Highway Blockage</option>
                  <option value="flood">River Flash Flood / Inundation</option>
                  <option value="reset_demo">Reset / Normalize Highway Status</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold text-xs">Target Corridor</label>
                <select
                  value={simTargetCorridor}
                  onChange={(e) => setSimTargetCorridor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-brand-500"
                >
                  <option value="NH-6">NH-6 (Shillong - Silchar / Sonapur)</option>
                  <option value="NH-29">NH-29 (Dimapur - Kohima)</option>
                  <option value="NH-37">NH-37 (Silchar - Imphal)</option>
                  <option value="NH-10">NH-10 (Siliguri - Gangtok)</option>
                  <option value="NH-27">NH-27 (Guwahati - Nagaon)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSimDrawer(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => simMutation.mutate()}
                disabled={simMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {simMutation.isPending ? "Executing Scenario..." : "Execute Scenario"}
              </button>
            </div>

            {/* Execution Trace Output */}
            {simResult && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Pipeline Execution Complete
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {simResult.rerouted_vehicles_count || 0} Vehicles Rerouted
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px] text-slate-600 max-h-36 overflow-y-auto">
                  {simResult.pipeline_trace?.map((log: string, lIdx: number) => (
                    <div key={lIdx} className="leading-snug">
                      • {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive 4-Part Alert Modal */}
      <AlertDetailModal
        alert={selectedAlertModal}
        isOpen={!!selectedAlertModal}
        onClose={() => setSelectedAlertModal(null)}
        onAcknowledge={(id) => {
          acknowledgeAlert(id);
          setSelectedAlertModal(null);
        }}
        isAcknowledging={isAcknowledging}
      />
    </div>
  );
}
