# Pattern-Like Astrology App — Web MVP

Building the web product surface from spec v0.2 — including the normative `platform_topology` and `data_source_registry` YAMLs (139 sources, 54 assigned to launch, 24 permanently excluded) — with a real backend, an in-app approximate ephemeris, and a signed content-release ingestion endpoint that an external WordPress editorial plane can publish into.

Out of scope for this build (in the topology but not buildable here): Cloudflare Workflows/Queues/D1/R2, the Swiss Ephemeris OCI container, the Fly.io Machines mirror and Managed Postgres target, native iOS/Android clients, push notifications, and the WordPress plugin itself.

## Design direction

Scientific editorial. Warm off-white canvas (`hsl(40 20% 97%)`), near-black ink, slate-blue accent, hairline borders. Lora serif for interpretations, Inter for controls, JetBrains Mono for evidence and technical labels. 12-column layout: metadata rail, reading column, technical rail. Motion limited to a 600ms fade-and-rise on load and the inline evidence expansion. All values become semantic tokens in `src/styles.css` (oklch); no hardcoded color utilities in components.

## Screens

1. **Onboarding** — birth date, birth time with an accuracy class (exact / approximate / unknown), birthplace with coordinate + historical timezone resolution. Unknown time is first-class: houses, angles, and fast-Moon claims get suppressed or labelled, and the user sees an uncertainty report.
2. **Today** (`/`) — one primary theme in long-form prose, at most one supporting influence, a phase-state strip (approaching / exact / integrating) with exact-pass dates, a reflection prompt with save, and the inline "Evidence & Provenance" expansion listing each row's bodies, aspect, orb, exact date, and a lane label (Celestial Fact / Your Context). Never blank: deterministic fallback copy always renders.
3. **Your Pattern** — natal pattern chapters derived from the chart, each openable to its supporting facts and counter-expression. Gaps stay visibly empty rather than filled with generic sun-sign copy.
4. **Timing** — active and upcoming cycles with start, exact passes, end, phase, and filters by domain and duration; shows calculation status and last refresh.
5. **Time Travel** — reconstruct cycle state for any chosen date and compare it to today, distinguishing saved context from retrospective reconstruction.
6. **Context & Privacy** — enabled signal sources with their allowed uses and freshness, pause/revoke, personalization reset, export request, and account deletion.
7. **Auth** — email sign-in via Lovable Cloud.

## Calculation

An in-app ephemeris module computes geocentric longitudes for Sun through Pluto plus the lunar nodes using analytical (VSOP-style) series, accurate to roughly arc-minutes. It sits behind a versioned calculation contract — `calcEngine` and `contractVersion` recorded on every snapshot — so a real Swiss Ephemeris service can replace it later without touching the reading layer.

Derived from that: natal aspects with orb rules, houses/angles when birth time is known, transit-to-natal cycle instances with ingress, exact passes (including retrograde multi-pass), egress, and phase state. Chart snapshots are immutable and fingerprinted; regenerating an identical input yields an identical fingerprint.

## Reading assembly

Deterministic only. Eligibility filters content to what the calculated facts and the uncertainty class actually support, ranking picks one major theme and at most one supporting influence, and assembly stitches approved fragments. A validation pass rejects any paragraph without a resolvable fact plus content version, and rejects fatalistic, diagnostic, or prediction-shaped output — a rejected candidate falls back to reviewed deterministic copy. Every paragraph writes provenance rows so the evidence drawer is generated, not authored. No LLM in this build.

## Content ingestion

Content lives in `content_releases` and is published by an external editorial system, not authored in-app:

- `POST /api/public/content-releases` accepts a signed JSON bundle, verifies an HMAC signature against a stored secret with a timing-safe compare, validates the content graph and semantic version, stores the release as inactive, runs fixture smoke tests, then atomically activates the release pointer.
- A rollback endpoint moves the pointer back to a prior release without touching published readings.
- Until a real bundle is posted, a seed migration inserts one signed baseline release (pattern families, cycle interpretations, phase variants, domain modifiers, reflection prompts, safety rules) so every screen has real content from first load.

## Data and privacy

Lovable Cloud (Postgres) with RLS on every table, each row owned by `auth.uid()`; content releases are readable by all authenticated users and writable only by the service role. Tables: `profiles`, `consents`, `birth_profiles`, `chart_snapshots`, `natal_features`, `cycle_instances`, `context_signals`, `content_releases`, `daily_readings`, `reading_sources`, `reading_feedback`, `check_ins`, `audit_events`. Every table gets explicit grants alongside its policies.

Sensitive fields (birth values, reflection text, generated prose) are stored as ciphertext under a per-user data-encryption key, wrapped by a root key held as a server secret; deletion destroys the wrapped key and the active rows. Mutating endpoints take an idempotency key enforced by a unique constraint, so a retried daily-reading job cannot produce a duplicate.

## Technical notes

- TanStack Start. Routes under `src/routes`; authenticated surfaces under `_authenticated`. Reads go through route loaders with `ensureQueryData` plus `useSuspenseQuery`.
- Calculation, reading assembly, validation, and crypto live in server functions (`*.functions.ts` wrappers over `*.server.ts` logic) — no ephemeris or key material reaches the client bundle.
- The public ingestion route lives at `src/routes/api/public/content-releases.ts` and verifies its own caller.
- Fonts load via `<link>` in `__root.tsx`. Each route gets its own `head()` with a unique title and description.

## Build order

1. Cloud enabled, schema + RLS + grants, encryption helpers, design tokens and app shell.
2. Onboarding, ephemeris module, chart snapshot, uncertainty report.
3. Content release schema, ingestion endpoint, seeded baseline release.
4. Cycle detection, deterministic reading assembly, validation, Today with evidence.
5. Your Pattern, Timing, Time Travel.
6. Context & Privacy: sources, check-ins, feedback, export, deletion.
