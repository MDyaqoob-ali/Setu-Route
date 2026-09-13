"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Plus,
  Filter,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  ExternalLink,
  Camera,
  Search,
  ShieldAlert,
  Flame,
  Check,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Incident, IncidentStatus, District, Road } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default function IncidentsPage() {
  const queryClient = useQueryClient();
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

  // Form State
  const [newIncident, setNewIncident] = useState({
    type: "landslide",
    severity: "HIGH",
    title: "",
    description: "",
    latitude: 25.5788,
    longitude: 91.8933,
    address: "",
    district_id: "",
    road_id: "",
    affected_traffic_direction: "BOTH",
  });

  // Fetch Incidents
  const { data: incidents, isLoading } = useQuery<Incident[]>({
    queryKey: ["incidents", selectedSeverity, selectedStatus],
    queryFn: () => {
      let endpoint = "/incidents?";
      if (selectedSeverity !== "ALL") endpoint += `severity=${selectedSeverity}&`;
      if (selectedStatus !== "ALL") endpoint += `status=${selectedStatus}&`;
      return apiClient<Incident[]>(endpoint);
    },
  });

  // Fetch Districts and Roads for Create Form
  const { data: districts } = useQuery<District[]>({
    queryKey: ["districts"],
    queryFn: () => apiClient<District[]>("/districts"),
  });

  const { data: roads } = useQuery<Road[]>({
    queryKey: ["roads"],
    queryFn: () => apiClient<Road[]>("/roads"),
  });

  // Create Incident Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient<Incident>("/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsCreateModalOpen(false);
      setNewIncident({
        type: "landslide",
        severity: "HIGH",
        title: "",
        description: "",
        latitude: 25.5788,
        longitude: 91.8933,
        address: "",
        district_id: "",
        road_id: "",
        affected_traffic_direction: "BOTH",
      });
    },
  });

  // Update Incident Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IncidentStatus }) =>
      apiClient<Incident>(`/incidents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setActiveIncident(updated);
    },
  });

  const filteredIncidents = (incidents || []).filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.incident_code.toLowerCase().includes(q) ||
      inc.type.toLowerCase().includes(q) ||
      (inc.address && inc.address.toLowerCase().includes(q))
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.title || !newIncident.description || !newIncident.district_id) {
      alert("Please fill in Title, Description, and District.");
      return;
    }
    createMutation.mutate(newIncident);
  };

  const criticalCount = (incidents || []).filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Hazard & Blockage Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Corridor Incidents & Hazards
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Report, triage, and track resolution of landslides, flash floods, and arterial highway disruptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl text-rose-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{criticalCount} Critical Blockages Active</span>
            </div>
          )}
          <button
            onClick={() => {
              if (districts && districts.length > 0 && !newIncident.district_id) {
                setNewIncident((prev) => ({ ...prev, district_id: districts[0].id }));
              }
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Log New Incident
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by code, title, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 shrink-0">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="flex-1 bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 shrink-0">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-slate-400 text-xs font-medium">
          <span>{filteredIncidents.length} incidents logged</span>
        </div>
      </div>

      {/* Incidents Table */}
      {isLoading ? (
        <LoadingState message="Fetching live incident database..." />
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Incidents Match Filter"
          description="All monitored corridors in this scope are operating smoothly without active obstructions."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-5">Incident Code</th>
                <th className="py-3.5 px-5">Hazard Type</th>
                <th className="py-3.5 px-5">Severity</th>
                <th className="py-3.5 px-5">Title & Location</th>
                <th className="py-3.5 px-5">Traffic Impact</th>
                <th className="py-3.5 px-5">Reported</th>
                <th className="py-3.5 px-5 text-right">Triage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIncidents.map((inc) => (
                <tr
                  key={inc.id}
                  onClick={() => setActiveIncident(inc)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-4 px-5 font-mono font-bold text-slate-900 group-hover:text-brand-600">
                    {inc.incident_code}
                  </td>
                  <td className="py-4 px-5 capitalize text-slate-800 font-medium">
                    {inc.type.replace(/_/g, " ")}
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge status={inc.severity} size="sm" />
                  </td>
                  <td className="py-4 px-5 max-w-xs">
                    <p className="font-semibold text-slate-900 truncate">{inc.title}</p>
                    {inc.address && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{inc.address}</p>
                    )}
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-medium">
                    {inc.affected_traffic_direction.replace(/_/g, " ")}
                  </td>
                  <td className="py-4 px-5 text-slate-400">
                    {formatRelativeTime(inc.created_at)}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <StatusBadge status={inc.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Incident Detail Modal */}
      {activeIncident && (
        <Modal
          isOpen={!!activeIncident}
          onClose={() => setActiveIncident(null)}
          title={`Incident Detail: ${activeIncident.incident_code}`}
          description={`Reported ${formatDateTime(activeIncident.created_at)}`}
          maxWidth="xl"
        >
          <div className="space-y-5 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <StatusBadge status={activeIncident.severity} size="md" />
                <StatusBadge status={activeIncident.status} size="md" />
              </div>
              <span className="text-slate-800 capitalize font-bold bg-slate-100 px-3 py-1 rounded-lg">
                {activeIncident.type.replace(/_/g, " ")}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{activeIncident.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {activeIncident.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Coordinates</span>
                <span className="text-slate-900 font-mono text-[11px] mt-0.5 block">
                  {activeIncident.latitude.toFixed(4)}°N, {activeIncident.longitude.toFixed(4)}°E
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Traffic Direction</span>
                <span className="text-slate-900 font-semibold mt-0.5 block">
                  {activeIncident.affected_traffic_direction.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Reporting Officer</span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {activeIncident.reporter_name || "Field Officer"} ({activeIncident.reporter_role || "FIELD"})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Est. Clearance Time</span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {activeIncident.estimated_clearance_time
                    ? formatDateTime(activeIncident.estimated_clearance_time)
                    : "Under Assessment"}
                </span>
              </div>
            </div>

            {/* Photos Preview */}
            {activeIncident.photos_json && activeIncident.photos_json.length > 0 && (
              <div>
                <span className="text-slate-700 block mb-2 font-bold flex items-center gap-1.5 text-xs">
                  <Camera className="w-4 h-4 text-brand-600" />
                  Photographic Evidence ({activeIncident.photos_json.length})
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {activeIncident.photos_json.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-36 object-cover rounded-xl border border-slate-200 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lifecycle Status Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Update Status:</span>
              <div className="flex items-center gap-2">
                {activeIncident.status === "OPEN" && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: activeIncident.id, status: "ACKNOWLEDGED" })}
                    className="px-3.5 py-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 text-xs font-semibold transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {activeIncident.status !== "INVESTIGATING" && activeIncident.status !== "RESOLVED" && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: activeIncident.id, status: "INVESTIGATING" })}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-colors"
                  >
                    Dispatch Inspection
                  </button>
                )}
                {activeIncident.status !== "RESOLVED" && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: activeIncident.id, status: "RESOLVED" })}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Incident Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Log New Transportation Incident"
        description="Submit verified field report to update arterial network accessibility."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Incident Type *</label>
              <select
                value={newIncident.type}
                onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              >
                <option value="landslide">Landslide</option>
                <option value="flood">Flood / Inundation</option>
                <option value="road_damage">Road Subgrade Failure</option>
                <option value="bridge_damage">Bridge Structural Damage</option>
                <option value="rockfall">Rockfall Debris</option>
                <option value="severe_weather">Severe Cloudburst / Fog</option>
                <option value="traffic">Traffic Bottleneck</option>
                <option value="accident">Accident Obstruction</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Severity *</label>
              <select
                value={newIncident.severity}
                onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              >
                <option value="CRITICAL">Critical (Total Road Blockage)</option>
                <option value="HIGH">High (Major Restriction)</option>
                <option value="MEDIUM">Medium (Single Lane / Slow)</option>
                <option value="LOW">Low (Caution Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">Incident Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sela Pass Mudslide blocking Km 284"
              value={newIncident.title}
              onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">Description & Operational Notes *</label>
            <textarea
              required
              rows={3}
              placeholder="Detailed description of blockage, debris volume, road conditions, and emergency response deployed..."
              value={newIncident.description}
              onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">District *</label>
              <select
                required
                value={newIncident.district_id}
                onChange={(e) => setNewIncident({ ...newIncident, district_id: e.target.value })}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              >
                <option value="">Select District</option>
                {(districts || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Affected Road Corridor</label>
              <select
                value={newIncident.road_id}
                onChange={(e) => setNewIncident({ ...newIncident, road_id: e.target.value })}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              >
                <option value="">Select Corridor (Optional)</option>
                {(roads || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={newIncident.latitude}
                onChange={(e) => setNewIncident({ ...newIncident, latitude: parseFloat(e.target.value) })}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={newIncident.longitude}
                onChange={(e) => setNewIncident({ ...newIncident, longitude: parseFloat(e.target.value) })}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1.5">Specific Location / Milestone</label>
            <input
              type="text"
              placeholder="e.g. NH-6 Km 142 near Sonapur Tunnel"
              value={newIncident.address}
              onChange={(e) => setNewIncident({ ...newIncident, address: e.target.value })}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? "Submitting..." : "Submit Incident Report"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
