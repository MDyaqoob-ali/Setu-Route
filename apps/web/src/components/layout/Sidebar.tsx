"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Truck,
  Package,
  AlertTriangle,
  Route,
  BarChart3,
  ClipboardList,
  Bell,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Compass,
  Radio,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Command Center", href: "/", icon: LayoutDashboard },
  { label: "Live Map", href: "/map", icon: MapPin },
  { label: "Vehicles", href: "/vehicles", icon: Truck },
  { label: "Deliveries", href: "/deliveries", icon: Package },
  { label: "Incidents", href: "/incidents", icon: AlertTriangle },
  { label: "Routes", href: "/routes", icon: Route },
  { label: "Statistics", href: "/statistics", icon: TrendingUp },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Field Reports", href: "/reports", icon: ClipboardList },
  { label: "Alerts", href: "/alerts", icon: Bell },
];

const SECONDARY_ITEMS = [
  { label: "Landing Overview", href: "/landing", icon: Compass },
  { label: "Administration", href: "/admin", icon: Shield },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/90 bg-white transition-all duration-300 shadow-sm",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-white">
        <Link href="/" className="flex items-center gap-3 overflow-hidden group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-sky flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                NE-ROUTE
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-normal mt-1 leading-none">
                MDoNER Intelligence
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden md:flex"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {sidebarOpen && (
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Operational Modules
          </div>
        )}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-brand-50 text-brand-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 hover:translate-x-0.5"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 inset-y-1.5 w-1 bg-brand-600 rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-brand-600" : "text-slate-400 group-hover:text-brand-600"
                  )}
                />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Secondary Divider & Links */}
        <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
          {sidebarOpen && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              System & Portal
            </div>
          )}
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-brand-50 text-brand-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 hover:translate-x-0.5"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 inset-y-1.5 w-1 bg-brand-600 rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-brand-600" : "text-slate-400 group-hover:text-brand-600"
                  )}
                />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Tagline */}
      {sidebarOpen && (
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 m-2 rounded-xl">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700">MDoNER Live Link</span>
          </div>
          <p className="text-[10px] text-slate-400 italic leading-relaxed">
            &quot;See the road before you send the vehicle.&quot;
          </p>
        </div>
      )}
    </aside>
  );
};

