import { OverAllStats, PersonalBest, TestStats } from "../types";

export const getOverallStats = (tests: TestStats[]): OverAllStats => {
  const totalTests = tests.length;

  if (totalTests === 0) {
    const emptyStats: OverAllStats = {
      totalTests: 0,
      averageWpm: 0,
      averageRawWpm: 0,
      averageAccuracy: 0,
      averageWpmLast10: 0,
      averageRawWpmLast10: 0,
      averageAccuracyLast10: 0,
      totalTypingTime: "00:00:00",
      totalWordsTyped: 0,
      "15secBest": null,
      "30secBest": null,
      "60secBest": null,
      "25wordsBest": null,
      "50wordsBest": null,
      "100wordsBest": null,
      highestWpm: null,
      highestRawWpm: null,
      highestAccuracy: null,
      overallCharacterStats: {},
    };
    return emptyStats;
  }

  function toPersonalBest(test: TestStats): PersonalBest {
    return {
      wpm: test.meanWpm,
      rawWpm: test.meanRawWpm,
      accuracy: test.accuracy,
      date: test.created_at,
    };
  }

  let sumWpm = 0;
  let sumRawWpm = 0;
  let sumAccuracy = 0;
  let sumTypingTime = 0;
  let sumCharsTyped = 0;

  let highestWpm: PersonalBest | null = null;
  let highestRawWpm: PersonalBest | null = null;
  let highestAccuracy: PersonalBest | null = null;

  let fifteenSecBest: PersonalBest | null = null;
  let thirtySecBest: PersonalBest | null = null;
  let sixtySecBest: PersonalBest | null = null;

  let twentyFiveWordsBest: PersonalBest | null = null;
  let fiftyWordsBest: PersonalBest | null = null;
  let hundredWordsBest: PersonalBest | null = null;

  const overallCharacterStats: Record<
    string,
    { correct: number; incorrect: number }
  > = {};

  for (const test of tests) {
    sumWpm += test.meanWpm;
    sumRawWpm += test.meanRawWpm;
    sumAccuracy += test.accuracy;
    sumTypingTime += test.testTime;
    sumCharsTyped += test.charsTyped;

    const personalBest = toPersonalBest(test);

    highestWpm = calculatePersonalBest(highestWpm, personalBest, "wpm");
    highestRawWpm = calculatePersonalBest(
      highestRawWpm,
      personalBest,
      "rawWpm",
    );
    highestAccuracy = calculatePersonalBest(
      highestAccuracy,
      personalBest,
      "accuracy",
    );

    if (test.testType === "time" && test.testTypeValue === 15) {
      fifteenSecBest = calculatePersonalBest(
        fifteenSecBest,
        personalBest,
        "wpm",
      );
    }
    if (test.testType === "time" && test.testTypeValue === 30) {
      thirtySecBest = calculatePersonalBest(thirtySecBest, personalBest, "wpm");
    }
    if (test.testType === "time" && test.testTypeValue === 60) {
      sixtySecBest = calculatePersonalBest(sixtySecBest, personalBest, "wpm");
    }

    if (test.testType === "words" && test.testTypeValue === 25) {
      twentyFiveWordsBest = calculatePersonalBest(
        twentyFiveWordsBest,
        personalBest,
        "wpm",
      );
    }
    if (test.testType === "words" && test.testTypeValue === 50) {
      fiftyWordsBest = calculatePersonalBest(
        fiftyWordsBest,
        personalBest,
        "wpm",
      );
    }
    if (test.testType === "words" && test.testTypeValue === 100) {
      hundredWordsBest = calculatePersonalBest(
        hundredWordsBest,
        personalBest,
        "wpm",
      );
    }

    if (test.characterStats) {
      for (const [char, stats] of Object.entries(test.characterStats)) {
        if (!overallCharacterStats[char]) {
          overallCharacterStats[char] = { correct: 0, incorrect: 0 };
        }
        overallCharacterStats[char].correct += stats.correct;
        overallCharacterStats[char].incorrect += stats.incorrect;
      }
    }
  }

  const averageWpm = Math.round(sumWpm / totalTests);
  const averageRawWpm = Math.round(sumRawWpm / totalTests);
  const averageAccuracy = Math.round(sumAccuracy / totalTests);

  const last10Tests = tests.slice(-10);

  const avgLast10Wpm =
    last10Tests.reduce((acc, val) => acc + val.meanWpm, 0) /
      last10Tests.length || 0;
  const avgLast10RawWpm =
    last10Tests.reduce((acc, val) => acc + val.meanRawWpm, 0) /
      last10Tests.length || 0;
  const avgLast10Accuracy =
    last10Tests.reduce((acc, val) => acc + val.accuracy, 0) /
      last10Tests.length || 0;

  return {
    totalTests,
    averageWpm,
    averageRawWpm,
    averageAccuracy,
    averageWpmLast10: Math.round(avgLast10Wpm),
    averageRawWpmLast10: Math.round(avgLast10RawWpm),
    averageAccuracyLast10: Math.round(avgLast10Accuracy),
    totalTypingTime: formatSecondsToHMS(sumTypingTime),
    totalWordsTyped: Math.round(sumCharsTyped / 5),
    "15secBest": fifteenSecBest,
    "30secBest": thirtySecBest,
    "60secBest": sixtySecBest,
    "25wordsBest": twentyFiveWordsBest,
    "50wordsBest": fiftyWordsBest,
    "100wordsBest": hundredWordsBest,
    highestWpm,
    highestRawWpm,
    highestAccuracy,
    overallCharacterStats,
  };
};

function calculatePersonalBest(
  existingBest: PersonalBest | null,
  candidate: PersonalBest,
  compareBy: "wpm" | "accuracy" | "rawWpm",
): PersonalBest {
  if (!existingBest) return candidate;

  if (candidate[compareBy] > existingBest[compareBy]) {
    return candidate;
  }

  return existingBest;
}

function formatSecondsToHMS(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}
