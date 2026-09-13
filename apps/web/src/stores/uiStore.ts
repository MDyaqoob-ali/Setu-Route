import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  activeRegion: string;
  selectedLayerIds: string[];
  globalSearchQuery: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveRegion: (region: string) => void;
  toggleLayer: (layerId: string) => void;
  setGlobalSearchQuery: (query: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeRegion: "ALL", // "ALL" or specific state: "Assam", "Meghalaya", "Manipur", etc.
  selectedLayerIds: ["roads", "incidents", "vehicles", "districts", "weather"],
  globalSearchQuery: "",

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveRegion: (region) => set({ activeRegion: region }),
  toggleLayer: (layerId) =>
    set((state) => {
      const exists = state.selectedLayerIds.includes(layerId);
      return {
        selectedLayerIds: exists
          ? state.selectedLayerIds.filter((id) => id !== layerId)
          : [...state.selectedLayerIds, layerId],
      };
    }),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
}));
