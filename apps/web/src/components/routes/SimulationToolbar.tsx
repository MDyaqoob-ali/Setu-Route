"use client";

import React, { useState } from "react";
import {
  Gamepad2,
  CloudLightning,
  Mountain,
  Waves,
  Car,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationToolbarProps {
  sessionId: string;
  activeSimulation: any | null;
  onInjectEvent: (eventType: string, description: string) => void;
  onResetSimulation: () => void;
  isLoading?: boolean;
}

export const SimulationToolbar: React.FC<SimulationToolbarProps> = ({
  sessionId,
  activeSimulation,
  onInjectEvent,
  onResetSimulation,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-50 p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-indigo-950">
                Live Simulation & Demonstration Mode
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-800">
                Hackathon / Ops Testing
              </span>
            </div>
            <p className="text-[11px] text-indigo-700/80">
              Inject controlled real-time disruption events to evaluate the multi-criteria risk recalculation & AI rerouting pipeline.
            </p>
          </div>
        </div>

        {activeSimulation ? (
          <button
            onClick={onResetSimulation}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Real-Time Stream Active
          </span>
        )}
      </div>

      {/* Scenario Injectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <button
          onClick={() =>
            onInjectEvent(
              "CLOUDBURST",
              "Severe cloudburst detected (78mm/h) along high-altitude mountain pass sector."
            )
          }
          disabled={isLoading}
          className={cn(
            "p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2",
            activeSimulation?.event_type === "CLOUDBURST"
              ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300"
              : "bg-white/90 text-slate-800 border-indigo-200 hover:border-blue-400 hover:bg-blue-50"
          )}
        >
          <CloudLightning className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="truncate">
            <div className="font-bold truncate">Cloudburst Storm</div>
            <div className="text-[10px] text-slate-500 truncate font-normal">+42% Risk Surge</div>
          </div>
        </button>

        <button
          onClick={() =>
            onInjectEvent(
              "LANDSLIDE",
              "Massive rockfall and slope failure burying 300m of carriageway under debris."
            )
          }
          disabled={isLoading}
          className={cn(
            "p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2",
            activeSimulation?.event_type === "LANDSLIDE"
              ? "bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300"
              : "bg-white/90 text-slate-800 border-indigo-200 hover:border-rose-400 hover:bg-rose-50"
          )}
        >
          <Mountain className="w-4 h-4 text-rose-500 shrink-0" />
          <div className="truncate">
            <div className="font-bold truncate">Sela Landslide</div>
            <div className="text-[10px] text-slate-500 truncate font-normal">Triggers Auto-Reroute</div>
          </div>
        </button>

        <button
          onClick={() =>
            onInjectEvent(
              "FLASH_FLOOD",
              "Flash riverine inundation crossing 2.5ft over low-lying culvert bridge."
            )
          }
          disabled={isLoading}
          className={cn(
            "p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2",
            activeSimulation?.event_type === "FLASH_FLOOD"
              ? "bg-cyan-700 text-white border-cyan-800 shadow-md ring-2 ring-cyan-300"
              : "bg-white/90 text-slate-800 border-indigo-200 hover:border-cyan-400 hover:bg-cyan-50"
          )}
        >
          <Waves className="w-4 h-4 text-cyan-600 shrink-0" />
          <div className="truncate">
            <div className="font-bold truncate">Flash Inundation</div>
            <div className="text-[10px] text-slate-500 truncate font-normal">Speed Restricted</div>
          </div>
        </button>

        <button
          onClick={() =>
            onInjectEvent(
              "TRAFFIC_SPILL",
              "Multi-axle commercial tanker breakdown blocking southbound lane."
            )
          }
          disabled={isLoading}
          className={cn(
            "p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2",
            activeSimulation?.event_type === "TRAFFIC_SPILL"
              ? "bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300"
              : "bg-white/90 text-slate-800 border-indigo-200 hover:border-amber-400 hover:bg-amber-50"
          )}
        >
          <Car className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="truncate">
            <div className="font-bold truncate">Tanker Bottleneck</div>
            <div className="text-[10px] text-slate-500 truncate font-normal">+45 min Delay</div>
          </div>
        </button>
      </div>
    </div>
  );
};
