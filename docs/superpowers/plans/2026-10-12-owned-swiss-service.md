# Owned Swiss Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Host an isolated, source-qualified Swiss chart and transit-episode API and connect the approved natal/transit release when its numerical and deployment checks pass.

**Architecture:** A standalone Node service in `services/swiss-ephemeris` reuses the existing calculator's pinned Swiss version, file hashes and native binding. It owns its entire AGPL source distribution and imports no proprietary app modules. The app keeps its existing strict HTTP contracts, encrypted anchors, explicit birth recalculation and failure behavior. An independent dense reference enumerator qualifies the new solver before deployment or activation.

**Tech Stack:** Node 22, `sweph@2.10.3-7`, native Swiss 2.10.03, Node test runner, Docker, Fly.io, existing TanStack app and D1.

**Spec:** `docs/superpowers/specs/2026-10-11-daily-reading-transit-story-design.md`; approved feasibility at `docs/reviews/daily-transit-story/2026-10-12-owned-service-feasibility.md`.

## Global Constraints

- Preserve the existing `patternlike-calc` deployment and unrelated dirty primary checkout.
- Swiss `2.10.03`, binding `2.10.3-7`, returned flags exactly 258, tropical apparent geocentric true equinox of date; explicit UTC-to-UT conversion.
- Verify `sepl_18.se1` and `semo_18.se1` against the existing owned manifest hashes; identity includes those actual bytes and calculation settings.
- Placidus natal houses; any Porphyry fallback is explicit and excludes house/angle evidence requiring Placidus.
- Episode contract `swiss-transit-episode/1`, solver `transit-episode-1`, anchor `transit-anchor-1`; retain all current wire/proof validation.
- Start at ±400 days, expand unresolved sides by 200 to at most ±1,460; half-day initial scan, analytic speeds, at most 20,000 unique positions and four seconds calculation time.
- Brackets at most 60 seconds; root residual at most 0.000001 degrees; station speed at most 0.0000001 degrees/day; station within 0.001 degrees of target suppresses counts.
- Per sample at most 16 contacts/components, 40 stations, 41 legs and 32 windows. Wire output at most 128 KiB. No request/response body logs or persistent personal calculation cache.
- At least 15 independently enumerated dense Swiss tracks, all five bodies; compare every root/station/window edge within five minutes and match count/direction/closure.
- Normal Git history only. Existing writing evidence is retained; no new model calls are needed for numerical work.
- Approval on 2026-10-12 authorizes implementation and isolated hosting. Existing authorization covers ordinary push and joint release after readiness checks; no additional architecture approval is required.

## Review Focus

- Source changes, missing files and native fallback must never produce qualified metadata (Task 1).
- UTC conversion, wraparound and birth-time boundary samples must preserve the same physical source (Tasks 1, 3).
- Nearby double roots, station tangencies, separate windows and outer scan contacts must never become false complete counts (Tasks 2, 3).
- Authentication, body limits, timeouts, overload and native-process lifecycle must keep requests bounded without logging personal inputs (Tasks 1, 4).
- Old AstroWay charts and archived readings must retain their original source; migration uses the owner's explicit recalculation path (Tasks 4, 5).

### Task 1: Pinned engine and independent chart API

**Files:** Create `services/swiss-ephemeris/{package.json,package-lock.json,ephemeris.lock.json,LICENSE,NOTICE,.gitignore}`, `src/{engine,contract}.mjs`, `scripts/download-ephemeris.mjs`, and `tests/engine.test.mjs`.

**Interfaces:** `createEngine({ephemerisPath})` returns `{source, sourceId, coverage, metadata, position(body, utcMillis), chart(request)}`. `position` returns finite normalized longitude, latitude and analytic speed; throws a closed source/range error when unavailable. `chart` accepts the app's existing UTC `date/time/timezoneOffset/latitude/longitude` request and returns its supported `data.planets/houses/aspects/meta/positionSource` shape.

- [x] Write behavior tests for actual synthetic chart geometry, UTC conversion, explicit Placidus/fallback, invalid dates/coordinates and file tampering.
- [x] Run `npm test --prefix services/swiss-ephemeris`; observe the absent engine failing.
- [x] Implement pinned installation/download verification, source identity, source-qualified positions and full chart response without importing app code.
- [x] Run engine tests; expected all pass and no hidden Moshier fallback.
- [x] Commit only the service files and this plan.

### Task 2: Complete transit-episode solver

**Files:** Create `services/swiss-ephemeris/src/{track,episodes}.mjs` and `tests/episodes.test.mjs`; create `tests/owned-swiss-service.test.mjs` for app wire/proof integration.

