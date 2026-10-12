import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Shell } from "@/components/pattern/Shell";
import { signIn, signUp } from "@/lib/auth.shared";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: "/assistants" } =>
    search["next"] === "/assistants" ? { next: "/assistants" } : {},
  head: () => ({
    meta: [
      { title: "Sign in — Pattern" },
      {
        name: "description",
        content: "Sign in to Pattern to see today's calculated reading and the evidence behind it.",
      },
      { property: "og:title", content: "Sign in — Pattern" },
      {
        property: "og:description",
        content: "Access your calculated chart, cycles and daily reading.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp({ data: { email, password } });
        toast.success("Account created.");
      } else {
        await signIn({ data: { email, password } });
      }
      void navigate({ to: next ?? "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell signedIn={false}>
      <div className="mx-auto max-w-md animate-rise">
        <h1 className="text-3xl">{mode === "signin" ? "Sign in" : "Create an account"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your birth details are encrypted per account and never leave the calculation layer.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="technical text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
            />
          </label>
          <label className="block">
            <span className="technical text-muted-foreground">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 technical text-primary"
        >
          {mode === "signin" ? "Need an account?" : "Already have an account?"}
        </button>

        <p className="mt-10 text-xs text-muted-foreground">
          <Link to="/" className="underline">
            Back to Pattern
          </Link>
        </p>
      </div>
    </Shell>
  );
}
