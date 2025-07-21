import { useScreenSize } from "./useScreenSize";

export const useGetCharactersPerLine = () => {
  const { width } = useScreenSize();

  if (width > 1024) return 100;
  if (width > 768) return 80;
  if (width > 480) return 60;
  return 40;
};
