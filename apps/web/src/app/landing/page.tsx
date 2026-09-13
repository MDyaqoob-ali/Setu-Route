"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Compass,
  Layers,
  Activity,
  ChevronRight,
  Clock,
  Sparkles,
  MapPin,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { useLanguageStore, translations } from "@/lib/i18n";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

const CORRIDORS = [
  { code: "NH-27", name: "Guwahati - Siliguri Corridor", status: "PASSABLE", risk: "LOW", score: 94 },
  { code: "NH-6", name: "Guwahati - Shillong - Silchar", status: "DISRUPTED", risk: "CRITICAL", score: 28, alert: "Sonapur Landslide" },
  { code: "NH-10", name: "Siliguri - Gangtok Highway", status: "WARNING", risk: "ELEVATED", score: 58, alert: "Heavy Rainfall" },
  { code: "NH-29", name: "Dimapur - Kohima Highway", status: "PASSABLE", risk: "LOW", score: 88 },
  { code: "NH-37", name: "Nagaon - Dibrugarh Highway", status: "PASSABLE", risk: "LOW", score: 91 },
];

export default function LandingPage() {
  const { currentLanguage, t } = useLanguageStore();
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" }) + " IST");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center shadow-md shadow-brand-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base text-slate-900">NE-ROUTE</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                  SIH 2026 / 26002
                </span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-tight">
                Ministry of Development of North Eastern Region (MDoNER)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span>{liveTime || "19:30:00 IST"}</span>
            </div>
            <LanguageSelector />
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <span>{t("nav_command_center")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Mission & Core Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-semibold">OPERATIONAL STATUS: ACTIVE</span>
                <span className="text-emerald-300">|</span>
                <span>8 Corridors Monitored</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  See the road before you send the vehicle.
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                  Real-time accessibility intelligence, disruption prediction, and adaptive multi-criteria routing for essential logistics across the North Eastern Region.
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold tracking-wide transition-all shadow-md shadow-brand-500/20"
                >
                  <span>Open Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/map"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold transition-colors shadow-sm"
                >
                  <Layers className="w-4 h-4 text-brand-600" />
                  <span>View Network Status</span>
                </Link>

                <Link
                  href="/reports"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors shadow-sm"
                >
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Field PWA</span>
                </Link>
              </div>

              {/* Operational Proof Points */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">8 States</div>
                  <div className="text-xs text-slate-500 mt-0.5">Assam, Meghalaya, Sikkim + 5</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-2xl font-bold text-amber-600">92.4%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Corridor Passability Rate</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">&lt; 1.2s</div>
                  <div className="text-xs text-slate-500 mt-0.5">Dynamic Reroute Time</div>
                </div>
              </div>
            </div>

            {/* Right Column: Regional GIS Preview Panel */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Regional Corridor Intelligence
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  LIVE TELEMETRY
                </span>
              </div>

              {/* Corridor List Table */}
              <div className="divide-y divide-slate-100">
                {CORRIDORS.map((c) => (
                  <div key={c.code} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{c.code}</span>
                        <span className="text-xs text-slate-600 font-medium">{c.name}</span>
                      </div>
                      {c.alert && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{c.alert}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          c.status === "PASSABLE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : c.status === "WARNING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">Score: {c.score}/100</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Map Launch Callout */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Interactive GIS with Terrain & Slope Risk</span>
                <Link
                  href="/map"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  <span>Open GIS Map</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars of Intelligence Architecture */}
        <section className="border-t border-slate-200/80 bg-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                System Architecture
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                Closed-Loop Accessibility & Logistics Intelligence
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">1. Real-Time Sensing</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ingests vehicle GPS telemetry, IMD rainfall feeds, road clearance sensor logs, and authenticated offline field reports.
                </p>
              </div>

              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">2. AI Disruption Prediction</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gradient-boosted machine learning calculates landslide risk, flash flood likelihood, and road accessibility scores per highway segment.
                </p>
              </div>

              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">3. Multi-Criteria Routing</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Network graph optimization dynamically computes fastest, lowest-risk, and weather-resilient alternate corridors with ETA predictions.
                </p>
              </div>

              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">4. Decision Support</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Command center dispatchers confirm automated reroutes, dispatch field response, and notify critical medical and fuel consignments.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-slate-800 font-semibold">NE-ROUTE Platform</span> — Ministry of Development of North Eastern Region (MDoNER), Government of India.
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/" className="hover:text-slate-900 transition-colors">Command Center</Link>
            <Link href="/map" className="hover:text-slate-900 transition-colors">GIS Map</Link>
            <Link href="/reports" className="hover:text-slate-900 transition-colors">Field PWA</Link>
            <Link href="/admin" className="hover:text-slate-900 transition-colors">System Health</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
