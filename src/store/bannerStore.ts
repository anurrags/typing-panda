import { create } from "zustand";

type BannerType = "error" | "warning" | "info" | "success";

interface BannerState {
  text: string | null;
  type: BannerType;
  time: number;
  showCloseButton: boolean;
  showBanner: (
    text: string,
    type?: BannerType,
    time?: number,
    showCloseButton?: boolean,
  ) => void;
  hideBanner: () => void;
}

export const useBannerStore = create<BannerState>((set) => ({
  text: null,
  type: "info",
  time: 5000,
  showCloseButton: false,

  showBanner: (text, type = "info", time = 5000, showCloseButton = false) =>
    set({ text, type, time, showCloseButton }, false),

  hideBanner: () =>
    set({ text: null, type: "info", showCloseButton: false }, false),
}));
