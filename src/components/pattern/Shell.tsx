import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { signOut } from "@/lib/auth.shared";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Today" },
  { to: "/pattern", label: "Your pattern" },
  { to: "/timing", label: "Timing" },
  { to: "/journal", label: "Journal" },
  { to: "/birth", label: "Birth details" },
  { to: "/time-travel", label: "Time travel" },
  { to: "/privacy", label: "Context & privacy" },
  { to: "/content", label: "Content" },
] as const;

function navLinkClass(active: boolean) {
  return [
    "relative py-2 text-sm font-medium transition-colors",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    // Active underline indicator
    "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:transition-all after:duration-300",
    active ? "after:bg-primary after:opacity-100" : "after:bg-primary after:opacity-0",
  ].join(" ");
}

export function Shell({
  children,
  signedIn = true,
}: {
  children: ReactNode;
  signedIn?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
    setProgress(0);
  }, [pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (event.target instanceof Node && !moreRef.current?.contains(event.target)) setMoreOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMoreOpen(false); setMenuOpen(false); }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", escape); };
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); reveal.unobserve(entry.target); }
      });
    }, { threshold: 0.05 });
    const scan = () => {
      main.querySelectorAll("section, .prose-reading > p, .chapter-tile").forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        if (reduced.matches) return;
        element.classList.add("flow-reveal");
        reveal.observe(element);
      });
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(main, { childList: true, subtree: true });
    const update = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(distance > 0 ? Math.min(100, Math.max(0, window.scrollY / distance * 100)) : 0);
    };
    const resize = new ResizeObserver(update);
    resize.observe(main);
    window.addEventListener("scroll", update, { passive: true });
    const motionChange = () => { if (reduced.matches) main.querySelectorAll(".flow-reveal").forEach((el) => el.classList.add("is-visible")); };
    reduced.addEventListener("change", motionChange);
    return () => { reveal.disconnect(); mutations.disconnect(); resize.disconnect(); window.removeEventListener("scroll", update); reduced.removeEventListener("change", motionChange); };
  }, [pathname]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-rule bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-baseline gap-3 font-serif text-2xl text-primary"
          >
            Pattern
            <span className="hidden font-sans text-xs text-muted-foreground xl:inline">
              personal ephemeris
            </span>
          </Link>

          {signedIn ? (
            <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
              {NAV.slice(0, 4).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive(item.to) ? "page" : undefined}
                  className={navLinkClass(isActive(item.to))}
                >
                  {item.label}
                </Link>
              ))}
              <div ref={moreRef} className="relative">
                <Button variant="ghost" size="sm" aria-expanded={moreOpen} aria-controls="more-navigation" onClick={() => setMoreOpen((v) => !v)} className="gap-2 text-muted-foreground">
                  More <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
                </Button>
                {moreOpen ? <nav id="more-navigation" aria-label="More pages" className="absolute right-0 top-full mt-3 w-52 animate-rise rounded-md border border-rule bg-popover p-2 text-popover-foreground">
                  {NAV.slice(4).map((item) => <Link key={item.to} to={item.to} aria-current={isActive(item.to) ? "page" : undefined} className={`block rounded-sm px-3 py-2.5 text-sm transition-colors hover:bg-accent ${isActive(item.to) ? "bg-secondary text-primary" : "text-muted-foreground"}`}>{item.label}</Link>)}
                </nav> : null}
              </div>
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-4">
            {signedIn ? (
              <>
                <Button variant="ghost" size="sm"
                  type="button"
                  onClick={() => {
                    void signOut().then(() => {
                      window.location.assign("/auth");
                    });
                  }}
                  className="hidden text-muted-foreground md:inline-flex"
                >
                  Sign out
                </Button>
                <Button variant="outline" size="icon"
                  type="button"
                  aria-expanded={menuOpen}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-sm border border-input text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    {menuOpen ? (
                      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.2" />
                    ) : (
                      <path d="M1 3.5h12M1 7h12M1 10.5h12" stroke="currentColor" strokeWidth="1.2" />
                    )}
                  </svg>
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
            aria-label="Primary mobile"
              className="animate-rise border-t border-rule bg-background md:hidden"
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
                <Button variant="ghost"
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
        <progress className="reading-progress" value={progress} max={100} aria-label="Page reading progress" />
      </header>

      <main key={pathname} ref={mainRef} className="flow-page mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">{children}</main>
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
