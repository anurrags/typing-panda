export type TestType = "words" | "time";
export type CharacterStats = {
  [key: string]: {
    correct: number;
    incorrect: number;
  };
};

export type TestStats = {
  testId: string;
  testType: TestType;
  testTypeValue: number;
  meanWpm: number;
  meanRawWpm: number;
  accuracy: number;
  testTime: number;
  charsTyped: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  statsPerSecond: StatsPerSecond[];
  characterStats?: CharacterStats;
  created_at: string;
};

export type StatsPerSecond = {
  second: number;
  wpm: number;
  rawWpm: number;
  errorRate: number;
  accuracy: number;
};

export type OverAllStats = {
  totalTests: number;
  averageWpm: number;
  averageRawWpm: number;
  averageAccuracy: number;
  averageWpmLast10: number;
  averageRawWpmLast10: number;
  averageAccuracyLast10: number;
  totalTypingTime: string;
  totalWordsTyped: number;
  "15secBest": PersonalBest | null;
  "30secBest": PersonalBest | null;
  "60secBest": PersonalBest | null;
  "25wordsBest": PersonalBest | null;
  "50wordsBest": PersonalBest | null;
  "100wordsBest": PersonalBest | null;
  highestWpm: PersonalBest | null;
  highestRawWpm: PersonalBest | null;
  highestAccuracy: PersonalBest | null;
  overallCharacterStats: CharacterStats;
};

export type PersonalBest = {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  date: string;
};
