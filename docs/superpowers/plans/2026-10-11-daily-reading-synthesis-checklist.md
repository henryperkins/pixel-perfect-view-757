# Daily Reading Synthesis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the daily reading one reviewed central relationship between its strongest two eligible contacts, supported by curated meanings for all selected contacts and a complete saved source trail.

**Architecture:** Extend the versioned interpretation bundle with exact-aspect entries, editorial themes, and directional synthesis rules. A pure server planner selects the reviewed relationship before either template assembly or model generation. Both output paths use the same plan; validators enforce its reference dependencies and the evidence panel preserves its origin.

**Tech Stack:** TypeScript, Zod, TanStack Start/React, existing D1 JSON metadata, Node.js 24 `node:test`/Vite test harness, existing Lovable model gateway.

**Spec:** [Daily reading synthesis design](../specs/2026-10-11-daily-reading-synthesis-design.md).

**Status reconciled 2026-10-13:** Implementation and publication are complete; recorded active content `0.7.1` includes the six-rule synthesis catalogue. The original full writing round failed. Later targeted reviews passed their combined-synthesis samples, without establishing a full synthesis benchmark or human approval. The expanded catalogue and final-stack review remain open under release-completion Tasks 12–14.

**Evidence:** [Local implementation](../releases/2026-10-11-daily-synthesis-validation.md), [failed full review](../../reviews/daily-reading-writing/2026-10-11/writing-review.md), [targeted combined review](../../reviews/daily-transit-story/2026-10-12-prompt-recheck/README.md), [joint activation](../../reviews/daily-transit-story/2026-10-12-transit-runtime-fix/README.md), and [expanded matrix](../../reviews/daily-synthesis/README.md). The [central closeout record](2026-10-12-release-completion-checklist.md#reconciled-status) owns current actions. The original task checkboxes below are a historical execution ledger; an unticked procedural step is not by itself an outstanding implementation requirement. No new production checks were run for this reconciliation.

## Global constraints

- Scope is recommendation 1: supporting interpretations and a reviewed synthesis library. Read the linked spec before implementation.
- “Natal houses, angles and aspects come from the Swiss Ephemeris service response (Placidus); in-app math is only the degraded fallback and fills angle contacts the service omits.” This work does not add natal calculations or change their source.
- “Section observers animate already-visible content once, never hide it; chapter panels retain visited content while collapsing.” Evidence additions must fit the existing accessible UI and motion behavior.
- Preserve the existing top-three limit, importance threshold `> 0.02`, birth-time suppression, primary headline/confidence, local reflection assembly, and external-context privacy boundary.
- Synthesis is published editorial interpretation, not astronomical measurement or an established personal state.
- Follow [AGENTS.md](../../../AGENTS.md)'s current member-provider selection and the [current execution reference](2026-10-12-release-completion-checklist.md#current-execution-reference): one call, no retry, 60,000 ms daily deadline and provider-specific Gemini 3.8 identities. Keep schema-specific response contracts; the original 3.7 / 20,000 ms settings in the execution ledger are historical.
- Preserve historical readings, paragraph boundaries, feedback, and source identity. Do not silently rewrite published content or mix built-in rules into a legacy active release.
- No schema migration is proposed: use existing bundle and `language_meta` JSON fields, with tolerant readers for historical rows.
- Preserve unrelated work and Lovable-connected history. Never force-push or rewrite pushed commits. During implementation, stage explicit owned paths only.

## Review focus

Each item is pinned by tests in the named task.

1. Legacy active releases missing synthesis metadata must never inherit new built-in pair rules or themes — Tasks 1 and 3.
2. Equal importance, missing copy, reversed order, and suppressed supporting contacts must yield a stable eligible plan without invented relationships — Task 3.
3. An apparently cited synthesis with missing/wrong parents must fail before display; unsupported prose can still require human review — Tasks 4 and 7.
4. Drafting, ingestion, activation, and rollback must preserve valid graphs and leave the active release intact on invalid input — Task 2.
5. Cached and archived evidence must use the exact saved relationship even after content changes; old feedback must survive — Tasks 5 and 6.

## File responsibilities

| File                                                                | Responsibility                                                                |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/content/default-bundle.ts`                                 | Exact-aspect lookup, editorial types, reviewed built-in seed catalogue        |
| New `src/lib/content/schema.ts`                                     | Shared graph validation, legacy normalization, content equality               |
| New `src/lib/content/synthesis.ts`                                  | Pure interpretation/pair selection and shared plan types                      |
| `src/lib/reading.server.ts`                                         | Eligible plan integration and deterministic synthesis-aware fallback          |
| `src/lib/ai/facts.ts`                                               | Supporting/synthesis atoms, graph checks, ordered fact sheet                  |
| `src/lib/ai/language.server.ts`, `daily-voice.ts`, `diagnostics.ts` | Prompt, citation/dependency rules, bounded outcomes and versions              |
| `src/lib/pattern.server.ts`                                         | Content lifecycle integration, persistence, restored metadata, cache identity |
| Public content-release routes                                       | Shared validation and immutable signed-ingest identity                        |
| `TodayEvidence.tsx`, `today-view.ts`                                | Reader-visible synthesis classification and parent links                      |
| `src/lib/ai/quality.ts`, admin content screen                       | Separate synthesis references and missing-interpretation skips                |
| Existing evaluation modules/scripts                                 | Fixed synthesis cases, reproducible reports, manual quality review            |
| New/extended tests listed below                                     | Structural, lifecycle, privacy, archive, and writing-regression evidence      |

## Task 1: Define and validate the editorial catalogue

**Files:** Create `src/lib/content/schema.ts`. Modify `src/lib/content/default-bundle.ts`. Create `tests/reading-synthesis.test.mjs`; extend `tests/reading-content.test.mjs`.

**Interfaces:** Export the `ThemeTag`, `SynthesisSelector`, and `SynthesisRule` contracts from the spec. Produce `validateContentGraph(raw: unknown): void`, `normalizeContentBundle(raw: unknown, releaseVersion: string, defaults: ContentBundle): ContentBundle`, and `samePublishedBundle(a: unknown, b: unknown): boolean`. Keep `findInterpretation`'s existing call signature. Reject new annotations/rules without schema version 2; preserve raw payload identity separately from normalization.

- [x] Add failing tests for exact-aspect precedence over family copy, legacy precedence, active-array authority, missing synthesis normalization, duplicate keys/pairs, missing parents, wrong parent themes, wildcard selectors, unknown tags, invalid relationship text, and the specified size limits.
- [x] Run `node --test tests/reading-synthesis.test.mjs tests/reading-content.test.mjs`. Confirm new assertions fail for the intended missing behavior, with no external network.
- [x] Implement the shared schema and normalizer. Distinguish an absent legacy array from an explicit active array. Validate safety without changing published text. Compare published bundles with property-order-insensitive object equality and order-sensitive arrays.
- [x] Extend lookup with the eight-level exact/family precedence in the spec. Annotate reviewed entries only; absent themes normalize to an empty array.
- [x] Add the six exact contact entries and six directional rules from the spec; bump built-in content to `builtin-0.5.0`. Check that each mechanism supports its tags and each positive rule supports both parents. Independent rules have `mechanism: null`.
- [x] Run the same focused tests. Acceptance: all valid legacy fixtures remain usable, invalid graphs are rejected, and no active-array miss searches the built-in catalogue.
- [x] Record the reviewed seed keys and copy in the spec. Every seeded rule needs an editorial review against both source mechanisms before publication.

Example required assertion:

```js
assert.deepEqual(
  normalizeContentBundle(legacyActiveBundle, "legacy-reviewed", newBuiltinBundle).synthesisRules,
  [],
);
```

## Task 2: Make the content lifecycle preserve and validate synthesis

**Files:** Modify `src/lib/pattern.server.ts` (`activeBundle`, `draftRelease`, `publishDraft`, `activateRelease`, `listDrafts`, `listReleases`), `src/routes/api/public/content-releases.ts`, `src/routes/api/public/content-releases.rollback.ts`, and `src/routes/_authenticated/content.tsx`. Create `tests/reading-content-releases.test.mjs`; reuse `tests/helpers/records-harness.mjs` with narrowly scoped route fixtures if needed.

**Interfaces:** Consume Task 1's validator/normalizer/equality helper. Produce validated effective `ContentBundle` objects and draft/release previews with theme and rule counts. Preserve existing authentication and workflow-pointer calls.

- [x] Add failing lifecycle tests: untouched metadata survives drafting; overwritten mechanism loses inherited themes and dependent rules; an invalid draft/ingest/activation/rollback leaves the previous active row unchanged; identical version replay is idempotent; conflicting version reuse returns `409`.
- [x] Run `node --test tests/reading-content-releases.test.mjs`. Verify expected missing-behavior failures.
- [x] Route every load/publication/activation path through shared validation. Reject malformed stored active graphs with a closed error rather than generating from a partial graph. Preserve valid legacy partial-bundle defaults described in the spec.
- [x] Change drafting to overlay returned entries onto the full base bundle. Preserve unmodified reviewed exact entries, domains, phases, natal copy, themes, and rules. Clear theme approval on changed text and remove affected rules into `notes.synthesisReviewRequired`; do not auto-approve model-produced tags.
- [x] Replace overwrite-by-version ingestion with insert-or-reuse behavior that remains safe under a repeated/concurrent version collision. Compare stored content, return the original row/checksum for identical content, and reject differing content without changing its active state. Validate before writing or deactivating anything.
- [x] Show theme/rule coverage and removed-rule keys in draft previews. In release summaries count `cycles.length` and `synthesisRules.length` rather than counting matching top-level field names.
- [x] Run the lifecycle tests. Acceptance: a valid candidate can be stored inactive, invalid graphs never change the active pointer, and the original release content/checksum is immutable.

## Task 3: Build one shared deterministic interpretation plan

**Files:** Create `src/lib/content/synthesis.ts`. Modify `src/lib/reading.server.ts`. Extend `tests/reading-synthesis.test.mjs` and `tests/reading-content.test.mjs`.

**Interfaces:** Produce `resolveInterpretationPlan(bundle: ContentBundle, eligibleCycles: CycleInstance[]): DailyInterpretationPlan` and the spec's resolved interpretation/synthesis types. Add `interpretationPlan: DailyInterpretationPlan` to `AssembledReading`; retain existing primary editorial fields.

- [x] Add failing tests for selected tension, selected reinforcement, explicit independence, unmatched/wildcard pairs, unavailable parent copy, no/one contact, both reviewed orientations, array-order invariance, and equal-importance tie-breaking.
- [x] Add suppression tests in which an otherwise strongest angle/house contact is ineligible. Assert its cycle key, meaning, and potential rule never enter the plan. Add a fourth-contact test proving it cannot become a synthesis parent.
- [x] Run `node --test tests/reading-synthesis.test.mjs tests/reading-content.test.mjs`.
- [x] Resolve each eligible contact independently from the effective bundle. Match only `C1/C2`. Use reviewed tags and exact rule selectors; do not infer polarity from planet names or broad aspect family.
- [x] Add `cycle_key` as the reading-boundary tie-breaker for equal importance. For a missing relationship, retain `unmatched`; for an explicit independent rule, retain `independent` and its rule key without emitting synthesis text.
- [x] Use selected synthesis copy once in the deterministic body, after the primary mechanism. Preserve existing optional domain/phase/timing copy and supporting calculation summary. Record supporting interpretation provenance only when its meaning is actually consumed by synthesis/template copy.
- [x] Run the focused tests. Acceptance: model and template inputs share the same selected cycle identities, parent meanings, rule, and release version; independent/unmatched pairs produce no joint narrative premise.

Required behavior example:

```js
assert.equal(plan.pairStatus, "selected");
assert.equal(plan.synthesis.relationship, "tension");
assert.deepEqual(plan.synthesis.dependsOn, ["C1", "I1", "C2", "I2"]);
assert.equal(independentPlan.synthesis, null);
```

## Task 4: Carry synthesis through facts, the prompt, and validation

**Files:** Modify `src/lib/ai/facts.ts`, `src/lib/ai/language.server.ts`, `src/lib/ai/daily-voice.ts`, and `src/lib/ai/diagnostics.ts`. Extend `tests/reading-language.test.mjs`, `tests/reading-request-policy.test.mjs`, `tests/reading-diagnostics.test.mjs`, and `tests/reading-synthesis.test.mjs`.

**Interfaces:** Extend `FactAtom` with the optional safe metadata in the spec. Extend `readingFacts`'s plan input to include `interpretationPlan`. Produce `assertDailyFactGraph(facts: FactAtom[]): void`, throwing a closed `InvalidDailyFactGraph` error before provider traffic on malformed input. Keep `generateReadingProse`'s caller contract and response shape.

- [x] Add failing tests that `I2/I3` reflect their same-index cycles, `S1` retains four correct parents and its source identity, and fact order places selected synthesis/meaning ahead of calculation references.
- [x] Add graph tests for duplicate IDs, missing parents, self/cyclic edges, `I2` bound to `C3`, cross-release parents, and `S1` substituting `C3/I3` for `C2/I2`. Each must fail before an intercepted gateway request is recorded. Plain legacy atoms remain compatible; incomplete `S1` metadata is rejected.
- [x] Run `node --test tests/reading-language.test.mjs tests/reading-request-policy.test.mjs tests/reading-diagnostics.test.mjs tests/reading-synthesis.test.mjs`.
- [x] Emit only published interpretation entries from the resolved plan. Generate `S1` with `kind: "synthesis"`, parent IDs, rule key, and release version; attach no cycle geometry to it. Add those dependency IDs to its rendered fact statement so the writer can see them.
- [x] Add `DAILY_SYSTEM_VOICE` to distinguish calculated references from published interpretations. Extend `callGateway` with a final optional `system: string = VOICE` parameter; only daily generation passes the new brief. Test that daily requests use it and natal/editorial callers retain their existing system message.
- [x] Change the daily prompt to develop the supplied relationship in paragraph 1 or 2. Require its paragraph to cite `["S1", "C1", "I1", "C2", "I2"]`. Without `S1`, explicitly keep the primary focus and prohibit an invented joint relationship.
- [x] Keep paragraph 1's `C1/I1` coverage. Enforce `S1` coverage in the first two paragraphs and its explicit parent citations wherever used. A paragraph's `I2/I3` citations may support ordinary interpretive copy; any astronomical detail still requires the direct matching `C2/C3` citation.
- [x] Preserve all current shape, safety, suppression, date/orb/relation, and current-orb-versus-exact-time checks. Dependency membership does not become a semantic-proof claim.
- [x] Add `dependencies` and `synthesis_coverage` rejection codes and `no_interpretation` skipped code. Keep envelope version 1 and existing historical decoding; permit only `no_cycle` or `no_interpretation` for an unattempted skip. If the primary interpretation is absent, return deterministic copy without a model call.
- [x] Set prompt version `daily-astro-body-5` and validator version `daily-reference-4`. Retain the existing model, JSON schema, one call, and `20_000` ms deadline.
- [x] Test acceptance with synthesis in paragraph 1 and paragraph 2; rejection with no synthesis coverage, missing parents, unknown `S1`, wrong technical cycle, and suppression bypass; gateway failure and draft rejection must return the synthesis-aware template.
- [x] Run the focused tests again. Acceptance: explicit references and calculated claims are checked without increasing provider calls or exposing local context.

## Task 5: Save exact provenance and invalidate the correct cache

**Files:** Modify `src/lib/pattern.server.ts` (`ReadingLanguage`, `readingLanguage`, `getToday`), `src/lib/ai/diagnostics.ts`, and `src/lib/ai/quality.ts`. Extend `tests/reading-writing-privacy.test.mjs`, `tests/reading-cache.test.mjs`, `tests/reading-privacy.test.mjs`, and `tests/reading-quality.test.mjs`.

**Interfaces:** Export `DAILY_READING_PLAN_VERSION = "daily-synthesis-1"`. Persist safe fact metadata and bounded plan identity in the existing `language_meta` JSON field. Revive both enriched facts and legacy ID/statement-only facts.

- [x] Add failing tests for database reopen preserving `S1` text/parents/rule/version, restoration of `I2/I3`, invalid metadata exclusion, historical facts without metadata, and unchanged-context reuse without another gateway call.
- [x] Add a cache test that seeds the current pre-feature key and confirms a new plan-policy reading is generated while the old reading ID, source rows, and feedback remain intact.
- [x] Run `node --test tests/reading-writing-privacy.test.mjs tests/reading-cache.test.mjs tests/reading-privacy.test.mjs tests/reading-quality.test.mjs`.
- [x] Replace the ID/statement-only persistence projection with an explicit safe metadata allowlist. Validate revived fields; never expose raw errors, authoring notes, or private context as provenance.
- [x] Replace the primary-only consumed-reference pattern with `I1–I3, D1, P1, T1, S1` coverage. Persist cited synthesis with rule/version/parent details. Preserve the source-count and encrypted paragraph-boundary checks.
- [x] Include plan, prompt, validator, and configured-model identity in the idempotency digest. Retain existing chart/date/bundle/context inputs. A release rollback may reuse a previously saved matching reading; it must not relabel that reading with newer synthesis text.
- [x] Add “Published synthesis” to aggregate fact categories and separate quiet skips from missing-interpretation skips. Do not read generated prose, private notes, or feedback labels for this feature.
- [x] Re-run privacy assertions proving that mood, energy, sleep, stress, local-time framing, and note-only edits do not alter provider input. Keep ordinary tone/depth preference permission checks.
- [x] Run the focused tests. Acceptance: a cached reading reproduces its original enriched facts and consumed source trail exactly.

## Task 6: Make the synthesis inspectable in the existing UI

**Files:** Modify `src/components/pattern/today-view.ts`, `src/components/pattern/TodayEvidence.tsx`, and the quality/reference displays in `src/routes/_authenticated/content.tsx`. Create `tests/today-evidence.test.mjs`.

**Interfaces:** Consume Task 5's safe saved metadata. Extend existing fact-label/category helpers for `S1`. Reuse stable `todayFactId` and `todayParagraphId` targets.

- [x] Add failing helper/render tests: `S1` is labeled “Published synthesis”; its relationship and source version appear; all saved parents link to their fact targets; absent historical metadata does not create fabricated links.
- [x] Run `node --test tests/today-evidence.test.mjs`.
- [x] Render the saved synthesis statement and parent references inside the existing evidence panel. Keep the calculation category distinct and preserve original supplied-text inspection.
- [x] Display supplied and consumed references accurately: uncited supporting meanings can appear in saved inputs but cannot be presented as consumed paragraph evidence.
- [x] Update admin fact categories and skip labels to match Task 5. Preserve the statement that reference membership cannot establish all semantic support.
- [x] Run the helper/render tests. During implementation, inspect a synthetic saved reading on phone/desktop and verify keyboard focus from paragraph → `S1` → parents, reduced motion, archived evidence, and long text wrapping.
- [x] Acceptance: every shown parent link targets the same saved reading, and neither the UI nor cached hydration recomputes historical editorial meaning.

## Task 7: Extend the fixed benchmark and qualify the writing

**Reconciled disposition:** Fixture/evaluator implementation is complete. The original v3 comparison sequence below was followed by a matched v5 writing-correction round that failed. Current general fixtures are v7 (50 cases); historical reports keep their original identities. The later small combined review is limited evidence. New final-stack qualification belongs to release-completion Task 13, not a replay of this obsolete v3 setup.

**Files:** Modify `src/lib/ai/reading-evaluation.fixtures.mjs` and `reading-evaluation.fixtures.d.mts` as needed, `reading-evaluation.server.ts`, `reading-evaluation.shared.ts`, `scripts/reading-eval-cases.mjs`, `scripts/evaluate-readings.mjs`, and `src/components/pattern/ReadingEvaluation.tsx`. Extend `tests/reading-eval.test.mjs`, `tests/reading-eval-fixtures.test.mjs`, `tests/reading-live-eval.test.mjs`, and `tests/reading-live-eval-auth.test.mjs`. Update `READING-EVALUATION.md`.

**Interfaces:** Keep the fixed-case-ID-only evaluation boundary. Retain enriched facts and plan identity in reports; tolerate prior reports where new plan fields are absent. Add plan version to run-consistency checks and comparison metadata without preventing comparison between deliberately different policies on identical fixtures.

- [x] Establish fixture version `synthetic-daily-3`: retain the current ten cases and add `synthesis-tension`, `synthesis-reinforcement`, `synthesis-independent`, `synthesis-reversed`, `synthesis-suppressed-support`, and `synthesis-unmatched`. There are 16 cases and at most 15 model attempts when all primary interpretations exist.
- [x] Pin assertions for each selected rule/status/parent set. Add handwritten accepted/rejected candidates covering synthesis in paragraph 1/2, missing parents, unsupported numeric claims, and invented relationships reviewed manually. Keep fixture responses explicitly labeled as validator examples.
- [x] Replace hard-coded ten/nine UI copy and test counts with catalogue-derived counts. Keep the API closed to arbitrary charts, prompts, model choices, or private context.
- [x] Run `node --test tests/reading-eval.test.mjs tests/reading-eval-fixtures.test.mjs tests/reading-live-eval.test.mjs tests/reading-live-eval-auth.test.mjs`. All gateway traffic remains intercepted in this test lane.
- [ ] Preserve separate baseline and candidate code/content identities. Build the same v3 fixture catalogue into the baseline and candidate evaluators before a writing comparison; never compare a saved v2 report with v3 inputs. The local candidate and prior source bundle identities are recorded; actual-model baseline preparation and paired runs remain pending.
- [x] Run offline replay with new output paths:

  ```sh
  npm run eval:reading -- --output /tmp/pattern-synthesis-replay.json
  npm run eval:reading -- --write-responses /tmp/pattern-synthesis-candidates.json
  ```

- [ ] With separately authorized model access, obtain complete baseline/candidate runs through the fixed synthetic evaluation in an isolated environment. The UI reads the active bundle, so pin the intended reviewed bundle in that environment; do not activate production content merely to perform qualification. Preserve raw synthetic candidates, fallback bodies, exact versions, and failures.
- [ ] Compare complete same-fixture reports using:

  ```sh
  npm run eval:reading -- --compare /tmp/pattern-synthesis-before.json /tmp/pattern-synthesis-after.json --output /tmp/pattern-synthesis-comparison.json
  ```

- [ ] Have the same blinded reviewers score actual candidates using specificity, voice, repetition, and grounding. In `notes` also score synthesis coherence from 1–5: 1 = interchangeable/invented connection; 3 = both sources appear but the relationship needs editing; 5 = one distinct relationship supported by both sources.
- [ ] Writing gate: no unsupported substantive claims or invented personal events; each selected tension/reinforcement case scores at least 4/5 for specificity, grounding, and synthesis coherence; independent/unmatched cases invent no joint premise. Record disagreements and revise source copy or prompt, then run a new evidence round.
- [ ] Keep validation acceptance, writing scores, latency, and gateway failures separate. Any incomplete live run remains partial and does not satisfy this gate.

## Task 8: Finish documentation, checks, and a reviewable release candidate

**Reconciled disposition:** Source and content delivery are recorded by the joint activation receipt above; the original unchecked publication procedure is retained as history. Full final-version writing qualification and applicable signed-in acceptance remain in release-completion Tasks 13–14.

**Files:** Update `README.md`, `READING-INTEGRITY.md`, and `READING-EVALUATION.md` alongside the implementation. Keep these design/checklist documents accurate about remaining work.

- [x] Document exact lookup precedence, supporting meanings, selected/independent/unmatched behavior, dependency limits, immutable content rules, skip reasons, and archived evidence behavior.
- [x] Run the project-wide local lanes under Node.js 24:

  ```sh
  npm test
  npx tsc --noEmit
  npm run lint
  npm run build
  git diff --check
  ```

- [x] Record each result separately. If a check fails on unrelated baseline code, preserve the failure and compare the baseline before describing it as unrelated. Offline replay success does not substitute for the actual-model writing gate.
- [x] Prepare the reviewed complete bundle as a new inactive release candidate with its exact version, checksum, source keys, rule keys, and evaluation evidence. No public release or active-pointer change is part of preparing this checklist.
- [ ] For an explicitly requested release, publish/activate the reviewed candidate through the validated existing content workflow, then verify new readings use its version, saved `S1` parents, and correct template fallback. Verify old saved readings still retain their original content and feedback.
- [x] Preserve a valid prior release for rollback. Rollback must select the previous graph without rewriting historical rows or mixing new built-in rules into it. The prior complete built-in source bundle is preserved locally; production's prior active release remains uninspected.
- [ ] Mark the feature complete only when all implementation checks and the actual-model writing gate have passed. Report local code checks, source publication, deployment, and live behavior as separate evidence.

## Final acceptance checklist

These original acceptance boxes record local implementation and intercepted-model coverage. Full generated-writing qualification below remains unpassed; the current status and scoped later review are recorded above.

- [x] Published meanings are available for each selected supporting contact where copy exists.
- [x] The strongest two eligible contacts receive at most one reviewed tension/reinforcement synthesis.
- [x] Independent, unmatched, wildcard-only, missing-copy, and suppressed-parent plans/templates omit joint synthesis; prompts prohibit inventing one.
- [x] Exact aspect entries retain legacy fallback behavior and active-release authority.
- [x] Model paragraphs and deterministic fallback share the same relationship and source graph.
- [x] Citation dependencies, geometry checks, and the first-two-paragraph synthesis requirement pass.
- [x] Full saved provenance and dependency links survive cache reads and content changes.
- [x] Drafting and publication preserve valid graphs and immutable versions.
- [x] Existing privacy, response shape, request count, deadline, and historical feedback protections pass.
- [ ] Real synthetic candidates meet the documented writing gate; replay fixtures are not presented as model-quality evidence.

## Checklist preparation evidence (historical)

The original checklist preparation involved repository/source inspection and
documentation validation only. The implementation continuation subsequently ran
local tests, typecheck, lint with baseline comparison, build, offline replay, and
component browser checks, as recorded in the linked validation document. Paid
model evaluation, content publication, and live-production checks remain pending.

## Addendum — 2026-10-11, writing qualification round

Recorded by the
[writing qualification checklist](2026-10-11-daily-reading-writing-qualification-checklist.md);
the items above are not retroactively ticked. The synthesis code and prompt
`daily-astro-body-8` reached `main` in `4c96fd5` and are publicly served. A complete
hosted natal-free run on matched inputs exists, but its first blinded AI writing
review **failed** (see the
[writing review](../../reviews/daily-reading-writing/2026-10-11/writing-review.md)),
so the writing-gate item above stays open.
