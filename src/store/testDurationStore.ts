import { create } from "zustand";

type TestDuration = {
  type: "time" | "words";
  value: number;
};

interface TestDurationStore {
  testDuration: TestDuration;
  setTestDuration: (testDuration: TestDuration) => void;
}

export const useTestDurationStore = create<TestDurationStore>((set) => ({
  testDuration: {
    type: "time",
    value: 30,
  },
  setTestDuration: (duration) => set({ testDuration: duration }),
}));
