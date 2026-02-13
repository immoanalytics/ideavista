import { create } from "zustand";

interface GraphStore {
  selectedNodeId: string | null;
  viewMode: "graph" | "cluster" | "mindmap";
  typeFilter: string | null;
  searchQuery: string;
  setSelectedNode: (id: string | null) => void;
  setViewMode: (mode: "graph" | "cluster" | "mindmap") => void;
  setTypeFilter: (type: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  selectedNodeId: null,
  viewMode: "graph",
  typeFilter: null,
  searchQuery: "",
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
