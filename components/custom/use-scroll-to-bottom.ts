import { useEffect, useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // Initial scroll to bottom
      requestAnimationFrame(() => {
        end.scrollIntoView({ behavior: "smooth", block: "end" });
      });

      const observer = new MutationObserver(() => {
        // Always scroll to bottom on content changes
        requestAnimationFrame(() => {
          const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 150;

          if (isNearBottom) {
            end.scrollIntoView({ behavior: "smooth", block: "end" });
          }
        });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}
