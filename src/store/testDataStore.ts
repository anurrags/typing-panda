import { create } from "zustand";

interface TestDataStore {
  testStarted: boolean;
  testEnded: boolean;
  setTestStarted: (testStarted: boolean) => void;
  setTestEnded: (testEnded: boolean) => void;
}

export const useTestDataStore = create<TestDataStore>((set) => ({
  testStarted: false,
  testEnded: false,
  setTestStarted: (testStarted) => set({ testStarted }),
  setTestEnded: (testEnded) => set({ testEnded }),
}));
