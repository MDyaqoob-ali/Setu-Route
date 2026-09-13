"use client";

import React from "react";
import {
  Clock,
  X,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  timestamp: string;
  iso_timestamp: string;
  event_type: string;
  title: string;
  description: string;
  risk_score_before: number;
  risk_score_after: number;
  action_taken: string;
  ai_verdict: string;
}

interface RouteAuditTrailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditTrail: AuditEntry[];
}

export const RouteAuditTrailDrawer: React.FC<RouteAuditTrailDrawerProps> = ({
  isOpen,
  onClose,
  auditTrail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white h-full w-full max-w-md shadow-2xl border-l border-slate-200 p-5 flex flex-col justify-between">
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Decision Audit Log Trail
                </h3>
                <p className="text-[11px] text-slate-500">
                  Chronological records of all risk transitions & AI reroutes.
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

          {/* Audit Timeline */}
          {auditTrail.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No state changes recorded yet for this session.
            </div>
          ) : (
            <div className="space-y-3">
              {auditTrail.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-500 font-semibold">{entry.timestamp}</span>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-white border border-slate-200 text-slate-700">
                      {entry.ai_verdict}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900">{entry.title}</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {entry.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px] text-slate-500">
                    <span>
                      Risk: <strong>{entry.risk_score_before}</strong> → <strong>{entry.risk_score_after}</strong>
                    </span>
                    <span className="font-semibold text-brand-700">
                      {entry.action_taken.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
