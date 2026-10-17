import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type MouseEvent,
  type RefObject,
} from "react";
import { useRouter, type HistoryLocation } from "@tanstack/react-router";

type MenuKind = "mobile" | "more";

declare module "@tanstack/react-router" {
  interface HistoryState {
    patternNavigationMenu?: { kind: MenuKind; href: string };
  }
}

function menuAt(location: Pick<HistoryLocation, "href" | "state">) {
  const menu = location.state.patternNavigationMenu;
  return menu?.href === location.href ? menu : undefined;
}

/** One owned history entry per open disclosure, including reload and Forward. */
export function useNavigationMenu(
  header: RefObject<HTMLElement | null>,
  mobileTrigger: RefObject<HTMLButtonElement | null>,
  moreTrigger: RefObject<HTMLButtonElement | null>,
) {
  const router = useRouter();
  // A disclosure must dismiss immediately even if a route's auth check is slow.
  const location = useSyncExternalStore(
    router.history.subscribe,
    () => router.history.location,
    () => router.history.location,
  );
  const menu = menuAt(location);
  const closingKey = useRef<string | undefined>(undefined);
  const restoreFocus = useRef(true);
  const previousMenu = useRef(menu);
  const ownsFocus = useCallback(
    (kind: MenuKind) => {
      const active = document.activeElement;
      const trigger = kind === "mobile" ? mobileTrigger.current : moreTrigger.current;
      const panel = document.getElementById(
        kind === "mobile" ? "mobile-navigation" : "more-navigation",
      );
      return active === trigger || Boolean(active && panel?.contains(active));
    },
    [mobileTrigger, moreTrigger],
  );
  const focusTrigger = useCallback(
    (kind: MenuKind) => {
      const trigger = kind === "mobile" ? mobileTrigger.current : moreTrigger.current;
      if (trigger?.isConnected && trigger.getClientRects().length)
        trigger.focus({ preventScroll: true });
    },
    [mobileTrigger, moreTrigger],
  );
  const close = useCallback(
    (focus = true) => {
      const current = router.history.location;
      const active = menuAt(current);
      if (!active || closingKey.current === current.state.__TSR_key) return;
      restoreFocus.current = focus && ownsFocus(active.kind);
      closingKey.current = current.state.__TSR_key;
      if (restoreFocus.current) focusTrigger(active.kind);
      router.history.back();
    },
    [router, focusTrigger, ownsFocus],
  );
  const toggle = (kind: MenuKind) => {
    const current = router.history.location;
    const active = menuAt(current);
    if (active?.kind === kind) {
      close();
      return;
    }
    restoreFocus.current = true;
    void router.navigate({
      href: current.href,
      state: { ...current.state, patternNavigationMenu: { kind, href: current.href } },
      replace: Boolean(active),
      resetScroll: false,
    });
  };

  useEffect(() => {
    const previous = previousMenu.current;
    if (menu && !previous) restoreFocus.current = true;
    if (
      previous &&
      !menu &&
      previous.href === location.href &&
      restoreFocus.current &&
      (document.activeElement === document.body || ownsFocus(previous.kind))
    )
      focusTrigger(previous.kind);
    previousMenu.current = menu;
    if (closingKey.current !== location.state.__TSR_key) closingKey.current = undefined;
  }, [menu, location.href, location.state.__TSR_key, focusTrigger, ownsFocus]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      // A modal above this non-modal menu gets first refusal.
      if (event.key === "Escape" && !event.defaultPrevented) close();
    };
    const outside = (event: globalThis.MouseEvent) => {
      const active = menuAt(router.history.location);
      const inside =
        event.target instanceof Element &&
        (active?.kind === "more"
          ? event.target.closest('#more-navigation, [aria-controls="more-navigation"]')
          : header.current?.contains(event.target));
      if (!event.defaultPrevented && event.target instanceof Node && !inside) close(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const breakpoint = () => {
      const active = menuAt(router.history.location);
      if (active && (active.kind === "mobile") === desktop.matches) close(false);
    };
    breakpoint();
    window.addEventListener("keydown", escape);
    document.addEventListener("click", outside);
    desktop.addEventListener("change", breakpoint);
    return () => {
      window.removeEventListener("keydown", escape);
      document.removeEventListener("click", outside);
      desktop.removeEventListener("change", breakpoint);
    };
  }, [router, header, close]);

  const onNavigateCapture = (event: MouseEvent<HTMLElement>) => {
    const current = router.history.location;
    if (
      !menuAt(current) ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !(event.target instanceof Element)
    )
      return;
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    const href = destination.pathname + destination.search + destination.hash;
    event.preventDefault();
    if (href === current.href || link.getAttribute("href") === "#main-content") {
      close(link.getAttribute("href") !== "#main-content");
      if (link.getAttribute("href") === "#main-content")
        requestAnimationFrame(() => document.getElementById("main-content")?.focus());
      return;
    }
    // Replace the menu entry with the destination; Back returns to the source page.
    restoreFocus.current = false;
    const { patternNavigationMenu: _menu, ...state } = current.state;
    void router.navigate({ href, replace: true, state });
  };

  return { menu: menu?.kind, toggle, close, onNavigateCapture };
}
