"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, Map, Radio, Bell, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [telemetryInterval, setTelemetryInterval] = useState("5");
  const [tileServer, setTileServer] = useState("osm-standard");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <SettingsIcon className="w-3.5 h-3.5 text-brand-600" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Command Center Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure telemetry polling frequencies, GIS raster base layers, and emergency notification triggers.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-5">
        <div>
          <label className="block text-slate-800 mb-1.5 font-bold text-xs">
            Telemetry Polling Frequency
          </label>
          <select
            value={telemetryInterval}
            onChange={(e) => setTelemetryInterval(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="3">3 Seconds (High Frequency Tactical)</option>
            <option value="5">5 Seconds (Standard Operations)</option>
            <option value="15">15 Seconds (Low Bandwidth Satellite / 2G)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-800 mb-1.5 font-bold text-xs">
            GIS Map Basemap Style
          </label>
          <select
            value={tileServer}
            onChange={(e) => setTileServer(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="osm-standard">OpenStreetMap Standard (Crisp Light Natural)</option>
            <option value="osm-topo">Topographical Contour Layer</option>
            <option value="satellite">Satellite Imagery Hybrid</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {saved ? (
            <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings successfully saved!
            </span>
          ) : <span />}
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
