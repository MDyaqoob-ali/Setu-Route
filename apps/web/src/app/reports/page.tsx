"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Camera,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Send,
  RefreshCw,
  Clock,
  Trash2,
  ShieldAlert,
  Mountain,
  Waves,
  Hammer,
  Truck,
  Layers,
  ArrowRight,
  Radio,
  Smartphone,
} from "lucide-react";
import { offlineStore, OfflineIncidentReport } from "@/lib/offline-store";
import { useConnectionStore } from "@/lib/connection-store";
import { syncManager } from "@/lib/sync-manager";
import { formatRelativeTime } from "@/lib/utils";

const INCIDENT_TYPES = [
  { id: "landslide", label: "Landslide / Mudslide", icon: Mountain, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  { id: "flood", label: "River Flood / Washout", icon: Waves, color: "text-sky-600", bg: "bg-sky-50 border-sky-200" },
  { id: "road_damage", label: "Subgrade Fissures", icon: Hammer, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
  { id: "rockfall", label: "Rockfall Debris", icon: ShieldAlert, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { id: "traffic", label: "Convoy Bottleneck", icon: Truck, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
];

const SEVERITIES = [
  { id: "CRITICAL", label: "Critical (Total Blockage)", desc: "Carriageway completely impassable" },
  { id: "HIGH", label: "High (Severe Obstruction)", desc: "One lane blocked, heavy delay" },
  { id: "MEDIUM", label: "Medium (Single Lane Crawl)", desc: "Controlled convoy movement" },
  { id: "LOW", label: "Low (Caution Warning)", desc: "Potholes / minor surface debris" },
];

export default function FieldReportsPage() {
  const { connectionState, pendingSyncCount, syncProgress, lastSyncTime, refreshPendingCount } =
    useConnectionStore();

  const [gpsStatus, setGpsStatus] = useState<"locating" | "locked" | "error">("locating");
  const [latitude, setLatitude] = useState<number>(25.185);
  const [longitude, setLongitude] = useState<number>(92.482);
  const [accuracy, setAccuracy] = useState<number>(5.0);
  const [outboxReports, setOutboxReports] = useState<OfflineIncidentReport[]>([]);

  // Form State
  const [type, setType] = useState<string>("landslide");
  const [severity, setSeverity] = useState<string>("CRITICAL");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [districtId, setDistrictId] = useState<string>("dist-megh-01");
  const [reporterName, setReporterName] = useState<string>("Officer T. Laskar");
  const [reporterRole, setReporterRole] = useState<string>("FIELD_OFFICER");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "info" } | null>(null);

  // Load outbox reports
  const loadOutbox = async () => {
    try {
      const all = await offlineStore.getAllReports();
      setOutboxReports(all);
      await refreshPendingCount();
    } catch (e) {
      console.warn("Could not load outbox from IndexedDB:", e);
    }
  };

  useEffect(() => {
    loadOutbox();
  }, [pendingSyncCount]);

  // Capture GPS
  const captureGPS = () => {
    setGpsStatus("locating");
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAccuracy(pos.coords.accuracy);
          setGpsStatus("locked");
        },
        (err) => {
          console.warn("GPS acquire error:", err);
          setLatitude(25.185); // Sonapur / NH-6
          setLongitude(92.482);
          setGpsStatus("locked");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsStatus("locked");
    }
  };

  useEffect(() => {
    captureGPS();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Photo size exceeds 5MB limit.");
        return;
      }
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please provide an incident title and field description.");
      return;
    }

    const idempotencyKey = `fld-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      // 1. Save immediately to local IndexedDB store
      await offlineStore.saveReport({
        idempotency_key: idempotencyKey,
        type,
        severity,
        title,
        description,
        latitude,
        longitude,
        accuracy_meters: accuracy,
        address: `GPS: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (Near Sonapur Pass)`,
        district_id: districtId,
        reporter_name: reporterName,
        reporter_role: reporterRole,
        photo_data_base64: photoBase64 || undefined,
        photo_name: photoName || undefined,
      });

      // Reset form fields
      setTitle("");
      setDescription("");
      setPhotoBase64(null);
      setPhotoName(null);

      await loadOutbox();

      if (connectionState === "OFFLINE") {
        setFeedbackMsg({
          text: "Report saved locally in offline outbox. Will sync automatically when network returns.",
          type: "info",
        });
      } else {
        setFeedbackMsg({
          text: "Report saved to local outbox. Initiating transmission...",
          type: "success",
        });
        // 2. Trigger sync immediately if online
        syncManager.syncOutbox().then(() => loadOutbox());
      }

      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err) {
      console.error("Failed to save report to IndexedDB:", err);
      alert("Storage error: Failed to save report locally.");
    }
  };

  const handleManualSyncAll = async () => {
    await syncManager.syncOutbox();
    await loadOutbox();
  };

  const handleDeleteOutboxItem = async (id: string) => {
    await offlineStore.deleteReport(id);
    await loadOutbox();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Smartphone className="w-3.5 h-3.5 text-brand-600" />
            <span>Store-and-Forward PWA Client</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-brand-600" />
            Field Officer Incident Logging
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Offline-first local IndexedDB storage with automatic background synchronization on network reconnect.
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          PWA ACTIVE
        </span>
      </div>

      {/* Connection & Telemetry Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm text-xs">
        {/* Network State */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            connectionState === "ONLINE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}>
            {connectionState === "ONLINE" ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Network State</span>
            <span
              className={`font-bold text-xs ${
                connectionState === "ONLINE"
                  ? "text-emerald-700"
                  : connectionState === "DEGRADED"
                  ? "text-amber-700"
                  : "text-rose-700"
              }`}
            >
              {connectionState}
            </span>
          </div>
        </div>

        {/* GPS Telemetry */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">GPS Fix</span>
            <span className="text-slate-800 font-semibold font-mono text-[11px] block">
              {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
            </span>
            <span className="text-slate-400 text-[10px]">Accuracy ±{accuracy}m</span>
          </div>
        </div>

        {/* Sync Outbox Status */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="sm:text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Outbox Queue</span>
            <span className="text-slate-800 font-bold">
              {pendingSyncCount} pending items
            </span>
          </div>
          {pendingSyncCount > 0 && connectionState !== "OFFLINE" && (
            <button
              onClick={handleManualSyncAll}
              disabled={connectionState === "SYNCING"}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionState === "SYNCING" ? "animate-spin" : ""}`} />
              Sync
            </button>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs transition-all shadow-sm ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Fast Report Creation Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-5"
      >
        {/* Incident Type Grid */}
        <div>
          <label className="block text-slate-800 mb-2 font-bold text-xs">
            1. Select Hazard Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {INCIDENT_TYPES.map((it) => {
              const Icon = it.icon;
              const isSelected = type === it.id;
              return (
                <button
                  type="button"
                  key={it.id}
                  onClick={() => setType(it.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all min-h-[48px] ${
                    isSelected
                      ? "bg-brand-50 border-brand-300 ring-1 ring-brand-200 text-brand-900 font-semibold shadow-sm"
                      : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${it.color} shrink-0`} />
                  <span className="text-xs leading-tight font-medium">{it.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hazard Severity Selector */}
        <div>
          <label className="block text-slate-800 mb-2 font-bold text-xs">
            2. Impact Severity *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SEVERITIES.map((sev) => {
              const isSelected = severity === sev.id;
              return (
                <button
                  type="button"
                  key={sev.id}
                  onClick={() => setSeverity(sev.id)}
                  className={`p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                    isSelected
                      ? "bg-rose-50 border-rose-300 ring-1 ring-rose-200 text-rose-900 shadow-sm"
                      : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{sev.label}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        sev.id === "CRITICAL"
                          ? "bg-rose-500"
                          : sev.id === "HIGH"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{sev.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-slate-800 mb-1.5 font-bold text-xs">
            3. Incident Title / Sector Mile Marker *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. NH-6 Sonapur Tunnel Km 142 mud debris completely blocking both lanes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs"
          />
        </div>

        {/* Observations */}
        <div>
          <label className="block text-slate-800 mb-1.5 font-bold text-xs">
            4. Field Observations & Immediate Needs *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe debris volume, mud depth, stranded vehicle count, BRO/PWD machinery required..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs"
          />
        </div>

        {/* Camera / Photographic Evidence */}
        <div>
          <label className="block text-slate-800 mb-1.5 font-bold text-xs">
            5. Photographic Evidence (Cached in IndexedDB)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer text-slate-700 font-semibold text-xs min-h-[44px] transition-colors">
              <Camera className="w-4 h-4 text-brand-600" />
              <span>Capture / Attach Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            {photoBase64 && (
              <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {photoName || "Photo Attached"}
              </span>
            )}
          </div>
          {photoBase64 && (
            <div className="mt-3">
              <img
                src={photoBase64}
                alt="Captured Preview"
                className="h-32 rounded-xl border border-slate-200 object-cover shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all min-h-[48px]"
        >
          <Send className="w-4 h-4" />
          {connectionState === "OFFLINE"
            ? "Save Report to Local Offline Outbox"
            : "Save & Transmit Field Report"}
        </button>
      </form>

      {/* Outbox & Synchronization History Section */}
      <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-xs">
              Local Outbox Queue ({outboxReports.length})
            </h3>
          </div>
          {lastSyncTime && (
            <span className="text-[11px] text-slate-400">Last sync: {lastSyncTime}</span>
          )}
        </div>

        {outboxReports.length === 0 ? (
          <p className="text-slate-400 text-xs py-3 text-center">
            No pending or cached reports in local IndexedDB outbox.
          </p>
        ) : (
          <div className="space-y-2.5">
            {outboxReports.map((report) => (
              <div
                key={report.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        report.sync_status === "SYNCED"
                          ? "bg-emerald-100 text-emerald-800"
                          : report.sync_status === "SYNCING"
                          ? "bg-sky-100 text-sky-800"
                          : report.sync_status === "FAILED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {report.sync_status}
                    </span>
                    <span className="font-semibold text-slate-900 truncate text-xs">{report.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{report.description}</p>
                  <span className="text-[11px] text-slate-400 block">
                    Created: {formatRelativeTime(report.created_at)}
                    {report.synced_at && ` • Synced: ${formatRelativeTime(report.synced_at)}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {report.sync_status !== "SYNCED" && connectionState !== "OFFLINE" && (
                    <button
                      onClick={handleManualSyncAll}
                      className="p-2 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200"
                      title="Sync this report"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteOutboxItem(report.id)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200"
                    title="Remove from local outbox"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
