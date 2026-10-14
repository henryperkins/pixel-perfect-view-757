import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Shell } from "@/components/pattern/Shell";
import { signIn, signUp } from "@/lib/auth.shared";
import { assistantReturnTo } from "@/lib/assistant-navigation";
import { requestPasswordReset } from "@/lib/account-security.functions";
import { useQueryClient } from "@tanstack/react-query";
import { currentSession } from "@/lib/auth.shared";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search["next"] === "string"
      ? { next: search["next"] === "/plans" ? "/plans" : assistantReturnTo(search["next"]) }
      : {},
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
  const qc = useQueryClient();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "reset") {
        await requestPasswordReset({ data: { email } });
        setMessage(
          "If this email belongs to a Pattern account, you’ll receive a password reset link. Check your inbox and spam folder.",
        );
        return;
      }
      if (mode === "signup") {
        const result = await signUp({ data: { email, password } });
        toast.success(
          result.confirmationSent
            ? "Account created. Check your email to confirm your address."
            : "Account created. You can resend your confirmation email in Context & privacy.",
        );
      } else {
        await signIn({ data: { email, password } });
      }
      await qc.fetchQuery({ queryKey: ["session"], queryFn: () => currentSession(), staleTime: 0 });
      if (next) window.location.assign(next);
      else void navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell signedIn={false}>
      <div className="mx-auto max-w-md animate-rise">
        <h1 className="text-3xl">
          {mode === "signin"
            ? "Sign in"
            : mode === "reset"
              ? "Reset your password"
              : "Create an account"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your birth details are encrypted per account and never leave the calculation layer.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="technical text-muted-foreground">Email</span>
            <input
              type="email"
              inputMode="email"
              enterKeyHint="next"
              autoComplete="email"
              maxLength={200}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pattern-mobile-field mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
            />
          </label>
          {mode !== "reset" && (
            <label className="block">
              <span className="technical text-muted-foreground">Password</span>
              <input
                type="password"
                enterKeyHint="done"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                maxLength={200}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pattern-mobile-field mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 font-mono text-sm outline-none focus:border-ring"
              />
            </label>
          )}
          <Button type="submit" disabled={busy} className="min-h-11 w-full">
            {busy
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : mode === "reset"
                  ? "Email reset link"
                  : "Create account"}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        )}

        <Button
          variant="link"
          type="button"
          disabled={busy}
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setMessage("");
            setPassword("");
          }}
          className="mt-4 min-h-11 px-0"
        >
          {mode === "signin" ? "Need an account?" : "Back to sign in"}
        </Button>
        {mode === "signin" && (
          <Button
            variant="link"
            className="ml-5 min-h-11 px-0"
            disabled={busy}
            onClick={() => {
              setMode("reset");
              setPassword("");
              setError("");
              setMessage("");
            }}
          >
            Forgot password?
          </Button>
        )}

        <p className="mt-10 text-xs text-muted-foreground">
          <Link to="/" className="underline">
            Back to Pattern
          </Link>
        </p>
      </div>
    </Shell>
  );
}
