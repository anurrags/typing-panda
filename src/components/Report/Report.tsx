"use client";

import { ArrowPathIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/modules/hooks";
import { AntiCheatPayload, TestStats } from "@/modules/types";

import { LineChart } from "../Graph";

type ReportProps = {
  testStat: TestStats;
  antiCheatPayload?: AntiCheatPayload;
  onRestart: () => void;
};

const Report = ({ testStat, antiCheatPayload, onRestart }: ReportProps) => {
  const hasInserted = useRef(false);
  const auth = useAuth();
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "success" | "rejected" | "error"
  >("idle");
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  // Determine if the test was flagged by frontend anti-cheat
  const isInvalidated = antiCheatPayload?.flags?.isInvalidated ?? false;
  const invalidationReason =
    antiCheatPayload?.flags?.invalidationReason ?? null;

  useEffect(() => {
    const submitTestData = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        return;
      }
      if (testStat.meanWpm === 0) {
        return;
      }

      // ─── Frontend-invalidated tests are never submitted ────────────
      if (isInvalidated) {
        console.warn(
          "[AntiCheat] Test invalidated on frontend — not submitting:",
          invalidationReason,
        );
        setSubmitStatus("rejected");
        setRejectReason(invalidationReason);
        return;
      }

      setSubmitStatus("submitting");

      try {
        const response = await fetch("/api/submit-test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            testStats: {
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
              characterStats: testStat.characterStats,
            },
            antiCheat: antiCheatPayload
              ? {
                  token: antiCheatPayload.token,
                  keystrokeHash: antiCheatPayload.keystrokeHash,
                  generatedAt: antiCheatPayload.generatedAt,
                  flags: antiCheatPayload.flags,
                  timingAnalysis: antiCheatPayload.timingAnalysis,
                  keystrokeLog: antiCheatPayload.keystrokeLog,
                }
              : null,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setSubmitStatus("success");
          console.log(
            "[AntiCheat] Test saved successfully:",
            result.validation,
          );
        } else if (response.status === 403) {
          setSubmitStatus("rejected");
          setRejectReason(result.error || "Test rejected by anti-cheat.");
          console.warn(
            "[AntiCheat] Test rejected by server:",
            result.validation,
          );
        } else {
          setSubmitStatus("error");
          console.error("Submit error:", result.error);
        }
      } catch (err) {
        setSubmitStatus("error");
        console.error("Network error submitting test:", err);
      }
    };

    if (!hasInserted.current) {
      hasInserted.current = true;
      submitTestData();
    }
  }, [testStat, antiCheatPayload, isInvalidated, invalidationReason]);

  return (
    <div className="flex flex-col items-center gap-8 select-none">
      {/* Anti-cheat invalidation warning (frontend or backend) */}
      {(isInvalidated || submitStatus === "rejected") && (
        <div className="flex max-w-lg items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Test Invalidated</span>
            <span className="text-xs text-red-400/80">
              {invalidationReason || rejectReason} This result will not be
              saved.
            </span>
          </div>
        </div>
      )}

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
