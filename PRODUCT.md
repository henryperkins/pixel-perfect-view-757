# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two confirmed audiences, both individuals using Pattern for themselves:

- **Daily self-check reader** — opens Pattern once a day (typically morning, on a
  phone) for one grounded reading about the day, plus an optional reflection note.
- **Long-term pattern tracker** — returns over weeks and months, records check-ins
  and life events, and compares their own notes against long, slow cycles.

Not confirmed: professional astrologers, multi-user/shared accounts, client readings.

## Product Purpose

Pattern calculates a user's natal chart from birth date, time and place, then
describes the measurable angles today's sky forms to that chart. Every reading is
derived from those calculated values and shows the facts it rests on. Success is a
user who trusts the reading because they can see where it came from, and who keeps
returning without feeling they were told the future.

## Positioning

Two claims a normal horoscope app cannot truthfully copy:

1. **Every claim shows its math.** Orbs, phases, weights, house system, engine
   precision, birth-time uncertainty and source provenance are visible on the
   reading itself, not buried in an about page.
2. **Terrain, never prediction.** Cycles are windows that open, peak and close.
   Pattern describes conditions; it never states what will happen.

## Operating Context

- Mobile-first daily use; desktop used for the deeper Pattern, Timing and Content screens.
- Onboarding collects birth date, time (with an accuracy setting), and place.
- Unknown or approximate birth time is a normal, supported state, not an error.
- Admin operation exists for content releases: draft, publish, roll back, and a
  workflow-run ledger.

## Capabilities and Constraints

Confirmed capabilities:

- Natal chart calculation with a high-precision ephemeris service and a fail-soft
  approximate fallback; precision and degradation are surfaced to the user.
- Transit ("cycle") detection with ingress, exact pass, egress, phase and weight.
- Daily reading assembled deterministically from calculated facts, with an optional
  language layer that only rewords facts already computed and cites them.
- Journal-style life events, daily check-ins (mood, energy, and consent-gated sleep
  and stress bands), and reading feedback.
- Consent-tiered context sources with per-source permission, sensitivity and retention.
- Content releases with versioning, checksum, active pointer and rollback.

Constraints that future work must preserve:

- Sensitive user content (birth details, notes, journal labels, cached narratives)
  is stored encrypted; it is never returned or logged in plaintext beyond the
  signed-in owner's own responses.
- Birth-time uncertainty propagates: when houses or angles are unreliable, claims
  that depend on them are suppressed rather than softened.
- The language layer is never the source of truth and must fall back to template
  copy when verification fails.
- Self-reported wellness bands affect framing and prompts only; they never enter
  the calculation or the ranking.
- Cycle phase and strength are recomputed from the user's own natal positions, not
  read from stale cached rows.

- Pattern Plus is authorized at $8/month or $72/year with a seven-day free trial.
  This release uses Stripe test payments only; no real money is charged.
  Full natal essays require active trial or paid access; the free plan keeps chapter
  openings. Canceling renewal retains access through the current trial or paid
  period, then access ends. While Stripe collects a renewal, including the first
  payment after the trial, access continues for up to 24 hours past the period end;
  a failed payment ends it. Stripe's customer email follows the account email.
  Deleting the account cancels the membership immediately.

Undecided / not established: accounts beyond a single owner, notifications,
localisation, native apps.

## Brand Commitments

- Product name: **Pattern**.
- Voice: measured, precise, plain-spoken. No mysticism, no hype, no promises about
  outcomes. Technical values are shown as technical values.
- Existing visual world is committed and documented in DESIGN.md.

## Evidence on Hand

- Real calculation engine and live ephemeris service; readings are genuinely computed.
- Live content release records and workflow-run ledger.
- Sandbox prices and membership terms are confirmed by the owner and Stripe test configuration.
- No testimonials, customer names, benchmarks, press or usage numbers exist.
  Future work must not invent any of these.

## Product Principles

1. Show the working. A claim without visible provenance does not ship.
2. Name uncertainty out loud; an empty or suppressed result is a valid result.
3. Describe conditions, never outcomes.
4. Plain language on the surface, exact values one disclosure away.
5. The user's own words and data stay theirs: encrypted, consent-gated, deletable.

## Accessibility & Inclusion

Mobile-first layouts, keyboard-reachable controls, `aria-current` on active
navigation, `aria-busy` on loading regions, and `role="alert"` on failures are
already in use and are the expected floor for new work.
