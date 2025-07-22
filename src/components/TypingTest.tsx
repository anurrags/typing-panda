import React, { useEffect, useRef, useState } from "react";
import Carat from "./Carat";
import { getWordsArray } from "../modules/util";

const TypingTest: React.FC = () => {
  const [wordsArray, setWordsArray] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);

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
        setUserInput((prev: string) => prev + e.key);
        e.preventDefault();
      } else if (e.key === "Backspace") {
        setUserInput((prev: string) => prev.slice(0, -1));
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  let globalIndex = 0;

  return (
    <div className="flex border pt-8 w-[80vw] flex-col gap-8 items-center justify-center bg-dark-1 border-cyan-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-16 text-4xl">
        <div className="flex items-center gap-2">
          <span className="text-cyan-1 ">0</span>
          <span className="text-grey-2">WPM</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-1">0</span>
          <span>%</span>
          <span className="text-grey-2">Acc</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-1">0</span>
          <span className="text-grey-2">s</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex flex-wrap h-36 pl-4 overflow-y-hidden whitespace-pre-wrap leading-relaxed text-grey-2 font-mono"
      >
        {wordsArray.map((word, wordIndx) => (
          <div
            key={wordIndx}
            className="text-3xl tracking-wider leading-8 whitespace-nowrap my-2 inline-flex"
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
