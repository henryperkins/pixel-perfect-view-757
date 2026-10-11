# Daily Reading Natal Temperament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the primary daily interpretation more specific through one reviewed, source-qualified natal lens, with safe provider input and exact private saved evidence.

**Architecture:** Extend the published content graph with natal lens rules and screen their chart origins at the recorded time and both uncertainty boundaries using the existing Swiss service. A pure planner selects one optional lens before template or model generation. Send only its curated meaning as `N1`; encrypt its origins and retain the same selection through caching, owner evidence, export, and quality qualification.

**Tech Stack:** TypeScript, Zod, TanStack Start/React, existing Swiss Ephemeris HTTP client, existing D1 JSON metadata and AES-GCM/DEK helpers, Node.js 24 `node:test`/Vite/SQLite harness, existing Lovable gateway.

**Spec:** [Daily reading natal temperament design](../specs/2026-10-11-daily-reading-natal-temperament-design.md).

**Status:** Local implementation continued on 2026-10-11 after the user selected “Implement #2 locally.” Recommendation 1's shared foundation suite passed 34/34 first. Natal code, intercepted integration tests, offline v4 replay and component-browser checks are implemented; see the [validation record](../releases/2026-10-11-daily-natal-validation.md). Independent catalogue approval and actual-model writing qualification remain open. Publication, activation, deployment and commit steps have not been performed. Checked steps record completed local work; unchecked procedural/red-stage steps and external qualification are not retroactively claimed.

## Global constraints

- Scope is recommendation 2. Complete the [recommendation 1 checklist](2026-10-11-daily-reading-synthesis-checklist.md) first; reuse its schema, interpretation plan, fact graph, cache/evidence, and sixteen-case fixture contracts.
- “Natal houses, angles and aspects come from the Swiss Ephemeris service response (Placidus); in-app math is only the degraded fallback and fills angle contacts the service omits.” Only qualified service origins can select a natal lens; in-app angle fill-ins cannot select one.
- “Section observers animate already-visible content once, never hide it; chapter panels retain visited content while collapsing.” Extend existing evidence and Button patterns; retain reduced-motion and keyboard behavior.
- “Natal essays use a dedicated reflection-question field validated independently from the essay, with a safe question fallback and versioned cache invalidation.” This daily feature must not change the natal essay/question contract.
- A natal lens is a published astrological possibility, not verified temperament, a known personal state, biological wiring, diagnosis, or biography. Derived wording remains personal chart-derived information.
- Preserve ranking, strongest-three selection, threshold `> 0.02`, suppression, synthesis policy, headline, confidence, and local reflection/wellness assembly. Unknown time omits natal lenses in this increment; ordinary transit readings continue.
- Keep daily sign/house bans, strict two-to-four-paragraph body-only JSON, `google/gemini-3.7-flash`, one model call, and the `20_000` ms daily gateway deadline. Natal essays/drafting retain their separate brief and budget.
- Use existing JSON storage; no schema migration or new inferred-profile table. Encrypt manifests and personal lens evidence with the owner's existing DEK. Admin metrics retain IDs/codes only.
- Reserve `builtin-0.6.0` (the inactive natal candidate; the built-in fallback stays `builtin-0.5.0`), `daily-natal-lens-2`, `natal-reliability-1`, `daily-astro-body-6`, `daily-reference-5`, and `synthetic-daily-5`; these are proposed future identities.
- Preserve unrelated work, archived reading IDs/feedback, immutable releases, and Lovable-connected Git history. Stage owned files explicitly; never force-push or rewrite pushed commits.

## Review focus

Each condition has a test in its owning task.

1. Exact/near/hour labels, a cusp crossing, display-rounded aspects, or a service engine label must not hide uncertain/mixed-source evidence — Tasks 2 and 3.
2. Unknown or legacy birth records must retain ordinary readings without added service/model retries or invented temperament — Tasks 3 and 4.
3. A natal citation must not bypass geometry/suppression, invent raw placements, or turn an interpretation into a confirmed identity — Tasks 5 and 8.
4. Clear metadata, admin quality output, cached archives, exports, and cross-account reads must respect the encrypted natal evidence boundary — Tasks 6 and 7.
5. Legacy active bundles and cycle drafting must not inherit, overwrite, or silently approve natal rules; copy changes must retain immutable identity — Task 1.

## File responsibilities

