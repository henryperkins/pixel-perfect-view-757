import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { signOut } from "@/lib/auth.shared";

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
    "technical relative py-1 transition-colors",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    // Active underline indicator
    "after:absolute after:inset-x-0 after:-bottom-[1.05rem] after:h-px after:transition-opacity",
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-rule bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <Link
            to="/"
            className="flex items-baseline gap-2 font-serif text-lg tracking-tight"
          >
            Pattern
            <span className="hidden font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground sm:inline">
              personal ephemeris
            </span>
          </Link>

          {signedIn ? (
            <nav aria-label="Primary" className="hidden items-center gap-5 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive(item.to) ? "page" : undefined}
                  className={navLinkClass(isActive(item.to))}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-4">
            {signedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void signOut().then(() => {
                      window.location.assign("/auth");
                    });
                  }}
                  className="technical hidden text-muted-foreground transition-colors hover:text-foreground md:inline"
                >
                  Sign out
                </button>
                <button
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
                </button>
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
            className="border-t border-rule bg-background md:hidden"
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
                <button
                  type="button"
                  onClick={() => {
                    void signOut().then(() => {
                      window.location.assign("/auth");
                    });
                  }}
                  className="w-full py-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
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
