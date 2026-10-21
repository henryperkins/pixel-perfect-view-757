import { useMemberDraftLifecycle } from "./MemberDraftProvider";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  changeEmail,
  changePassword,
  fetchAccountSecurity,
  sendConfirmation,
  fetchEmailDelivery,
  signOutAll,
} from "@/lib/account-security.functions";
import { useAuth } from "@/hooks/useAuth";

export function AccountSecurity() {
  const { session } = useAuth();
  const { purgeAccountDrafts } = useMemberDraftLifecycle();
  const query = useQuery({
    queryKey: ["account-security", session?.userId],
    queryFn: () => fetchAccountSecurity(),
    enabled: Boolean(session),
    retry: false,
  });
  const [mode, setMode] = useState<"email" | "password" | null>(null),
    [current, setCurrent] = useState(""),
    [value, setValue] = useState(""),
    [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const delivery = useQuery({
    queryKey: ["account-email-delivery", session?.userId],
    queryFn: () => fetchEmailDelivery(),
    enabled: false,
    retry: false,
  });
  async function act(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!event) {
        await sendConfirmation();
        setMessage("Confirmation email sent. Check your inbox.");
      } else if (mode === "email") {
        await changeEmail({ data: { currentPassword: current, email: value } });
        setMessage(
          "Check your new email address to confirm the change. Your current address works until then.",
        );
        setMode(null);
      } else {
        if (value !== repeat) throw new Error("Your new passwords do not match.");
        await changePassword({ data: { currentPassword: current, password: value } });
        try {
          await purgeAccountDrafts();
        } catch {
          /* Retried by the root after redirect. */
        }
        window.location.assign("/auth");
      }
      setCurrent("");
      setValue("");
      setRepeat("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your account could not be updated. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-10 border-t border-rule pt-6" aria-labelledby="account-security-heading">
      <h2 id="account-security-heading" className="font-serif text-xl">
        Email &amp; password
      </h2>
      {query.isPending ? (
        <p role="status" className="mt-3 text-sm">
          Loading account details…
        </p>
      ) : query.error ? (
        <div className="mt-3 text-sm">
          <p role="alert">Account details could not load.</p>
          <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
            Retry account details
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-3 break-all text-sm">{query.data?.email}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.data?.confirmed
              ? "Email confirmed."
              : "Confirm your email so you can recover this account."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {!query.data?.confirmed && (
              <Button variant="outline" disabled={busy} onClick={() => act()}>
                Send confirmation email
              </Button>
            )}
            {(["email", "password"] as const).map((next) => (
              <Button
                key={next}
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setMode(next);
                  setCurrent("");
                  setValue("");
                  setRepeat("");
                  setError("");
                  setMessage("");
                }}
              >
                Change {next}
              </Button>
            ))}
            <Button
              variant="ghost"
              disabled={delivery.isFetching}
              onClick={() => delivery.refetch()}
            >
              {delivery.isFetching ? "Checking delivery…" : "Check email delivery"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await signOutAll();
                  await purgeAccountDrafts();
                  window.location.assign("/auth");
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Sign-out could not finish. Please retry.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sign out all devices and assistants
            </Button>
          </div>
          {delivery.isError || (delivery.data && !delivery.data.available) ? (
            <p role="status" className="mt-3 text-sm">
              Email delivery status is unavailable. Please try again later.
            </p>
          ) : delivery.data?.available ? (
            <div className="mt-3 text-sm" role="status">
              {delivery.data.events.length ? (
                <ul className="space-y-2">
                  {delivery.data.events.map((event, index) => (
                    <li key={`${event.timestamp}-${index}`}>
                      {event.event.replace(/[._-]/g, " ")} ·{" "}
                      {new Date(event.timestamp).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent delivery updates. Check your inbox and spam folder.</p>
              )}
            </div>
          ) : null}
          {delivery.data?.attempts.length ? (
            <ul className="mt-3 space-y-2 text-sm" aria-label="Recent email attempts">
              {delivery.data.attempts.map((attempt, index) => {
                let detail: { purpose?: string; status?: string } = {};
                try {
                  detail =
                    typeof attempt.detail === "string"
                      ? JSON.parse(attempt.detail)
                      : attempt.detail;
                } catch {
                  /* Invalid historical receipt. */
                }
                return (
                  <li key={`${attempt.created_at}-${index}`}>
                    {detail.purpose ?? "Account email"} · {detail.status ?? "Unknown"} ·{" "}
                    {new Date(attempt.created_at).toLocaleString()}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {mode && (
            <form onSubmit={act} className="mt-5 max-w-md space-y-4">
              <label className="block text-sm">
                Current password
                <input
                  className="pattern-mobile-field mt-2 min-h-11 w-full rounded-sm border border-muted-foreground bg-card px-3"
                  type="password"
                  enterKeyHint="done"
                  autoComplete="current-password"
                  required
                  maxLength={200}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                New {mode}
                <input
                  className="pattern-mobile-field mt-2 min-h-11 w-full rounded-sm border border-muted-foreground bg-card px-3"
                  type={mode === "email" ? "email" : "password"}
                  autoComplete={mode === "email" ? "email" : "new-password"}
                  required
                  minLength={mode === "password" ? 8 : undefined}
                  maxLength={200}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              {mode === "password" && (
                <label className="block text-sm">
                  Repeat new password
                  <input
                    className="pattern-mobile-field mt-2 min-h-11 w-full rounded-sm border border-muted-foreground bg-card px-3"
                    type="password"
                    enterKeyHint="done"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={200}
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value)}
                  />
                </label>
              )}
              <p className="text-sm text-muted-foreground">
                {mode === "password"
                  ? "Changing your password signs out every device and disconnects assistants. Sign in again with your new password."
                  : "We’ll email your new address a confirmation link. Confirming it signs out every device."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : mode === "email"
                      ? "Send email change link"
                      : "Save new password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setMode(null);
                    setCurrent("");
                    setValue("");
                    setRepeat("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
