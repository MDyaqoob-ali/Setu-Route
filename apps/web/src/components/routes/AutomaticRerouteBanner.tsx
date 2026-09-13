"use client";

import React from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomaticRerouteBannerProps {
  previousRouteName: string;
  previousRiskScore: number;
  newRouteName: string;
  newRiskScore: number;
  newEtaFormatted: string;
  reason: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export const AutomaticRerouteBanner: React.FC<AutomaticRerouteBannerProps> = ({
  previousRouteName,
  previousRiskScore,
  newRouteName,
  newRiskScore,
  newEtaFormatted,
  reason,
  onAccept,
  onDismiss,
}) => {
  const riskReductionPct = Math.max(15, Math.round(((previousRiskScore - newRiskScore) / previousRiskScore) * 100));

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-brand-400/40 space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-400/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-brand-300 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-300">
                AI Recommendation Updated
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                {riskReductionPct}% Safer Logistics Profile
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
              {reason}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comparison Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
        <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-300 block">Current Route (Degraded)</span>
          <div className="font-bold text-slate-100 truncate">{previousRouteName}</div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span>Risk Score:</span>
            <span className="font-black text-rose-400">{previousRiskScore} / 100</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-300 block">Recommended Alternative</span>
          <div className="font-bold text-white truncate">{newRouteName}</div>
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span>Risk Score: <strong className="text-emerald-400">{newRiskScore} / 100</strong></span>
            <span>•</span>
            <span>ETA: <strong className="text-white">{newEtaFormatted}</strong></span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
        <button
          onClick={onDismiss}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors"
        >
          Keep Current Route
        </button>

        <button
          onClick={onAccept}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-[1.02]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Accept New Route</span>
        </button>
      </div>
    </div>
  );
};
