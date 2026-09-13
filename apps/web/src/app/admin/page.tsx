"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Users,
  Map,
  Key,
  Database,
  CheckCircle2,
  Activity,
  Server,
  Cloud,
  Layers,
  Lock,
  Clock,
  Filter,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { LoadingState, TableSkeleton } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatRelativeTime } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
}

interface SystemHealthResponse {
  subsystems: Record<string, { status: string; [key: string]: any }>;
  timestamp: string;
  data_trust_badge: string;
}

export default function AdminPage() {
  const [actionFilter, setActionFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const {
    data: auditLogs = [],
    isLoading: isAuditLoading,
    isError: isAuditError,
    error: auditError,
    refetch: refetchAudit,
    isFetching: isAuditFetching,
  } = useQuery<AuditLogEntry[]>({
    queryKey: ["admin-audit", actionFilter],
    queryFn: () =>
      apiClient<AuditLogEntry[]>(
        actionFilter ? `/admin/audit?action=${encodeURIComponent(actionFilter)}` : "/admin/audit?limit=60"
      ),
    refetchInterval: 10000,
  });

  const {
    data: health,
    isLoading: isHealthLoading,
    isError: isHealthError,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery<SystemHealthResponse>({
    queryKey: ["admin-system-health"],
    queryFn: () => apiClient<SystemHealthResponse>("/admin/system-health"),
    refetchInterval: 15000,
  });

  const totalPages = Math.max(1, Math.ceil(auditLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return auditLogs.slice(start, start + pageSize);
  }, [auditLogs, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Platform Governance & Subsystem Health</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-brand-600" />
            System Administration & Security Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time auditable operational events, subsystem telemetry health, and RBAC policy enforcement.
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold self-start sm:self-auto">
          SECURITY: ENFORCED
        </span>
      </div>

      {/* Subsystems Health Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-800 font-bold text-xs flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-600" />
            <span>Subsystem Observability Matrix</span>
          </h3>
          <button
            onClick={() => refetchHealth()}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Telemetry</span>
          </button>
        </div>

        {isHealthError ? (
          <ErrorState
            title="Subsystem Health Metrics Unreachable"
            message="Could not query health diagnostics from backend daemon."
            onRetry={() => refetchHealth()}
            compact
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {health?.subsystems ? (
              Object.entries(health.subsystems).map(([key, val]) => (
                <div
                  key={key}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-1.5"
                >
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block truncate">
                    {key.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        val.status === "HEALTHY"
                          ? "bg-emerald-500"
                          : val.status === "DEGRADED"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <span className="font-bold text-slate-900 text-xs">{val.status}</span>
                  </div>
                  {val.latency_ms && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {val.latency_ms} ms latency
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-4 text-slate-400 text-center text-xs">
                Loading subsystem health metrics...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auditable Security & Operational Logs */}
      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-600" />
              Operational Security & Action Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable record of incidents created, dynamic rerouting triggers, and configuration changes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Audited Actions</option>
              <option value="DYNAMIC_VEHICLE_REROUTE">Dynamic Vehicle Reroutes</option>
              <option value="INCIDENT_CREATED">Incidents Created</option>
              <option value="ALERT_ACKNOWLEDGED">Alerts Acknowledged</option>
            </select>
            <button
              onClick={() => refetchAudit()}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {isAuditLoading ? (
          <TableSkeleton rows={6} />
        ) : isAuditError ? (
          <ErrorState
            title="Failed to Load Audit Trail"
            message="Database query for audit log records was interrupted."
            onRetry={() => refetchAudit()}
            isRetrying={isAuditFetching}
            errorDetails={auditError}
          />
        ) : auditLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <span>No audit records found matching criteria.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Details / Target</th>
                    <th className="py-3 px-4 text-right">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-slate-700">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                        {formatRelativeTime(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/70 font-semibold text-slate-800 text-[10px] font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-brand-600">
                        {log.entity_type}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md truncate text-xs">
                        {log.details ? (
                          <span>
                            {log.details.vehicle && <strong className="text-slate-900">{log.details.vehicle} </strong>}
                            {log.details.new_route && `Detour via ${log.details.new_route} `}
                            {log.details.title || log.details.disrupted_road || JSON.stringify(log.details)}
                          </span>
                        ) : (
                          "Action executed"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-500">
                <span>
                  Page <strong className="text-slate-800">{currentPage}</strong> of{" "}
                  <strong className="text-slate-800">{totalPages}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold ${
                        currentPage === idx + 1
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
