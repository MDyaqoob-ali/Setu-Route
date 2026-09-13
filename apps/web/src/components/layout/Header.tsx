"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Globe,
  Activity,
  Clock,
  User as UserIcon,
  Menu,
  Shield,
  Radio,
  Command,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { GlobalSearchModal } from "@/components/ui/GlobalSearchModal";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Command Center", subtitle: "NER Real-time Telemetry & Logistics Oversight" },
  "/map": { title: "Live GIS Map", subtitle: "Regional Corridor Intelligence & Multi-layer GIS" },
  "/vehicles": { title: "Fleet Vehicles", subtitle: "Live Telemetry, Speed & Convoy Tracking" },
  "/deliveries": { title: "Consignments", subtitle: "Critical Medical & Supply Lifeline Deliveries" },
  "/incidents": { title: "Incident Triage", subtitle: "Landslide, Cloudburst & Hazard Management" },
  "/routes": { title: "Route Optimizer", subtitle: "Multi-Criteria AI Risk-Aware Graph Solver" },
  "/statistics": { title: "Statistics & Impact", subtitle: "Logistics Efficiency, Risk Mitigation & Operational Impact Analytics" },
  "/analytics": { title: "Operational Analytics", subtitle: "Regional Trends & Accessibility Indices" },
  "/reports": { title: "Field Reports", subtitle: "PWA Offline Incident Submission & Outbox" },
  "/alerts": { title: "Alerts Center", subtitle: "Actionable 4-Part Telemetry Notifications" },
  "/admin": { title: "System Health & Audit", subtitle: "Infrastructure Matrix & Audit Trail" },
  "/settings": { title: "Settings", subtitle: "Platform Configuration & Telemetry Rates" },
  "/landing": { title: "Landing Overview", subtitle: "Ministry Regional Logistics Portal" },
};

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { user } = useAuthStore();
  const [timeStr, setTimeStr] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
      setTimeStr(`${formatted} IST`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageInfo = PAGE_TITLES[pathname] || {
    title: "SETU-ROUTE Intelligence",
    subtitle: "MDoNER Logistics Command",
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-30 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 flex items-center justify-between px-4 lg:px-8 shadow-xs",
          sidebarOpen ? "left-0 md:left-64" : "left-0 md:left-16"
        )}
      >
        {/* Left: Mobile toggle & Breadcrumb / Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Link href="/" className="hover:text-slate-600 transition-colors">SETU-ROUTE</Link>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-700 font-semibold">{pageInfo.title}</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden xl:inline truncate max-w-xs">
              {pageInfo.subtitle}
            </span>
          </div>
        </div>

        {/* Center: Large Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 hover:border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-400 flex items-center justify-between transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" />
              <span className="truncate text-slate-500 font-normal">Search roads, vehicles, deliveries...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500 font-sans shadow-xs">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* Right: System Health, Connection State, Language, Notifications, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* System Health Indicator Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Healthy</span>
          </div>

          {/* Connection & Offline Sync Indicator */}
          <ConnectionIndicator />

          {/* Multilingual Selector */}
          <LanguageSelector />

          {/* Operational Notification Center */}
          <NotificationCenter />

          {/* Live IST Clock */}
          <div className="hidden 2xl:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span suppressHydrationWarning>{timeStr || "IST"}</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-sky text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {user?.full_name ? user.full_name[0] : "A"}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.full_name || "Operations Lead"}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                {user?.role || "SUPER_ADMIN"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

