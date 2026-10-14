# Daily Reading Transit Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the primary daily transit a source-supported chapter and repeat-contact chronology, with reviewed meaning, exact saved evidence, and honest incomplete/uncertain fallbacks.

**Architecture:** Reuse qualified Swiss birth-window anchors and add one bounded episode request to an extended external Swiss service. Validate crossings, stations, closure and sampled uncertainty before selecting a published chapter. Carry one plan through template prose, `A1/P2` facts, chronology validation, encrypted cache/archive evidence, and timing UI. Keep ordinary phase wording when a story cannot be supported.

**Tech Stack:** TypeScript, Zod, TanStack Start/React, existing native Swiss HTTP service, D1 JSON and AES-GCM/DEK helpers, Node.js 24 `node:test`/Vite/SQLite harness, existing Lovable gateway.

**Spec:** [Daily reading transit story design](../specs/2026-10-11-daily-reading-transit-story-design.md).

**Status reconciled 2026-10-13:** Shipped in combined `0.7.1` under the approved small writing gate. Native implementation/qualification/deployment are complete in the [owned-service plan](2026-10-12-owned-swiss-service.md). The [small writing review](../../reviews/daily-transit-story/2026-10-12-prompt-recheck/README.md) passed 15/15 items, and the [runtime/activation receipt](../../reviews/daily-transit-story/2026-10-12-transit-runtime-fix/README.md) records production chart/transit checks and both active pointers. Later [legacy-anchor recovery](../../reviews/release-completion/2026-10-12-birth-story/README.md) is also published.

**How to read this checklist:** Original boxes preserve the 2026-10-11 local execution ledger and [local validation](../../reviews/daily-transit-story/local-validation.md). Native Task 2 was completed through the owned-service plan; the exhaustive Task 9 release prerequisite was replaced by the approved small review; delivery followed in Task 10's linked receipts. Unticked historical procedures do not mean the service is still disabled. Full matched writing/human review and member-path latency were not established by the small review. The [central closeout record](2026-10-12-release-completion-checklist.md#reconciled-status) owns later final-stack/acceptance work; this update uses saved evidence, not new production checks.

## Global constraints

