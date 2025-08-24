"use client";

import { TestDuration, TypingTest } from "@/components";
import { Report } from "@/components/Report";
import { TestStats } from "@/modules/types";
import { useTestDataStore } from "@/store";
import { useState } from "react";

export default function Home() {
  const [testResult, setTestResult] = useState<TestStats | null>(null);
  const setTestEnded = useTestDataStore((state) => state.setTestEnded);

  const handleTestComplete = (result: TestStats | null) => {
    setTestResult(result);
  };

  const handleTestRestart = () => {
    setTestEnded(false);
    setTestResult(null);
  };

  return (
    <div className="mt-16 flex min-h-[90vh] flex-col justify-center">
      {testResult ? (
        <Report testStat={testResult} onRestart={handleTestRestart} />
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
