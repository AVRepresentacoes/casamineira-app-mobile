import { useMemo, useState } from "react";
import { onboardingSlides } from "../data/onboardingSlides";

export function useOnboarding() {
  const slides = useMemo(() => onboardingSlides, []);
  const [index, setIndex] = useState(0);

  const isLast = index >= slides.length - 1;

  const next = () => {
    if (isLast) return;
    setIndex((prev) => prev + 1);
  };

  const back = () => {
    setIndex((prev) => Math.max(0, prev - 1));
  };

  const skip = () => {
    setIndex(slides.length - 1);
  };

  return {
    slides,
    index,
    setIndex,
    isLast,
    next,
    back,
    skip,
  };
}
