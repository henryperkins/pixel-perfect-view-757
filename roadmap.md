# Browsing refresh

## Dependency security repair
- [ ] Refresh compatible dependencies and confirm the lockfile resolves all reported vulnerabilities to fixed versions.
- [ ] Re-scan dependencies, run relevant regression tests, and check the app build.

## Purchase and account audit
- [x] Research current catalog, authentication, payments, account changes, entitlements, and renewals; document evidence and gaps in docs/reviews/membership/2026-10-17-audit.md (54 tests passed; live onboarding incomplete).
- [x] Resolve business-policy questions and present the repair plan for approval.
- [x] Implement connected embedded checkout, environment-scoped D1 billing migration, invoice coverage, plan changes, verification and recovery protections with regression tests.
- [x] Verify delivered confirmation and password recovery in the real preview; verify embedded checkout and signature protection; document test-card steps.
- [ ] Complete actual payment, cancellation, switching, renewal, refund/dispute and billed-deletion journeys: Stripe rejects disposable inboxes; needs an owner-approved isolated account with a non-disposable inbox.
- [ ] Deploy Worker secret-export removal and activate scheduled reconciliation: external production Worker deployment is withheld under the no-production-publishing instruction; published app callbacks are still old.
- [ ] Complete live Stripe onboarding, app installation and readiness: requires owner's Stripe onboarding.

- [x] Apply selected palette and typography.
- [x] Add fluid navigation, section reveals, and reading interactions without changing chart or reading logic.
- [x] Verify browsing and reduced-motion behavior; check page metadata.

# Chapter question and page checks

- [x] Ensure the closing reflection is a real question; refresh older chapters on opening and verify the rewritten Sun chapter.
- [x] Check Today and Timing on screen; placeholder, capitalized names and long-window wording verified (no brief window in today's data).

# Playful celestial browsing

- [x] Refresh shared navigation, safe transitions, and celestial identity.
- [x] Refresh landing, Today, chapter discovery, Timing filters, and Journal presentation without changing data logic.
- [x] Verify desktop/mobile, keyboard, menu, chapters, filters, reduced motion, and project diagnostics.

Verification: production build, TypeScript, and lint for the changed components passed. Browser checks used the actual page components with synthetic local data across 320, 390, 768, 1024, and 1920px widths; chapter navigation, filters, journal controls, keyboard navigation, and reduced motion passed with no browser errors. Live authentication and database persistence were not exercised.

# Timing exploration

- [x] Bring active windows forward with phase and area filters, one expanded reading, and previous/next browsing.
- [x] Keep fading active windows visible; use calculated dates for timeline markers and explicit fallbacks for incomplete ranges.
- [x] Keep calculation records accessible on demand; preserve visited details and respect keyboard focus and reduced motion.
- [x] Verify the Timing page and sync it to the connected Lovable branch.

Verification: production build, TypeScript, changed-component lint, formatting, and whitespace checks passed. Browser checks used the actual Timing components with synthetic local data at 320, 390, 768, 1024, 1440, and 1920px. Combined filters, reset, retained details, timeline positions, previous/next focus and sticky offsets, journal navigation, empty/loading/error states, missing dates, degraded precision, dark surfaces, 40-window results, keyboard controls, and reduced motion passed without console errors or warnings. Screenshots were reviewed against the previous layout. Live authenticated chart data and database persistence were not exercised.

# Time travel exploration

- [x] Add day/week/month/year date steps, quick jumps, and validated calendar input while keeping date controls available during calculation.
- [x] Reuse Timing's expandable windows with selected-day timelines, relative-day copy, and focus-following previous/next browsing.
- [x] Compare the same planet-to-point aspects against today without claiming continuous windows or historical closures; handle comparison and journal failures independently.
- [x] Show saved notes and marked moments separately from reconstructed results, with clear loading and limited-history states.
- [x] Verify the page and shared Timing behavior; sync to the connected Lovable branch.

Verification: production build, TypeScript, changed-component lint, formatting, and whitespace checks passed. Playwright exercised the real Time Travel and Timing components with synthetic cycle and journal data at 320, 390, 768, 1024, 1440, and 1920px. Date steps and quick jumps, month ends and leap years, valid input bounds, past/future labels, proportional timelines, saved context, retained details, keyboard focus, reduced motion, loading and out-of-order responses, independent retries, empty/incomplete/degraded results, 40-window browsing, and the shared Timing regression passed without browser errors or warnings. Light and dark screenshots were reviewed against the approved Timing design and the previous Time Travel page. Live authenticated charts and journal persistence were not exercised.

# Your Pattern exploration

- [x] Replace duplicate essay previews and the chart sidebar with a centered chapter reader in the approved celestial style.
- [x] Add factual chapter-type filters and previous/next browsing with retained narratives, evidence, and keyboard focus.
- [x] Keep verified essay and reflection text intact; request only the first reading initially and add independent chart/chapter retries.
- [x] Fold the rising lens, placements, complete calculated connections, and birth/calculation record into optional native disclosures.
- [x] Show numeric connection orbs and the correct 150° quincunx glyph; preserve precision notices and suppress unreliable houses.
- [x] Verify responsive layouts, dark surfaces, keyboard controls, and reduced motion; sync to the connected Lovable branch.

Verification: production build, TypeScript, changed-component lint, formatting, and whitespace checks passed. Playwright exercised the actual Your Pattern route and components with synthetic chart/narrative fixtures at 320, 390, 768, 1024, 1440, and 1920px. Chapter filters, retained readings and evidence, previous/next focus and sticky-header offsets, complete connection filtering and numeric orbs, journal/source/birth navigation, loading and late responses, independent retries, missing/empty/single/uncertain/degraded data, unfamiliar categories, 42-chapter long-content browsing, keyboard controls, and reduced motion passed without browser errors or warnings. Light and dark screenshots were compared with the approved Timing design and the previous Your Pattern page. Live authenticated charts and database persistence were not exercised.

## Agent integrations (MCP)
- [ ] Revise MCP plan per the uploaded review (opt-in account link, delegated-token isolation, grants/revocation, saved-only readers, private-data exclusion)
- [ ] Implement approved revised plan
