import { OverAllStats, PersonalBest } from "../types";

export const TEST_HISTORY_HEADER = [
  "WPM",
  "Accuracy",
  "Characters",
  "Type",
  "Date",
];

type OverAllStatsKey = keyof OverAllStats;
type PersonalBestKey = keyof PersonalBest;

export const OVERALL_STATS_FIRST_ROW: {
  label: string;
  key: OverAllStatsKey;
}[] = [
  { label: "Total Tests", key: "totalTests" },
  { label: "Time Typing", key: "totalTypingTime" },
  { label: "Words Typed", key: "totalWordsTyped" },
];

export const OVERALL_STATS_SECOND_ROW_1: {
  label: string;
  key: OverAllStatsKey;
}[] = [
  { label: "15 seconds", key: "15secBest" },
  { label: "30 seconds", key: "30secBest" },
  { label: "60 seconds", key: "60secBest" },
];

export const OVERALL_STATS_SECOND_ROW_2: {
  label: string;
  key: OverAllStatsKey;
}[] = [
  { label: "25 words", key: "25wordsBest" },
  { label: "50 words", key: "50wordsBest" },
  { label: "100 words", key: "100wordsBest" },
];

export const OVERALL_STATS_THIRD_ROW: {
  label: string;
  key: OverAllStatsKey;
  personalBest?: PersonalBestKey;
}[] = [
  { label: "Average WPM", key: "averageWpm" },
  { label: "Average Accuracy", key: "averageAccuracy" },
  { label: "Average Raw WPM", key: "averageRawWpm" },
  { label: "Average WPM (Last 10)", key: "averageWpmLast10" },
  { label: "Average Accuracy (Last 10)", key: "averageAccuracyLast10" },
  { label: "Average Raw WPM (Last 10)", key: "averageRawWpmLast10" },
  { label: "Best WPM", key: "highestWpm", personalBest: "wpm" },
  { label: "Best Accuracy", key: "highestAccuracy", personalBest: "accuracy" },
  { label: "Best Raw WPM", key: "highestRawWpm", personalBest: "rawWpm" },
];
