"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15000, // 15 seconds freshness for instant tab switches
            gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
            refetchInterval: 10000, // Background poll every 10s
            refetchOnWindowFocus: false, // Prevent jitter on window focus
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  );

  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
