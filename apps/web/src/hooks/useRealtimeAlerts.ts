"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "@/lib/api-client";
import { useToast } from "@/components/ui/ToastProvider";
import { Alert } from "@/types";

export interface AlertSummaryData {
  total_unacknowledged: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  latest_threat: {
    id: string;
    alert_code: string;
    title: string;
    severity: string;
    what_happened: string;
    why_it_matters: string;
    who_is_affected: string;
    recommended_action: string;
    created_at: string | null;
  } | null;
  status: string;
}

// Synthesize pleasant emergency chime using browser Web Audio API
function playAlertTone(severity: string) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === "CRITICAL" ? "sawtooth" : "sine";
    const freq = severity === "CRITICAL" ? 659.25 : 523.25; // E5 or C5
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // AudioContext blocked by browser autoplay policy until user interaction
  }
}

export function useRealtimeAlerts() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Poll summary every 6s as fallback & baseline
  const { data: summary, refetch: refetchSummary } = useQuery<AlertSummaryData>({
    queryKey: ["alerts-summary"],
    queryFn: () => apiClient<AlertSummaryData>("/alerts/summary"),
    refetchInterval: 6000,
  });

  const ackMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiClient<Alert>(`/alerts/${alertId}/acknowledge`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      addToast({
        title: "Threat Acknowledged",
        description: "Alert marked as reviewed in regional logs.",
        type: "success",
      });
    },
  });

  // Setup WebSocket connection to /ws/alerts
  const connectWebSocket = useCallback(() => {
    if (typeof window === "undefined") return;

    // Derive WS URL from API_BASE_URL
    let wsUrl: string;
    try {
      const urlObj = new URL(API_BASE_URL);
      const proto = urlObj.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${proto}//${urlObj.host}/ws/alerts`;
    } catch {
      wsUrl = "ws://127.0.0.1:8008/ws/alerts";
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "ALERT_CREATED" && payload.data) {
            const newAlert = payload.data;
            // Play audible chime if enabled
            if (soundEnabled && (newAlert.severity === "CRITICAL" || newAlert.severity === "HIGH")) {
              playAlertTone(newAlert.severity);
            }

            // Fire real-time toast
            addToast({
              title: `🚨 ${newAlert.severity} Alert: ${newAlert.title}`,
              description: newAlert.what_happened || "Operational alert dispatched.",
              type: newAlert.severity === "CRITICAL" ? "error" : "warning",
            });

            // Invalidate queries to refresh feeds instantly
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
            queryClient.invalidateQueries({ queryKey: ["alerts-summary"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
          } else if (payload.type === "ALERT_ACKNOWLEDGED") {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
            queryClient.invalidateQueries({ queryKey: ["alerts-summary"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
          }
        } catch (e) {
          // parse error
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 4s
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 4000);
      };
    } catch (e) {
      setIsConnected(false);
    }
  }, [addToast, queryClient, soundEnabled]);

  useEffect(() => {
    connectWebSocket();

    // Heartbeat ping every 25s
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  return {
    summary,
    isConnected,
    soundEnabled,
    setSoundEnabled,
    refetchSummary,
    acknowledgeAlert: ackMutation.mutate,
    isAcknowledging: ackMutation.isPending,
  };
}