- Reuse the landed recommendation 1/2 catalogue, dependency, uncertainty, cache and evidence contracts. The approved joint-release writing gates govern that shipped scope. A missing natal lens does not itself suppress a story.
- “Natal houses, angles and aspects come from the Swiss Ephemeris service response (Placidus); in-app math is only the degraded fallback and fills angle contacts the service omits.” Accept only explicitly qualified service anchors; no synthetic app angle qualifies.
- “Section observers animate already-visible content once, never hide it; chapter panels retain visited content while collapsing.” Retain global/reduced motion, visited panels and existing Buttons. No fetch or replay on collapse.
- Preserve the natal essay's independent reflection-question field/validation and safe fallback. This increment changes daily timing interpretation, not natal essays.
- Scope new chronology to the already selected Jupiter/Saturn/Uranus/Neptune/Pluto primary. Preserve ranking, threshold `> 0.02`, suppression, strongest three, headline/confidence, synthesis/natal policy and local reflection/wellness assembly.
- A sampled orb minimum is not a certified exact crossing. A reusable cycle key is not an episode ID. An episode is not necessarily three passes. A last calculated contact is not a promised resolution or known personal history.
- The standalone native service is implemented in `services/swiss-ephemeris/` and deployed separately, with source/flags/numerical qualification recorded in the owned-service plan. Unsupported/unavailable/partial results retain ordinary readings.
- Keep daily sign/house bans, strict two-to-four-paragraph body JSON and limits, one model call and the current independent 60,000 ms daily deadline. Provider selection follows [AGENTS.md](../../../AGENTS.md); original 3.7 / 20,000 ms task values are historical. Add at most one six-second episode request on an uncached eligible generation; no automatic retries.
- Reuse three birth-save samples; no daily birth-data fan-out, extra profile table or app schema migration. Encrypt chart-derived story evidence and anchors. Keep personal chronology out of admin metrics/logs.
- Original schema-4 reservations (`builtin-0.7.0`, prompt 7 / validator 6, fixtures v5) are historical. Corrected content is `builtin-0.7.1`, published as `0.7.1`; the small review used prompt 13 / validator 10 and fixtures v6 (38 cases). Current schema-4 serving is prompt 15 / validator 10 and the general suite is v7 (50 cases); see the [execution reference](2026-10-12-release-completion-checklist.md#current-execution-reference).
- Preserve unrelated dirty work and archived IDs/feedback; stage explicit owned files. Never force-push or rewrite pushed Lovable-connected history. Completing this checklist document authorizes no application edits, commits, service deployment, activation or paid evaluations.

## Review focus

Each condition is pinned to tests in its owning tasks.

1. A wrong coordinate frame, fabricated zero speed, Swiss fallback flag, or local eligibility disagreement cannot become a confident timeline — Tasks 1, 2 and 3.
2. Wrap-around, tangencies, scan edges, multiple windows, five contacts and later revolutions cannot be collapsed into a convenient three-pass story — Tasks 2 and 3.
3. Birth-time/timezone uncertainty cannot become a single confident date, ordinal or “exact today” label — Tasks 1, 3 and 5.
4. New atoms cannot weaken ordinary transit/date validation, bypass citation parents, invent biography, or displace the main interpretation/synthesis/natal lens — Tasks 4, 6 and 9.
5. Cached/archive/owner/export evidence must remain exact, encrypted and account-scoped; collapsed UI and cache reads must not rescan or rewrite history — Tasks 7 and 8.

## File responsibilities

| File                                                                            | Responsibility                                                                                |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/lib/astro/swiss.server.ts`, `chart.ts`                                     | Explicit natal position source metadata; preserve existing service/fallback behavior          |
| Recommendation 2 `natal-reliability.server.ts`                                  | Shared birth-window sampling, without duplicate boundary calls                                |
| New `src/lib/astro/transit-anchors.ts`, `.server.ts`                            | Qualified raw anchor triple, validation and encrypted snapshot integration                    |
| New `src/lib/astro/transit-episodes.ts`, `.server.ts`                           | Strict endpoint DTO, event/proof validation, chapter/calendar calculation, bounded client     |
| External native Swiss service                                                   | New `/v1/transit-episodes` contract, roots/stations/windows/closure and native accuracy tests |
| `src/lib/astro/cycles.ts`                                                       | Expose the existing orb policy; retain ranking and current-window semantics                   |
| `src/lib/content/default-bundle.ts`, `schema.ts`, new `transit-story.ts`        | Published chapter catalogue, lifecycle validation and pure story selection                    |
| `src/lib/reading.server.ts`, `pattern.server.ts`                                | Shared primary timing/assembly, one request, immutable cache and private saved evidence       |
| `src/lib/ai/facts.ts`, `language.server.ts`, `daily-voice.ts`, `diagnostics.ts` | `A1/P2`, server chronology, dependency/date/coverage guards and version changes               |
| Timing/evidence components and `timing.ts`, `today-view.ts`                     | Same saved sequence, date ranges, source labels and accessible contact list                   |
| Existing evaluation modules/CLI and `ReadingEvaluation.tsx`                     | Fixed version-5 cases, metadata, offline/live-synthetic writing qualification                 |

## Task 1: Qualify the anchor and source contract once at birth save

**Files:** Modify `src/lib/astro/chart.ts`, `swiss.server.ts`, recommendation 2 `natal-reliability.server.ts`, `src/lib/pattern.server.ts`, `tests/helpers/records-harness.mjs`, `tests/reading-natal-snapshot.test.mjs`. Create `transit-anchors.ts`, `transit-anchors.server.ts`, `tests/transit-anchors.test.mjs`, and `tests/reading-transit-snapshot.test.mjs`.

**Interfaces:** Export the spec's `PositionSource`, `StoryBody`, `StoryTarget`, `TransitAnchorManifest`; `assessTransitAnchors(samples, fingerprint, accuracy)` and `validateTransitAnchors(value, fingerprint, accuracy)`. Expose shared `resolveNatalWindowSamples(input, center)` and preserve `resolveNatalReliability` callers through a thin assessor.

- [x] Verify prerequisites and freeze their actual landed interfaces/versions before editing. Record the current dirty-file manifest; isolate implementation if necessary and preserve unrelated work.
- [x] Write `anchors_require_explicit_service_frame`, `birth_window_calls_are_shared`, and `unknown_or_legacy_birth_omits_story`. Assert exact/near/hour offsets, no invented service metadata, at most three birth calls and zero daily birth calls.
- [x] Run `node --test tests/transit-anchors.test.mjs tests/reading-transit-snapshot.test.mjs tests/reading-natal-snapshot.test.mjs`; inspect expected missing-contract failures.
- [x] Extend the birth service contract and `EphemerisResult` with optional actual frame/flags/version/file identity; absent legacy metadata cannot select anchors. Do not change ordinary natal calculation or its explicit degraded fallback.
- [x] Refactor boundary sampling into one coordinator consumed by both natal reliability and transit anchors. Preserve concurrent boundary requests, six-second deadlines, central chart saving on failure and all recommendation 2 source checks.
- [x] Implement the exact nine-target bounded manifest, unrounded service longitudes and angle restrictions from the spec. Reject mixed frames/nonfinite points; keep sign-lens eligibility independent from anchor eligibility.
- [x] Encrypt `houses.transitAnchors_ct` with the existing DEK. Load it once for daily assembly; absence means no story, corrupt presence fails read, and recalculation replaces the manifest with current assessed source evidence.
- [x] Test cusp-crossing but valid transit anchors, approximate/mixed-origin angles, all declared time bands, unknown time, service failure, legacy absence, corruption and cross-account access. Assert no extra calls when both features consume the samples.
- [x] Rerun the focused snapshot/anchor suites and prerequisite natal tests; commit only reviewed owned paths when implementation commits are authorized.

## Task 2: Deliver and qualify the native Swiss episode calculation

**Completed through the owned-service plan:** The service now lives in `services/swiss-ephemeris/`. [Qualification/deployment evidence](../../reviews/daily-transit-story/2026-10-12-owned-swiss/README.md) records its engine, solver, 15 reference tracks, bounds and deployment; the runtime receipt above closes app connectivity. The original procedural boxes below are retained, including unrecorded initial-red ordering.

**Files:** The original app work created the contract in `src/lib/astro/transit-episodes.ts`, client in `transit-episodes.server.ts`, `tests/transit-episode-client.test.mjs`, fixtures, source-qualification record and placeholder-only `.env.example`. The separately licensed native source and deployment now belong to `services/swiss-ephemeris/`.

**Interfaces:** Implement the spec's proposed authenticated `POST /v1/transit-episodes` request/response. Export `TRANSIT_EPISODE_CONTRACT`, `TRANSIT_EPISODE_SOLVER_VERSION` and all pure request/scan/proof types from `transit-episodes.ts`; export `resolveTransitEpisodeScan(input): Promise<TransitEpisodeScanResult>` from the server module. Configure the separate endpoint URL and reviewed source ID; reuse `SWISS_EPHEMERIS_KEY`.

- [x] Write `episode_endpoint_is_optional`, `episode_client_rejects_wrong_source_or_contract`, `missing_episode_speed_is_not_zero`, `episode_body_read_shares_deadline`, and `episode_client_has_no_retry`. Assert one request, abort/finally cleanup, bounded response and privacy-safe failure codes.
- [ ] Run `node --test tests/transit-episode-client.test.mjs` before implementing the client; native service tests run in its own recorded environment.
- [ ] Implement explicit apparent/tropical/geocentric/equinox-of-date Swiss positions with analytic speed and actual returned-flag checks. Verify UTC-to-UT handling, file coverage and birth-anchor compatibility; reject silent engine/frame changes.
- [ ] Implement unwrapped signed target crossings, deduplicated oriented aspect branches, analytic station bracketing and monotonic legs. Test roots on both sides of a station, including cases missed by an absolute-orb-minimum search.
- [ ] Implement ±400-day initial scans, 200-day side extensions, maximum ±1,460 days, four-second/20,000-evaluation limits and valid-source date bounds. A limit returns an incomplete reason, never a total count.
- [ ] Refine roots/stations/orb edges to ≤60-second brackets and roots to ≤`0.000001°` residual. Apply the `0.001°` station-target ambiguity guard; do not report an exact tangent as an ordinary crossing.
- [ ] Build contact-associated orb windows with the existing orb policy. Preserve gaps and multiple contacts per window; do not claim exactness for a near miss.
- [ ] Form same-branch/turn episodes from roots in adjacent monotonic legs separated by one station. Certify both boundaries using empty neighboring legs and closed windows; support one/three/five/other proven counts.
- [ ] Add native tests for branch wrap, later revolution, first motion retrograde, five passes, tangency, close roots, multiple windows, missing closure and every limit. Pin expected roots independently of the candidate implementation.
- [ ] Record at least fifteen real-position reference tracks spanning all five bodies and single/repeat, station-near, wrap/branch behavior. Use a dense independently enumerated Swiss reference track and refined brackets; record tool commands, native source commit, actual flags/data, hashes and all event deltas.
- [ ] Require identical nonambiguous count/directions, ≤five-minute differences for every root/station/edge, correct closure, and correct uncertainty omissions. Label this as Swiss pipeline qualification; app mock success alone cannot satisfy it.
- [x] Implement strict single-request client authentication, six-second fetch/body/parse deadline, 128-KiB body cap and spec event/string bounds. Configure a source ID only after reviewing its matching qualification artifact; unknown/mismatched identities omit the story.
- [ ] Verify cold/warm service latency and budget behavior. Document its source/privacy-bound cache and retention; source-specific cache invalidation must cover files, frame, solver, body, anchors, orb and coverage.
- [ ] Rerun client and native suites. Save numerical qualification results separately from model-writing reports; keep the app feature disabled until the native deliverable passes.

## Task 3: Validate complete episodes and sampled chapter agreement

**Files:** Extend Task 2's contract/schema scaffold in `src/lib/astro/transit-episodes.ts` with proof validation/selection; create `tests/transit-episodes.test.mjs`. Modify `src/lib/astro/cycles.ts` only to export/reuse its existing orb policy. Add analytic and malformed scan fixtures under `tests/fixtures/transit-episodes/`.

**Interfaces:** Export `validateTransitEpisodeScan(value, expected)`, `resolveDailyTransitCalculation(scan, anchor, primary, day, timezone)`, `DailyTransitCalculation`, `ValidatedTransitEpisode`, and the spec's closed `StoryOmissionReason`. A successful DTO contains the selected source component, timing overlay and approved dates; an omitted one contains no partial history.

- [x] Write `cycle_key_is_not_episode_identity`, `all_roots_and_gaps_are_preserved`, `scan_edges_do_not_prove_total`, `five_passes_are_not_forced_to_three`, and `sampled_ordinal_disagreement_omits_story`.
- [x] Run `node --test tests/transit-episodes.test.mjs`; confirm incomplete/tangent/uncertain fixtures cannot accidentally take the selected path.
- [x] Validate the spec's exact request/scan/event/proof DTOs: three exact offsets, finite sorted unique events, brackets/residuals/directions, windows, source identity, monotonic target turns and closure references. A sample's resource/output/source limit omits the story immediately. Independently infer each unlimited leg's crossings from its endpoints; reject a claimed complete flag without its bounded proof or a crossing without a corresponding contact.
- [x] Select only the current primary's component, with all sampled references inside the existing orb. Report `source_disagreement` when local and service eligibility diverge; preserve ranking instead of silently choosing another transit.
- [x] Require matching complete topology, count, directions and chapter for the triple. Implement `single/opening/return/closing`; within the policy's twelve-hour connecting-station interval select `between` and no ordinal. Do not use nearest-root time or percentage to assign a chapter.
- [x] Keep one-cycle identity, private source-bound episode identity and per-day database rows distinct. Require the correct oriented target/turn; do not merge another square/trine branch or a later orbit.
- [x] Derive approved civil dates/month-year labels only when all samples agree; retain sampled ranges privately otherwise. Test uncertain dates with a stable count and differing ordinal with apparently similar dates.
- [x] Test one/three/five passes, retrograde-first sequences, same-window contacts, split windows, wrap, malformed proof, tangency, caps, no current root, unsupported primary and no anchor. Assert omitted results contain no counts/first/final labels.
- [x] Rerun the pure/client suites and existing `tests/timing-calendar.test.mjs`; review the exact omission matrix against the spec.

## Task 4: Publish five reviewed experiential chapter mechanisms

**Files:** Modify `src/lib/content/default-bundle.ts`, `schema.ts`, `src/lib/pattern.server.ts`, content release/rollback routes and `src/routes/_authenticated/content.tsx`. Create `src/lib/content/transit-story.ts`, `tests/reading-transit-content.test.mjs`, and `tests/reading-transit-story.test.mjs`; extend `tests/reading-content-releases.test.mjs`.

**Interfaces:** Export `TransitChapter`, `TransitChapterCopy`, `DailyTransitStoryPlan`, `resolveDailyTransitStory(bundle, primary, interpretation, calculation)` and `DAILY_TRANSIT_STORY_VERSION`. Extend schema versions to `2 | 3 | 4`, preserving earlier validation.

- [x] Write `legacy_content_does_not_inherit_chapters`, `empty_active_chapters_are_authoritative`, `phase_copy_is_conditional_and_release_owned`, `chapter_copy_is_not_a_personal_history`, and `cycle_draft_preserves_chapter_catalogue`.
- [x] Run `node --test tests/reading-transit-content.test.mjs tests/reading-transit-story.test.mjs tests/reading-content-releases.test.mjs` before adding catalogue behavior.
- [x] Implement the exact five-entry maximum, unique key/chapter rules, 100-character keys, 240-character/two-sentence mechanisms and no embedded counts/dates/placements/diagnosis/guaranteed resolution. Retain raw immutable payload/checksum identity.
- [x] Author and review all five mechanisms using the spec's practical distinctions. Opening is an opportunity to notice, return to adjust, closing to repeat a workable response, and between to keep something provisional; never assert that a rupture or resolution occurred.
- [x] Replace the three built-in phase strings with reviewed experiential, conditional descriptions under the same new release: notice before acting, focus on one choice, and retain a useful response if pressure has eased. Preserve `P1`'s role, active phase ownership and rollback identity; between/uncertain timing does not invent a supported three-phase label.
- [x] Add reviewed schema-4 `builtin-0.7.0` copy. Preserve absent/empty legacy catalogue behavior and active-miss behavior without built-in substitution.
- [x] Apply shared validation at load/draft/inactive publish/signed ingest/activate/rollback. Preserve chapter copy verbatim during cycle drafting; show coverage in admin previews without user chronology. Invalid graphs leave active pointers intact.
- [x] Implement one deterministic selected chapter from the qualified calculation and existing `I1`; missing primary meaning or catalogue omits the story. No selection changes ranking, synthesis, natal lens or reflection.
- [x] Rerun content/planner/lifecycle suites; review concrete chapter copy against the same transit in opening/return/closing cases and document why the practical distinctions differ.

## Task 5: Share the calculation, phase and template across server paths

**Files:** Modify `src/lib/pattern.server.ts`, `reading.server.ts`, `pattern.functions.ts`, `src/components/pattern/timing.ts`, and `tests/helpers/records-harness.mjs`. Create `tests/reading-transit-integration.test.mjs`; extend `tests/timing-calendar.test.mjs` and `tests/reading-request-policy.test.mjs`.

**Interfaces:** Add optional sixth `storyCalculation` argument after recommendation 2's optional fifth natal reliability argument to `assembleReading`. Return `transitStoryPlan`. Share the spec's `DailyTransitCalculation` DTO and one primary timing overlay through Today/Time Travel.

- [x] Write `story_does_not_rerank_primary`, `template_and_gateway_share_story_plan`, `timing_overlay_is_shared`, `uncertain_root_has_no_exact_today`, and `no_episode_fanout_for_supporting_cycles`.
- [x] Run `node --test tests/reading-transit-integration.test.mjs tests/timing-calendar.test.mjs tests/reading-request-policy.test.mjs`; inspect expected missing-overlay failures.
- [x] Resolve eligible primary/interpretation and anchor before requesting the episode. Skip unsupported/no-primary/no-copy/no-catalogue/no-anchor cases. Make one bounded request for an uncached qualified generation; keep the assembler pure and four/five-argument callers valid.
- [x] Implement the separate `StoryTimingOverlay` DTO, leaving `CycleInstance.phase` and ranking inputs intact. Overlay current-leg root/window timing consistently without changing key, approximate current orb, weights, domain or ranking. Identify geometry and event-timing sources separately; do not relabel all cycles Swiss.
- [x] Extend `ephemerisState` and model `E1` inputs with event-timing provenance, keeping natal precision and local transit geometry separate. Test that a Swiss history cannot relabel the current approximate orb or supporting cycles as Swiss positions.
- [x] Normalize model `C1/P1/T1`, presentation phase, approved exact civil day and day offset from the same sampled result. Suppress single-date/“exact today” claims when the triple disagrees; use neutral timing during between-pass intervals. Never fall back from an uncertain qualified field to the central timestamp or old minimum.
- [x] Convert UTC roots with the effective validated timezone/local-noon reference. Test DST, UTC/Los Angeles/Kiritimati boundary dates, date-only keys, historical day selection and root/phase agreement.
- [x] Put deterministic chronology and selected chapter meaning in the template's first two astronomical paragraphs. Preserve `I1`, optional `S1/N1`, length limits and local context/reflection assembly.
- [x] Pass the saved calculation in Today responses. Time Travel resolves only its selected primary on a new day selection; do not scan forty cycles or refetch on panel collapse. Keep ordinary window timing for every omitted result.
- [x] Verify new reading, unavailable service, unsupported primary, no catalogue, unknown/degraded anchor and combined synthesis/natal/story behavior; rerun focused integration/calendar/request-policy suites.

## Task 6: Carry `A1/P2` into one model request and guard chronology

**Files:** Modify `src/lib/ai/facts.ts`, `daily-voice.ts`, `language.server.ts`, `diagnostics.ts`, existing language/diagnostic/request-policy/writing-privacy tests. Create `tests/reading-transit-language.test.mjs`.

**Interfaces:** Extend the existing fact graph with `A1 -> C1` and `P2 -> C1/I1/A1`, typed approved exact-contact dates and the required chronology sentence. Add the five closed arc diagnostic codes from the spec. Advance daily prompt/validator only to `daily-astro-body-7`/`daily-reference-6`.

- [x] Write `arc_atoms_require_exact_parents`, `chronology_is_copied_once_in_first_two_paragraphs`, `arc_date_cannot_support_another_cycle`, `omitted_arc_cannot_invent_passes`, and `arc_payload_contains_no_scan_or_birth_data`.
- [x] Run `node --test tests/reading-transit-language.test.mjs tests/reading-language.test.mjs tests/reading-diagnostics.test.mjs tests/reading-writing-privacy.test.mjs` before changing the prompt/guards.
- [x] Build `A1` only from the selected plan's bounded index/count/chapter/approved labels using generic `pass-1`…`pass-16` event references; build `P2` only from its reviewed copy. Exclude anchor values, scans, UTC brackets, native event/episode IDs, fingerprints, station coordinates, personal notes and wellness metrics from the provider fact sheet. Preserve existing `AST-05/AST-08` source-use checks.
- [x] Render the chronology server-side with the fixed 1–16 vocabulary and ≤180-character limit. Qualify dates/months against all samples. Distinguish “first exact contact” from ingress or personal onset.
- [x] In the shared daily system brief require the unchanged chronology once in paragraph 1 or 2, with chapter meaning tied to `I1`. Preserve the primary/synthesis/natal coverage rules, JSON/paragraph/size limits, one call and 20-second deadline. Omitted plans add no chronology instruction.
- [x] Enforce exact dependency graph, current primary/release, chapter/index/count consistency, chronology location/uniqueness and paragraph-local date/citation support. Keep ordinary body/aspect/orb/sign/house safeguards; a story date cannot justify another event or historical orb.
- [x] Add bounded guards for extra/wrong count/ordinal/final-pass/date claims and unsupplied chronology. Record only closed codes/IDs; acknowledge lexical checks do not prove full semantic support.
- [x] Test wrong “2 of 3” against five passes, unsupported prior-month/next-pass date, tangent claims, invented rupture, promised final resolution, station-as-contact date and altered required sentence. Whole-draft rejection uses the supported template with no repair/retry request.
- [x] Test complete `C1/I1/S1/N1/A1/P2` integration and template fallback within current body limits. Rerun language/request/privacy/diagnostic suites; natal essays and editorial drafting retain separate prompts/budgets.

## Task 7: Preserve private, immutable cache and archive evidence

**Files:** Modify `src/lib/pattern.server.ts`, `src/lib/ai/quality.ts`, `tests/reading-cache.test.mjs`, `tests/reading-quality.test.mjs`, and `tests/reading-writing-privacy.test.mjs`. Create `tests/reading-transit-storage.test.mjs`.

**Interfaces:** Extend recommendation 2's async owner `readingLanguage(row, dek)` with optional `transitStory` evidence. Save exact spec envelope `language_meta.transit_story_ct`, safe `factOrder`, closed status/versions, and keyed canonical `resultDigest`; no new table/migration.

- [x] Write `arc_scan_and_dates_are_encrypted`, `cached_story_is_exact_saved_evidence`, `cached_story_makes_no_external_requests`, `source_policy_change_creates_new_identity`, and `corrupt_story_envelope_fails_read`.
- [x] Run `node --test tests/reading-transit-storage.test.mjs tests/reading-cache.test.mjs tests/reading-quality.test.mjs` before adding persistence behavior.
- [x] Encrypt the selected plan, proof, private dates/anchors, `A1/P2`, consumed provenance, timing overlay and paragraph linkage. Clear arrays retain other safe atoms and no selected story copy/scan/date values; restore story and natal atoms in exact saved order.
- [x] Extend HMAC identity with story/solver/anchor versions, reviewed source/config identity, enablement, canonical decrypted anchor state, prior policies/context and effective content/day/timezone. Never key on randomized ciphertext or expose low-entropy plain hashes.
- [x] Look up an existing immutable row before the episode call. Validate/reuse its envelope and saved overlay; do not replace it with today's recomputed episode. Bind the validated returned result with a canonical keyed digest excluding request timestamps/durations/cache metadata.
- [x] Make source-unavailable omission immutable for that generation: cached reads neither retry nor rewrite it. New day or deliberate source/policy/birth/content version change can generate a new reading. Preserve original IDs/feedback and old source qualification identity.
- [x] Validate saved primary/release/source/anchor binding, graph, bounds, digest, restored fact order and consumed paragraph references. Present broken evidence fails read; legacy absence is compatible. Do not fabricate history from a current chart during archive read.
- [x] Extend owner export and account erasure for encrypted anchors/story envelopes. Ensure admin quality/cohort/sample/log output contains only closed IDs/codes/versions, never personal event dates or private episode IDs.
- [x] Test cold reopen, same-policy repeat, source/release/anchor upgrades, legacy rows, corrupt/missing cited envelope, archive after new birth details, export/erasure, account switching and failed source persistence. Inspect test SQLite JSON for the encrypted boundary.
- [x] Rerun focused storage/cache/quality/privacy suites and prerequisite natal storage tests; document exact cache recovery behavior.

## Task 8: Show the saved sequence and uncertainty accessibly

**Files:** Modify `src/components/pattern/TimingWindow.tsx`, `TodayTiming.tsx`, `TodayEvidence.tsx`, `EphemerisNotice.tsx`, `timing.ts`, `today-view.ts`, `time-travel.ts`, `src/routes/_authenticated/time-travel.tsx`, and `privacy.tsx`. Create `tests/transit-story-view.test.mjs`; extend `tests/today-evidence.test.mjs` and `tests/timing-calendar.test.mjs`.

- [x] Write `episode_timeline_preserves_out_of_orb_gaps`, `uncertain_contacts_render_date_ranges`, `between_has_no_fake_ordinal`, `source_notice_distinguishes_natal_and_transit`, and `story_evidence_uses_saved_atoms`.
- [x] Run `node --test tests/transit-story-view.test.mjs tests/today-evidence.test.mjs tests/timing-calendar.test.mjs` before adding presentation.
- [x] Show all qualified exact contacts and connected windows, leaving gaps unfilled. Label current contact/count or between-pass status; show a text list when markers overlap or the graphic lacks endpoints.
- [x] Show sampled date ranges instead of one confident day, and keep first ingress separate from first exact contact. Label natal Swiss provenance, approximate current geometry and Swiss event timing independently.
- [x] Link `A1` to the saved sequence and `P2` to exact reviewed copy. Explain calculated contacts versus life events and the three-sample uncertainty screen in concise owner-facing text.
- [x] Update privacy disclosure for derived anchor longitudes sent to the chart service and minimal chronology sent to the language provider. Do not imply either is anonymous or expose numerical implementation details in the main reading.
- [x] Preserve existing Buttons, mounted visited panels, focus/`aria`/`inert`, Shell/global motion and reduced-motion behavior. Already-visible asynchronous content stays visible; closing/reopening never fetches or repeats an animation.
- [x] Test quiet/omitted/legacy/one/three/five-pass states, long date ranges, overlapping contacts and account isolation. Browser-review mobile, keyboard and reduced-motion behavior; source inspection alone does not qualify rendering.
- [x] Rerun view/evidence/calendar suites and record browser evidence separately from server/numerical checks.

## Task 9: Qualify temporal coherence with fixed synthetic writing cases

**Superseded release prerequisite:** The exhaustive comparison below was replaced for `0.7.1` by the approved small 15/15 review, without claiming a full benchmark or human review. The corrected transit suite became v6 (38 cases / at most 37 attempts); archived v5 36/35 captures stay historical. Current v7 has 50 cases / at most 49 attempts. New full-stack qualification belongs to release-completion Task 13.

**Files:** Modify `src/lib/ai/reading-evaluation.fixtures.mjs`, `.d.mts`, `reading-evaluation.server.ts`, `reading-evaluation.shared.ts`, `scripts/reading-eval-cases.mjs`, `scripts/evaluate-readings.mjs`, `src/components/pattern/ReadingEvaluation.tsx`, existing evaluation suites and `READING-EVALUATION.md`. Save implementation reports under `docs/reviews/daily-transit-story/`.

- [x] Write `arc_fixed_cases_use_production_validation_and_planner`, `arc_runner_reads_no_birth_records_or_swiss`, `arc_policy_change_stops_mixed_run`, and `version5_comparison_requires_identical_inputs`. Include source/solver/story/anchor versions and fixture hashes in consistency checks.
- [x] Run `node --test tests/reading-eval-fixtures.test.mjs tests/reading-eval.test.mjs`; verify missing/mixed-policy fixture/report inputs fail.
- [x] Retain the 26 prerequisite cases and add the spec's ten exact arc case IDs. Freeze `synthetic-daily-5`, 36 total cases and at most 35 model attempts with complete primary copy; only `quiet-threshold` skips. Negative arc cases still generate ordinary primary prose.
- [x] Derive selected/omitted results through production validators/planners from synthetic raw service response/anchor fixtures. Do not hardcode successful selection booleans or call real Swiss. Add source/frame/no-catalogue/no-anchor/date-range failures as unit cases.
- [x] Keep fixed case IDs, authenticated no-account/no-write evaluation, one case at a time, exact cost/failure/stop handling, no automatic retries and preserved partial results. Do not change a production content pointer to conduct an experiment.
- [x] Prepare isolated baseline/candidate checkouts with identical version-5 fixture/catalogue/source hashes and prior policies. Disable only story use in the baseline; keep model, copy, tone/depth and other feature inputs fixed.
- [x] Run offline replay with fresh distinct outputs and response files; validate report metadata and all 36 rows. Use `node scripts/evaluate-readings.mjs --help` to confirm current flags, then its documented `--output`, `--write-responses`, `--responses` and `--compare` workflow. Offline success establishes validator behavior, not model-writing quality.
- [ ] On an explicitly invoked actual-model evaluation, collect fresh synthetic baseline/candidate results and costs without retries. Retain/report partial failures; a missing real-model run leaves the writing gate open.
- [ ] Blind-review specificity, voice, repetition, grounding, `temporalCoherence`, `chapterIntegration`, `unsupportedHistory` and `promisedResolution`. Every arc-positive candidate/template must meet ≥4 grounding/coherence/integration and zero unsupported-history/promised-outcome flags.
- [ ] Require opening/return/closing matched cases to differ in practical emphasis beyond count/adjective changes; omitted cases must invent no history. Review the combined `S1/N1/P2` case for readability within the body budget.
- [ ] Save structural/numerical/writing/browser results separately with exact source identities. Full plan completion requires the real native qualification and actual-model writing gates, not synthetic service labels or offline replay alone.

## Task 10: Complete checks and prepare a concrete release candidate

**Delivered outcome:** Corrected `0.7.1` was staged, jointly activated and verified through the linked prompt-recheck and runtime receipts. Failed `0.7.0` remains inactive. Original procedure boxes are retained; the actual service/app/content identities are recorded separately in those receipts.

**Files:** Update `README.md`, the existing privacy page at `src/routes/_authenticated/privacy.tsx`, `READING-EVALUATION.md`, source-qualification/writing review artifacts, and the implementation status of this plan/spec. Follow the existing immutable release workflow; do not add a parallel activation path.

- [x] Document supported bodies, algorithm/window/episode distinctions, source/uncertainty requirements, chapter meanings, omitted-state behavior, privacy/cache/archive recovery and exact future-to-landed version identities.
- [x] Run `npm test` for the complete Node suite after focused checks pass. Record failures and exact totals; do not weaken assertions or label a partial run green.
- [x] Run `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check`. These do not establish service accuracy, actual model quality, browser accessibility or production behavior.
- [x] Self-review the complete owned diff against the five review focuses. Confirm no ranking/orb-policy changes, sign/house weakening, extra service/model retries, privacy leaks, unrelated edits or rewritten published history.
- [ ] Prepare the complete reviewed schema-4 graph as a new inactive immutable release candidate, with checksum, native service qualification identity, fixed fixture hashes, writing/browser results and omission coverage. Source configuration must match the qualified actual service identity.
- [ ] On an explicitly requested release, publish/activate/deploy through existing workflows and verify qualified positive, unavailable/incomplete/unknown/legacy negative, cache/archive/export and rollback cases. Preserve prior reading IDs/feedback; do not drop the supported ordinary fallback.
- [ ] Report source commit/remote parity, native service version, app deployment/traffic, content activation and live reading evidence separately. This checklist alone authorizes none of those release actions.

## Final acceptance checklist

The original boxes below were not maintained after the local phase. The completed owned-service plan, approved small writing review and joint activation now supply the shipped-scope disposition. Later final-stack review and reader acceptance remain explicitly open in the central closeout record; no exhaustive benchmark or fresh current-provider review is inferred from activation.

- [ ] Exact roots, stations and orb edges come from a qualified, coordinate-compatible native source with independently recorded numerical evidence.
- [ ] A complete one/three/five/other-count episode has proven boundaries; ambiguous/incomplete scans never receive first/final/total claims.
- [ ] Birth-window disagreement and calendar ambiguity suppress unsupported ordinals/dates without breaking ordinary daily readings.
- [ ] The existing primary remains selected; one shared timing/chapter plan drives template, gateway facts and owner UI.
- [ ] `A1/P2` dependencies and literal chronology are checked without weakening other transit/orb/date/sign/house guards.
- [ ] Chapter interpretation stays conditional and concrete; no invented life history or promised final resolution survives writing review.
- [ ] Personal anchors/story provenance are encrypted; owner cache/archive/export restores exact saved evidence and erasure removes it.
- [ ] Cache/panel reads make no extra service/model request; gaps, ranges and source distinctions remain readable and accessible.
- [ ] Native, local, browser and actual-model gates pass and are reported separately; deployment/activation remains an explicitly requested stage.

## Original checklist preparation evidence

The original checklist-preparation request was documentation only. Source inspection, primary ephemeris-reference review, and document formatting/link checks prepare the two documents. No application edits, runtime tests, typecheck, lint, build, browser qualification, actual Swiss requests, paid model evaluations, commits, publication, activation, deployment or production checks are performed to prepare them. The unchecked native, live writing and release steps remain open; local implementation evidence is recorded above and in the linked validation record.
