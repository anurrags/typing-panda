import React from "react";
import { Carat } from "./";
// Adjust the import path as needed

interface CharacterRendererProps {
  word: string;
  wordIndex: number;
  globalIndex: number;
  userInput: string;
  currentIndex: number;
  testEnded: boolean;
  wordsArrayLength: number;
  isFocused: boolean;
}

const CharacterRenderer: React.FC<CharacterRendererProps> = ({
  word,
  wordIndex,
  globalIndex: startGlobalIndex,
  userInput,
  currentIndex,
  testEnded,
  wordsArrayLength,
  isFocused,
}) => {
  let globalIndex = startGlobalIndex;

  return (
    <div className="my-2 inline-flex text-3xl leading-8 tracking-wider whitespace-nowrap">
      {Array.from(word).map((char, charIndex) => {
        const typedChar = userInput[globalIndex];
        let status: "correct" | "incorrect" | "notTyped" = "notTyped";

        if (typedChar !== undefined) {
          status = typedChar === char ? "correct" : "incorrect";
        }

        const isCaret = globalIndex === currentIndex;
        const element = (
          <span key={charIndex} className="relative">
            {isCaret && !testEnded && isFocused && <Carat />}
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
        return element;
      })}
      {wordIndex < wordsArrayLength - 1 &&
        (() => {
          const isCaret = globalIndex === currentIndex;
          const space = (
            <span key={`space-${wordIndex}`} className="relative">
              {isCaret && !testEnded && isFocused && <Carat />}
              <span>{"\u00A0"}</span>
            </span>
          );
          return space;
        })()}
    </div>
  );
};

export default React.memo(CharacterRenderer);
