import { create } from "zustand";

type BannerType = "error" | "warning" | "info" | "success";

interface BannerState {
  text: string | null;
  type: BannerType;
  time: number;
  showBanner: (text: string, type: BannerType, time: number) => void;
  hideBanner: () => void;
}

export const useBannerStore = create<BannerState>((set) => ({
  text: null,
  type: "info",
  time: 10000,

  showBanner: (text, type = "info", time = 5000) =>
    set({ text, type, time }, false),

  hideBanner: () => set({ text: null, type: "info" }, false),
}));
