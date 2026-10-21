import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { refreshMembership, retryBillingContention, unwrapBilling } from "@/lib/billing.functions";
import { userFacingError } from "@/lib/user-facing-error";

export const Route = createFileRoute("/_authenticated/membership/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id:
      typeof search["session_id"] === "string" &&
      /^cs_(test_|live_)?[A-Za-z0-9_]{1,240}$/.test(search["session_id"])
        ? search["session_id"]
        : "",
  }),
  head: () => ({
    meta: [
      { title: "Membership confirmation — Pattern" },
      { name: "description", content: "Check your Pattern Plus payment and chapter access." },
      { property: "og:title", content: "Membership confirmation — Pattern" },
      {
        property: "og:description",
        content: "Check your Pattern Plus payment and chapter access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembershipSuccess,
});
function MembershipSuccess() {
  const { session_id } = Route.useSearch(),
    { user } = Route.useRouteContext(),
    client = useQueryClient();
  const query = useQuery({
    queryKey: ["membership-checkout", user.userId, session_id],
    queryFn: async () =>
      unwrapBilling(await refreshMembership({ data: { sessionId: session_id } })),
    enabled: Boolean(session_id),
    // Checkout webhooks can hold the billing lease past the server's wait; nothing else retries.
    retry: retryBillingContention,
    retryDelay: (attempt) => 1500 * 2 ** attempt,
    refetchInterval: (query) =>
      query.state.data?.checkoutPending && query.state.dataUpdateCount < 20 ? 3000 : false,
  });
  useEffect(() => {
    if (query.data) {
      void client.invalidateQueries({ queryKey: ["membership"] });
      void client.invalidateQueries({ queryKey: ["feature-narrative"] });
    }
  }, [query.data, client]);
  return (
    <Shell>
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl">
          {query.data?.fullAccess ? "Your full chapters are ready" : "Confirming your membership"}
        </h1>
        {!session_id ? (
          <p role="alert" className="mt-4">
            This checkout link is incomplete. Check your membership in Context &amp; privacy.
          </p>
        ) : query.isPending ? (
          <p role="status" className="mt-4">
            Checking your payment with Stripe…
          </p>
        ) : query.error ? (
          <p role="alert" className="mt-4">
            {userFacingError(
              query.error,
              "We couldn’t confirm your payment yet. Check again, or manage your membership.",
            )}
          </p>
        ) : (
          <p role="status" className="mt-4">
            {query.data?.fullAccess
              ? query.data.membership?.status === "trialing"
                ? "Your 7-day Pattern Plus trial has started. Full chapters are unlocked."
                : "Your Pattern Plus payment is confirmed. Full chapters are unlocked."
              : "Your checkout has not finished processing. Check again in a moment."}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {query.data?.fullAccess ? (
            <Button asChild>
              <Link to="/pattern">Read your chapters</Link>
            </Button>
          ) : session_id ? (
            <Button disabled={query.isFetching} onClick={() => query.refetch()}>
              Check again
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/privacy">Manage membership</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
