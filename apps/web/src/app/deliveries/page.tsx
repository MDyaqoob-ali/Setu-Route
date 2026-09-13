"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Filter,
  AlertTriangle,
  Clock,
  Truck,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Delivery } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { TruckDetailsModal, TruckData } from "@/components/vehicles/TruckDetailsModal";

export default function DeliveriesPage() {
  const queryClient = useQueryClient();
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [activeTruck, setActiveTruck] = useState<TruckData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Delivery Form State
  const [newDelivery, setNewDelivery] = useState({
    title: "",
    cargo_category: "Medical Supplies",
    cargo_description: "",
    weight_tons: 5.0,
    priority: "HIGH",
    origin_name: "Guwahati Central Depot",
    origin_lat: 26.1445,
    origin_lng: 91.7362,
    destination_name: "Imphal Hospital Depot",
    destination_lat: 24.8170,
    destination_lng: 93.9368,
    planned_departure: new Date().toISOString(),
    expected_delivery: new Date(Date.now() + 86400000).toISOString(),
  });

  const { data: deliveries, isLoading } = useQuery<Delivery[]>({
    queryKey: ["deliveries", selectedPriority, selectedStatus],
    queryFn: () => {
      let endpoint = "/deliveries?";
      if (selectedPriority !== "ALL") endpoint += `priority=${selectedPriority}&`;
      if (selectedStatus !== "ALL") endpoint += `status=${selectedStatus}&`;
      return apiClient<Delivery[]>(endpoint);
    },
  });

  const { data: deliveryEvents } = useQuery<any[]>({
    queryKey: ["delivery-events", activeDelivery?.id],
    queryFn: () => apiClient<any[]>(`/deliveries/${activeDelivery?.id}/events`),
    enabled: !!activeDelivery,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient<Delivery>("/deliveries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsCreateModalOpen(false);
    },
  });

  const filteredDeliveries = (deliveries || []).filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.consignment_code.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.cargo_category.toLowerCase().includes(q) ||
      d.destination_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Package className="w-3.5 h-3.5 text-emerald-500" />
            <span>Essential Commodities & Freight Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <span>Consignments & Cargo Manifests</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track priority food grains, medical cold-chain, and high-altitude emergency supply missions.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Consignment Manifest</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search consignment code, title, cargo or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 shrink-0">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full sm:w-36 bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 shrink-0">State:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-36 bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All States</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DELAYED">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      {isLoading ? (
        <LoadingState message="Fetching consignment records..." />
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          title="No Deliveries Found"
          description="No active supply consignments match the selected filters."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-5">Consignment</th>
                <th className="py-3.5 px-5">Cargo Details</th>
                <th className="py-3.5 px-5">Assigned Fleet Truck</th>
                <th className="py-3.5 px-5">Priority</th>
                <th className="py-3.5 px-5">Origin → Destination</th>
                <th className="py-3.5 px-5">Delay Status</th>
                <th className="py-3.5 px-5 text-right">Delivery State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDeliveries.map((deliv) => (
                <tr
                  key={deliv.id}
                  onClick={() => setActiveDelivery(deliv)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-4 px-5 font-mono font-bold text-slate-900 group-hover:text-brand-600">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-brand-600" />
                      <span>{deliv.consignment_code}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 max-w-xs">
                    <p className="font-semibold text-slate-900 truncate">{deliv.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{deliv.weight_tons} Tons • {deliv.cargo_category}</p>
                  </td>
                  <td className="py-4 px-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTruck({
                          registration_number: "AS-01-GC-4481",
                          driver_name: "Capt. Biren Roy",
                          vehicle_type: "Heavy Truck (16T)",
                          speed_kmh: 54,
                          fuel_level: 78,
                          status: "MOVING",
                          corridor: "NH-6 Shillong-Silchar",
                          destination: deliv.destination_name,
                          cargo: deliv.title,
                          priority: deliv.priority,
                          eta: "1h 45m",
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold border border-brand-200 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>AS-01-GC</span>
                    </button>
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge status={deliv.priority} size="sm" />
                  </td>
                  <td className="py-4 px-5 text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{deliv.origin_name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">{deliv.destination_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {deliv.delay_minutes > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200 text-[11px]">
                        +{deliv.delay_minutes} min
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
                        On Schedule
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <StatusBadge status={deliv.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivery Detail Modal */}
      {activeDelivery && (
        <Modal
          isOpen={!!activeDelivery}
          onClose={() => setActiveDelivery(null)}
          title={`Consignment Manifest: ${activeDelivery.consignment_code}`}
          description={activeDelivery.title}
          maxWidth="xl"
        >
          <div className="space-y-5 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <StatusBadge status={activeDelivery.priority} size="md" />
                <StatusBadge status={activeDelivery.status} size="md" />
              </div>
              <span className="text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-lg">{activeDelivery.cargo_category}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Origin Depot</span>
                <span className="text-slate-900 font-bold mt-0.5 block">{activeDelivery.origin_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Destination Depot</span>
                <span className="text-slate-900 font-bold mt-0.5 block">{activeDelivery.destination_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Consignment Mass</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">{activeDelivery.weight_tons} Metric Tons</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Estimated Delivery</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">{formatDateTime(activeDelivery.expected_delivery)}</span>
              </div>
            </div>

            {/* Transport Truck Box */}
            <div className="bg-brand-50/70 p-3 rounded-xl border border-brand-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-brand-600 font-bold block">Assigned Transport Unit</span>
                  <strong className="text-slate-900 text-xs">AS-01-GC-4481 (Heavy Convoy 16T)</strong>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTruck({
                    registration_number: "AS-01-GC-4481",
                    driver_name: "Capt. Biren Roy",
                    vehicle_type: "Heavy Truck (16T)",
                    speed_kmh: 54,
                    fuel_level: 78,
                    status: "MOVING",
                    corridor: "NH-6 Shillong-Silchar",
                    destination: activeDelivery.destination_name,
                    cargo: activeDelivery.title,
                    priority: activeDelivery.priority,
                    eta: "1h 45m",
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Truck className="w-3 h-3" />
                <span>Inspect Truck Telemetry</span>
              </button>
            </div>

            {activeDelivery.delay_reason && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                <span className="font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 text-rose-700">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Delay Diagnostic Explanation
                </span>
                <p className="text-xs leading-relaxed">{activeDelivery.delay_reason}</p>
              </div>
            )}

            {/* Delivery Milestones Timeline */}
            <div>
              <h4 className="text-slate-900 font-bold mb-3 text-xs">Transit Milestone Events</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(deliveryEvents || []).map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">{evt.title}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">{evt.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{formatDateTime(evt.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Consignment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Essential Consignment Manifest"
        description="Register a new freight dispatch for dynamic routing and telemetry monitoring"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newDelivery);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-medium text-slate-700 mb-1">Consignment Title</label>
            <input
              type="text"
              required
              value={newDelivery.title}
              onChange={(e) => setNewDelivery({ ...newDelivery, title: e.target.value })}
              placeholder="e.g. Life-Saving Medical Vaccines Batch #84"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={newDelivery.cargo_category}
                onChange={(e) => setNewDelivery({ ...newDelivery, cargo_category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              >
                <option value="Medical Supplies">Medical Supplies</option>
                <option value="Food Grains">Food Grains / FCI</option>
                <option value="Fuel / Petroleum">Fuel / Petroleum</option>
                <option value="Disaster Relief">Disaster Relief</option>
                <option value="General Freight">General Freight</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={newDelivery.priority}
                onChange={(e) => setNewDelivery({ ...newDelivery, priority: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              >
                <option value="CRITICAL">Critical (Life-Saving)</option>
                <option value="HIGH">High (Essential)</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Origin Depot</label>
              <input
                type="text"
                value={newDelivery.origin_name}
                onChange={(e) => setNewDelivery({ ...newDelivery, origin_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Destination Terminal</label>
              <input
                type="text"
                value={newDelivery.destination_name}
                onChange={(e) => setNewDelivery({ ...newDelivery, destination_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Payload Weight (Metric Tons)</label>
            <input
              type="number"
              step="0.1"
              value={newDelivery.weight_tons}
              onChange={(e) => setNewDelivery({ ...newDelivery, weight_tons: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{createMutation.isPending ? "Registering..." : "Register Manifest"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Reusable Truck Details Modal */}
      <TruckDetailsModal
        truck={activeTruck}
        onClose={() => setActiveTruck(null)}
      />
    </div>
  );
}
