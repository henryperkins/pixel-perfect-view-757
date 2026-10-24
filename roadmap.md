# Browsing refresh

## Standard Stripe checkout

- [x] Add Pattern sign-out outside checkout, including retry on failure and draft cleanup; Link and cards already enabled in sandbox/live default settings. Isolated desktop/mobile warning checks and 67 account/payment tests pass; build OK. Stripe exposes no merchant-controlled Link logout API, so Link-session logout remains unavailable, not implemented. Real returning-Link checkout verification and publication remain blocked as below.
- [x] Replace Link-required handling for new checkouts with automatic tax and optional eligible payment methods; expire older open Link-required sessions.
- [x] Run checkout regression tests (35 passed) and inspect preview diagnostics (build OK).
- [ ] Verify standard checkout with a signed-in returning Link buyer: needs an owner-approved isolated test account with a normal inbox; no real member or live payment was changed. Publish this subsequent checkout change only with explicit approval.

## Dependency security repair

- [ ] Resolve the remaining @lovable.dev/mcp-js advisory: updated to 3.1.1, but its exact SDK dependency still locks to 1.28.0; blocked on a compatible upstream release using SDK >=1.31.0, without forced versions.
- [x] Re-scan production dependencies (one remaining advisory), run 26 assistant regression tests (all passed), and check the automatic app build (build OK).

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

# Reading exploration remediation

- [x] Make the server chapter response authoritative for access, revalidate readable cached chapters on route return, and keep background membership/narrative failures non-blocking.
- [x] Validate and sanitize saved chapter citations at the persistence boundary, and render malformed or shortened evidence defensively.
- [x] Give citation targets a visible focus outline, correct heading levels and weights, and use plain accuracy and degraded-reason copy.
- [x] Remove the dead chapter-toggle column and guard saved transit sequences against incomplete evidence.

Verification: the remediation plan records the exact commands, fixtures and results in its Section 12. The focused Node suites, full `npm test`, typecheck, build, scoped lint, formatting and whitespace checks passed. The tracked `pattern-evidence` browser case file passed all 25 mounted lifecycle, focus, heading, layout, motion, Today copy and transit-sequence checks in WebKit 26.6 and bundled Chromium 155 at 390×844, 1440×1000 and 320×740 with 200% root text, including controlled-clock expiry and recorded chapter-request counts. Live billing, provider and database services were not exercised.

## Agent integrations (MCP)

- [ ] Revise MCP plan per the uploaded review (opt-in account link, delegated-token isolation, grants/revocation, saved-only readers, private-data exclusion)
- [ ] Implement approved revised plan

# Relocation map

## Chart engine comparison

- [ ] Add a reproducible known-chart comparison with independently generated reference data and explicit source/convention labels.
- [ ] Refine orbital latitude, sidereal rotation and line geometry; retain honest approximation limits.
- [ ] Run reference regression tests and verify comparison controls and layout in the browser.

- [x] Group angle-color filters with line meanings and nearby readings; filters also apply to crossings, with a visible line count and reset. Eight relocation tests, scoped lint and automatic build passed; isolated desktop/mobile browser checks verified combined filters and reset without overflow or browser errors. Live authenticated charts and map rendering were not reverified; no member records changed.
- [x] Compute planetary lines and relocated angles in-browser from saved placement longitudes and the chart's UTC instant; hide them when birth-time uncertainty suppresses angle claims.
- [x] Add the Mapbox world map with per-angle line colors, city search reusing the gateway geocode path, and nearby-line readouts.
- [x] Verify with a real chart in the preview: owner confirmed the page is functional (map, lines, city search, pin).
- [x] Place each planet's lines by its real ecliptic latitude at the birth instant (Moon up to ~5°, Pluto up to ~17°) instead of treating every planet as lying on the ecliptic.
- [x] Add the editorial layer: a reading for each nearby line, line crossings along the searched place's latitude, a "Reading the lines" guide, and history and context.
- [x] Add the Chart accuracy page (`/accuracy`, in the menu): the birth date, time and accuracy, timezone, place, coordinates and UTC instant the chart uses, the calculation source, and what the time accuracy supports.
- [x] Verify the orbit, editorial and accuracy changes in the build and on screen.
- [ ] Publish the relocation and chart accuracy surfaces to the live site: requires explicit publication approval.

Verification: production build, TypeScript, lint and formatting for the changed files, and the full Node suite (146 files, 1,327 tests) passed. Compared with the independent astronomy-engine ephemeris on three dates, every line falls within 0.03° of longitude; treating planets as lying on the ecliptic was off by up to 24° (Pluto's rising line at 60°N). Playwright drove the real Relocation map and Chart accuracy routes with synthetic chart data and the live Mapbox map at 390×844 and 1440×1000, light and dark: city readouts (Lisbon, Reykjavík, Sydney), line crossings, angle and planet toggles, guide disclosures, map-click selection, focus after choosing a city, menu and cross-page links, hidden lines for an unknown birth time, and accuracy states for exact, ~15-minute, ~1-hour, unknown and fallback charts. All 119 checks passed without console errors. Fixed during verification: verb agreement in line readings, a doubled "UTC" in the birth moment, a stale clock time shown for an unknown birth time (the chart uses noon), "±720 min" now reads "±12 h", raw engine identifiers replaced with plain labels, the sensitivity note now gives the chart's own rising-degree range, and focus is kept in the city field after choosing a place. The place geocoder was stubbed and live authenticated charts were not exercised.

