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
    <div className="min-h-screen flex bg-[#F5F7FA] text-foreground">
      <Sidebar />

      {/* Main Layout Column dynamically offset by sidebar width on desktop */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          sidebarOpen ? "md:pl-64" : "md:pl-16"
        )}
      >
        <Header />

        {/* Real-time ticker positioned cleanly below fixed header */}
        <div className="pt-16">
          <RealtimeAlertTicker />
        </div>

        {/* Main Content Area safely centered within available content width */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1680px] mx-auto min-w-0">
          <GlobalErrorBoundary>
            {children}
          </GlobalErrorBoundary>
        </main>
      </div>
    </div>
  );
};
