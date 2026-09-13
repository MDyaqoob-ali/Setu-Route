import React from "react";
import { LucideIcon, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  lastUpdated?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  lastUpdated,
  icon: Icon = ShieldCheck,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-white/70 shadow-xs",
        className
      )}
    >
      <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>
      {lastUpdated && (
        <p className="mt-2 text-[11px] text-slate-400">
          Last network update: {lastUpdated}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

