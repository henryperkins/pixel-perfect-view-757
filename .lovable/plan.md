# Repair purchases and account management

## Confirmed policies

- Switch monthly/yearly immediately with proration. Failed renewal keeps full access for 24 hours, then restricts it.
- Ordinary cancellation keeps access through the current trial/paid period; offer resume before it ends.
- Full refunds and disputes suspend the affected paid access. Deletion stops billing immediately without an automatic refund.
- Require verified email for purchases and assistant linking. Password reset/change revokes member sessions and assistant access.

## Defaults for unanswered details

Keep USD $8/month and $72/year before applicable tax, existing subscribers' original prices, and one seven-day trial per account. Recreated accounts remain eligible; do not introduce payment-method fingerprinting. Test purchases unlock preview only, never published production content. Pausing sales does not change paid entitlement.

For eligible new digital subscriptions from the confirmed US seller account, enable Stripe's full tax compliance, fraud, dispute and transaction-support handling. This adds **3.5% per transaction** above standard Stripe fees and uses **LINK.COM*** on bank statements. Supported buyer countries receive full tax handling; elsewhere the seller remains responsible for filing. Existing subscriptions cannot be converted to this handling in place.

## Work to deliver

1. **Connected payments and in-page checkout:** replace direct Stripe requests and Worker key export with the shared connected Stripe client; resolve customer ownership with `userId` metadata; render embedded checkout, explicit provider errors, test/live notices and a reliable payment-processing result.
2. **Reliable membership accounting:** isolate test/live records and idempotency; retain legacy test records safely; derive paid coverage from settled subscription invoice lines; explicitly handle unsupported catalog configurations, failed payments, refunds and disputes. Never extend access merely because a subscription period advances.
3. **Membership controls:** immediate prorated interval changes, payment-required outcomes, scheduled cancellation/resume, card updates in a separate tab, invoice access and accurate access-end display. Keep existing prices and full chapters during paid coverage; payment failure must not commit an unpaid change.
4. **Recovery and account protection:** enforce verification where selected; fix cross-purpose token invalidation and failed resend behavior; fix recovery-page refresh/sign-in outcomes and delivery troubleshooting; add security alerts and sign-out-all; revoke assistant access after password recovery/change. Address account enumeration and review existing attempt controls without inventing an unapproved new rate-limit service.
5. **Safe deletion and recovery:** make deletion a resumable, explicit operation; recheck account authorization before billing changes and preserve recoverable state on partial failure. Explain remaining Stripe records and the separate assistant identity in account/export/deletion screens.
6. **Billing operations:** durable signed event intake, idempotent processing, bounded/fenced per-account work, retry/dead-letter visibility and scheduled reconciliation using the existing external Worker. Remove the secret-export endpoint after the connected path is qualified.
7. **Verification:** add concrete policy regression tests and gateway/embedded contracts; exercise actual preview checkout, membership readback, cancellation/switching and account updates with isolated test accounts. Review changed-page metadata and preview diagnostics. Do not publish production.

## Technical approach and safe rollout

- Preserve TanStack Start, custom D1 member authentication, hosted delegated-assistant identities and the separately deployed Cloudflare Worker. No auth migration or member data reset.
- Pin the documented Stripe SDK/client versions; shared server transport must route only through Lovable's connected Stripe gateway. Every Stripe server function returns the explicit provider error on failure.
- Use `ui_mode: "embedded_page"`, `clientSecret`, `EmbeddedCheckoutProvider`/`EmbeddedCheckout`, and an ownership-checked return flow. Never use hosted checkout redirects or custom card inputs.
- Add environment-scoped D1 billing storage and migration/backfill, paid-invoice coverage records and durable event status. Back up and verify before applying external D1 changes. Retain compatible handling until existing sandbox mappings are reconciled.
- Add the managed webhook handler at `/api/public/payments/webhook`, validate signatures and environment, preserve existing delivery compatibility during transition, and update registered events through payment tools.
- Preserve source calculations, AI provider selection, privacy protections, encrypted readings and saved member records. Record structural decisions in project guidance.

## Preview test guide

1. Create an isolated account with a working inbox; confirm email and check free chapter openings.
2. Open monthly/yearly checkout inside Pattern. Use **4242 4242 4242 4242**, a future expiry and any three-digit CVC.
3. Confirm the seven-day trial and full chapter access survive reload. A trial is not evidence of a paid invoice: advance only an authorized sandbox test clock/test trial to verify settlement.
4. Test **4000 0000 0000 0002** for decline and **4000 0025 0000 3155** for required authentication. Confirm no duplicate subscription or premature access.
5. Switch interval, cancel/resume, update card and verify invoice/access readback. Exercise failed renewal and exact 24-hour grace with controlled sandbox time.
6. Receive and complete reset/email-change links, reject reuse, verify sign-out and assistant revocation. Delete only a disposable account and confirm its subscription stops.

## External blockers and completion standard

- **Real payments:** Stripe go-live form, live Lovable app installation/key provisioning and readiness remain incomplete. These require the owner's Stripe onboarding; repair preview first.
- **Email:** the previously tested recipient bounced and was suppressed. Successful verification/recovery testing requires a deliverable inbox; do not bypass suppression or invent delivery success.
- **External infrastructure:** qualify Worker access, deployment and D1 migration permissions before claiming operational completion. Report any unavailable access explicitly.
- Complete local tests and actual signed-in preview readback before claiming a flow works. Distinguish live readiness, external deployment and email delivery from source/test success.