import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading telemetry...",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <Loader2 className="w-7 h-7 text-brand-600 animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full animate-pulse space-y-2.5">
      <div className="h-10 bg-slate-100 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-white rounded-xl border border-slate-200/80" />
      ))}
    </div>
  );
};

