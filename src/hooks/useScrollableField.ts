import { useEffect, type RefObject } from "react";

/** Marks a text field with `data-scrollable` while its content overflows the field. */
export function useScrollableField(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    let active = true;
    const measure = () => {
      // Containing a fitting field would swallow a swipe meant for the page.
      if (active)
        field.toggleAttribute("data-scrollable", field.scrollHeight > field.clientHeight + 1);
    };
    measure();
    void document.fonts.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [ref, value]);
}
