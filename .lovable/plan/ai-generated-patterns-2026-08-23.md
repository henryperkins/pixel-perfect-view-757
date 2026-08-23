# AI-generated patterns

Add a language layer on top of the existing deterministic engine. The calculation never changes: AI only rewrites wording from facts that are already computed, and anything it writes that isn't backed by an injected fact is discarded.

## What gets generated

1. **Today's reading prose** — headline, body paragraphs and reflection prompt, generated on demand from the day's calculated cycles.
2. **Natal chapter prose** — a short narrative per detected structure on Your pattern, generated when a chapter is opened.
3. **Interpretation content bundles** — an admin action on Content that drafts a full release (per family/feature copy) with AI, shows a diff-style review, and publishes it as a new version once approved.

## Fact discipline (strict)

- The model receives only a structured fact block: bodies, aspect, orb, phase, exact date, house (omitted when houses are suppressed), birth-time accuracy, and permitted context flags. No birth details, no notes, no raw user text.
- The model must return, per paragraph, the fact ids it used. Any paragraph citing an id that wasn't injected is dropped.
- Output passes through the existing DER-22 safety pass; predictive, medical, legal and financial phrasing is stripped exactly as today.
- If the result is empty after filtering, or the model call fails or is rate-limited, the reading falls back to the current template copy and is labelled as such — never a blank screen or an error page.
- Wellness bands (Tier 3) stay framing-only: they can shift tone and prompt, never enter a claim.

## Where it shows in the UI

- Today: prose reads as it does now; the Reading rail gains a `Language` field showing `model` or `template`. The evidence panel gains a "Language layer" row naming the model and the fact ids each paragraph cited.
- Your pattern: opening a chapter shows the narrative above the existing JSON payload, with the same fallback labelling.
- Content: a "Draft release with AI" action, a review screen listing generated entries against the current active release, then Publish (creates a new version) or Discard. Existing rollback keeps working.

## Caching and cost

- Generated reading prose is stored with the reading row, so a day is generated once per user and re-reads are instant.
- Chapter narratives are cached per feature key + chart snapshot.
- Bundle drafts are generated once per admin action, not per page view.
- Generation runs server-side only; failures degrade to template copy rather than blocking.

## Technical notes

- New `src/lib/ai/language.server.ts` calling the Lovable AI Gateway with a strict JSON schema (paragraphs + cited fact ids + headline + prompt), no client-side key exposure, no artificial timeouts.
- New `src/lib/ai/facts.ts` builds the injected fact block from `Chart` and `CycleInstance[]` and returns the id set used for verification.
- `assembleReading` in `src/lib/reading.server.ts` keeps producing the deterministic reading; the AI pass wraps it and reuses its provenance entries, adding a `content`-lane entry for the language layer.
- D1 migration: add `language_mode`, `language_model` and generated-text columns to `daily_readings`, plus a `feature_narratives` cache table (with grants/indexes consistent with the existing schema).
- Server functions extended in `src/lib/pattern.functions.ts`: reading generation happens inside the existing `fetchToday` path; new `fetchFeatureNarrative` and admin-gated `draftRelease` / `publishDraftRelease`.
- Bundle drafting reuses the existing release ingestion path so a published AI draft is an ordinary content release, rollback included.
