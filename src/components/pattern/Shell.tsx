import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Today" },
  { to: "/pattern", label: "Your pattern" },
  { to: "/timing", label: "Timing" },
  { to: "/time-travel", label: "Time travel" },
  { to: "/privacy", label: "Context & privacy" },
] as const;

export function Shell({
  children,
  signedIn = true,
}: {
  children: ReactNode;
  signedIn?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link to="/" className="font-serif text-lg tracking-tight">
            Pattern
          </Link>
          {signedIn ? (
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="technical text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "technical text-foreground" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="ml-auto">
            {signedIn ? (
              <button
                type="button"
                onClick={() => {
                  void supabase.auth.signOut();
                }}
                className="technical text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            ) : (
              <Link to="/auth" className="technical text-primary">
                Sign in
              </Link>
            )}
          </div>
        </div>
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
