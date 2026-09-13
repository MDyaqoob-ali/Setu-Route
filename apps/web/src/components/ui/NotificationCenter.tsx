"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  ExternalLink,
  X,
  Check,
  Radio,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Alert } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";

export const NotificationCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"unread" | "all" | "critical">("unread");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: () => apiClient<Alert[]>("/alerts?limit=50"),
    refetchInterval: 10000,
  });

  const ackMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiClient(`/alerts/${alertId}/acknowledge`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      addToast({
        title: "Alert Acknowledged",
        description: "Status updated in regional audit logs.",
        type: "success",
      });
    },
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.is_acknowledged);
  const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL");

  let filtered = alerts;
  if (tab === "unread") filtered = unreadAlerts;
  if (tab === "critical") filtered = criticalAlerts;

  return (
    <div className="relative text-xs" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200/80 shadow-xs"
        aria-label="Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-subtle-pulse">
            {unreadAlerts.length > 9 ? "9+" : unreadAlerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-floating z-50 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Operational Alerts</h4>
                <p className="text-[11px] text-slate-400">Real-time corridor and hazard feed</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
              {unreadAlerts.length} Unread
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/70 text-center text-xs">
            <button
              onClick={() => setTab("unread")}
              className={`py-2.5 font-medium transition-all ${
                tab === "unread"
                  ? "text-brand-600 border-b-2 border-brand-600 bg-white font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Unread ({unreadAlerts.length})
            </button>
            <button
              onClick={() => setTab("critical")}
              className={`py-2.5 font-medium transition-all ${
                tab === "critical"
                  ? "text-rose-600 border-b-2 border-rose-600 bg-white font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Critical ({criticalAlerts.length})
            </button>
            <button
              onClick={() => setTab("all")}
              className={`py-2.5 font-medium transition-all ${
                tab === "all"
                  ? "text-slate-900 border-b-2 border-slate-900 bg-white font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All ({alerts.length})
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto p-3 space-y-2.5 max-h-[50vh]">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium text-xs text-slate-600">No alerts in this view</p>
                <p className="text-[11px] text-slate-400">All corridors operate within normal variance.</p>
              </div>
            ) : (
              filtered.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                    !alert.is_acknowledged
                      ? "bg-white border-slate-200/90 shadow-xs hover:border-slate-300"
                      : "bg-slate-50/60 border-slate-100 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        alert.severity === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : alert.severity === "HIGH"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatRelativeTime(alert.created_at)}
                    </span>
                  </div>

                  <h5 className="font-semibold text-slate-900 text-xs">{alert.title}</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {alert.what_happened}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Link
                      href={alert.entity_type === "incident" ? `/incidents?id=${alert.entity_id}` : "/alerts"}
                      onClick={() => setIsOpen(false)}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      <span>Inspect Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {!alert.is_acknowledged && (
                      <button
                        onClick={() => ackMutation.mutate(alert.id)}
                        disabled={ackMutation.isPending}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-center">
            <Link
              href="/alerts"
              onClick={() => setIsOpen(false)}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1"
            >
              <span>Open Full Alert Center</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

