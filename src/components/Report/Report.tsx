"use client";

import React, { useEffect, useRef } from "react";
import { TestStats } from "@/modules/types";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { LineChart } from "../Graph";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/modules/hooks";
import Link from "next/link";

type ReportProps = {
  testStat: TestStats;
  onRestart: () => void;
};

const Report = ({ testStat, onRestart }: ReportProps) => {
  const hasInserted = useRef(false);
  const auth = useAuth();

  useEffect(() => {
    const insertTestData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return;
      }
      if (testStat.meanWpm === 0) {
        return;
      }

      const { error } = await supabase.from("testData").insert([
        {
          user_id: user.id,
          testId: testStat.testId,
          testType: testStat.testType,
          testTypeValue: testStat.testTypeValue,
          meanWpm: testStat.meanWpm,
          meanRawWpm: testStat.meanRawWpm,
          accuracy: testStat.accuracy,
          testTime: testStat.testTime,
          charsTyped: testStat.charsTyped,
          correctChars: testStat.correctChars,
          incorrectChars: testStat.incorrectChars,
          extraChars: testStat.extraChars,
          statsPerSecond: testStat.statsPerSecond,
        },
      ]);

      if (error) {
        console.error("Insert error:", error);
      } else {
        console.log("Insert success");
      }
    };

    if (!hasInserted.current) {
      hasInserted.current = true;
      insertTestData();
    }
  }, [testStat]);

  return (
    <div className="flex flex-col items-center gap-8 select-none">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex gap-8">
          <div className="flex flex-col gap-4 self-center">
            <div className="flex flex-col items-center">
              <p className="test-report-label">wpm</p>
              <p className="test-report-value">{testStat.meanWpm}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="test-report-label">acc</p>
              <p className="test-report-value">{testStat.accuracy}%</p>
            </div>
          </div>
          <div tabIndex={-1}>
            <LineChart testStat={testStat.statsPerSecond} />
          </div>
        </div>
        <div className="flex justify-center gap-16">
          <div className="flex flex-col items-center">
            <p className="test-report-label">raw</p>
            <p className="test-report-value">{testStat.meanRawWpm}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="test-report-label">characters</p>
            <div className="test-report-value">
              <span className="text-green-400">{testStat.correctChars}</span>/
              <span className="text-red-400">{testStat.incorrectChars}</span>/
              <span className="text-grey-3">{testStat.extraChars}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <p className="test-report-label">time</p>
            <p className="test-report-value">{testStat.testTime}s</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="test-report-label">type</p>
            <p className="test-report-value">
              {testStat.testType === "time"
                ? `${testStat.testTypeValue} sec`
                : `${testStat.testTypeValue} words`}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          tabIndex={0}
          className="cursor-pointer rounded-full p-2"
          onClick={onRestart}
        >
          <ArrowPathIcon className="text-grey-1 h-8 w-8" />
        </button>
      </div>
      {!auth && (
        <div>
          <p className="text-grey-5 text-xl">
            <Link className="underline" href={"/auth"}>
              Log in
            </Link>{" "}
            to save your progress
          </p>
        </div>
      )}
    </div>
  );
};

export default Report;
