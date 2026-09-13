"use client";

import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Map,
  Radio,
  Bell,
  Save,
  CheckCircle2,
  Volume2,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface UserSettings {
  telemetryInterval: string;
  tileServer: string;
  soundAlerts: boolean;
  distanceUnits: string;
  highContrastRoutes: boolean;
  autoSyncOutbox: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  telemetryInterval: "5",
  tileServer: "osm-standard",
  soundAlerts: true,
  distanceUnits: "km",
  highContrastRoutes: true,
  autoSyncOutbox: true,
};

export default function SettingsPage() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("neroute_platform_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Fallback to default settings
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem("neroute_platform_settings", JSON.stringify(settings));
      setSaved(true);
      addToast({
        title: "Configuration Saved",
        description: "Telemetry rates, GIS display options, and sound triggers updated.",
        type: "success",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      addToast({
        title: "Save Failed",
        description: "Unable to write settings to local storage.",
        type: "error",
      });
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem("neroute_platform_settings", JSON.stringify(DEFAULT_SETTINGS));
      addToast({
        title: "Defaults Restored",
        description: "Platform settings reset to standard operational profile.",
        type: "info",
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
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
        <button
          onClick={handleReset}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-6 text-xs">
        {/* Telemetry & Connectivity */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Radio className="w-4 h-4 text-brand-600" />
            <span>Telemetry & Stream Rates</span>
          </h3>

          <div>
            <label className="block text-slate-800 mb-1.5 font-bold">
              Background Polling Interval (Fallback when WebSocket offline)
            </label>
            <select
              value={settings.telemetryInterval}
              onChange={(e) => setSettings({ ...settings, telemetryInterval: e.target.value })}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="3">3 Seconds (High Frequency Tactical Telemetry)</option>
              <option value="5">5 Seconds (Standard Operations - Recommended)</option>
              <option value="15">15 Seconds (Low Bandwidth 2G/Satellite Mode)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-800 block">Automatic Outbox Synchronization</span>
              <span className="text-[11px] text-slate-400">
                Automatically push offline incident reports when network connection recovers
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSyncOutbox}
              onChange={(e) => setSettings({ ...settings, autoSyncOutbox: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
          </div>
        </div>

        {/* GIS & Map Settings */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Map className="w-4 h-4 text-brand-600" />
            <span>GIS Map Visuals & Cartography</span>
          </h3>

          <div>
            <label className="block text-slate-800 mb-1.5 font-bold">
              Default GIS Basemap Style
            </label>
            <select
              value={settings.tileServer}
              onChange={(e) => setSettings({ ...settings, tileServer: e.target.value })}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="osm-standard">OpenStreetMap Standard (Crisp Natural Vector Style)</option>
              <option value="osm-topo">Topographical Contour & Mountain Relief</option>
              <option value="satellite">High-Res Satellite Imagery Hybrid</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-800 block">Layered High-Contrast Route Casings</span>
              <span className="text-[11px] text-slate-400">
                Renders dark/light dual casing borders around candidate routes for high visibility over hills
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrastRoutes}
              onChange={(e) => setSettings({ ...settings, highContrastRoutes: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Audio & Alert Notifications */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Bell className="w-4 h-4 text-brand-600" />
            <span>Alerts & Audible Chimes</span>
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-800 block">Critical Emergency Chime</span>
                <span className="text-[11px] text-slate-400">
                  Synthesizes Web Audio alert chime when CRITICAL road closures or fleet SOS alerts arrive
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundAlerts}
              onChange={(e) => setSettings({ ...settings, soundAlerts: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {saved ? (
            <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Configuration successfully stored!
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">Changes apply instantly across modules</span>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
