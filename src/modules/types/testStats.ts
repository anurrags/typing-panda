export type TestStats = {
  testId: string;
  meanWpm: number;
  meanRawWpm: number;
  accuracy: number;
  testTime: number;
  charsTyped: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number; //not used in current version
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
