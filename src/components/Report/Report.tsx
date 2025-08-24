import { TestStats } from "@/modules/types";
import { useTestDataStore } from "@/store";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import React from "react";
import { LineChart } from "../Graph";

type ReportProps = {
  testStat: TestStats;
  onRestart: () => void;
};

const Report = ({ testStat, onRestart }: ReportProps) => {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex gap-8">
          <div className="flex flex-col gap-4 self-center">
            <div className="flex flex-col items-center">
              <p>WPM</p>
              <p>{testStat.meanWpm}</p>
            </div>
            <div className="flex flex-col items-center">
              <p>Acc</p>
              <p>{testStat.accuracy}%</p>
            </div>
          </div>
          <LineChart testStat={testStat.statsPerSecond} />
        </div>
        <div className="flex gap-16">
          <div className="flex flex-col items-center">
            <p>Test Type</p>
            <p>
              {testStat.testType === "time"
                ? `Time - ${testStat.testTypeValue} sec`
                : `Words - ${testStat.testTypeValue} words`}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <p>Raw</p>
            <p>{testStat.meanRawWpm}</p>
          </div>
          <div className="flex flex-col items-center">
            <p>Characters</p>
            <p>{`${testStat.correctChars}/${testStat.incorrectChars}/${testStat.extraChars}`}</p>
          </div>
          <div className="flex flex-col items-center">
            <p>Time</p>
            <p>{testStat.testTime}s</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="cursor-pointer rounded-full p-2" onClick={onRestart}>
          <ArrowPathIcon className="text-cyan-1 h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default Report;
