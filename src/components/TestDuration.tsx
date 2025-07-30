import { useTestDataStore, useTestDurationStore } from "@/store";
import React from "react";

const TestDuration = () => {
  const { testDuration, setTestDuration } = useTestDurationStore();
  const { testStarted, testEnded } = useTestDataStore();

  const handleTestDuration = (type: "time" | "words", value: number) => {
    if (testStarted || testEnded) return;
    setTestDuration({ type, value });
  };

  return (
    <div className="bg-dark-1 flex items-center gap-6 rounded-lg px-4 py-2 select-none">
      <div className="flex gap-2">
        <h3>Words:</h3>
        <ul className="text-grey-2 flex gap-2">
          <li
            className={`cursor-pointer ${testDuration.type === "words" && testDuration.value === 10 ? "text-cyan-2" : ""}`}
            onClick={() => handleTestDuration("words", 10)}
          >
            10
          </li>
          <li
            className={`cursor-pointer ${testDuration.type === "words" && testDuration.value === 25 ? "text-cyan-2" : ""}`}
            onClick={() => handleTestDuration("words", 25)}
          >
            25
          </li>
          <li
            className={`cursor-pointer ${testDuration.type === "words" && testDuration.value === 50 ? "text-cyan-2" : ""}`}
            onClick={() => handleTestDuration("words", 50)}
          >
            50
          </li>
          <li
            className={`cursor-pointer ${testDuration.type === "words" && testDuration.value === 100 ? "text-cyan-2" : ""}`}
            onClick={() => handleTestDuration("words", 100)}
          >
            100
          </li>
        </ul>
      </div>
      <div className="bg-background rounded-5 h-8 w-1"></div>
      <div className="flex gap-2">
        <h3>Time(s):</h3>
        <ul className="text-grey-2 flex gap-2">
          <li
            className={`cursor-pointer ${testDuration.type === "time" && testDuration.value === 15 ? "text-cyan-2" : ""}`}
            onClick={() => handleTestDuration("time", 15)}
          >
            15
          </li>
          <li
            className={`cursor-pointer ${testDuration.type === "time" && testDuration.value === 30 ? "text-cyan-2" : ""}`}
            onClick={() => handleTestDuration("time", 30)}
          >
            30
          </li>
          <li
            className={`cursor-pointer ${testDuration.type === "time" && testDuration.value === 60 ? "text-cyan-2" : ""}`}
            onClick={() => handleTestDuration("time", 60)}
          >
            60
          </li>
          <li
            className={`cursor-pointer ${testDuration.type === "time" && testDuration.value === 120 ? "text-cyan-2" : ""}`}
            onClick={() => handleTestDuration("time", 120)}
          >
            120
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TestDuration;
