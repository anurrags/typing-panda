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
      if (e.metaKey || e.ctrlKey || e.altKey) {
        // Let shortcuts work!
        return;
      }

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
    <div className="flex border w-[80vw] flex-col items-center justify-center bg-focus-area border-cyan-primary rounded-lg shadow-lg ">
      <div
        ref={containerRef}
        className="  gap-x-2  flex flex-wrap h-36 overflow-y-hidden  whitespace-pre-wrap leading-relaxed  "
      >
        {wordsArray.map((word, wordIndx) => (
          <div
            key={wordIndx}
            className="text-3xl tracking-wider leading-8 whitespace-nowrap m-2 inline-flex"
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
                    className={`${
                      status === "correct"
                        ? "text-green-500"
                        : status === "incorrect"
                        ? "text-red-500"
                        : "text-gray-400"
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
                const typedChar = userInput[globalIndex];
                let status: "correct" | "incorrect" | "notTyped" = "notTyped";

                if (typedChar !== undefined) {
                  status = typedChar === " " ? "correct" : "incorrect";
                }

                const isCaret = globalIndex === userInput.length;

                const space = (
                  <span key={`space-${wordIndx}`} className="relative">
                    {isCaret && <Carat />}
                    <span
                      className={`${
                        status === "correct"
                          ? "text-green-500"
                          : status === "incorrect"
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                    >
                      {"\u00A0"}
                    </span>
                  </span>
                );

                globalIndex++;
                return space;
              })()}
          </div>
        ))}

        {/* Edge case: caret at very end */}
        {globalIndex === currentIndex && (
          <span
            id="caret"
            className="inline-block w-px h-6 bg-white animate-pulse"
          />
        )}
      </div>
    </div>
  );
};

export default TypingTest;
