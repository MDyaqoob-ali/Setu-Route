"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  Check,
  Radio,
  Zap,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Alert } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [showAcknowledged, setShowAcknowledged] = useState<boolean>(false);

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ["alerts", selectedSeverity, showAcknowledged],
    queryFn: () => {
      let endpoint = `/alerts?is_acknowledged=${showAcknowledged}&`;
      if (selectedSeverity !== "ALL") endpoint += `severity=${selectedSeverity}&`;
      return apiClient<Alert[]>(endpoint);
    },
    refetchInterval: 8000,
  });

  const ackMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiClient<Alert>(`/alerts/${alertId}/acknowledge`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Operational Threat Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-amber-600" />
            Active Warning Feed & Threat Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Actionable early warnings explaining incident impact, vulnerable supply chains & recommended mitigations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setShowAcknowledged(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !showAcknowledged ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Active Threats
          </button>
          <button
            onClick={() => setShowAcknowledged(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showAcknowledged ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Acknowledged Archive
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-sm text-xs">
        <span className="text-xs font-medium text-slate-500">Filter Severity:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSeverity === sev
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed Cards */}
      {isLoading ? (
        <LoadingState message="Connecting to early warning threat queue..." />
      ) : (alerts || []).length === 0 ? (
        <EmptyState
          title="No Unresolved Alerts"
          description="All operational alerts have been acknowledged and resolved."
          icon={CheckCircle}
        />
      ) : (
        <div className="space-y-4">
          {(alerts || []).map((alert) => (
            <div
              key={alert.id}
              className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-5"
            >
              {/* Alert Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={alert.severity} size="md" />
                  <span className="font-bold text-slate-900 text-sm tracking-tight">
                    {alert.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {alert.alert_code}
                  </span>
                  <span>•</span>
                  <span>{formatRelativeTime(alert.created_at)}</span>
                </div>
              </div>

              {/* 4-Section Operational Analysis Breakdown (WHAT, WHY, WHO, ACTION) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    1. What Happened
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">{alert.what_happened}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    2. Why It Matters
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">{alert.why_it_matters}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    3. Who Is Affected
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">{alert.who_is_affected}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 space-y-1.5">
                  <span className="text-brand-700 text-[10px] uppercase font-bold tracking-wider block flex items-center gap-1">
                    <Zap className="w-3 h-3 text-brand-600" />
                    4. Available Action
                  </span>
                  <p className="text-brand-950 leading-relaxed font-semibold text-xs">{alert.recommended_action}</p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-xs">
                  Triggered at {formatDateTime(alert.created_at)}
                </span>

                {!alert.is_acknowledged && (
                  <button
                    onClick={() => ackMutation.mutate(alert.id)}
                    disabled={ackMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Acknowledge Threat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
