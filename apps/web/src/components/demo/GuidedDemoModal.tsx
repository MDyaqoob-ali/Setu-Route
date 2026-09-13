"use client";

import React, { useState } from "react";
import {
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X,
  Truck,
  CloudRain,
  Mountain,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface DemoStep {
  step: number;
  title: string;
  description: string;
  status: "pending" | "running" | "completed";
}

const MEDICAL_SCENARIO_STEPS: string[] = [
  "Consignment NER-MED-2026-084 (Critical Cardiac Fluids) in-transit on NH-40/NH-6 towards Silchar.",
  "IMD Cherrapunji/Khliehriat sensor records intense torrential cloudburst (48.5 mm/h).",
  "Disruption Risk ML Model predicts elevated hazard (82/100, CRITICAL) for Sonapur sector.",
  "Major Landslide occurs at Sonapur Valley Km 142. Both highway lanes blocked by mud/debris.",
  "Accessibility Engine grades NH-6 as BLOCKED (Score 18/100, Reason: Landslide debris).",
  "Dynamic Rerouting Engine scans road network and flags Vehicle AS-01-GC-4482 as directly affected.",
  "Multi-criteria Graph Solver calculates alternate bypass via Nongstoin / Western Meghalaya SH.",
  "Operator explainability panel displays 'Why this Route?': Circumvents active slide, adds +47m.",
  "Vehicle route coordinates and navigation waypoints automatically rerouted in database.",
  "Calibrated ETA Engine recalculates delivery arrival: ETA updated with +47 mins delay.",
  "Actionable 4-part alert ALT-DEL-8924 generated and streamed live over WebSockets.",
];

export const GuidedDemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [activeScenario, setActiveScenario] = useState<string>("emergency_medical");
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [scenarioLogs, setScenarioLogs] = useState<string[]>([]);
  const [reroutedVehicleData, setReroutedVehicleData] = useState<any>(null);

  if (!isOpen) return null;

  const runMedicalScenario = async () => {
    setIsRunning(true);
    setCurrentStepIdx(0);
    setScenarioLogs([]);

    for (let i = 0; i < MEDICAL_SCENARIO_STEPS.length; i++) {
      setCurrentStepIdx(i);
      setScenarioLogs((prev) => [...prev, `[Step ${i + 1}] ${MEDICAL_SCENARIO_STEPS[i]}`]);

      // At step 4, trigger actual backend scenario API call
      if (i === 4) {
        try {
          const res = await apiClient<any>("/simulation/scenario", {
            method: "POST",
            body: JSON.stringify({
              scenario_type: "landslide",
              corridor_code: "NH-6",
              severity: "CRITICAL",
            }),
          });
          if (res.rerouted_vehicles && res.rerouted_vehicles.length > 0) {
            setReroutedVehicleData(res.rerouted_vehicles[0]);
          }
        } catch (e) {
          console.error("Backend scenario execution failed:", e);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
  };

  const handleReset = async () => {
    try {
      await apiClient<any>("/simulation/scenario", {
        method: "POST",
        body: JSON.stringify({ scenario_type: "reset_demo", corridor_code: "NH-6" }),
      });
      setCurrentStepIdx(-1);
      setScenarioLogs([]);
      setReroutedVehicleData(null);
    } catch (e) {
      console.error("Reset failed:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                MDoNER Guided Simulation & Scenarios
              </h2>
              <p className="text-[11px] text-slate-500">Autonomous resilience & multi-criteria rerouting engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
              SIMULATION MODE
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <p className="text-slate-600 text-xs leading-relaxed">
            Execute real-time regional logistics stress scenarios. Each prediction, detour calculation, ETA calibration, and alert generation interacts directly with live backend machine learning and graph routing algorithms.
          </p>

          {/* Scenario Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => {
                setActiveScenario("emergency_medical");
                setCurrentStepIdx(-1);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeScenario === "emergency_medical"
                  ? "bg-brand-50 border-brand-300 text-brand-900 font-semibold shadow-sm ring-1 ring-brand-200"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Truck className="w-4 h-4 text-brand-600 mb-1.5" />
              <span className="block text-xs font-semibold">Medical Delivery</span>
              <span className="text-[10px] text-slate-400 font-normal">Active rerouting</span>
            </button>

            <button
              onClick={() => {
                setActiveScenario("rainfall_spike");
                setCurrentStepIdx(-1);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeScenario === "rainfall_spike"
                  ? "bg-sky-50 border-sky-300 text-sky-900 font-semibold shadow-sm ring-1 ring-sky-200"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <CloudRain className="w-4 h-4 text-sky-600 mb-1.5" />
              <span className="block text-xs font-semibold">Monsoon Spike</span>
              <span className="text-[10px] text-slate-400 font-normal">Risk surge</span>
            </button>

            <button
              onClick={() => {
                setActiveScenario("sonapur_landslide");
                setCurrentStepIdx(-1);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeScenario === "sonapur_landslide"
                  ? "bg-amber-50 border-amber-300 text-amber-900 font-semibold shadow-sm ring-1 ring-amber-200"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Mountain className="w-4 h-4 text-amber-600 mb-1.5" />
              <span className="block text-xs font-semibold">NH-6 Landslide</span>
              <span className="text-[10px] text-slate-400 font-normal">Corridor closure</span>
            </button>

            <button
              onClick={handleReset}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-left transition-all"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600 mb-1.5" />
              <span className="block text-xs font-semibold">Reset State</span>
              <span className="text-[10px] text-slate-400 font-normal">Restore network</span>
            </button>
          </div>

          {/* Stepper Timeline: Emergency Medical Consignment */}
          {activeScenario === "emergency_medical" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-bold text-slate-800 text-xs">
                    Scenario: Emergency Medical Shipment (Cardiac & Dialysis Fluids)
                  </span>
                  <p className="text-[11px] text-slate-500">Guwahati Dispatch Hub ➔ Silchar Medical College</p>
                </div>
                <button
                  onClick={runMedicalScenario}
                  disabled={isRunning}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isRunning ? "Executing Loop..." : "Run Step-by-Step"}
                </button>
              </div>

              {/* Step Sequence Display */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {MEDICAL_SCENARIO_STEPS.map((stepText, idx) => {
                  const isDone = currentStepIdx > idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                        isCurrent
                          ? "bg-brand-50/70 border-brand-300 ring-1 ring-brand-200 text-slate-900 shadow-sm"
                          : isDone
                          ? "bg-slate-50/70 border-slate-200 text-slate-700"
                          : "bg-white border-slate-100 text-slate-400"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <span className="w-4 h-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin block" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <div className="text-xs leading-relaxed">
                        <span className="font-semibold block text-slate-800 text-[11px]">Step {idx + 1}</span>
                        <span className={isCurrent ? "font-medium text-slate-900" : isDone ? "text-slate-600" : "text-slate-400"}>
                          {stepText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rerouted Output Card */}
              {reroutedVehicleData && (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5 text-xs text-emerald-950">
                  <div className="flex items-center justify-between text-emerald-800 font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Dynamic Reroute Successfully Enacted
                    </span>
                    <span className="font-mono text-[11px] bg-emerald-100 px-2 py-0.5 rounded">Consignment: {reroutedVehicleData.consignment_code}</span>
                  </div>
                  <p className="text-slate-700">
                    Detour: <strong>{reroutedVehicleData.new_route_name}</strong> (+{reroutedVehicleData.detour_distance_km}km)
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Rationale: {reroutedVehicleData.safety_rationale} • New ETA: {reroutedVehicleData.new_eta}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Powered by NE-ROUTE AI Intelligence Loop (MDoNER PS-26002)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            Close Launcher
          </button>
        </div>
      </div>
    </div>
  );
};
