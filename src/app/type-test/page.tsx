"use client";

import { useGetCharactersPerLine } from "@/modules/hooks";
import { getParagraphArray } from "@/modules/util";
import React from "react";

const Page = () => {
  const charsPerLine = useGetCharactersPerLine();
  const paragraphArray = getParagraphArray(charsPerLine);
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Type Test</h1>
      <div className="flex flex-col items-center justify-center gap-1">
        {paragraphArray.map((line, index) => (
          <div
            key={index}
            className="flex items-start self-baseline justify-start text-xl"
          >
            {line.map((word, index) => (
              <span key={index}>{word} &nbsp;</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
