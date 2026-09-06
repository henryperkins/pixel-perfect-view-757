# Release plan — R1 "Own your record"

Scope chosen with the user: finish the three open features. Written against
PRODUCT.md (product truth) and DESIGN.md (visual world). No new visual world.

## Goal

A daily self-check reader and a long-term tracker can both keep their own record:
their birth details are editable and visibly re-calculated, their daily check-in
really persists, and their written entries are tied to the cycles and chapters that
were live when they wrote them.

## Done already (shipped ahead of R1)

- Today's Timing block is computed live from the user's natal positions: phase, orb
  and weight are recalculated per request from the chart snapshot; stored cycle rows
  are a fallback only. Phase and strength are shown in plain language on `/today`
  with the exact values beside them, and `/timing` uses the same wording.

## R1.1 — Check-ins that provably persist

- Verify end to end against the live database that mood, energy and the consent-gated
  sleep/stress bands save and read back for a real signed-in account, including the
  180-day retention purge.
- Remove the temporary type casts in `src/lib/pattern.server.ts` left from the
  earlier database work.
- Surface a saved/last-updated state on the Today band pickers so the user can tell
  the write landed.
- Keep the constraint: bands change framing and prompts only, never ranking.

Done when: a fresh account can set all four bands, reload, see them, and see them
disappear after retention.

## R1.2 — Journal

- New `/journal` route: write an entry, list entries newest first, edit and delete.
- Entry body stored encrypted; a longer encrypted body field plus `cycle_key` and
  `feature_key` columns are added by migration.
- When writing, the entry can be attached to any of today's active cycles and to a
  Pattern chapter; the attachment is captured at write time so later recomputation
  never rewrites history.
- `/today` shows the entries written against today's cycles, under the Timing block.
- Empty state explains what the journal is for; no prompt implies a prediction.

Done when: an entry written from Today appears on both `/today` and `/journal` with
its cycle and chapter attachment intact after a recompute.

## R1.3 — Editable birth profile

- New `/birth-profile` route: view and edit date, time, time accuracy and place, with
  the same encryption path as onboarding.
- Saving re-derives the chart snapshot and states plainly what changed, including any
  change in precision or in whether house/angle claims are supported.
- `/pattern` gains a chart snapshot summary at the top: engine, precision, house
  system, time accuracy, and a link to edit.
- Unknown time stays a first-class option and continues to suppress angle claims.

Done when: changing the birth time changes the snapshot, the Pattern summary, and the
suppression state, all visible without a page reload trick.

## Cross-cutting acceptance

- Mobile-first at 390px before desktop; loading, empty and failure states for every
  new surface.
- Semantic tokens only; mono for every calculated value.
- No fabricated content of any kind (PRODUCT.md · Evidence on Hand).
- Typecheck and production build clean; each item verified against live data, not
  assumed.

## Explicitly out of scope for R1

Trust-and-clarity pass across all screens (candidate R2), notifications, sharing,
pricing, localisation.
