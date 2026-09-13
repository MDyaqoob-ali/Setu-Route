"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "warning" | "error" | "info";
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, type = "info", duration = 4000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isWarning = toast.type === "warning";
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-floating bg-white/95 backdrop-blur-md transition-all duration-300 transform translate-y-0",
                isSuccess && "border-emerald-200 text-slate-800",
                isWarning && "border-amber-200 text-slate-800",
                isError && "border-rose-200 text-slate-800",
                !isSuccess && !isWarning && !isError && "border-slate-200 text-slate-800"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-brand-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-semibold text-slate-900 leading-tight">{toast.title}</h5>
                {toast.description && (
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{toast.description}</p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
