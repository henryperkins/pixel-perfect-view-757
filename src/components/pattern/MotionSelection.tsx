import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Existing buttons stay usable before measurement and when motion is unavailable. */
export function MotionSelection({
  children,
  className,
  label,
  value,
  tone = "soft",
}: {
  children: ReactNode;
  className: string;
  label: string;
  value: string;
  tone?: "soft" | "ink";
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const initialized = useRef(false);
  const updateRef = useRef<((animate: boolean) => void) | null>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    const indicator = indicatorRef.current;
    if (!group || !indicator) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | null = null;
    const position = (animate: boolean) => {
      const button = group.querySelector<HTMLButtonElement>(':scope > button[aria-pressed="true"]');
      if (!button || button.offsetWidth === 0) {
        group.removeAttribute("data-motion-ready");
        return;
      }
      const to = {
        transform: `translate(${button.offsetLeft}px, ${button.offsetTop}px)`,
        width: `${button.offsetWidth}px`,
        height: `${button.offsetHeight}px`,
      };
      // ResizeObserver's first delivery must not interrupt a selection animation.
      if (
        initialized.current &&
        indicator.style.transform === to.transform &&
        indicator.style.width === to.width &&
        indicator.style.height === to.height
      )
        return;
      const previous = getComputedStyle(indicator);
      const from = {
        transform: previous.transform,
        width: previous.width,
        height: previous.height,
      };
      animation?.cancel();
      Object.assign(indicator.style, to);
      group.dataset["motionReady"] = "true";
      if (animate && initialized.current && !reduced.matches && indicator.animate) {
        animation = indicator.animate([from, to], {
          duration: 360,
          easing: "cubic-bezier(.22,.8,.25,1)",
        });
      }
      initialized.current = true;
    };
    updateRef.current = position;
    position(false);
    const onResize = () => position(false);
    let resize: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      try {
        resize = new ResizeObserver(onResize);
        resize.observe(group);
        const observer = resize;
        group.querySelectorAll("button").forEach((button) => observer.observe(button));
      } catch {
        resize?.disconnect();
        resize = null;
      }
    }
    window.addEventListener("resize", onResize, { passive: true });
    const stop = () => {
      if (reduced.matches) animation?.cancel();
    };
    reduced.addEventListener("change", stop);
    return () => {
      resize?.disconnect();
      window.removeEventListener("resize", onResize);
      reduced.removeEventListener("change", stop);
      animation?.cancel();
      updateRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    updateRef.current?.(true);
  }, [value]);

  return (
    <div
      ref={groupRef}
      className={`${className} motion-selection`}
      role="group"
      aria-label={label}
      data-motion-tone={tone}
    >
      <span ref={indicatorRef} className="motion-selection-indicator" aria-hidden="true" />
      {children}
    </div>
  );
}
