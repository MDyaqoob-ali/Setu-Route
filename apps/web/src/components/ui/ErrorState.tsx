"use client";

import React, { useState } from "react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  lastUpdated?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  errorDetails?: any;
  className?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Telemetry Stream Unavailable",
  message = "Live data is temporarily unavailable from the upstream provider. Operating in cached / degraded mode.",
  lastUpdated,
  onRetry,
  isRetrying = false,
  errorDetails,
  className,
  compact = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="truncate">
            <span className="font-semibold">{title}</span>
            {lastUpdated && (
              <span className="text-amber-700/80 text-[11px] ml-1.5 hidden sm:inline">
                • Last valid data: {lastUpdated}
              </span>
            )}
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] transition-colors shrink-0 flex items-center gap-1 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", isRetrying && "animate-spin")} />
            <span>{isRetrying ? "Retrying..." : "Retry"}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-7 sm:p-9 text-center rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white shadow-card max-w-lg mx-auto",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3.5 shadow-xs">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{message}</p>

      {lastUpdated && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Last successful update: {lastUpdated}</span>
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRetrying && "animate-spin")} />
          <span>{isRetrying ? "Re-establishing Feed..." : "Try Again"}</span>
        </button>
      )}

      {errorDetails && (
        <div className="mt-4 w-full text-left">
          <button
            onClick={() => setShowDetails((p) => !p)}
            className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center justify-center gap-1 mx-auto"
          >
            <span>{showDetails ? "Hide Technical Diagnostics" : "Show Technical Diagnostics"}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showDetails && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-slate-300 font-mono text-[10px] overflow-x-auto max-h-32 text-left">
              {typeof errorDetails === "string"
                ? errorDetails
                : JSON.stringify(errorDetails, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
