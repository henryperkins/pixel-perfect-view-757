import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { useAmbientMotion } from "@/hooks/use-ambient-motion";

/** Move the existing illustration gently, independently of the reading and its controls. */
export function CelestialScene({ src, children }: { src: string; children: ReactNode }) {
  const { ref, active } = useAmbientMotion<HTMLElement>();
  const frame = useRef<number | null>(null);

  const reset = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    ref.current?.style.removeProperty("--scene-x");
    ref.current?.style.removeProperty("--scene-y");
  };

  useEffect(() => {
    if (!active) {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      ref.current?.style.removeProperty("--scene-x");
      ref.current?.style.removeProperty("--scene-y");
    }
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [active, ref]);

  const move = (event: PointerEvent<HTMLElement>) => {
    if (
      !active ||
      event.pointerType === "touch" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      ref.current?.style.setProperty("--scene-x", `${x}px`);
      ref.current?.style.setProperty("--scene-y", `${y}px`);
      frame.current = null;
    });
  };

  return (
    <section
      ref={ref}
      className="landing-scene"
      data-ambient={active ? "running" : "paused"}
      onPointerMove={move}
      onPointerLeave={reset}
    >
      <div className="landing-art" aria-hidden="true">
        <img src={src} width={1600} height={912} alt="" decoding="async" />
      </div>
      {children}
    </section>
  );
}
