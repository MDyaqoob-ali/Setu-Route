"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Radio, Shield, Lock, Mail, ArrowRight, UserCheck, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

const DEMO_ROLES = [
  { label: "Super Admin (MDoNER HQ)", email: "admin@neroute.gov.in", pass: "admin123", role: "SUPER_ADMIN" },
  { label: "Regional Admin (Assam State)", email: "regional.assam@neroute.gov.in", pass: "admin123", role: "REGIONAL_ADMIN" },
  { label: "District Officer (Kamrup)", email: "officer.kamrup@neroute.gov.in", pass: "officer123", role: "DISTRICT_OFFICER" },
  { label: "Field Officer (Cachar Valley)", email: "field.cachar@neroute.gov.in", pass: "field123", role: "FIELD_OFFICER" },
  { label: "Logistics Lead (Freight Tower)", email: "logistics.lead@ner-freight.in", pass: "operator123", role: "LOGISTICS_OPERATOR" },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("admin@neroute.gov.in");
  const [password, setPassword] = useState("admin123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      return apiClient<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      router.push("/");
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Invalid credentials. Please verify email and password.");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    loginMutation.mutate();
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 items-center justify-center shadow-lg shadow-brand-500/25 mb-1">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            SETU-ROUTE Portal
          </h1>
          <p className="text-xs text-slate-500">
            Ministry of Development of North Eastern Region (MDoNER)
          </p>
        </div>

        {/* Login Form Box */}
        <div className="p-7 rounded-2xl border border-slate-200/80 bg-white shadow-card space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">Authorized Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <span>{loginMutation.isPending ? "Authenticating..." : "Access Command Center"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Autofill */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Quick Role Profiles:
            </span>
            <div className="space-y-1.5">
              {DEMO_ROLES.map((r) => (
                <button
                  key={r.email}
                  type="button"
                  onClick={() => handleQuickFill(r.email, r.pass)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-50/70 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs flex items-center justify-between transition-colors"
                >
                  <span className="truncate font-medium">{r.label}</span>
                  <span className="text-[10px] font-semibold text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded-md">{r.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
