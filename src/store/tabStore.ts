import { create } from "zustand";

type Tab = "practice" | "leaderboard" | "about";
interface TabStore {
  tab: Tab;
  setTab: (tab: Tab) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  tab: "practice",
  setTab: (tab) => set({ tab }),
}));
