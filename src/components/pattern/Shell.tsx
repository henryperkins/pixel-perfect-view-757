import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { signOut } from "@/lib/auth.shared";
import { Button } from "@/components/ui/button";
import { OrbitMark } from "@/components/pattern/OrbitMark";
import { Sun, Orbit, Waves, NotebookPen, ChevronDown, Menu, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Today" },
  { to: "/pattern", label: "Your pattern" },
  { to: "/timing", label: "Timing" },
  { to: "/journal", label: "Journal" },
  { to: "/birth", label: "Birth details" },
  { to: "/time-travel", label: "Time travel" },
  { to: "/privacy", label: "Context & privacy" },
  { to: "/assistants", label: "Connected assistants" },
  { to: "/content", label: "Content" },
] as const;
const NAV_ICONS = [Sun, Orbit, Waves, NotebookPen];

// Only browser effects write this cache. Preserve the indicator's last position across
// route-local Shell mounts without restructuring authentication or the route tree.
const navigationPositions = new Map<string, { x: number; width: number; viewport: number }>();

function navLinkClass(active: boolean) {
  return [
    "journey-link relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    active ? "is-selected" : "",
  ].join(" ");
}

export function Shell({ children, signedIn = true }: { children: ReactNode; signedIn?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLButtonElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
    setProgress(0);
  }, [pathname]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const update = () => {
      [desktopNavRef.current, mobileNavRef.current].forEach((nav, index) => {
        const active = nav?.querySelector<HTMLElement>(
          ':scope > .journey-link[aria-current="page"], :scope > div > button[data-nav-selected="true"]',
        );
        const indicator = nav?.querySelector<HTMLElement>(":scope > .journey-indicator");
        if (!nav || !nav.isConnected || !indicator || nav.offsetWidth === 0) return;
        if (!active) {
          indicator.style.opacity = "0";
          return;
        }
        const key = index === 0 ? "desktop" : "mobile";
        const previous = navigationPositions.get(key);
        const current = {
          x: active.getBoundingClientRect().left - nav.getBoundingClientRect().left,
          width: active.offsetWidth,
          viewport: nav.offsetWidth,
        };
        indicator.style.width = `${current.width}px`;
        indicator.style.transform = `translateX(${current.x}px)`;
        indicator.style.opacity = "1";
        navigationPositions.set(key, current);
        if (
          previous &&
          previous.viewport === current.viewport &&
          (previous.x !== current.x || previous.width !== current.width) &&
          !reduced.matches &&
          typeof indicator.animate === "function"
        ) {
          const animation = indicator.animate(
            [
              {
                transform: `translateX(${previous.x}px) scaleX(${previous.width / current.width})`,
              },
              { transform: `translateX(${current.x}px) scaleX(1)` },
            ],
            { duration: 420, easing: "cubic-bezier(.22,.8,.25,1)" },
          );
          animations.add(animation);
          void animation.finished.then(
            () => animations.delete(animation),
            () => animations.delete(animation),
          );
        }
      });
    };
    // A route-local Shell can observe the destination just before it unmounts.
    // Measure after the commit so only the connected, incoming navigation writes
    // its position and animates from the last route's committed selection.
    const indicatorFrame = requestAnimationFrame(update);
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (desktopNavRef.current) resize?.observe(desktopNavRef.current);
    if (mobileNavRef.current) resize?.observe(mobileNavRef.current);
    const stopMotion = () => {
      if (reduced.matches) animations.forEach((animation) => animation.cancel());
    };
    reduced.addEventListener("change", stopMotion);
    return () => {
      cancelAnimationFrame(indicatorFrame);
      resize?.disconnect();
      animations.forEach((animation) => animation.cancel());
      reduced.removeEventListener("change", stopMotion);
    };
  }, [pathname, signedIn]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (event.target instanceof Node && !moreRef.current?.contains(event.target))
        setMoreOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (moreRef.current?.querySelector("#more-navigation")) {
          moreRef.current.querySelector("button")?.focus();
        }
        if (document.getElementById("mobile-navigation")) mobileMenuRef.current?.focus();
        setMoreOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    // Content is visible by default. Animation never gates access to a reading.
    const reveal =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                if (
                  !reduced.matches &&
                  typeof entry.target.animate === "function" &&
                  entry.target.getBoundingClientRect().top > 100
                ) {
                  entry.target.animate(
                    [
                      { opacity: 0.65, transform: "translateY(10px)" },
                      { opacity: 1, transform: "none" },
                    ],
                    { duration: 320, easing: "cubic-bezier(.22,.8,.25,1)" },
                  );
                }
                reveal?.unobserve(entry.target);
              });
            },
            { threshold: 0.05 },
          );
    const scan = () => {
      main.querySelectorAll("section").forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        if (
          reduced.matches ||
          element.closest(".chapter-content") ||
          element.parentElement?.closest("section")
        )
          return;
        reveal?.observe(element);
      });
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(main, { childList: true, subtree: true });
    let progressFrame: number | null = null;
    const update = () => {
      if (progressFrame !== null) return;
      progressFrame = requestAnimationFrame(() => {
        const distance = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(
          distance > 0 ? Math.min(100, Math.max(0, (window.scrollY / distance) * 100)) : 0,
        );
        progressFrame = null;
      });
    };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resize?.observe(main);
    update();
    window.addEventListener("scroll", update, { passive: true });
    const motionChange = () => {
      if (reduced.matches)
        main.getAnimations?.({ subtree: true }).forEach((animation) => animation.cancel());
    };
    reduced.addEventListener("change", motionChange);
    return () => {
      reveal?.disconnect();
      mutations.disconnect();
      resize?.disconnect();
      if (progressFrame !== null) cancelAnimationFrame(progressFrame);
      window.removeEventListener("scroll", update);
      reduced.removeEventListener("change", motionChange);
    };
  }, [pathname]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const secondaryPage = NAV.slice(4).find((item) => isActive(item.to));

  return (
    <div
      className={`pattern-shell min-h-screen bg-background text-foreground ${signedIn ? "has-journey" : ""}`}
    >
      <a
        href="#main-content"
        className="skip-link"
        onClick={() => {
          setMenuOpen(false);
          setMoreOpen(false);
        }}
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-background/85 backdrop-blur-md">
        <div className="mx-auto grid h-20 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:flex sm:gap-4 sm:px-8">
          <Link
            to="/"
            className="brand-link flex min-w-0 shrink-0 items-center gap-2 font-serif text-2xl text-primary"
          >
            <OrbitMark />
            Pattern
            <span className="hidden font-sans text-xs text-muted-foreground xl:inline">
              personal ephemeris
            </span>
          </Link>

          {signedIn ? (
            <nav
              ref={desktopNavRef}
              aria-label="Primary"
              className="journey-nav hidden items-center gap-1 lg:flex"
            >
              <span className="journey-indicator" aria-hidden="true" />
              {NAV.slice(0, 4).map((item, index) => {
                const Icon = NAV_ICONS[index];
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isActive(item.to) ? "page" : undefined}
                    className={navLinkClass(isActive(item.to))}
                  >
                    {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
                    {item.label}
                  </Link>
                );
              })}
              <div ref={moreRef} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={moreOpen}
                  aria-controls="more-navigation"
                  data-nav-selected={secondaryPage ? "true" : undefined}
                  aria-label={
                    secondaryPage
                      ? `More pages, current page: ${secondaryPage.label}`
                      : "More pages"
                  }
                  onClick={() => setMoreOpen((v) => !v)}
                  className={`gap-2 ${secondaryPage ? "text-primary" : "text-muted-foreground"}`}
                >
                  More <ChevronDown aria-hidden="true" className={moreOpen ? "rotate-180" : ""} />
                </Button>
                {moreOpen ? (
                  <nav
                    id="more-navigation"
                    aria-label="More pages"
                    className="absolute right-0 top-full mt-3 w-52 animate-rise rounded-md border border-rule bg-popover p-2 text-popover-foreground"
                  >
                    {NAV.slice(4).map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        aria-current={isActive(item.to) ? "page" : undefined}
                        className={`block rounded-sm px-3 py-2.5 text-sm transition-colors hover:bg-accent ${isActive(item.to) ? "bg-secondary text-primary" : "text-muted-foreground"}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                ) : null}
              </div>
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-4">
            {signedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    void signOut().then(() => {
                      window.location.assign("/auth");
                    });
                  }}
                  className="hidden text-muted-foreground lg:inline-flex"
                >
                  Sign out
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  ref={mobileMenuRef}
                  type="button"
                  aria-expanded={menuOpen}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-controls="mobile-navigation"
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
                >
                  {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                </Button>
              </>
            ) : (
              <Link to="/auth" className="technical text-primary">
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {signedIn && menuOpen ? (
          <nav
            id="mobile-navigation"
            aria-label="Primary mobile"
            className="mobile-menu border-t border-rule bg-background lg:hidden"
          >
            <ul className="mx-auto max-w-6xl px-6 py-3">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={isActive(item.to) ? "page" : undefined}
                    className={`flex items-center justify-between border-b border-rule py-3 text-sm transition-colors last:border-b-0 ${
                      isActive(item.to)
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    {isActive(item.to) ? (
                      <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              ))}
              <li>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    void signOut().then(() => {
                      window.location.assign("/auth");
                    });
                  }}
                  className="h-auto w-full justify-start py-3 text-sm text-muted-foreground"
                >
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        ) : null}
        <progress
          className="reading-progress"
          value={progress}
          max={100}
          aria-label="Page reading progress"
        />
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        key={pathname}
        ref={mainRef}
        className="flow-page mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14"
      >
        {children}
      </main>
      {signedIn ? (
        <nav
          ref={mobileNavRef}
          aria-label="Quick navigation"
          className="journey-nav mobile-journey lg:hidden"
        >
          <span className="journey-indicator" aria-hidden="true" />
          {NAV.slice(0, 4).map((item, index) => {
            const Icon = NAV_ICONS[index];
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item.to) ? "page" : undefined}
                className={navLinkClass(isActive(item.to))}
              >
                {Icon ? <Icon aria-hidden="true" className="h-5 w-5" /> : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
      <footer className="mt-16 border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-6 technical text-muted-foreground">
          Deterministic assembly · no prediction · evidence on every claim
        </div>
      </footer>
    </div>
  );
}

export function Rail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="space-y-3">
      <h2 className="technical text-muted-foreground">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground">{children}</div>
    </aside>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
      <span className="technical text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}
