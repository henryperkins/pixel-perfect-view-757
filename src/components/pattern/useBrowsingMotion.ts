import { useEffect, useRef } from "react";

/** A short, bounded response to filtering. Readings remain visible and mounted. */
export function useResultMotion<T extends HTMLElement>(scope: string, selector: string) {
  const ref = useRef<T>(null);
  const previous = useRef(scope);

  useEffect(() => {
    const changed = previous.current !== scope;
    previous.current = scope;
    const container = ref.current;
    if (!container || !changed) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const animations = Array.from(container.querySelectorAll<HTMLElement>(selector))
      .filter((element) => element.getClientRects().length > 0)
      .slice(0, 6)
      .flatMap((element, index) =>
        element.animate
          ? [
              element.animate(
                [
                  { opacity: 0.7, transform: "translateY(8px)" },
                  { opacity: 1, transform: "none" },
                ],
                {
                  duration: 280,
                  delay: index * 28,
                  easing: "cubic-bezier(.22,.8,.25,1)",
                },
              ),
            ]
          : [],
      );
    const cancel = () => animations.forEach((animation) => animation.cancel());
    const stop = () => {
      if (reduced.matches) cancel();
    };
    reduced.addEventListener("change", stop);
    return () => {
      cancel();
      reduced.removeEventListener("change", stop);
    };
  }, [scope, selector]);

  return ref;
}

/** Only an asynchronously arriving reading fades; opening it again never replays. */
export function useReadingArrival(ready: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const awaiting = useRef(!ready);

  useEffect(() => {
    if (!ready || !awaiting.current) return;
    awaiting.current = false;
    const element = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || !element.getClientRects().length || reduced.matches || !element.animate) return;
    const animation = element.animate([{ opacity: 0.7 }, { opacity: 1 }], {
      duration: 420,
      easing: "cubic-bezier(.22,.8,.25,1)",
    });
    const stop = () => {
      if (reduced.matches) animation.cancel();
    };
    reduced.addEventListener("change", stop);
    return () => {
      animation.cancel();
      reduced.removeEventListener("change", stop);
    };
  }, [ready]);

  return ref;
}
