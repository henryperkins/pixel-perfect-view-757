import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

/** Keep new-route focus independent of route-local Shell mounts and scroll restoration. */
export function RouteFocus() {
  const router = useRouter();

  useEffect(() => {
    let pending: { key: string; origin: Element | null } | undefined;

    const stopHistory = router.history.subscribe(({ location, action }) => {
      const key = location.state.__TSR_key;
      pending =
        (action.type === "PUSH" || action.type === "REPLACE") && key
          ? { key, origin: document.activeElement }
          : undefined;
    });
    const stopRendered = router.subscribe("onRendered", (event) => {
      if (!pending || pending.key !== event.toLocation.state.__TSR_key) return;
      const { origin } = pending;
      pending = undefined;

      // Initial loads, history traversal and in-page destinations keep their native focus.
      if (!event.fromLocation || !event.pathChanged || event.toLocation.hash) return;
      const main = document.getElementById("main-content");
      const active = document.activeElement;
      if (
        main &&
        (active === document.body ||
          active === document.documentElement ||
          (active === origin && !main.contains(active)))
      ) {
        // The router owns scrolling; preserve focus deliberately placed by the destination.
        main.focus({ preventScroll: true });
      }
    });

    return () => {
      stopHistory();
      stopRendered();
    };
  }, [router]);

  return null;
}
