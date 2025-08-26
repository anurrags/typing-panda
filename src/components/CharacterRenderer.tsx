import React from "react";

import { Carat } from "./";
// Adjust the import path as needed

interface CharacterRendererProps {
  word: string;
  wordIndex: number;
  userInput: string;
  currentIndex: number;
  testEnded: boolean;
  wordsArrayLength: number;
  isFocused: boolean;
}

const CharacterRenderer: React.FC<CharacterRendererProps> = ({
  word,
  wordIndex,
  userInput,
  currentIndex,
  testEnded,
  wordsArrayLength,
  isFocused,
}) => {
  return (
    <div className="my-2 inline-flex text-3xl leading-8 tracking-wider whitespace-nowrap">
      {Array.from(word).map((char, charIndex) => {
        const typedChar = userInput.charAt(charIndex);
        let status: "correct" | "incorrect" | "notTyped" = "notTyped";

        if (typedChar !== "") {
          status = typedChar === char ? "correct" : "incorrect";
        }

        const isCaret =
          currentIndex === wordIndex && userInput.length === charIndex;
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
        return element;
      })}
      {userInput.length > word.length && (
        <span className="text-red-1">{userInput.slice(word.length)}</span>
      )}
      {wordIndex < wordsArrayLength - 1 &&
        (() => {
          const isCaret =
            currentIndex === wordIndex && userInput.length >= word.length;
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
