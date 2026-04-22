"use client";

import { useState } from "react";

import { TestDuration, TypingTest } from "@/components";
import { Report } from "@/components/Report";
import { AntiCheatPayload, TestStats } from "@/modules/types";
import { useTestDataStore } from "@/store";

export default function Home() {
  const [testResult, setTestResult] = useState<TestStats | null>(null);
  const [antiCheatData, setAntiCheatData] = useState<
    AntiCheatPayload | undefined
  >(undefined);
  const setTestEnded = useTestDataStore((state) => state.setTestEnded);

  const handleTestComplete = (
    result: TestStats | null,
    antiCheatPayload?: AntiCheatPayload,
  ) => {
    setTestResult(result);
    setAntiCheatData(antiCheatPayload);
  };

  const handleTestRestart = () => {
    setTestEnded(false);
    setTestResult(null);
    setAntiCheatData(undefined);
  };

  return (
    <div className="flex min-h-[70vh] flex-col justify-center">
      {testResult ? (
        <Report
          testStat={testResult}
          antiCheatPayload={antiCheatData}
          onRestart={handleTestRestart}
        />
      ) : (
        <div className="flex flex-col items-center gap-8">
          <TestDuration />
          <div className="border-cyan-2 bg-dark-1 relative w-[80vw] rounded-lg border px-6 py-12 shadow-lg">
            <img
              src="/panda-bg-image.png"
              alt="panda-bg-image"
              className="fixed -top-20 -left-30 -z-10 w-[80vh] object-cover"
            />

            <TypingTest onTestComplete={handleTestComplete} />
          </div>
        </div>
      )}
    </div>
  );
}
