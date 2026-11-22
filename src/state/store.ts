import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ComparisonResult, ListItem, Location } from "@/lib/types";

interface State {
  hydrated: boolean;
  location: Location | null;
  /** What the user typed/pasted in the sheet, kept so "Edit" reopens it as they left it. */
  listText: string;
  items: ListItem[];
  result: ComparisonResult | null;

  setLocation: (l: Location | null) => void;
  setListText: (t: string) => void;
  setItems: (items: ListItem[]) => void;
  setResult: (r: ComparisonResult | null) => void;
  reset: () => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      hydrated: false,
      location: null,
      listText: "",
      items: [],
      result: null,
      setLocation: (location) => set({ location, result: null }),
      setListText: (listText) => set({ listText }),
      setItems: (items) => set({ items, result: null }),
      setResult: (result) => set({ result }),
      reset: () => set({ listText: "", items: [], result: null }),
    }),
    {
      name: "basketwise-v2",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ location: s.location, listText: s.listText, items: s.items, result: s.result }),
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);
