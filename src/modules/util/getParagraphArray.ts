import { words } from "@/data/words";

export const getParagraphArray = (charsPerLine: number) => {
  const paragraphArray: string[][] = [];

  for (let i = 0; i < 10; i++) {
    const line = [];
    let charsInCurrLine = 0;
    while (charsInCurrLine < charsPerLine) {
      const word = words[Math.floor(Math.random() * words.length)];
      if (charsInCurrLine + word.length > charsPerLine) break;
      line.push(word);
      charsInCurrLine += word.length + 1;
    }
    paragraphArray.push(line);
  }
  return paragraphArray;
};
