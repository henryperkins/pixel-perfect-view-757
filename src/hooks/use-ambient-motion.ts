import { useEffect, useRef, useState } from "react";

/** Decorative motion only runs while visible, foregrounded, and explicitly permitted. */
export function useAmbientMotion<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    const update = () => setActive(visible && !document.hidden && !preference.matches);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? false;
            update();
          });
    observer?.observe(element);
    document.addEventListener("visibilitychange", update);
    preference.addEventListener("change", update);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      preference.removeEventListener("change", update);
    };
  }, []);

  return { ref, active };
}
