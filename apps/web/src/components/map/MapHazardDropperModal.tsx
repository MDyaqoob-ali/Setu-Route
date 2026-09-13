"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  MapPin,
  X,
  Send,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

interface MapHazardDropperModalProps {
  coord: { lat: number; lng: number } | null;
  onClose: () => void;
  onIncidentCreated: () => void;
}

export const MapHazardDropperModal: React.FC<MapHazardDropperModalProps> = ({
  coord,
  onClose,
  onIncidentCreated,
}) => {
  const { addToast } = useToast();
  const [incidentType, setIncidentType] = useState("LANDSLIDE");
  const [severity, setSeverity] = useState("CRITICAL");
  const [title, setTitle] = useState("Mudflow & Debris Blockage");
  const [roadCode, setRoadCode] = useState("NH-6");
  const [description, setDescription] = useState(
    "Continuous heavy downpour caused high slope saturation. Carriageway blocked across both lanes."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!coord) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient("/incidents", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          incident_type: incidentType,
          severity,
          status: "REPORTED",
          latitude: coord.lat,
          longitude: coord.lng,
          road_id: roadCode,
          district_id: "East Jaintia Hills",
          location_description: `Pinned at GPS (${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}) along ${roadCode}`,
        }),
      });

      addToast({
        title: "Hazard Successfully Pinned",
        description: `${incidentType} (${severity}) recorded at ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}. Disruption alert broadcasted.`,
        type: "warning",
      });

      onIncidentCreated();
      onClose();
    } catch (e) {
      console.error(e);
      addToast({
        title: "Incident Submission Error",
        description: "Could not persist new hazard to backend server.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-floating p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Map Field Hazard Dropper
              </span>
              <h3 className="text-sm font-bold text-slate-900">Pin Incident to Live Map</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Coordinates Display Badge */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between">
          <span className="text-slate-500 font-medium flex items-center gap-1.5 text-xs">
            <MapPin className="w-4 h-4 text-brand-600" />
            Pinned Coordinates:
          </span>
          <span className="font-mono font-bold text-slate-800 text-xs bg-white px-2 py-0.5 rounded-lg border border-slate-200">
            {coord.lat.toFixed(5)}° N, {coord.lng.toFixed(5)}° E
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Hazard Type
              </label>
              <select
                value={incidentType}
                onChange={(e) => {
                  setIncidentType(e.target.value);
                  if (e.target.value === "LANDSLIDE") setTitle("Landslide & Slope Failure");
                  if (e.target.value === "FLOOD") setTitle("Flash Flood & Water Inundation");
                  if (e.target.value === "ROAD_DAMAGE") setTitle("Road Subsidence / Cave-in");
                  if (e.target.value === "BRIDGE_ISSUE") setTitle("Bridge Structural Integrity Alert");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold focus:ring-1 focus:ring-brand-500"
              >
                <option value="LANDSLIDE">⛰️ Landslide / Mudflow</option>
                <option value="FLOOD">🌊 Flash Flood / Overflow</option>
                <option value="ROAD_DAMAGE">🚧 Road Subsidence</option>
                <option value="BRIDGE_ISSUE">🌉 Bridge Hazard</option>
                <option value="WEATHER">🌩️ Severe Monsoon Cloudburst</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold focus:ring-1 focus:ring-brand-500"
              >
                <option value="CRITICAL">🔴 CRITICAL (Total Block)</option>
                <option value="HIGH">🟡 HIGH (Heavy Delay)</option>
                <option value="MEDIUM">🟠 MEDIUM (Single Lane)</option>
                <option value="LOW">🟢 LOW (Cautionary)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Corridor / Highway Link
            </label>
            <select
              value={roadCode}
              onChange={(e) => setRoadCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold focus:ring-1 focus:ring-brand-500"
            >
              <option value="NH-6">NH-6 (Shillong - Silchar / Sonapur Tunnel)</option>
              <option value="NH-29">NH-29 (Dimapur - Kohima Highway)</option>
              <option value="NH-37">NH-37 (Silchar - Jiribam - Imphal)</option>
              <option value="NH-10">NH-10 (Siliguri - Gangtok Teesta Valley)</option>
              <option value="NH-27">NH-27 (Guwahati - Nagaon Artery)</option>
              <option value="NH-306">NH-306 (Silchar - Aizawl Pass)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Incident Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Field Observations & Clearance Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Broadcast & Pin to Map"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
