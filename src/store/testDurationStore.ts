import { create } from "zustand";

import { TestType } from "@/modules/types";

type TestDuration = {
  type: TestType;
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
