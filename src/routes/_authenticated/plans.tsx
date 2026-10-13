import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/hooks/useMembership";
import { startCheckout } from "@/lib/billing.functions";
import type { MembershipPlan } from "@/lib/billing-policy";

export const Route = createFileRoute("/_authenticated/plans")({
  validateSearch: (search: Record<string, unknown>): { canceled?: boolean } => ({
    canceled: search["canceled"] === true || search["canceled"] === "true",
  }),
  head: () => ({ meta: [{ title: "Plans — Pattern" }] }),
  component: PlansPage,
});
function PlansPage() {
  const query = useMembership(),
    { canceled } = Route.useSearch();
  const [busy, setBusy] = useState<MembershipPlan | null>(null),
    [error, setError] = useState("");
  const state = query.data,
    hasMembership =
      state?.enabled &&
      state?.membership &&
      !["canceled", "incomplete_expired"].includes(state.membership.status);
  async function checkout(plan: MembershipPlan) {
    setBusy(plan);
    setError("");
    try {
      window.location.assign((await startCheckout({ data: { plan } })).url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout could not open. Please try again.");
      setBusy(null);
    }
  }
  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl">Go deeper with Pattern Plus</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Read every chapter of your natal pattern, with its calculated evidence and a question to
          reflect on.
        </p>
        <p className="mt-4 text-sm">
          Your chart, daily reading, journal and chapter openings remain available on the free plan.
        </p>
        <div className="mt-6 border-y border-rule py-4 text-sm">
          <p>Test payments only. No real money is charged.</p>
          <p className="mt-2 text-muted-foreground">
            {state?.trialEligible === false
              ? "You’ve used your free trial. Your next membership starts with a payment."
              : "Start with 7 days free. A card is required. Your plan renews automatically after the trial unless you cancel."}{" "}
            Cancel in Context &amp; privacy; access lasts through your current trial or paid period.
          </p>
        </div>
        {canceled && (
          <p role="status" className="mt-4 text-sm">
            Checkout was closed. Your membership has not changed.
          </p>
        )}
        {query.isPending ? (
          <p role="status" className="mt-6">
            Loading plans…
          </p>
        ) : query.error ? (
          <div role="alert" className="mt-6">
            <p>Plans could not load.</p>
            <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
              Retry plans
            </Button>
          </div>
        ) : hasMembership ? (
          <div className="mt-8">
            <p>You already have a Pattern Plus membership.</p>
            <Button asChild className="mt-4">
              <Link to="/privacy">Manage membership</Link>
            </Button>
          </div>
        ) : (
          <>
            {!state?.checkoutReady && (
              <p role="status" className="mt-6 text-sm">
                Checkout is being prepared. Please try again later.
              </p>
            )}
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              {(["month", "year"] as const).map((plan) => (
                <section
                  key={plan}
                  className="border-t border-rule pt-5"
                  aria-labelledby={`plan-${plan}`}
                >
                  <h2 id={`plan-${plan}`} className="text-xl">
                    {plan === "month" ? "Monthly" : "Yearly"}
                  </h2>
                  <p className="mt-3">
                    <span className="font-mono text-3xl">${plan === "month" ? "8" : "72"}</span>
                    <span className="ml-2 text-sm text-muted-foreground">/ {plan}</span>
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {plan === "month"
                      ? state?.trialEligible === false
                        ? "Billed monthly, starting today."
                        : "Billed monthly after your trial."
                      : "$6 per month, billed as $72 each year."}
                  </p>
                  <Button
                    className="mt-6 w-full"
                    disabled={Boolean(busy) || !state?.checkoutReady}
                    onClick={() => checkout(plan)}
                  >
                    {busy === plan
                      ? "Opening checkout…"
                      : `Choose $${plan === "month" ? "8/month" : "72/year"}`}
                  </Button>
                </section>
              ))}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="mt-10 text-sm text-muted-foreground">
          Checkout and card updates are handled by Stripe. Pattern does not store your card number.
        </p>
      </div>
    </Shell>
  );
}
