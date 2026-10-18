# Membership go-live check — 2026-10-17

Read-only checks between about 22:15 and 23:50 UTC, after the sandbox end-to-end run (webhook events 20:39–22:03 UTC). Nothing in Stripe, Cloudflare, D1 or Lovable was changed. A reviewer and a skeptic independently re-checked each claim below against live reads and the code.

## Billing lease contention

The sandbox run showed more than the confirmation-page error. At 22:33 UTC, 11 of the 16 sandbox webhook events in `billing_events_v2` were still `pending` (`attempts` 1–2), and Stripe reported each of them undelivered:

- At checkout, `customer.subscription.created`, `invoice.paid` and `checkout.session.completed` arrived within 10 ms. Only the first got the per-member lease; `checkout.session.completed` succeeded on a later delivery and `invoice.paid` failed twice.
- Each of the four interval switches left its `customer.subscription.updated` and proration `invoice.paid` pending. The cancel and the resume each left their `customer.subscription.updated` pending. In every case the in-app action held the lease while Stripe sent those webhooks, and the webhook route answered 500.
- `/membership/success` hit the same lease and stopped, because its query had `retry: false`.

Member state stayed correct because each lease holder re-read Stripe after the change. The 11 events belonged to the deleted test account, and Stripe's sandbox retries marked them processed between 22:49 and 22:59 UTC without a sync. In live mode, the same pattern makes checkouts, plan changes, cancellations and resumptions produce failed deliveries for Stripe to retry. Renewals do not, because the renewal's `invoice.paid` arrives about an hour after its `customer.subscription.updated`.

## Fix on `fix/billing-lock-wait-20261017`

- **Lock queueing:** `withBillingLock` queues behind the current holder for up to 10 s, polling with jittered backoff, then throws `BillingBusyError`. Webhooks, checkout, the portal, plan changes, confirmation, deletion and the email-change Stripe update all queue. Nightly reconciliation defers a busy member instead.
- **Coalescing:** a full member sync marks that member's pending webhook events as processed if they were received before its Stripe reads began. A queued webhook whose event is already settled skips its own sync. Refund and dispute events are excluded, because they also suspend coverage. A plan change's final sync also settles the webhooks that change sends.
- **Incremental sync:** a sync reads line items only for paid invoices it has not recorded, since a paid invoice's lines are final. Before this change, every sync re-read every paid invoice, so each lease hold grew with the member's billing history. The review measured a 2.55 s sync for a single invoice. During a plan change, a webhook exceeded the 10 s wait in 6 of 9 simulated runs at 5 paid invoices, and in every run at 8 or more.
- **Plan changes:** a successful plan change syncs once instead of twice.
- **Failure handling:** a failed or timed-out attempt no longer marks an event pending again once another sync has settled it, and it answers success.
- **Retries:** server functions mark only `BillingBusyError` as retryable, and the confirmation page retries just that error twice before showing it.
- **Reconciliation pages:** a page stops starting new work after 30 s, always reaches at least one member, and returns a cursor for the rest. This keeps each page inside the Worker's 60 s request timeout.
- **Worker:** the `pattern-workflows` scheduled handler starts retention before reconciliation, logs a reconciliation failure instead of skipping retention, and logs `billing-reconcile-disabled` when its variables are missing.

## Live state

