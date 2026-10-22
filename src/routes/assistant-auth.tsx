import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAssistantSession } from "@/hooks/useAssistantSession";
import { assistantReturnTo } from "@/lib/assistant-navigation";

export const Route = createFileRoute("/assistant-auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    next: assistantReturnTo(search["next"]),
    recovery: search["recovery"] === true || search["recovery"] === "true",
  }),
  head: () => ({
    meta: [{ title: "Assistant sign-in — Pattern" }, { name: "robots", content: "noindex" }],
  }),
  component: AssistantAuthPage,
});
function AssistantAuthPage() {
  const { next, recovery: recoveryLink } = Route.useSearch();
  const { session, loading, error: sessionError, recovery } = useAssistantSession();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const updating = Boolean(session && (recovery || recoveryLink));
  const callback = (isRecovery = false) =>
    `${window.location.origin}/assistant-auth?next=${encodeURIComponent(next)}${isRecovery ? "&recovery=true" : ""}`;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (updating) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        window.location.assign(next);
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callback(true),
        });
        if (error) throw error;
        setMessage("If this assistant account exists, a password reset link is on its way.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback() },
        });
        if (error) throw error;
        setMessage("Check your email to confirm this assistant sign-in, then return here.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign(next);
      }
    } catch {
      setError(
        "Sign-in could not be completed. Check your details and email confirmation, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setError("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: callback() });
      if (result.error) throw result.error;
      if (!result.redirected) window.location.assign(next);
    } catch {
      setError("Google sign-in could not be completed. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell signedIn={false}>
      <div className="account-access mx-auto max-w-md">
        <p className="technical text-muted-foreground">Connected assistants</p>
        <h1 className="mt-3 text-3xl">{updating ? "Set a new password" : "Assistant sign-in"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Use this separate sign-in to connect an assistant. Your usual Pattern email, password and
          saved data stay as they are.
        </p>
        {(error || sessionError) && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error || sessionError}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        )}
        {loading ? (
          <p role="status" className="mt-6">
            Loading assistant sign-in…
          </p>
        ) : session && !updating ? (
          <div className="mt-6 space-y-4">
            <p className="break-words text-sm">Signed in as {session.user.email}</p>
            <Button className="min-h-11 w-full" onClick={() => window.location.assign(next)}>
              Continue
            </Button>
            <Button
              variant="outline"
              className="min-h-11 w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const { error } = await supabase.auth.signOut({ scope: "local" });
                  if (error) throw error;
                } catch {
                  setError("Could not sign out. Try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Use another assistant account
            </Button>
          </div>
        ) : (
          <>
            {!updating && (
              <Button
                variant="outline"
                className="mt-6 min-h-11 w-full"
                onClick={google}
                disabled={busy || Boolean(sessionError)}
              >
                Continue with Google
              </Button>
            )}
            <form onSubmit={submit} className="mt-6 space-y-4">
              {!updating && (
                <label className="block text-sm">
                  Email
                  <input
                    className="pattern-mobile-field mt-2 min-h-11 w-full rounded-sm border border-input bg-card px-3"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              )}
              {(mode !== "reset" || updating) && (
                <label className="block text-sm">
                  Password
                  <input
                    className="pattern-mobile-field mt-2 min-h-11 w-full rounded-sm border border-input bg-card px-3"
                    type="password"
                    autoComplete={
                      mode === "signup" || updating ? "new-password" : "current-password"
                    }
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              <Button
                type="submit"
                className="min-h-11 w-full"
                disabled={busy || Boolean(sessionError)}
              >
                {busy
                  ? "Working…"
                  : updating
                    ? "Save password"
                    : mode === "signup"
                      ? "Create assistant account"
                      : mode === "reset"
                        ? "Send reset link"
                        : "Sign in for assistants"}
              </Button>
            </form>
            {!updating && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="link"
                  className="min-h-11 px-0"
                  onClick={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    setError("");
                    setMessage("");
                  }}
                >
                  {mode === "signup"
                    ? "Already have an assistant account?"
                    : "Create an assistant account"}
                </Button>
                <Button
                  variant="link"
                  className="min-h-11 px-0"
                  onClick={() => setMode(mode === "reset" ? "signin" : "reset")}
                >
                  {mode === "reset" ? "Back to sign-in" : "Forgot password?"}
                </Button>
              </div>
            )}
          </>
        )}
        <p className="mt-8 text-sm">
          <Link
            to="/auth"
            search={{ next: "/assistants" }}
            className="underline underline-offset-4"
          >
            Sign in to your Pattern account
          </Link>
        </p>
      </div>
    </Shell>
  );
}
