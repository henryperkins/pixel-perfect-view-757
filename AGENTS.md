<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Natal houses, angles and aspects come from the Swiss Ephemeris service response (Placidus); in-app math is only the degraded fallback and fills angle contacts the service omits. Why: Pattern must reflect real chart sources.
- Shared browsing motion belongs in the Shell and global motion styles, with reduced-motion overrides; page controls remain in the existing Button system. Section observers animate already-visible content once, never hide it; chapter panels retain visited content while collapsing. Why: asynchronous readings stay accessible and exploration does not replay or refetch on close.
- Natal essays use a dedicated reflection-question field validated independently from the essay, with a safe question fallback and versioned cache invalidation. Why: chapter titles and writing instructions must never appear as reflection questions.
- Member readings and natal chapters use Gemini Enterprise when `GEMINI_ENTERPRISE_API_KEY` is configured, otherwise the Lovable gateway; `PATTERN_MEMBER_LANGUAGE_PROVIDER` can explicitly select either. A request selects one provider and is never retried through another. `/content` keeps its independent admin provider selection, and each provider records its own model identity. Why: the operator authorized Gemini Enterprise for member writing on 2026-10-13; Privacy names both serving paths, and evaluation reports must not mix them.
- Synthetic evaluation runs on the server: the `pattern-workflows` Worker (source in `edge/pattern-workflows/`, deployed separately with wrangler from a copy outside the app tree) runs one Workflow per run and calls the signed `/api/public/evaluation-step` endpoint per case; runs store only `evaluation_runs`/`evaluation_results`. Why: a run must survive the admin leaving `/content`, and model requests are never retried.
- Billing uses the shared gateway Stripe client, build-token environment, embedded checkout and environment-scoped D1 v2 tables; legacy billing tables remain rollback-only. Why: preview purchases cannot grant live access or expose provider keys.
- Shared account sign-out uses AccountSignOutButton outside the Stripe frame, retaining server-session revocation and local draft cleanup; it never claims to clear a Link session. Why: provider-account restrictions must not trap buyers in their Pattern account.
- Open checkout reuse requires the current checkout-policy marker, with policy-scoped creation idempotency keys; older open sessions expire before replacement. Why: returning buyers must not remain trapped in superseded payment handling.
- Paid coverage comes from settled recurring invoice lines, with suspension recorded by invoice; account writes use an independent renewable billing lease fence. Why: subscription period changes and concurrent requests must not manufacture paid access.
- Managed payment webhooks use `/api/public/payments/webhook` with verified Stripe signatures; signed reconciliation persists event references and retries without storing card data. Why: delayed or repeated deliveries require durable recovery.
