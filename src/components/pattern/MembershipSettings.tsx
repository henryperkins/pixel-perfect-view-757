import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/hooks/useMembership";
import { cancelMembership, openMembershipPortal, refreshMembership } from "@/lib/billing.functions";

export function MembershipSettings() {
  const query = useMembership(),
    client = useQueryClient();
  const [busy, setBusy] = useState(false),
    [confirmCancel, setConfirmCancel] = useState(false),
    [error, setError] = useState("");
  const state = query.data;
  async function act(action: "portal" | "cancel" | "refresh") {
    setBusy(true);
    setError("");
    try {
      if (action === "portal") window.location.assign((await openMembershipPortal()).url);
      else {
        if (action === "cancel") await cancelMembership();
        else await refreshMembership({ data: {} });
        setConfirmCancel(false);
        await Promise.all([
          client.invalidateQueries({ queryKey: ["membership"] }),
          client.invalidateQueries({ queryKey: ["feature-narrative"] }),
        ]);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Membership could not be updated. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-10 border-t border-rule pt-6" aria-labelledby="membership-heading">
      <h2 id="membership-heading" className="text-xl">
        Manage membership
      </h2>
      {query.isPending ? (
        <p role="status" className="mt-3 text-sm">
          Loading membership…
        </p>
      ) : query.error ? (
        <div role="alert" className="mt-3 text-sm">
          <p>Membership could not load.</p>
          <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
            Retry membership
          </Button>
        </div>
      ) : state ? (
        <>
          <p className="mt-3 text-sm">
            {!state.enabled
              ? "Membership payments are not available yet."
              : state.fullAccess
                ? state.membership?.status === "trialing"
                  ? "Your Pattern Plus trial is active."
                  : "Your Pattern Plus membership is active."
                : "You’re on the free plan. Chapter openings and your calculated chart remain available."}
          </p>
          {state.enabled && (
            <p className="mt-2 text-sm text-muted-foreground">
              Payments are in test mode. No real money is charged.
            </p>
          )}
          {state.renewalPending ? (
            <p className="mt-2 text-sm" role="status">
              Stripe is processing your renewal payment. Full chapters stay available while it
              completes.
            </p>
          ) : (
            state.paidThrough &&
            state.fullAccess && (
              <p className="mt-2 text-sm" role="status">
                {state.membership?.cancelAtPeriodEnd
                  ? "Renewal is canceled. Full chapters stay available until "
                  : "Full-chapter access through "}
                <time dateTime={state.paidThrough}>
                  {new Date(state.paidThrough).toLocaleString(undefined, {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </time>
                .{state.membership?.cancelAtPeriodEnd ? " Your membership will then end." : ""}
              </p>
            )
          )}
          {state.membership?.status === "past_due" && (
            <p role="alert" className="mt-3 text-sm">
              Your renewal payment failed. Update your payment method to continue your membership.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {!state.fullAccess && state.enabled && (
              <Button asChild>
                <Link to="/plans">View plans</Link>
              </Button>
            )}
            {state.hasCustomer && (
              <>
                <Button variant="outline" disabled={busy} onClick={() => act("portal")}>
                  Update card or billing details
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => act("refresh")}>
                  Refresh membership
                </Button>
              </>
            )}
            {state.fullAccess && state.enabled && !state.membership?.cancelAtPeriodEnd && (
              <Button variant="outline" disabled={busy} onClick={() => setConfirmCancel(true)}>
                Cancel membership
              </Button>
            )}
          </div>
          {confirmCancel && (
            <div
              className="mt-5 border border-rule p-4"
              role="group"
              aria-label="Confirm membership cancellation"
            >
              <p className="text-sm">
                Cancel renewal? You’ll keep full chapters until the end of your current trial or
                paid period.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button disabled={busy} onClick={() => act("cancel")}>
                  {busy ? "Canceling…" : "Confirm cancellation"}
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => setConfirmCancel(false)}>
                  Keep membership
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
