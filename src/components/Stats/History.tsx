import React from "react";

import {
  OVERALL_STATS_FIRST_ROW,
  OVERALL_STATS_SECOND_ROW_1,
  OVERALL_STATS_SECOND_ROW_2,
  OVERALL_STATS_THIRD_ROW,
  TEST_HISTORY_HEADER,
} from "@/modules/constants";
import { OverAllStats, PersonalBest, TestStats } from "@/modules/types";
import { useUserStore } from "@/store";

import { Table } from "../Table";
import HistoryRow from "./HistoryRow";

type Props = {
  data: TestStats[];
  overAllStats: OverAllStats;
};

function renderPersonalBestWpm(
  key: keyof OverAllStats,
  overallStats: OverAllStats,
): React.ReactNode {
  const val = overallStats[key];
  if (val && typeof val === "object") {
    const pb = val as PersonalBest;
    return pb.wpm;
  }

  return "-";
}

function renderAverageStats(
  key: keyof OverAllStats,
  overallStats: OverAllStats,
  personalBestKey?: keyof PersonalBest,
) {
  const val = overallStats[key];
  if (val === null) return "-";
  if (typeof val === "number" || typeof val === "string") return val.toString();
  if (typeof val === "object") {
    const pb = val as PersonalBest;
    const stat = pb[personalBestKey as keyof PersonalBest];
    if (stat !== undefined) return stat.toString();
  }
  return "-";
}

const History = ({ data, overAllStats }: Props) => {
  const firstName = useUserStore((state) => state.firstName);
  return (
    <div className="mx-auto mt-28 flex w-full flex-col items-center gap-8 p-4 text-white">
      <div className="flex w-full gap-8">
        <div className="bg-dark-1 text-grey-1 flex rounded-lg px-12 py-4">
          <div>
            <p className="text-3xl">Hello</p>
            <p className="text-5xl">{firstName}</p>
          </div>
        </div>
        <div className="bg-dark-1 text-grey-1 flex w-full items-center justify-around rounded-lg p-4">
          {OVERALL_STATS_FIRST_ROW.map((stat) => {
            const val = overAllStats[stat.key];
            let displayVal = "";
            if (val === null) displayVal = "-";
            else if (typeof val === "number" || typeof val === "string")
              displayVal = val.toString();
            return (
              <div key={stat.key} className="overall-stats-container">
                <p className="overall-stats-label">{stat.label}</p>
                <p className="overall-stats-value">{displayVal}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex w-full gap-8">
        <div className="bg-dark-1 text-grey-1 flex w-full items-center justify-around rounded-lg p-4">
          {OVERALL_STATS_SECOND_ROW_1.map((stat) => (
            <div key={stat.key} className="overall-stats-container">
              <p className="overall-stats-label">{stat.label}</p>
              <p className="overall-stats-value">
                {renderPersonalBestWpm(stat.key, overAllStats)}
              </p>
            </div>
          ))}
        </div>
        <div className="bg-dark-1 text-grey-1 flex w-full items-center justify-around rounded-lg p-4">
          {OVERALL_STATS_SECOND_ROW_2.map((stat) => (
            <div key={stat.key} className="overall-stats-container">
              <p className="overall-stats-label">{stat.label}</p>
              <p className="overall-stats-value">
                {renderPersonalBestWpm(stat.key, overAllStats)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-dark-1 text-grey-1 grid w-full grid-cols-3 gap-8 rounded-lg p-4">
        {OVERALL_STATS_THIRD_ROW.map((stat) => (
          <div key={stat.key} className="overall-stats-container">
            <p className="overall-stats-label">{stat.label}</p>
            <p className="overall-stats-value">
              {renderAverageStats(stat.key, overAllStats, stat.personalBest)}
            </p>
          </div>
        ))}
      </div>
      {overAllStats.overallCharacterStats &&
        Object.keys(overAllStats.overallCharacterStats).length > 0 && (
          <section className="w-full">
            <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto">
              {Object.entries(overAllStats.overallCharacterStats)
                .sort(
                  (a, b) =>
                    b[1].incorrect - a[1].incorrect ||
                    b[1].correct - a[1].correct,
                )
                .map(([char, stats]) => {
                  return (
                    <div
                      key={char}
                      className="bg-dark-1 flex w-24 flex-none flex-col items-center justify-center gap-2 rounded-xl border border-white/5 p-4 transition-all duration-300 hover:border-white/20"
                    >
                      <span className="font-mono text-3xl font-semibold text-white">
                        {char === " " ? "␣" : char}
                      </span>
                      <div className="font-mono text-sm font-medium">
                        <span className="text-red-400">{stats.incorrect}</span>
                        <span className="text-grey-5 mx-1">/</span>
                        <span className="text-green-400">{stats.correct}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      <Table<TestStats>
        headers={TEST_HISTORY_HEADER}
        data={data}
        renderRow={HistoryRow}
      />
    </div>
  );
};

export default History;