| File                                                                            | Responsibility                                                                           |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/lib/content/default-bundle.ts`, `schema.ts`                                | Natal catalogue types/seed copy, schema-3 validation, legacy normalization               |
| New `src/lib/content/natal-lens-policy.ts`                                      | Shared bounded certainty/clinical wording checks                                         |
| New `src/lib/astro/natal-reliability.ts`                                        | Pure three-sample qualification and manifest validation                                  |
| New `src/lib/astro/natal-reliability.server.ts`                                 | Bounded service sampling at birth-save time                                              |
| `src/lib/astro/chart.ts`, existing `ephemeris.ts` types                         | Expose existing cusp helper and reuse `Sign`/`Body`; retain actual chart source behavior |
| New `src/lib/content/natal-lens.ts`                                             | Pure lens selection and plan types                                                       |
| `src/lib/reading.server.ts`                                                     | Same selected lens in deterministic template and facts input                             |
| `src/lib/ai/facts.ts`, `language.server.ts`, `daily-voice.ts`, `diagnostics.ts` | `N1`, safe fact sheet, citation/wording guards and versions                              |
| `src/lib/pattern.server.ts`                                                     | Encrypted manifests/evidence, cache identity, lifecycle, owner export/erasure            |
| `src/components/pattern/TodayEvidence.tsx`, `today-view.ts`                     | Saved natal-origin evidence and labels                                                   |
| `src/routes/_authenticated/privacy.tsx`, `birth.tsx`                            | Accurate disclosure and declared-accuracy expectations                                   |
| `src/lib/ai/quality.ts`                                                         | Daily natal citation labels without personal evidence                                    |
| Existing evaluation modules, CLI, and `ReadingEvaluation.tsx`                   | Fixed natal fixtures, exact reports and writing qualification                            |

## Task 1: Define, review, and preserve the natal catalogue

**Files:** Modify `src/lib/content/default-bundle.ts`, `src/lib/content/schema.ts` from recommendation 1, `src/lib/pattern.server.ts`, `src/routes/api/public/content-releases.ts`, `src/routes/api/public/content-releases.rollback.ts`, `src/routes/_authenticated/content.tsx`. Create `src/lib/content/natal-lens-policy.ts`; create `tests/reading-natal-content.test.mjs` and extend prerequisite `tests/reading-content-releases.test.mjs`.

**Interfaces:** Export the spec's `NatalPersonalBody`, `NatalLensRole`, selector types, and `NatalLensRule`; reuse existing `Sign`/`Body`. Extend `validateContentGraph`, `normalizeContentBundle`, and existing immutable content equality. Produce `natalLensWordingProblem(text: string): "certainty" | "clinical" | null`.

- [ ] Verify recommendation 1's shared contracts and tests have landed before implementation; preserve its reviewed catalogue, independent-pair behavior, saved metadata, and fixture identities.
- [ ] Write `legacy_release_never_inherits_natal_lenses`, `schema3_rejects_invalid_natal_rules`, `empty_active_natal_catalogue_is_authoritative`, and `cycle_draft_preserves_reviewed_natal_catalogue`. Assert missing legacy field yields `[]`; duplicates/wildcards/nodes/angles/bad roles/unsafe copy are rejected; invalid ingest/activation/rollback leaves the pointer intact.
- [ ] Run `node --test tests/reading-natal-content.test.mjs tests/reading-content-releases.test.mjs`; confirm failures identify the missing schema-3 and preservation behavior.
- [x] Reuse the existing `Sign = (typeof SIGNS)[number]` and `Body` types in the new selectors, preserving the current sign constant and order.
- [x] Implement the exact catalogue schema: maximum 2,000 rules, 100-character unique keys, 1–5 unique anchors, one sign selector plus at most one same-body aspect/house selector, `0 < maxOrb <= 3`, and mechanism maximum 700 characters/three sentences. Reject duplicate canonical selectors/anchors and unsupported roles/body pairs.
- [x] Implement the shared bounded natal wording policy and existing safety/technical-claim checks. Test that “your nervous system,” “you always,” and sign/house claims fail, while ordinary conditional direct address and everyday “response” pass. Do not classify prose acceptance as semantic proof.
- [x] Extend `schemaVersion?: 2 | 3`, legacy normalization, and every lifecycle validation boundary. Existing synthesis annotations/rules must remain valid in both versions 2 and 3; `natalLenses` absence or explicit `[]` must never acquire built-in rules. Preserve raw payload/checksum identity.
- [ ] Author and review 60 individual body/sign mechanisms and the two compound Moon rules specified in the design. Record each rule's origin, role, anchors, scene, and review rationale in the implementation review artifact; generated copy cannot acquire approval automatically.
- [ ] Ship the reviewed seed catalogue in the inactive `NATAL_CANDIDATE_BUNDLE` under `builtin-0.6.0`/schema 3, never in the `DEFAULT_BUNDLE` fallback. Assert 60 base and two compound entries, complete five-body/twelve-sign coverage, no raw astrological names in mechanisms, and distinct Capricorn/Sagittarius practical contrasts.
- [x] Preserve natal rules verbatim during existing cycle drafting. Include base/compound counts and coverage in draft/release previews; explicit natal edits require reviewed copy under a new immutable release identity. Retain signed authentication and conflicting-version rejection.
- [ ] Rerun the focused content suites; all schema, legacy, immutable-identity, drafting, and active-pointer assertions must pass. Commit only the explicit owned catalogue/lifecycle files after reviewing their diff.

## Task 2: Screen natal origins against service samples and uncertainty

**Files:** Create `src/lib/astro/natal-reliability.ts`, `src/lib/astro/natal-reliability.server.ts`, and `tests/reading-natal-reliability.test.mjs`. Modify `src/lib/astro/chart.ts` only to expose its existing `houseFromCusps` helper. Use the current `src/lib/astro/swiss.server.ts` client/deadline.

**Interfaces:** Export `NATAL_RELIABILITY_VERSION`, `NatalWindowSample`, discriminated `NatalLensEvidence`, `NatalReliabilityManifest`, `assessNatalReliability(samples: NatalWindowSample[], fingerprint: string, accuracy: TimeAccuracy): NatalReliabilityManifest`, and `validateNatalReliability(value: unknown, fingerprint: string, accuracy: TimeAccuracy): NatalReliabilityManifest`. Server output: `resolveNatalReliability(input: BirthInput, fingerprint: string, center: EphemerisResult): Promise<NatalReliabilityManifest>`.

- [ ] Write `sign_screen_uses_all_three_samples`, `house_requires_exact_service_placidus`, `raw_aspect_orb_not_display_rounding`, `mixed_source_preserves_only_qualified_items`, and `unknown_time_requests_no_boundaries`. Include sign margins `0.999°`/`1.0°`, house margins `0.499°`/`0.5°`, raw aspect `3.004°` versus rounded `3.00°`, and unsupported/duplicate source pairs.
- [ ] Run `node --test tests/reading-natal-reliability.test.mjs`; confirm the required exports and screening assertions initially fail.
- [x] Define the spec's exact manifest/proof union: matching chart fingerprint, declared accuracy, exactly three screened offsets and consistent service engines/versions, maximum five signs/45 body-pair aspect records/five houses, and closed unavailable reasons with no partial evidence. Validate stored margins/cusps/membership, nonfinite values, duplicate evidence, wrong offsets, unsupported versions, and invalid accuracy values.
- [x] Implement sign qualification from coherent high-precision non-degraded service positions at all three instants, identical sign, and `>= 1.0°` margins. Do not infer stability from center-only sign, speed, or current spread estimates.
- [x] Implement aspect qualification using raw service membership, valid positions for both bodies, and unrounded orbs at all three instants. Require agreement with service longitude geometry within `0.05°`; retain both longitudes and raw orbs in the proof. Reject in-app fill-ins, nodes, angles, absent service lists, mismatched geometry, and pair/aspect changes; use maximum sampled orb for rule matching.
- [x] Implement exact-time Placidus house qualification using valid service cusps/angles/positions, existing cusp membership, identical sampled house, and `>= 0.5°` margins. Hour/near/unknown bands, fallback houses, alternate systems, suppressed angles, or bad cusps cannot qualify houses.
- [x] Implement independent per-item gates so service positions can still yield a sign when only houses/aspects are missing. A degraded boundary position response yields an unavailable window; it never turns into a confident fallback lens.
- [x] Implement the server resolver: unknown time or degraded/unusable center returns without new requests; other known-time boundaries use UTC elapsed-time offsets ±2/15/60 minutes, run concurrently with current six-second request deadlines, reuse the center, and never retry. Enforce the relevant `AST-01..04` calculation uses and service-source constraints.
- [x] Add `boundary_requests_are_bounded_and_concurrent`, `dst_window_offsets_remain_elapsed_utc`, and `service_failure_preserves_central_chart`. Intercept network calls; assert exactly two extra requests at most and no live service access.
- [ ] Rerun the reliability suite. Record its guarantee as sampled screening, not continuous interval certification or psychological verification; commit explicit owned reliability/helper/test files.

## Task 3: Persist and load the reliability assessment without daily fan-out

**Files:** Modify `src/lib/pattern.server.ts`, `tests/helpers/records-harness.mjs`, and `tests/pattern-chapters.test.mjs`. Create `tests/reading-natal-snapshot.test.mjs`.

**Interfaces:** Consume Task 2's resolver/validator and existing encryption helpers. Produce `loadNatalReliability(snapshot: SnapshotRow, dek: CryptoKey): Promise<NatalReliabilityManifest | null>`. Persist only `houses.natalReliability_ct` as the new manifest field.

- [ ] Write `birth_save_encrypts_reliability_manifest`, `legacy_snapshot_has_no_lens_manifest`, `manifest_mismatch_or_corruption_fails_read`, and `today_never_resamples_birth`. Assert existing service chart fields and degraded chart saving survive assessment failure.
- [ ] Run `node --test tests/reading-natal-snapshot.test.mjs`; confirm the persistence/load behavior initially fails.
- [x] Resolve the assessment after `saveBirth` gets its central service response; encrypt it with the user's DEK while retaining all existing snapshot JSON, provenance, and feature extraction behavior.
- [x] Load/decrypt/validate the manifest once for daily assembly. Missing legacy fields return `null`; present malformed, wrong-fingerprint, wrong-accuracy, or undecryptable fields fail closed with a bounded read error before new model work.
- [x] Extend the local SQLite harness with full synthetic service responses and encrypted manifest seeding. Preserve existing minimal chart fixtures so they exercise the legacy-no-lens path rather than silently receiving invented reliability.
- [ ] Test save/recalculate upgrades, repeated birth saves, A→B→A edits, degraded central/boundary responses, and getPattern's existing source-upgrade path. No bulk history recalculation or background Today retries may be introduced.
- [ ] Rerun `node --test tests/reading-natal-snapshot.test.mjs tests/pattern-chapters.test.mjs tests/reading-cache.test.mjs`; assert Today adds no Swiss request and old chart selection remains correct. Commit only owned snapshot/test paths.

## Task 4: Select one relevant lens and share it with the template

**Files:** Create `src/lib/content/natal-lens.ts` and `tests/reading-natal-plan.test.mjs`. Modify `src/lib/reading.server.ts` and prerequisite `tests/reading-synthesis.test.mjs`.

**Interfaces:** Export `NATAL_LENS_PLAN_VERSION = "daily-natal-lens-2"`, `SelectedNatalLens`, and `DailyNatalLensPlan`. Produce `resolveDailyNatalLens(bundle: ContentBundle, primary: CycleInstance | null, interpretation: ResolvedCycleInterpretation | null, reliability: NatalReliabilityManifest | null): DailyNatalLensPlan`. Extend `assembleReading` with the optional fifth reliability argument and add `natalLensPlan` to its result.

- [ ] Write `transited_body_sign_leads_over_every_moon_rule`, `moon_contact_uses_the_most_specific_moon_rule`, `unscreened_target_sign_falls_back_to_the_specific_moon_rule`, `unscreened_moon_never_blocks_the_target_sign`, `target_compound_rule_is_eligible_and_leads_its_own_sign`, `missing_copy_never_infers_a_lens`, and `quiet_or_unsupported_target_has_no_lens`. Assert exact rule keys, statuses, release identity, dependencies `C1/I1`, and maximum one selection.
- [ ] Run `node --test tests/reading-natal-plan.test.mjs`; confirm failures identify the missing pure planner/template integration.
- [x] Match every selector against validated manifest evidence and the same effective catalogue. Use rule max-orb bounds, canonical service aspect pairs, supported personal-body anchors, and published `I1`; do not access context, natal feature scores, or a model.
- [x] Implement the exact `daily-natal-lens-2` order: the transited target's own aspect, house, then sign rules; Moon rules in the same order only as the fallback for other targets. Resolve same-tier ties with a fixed code-point comparison of opaque rule keys. Add tests for overlapping rules, reversed body pairs, and deterministic results under shuffled input arrays.
- [x] Implement all no-lens statuses: no cycle, no published primary interpretation, unreliable evidence, unsupported anchor, and unmatched reviewed copy. Never use `C2/C3`, weaker contacts, built-in catalogue mixing, or keyword inference to obtain a match.
- [x] Add the selected mechanism once inside the primary template paragraph and expose the same plan for facts. Preserve primary headline/confidence/reflection and existing `S1` placement; no standalone personality section.
- [x] Test combined `S1/N1`, compound-versus-base selection, template safety, missing legacy assessment, and unavailable service evidence. Assert no-lens template output equals the prerequisite behavior apart from new metadata.
- [ ] Rerun `node --test tests/reading-natal-plan.test.mjs tests/reading-synthesis.test.mjs tests/reading-language.test.mjs`; commit explicit planner/assembly/test files after diff review.

## Task 5: Send curated meaning as `N1` and enforce its use safely

**Files:** Modify `src/lib/ai/facts.ts`, `language.server.ts`, `daily-voice.ts`, `diagnostics.ts`, and `src/lib/pattern.server.ts`. Create `tests/reading-natal-language.test.mjs`; extend `tests/reading-diagnostics.test.mjs`, `reading-privacy.test.mjs`, `reading-writing-privacy.test.mjs`, and `reading-request-policy.test.mjs`.

**Interfaces:** Add optional `FactAtom.natalEvidenceId` and `kind: "temperament"`. Extend `readingFacts`'s plan input with `natalLensPlan`; produce `assertNatalLensFact(facts: FactAtom[], plan: DailyNatalLensPlan): void`. Reuse `assertDailyFactGraph` and the daily-only system brief. Keep generator request/response APIs body-only; never pass the private plan into `callGateway`.

- [ ] Write `natal_fact_has_published_copy_and_private_origin`, `natal_requires_first_two_paragraph_coverage`, `natal_dependencies_and_release_fail_closed`, and `natal_does_not_expand_geometry_permission`. Assert exact ID/statement, dependencies, evidence token, no cycle geometry, and no invented `N2`.
- [ ] Run `node --test tests/reading-natal-language.test.mjs`; confirm missing fact and coverage guards fail.
- [x] Emit `N1: Published natal lens, an interpretive possibility: <mechanism>` with exact reviewed text and local typed metadata. Validate against the selected rule/anchor/evidence/release at assembly; malformed graphs fail before provider traffic.
- [x] Insert its ID/statement after selected synthesis/primary meaning in `dailyFactBlock`. Ensure request serialization excludes selector keys, rule keys, role labels, origin placements, natal geometry, manifest, fingerprint, birth details, and identifiers.
- [x] Extend the daily system/voice brief with conditional interpretation, one practical distinction, and paragraph-1-or-2 `N1/C1/I1` use. Keep first-paragraph primary coverage and every `S1` parent rule; test a valid shared paragraph when both lenses are present.
- [x] Enforce `N1` coverage and explicit parents in every use. Retain sign/house, suppression, technical body/aspect/orb/date guards; `N1` does not authorize an absent Moon, natal aspect, or raw placement.
- [x] Add `natal_coverage` and `natal_claim` diagnostics; use `dependencies` for missing parents. Run the shared bounded wording check on natal candidates; add ordinary conditional-positive and certainty/clinical-negative cases. Missing `N1` does not skip an eligible transit request.
- [x] Capture complete intercepted requests in privacy tests. Assert raw origin sentinels/keys/proofs are absent, even in system messages and synthetic observations. Assert local mood/sleep/stress, notes, feedback, ambient, or consent edits leave the astrological request identical for the same effective chart/copy and permitted tone/depth.
- [ ] Test invalid/rejected/timeout/unconfigured responses use the same lens-aware template once, with the deterministic local question. Set prompt `daily-astro-body-6` and validator `daily-reference-5`; preserve one request and `20_000` ms budget, natal essay system/independent question, and drafting callers.
- [ ] Rerun the natal language, diagnostics, privacy, writing-privacy, and request-policy suites together. Commit explicit owned fact/prompt/test files; do not run a live model to qualify these unit assertions.

## Task 6: Encrypt saved natal provenance and version the correct cache

**Files:** Modify `src/lib/pattern.server.ts`, `src/lib/ai/quality.ts`, `tests/reading-cache.test.mjs`, `tests/reading-quality.test.mjs`, and `tests/reading-writing-privacy.test.mjs`. Create `tests/reading-natal-storage.test.mjs`.

**Interfaces:** Make `readingLanguage(row, dek: CryptoKey): Promise<ReadingLanguage>` revive the private envelope for owner reads; its row input includes saved language fields, `release_version`, and `primary_cycle_key`. Add optional decrypted `natalLens` evidence to `ReadingLanguage`. Save the spec's exact version-1 `language_meta.natal_lens_ct` envelope, safe `factOrder`, bounded status/version metadata, and existing public atoms.

- [ ] Write `natal_copy_and_origin_are_not_clear_metadata`, `cached_natal_evidence_is_exact_saved_evidence`, `manifest_upgrade_changes_reading_identity`, and `broken_saved_natal_envelope_fails_read`. Assert old IDs/feedback survive and the restored fact order/citations are identical.
- [ ] Run `node --test tests/reading-natal-storage.test.mjs`; confirm the clear-storage and archive behaviors initially fail.
- [x] Encrypt the selected plan, `N1`, evidence, and exact consumed template/model paragraph references in `natal_lens_ct`. Keep clear facts free of `N1` text/metadata and keep clear provenance free of rule/selector/placement/trait values; only bounded IDs/statuses/versions may remain.
- [x] Gate the exact used origins with `AST-05/07/08/20` external/provenance permissions. Record `N1` and actual consumed/cited paragraph IDs, not unavailable or unused template claims. Preserve source counts and existing failed-source-insert cleanup.
- [x] Validate/decrypt the owner envelope, merge saved facts using the safe ID order, and expose exact archived origins. Reject wrong release, anchor, parents, evidence ID, duplicate facts, missing cited evidence, corrupt ciphertext, and cross-account DEKs; never recompute a replacement lens.
- [x] Include natal plan/reliability versions, canonical decrypted manifest or explicit absent/unavailable state, existing interpretation/synthesis policy, prompt/validator/model and existing context in the HMAC identity. Exclude randomized natal ciphertext from identity; same assessed state must reuse the row, while a source/reliability upgrade must refresh it.
- [x] Update daily quality label for `N1` to “Published natal lens”; count only IDs/codes. Add a test that mechanisms, origin values, rule keys, manifests, free-text errors, and ciphertext never appear in admin report output or new cohort segmentation.
- [ ] Test cold reopen, same-fingerprint manifest upgrade, updated catalogue, legacy rows, missing envelope, source-save failure, and account switching. Assert no extra gateway request on a valid cached read.
- [ ] Rerun storage/cache/quality/writing-privacy suites; review persisted SQLite JSON for the encrypted boundary. Commit only owned persistence/quality/test files.

## Task 7: Make saved origins understandable and preserve owner data rights

**Files:** Modify `src/components/pattern/TodayEvidence.tsx`, `today-view.ts`, `src/routes/_authenticated/privacy.tsx`, `birth.tsx`, and `src/lib/pattern.server.ts`'s `exportEverything`/`eraseEverything` paths. Create `tests/reading-natal-evidence.test.mjs` and `tests/reading-natal-data.test.mjs`; retain the separate `PatternChapterEvidence.tsx` contract.

**Interfaces:** Consume Task 6's decrypted owner evidence. Reuse `todayFactId`, `todayParagraphId`, saved paragraph boundaries, existing buttons/details, and authenticated owner export. No new public evidence endpoint.

- [ ] Write `daily_natal_evidence_labels_interpretation_not_measurement`, `archived_origin_is_not_recomputed`, `natal_chapter_n1_label_is_unchanged`, `owner_export_contains_saved_natal_evidence`, and `account_erasure_removes_all_natal_evidence`. Include cross-account access failures and legacy absence.
- [ ] Run `node --test tests/reading-natal-evidence.test.mjs tests/reading-natal-data.test.mjs`; confirm new labels/export behavior initially fails.
- [x] Add daily `N1` label “Published natal lens” and category “Interpretive reference.” Show its exact saved rule origin, qualified service source, declared accuracy, margins/sample result, and links to `C1/I1`; distinguish reference availability from actual use.
- [x] Use “Checked at the recorded time and both uncertainty boundaries.” Describe the lens as an astrological possibility the reader can recognize or reject. Avoid “verified temperament,” biological wiring, confirmed birth time, or full-interval certainty. Preserve archived paragraph links and no-source legacy behavior.
- [x] Update privacy disclosure: the model may receive selected chart-derived interpretive wording; raw natal origins are omitted from the daily prompt, but derived wording remains personal information. Keep raw birth details, wellness, notes, ambient context, and feedback boundaries accurate; do not imply anonymization or new psychological inference permission.
- [x] Update birth UI expectations without introducing a verification flag: declared exact/near/hour accuracy is screened; unknown time omits natal lenses in this increment; service/sample failure retains the ordinary reading. Existing birth save/recalculate obtains a manifest for legacy charts.
- [x] Extend owner export to include decrypted selected lens and saved evidence alongside each reading, including archived release/paragraph identity. Test erasure removes chart and reading envelopes with existing rows/DEK, and no new retained temperament records remain.
- [ ] Rerun evidence/data and existing Today feedback tests. Manually qualify narrow/wide layouts, keyboard/focus/source links, collapsed evidence, async rendering, account switching, and reduced motion; record actual browser coverage separately from SSR tests.
- [ ] Commit explicit owned UI/export/test files after verifying no private origin is included in public, admin, or external-language responses.

## Task 8: Qualify specificity and grounded natal integration

**Files:** Modify `src/lib/ai/reading-evaluation.fixtures.mjs`, `.d.mts`, `reading-evaluation.server.ts`, `reading-evaluation.shared.ts`, `scripts/reading-eval-cases.mjs`, `scripts/evaluate-readings.mjs`, `src/components/pattern/ReadingEvaluation.tsx`, and existing evaluation suites. Update `READING-EVALUATION.md`; save review artifacts under `docs/reviews/daily-natal-lens/` during implementation.

**Interfaces:** Preserve fixed-case-ID-only evaluation and source/configuration hashes. Extend synthetic fixture data with optional synthetic `NatalWindowSample[]`; both offline and live synthetic runners derive the assessment through the same pure screen and pass it to assembly. Record plan/reliability identities without accepting arbitrary accounts, charts, prompts, or model overrides.

- [ ] Write `natal_fixed_cases_use_production_screen_and_planner`, `natal_fixture_runner_reads_no_birth_records`, `natal_policy_change_stops_mixed_run`, and `version5_comparison_requires_identical_transit_copy_and_inputs`. Assert no Swiss calls/database writes and dynamic case/request counts.
- [ ] Run the fixed/live-auth/offline evaluation suites; confirm missing natal fixtures/policy metadata produce the expected failures.
- [x] Preserve the sixteen prerequisite cases and add twelve: `natal-duty-reflex`, `natal-freedom-reflex`, `natal-service-aspect`, `natal-exact-house`, `natal-own-target`, `natal-moon-fallback`, `natal-sign-boundary`, `natal-unknown-time`, `natal-mixed-source`, `natal-degraded-positions`, `natal-legacy-snapshot`, and `natal-synthesis-integration`. Freeze version `synthetic-daily-5`, 28 cases, and a maximum 27 model attempts when all primary copy exists.
- [x] Make duty/freedom inputs identical in `C1`, timing, tone/depth, and other editorial facts; change only synthetic natal evidence. For `natal-sign-boundary`, screen out both Moon and the primary-target sign. Mixed house provenance permits a qualified base sign; unknown/degraded/legacy cases omit `N1` while the transit still uses the model.
- [x] Use synthetic service-marked sample fixtures and raw aspect orbs; derive manifests rather than hardcoding successful booleans. Add unit cases for reliable primary-target fallback, no catalogue, overlapping rules, near/hour house suppression, and raw orb threshold failure. Label these as synthetic fixtures, not live Swiss accuracy evidence.
- [x] Include plan/reliability versions in report/run consistency. Keep no-account/no-write authentication boundary, one case at a time, stop/cost-failure behavior, no automatic retries, partial-result retention, and no trait values in production diagnostics.
- [x] Replace the UI's hardcoded ten/nine text with catalogue-derived total and maximum eligible request counts. Show selection status and source support in synthetic reports only; keep production quality output bounded.
- [ ] Run offline replay with new artifact paths:

  ```sh
  npm run eval:reading -- --output /tmp/daily-natal-baseline-replay.json
  npm run eval:reading -- --write-responses /tmp/daily-natal-candidates.json
  npm run eval:reading -- --responses /tmp/daily-natal-candidates.json --output /tmp/daily-natal-candidate-replay.json
  npm run eval:reading -- --compare /tmp/daily-natal-baseline-replay.json /tmp/daily-natal-candidate-replay.json --output /tmp/daily-natal-replay-comparison.json
  ```

  All cases must complete and comparison inputs/hashes must match. This verifies fixture/validator/report plumbing, not generated writing or the effect of a changed prompt.

- [ ] In one isolated environment, run the frozen version-5 fixtures with no active release (the natal-free built-in baseline) and with the natal candidate release activated (the candidate). Comparison requires identical input hashes, `transitCopyHash` and model. Do not compare version-2/3/4 reports directly to version 5.
- [ ] Obtain actual baseline/candidate model reports through an explicitly invoked isolated synthetic evaluation; preserve case inputs, source identities, outputs, request counts, partial failures, and cost evidence. Do not activate a production content pointer for the experiment; absent provider results leave writing qualification open.
- [ ] Review candidate and template prose blind with the same reviewers. Require specificity/grounding/lens integration each `>= 4/5`, zero unsupported personal claims, and a supported practical contrast in the duty/freedom pair. Negative cases must contain no natal claim. Record lens integration and unsupported-claim flags in review notes alongside the existing rubric.
- [ ] Rerun the focused evaluation suites after report changes; record automated structural results separately from manual judgments. Commit explicit fixture/evaluator/UI/docs files with the reviewed evidence.

## Task 9: Complete checks and prepare a reviewable release candidate

**Files:** Update `README.md`, `READING-INTEGRITY.md`, `READING-EVALUATION.md`, and this checklist/spec as implementation progresses. Reuse existing content-release/deployment workflows.

- [x] Document catalogue coverage, selector order, declared-time sampling limits, absence/fallback behavior, provider minimization, encrypted evidence, archive/export behavior, and exact policy versions. Keep current behavior distinct from uncompleted qualification/publication.
- [x] Run all local lanes under Node.js 24:

  ```sh
  npm test
  npx tsc --noEmit
  npm run lint
  npm run build
  git diff --check
  ```

- [x] Record each result separately and preserve unrelated baseline failures with comparison evidence. Confirm no network was used by tests/replay; the browser and actual-model gates need their own recorded evidence.
- [ ] Prepare the complete reviewed schema-3 graph as a new inactive release candidate with immutable version/checksum, catalogue review, source identities, fixtures, and writing results. Preparing this checklist does not authorize activation, deployment, or model spend.
- [ ] On an explicitly requested release, use the validated publish/activate workflow and verify a new qualified chart produces one correctly sourced `N1`; degraded/unknown/legacy cases retain their proper fallback. Verify cached/archive evidence and feedback remain attached to original readings.
- [x] Retain a valid prior release for rollback. Confirm rollback omits natal lenses when the prior graph lacks them and does not inherit the new built-in catalogue or rewrite historical evidence.
- [ ] Mark the feature complete only when implementation, browser checks, actual-model writing qualification, and any requested release checks pass. Distinguish local, published-copy, deployed, and production evidence.

## Revision 2: verification findings

Implemented and locally verified after an independent verification of the first
candidate; see the design's Revision 2 section and the validation record.

- [x] Selection follows the day's contact (`daily-natal-lens-2`); own-target compound rules are eligible; plan, fixture and record tests cover leading, fallback and tie behavior.
- [x] The built-in fallback stays `builtin-0.5.0` with no catalogue; `NATAL_CANDIDATE_BUNDLE` (`builtin-0.6.0`, copy checksum unchanged) activates only as a release. Requests without `N1` match `cc6a3cd` byte for byte.
- [x] While a catalogue is active, Today re-runs a missing, stale-version or retryably failed screen, at most once per six hours, never for unknown time, storing only improvements (approved by the project owner, including Swiss cost).
- [x] Stale reliability versions read as no lens instead of failing; the attempt time never enters cache identity.
- [x] The active-release read retries once and then fails closed.
- [x] Export marks one unreadable saved row instead of failing; owner reads of it still fail closed.
- [x] Erasure deletes chapter essays and clears birth fingerprints from retained audit events.
- [x] Version-5 comparisons accept a natal-free baseline with identical transit copy and model.

## Final acceptance checklist

Checked acceptance items are locally verified structural/intercepted results.
Independent copy approval and the actual-model writing judgment below remain open.

- [ ] One reviewed natal lens changes the practical distinction in the primary reading without asserting a verified trait or inventing a lived event.
- [x] Reliable personal-planet signs, service aspects, and exact-time Placidus house context follow the documented screen and source provenance.
- [x] Unknown time, boundary failures, unsupported targets, missing copy, and legacy snapshots never acquire inferred traits; the ordinary reading remains available.
- [x] `N1` contains only curated meaning in the provider request and cannot expand raw placement/geometry permissions.
- [x] Early lens use, explicit `C1/I1` dependencies, synthesis coexistence, and same-plan template fallback pass.
- [x] Saved personal copy and origins are encrypted; owner cache/archive/export reads restore exact evidence and account erasure removes it.
- [x] Admin quality reports contain only bounded IDs/codes and no temperament segmentation or origin values.
- [x] Content drafting/legacy releases retain authoritative reviewed catalogues and immutable identity.
- [x] Local-context changes leave provider input unchanged; daily request count/budget and separate natal essay/question guards pass.
- [ ] Actual synthetic model outputs and template fallbacks pass the documented blinded writing gate.

## Checklist preparation evidence

The original checklist preparation was documentation only. This continuation implemented and locally exercised the feature as recorded above and in the validation record. The first offline artifacts used the approved `/tmp/opencode/` directory; Revision 2 artifacts were regenerated in a temporary session directory with the same flags and ordered modes, and their identities are recorded in the validation record. Real Swiss requests, paid model evaluation, independent writing review, publication, deployment and live-production checks remain unperformed. The catalogue has an individual agent editorial record; that is not automatic independent approval.