**Interfaces:** `solveEpisodes(request, engine, {now?, maxEvaluations?, maxDurationMs?}?)` returns a strict scan or throws a closed limit/source error. `engine.position` is the sole geometric source. The returned scan echoes the exact validated request; diagnostics stay outside it.

- [x] Write analytic tests for one/three/five crossings, both branches, wraparound, exact stationary targets, multiple orb windows, unresolved closure and calculation/output limits.
- [x] Run solver tests to establish failures before implementation.
- [x] Implement shared cached sampling, adaptive station detection, signed bisection with retained strict brackets, monotonic legs, all oriented target roots, connected windows, adjacent-leg components and two-sided closure.
- [x] Expand only unresolved sides; on an unresolved bound return omission/incomplete evidence, never a successful total.
- [x] Feed actual solver scans through the app's `parseTransitEpisodeScan` and `validateEpisodeProof`; expected complete analytic cases accepted and incomplete/tangent cases omitted.
- [x] Commit the solver and regression tests.

### Task 3: Independent Swiss qualification

**Files:** Create `services/swiss-ephemeris/scripts/{reference,qualify}.mjs`, recorded synthetic fixtures and `docs/reviews/daily-transit-story/2026-10-12-owned-swiss/` evidence.

**Interfaces:** The reference enumerator calls Swiss directly, uses a dense uniform grid and independent refinement; it must not import the candidate solver, station finder, root refiner or expected-event builders. Reports bind input/file/tool/source hashes and compare time/count/direction/window/station results.

- [x] Test reference enumeration on hand-derived analytic tracks before collecting real-position evidence.
- [x] Record at least 15 tracks across Jupiter, Saturn, Uranus, Neptune and Pluto, covering single/repeat, station-near, wrap/branch and uncertainty behavior.
- [x] Compare every emitted root/station/edge within 300 seconds, identical nonambiguous counts/directions, closure and expected omissions; expected zero mismatches.
- [x] Record cold/warm timings, bounds, file/source IDs, commands and fixture hashes; no synthetic evidence is presented as an independent ephemeris model.
- [x] Commit source and qualification evidence.

### Task 4: HTTP, source offer and app integration

**Files:** Create service `src/{server,worker}.mjs`, `tests/http.test.mjs`, `Dockerfile`, `.dockerignore`, `fly.toml`, `README.md` and source-distribution script; modify app privacy/source/birth guidance only where needed by the provider transition.

**Interfaces:** Authenticated `POST /v1/chart`, `POST /v1/transit-episodes`; public `GET /health`, `/v1/engine`, `/source` and source archive. Health identifies the actual build/source data; calculation requires a strong configured shared key. All computation is isolated with bounded workers, request size, execution time and response size.

- [x] Write HTTP tests for auth, malformed/oversize bodies, overload/deadline behavior, source download and both actual calculation routes; observe failures.
- [x] Implement HTTP and lifecycle controls; build a self-contained source archive with licence, native dependency sources, pinned build inputs and reproduction instructions.
- [x] Test actual chart response through app `resolvePositions` and three-sample anchor qualification; verify old charts are unchanged and explicit save/recalculate creates new source evidence.
- [x] Run service suite and root `npm test`, typecheck, scoped lint and build; expected all relevant checks pass.
- [x] Commit the deployment package and app integration.

### Task 5: Isolated deployment and joint release

**Files:** Update source qualification/status documents and add deployment/rollback receipts under the new evidence directory.

- [x] Read current Fly access/configuration; deploy a separate `pattern-transit-calc` app using an independent generated secret, preserving the existing app.
- [x] Verify remote source/build identity, unauthenticated 401, public source archive, synthetic chart + 15-track qualification and measured service deadlines on the deployed version.
- [ ] Configure this app's chart URL/key and transit URL/source ID through an authorized server secret channel. If credentials/tooling are absent, finish everything independent and report the exact missing operation without exposing a secret.
- [ ] Publish current source normally; verify remote commit and Lovable synchronization separately from production deployment.
- [ ] Activate the staged combined content only when source settings and production checks establish both features can work. Existing owners use explicit recalculation; historical records keep their original source.
- [ ] Record final configuration, release pointers, live evidence and rollback instructions; keep any unfulfilled gate explicitly open.

## Execution notes

Implementation is native in this session, using the existing clean isolated worktree. A fresh whole-change reviewer will inspect the completed implementation and qualification before release. No changes are planned in the separate `patternlike-app` checkout.
