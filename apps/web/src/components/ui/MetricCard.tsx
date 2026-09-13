import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  severity?: "normal" | "warning" | "critical" | "success";
  progress?: number; // 0 - 100 percentage for circular or bar visual
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  severity = "normal",
  progress,
  className,
}) => {
  const CardContent = (
    <div
      className={cn(
        "group relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full",
        "bg-white border-slate-200/80 shadow-xs hover:shadow-card hover:-translate-y-0.5",
        severity === "critical" && "border-rose-200 bg-rose-50/20 hover:border-rose-300",
        severity === "warning" && "border-amber-200 bg-amber-50/20 hover:border-amber-300",
        severity === "success" && "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300",
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div
            className={cn(
              "p-2.5 rounded-xl transition-transform group-hover:scale-110",
              severity === "critical" && "bg-rose-100 text-rose-600",
              severity === "warning" && "bg-amber-100 text-amber-600",
              severity === "success" && "bg-emerald-100 text-emerald-600",
              severity === "normal" && "bg-brand-50 text-brand-600"
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                trend.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              )}
            >
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1.5 text-xs text-slate-500 font-normal leading-relaxed line-clamp-1">{subtitle}</p>
        )}

        {/* Optional Micro Progress Bar */}
        {progress !== undefined && (
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                severity === "critical" ? "bg-rose-500" : severity === "warning" ? "bg-amber-500" : "bg-brand-600"
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>

      {href && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-brand-600 transition-colors">
          <span>View details</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{CardContent}</Link>;
  }

  return CardContent;
};

