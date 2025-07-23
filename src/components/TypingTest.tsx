import React, { useEffect, useRef, useState } from "react";
import { getWordsArray } from "../modules/util";
import { Carat } from "./";

const TypingTest: React.FC = () => {
  const [wordsArray, setWordsArray] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [startedTyping, setStartedTyping] = useState<boolean>(false);
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [time, setTime] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const paragraph = wordsArray.join(" ");

  const currentIndex = userInput.length;

  useEffect(() => {
    setWordsArray(getWordsArray());
  }, []);

  // Scroll to the caret when it's at the bottom of the container
  // This help in auto scrolling the lines when the caret is at the bottom of the container
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const caret = container.querySelector("#caret") as HTMLSpanElement | null;
      if (caret) {
        caret.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "start",
        });
      }
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        if (!startedTyping) {
          setStartedTyping(true);
        }
        setUserInput((prev: string) => prev + e.key);
        e.preventDefault();
      } else if (e.key === "Backspace") {
        setUserInput((prev: string) => prev.slice(0, -1));
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  useEffect(() => {
    const calculateWpm = () => {
      const wordsTyped = userInput.split(" ").length;
      const timeInMinutes = time / 60;
      const wpm =
        timeInMinutes === 0 ? 0 : Math.round(wordsTyped / timeInMinutes);
      setWpm(wpm);
    };

    const calculateAccuracy = () => {
      const correctChars = userInput
        .split("")
        .filter((char, index) => char === paragraph[index]).length;
      const accuracy =
        userInput.length === 0
          ? 0
          : Math.round((correctChars / userInput.length) * 100);
      setAccuracy(accuracy);
    };

    calculateWpm();
    calculateAccuracy();
  }, [userInput, wordsArray, time, paragraph]);

  useEffect(() => {
    if (startedTyping) {
      const interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startedTyping]);

  let globalIndex = 0;

  return (
    <div className="bg-dark-1 border-cyan-2 flex w-[80vw] flex-col items-center justify-center gap-8 rounded-lg border px-6 py-12 shadow-lg">
      <div className="flex items-center gap-16 text-4xl">
        <div className="flex items-center gap-2">
          <span className="text-cyan-1">{wpm}</span>
          <span className="text-grey-2">WPM</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-1">{accuracy}</span>
          <span>%</span>
          <span className="text-grey-2">Acc</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-1">{time}</span>
          <span className="text-grey-2">s</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="text-grey-2 flex h-36 flex-wrap overflow-y-hidden font-mono leading-relaxed whitespace-pre-wrap"
      >
        {wordsArray.map((word, wordIndx) => (
          <div
            key={wordIndx}
            className="my-2 inline-flex text-3xl leading-8 tracking-wider whitespace-nowrap"
          >
            {/* Render each character in word */}
            {Array.from(word).map((char, charIndx) => {
              const typedChar = userInput[globalIndex];
              let status: "correct" | "incorrect" | "notTyped" = "notTyped";

              if (typedChar !== undefined) {
                status = typedChar === char ? "correct" : "incorrect";
              }
              const isCaret = globalIndex === currentIndex;

              const output = (
                <span key={charIndx} className="relative">
                  {isCaret && <Carat />}
                  <span
                    className={`${status === "incorrect" && "text-red-1"} ${
                      status === "correct" && "text-light-1"
                    }`}
                  >
                    {char}
                  </span>
                </span>
              );

              globalIndex++;
              return output;
            })}

            {/* Render a space after the word if not the last word */}
            {wordIndx < wordsArray.length - 1 &&
              (() => {
                const isCaret = globalIndex === userInput.length;

                const space = (
                  <span key={`space-${wordIndx}`} className="relative">
                    {isCaret && <Carat />}
                    <span>{"\u00A0"}</span>
                  </span>
                );

                globalIndex++;
                return space;
              })()}
          </div>
        ))}

        {/* Edge case: caret at very end */}
        {wordsArray.length > 0 && globalIndex === currentIndex && <Carat />}
      </div>
    </div>
  );
};

export default TypingTest;
