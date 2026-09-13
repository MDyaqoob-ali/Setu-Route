"use client";

import React from "react";
import { useUiStore } from "@/stores/uiStore";
import { useRealtimeTelemetry } from "@/hooks/useRealtimeTelemetry";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RealtimeAlertTicker } from "@/components/alerts/RealtimeAlertTicker";
import { GlobalErrorBoundary } from "@/components/ui/GlobalErrorBoundary";
import { cn } from "@/lib/utils";

export const RootLayoutClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarOpen } = useUiStore();
  // Global real-time WebSocket connection to /ws/all
  useRealtimeTelemetry();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-foreground">
      <Sidebar />
      <Header />

      {/* Real-time ticker dynamically aligned with sidebar */}
      <div
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarOpen ? "md:pl-64" : "md:pl-16"
        )}
      >
        <RealtimeAlertTicker />
      </div>

      {/* Main Content Area dynamically synced with sidebar */}
      <main
        className={cn(
          "flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 max-w-[1680px] w-full mx-auto",
          sidebarOpen ? "md:pl-64" : "md:pl-16"
        )}
      >
        <GlobalErrorBoundary>
          {children}
        </GlobalErrorBoundary>
      </main>
    </div>
  );
};
