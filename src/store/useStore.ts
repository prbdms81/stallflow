import { create } from "zustand";

interface StallSelectionState {
  selectedStallId: string | null;
  selectedParkingId: string | null;
  setSelectedStall: (id: string | null) => void;
  setSelectedParking: (id: string | null) => void;
  reset: () => void;
}

export const useStallSelection = create<StallSelectionState>((set) => ({
  selectedStallId: null,
  selectedParkingId: null,
  setSelectedStall: (id) => set({ selectedStallId: id }),
  setSelectedParking: (id) => set({ selectedParkingId: id }),
  reset: () => set({ selectedStallId: null, selectedParkingId: null }),
}));

interface SearchFiltersState {
  city: string;
  category: string;
  eventType: string;
  dateFrom: string;
  dateTo: string;
  priceMin: number;
  priceMax: number;
  query: string;
  setFilter: (key: string, value: string | number) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  city: "",
  category: "",
  eventType: "",
  dateFrom: "",
  dateTo: "",
  priceMin: 0,
  priceMax: 100000,
  query: "",
};

export const useSearchFilters = create<SearchFiltersState>((set) => ({
  ...defaultFilters,
  setFilter: (key, value) => set({ [key]: value }),
  resetFilters: () => set(defaultFilters),
}));
