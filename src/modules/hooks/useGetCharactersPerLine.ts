import { useScreenSize } from "./useScreenSize";

export const useGetCharactersPerLine = () => {
  const { width } = useScreenSize();

  if (width > 1024) return 60;
  if (width > 768) return 50;
  if (width > 480) return 40;
  return 35;
};
