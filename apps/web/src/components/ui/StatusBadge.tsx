import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  className,
}) => {
  const norm = (status || "").toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  // Semantic mappings
  if (["ACCESSIBLE", "OPERATIONAL", "RESOLVED", "DELIVERED", "VERIFIED", "GREEN", "LOW"].includes(norm)) {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    dotColor = "bg-emerald-500";
  } else if (["RESTRICTED", "WARNING", "INVESTIGATING", "DELAYED", "AT_RISK", "MEDIUM", "YELLOW", "ORANGE", "HIGH"].includes(norm)) {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200/80";
    dotColor = "bg-amber-500";
  } else if (["BLOCKED", "CRITICAL", "OPEN", "CANCELLED", "EMERGENCY", "SEVERE", "RED"].includes(norm)) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200/80";
    dotColor = "bg-rose-500 animate-pulse";
  } else if (["MOVING", "IN_TRANSIT", "INFO", "NORMAL"].includes(norm)) {
    colorClasses = "bg-blue-50 text-blue-700 border-blue-200/80";
    dotColor = "bg-blue-500";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium uppercase tracking-wider",
        colorClasses,
        sizeClasses,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
      {status.replace(/_/g, " ")}
    </span>
  );
};

