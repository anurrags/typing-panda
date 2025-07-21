import { words } from "@/data/words";

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
  charsPerLine: number
) => {
  const paragraphArray: string[][] = [];
  let charCount = 0;
  let line: string[] = [];
  for (let i = 0; i < wordsArray.length; i++) {
    const word = wordsArray[i];
    if (charCount + word.length > charsPerLine) {
      paragraphArray.push(line);
      line = [];
      charCount = 0;
    }
    line.push(word);
    charCount += word.length + 1;
  }
  return paragraphArray;
};
