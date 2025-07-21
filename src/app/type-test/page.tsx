"use client";

import { useGetCharactersPerLine } from "@/modules/hooks";
import { characterState } from "@/modules/types";
import { getParagraphArray, getWordsArray } from "@/modules/util";
import React, { useEffect, useState } from "react";

const Page = () => {
  const [wordsArray, setWordsArray] = useState<string[]>([]);
  const [paragraphArray, setParagraphArray] = useState<string[][]>([]);
  const charsPerLine = useGetCharactersPerLine();
  const [characterState, setCharacterState] = useState<characterState[]>([]);

  useEffect(() => {
    setWordsArray(getWordsArray());
  }, []);

  useEffect(() => {
    setParagraphArray(getParagraphArray(wordsArray, charsPerLine));
  }, [wordsArray, charsPerLine]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Type Test</h1>
      <div className="flex flex-col items-center justify-center gap-1 select-none">
        {paragraphArray.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className="flex items-start self-baseline justify-start text-xl"
          >
            {line.map((word, wordIndex) => (
              <span key={wordIndex}>
                {Array.from(word).map((char, charIndex) => (
                  <span
                    key={charIndex}
                    id={`${lineIndex}${wordIndex}${charIndex}`}
                  >
                    {char}
                  </span>
                ))}
                &nbsp;
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
