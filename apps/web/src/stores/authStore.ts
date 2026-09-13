import { create } from "zustand";
import { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user: User, token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("neroute_token", token);
      localStorage.setItem("neroute_user", JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("neroute_token");
      localStorage.removeItem("neroute_user");
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("neroute_token");
      const userStr = localStorage.getItem("neroute_user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          localStorage.removeItem("neroute_token");
          localStorage.removeItem("neroute_user");
        }
      }
    }
    // Default fallback to Admin Demo User if not explicitly logged in
    const demoAdmin: User = {
      id: "admin-default",
      email: "admin@neroute.gov.in",
      full_name: "Rajesh Sharma (IAS)",
      role: "SUPER_ADMIN",
      department: "MDoNER Logistics Operations",
      is_active: true,
      created_at: new Date().toISOString()
    };
    set({ user: demoAdmin, token: "demo-token", isAuthenticated: true, isLoading: false });
  },
}));
