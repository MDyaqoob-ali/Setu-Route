"use client";

import React from "react";
import {
  Radio,
  X,
  CheckCircle2,
  Clock,
  Zap,
  Layers,
  ShieldCheck,
  Server,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataSource {
  name: string;
  type: string;
  status: string;
  protocol: string;
  refresh_interval_sec: number;
  last_updated_sec_ago: number;
  is_stale: boolean;
  reliability: string;
  badge_color: string;
}

interface DataConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: DataSource[];
  lastSync: string;
}

export const DataConnectionModal: React.FC<DataConnectionModalProps> = ({
  isOpen,
  onClose,
  sources,
  lastSync,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Real-Time Telemetry Connection Health
              </h3>
              <p className="text-[11px] text-slate-500">
                Continuous Multi-Source Pipeline • Last sync: {new Date(lastSync).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sources List */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    src.status === "Live" ? "bg-emerald-500 animate-ping" : "bg-blue-500"
                  )}
                ></span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{src.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({src.protocol})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Refresh: {src.refresh_interval_sec}s</span>
                    <span>•</span>
                    <span>Reliability: {src.reliability}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider block mb-0.5",
                    src.status === "Live"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  )}
                >
                  ● {src.status}
                </span>
                <span className="text-[10px] text-slate-400">
                  Updated {src.last_updated_sec_ago}s ago
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
          <span>Deterministic Layer: Active & Responding &lt; 30ms</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
