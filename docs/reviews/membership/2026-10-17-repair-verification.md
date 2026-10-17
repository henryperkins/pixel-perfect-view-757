# Purchase and account repair verification

## Implemented

- Shared Stripe gateway transport, pinned Stripe 22.0.2 and embedded checkout (`embedded_page`); the app never returns a hosted checkout URL.
- Stable `plus_monthly` / `plus_yearly` lookup keys, existing-price preservation, customer ownership metadata, explicit provider errors and test/live notices.
- Environment-scoped D1 billing tables, settled recurring invoice-line coverage, 24-hour failed-renewal grace, affected invoice refund/dispute suspension, cancel/resume and pending-payment prorated interval changes.
- Verified-email purchase/link gating; failed resends preserve older links; confirmation does not consume a reset link; password recovery/change revokes member sessions and assistant links/grants; sign-out-all and security alert emails.
- Resumable deletion disables checkout, cancels subscriptions without refund and fences erasure against changed authorization.
- Managed webhook route with signature/environment validation, durable event references, bounded retry/dead-letter state and paginated signed reconciliation. Legacy webhook remains test-only compatibility.
- External Worker source no longer exports payment keys and includes opt-in reconciliation receipts; this source is not deployed under the no-production-publication directive.

## Verified with actual services

- Downloaded private pre-migration D1 SQL backup to sandbox temporary storage with owner-only permissions.
- Applied additive migration; user count stayed at 23; foreign-key check remained empty; both legacy test customer mappings were copied. Existing member content was not reset.
- Verified actual connected catalog amounts (800 / 7200 USD minor units), stable lookup keys and personal-use SaaS tax classification (`txcd_10103000`).
- Added sandbox webhook subscriptions for refunds, disputes, expired checkout and pending plan changes. The analytics webhook was not changed.
- Created an isolated account and inbox; received confirmation email, explicitly confirmed, signed in and opened actual embedded Stripe checkout.
- Attempted success-card trial (`4242 4242 4242 4242`). Stripe returned `Disposable emails are not permitted.` No trial or paid access was granted. This is not a completed payment test.
- Received recovery email, refreshed the recovery page before submitting, changed the password and signed in with the new password.
- Deleted that isolated account through the real UI; its open checkout was expired and sign-in with its old credentials failed. There was no completed subscription, so billed deletion is not end-to-end verified.
- Unsigned payment webhook returned 400; unsigned reconciliation returned 401.

## Automated checks

- 97 targeted membership, account, assistant, Worker, chapter and context-revocation tests passed.
- Changed application files passed lint after formatting. Latest preview build diagnostics reported `build OK`.
- A full-suite run reached 264 reported cases before the 600-second timeout. Its four entitlement-fixture regressions were corrected and rerun successfully in the targeted suites. The evaluation-build identity test invokes forbidden stateful Git commands and cannot run in this sandbox. Do not describe the entire suite as passed.

## Remaining blockers

1. Actual payment/trial readback, decline/3DS, cancel/resume/switch, settlement/renewal, refund/dispute and billed-deletion journeys need an owner-approved isolated account with a **non-disposable deliverable inbox**. Do not bypass Stripe's inbox restriction or change a real member.
2. External Worker source deployment and schedule activation are withheld: its existing production deployment and published app callbacks remain unchanged. Publish only after explicit owner approval; then deploy the Worker separately from a clean copy, remove old secret bindings and enable reconciliation against the approved origin/environment.
3. Real payments remain blocked by Stripe go-live form, live app installation, automatic key provisioning and readiness. No live payments or production publication occurred.
4. Existing Stripe billing portal configuration and invoices were not exercised with a successfully subscribed account.

## Preview checklist for the owner

1. Create an isolated account using a normal working inbox, confirm the email, then open Plans.
2. Use `4242 4242 4242 4242`, a future expiry, any three-digit CVC and a test name. Confirm the seven-day trial and chapter access survive reload. A free trial is not proof of settlement.
3. Use separate disposable **accounts with normal inboxes** for `4000 0000 0000 0002` (decline) and `4000 0025 0000 3155` (authentication). Confirm no duplicate membership or premature access.
4. In Context & privacy: switch monthly/yearly, complete any requested payment in billing details, cancel then resume, and inspect invoices/card details in the separate Stripe tab.
5. Use an authorized test clock or controlled test subscription for renewal. Verify settled invoice line dates, then a failed renewal: access stays for exactly 24 hours after prior coverage and then restricts.
6. Verify full refund/dispute suspends the affected coverage. Test reset/email-change link reuse, all-device sign-out and assistant revocation.
7. Delete only a subscribed disposable test account. Confirm billing stops immediately, no automatic refund occurs, and sign-in fails.

Full tax/fraud/dispute/transaction-support handling is enabled for eligible new subscription checkouts at +3.5% above standard Stripe fees, with LINK.COM* statements. Existing subscriptions are not converted in place.