"use client";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { TestStats } from "@/modules/types";
import { getWordsArray } from "@/modules/util";
import { TestAnalyzer } from "@/modules/util/TypingAnalyzer";
import { useTestDataStore, useTestDurationStore } from "@/store";

import { BlurOverlay, Carat, CharacterRenderer } from "../";

interface TestState {
  wordsArray: string[];
  userInput: string[];
  currentIndex: number;
}

type TypingTestProps = {
  onTestComplete: (stats: TestStats | null) => void;
};

const TypingTest = ({ onTestComplete }: TypingTestProps) => {
  const testDuration = useTestDurationStore.getState().testDuration;
  const { testStarted, testEnded, setTestStarted, setTestEnded } =
    useTestDataStore();
  const [time, setTime] = useState(0);
  const [countdown, setCountdown] = useState(testDuration.value);
  const [testState, setTestState] = useState<TestState>({
    wordsArray: [],
    userInput: [""],
    currentIndex: 0,
  });
  const [isFocused, setIsFocused] = useState(true);

  const typingContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const testAnalayzer = useRef(new TestAnalyzer());
  const paragraph = useRef(testState.wordsArray.join(" "));

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
      testState.userInput.length > testState.wordsArray.length &&
      !testEnded
    ) {
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
      return { wpm: 0, accuracy: 0 };
    }
    return testAnalayzer.current.currentStats(
      time,
      testState.userInput,
      testState.wordsArray,
    );
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
    if (testStarted && !testEnded) {
      testAnalayzer.current.calculateStatsForSecond(
        time,
        testState.userInput,
        testState.wordsArray,
      );
    }
  }, [time]);

  // Final stats calculation on test end
  useEffect(() => {
    if (testEnded) {
      const finalStats = testAnalayzer.current.calculateFinalStats(
        {
          testId: "",
          testType: testDuration.type,
          testTypeValue: testDuration.value,
          meanWpm: 0,
          meanRawWpm: 0,
          accuracy: 0,
          testTime: time,
          charsTyped: 0,
          correctChars: 0,
          incorrectChars: 0,
          extraChars: 0,
          created_at: new Date().toISOString(),
          statsPerSecond: [],
          keyPresses: [],
          delays: [],
        },
        testState.userInput,
        testState.wordsArray,
        time,
      );

      setTestStarted(false);
      onTestComplete(finalStats);
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
  }, [testState.currentIndex, scrollToCaretIfNeeded]);

  // KeyDown input handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || testEnded || e.key === "Tab")
        return;

      e.preventDefault();

      if (e.key.length === 1) {
        if (!testStarted) {
          setTestStarted(true);
          testAnalayzer.current.reset();
        }
        testAnalayzer.current.recordKeyDown(e.key, performance.now());
        if (e.key === " ") {
          setTestState((prev) => ({
            ...prev,
            userInput: [...prev.userInput, ""],
            currentIndex: prev.currentIndex + 1,
          }));
        } else {
          setTestState((prev) => {
            if (
              prev.userInput[prev.currentIndex].length >=
              prev.wordsArray[prev.currentIndex].length + 5
            ) {
              return prev;
            }
            const newInput = [
              ...prev.userInput.slice(0, -1),
              prev.userInput[prev.currentIndex] + e.key,
            ];
            const newState = { ...prev, userInput: newInput };
            return newState;
          });
        }
      } else if (e.key === "Backspace") {
        setTestState((prev) => {
          const newInput = [
            ...prev.userInput.slice(0, -1),
            prev.userInput[prev.currentIndex].slice(0, -1),
          ];
          // if (
          //   newInput[prev.currentIndex].length === 0 &&
          //   prev.currentIndex > 0
          // ) {
          //   newInput.pop();
          //   return {
          //     ...prev,
          //     userInput: newInput,
          //     currentIndex: prev.currentIndex - 1,
          //   };
          // }
          return {
            ...prev,
            userInput: newInput,
          };
        });
      }
    },
    [testEnded, setTestStarted, testStarted],
  );

  // KeyUp handling for key press durations
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!testStarted || testEnded) return;
      testAnalayzer.current.recordKeyUp(e.key, performance.now());
    },
    [testStarted, testEnded],
  );

  const handleTestDivClick = useCallback(() => {
    const typingContainer = typingContainerRef.current;
    if (typingContainer) {
      typingContainer.focus();
    }
  }, []);

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
      typingContainer.addEventListener("keydown", handleKeyDown);
      typingContainer.addEventListener("keyup", handleKeyUp);
      typingContainer.addEventListener("focus", handleFocus);
      typingContainer.addEventListener("blur", handleBlur);
    }
    return () => {
      if (typingContainer) {
        typingContainer.removeEventListener("keydown", handleKeyDown);
        typingContainer.removeEventListener("keyup", handleKeyUp);
        typingContainer.removeEventListener("focus", handleFocus);
        typingContainer.removeEventListener("blur", handleBlur);
      }
    };
  }, [handleKeyDown, testEnded]);

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
  }, [handleKeyDown]);

  const restartTest = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsFocused(true);
    setTestStarted(false);
    setTestEnded(false);
    setTime(0);
    setTestState({
      userInput: [""],
      wordsArray: getWordsArray(
        testDuration.type === "words" ? testDuration.value : undefined,
      ),
      currentIndex: 0,
    });

    typingContainerRef.current?.focus();
    testAnalayzer.current.reset();
    onTestComplete(null);
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
          onClick={handleTestDivClick}
          tabIndex={0}
          className="text-grey-2 absolute inset-0 flex flex-wrap overflow-y-hidden font-mono leading-relaxed whitespace-pre-wrap select-none focus:outline-none"
        >
          {testState.wordsArray.map((word, wordIndex) => {
            return (
              <CharacterRenderer
                key={wordIndex}
                word={word}
                wordIndex={wordIndex}
                userInput={testState.userInput[wordIndex] || ""}
                currentIndex={testState.currentIndex}
                testEnded={testEnded}
                wordsArrayLength={testState.wordsArray.length}
                isFocused={isFocused}
              />
            );
          })}

          {/* Edge case: caret at very end */}
          {testState.wordsArray.length > 0 &&
            paragraph.current.length === testState.currentIndex &&
            !testEnded &&
            isFocused && <Carat />}
        </div>
        {!isFocused && <BlurOverlay onClick={handleTestDivClick} />}
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