- **The published site is already in live billing mode.** Lovable committed `.env.production` with a `pk_live_51UPyS…` token in `7c11378` (23:06 UTC), and the checkout bundle served from `patterns.lakefrontdigital.io` contains that key. The published build still runs `main`'s fail-fast lease. D1 has no live events, customers or memberships yet.
- **Worker:** `pattern-workflows` deployment `83d5bb00` (21:07:45 UTC, version `548c4a3c`, "Deploy pattern-workflows from a97dcef: gateway billing recovery") already returns no keys from `/billing/config` and contains the reconciliation handler. Its rollback target is version `34dfd849`, deployed 2026-10-15.
- **Worker secrets:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are unused leftovers. `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`, `STRIPE_PORTAL_CONFIGURATION_ID` and `PATTERN_MEMBERSHIPS_ENABLED` are read only by `/billing/config`, which the app no longer calls. No secret named `STRIPE_SANDBOX_SECRET_KEY`, `STRIPE_LIVE_SECRET_KEY`, `STRIPE_SANDBOX_WEBHOOK_SECRET` or `STRIPE_LIVE_WEBHOOK_SECRET` exists in any version.
- **Schedule:** the only cron is `0 3 * * *` (daily, 03:00 UTC), not every six hours. Workers Logs has the Worker's fetch traffic on 2026-10-14 and 2026-10-15 but no scheduled invocation, so the trigger did not fire on those days. Retention instances and receipts are also missing for 10-13 through 10-15. It has fired daily since the 10-15 deploy. The cause is unknown.
- **Reconciliation:** `PATTERN_BILLING_RECONCILE_URL` and `PATTERN_BILLING_ENVIRONMENT` are unset, so reconciliation has never run. `/api/public/billing-reconcile` answers an unsigned POST with 401; `/api/public/payments/reconcile` returns 404.
- **Sandbox webhook endpoints:**
  - `we_1UPyRCHYccNXSrnHh5C1OIiD` (Lovable-managed) is the one processing app events. It targets the dev preview host `project--16964b03-…-dev.lovable.app/api/public/payments/webhook?env=sandbox`, not `patterns.lakefrontdigital.io`.
  - `we_1UPyRDHYccNXSrnHcNzaV7yr` is Lovable's own relay.
  - Legacy `we_1UQ0aHHYccNXSrnH7jh0RFvE` (`patterns.lakefrontdigital.io/api/public/stripe-webhook`) processed deliveries on 10-13. It has failed every delivery since `432dc74` (10-17), which switched the route's signature check to the managed endpoint's secret.
- **App environment names the code reads:**
  - The build-time `VITE_PAYMENTS_CLIENT_TOKEN`. A `pk_live_…` value switches the whole published build to live.
  - `STRIPE_LIVE_API_KEY`, `PAYMENTS_LIVE_WEBHOOK_SECRET` and `LOVABLE_API_KEY`.
  - `PATTERN_MEMBERSHIPS_ENABLED`. Any value other than `false` allows checkout, and `false` pauses sales without removing paid access.
  - Optionally, `STRIPE_LIVE_PORTAL_CONFIGURATION_ID`.
  - It does not read `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET`.

## Corrected go-live order

Each step needs owner approval. Live Stripe was not readable from here, so its activation, catalog and endpoint are unverified.

1. Merge this branch to `main` and publish the Lovable project. The published site is already live, so this should happen before the first real checkout. Until steps 3–5 are confirmed, setting `PATTERN_MEMBERSHIPS_ENABLED=false` in the app environment turns off checkout without affecting anyone's access.
2. Deploy the Worker from a copy of `edge/pattern-workflows/` outside the app tree (`npx wrangler deploy`), recording rollback version `548c4a3c`. Then run `npx wrangler secret delete STRIPE_SECRET_KEY` and `npx wrangler secret delete STRIPE_WEBHOOK_SECRET`; each delete deploys a new version. A later change can remove `/billing/config` along with the four secrets only it reads.
3. Confirm Stripe live activation and the live Lovable install, and that the app environment has `STRIPE_LIVE_API_KEY`, `PAYMENTS_LIVE_WEBHOOK_SECRET`, `LOVABLE_API_KEY`, and either no `PATTERN_MEMBERSHIPS_ENABLED` or a value other than `false`.
4. In the live catalog, check that the active prices exist in Stripe's minor units:
   - `plus_monthly`: `unit_amount` 800 USD cents (US$8.00) per month.
   - `plus_yearly`: `unit_amount` 7200 USD cents (US$72.00) per year.

   Checkout refuses any other shape. Also check tax code `txcd_10103000` for Managed Payments.
5. Check the live webhook endpoint:
   - Its host must be the published app and its URL must end in `?env=live`.
   - It should subscribe to the same 15 events as `we_1UPyRC…`.
   - Leave out `invoice.payment_succeeded`, which only duplicates `invoice.paid`.
6. Enable reconciliation only after step 2. Set `PATTERN_BILLING_RECONCILE_URL` to `https://patterns.lakefrontdigital.io/api/public/billing-reconcile` and `PATTERN_BILLING_ENVIRONMENT` to `live`, either way:
   - With `npx wrangler secret put`, which survives every deploy.
   - In `vars` in the repo's `edge/pattern-workflows/wrangler.jsonc`, so the external copy carries them.

   Variables set only in the dashboard or the external copy are erased by the next `wrangler deploy`. After each 03:00 UTC run, check that the `at` time in `operations/billing/latest.json` in R2 is current. The trigger skipped two days this week without any error.
7. Delete the failing legacy sandbox endpoint `we_1UQ0aHHYccNXSrnH7jh0RFvE`.
