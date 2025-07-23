import englishWords from "@/data/english_1k.json";
import { ParagraphState } from "../types";

const words = englishWords.words;
export const getWordsArray = () => {
  let charCount = 0;
  const wordsArray: string[] = [];
  while (charCount < 1000) {
    const word = words[Math.floor(Math.random() * words.length)];
    if (charCount + word.length > 1000) break;

    wordsArray.push(word);
    charCount += word.length + 1;
  }
  return wordsArray;
};

export const getParagraphArray = (
  wordsArray: string[],
  charsPerLine: number,
) => {
  const paragraphArray: ParagraphState[] = [];
  let charCount = 0;
  let currentLine = 0;
  for (let i = 0; i < wordsArray.length; i++) {
    const word = wordsArray[i].split("");

    if (charCount + word.length > charsPerLine) {
      currentLine++;
      charCount = 0;
    }
    word.map((char) => {
      paragraphArray.push({ char: char, line: currentLine });
    });
    paragraphArray.push({ char: " ", line: currentLine });
    charCount += word.length + 1;
  }
  return paragraphArray;
};
