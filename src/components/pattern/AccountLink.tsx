import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "./Shell";
import { Button } from "@/components/ui/button";
import { confirmEmail, resetPassword } from "@/lib/account-security.functions";

export function AccountLink({ reset = false }: { reset?: boolean }) {
  const [token, setToken] = useState(""),
    [ready, setReady] = useState(false),
    [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    setToken(/^[a-f0-9]{64}$/.test(value) ? value : "");
    setReady(true);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (reset) {
        if (password !== repeat) throw new Error("Your passwords do not match.");
        await resetPassword({ data: { token, password } });
      } else await confirmEmail({ data: { token } });
      setToken("");
      setPassword("");
      setRepeat("");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "This link could not be used. Request a new one.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell signedIn={false}>
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl">
          {done
            ? reset
              ? "Password updated"
              : "Email confirmed"
            : reset
              ? "Choose a new password"
              : "Confirm your email"}
        </h1>
        {!ready ? (
          <p role="status" className="mt-4">
            Checking your link…
          </p>
        ) : done ? (
          <>
            <p role="status" className="mt-4 text-sm">
              {reset
                ? "Your password has changed and all devices have been signed out. Sign in with your new password."
                : "Your email is confirmed. If you changed your address, sign in with the new one."}
            </p>
            <Button asChild className="mt-6">
              <Link to="/auth">Sign in to Pattern</Link>
            </Button>
          </>
        ) : !token ? (
          <>
            <p role="alert" className="mt-4 text-sm">
              This link is missing or invalid. Open the link from your email, or request a new one.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {reset ? (
              <>
                {[
                  { label: "New password", value: password, update: setPassword },
                  { label: "Repeat new password", value: repeat, update: setRepeat },
                ].map((field) => (
                  <label key={field.label} className="block text-sm">
                    {field.label}
                    <input
                      className="pattern-mobile-field mt-2 min-h-11 w-full rounded-sm border border-input bg-card px-3"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={200}
                      value={field.value}
                      onChange={(e) => field.update(e.target.value)}
                    />
                  </label>
                ))}
              </>
            ) : (
              <p className="text-sm">
                Confirm this address for your Pattern account. Only continue if you requested this
                email.
              </p>
            )}
            <Button type="submit" className="min-h-11 w-full" disabled={busy}>
              {busy ? "Saving…" : reset ? "Set new password" : "Confirm email address"}
            </Button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </Shell>
  );
}
