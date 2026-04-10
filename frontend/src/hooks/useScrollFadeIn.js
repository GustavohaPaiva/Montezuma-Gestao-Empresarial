import { useEffect, useState } from "react";

export function useScrollFadeIn() {
  const [element, setElement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [element]);

  return [setElement, isVisible];
}
