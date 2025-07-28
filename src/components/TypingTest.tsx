"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getWordsArray } from "../modules/util";
import { BlurOverlay, Carat, CharacterRenderer } from "./";
import { TestStats } from "@/modules/types";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { useTestDataStore, useTestDurationStore } from "@/store";

interface TestState {
  wordsArray: string[];
  userInput: string;
}

const TypingTest: React.FC = () => {
  const { testDuration, setTestDuration } = useTestDurationStore();
  const { testStarted, testEnded, setTestStarted, setTestEnded } =
    useTestDataStore();
  const [time, setTime] = useState(0);
  const [countdown, setCountdown] = useState(testDuration.value);
  const [testState, setTestState] = useState<TestState>({
    wordsArray: [],
    userInput: "",
  });
  const [isFocused, setIsFocused] = useState(true);
  const [testStats, setTestStats] = useState<TestStats>({
    testId: "",
    meanWpm: 0,
    meanRawWpm: 0,
    accuracy: 0,
    testTime: 0,
    charsTyped: 0,
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    testDate: new Date(),
    statsPerSecond: [],
  });

  const typingContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevInputLengthRef = useRef(0);

  const paragraph = testState.wordsArray.join(" ");

  const currentIndex = testState.userInput.length;

  useEffect(() => {
    setTestState((prev) => ({
      ...prev,
      wordsArray: getWordsArray(
        testDuration.type === "words" ? testDuration.value : undefined,
      ),
    }));
  }, [testDuration]);

  useEffect(() => {
    if (
      testStarted &&
      testState.userInput.split(" ").length > testState.wordsArray.length &&
      !testEnded
    ) {
      console.log(testState.userInput.split(" "));
      setTestEnded(true);
    }
  }, [testState, testStarted]);

  useEffect(() => {
    if (testDuration.type === "time" && !testEnded) {
      setCountdown(testDuration.value);
    }
  }, [testDuration, testEnded]);

  // Memoized statistics calculation
  const currentStats = useMemo(() => {
    if (time === 0) {
      return { wpm: 0, rawWpm: 0, accuracy: 0 };
    }

    const correctChars = testState.userInput
      .split("")
      .filter((char, index) => char === paragraph[index]).length;

    const spacesTyped = testState.userInput
      .split("")
      .filter((char) => char === " ").length;

    const charsTyped = testState.userInput.length - spacesTyped;
    const correctCharsExcludingSpaces = correctChars - spacesTyped;
    const wordsTyped = correctCharsExcludingSpaces / 5;
    const rawWordsTyped = charsTyped / 5;
    const timeInMinutes = time / 60;

    const wpm =
      timeInMinutes === 0 ? 0 : Math.round(wordsTyped / timeInMinutes);
    const rawWpm =
      timeInMinutes === 0 ? 0 : Math.round(rawWordsTyped / timeInMinutes);
    const accuracy =
      testState.userInput.length === 0
        ? 0
        : Math.round((correctChars / testState.userInput.length) * 100);

    return { wpm, rawWpm, accuracy };
  }, [time, testStarted]);

  // Timer management
  useEffect(() => {
    if (testStarted && !testEnded) {
      if (testDuration.type === "time") {
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      }

      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          if (testDuration.type === "time" && newTime >= testDuration.value) {
            setTestEnded(true);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [testStarted, testEnded, testDuration]);

  // Update per second stats when time changes
  useEffect(() => {
    if (!testStarted && !testEnded) {
      prevInputLengthRef.current = 0;
      return;
    }

    const currentInputLength = testState.userInput.length;
    const prevInputLength = prevInputLengthRef.current;

    // Characters typed in last second interval
    const newCharsTyped = currentInputLength - prevInputLength;

    if (newCharsTyped <= 0) {
      // No new input this second (maybe backspace)
      // Still update prevInputLength so this doesn't cause stale data
      prevInputLengthRef.current = currentInputLength;
      return;
    }

    const newlyTypedChars = testState.userInput.slice(
      prevInputLength,
      currentInputLength,
    );

    const paragraphSlice = paragraph.slice(prevInputLength, currentInputLength);

    // Calculate correct chars in last second
    let correctCharsLastSecond = 0;
    let spacesTypedLastSecond = 0;

    for (let i = 0; i < newlyTypedChars.length; i++) {
      if (newlyTypedChars[i] === paragraphSlice[i]) {
        correctCharsLastSecond++;
      }
      if (newlyTypedChars[i] === " ") {
        spacesTypedLastSecond++;
      }
    }

    const charsTypedLastSecond = newlyTypedChars.length - spacesTypedLastSecond;
    const correctCharsExcludingSpacesLastSecond =
      correctCharsLastSecond - spacesTypedLastSecond;

    const wordsTypedLastSecond =
      (correctCharsExcludingSpacesLastSecond > 0
        ? correctCharsExcludingSpacesLastSecond
        : 0) / 5;
    const rawWordsTypedLastSecond =
      (charsTypedLastSecond > 0 ? charsTypedLastSecond : 0) / 5;

    const wpmLastSecond = Math.round(wordsTypedLastSecond * 60);
    const rawWpmLastSecond = Math.round(rawWordsTypedLastSecond * 60);

    const accuracyLastSecond =
      newlyTypedChars.length === 0
        ? 0
        : Math.round((correctCharsLastSecond / newlyTypedChars.length) * 100);

    const errorRateLastSecond =
      newlyTypedChars.length === 0
        ? 0
        : newlyTypedChars.length - correctCharsLastSecond;

    const newStatsPerSecond = {
      wpm: wpmLastSecond,
      rawWpm: rawWpmLastSecond,
      errorRate: errorRateLastSecond,
      accuracy: accuracyLastSecond,
      second: time,
    };

    setTestStats((prev) => ({
      ...prev,
      statsPerSecond: [...prev.statsPerSecond, newStatsPerSecond],
    }));

    // Update the ref for next interval
    prevInputLengthRef.current = currentInputLength;
  }, [time]);

  // Final stats calculation on test end
  useEffect(() => {
    if (testEnded) {
      const userInput = testState.userInput;
      const correctChars = userInput
        .split("")
        .filter((char, index) => char === paragraph[index]).length;

      const charsTyped = userInput.length;
      const spacesTyped = userInput.split("").filter((c) => c === " ").length;
      const correctCharsExcludingSpaces = correctChars - spacesTyped;
      const wordsTyped = correctCharsExcludingSpaces / 5;
      const rawWordsTyped = charsTyped / 5;
      const timeInMinutes = time / 60;

      const wpm =
        timeInMinutes === 0 ? 0 : Math.round(wordsTyped / timeInMinutes);
      const rawWpm =
        timeInMinutes === 0 ? 0 : Math.round(rawWordsTyped / timeInMinutes);
      const accuracy =
        charsTyped === 0 ? 0 : Math.round((correctChars / charsTyped) * 100);

      setTestStats((prev) => ({
        ...prev,
        meanWpm: wpm,
        meanRawWpm: rawWpm,
        accuracy: accuracy,
        testTime: time,
        charsTyped: testState.userInput.length,
        correctChars: correctChars,
        incorrectChars: testState.userInput.length - correctChars,
        extraChars: Math.max(0, testState.userInput.length - paragraph.length),
        testDate: new Date(),
      }));
      setTestStarted(false);
      console.log(testStats);
    }
  }, [testEnded]);

  const scrollToCaretIfNeeded = useCallback(() => {
    const container = typingContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      const caret = container.querySelector("#caret") as HTMLSpanElement | null;
      if (caret) {
        caret.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "start",
        });
      }
    });
  }, []);

  useEffect(() => {
    scrollToCaretIfNeeded();
  }, [currentIndex, scrollToCaretIfNeeded]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || testEnded || e.key === "Tab")
        return;

      e.preventDefault();

      if (e.key.length === 1) {
        setTestState((prev) => {
          const newInput = prev.userInput + e.key;
          const newState = { ...prev, userInput: newInput };
          return newState;
        });
        if (!testStarted) {
          setTestStarted(true);
          setTestStats((prev) => ({
            ...prev,
            testId: crypto.randomUUID(),
            testDate: new Date(),
          }));
        }
      } else if (e.key === "Backspace") {
        setTestState((prev) => ({
          ...prev,
          userInput: prev.userInput.slice(0, -1),
        }));
      }
    },
    [testEnded, setTestStarted, testStarted],
  );

  useEffect(() => {
    const typingContainer = typingContainerRef.current;
    const handleFocus = () => {
      setIsFocused(true);
    };
    const handleBlur = () => {
      if (testEnded) return;
      setIsFocused(false);
    };
    if (typingContainer) {
      typingContainer.focus();
      typingContainer.addEventListener("keydown", handleKeyPress);
      typingContainer.addEventListener("focus", handleFocus);
      typingContainer.addEventListener("blur", handleBlur);
    }
    return () => {
      if (typingContainer) {
        typingContainer.removeEventListener("keydown", handleKeyPress);
        typingContainer.removeEventListener("focus", handleFocus);
        typingContainer.removeEventListener("blur", handleBlur);
      }
    };
  }, [handleKeyPress, testEnded]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const typingContainer = typingContainerRef.current;

      if (document.activeElement === typingContainer) {
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" &&
        (e.key === "Enter" || e.key === "Tab")
      ) {
        return;
      }
      typingContainer?.focus();
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleKeyPress]);

  const restartTest = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsFocused(true);
    setTestStarted(false);
    setTestEnded(false);
    setTime(0);
    console.log("testDuration", testDuration);
    setTestState({
      userInput: "",
      wordsArray: getWordsArray(
        testDuration.type === "words" ? testDuration.value : undefined,
      ),
    });

    setTestStats({
      testId: "",
      meanWpm: 0,
      meanRawWpm: 0,
      accuracy: 0,
      testTime: 0,
      charsTyped: 0,
      correctChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      testDate: new Date(),
      statsPerSecond: [],
    });
    typingContainerRef.current?.focus();
    prevInputLengthRef.current = 0;
  }, [setTestStarted, setTestEnded, testDuration]);

  return (
    <div className={`flex flex-col items-center justify-center gap-8`}>
      <div className="flex items-center gap-16 text-4xl">
        <div className="flex items-center gap-2">
          <span className="text-cyan-1">{currentStats.wpm}</span>
          <span className="text-grey-2">WPM</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-1">{currentStats.accuracy}</span>
          <span>%</span>
          <span className="text-grey-2">Acc</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-1">
            {testDuration.type === "time" ? countdown : time}
          </span>
          <span className="text-grey-2">s</span>
        </div>
      </div>
      <div className="relative h-36 w-full">
        <div
          ref={typingContainerRef}
          tabIndex={0}
          className="text-grey-2 absolute inset-0 flex flex-wrap overflow-y-hidden font-mono leading-relaxed whitespace-pre-wrap select-none focus:outline-none"
        >
          {testState.wordsArray.map((word, wordIndex) => {
            let globalIndex = 0;
            // Calculate global index for this word
            for (let i = 0; i < wordIndex; i++) {
              globalIndex +=
                testState.wordsArray[i].length +
                (i < testState.wordsArray.length - 1 ? 1 : 0);
            }

            return (
              <CharacterRenderer
                key={wordIndex}
                word={word}
                wordIndex={wordIndex}
                globalIndex={globalIndex}
                userInput={testState.userInput}
                currentIndex={currentIndex}
                testEnded={testEnded}
                wordsArrayLength={testState.wordsArray.length}
                isFocused={isFocused}
              />
            );
          })}

          {/* Edge case: caret at very end */}
          {testState.wordsArray.length > 0 &&
            paragraph.length === currentIndex &&
            !testEnded &&
            isFocused && <Carat />}
        </div>
        {!isFocused && <BlurOverlay />}
      </div>
      <div className="flex items-center gap-4">
        <button
          className="cursor-pointer rounded-full p-2"
          onClick={restartTest}
        >
          <ArrowPathIcon className="text-cyan-1 h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(TypingTest);
