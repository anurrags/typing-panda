export type TestType = "words" | "time";
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
  testDate: Date;
  statsPerSecond: StatsPerSecond[];
};

export type StatsPerSecond = {
  second: number;
  wpm: number;
  rawWpm: number;
  errorRate: number;
  accuracy: number;
};
