import { KeyPressData, StatsPerSecond, TestStats } from "@/modules/types";

export class TestAnalyzer {
  private keyPresses: KeyPressData[] = [];
  private keyDownMap: Map<string, number> = new Map();
  private statsPerSecond: StatsPerSecond[] = [];
  private lastSecondSnapshot = {
    charIndex: -1,
    wordIndex: 0,
  };

  // Called on 'keydown'
  public recordKeyDown(key: string, timestamp: number): void {
    if (!this.keyDownMap.has(key)) {
      this.keyDownMap.set(key, timestamp);
    }
  }

  // Called on 'keyup'
  public recordKeyUp(key: string, timestamp: number): void {
    if (this.keyDownMap.has(key)) {
      const startTime = this.keyDownMap.get(key)!;
      const duration = timestamp - startTime;
      this.keyPresses.push({ key, timestamp: startTime, duration });
      this.keyDownMap.delete(key);
    }
  }

  /**
   * Calculates and stores statistics for the current second of the test.
   * @param {number} currentTime - The current time in seconds.
   * @param {string[]} userInput - The user's current input array.
   * @param {string[]} wordsArray - The array of correct words.
   */
  public calculateStatsForSecond(
    currentTime: number,
    userInput: string[],
    wordsArray: string[],
  ): void {
    const currentWordIndex = userInput.length - 1;
    const currentCharIndex = userInput[currentWordIndex]
      ? userInput[currentWordIndex].length - 1
      : -1;

    const prevWordIndex = this.lastSecondSnapshot.wordIndex;
    const prevCharIndex = this.lastSecondSnapshot.charIndex;

    const wordsInSecond = userInput.slice(prevWordIndex, currentWordIndex + 1);
    const correctWordsInSecond = wordsArray.slice(
      prevWordIndex,
      currentWordIndex + 1,
    );

    let correctChars = 0;
    let typedChars = 0;

    for (let i = 0; i < wordsInSecond.length; i++) {
      const startChar = i === 0 ? prevCharIndex + 1 : 0;
      for (let j = startChar; j < wordsInSecond[i].length; j++) {
        if (wordsInSecond[i][j] === correctWordsInSecond[i]?.[j]) {
          correctChars++;
        }
        typedChars++;
      }
    }

    const spaces = wordsInSecond.length > 0 ? wordsInSecond.length - 1 : 0;
    const wpm = ((correctChars + spaces) / 5) * 60;
    const rawWpm = ((typedChars + spaces) / 5) * 60;
    const accuracy = typedChars > 0 ? (correctChars / typedChars) * 100 : 0;

    this.statsPerSecond.push({
      wpm: Math.round(wpm),
      rawWpm: Math.round(rawWpm),
      accuracy: Math.round(accuracy),
      errorRate: typedChars - correctChars,
      second: currentTime,
    });

    this.lastSecondSnapshot = {
      wordIndex: currentWordIndex,
      charIndex: currentCharIndex,
    };
  }

  /**
   * Calculates the final, comprehensive statistics for the entire test.
   * @param {TestStats} initialStats - The initial stats object from the component.
   * @param {string[]} userInput - The final user input.
   * @param {string[]} wordsArray - The array of correct words.
   * @param {number} totalTime - The total time of the test in seconds.
   * @returns {TestStats} The complete and final test statistics.
   */
  public calculateFinalStats(
    initialStats: TestStats,
    userInput: string[],
    wordsArray: string[],
    totalTime: number,
  ): TestStats {
    let correctChars = 0,
      incorrectChars = 0,
      extraChars = 0,
      charsTyped = 0;

    for (let i = 0; i < userInput.length; i++) {
      for (let j = 0; j < userInput[i].length; j++) {
        if (j >= wordsArray[i]?.length) {
          extraChars++;
        } else if (userInput[i][j] === wordsArray[i][j]) {
          correctChars++;
        } else {
          incorrectChars++;
        }
        charsTyped++;
      }
    }

    const spaces = userInput.length - 1;
    const timeInMinutes = totalTime / 60;
    const meanWpm =
      timeInMinutes > 0
        ? Math.round((correctChars + spaces) / 5 / timeInMinutes)
        : 0;
    const meanRawWpm =
      timeInMinutes > 0
        ? Math.round((charsTyped + spaces) / 5 / timeInMinutes)
        : 0;
    const accuracy =
      charsTyped > 0
        ? Math.round(((correctChars + spaces) / (charsTyped + spaces)) * 100)
        : 0;

    return {
      ...initialStats,
      meanWpm,
      meanRawWpm,
      accuracy,
      testTime: totalTime,
      charsTyped,
      correctChars,
      incorrectChars,
      extraChars,
      statsPerSecond: this.statsPerSecond,
      keyPresses: this.keyPresses,
      delays: this.keyPresses
        .map((p, i, arr) => (i > 0 ? p.timestamp - arr[i - 1].timestamp : 0))
        .slice(1),
    };
  }

  public currentStats(time: number, userInput: string[], wordsArray: string[]) {
    let correctChars = 0;
    let charsTyped = 0;
    for (let i = 0; i < userInput.length; i++) {
      for (let j = 0; j < userInput[i].length; j++) {
        if (userInput[i].charAt(j) === wordsArray[i].charAt(j)) {
          correctChars++;
        }
        charsTyped++;
      }
    }

    const spacesTyped = userInput.length;

    const wordsTyped = (correctChars + spacesTyped) / 5;
    const timeInMinutes = time / 60;

    const wpm =
      timeInMinutes === 0 ? 0 : Math.round(wordsTyped / timeInMinutes);
    const accuracy =
      charsTyped === 0
        ? 0
        : Math.round(
            ((correctChars + spacesTyped) / (charsTyped + spacesTyped)) * 100,
          );

    return { wpm, accuracy };
  }

  public reset(): void {
    this.keyPresses = [];
    this.keyDownMap.clear();
    this.statsPerSecond = [];
    this.lastSecondSnapshot = { charIndex: -1, wordIndex: 0 };
  }
}
