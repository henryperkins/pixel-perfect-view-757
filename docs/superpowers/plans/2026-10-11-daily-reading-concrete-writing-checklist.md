# Daily Reading Concrete Writing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Develop each daily reading around one supported theme, one or two possible everyday situations, and one focused reflection question, with a separate measurable editorial-quality check.

**Architecture:** Add reviewed scene/question frames to the published interpretation graph and select one from `S1` or `I1`. Share that plan between the daily model and deterministic template, teach the model with complete edited examples, and evaluate its astronomical body with daily-only editorial checks. Select the final question locally and preserve the exact writing evidence in an encrypted, versioned record.

**Tech Stack:** TypeScript, Zod, TanStack Start/React, existing immutable content releases, D1 JSON/AES-GCM helpers, Node.js 24 `node:test`/Vite/SQLite harness, existing Lovable gateway.

**Spec:** [Daily reading concrete writing design](../specs/2026-10-11-daily-reading-concrete-writing-design.md).

**Status (2026-10-13):** Source implementation of Tasks 1–8 and Task 9's fixture/capture/diagnostic work is complete in the release-completion worktree. The inactive candidate has 81 interpretations, 110 positive directional syntheses and 191 writing frames. Final verification: 724 tests, 722 passed, two existing skips; typecheck, scoped ESLint, build and ten desktop/mobile fixture checks passed. [Implementation evidence](../../reviews/release-completion/2026-10-13-concrete-writing/README.md) records exact hashes and publication separately. Matched model qualification, complete synthesis-matrix decisions, seven-day review, actual human approval and live candidate activation remain open under [Tasks 12–14](2026-10-12-release-completion-checklist.md).

The original plan was documentation prepared on 2026-10-11 at `d7a77f6`→`cc6a3cd`. Its old model/deadline/version/count assumptions are superseded below. Checkmarks record implemented behavior and passing final verification; they do not assert that a separate initial-red log was retained for every historical sequencing step.

## Global constraints

- Scope is recommendation 4 as corrected by the user: one or two scenes per reading, complete edited voice examples, editorial checks separate from `safetyPass`, possible situations rather than invented events, and one focused question.
- Reuse recommendation 1's landed interpretation/synthesis/content/evidence contracts. The version/fixture integration below assumes the app contracts of recommendations 2/3; their real source qualification remains separate. Missing natal/story data is a normal supported writing case.
- Keep the existing primary, strongest-three selection, threshold `> 0.02`, suppression, source rules, model `google/gemini-3.8-flash`, one gateway call and `60_000` ms deadline. Do not choose a transit because it has a better scene.
- “Natal houses, angles and aspects come from the Swiss Ephemeris service response (Placidus); in-app math is only the degraded fallback and fills angle contacts the service omits.” This work adds no chart math or source substitution.
- “Section observers animate already-visible content once, never hide it; chapter panels retain visited content while collapsing.” Preserve existing Buttons, global/reduced motion and paragraph/evidence focus behavior.
- Preserve the natal essay's independently validated reflection-question field and safe fallback. The new compiler applies to daily reflections only.
- The daily model returns only astronomical paragraphs. Wellness, the final reflection and recent reading text remain local; wellness edits leave provider payloads identical. Use existing consent checks and stress/sleep precedence without expanding `registry.ts` permissions.
- Editorial warnings are not safety failures. Never add broad vocabulary bans to shared `safetyPass`; preserve its medical/financial/prediction behavior.
- Candidate identities are schema 5 / `builtin-0.8.0`, writing/quality/reflection/example version 1, daily prompt 14 / validator 11, and `synthetic-daily-7` with 50 cases. Active schema 4 retains prompt 13 / validator 10. Numeric content activation awaits qualification; active production content stays 0.7.1.
- Preserve immutable reading IDs/feedback, active-content authority, legacy reads and unrelated dirty work. Stage owned paths explicitly; no rewriting pushed Lovable history. The user later approved the release-completion implementation, ordinary Git integration and publication. Paid campaign spending still requires the separately requested dollar ceiling; human approval and candidate activation gates remain binding.

## Review focus

1. An unrelated voice example, generic planetary association or fourth-ranked transit must not supply the reading's scene — Tasks 1, 2, 3 and 5; `missing_frame_does_not_borrow_a_scene` and `example_ids_are_not_live_sources`.
2. A declared scene ID or cue match cannot turn a possible situation into a verified personal event — Tasks 4, 5 and 9; `conditional_scene_is_not_biography`, `scene_citation_requires_theme_parents` and blinded scene-support review.
3. Literal space/alignment/energy wording and legitimate stable chronology must not trigger broad bans or needless fallback — Tasks 4 and 8; `literal_vocabulary_passes` and `required_chronology_is_not_recent_repetition`.
4. Compound/domain/wellness questions must resolve to one central question without changing provider inputs — Tasks 6 and 7; `reflection_has_one_question_and_one_theme` and the existing byte-for-byte privacy assertion.
5. History, wellness variants, archived questions and source evidence must stay owner-scoped, exact and readable across policy changes — Tasks 7 and 8; `cached_writing_uses_exact_saved_plan`, `saved_reflection_and_variants_are_private` and `history_is_same_owner_snapshot_and_timezone`.

## File responsibilities

| File                                                          | Responsibility                                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/lib/content/default-bundle.ts`, `schema.ts`              | Schema-5 frames, reviewed source/copy coverage and lifecycle validation                |
| New `src/lib/content/daily-writing.ts`                        | Pure central-theme/frame selection, plan and provider-brief types                      |
| New `src/lib/content/daily-reflection.ts`                     | Independent single-question validation and local selection                             |
| `src/lib/ai/daily-voice.ts`                                   | Six complete edited tone/depth examples and prompt guidance                            |
| New `src/lib/ai/daily-writing-quality.ts`                     | Daily editorial checks and bounded reports                                             |
| `src/lib/ai/language.server.ts`, `diagnostics.ts`, `facts.ts` | Scene schema/parent validation, brief serialization and separate quality outcomes      |
| `src/lib/reading.server.ts`                                   | Same scenes/theme in template and reflection; remove question concatenation            |
| `src/lib/pattern.server.ts`, `ai/quality.ts`                  | Local bounded history, encrypted evidence/question, cache, owner/export/admin behavior |
| `TodayEvidence.tsx`, `today-view.ts`, `src/routes/index.tsx`  | Saved illustration sources and existing one-question display                           |
| Evaluation modules/CLI/UI and tests                           | Fixed version-7 cases, candidate capture, false-positive corpus and writing review     |

## Task 1: Publish source-owned scene and reflection frames

**Files:** Modify `src/lib/content/default-bundle.ts`, `src/lib/content/schema.ts`, `src/lib/pattern.server.ts`, `src/routes/api/public/content-releases.ts`, `src/routes/api/public/content-releases.rollback.ts`, and `src/routes/_authenticated/content.tsx`. Create `src/lib/content/daily-reflection.ts` with question validation only and `tests/reading-writing-content.test.mjs`; extend `tests/reading-content-releases.test.mjs`. Task 6 adds reflection selection.

**Interfaces:** Add the spec's `DailyScene`, `DailyWritingFrame`, `ContentBundle.dailyWritingFrames`, and cumulative schema 5. Reuse `validateContentGraph`/`normalizeContentBundle` and existing immutable-release equality.

- [x] Verify the actual prerequisite interfaces/versions and record the dirty-file manifest. Isolate implementation work where necessary; preserve unrelated changes.
- [x] Write `legacy_release_has_no_scene_frames`, `active_empty_frames_are_authoritative`, `frame_requires_real_editorial_source`, and `draft_edits_invalidate_affected_frames`. Assert no default leakage, no frame for an independent rule, and unchanged active pointer after invalid ingestion/rollback.
- [x] Run `node --test tests/reading-writing-content.test.mjs tests/reading-content-releases.test.mjs`; inspect expected missing-contract failures.
- [x] Implement the spec's exact 2,000-frame limit, unique source/key rules, reviewed in-range `templateSentenceIndex`, one/two scenes, 180-character situation/focus limits, cue bounds and 220-character question bounds. Validate safety/placement restrictions separately from editorial-quality observations.
- [x] Author reviewed frames for the current 81 interpretations and 110 positive directional synthesis rules. Record actual coverage if prerequisites alter the inventory; include unfinished-reply, full-calendar and default-task scenes where the source meaning supports them.
- [x] Review each frame with its source mechanism. Correct definite personal-state/biographical source claims under the new immutable content release; do not claim a conditional scene neutralizes unsupported source copy.
- [x] Review standard/high-stress/low-sleep questions for one conceptual focus and no assumed example event. Approve each indexed source sentence for independent compact-template use; retain its conditions and qualifications.
- [x] Add `builtin-0.8.0`/schema 5 copy and validate every load/draft/ingest/publish/activate/rollback boundary. Preserve unrelated synthesis/natal/chapter content and raw checksum identity.
- [x] Preserve untouched frames during cycle drafting; remove frames for edited/deleted interpretations and affected syntheses from that candidate, recording review keys. Reject new frames lacking explicit reviewed source support.
- [x] Rerun focused content/lifecycle tests and record catalogue coverage/review decisions before an implementation commit of owned files.

## Task 2: Select one central writing plan and a minimal provider brief

**Files:** Create `src/lib/content/daily-writing.ts` and `tests/reading-writing-plan.test.mjs`; modify `src/lib/reading.server.ts` and `src/lib/ai/facts.ts`.

**Interfaces:** Export `DAILY_WRITING_PLAN_VERSION`, `DailyWritingPlan`, `DailyWritingBrief`, `resolveDailyWritingPlan(bundle, interpretationPlan)`, `toDailyWritingBrief(plan)`, and `assertDailyWritingBrief(brief, plan, facts)`. The brief contains only the theme fact ID, required parent IDs and selected scene guidance.

- [x] Write `synthesis_owns_central_scene_when_selected`, `independent_pair_keeps_primary_theme`, `missing_frame_does_not_borrow_a_scene`, and `writing_plan_ignores_private_context`.
- [x] Run `node --test tests/reading-writing-plan.test.mjs`; confirm the missing planner/brief contract fails as expected.
- [x] Implement exact `S1`-then-`I1` source selection, relationship metadata, authored scene ordering, `SC1/SC2` assignment and the spec's ready/no-frame/no-primary states. Resolve `templateSources` from reviewed indexes or full mechanisms; do not search supporting cycles or infer scenes from body/sign/domain labels.
- [x] Add `writingPlan` to assembly while preserving existing and planned optional natal/story call arguments. Apply neither natal nor story meaning as a competing central theme.
- [x] Serialize the exact brief allowlist; keep all reflection variants, selected reflection, wellness, history and full plan out of the provider request.
- [x] Verify scene parent IDs/source key/release against the actual supplied fact graph before provider traffic. Keep existing fact kinds and `S1/N1/A1/P2` dependencies intact; scene guidance inherits its published parent's support.
- [x] Test literal fallback interpretation keys, missing primary copy, quiet readings, reversed positive rules, no active frame, N1/story presence and suppressed supporting sources.
- [x] Rerun planner/content tests; inspect captured brief JSON for the intended privacy boundary.

## Task 3: Replace fragments with six complete edited voice examples

**Files:** Modify `src/lib/ai/daily-voice.ts`; create `tests/reading-daily-voice.test.mjs`. Keep shared synthetic demonstration constants in the production voice module; tests import them through the existing Vite harness.

**Interfaces:** Export `DAILY_VOICE_EXAMPLES_VERSION`, `DailyVoiceExample`, and `DAILY_VOICE_EXAMPLES` keyed by `plain | warm | clinical` and `standard | technical`. Preserve `dailyVoice(tone, depth)` and `DAILY_SYSTEM_VOICE` callers.

- [x] Write `every_tone_depth_has_complete_example`, `example_sources_are_identical_across_tones`, `only_selected_example_is_in_prompt`, and `example_ids_are_not_live_sources`.
- [x] Run `node --test tests/reading-daily-voice.test.mjs`; verify fragment-only examples fail the completeness assertions.
- [x] Add the spec's shared synthetic source card and full edited standard examples, with `EX-` fact/scene IDs. Add the corresponding four-sentence technical third paragraphs to produce six complete outputs.
- [x] Check standard examples against the 90–170-word aim and technical examples against 140–240 words; enforce the actual per-paragraph sentence/word/character limits. Correct copy before freezing the example version.
- [x] Add daily instructions for one thread, one/two conditional scenes, no invented personal event or third setting, and no reflection field. Preserve technical date/orb separation and existing reference/placement rules.
- [x] Have the copy review cover all six full examples, source support, direct human clinical prose and absence of therapeutic/ceremonial stock language. Mark synthetic numbers as demonstration inputs only.
- [x] Test an unrelated Mercury/reply reading and a no-frame reading: demonstration planets, numbers, dates, scene subjects and IDs must not become their source material.
- [x] Rerun voice/plan/language prompt tests; record the exact example hash for writing comparisons.

## Task 4: Implement the separate daily writing-quality report

**Files:** Create `src/lib/ai/daily-writing-quality.ts`, `tests/reading-writing-quality.test.mjs`, and `tests/fixtures/daily-writing-quality.mjs`. Reuse existing text/sentence facilities without changing `safetyPass`.

**Interfaces:** Export the spec's paragraph/history/report/issue/render-mode types, `DAILY_WRITING_QUALITY_VERSION`, and `checkDailyWritingQuality(input): DailyWritingQualityReport`. Its input is astronomical paragraphs, the selected writing plan, server-selected render mode, bounded local recent bodies, required literal sentences, supplied published source text and the selected demonstration example.

- [x] Write `writing_observation_is_not_safety_failure`, `duplicate_sentence_rejects_whole_draft`, `literal_vocabulary_passes`, `conditional_scene_is_not_biography`, and `required_chronology_is_not_recent_repetition` with paired accepted/rejected text fixtures.
- [x] Run `node --test tests/reading-writing-quality.test.mjs`; inspect failures before adding the checker.
- [x] Implement scene ID/count/parent checks and the narrow unqualified personal-event patterns. Require scenes for every ready model candidate; reserve the explicit minimal-mode exemption for the server's degraded template. Keep observable object/action cues as warnings, explicitly distinct from semantic proof.
- [x] Implement NFKC/case/apostrophe/punctuation/space normalization, exact duplicate sentences of at least eight words, and six-word phrase repetition at least three non-overlapping times across two sentences.
- [x] Implement the seven exact stock-phrase warnings in the spec. Confirm “space,” “alignment,” “energy,” “process” and “transformation” alone have no banned-word behavior; quotes/legitimate literal language cannot cause rejection solely for an abstraction observation.
- [x] Implement complete demonstration-sentence copying detection with its independent-published-source exception. Ignore shared short language; unknown `EX-` references remain invalid in the normal reference check.
- [x] Implement warning-only recent opening/sentence comparisons with eight/twelve-word thresholds and literal-chronology exclusions. Bound recent inputs and the report to twenty code-only issues.
- [x] Test punctuation/case variants, negation preservation, a meaningful source repeated once, repeated required chronology within the same reading, phrase overlaps, empty/legacy history, unsupported cue synonyms, and asserted-event clauses with unrelated conditional text elsewhere.
- [x] Rerun checker plus existing safety/language tests. Confirm no shared safety rule, natal essay or content-drafting safety behavior changed.

## Task 5: Integrate scenes and editorial outcomes into model and template paths

**Files:** Modify `src/lib/ai/language.server.ts`, `diagnostics.ts`, `src/lib/reading.server.ts`, `tests/reading-language.test.mjs`, `tests/reading-diagnostics.test.mjs`, and `tests/reading-request-policy.test.mjs`. Create `tests/reading-writing-integration.test.mjs`.

**Interfaces:** Add required daily paragraph `scenes: string[]`; retain ordinary fact citations separately. Add `writingBrief`/local writing-check context to `ReadingProseInput` and code-only candidate/final quality plus final scene use to prose metadata. Add the closed `writing_quality` generation diagnostic; advance schema-5 daily prompt/validator to 14/11.

- [x] Write `framed_model_uses_one_or_two_scenes`, `scene_citation_requires_theme_parents`, `warning_only_candidate_stays_accepted`, `editorial_rejection_uses_template_once`, and `all_evidence_fits_one_thread`.
- [x] Run `node --test tests/reading-writing-integration.test.mjs tests/reading-language.test.mjs tests/reading-diagnostics.test.mjs tests/reading-request-policy.test.mjs` before wiring the new path.
- [x] Extend only the daily strict schema and parser for scene arrays. Preserve two-to-four paragraphs, one-to-four sentences each, current limits, first-paragraph `C1/I1` and all existing synthesis/natal/story coverage.
- [x] Add the validated scene brief to the request alongside facts and the selected complete voice example. Keep local reflection/history/checker context outside the serialized messages.
- [x] Run safety/reference/chronology validation before daily editorial checks. Accept warning-only prose; reject high-confidence editorial failures with `writing_quality`, recording the detailed report separately from safety flags. Make no repair or retry call.
- [x] Render framed templates from the same source/scene plan using the first reviewed scene. Remove formulaic tone prefixes, automatic supporting-contact prose lists and optional domain/phase/timing filler. Preserve evidence/timing data and required natal/story source text.
- [x] Implement the spec's sentence-aware packer using `templateSources` and complete natal/chapter/chronology sentences. Preserve qualifiers and prior coverage; validate actual combined-evidence release fixtures against coverage/length aims instead of truncating source text.
- [x] Implement the finite prevalidated minimal-template fallback for a framed template's blocking editorial defect. Keep the original plan, set explicit server-only `minimal` mode/reason and empty scene use, preserve required sources and the local question, and fail cleanly if required content cannot render validly. A minimal fallback cannot satisfy the scene-quality release gate.
- [x] Test no-frame/quiet/missing-copy behavior, wrong/reused SC IDs, missing parents, a copied demonstration, unrelated invented scene, accepted literal language and full `S1/N1/A1/P2` integration. Assert one gateway request maximum and the existing 60-second budget.
- [x] Rerun focused integration/language/diagnostic/request-policy tests; keep template, structural rejection, editorial rejection and warning outcomes distinguishable.

## Task 6: Compile exactly one theme-aligned reflection locally

**Files:** Extend Task 1's `src/lib/content/daily-reflection.ts` with reflection selection; create `tests/reading-daily-reflection.test.mjs`; modify `src/lib/reading.server.ts`, content question validation and `tests/reading-writing-privacy.test.mjs`.

**Interfaces:** Export the spec's `DailyReflectionPlan`, `DAILY_REFLECTION_VERSION`, `dailyQuestionProblem(text)` and `resolveDailyReflection(plan, legacyPrimaryQuestion, context)`. Add the plan to `AssembledReading`; preserve `reading.prompt`/`ReadingProse.prompt` as the final public question field.

- [x] Write `reflection_has_one_question_and_one_theme`, `synthesis_question_does_not_append_domain_question`, `wellness_selects_same_theme_variant_locally`, and `invalid_question_uses_safe_single_fallback`.
- [x] Run `node --test tests/reading-daily-reflection.test.mjs tests/reading-writing-privacy.test.mjs`; expect current concatenation-specific assertions to fail when the new behavior is introduced.
- [x] Implement one-line/sentence/final-question-mark/220-character checks and bounded joined-interrogative checks. Allow coordinated nouns; reject titles, instructions, compound questions and unsafe/placement text without punctuation surgery.
- [x] Select the frame's standard question, the allowed same-theme wellness variant, a valid legacy primary question or the spec's exact relationship/quiet fallback. Do not append `dom.prompt` or another question/instruction.
- [x] Retain existing consent and priority: permitted stress `>=4` before permitted sleep `<=2`, with missing/invalid variants falling back to the same standard question. Add no automatic external tone/depth adaptation or registry permission.
- [x] Update old privacy-test assertions about appended questions to assert exactly one question, correct central theme and local provenance. Keep the byte-for-byte provider payload equality assertion intact.
- [x] Test simultaneous stress/sleep, consent revocation, missing data, standard/no-frame/quiet/synthesis cases, valid “obligation and opportunity” wording, and an invalid compound question with only one question mark.
- [x] Confirm the chosen reflection is identical across accepted-model, rejected-model and unavailable-model paths for the same local inputs. Natal essay reflection tests and its cache contract remain unchanged.
- [x] Rerun reflection/content/privacy tests and record manual single-focus review for every published question variant.

## Task 7: Save exact writing/question evidence and expose it to the owner

**Files:** Modify `src/lib/pattern.server.ts`, `src/lib/ai/quality.ts`, `src/components/pattern/TodayEvidence.tsx`, `today-view.ts`, `src/routes/index.tsx`, and existing cache/quality/evidence tests. Create `tests/reading-writing-storage.test.mjs`.

**Interfaces:** Implement `readSavedDailyWriting(row, dek)` for the spec's AES-GCM version-1 `language_meta.daily_writing_ct` envelope; extend async owner `readingLanguage` from prior plans. Preserve public question/citation fields and add optional saved scene evidence.

- [x] Write `saved_reflection_and_variants_are_private`, `cached_writing_uses_exact_saved_plan`, `voice_or_quality_version_changes_identity`, `legacy_reflection_remains_readable`, and `corrupt_present_writing_evidence_fails_read`.
- [x] Run `node --test tests/reading-writing-storage.test.mjs tests/reading-cache.test.mjs tests/reading-quality.test.mjs tests/today-evidence.test.mjs` before adding the envelope.
- [x] Encrypt the reading/snapshot/release/primary bindings, selected plan, final render mode/reason, scene use, reflection plan/question, timezone, astronomical paragraph count and quality reports. Until Task 8 wires history, record unavailable/zero-inspected history metadata. Persist no historical body or matched phrase.
- [x] Store `prompt: null` for newly instrumented rows; populate owner `reading.prompt` and exports from the encrypted envelope. Preserve old clear-column reads only when the new envelope is absent. Update every relevant row select/serializer.
- [x] Validate saved source/release/primary bindings, scene IDs/parents/paragraph positions, reflected theme and final question independently. A missing/corrupt required envelope fails read without reconstructing from current content.
- [x] Add writing/quality/reflection/example versions to existing HMAC identity. Exclude ciphertext/history/warning timestamps; preserve prior IDs/feedback and use no history/model call on a valid cache hit.
- [x] Expose saved “Published illustration” sources and paragraph links in the existing owner evidence panel, distinguishing a declared example from a known event. Keep one question in the existing reflection area; use existing focus, Buttons and reduced-motion behavior.
- [x] Restrict admin quality output to policy versions, closed outcomes/codes and counts. Include encrypted evidence/question in owner export and existing account erasure; keep raw variants/history/source text out of telemetry.
- [x] Test cold cache, source/example/policy upgrade, legacy rows, wrong release/primary, unknown scene ID, invalid paragraph count, account switching, export/erasure and failed source persistence. Inspect test database JSON for private-field duplication.
- [x] Rerun storage/cache/quality/evidence/privacy tests; browser-review the one-question display and evidence focus on mobile/keyboard/reduced-motion paths. Task 8 then adds history integration checks against this saved contract.

## Task 8: Add bounded local repetition history

**Files:** Modify `src/lib/pattern.server.ts`; create `tests/reading-writing-history.test.mjs` and extend `tests/helpers/records-harness.mjs`/`tests/reading-writing-privacy.test.mjs`.

**Interfaces:** Export or expose to the test harness `loadRecentDailyWritingBodies(db, userId, snapshotId, day, timezone, dek): Promise<RecentDailyWritingHistory>`. Consume the strict saved writing envelope from Task 7; pass its `bodies` to the checker and save only its bounded availability metadata.

- [x] Write `history_is_same_owner_snapshot_and_timezone`, `history_contains_only_verified_astro_paragraphs`, `same_day_variants_do_not_count_as_repetition`, and `history_never_changes_provider_request`.
- [x] Implement at most four candidates per previous civil day, twelve total, using owner/snapshot predicates and deterministic creation-time/ID ordering. Decrypt/filter saved timezone locally and retain the newest valid matching row per day, up to three bodies; record bounded omission counts and stop at the cap.
- [x] Require verified encrypted paragraph boundaries and validated `astroParagraphCount`; skip legacy/invalid optional history rows with bounded availability codes. Do not heuristically strip local context or read journals.
- [x] Run the loader only after an immutable-cache miss, retaining text in memory for the checker. Do not store prior bodies in diagnostics/envelopes, change the prompt, reject solely for history reuse or trigger a retry.
- [x] Test DST/civil-day boundaries, many same-day revisions, fewer than three valid days, corrupted optional rows, current-row corruption, changed snapshot/timezone and cross-account isolation.
- [x] Run `node --test tests/reading-writing-history.test.mjs tests/reading-writing-privacy.test.mjs`; assert request payload equality with different history and no history query on cached reads.

## Task 9: Qualify concrete language and focused questions

**Files:** Modify `src/lib/ai/reading-evaluation.fixtures.mjs`, `.d.mts`, `reading-evaluation.server.ts`, `reading-evaluation.shared.ts`, `scripts/reading-eval-cases.mjs`, `scripts/evaluate-readings.mjs`, `src/components/pattern/ReadingEvaluation.tsx`, existing evaluation suites, `READING-EVALUATION.md` and `READING-INTEGRITY.md`. Save review artifacts under `docs/reviews/daily-concrete-writing/` during implementation.

- [x] Write `writing_fixtures_use_production_planner_and_checker`, `synthetic_history_is_local_only`, `scene_capture_is_bounded`, and `mixed_writing_policy_reports_cannot_compare`.
- [x] Preserve the 38 prerequisite cases byte-for-byte and add the spec's twelve exact writing case IDs once: `synthetic-daily-7`, 50 cases, maximum 49 model attempts when primary copy exists. Derive display/count limits from the catalogue; retain only the existing quiet-case skip.
- [x] Extend bounded synthetic candidate capture to retain scene IDs and code-only quality results; tolerate old reports without these fields. Record plan/checker/reflection/example identities and exact fixture/catalogue/example hashes.
- [x] Add the handwritten rejection/false-positive corpus, including legitimate literal vocabulary, conditional versus asserted scenes, copied examples, compound questions, repeated phrases, history warnings and required chronology. Keep these deterministic checks separate from human semantic scoring.
- [x] Run `node --test tests/reading-eval-fixtures.test.mjs tests/reading-eval.test.mjs tests/reading-live-eval.test.mjs tests/reading-live-eval-auth.test.mjs`; all requests remain intercepted in this test lane.
- [ ] Prepare isolated baseline/candidate checkouts on the same version-7 inputs/content/history/model and earlier policies, changing only the concrete-writing feature. Use fresh offline reports/responses and the existing `--output`, `--write-responses`, `--responses` and `--compare` workflow; keep source identities exact.
- [ ] On an explicitly invoked actual-model evaluation, collect paired synthetic generated-text runs with recorded latency/cost/failures and no automatic retries. Preserve partial runs; offline replay alone leaves writing qualification open.
- [ ] Blind-review central coherence, scene support/concreteness, voice, useful variation and single-question focus. Require ≥4 coherence/scene support/question focus for each framed candidate/template, all five failure flags false and zero minimal fallbacks in ready-frame qualification fixtures.
- [ ] Require no mean decline in grounding/voice and improved concreteness/question-focus means for the formerly abstract or compound-question cases. Review all six tone/depth outputs and combined natal/synthesis/story cases; report editorial warnings, hard rejection, fallback and safety outcomes separately.
- [x] Run `npm test`, `npx tsc --noEmit`, scoped ESLint on owned supported files, `npm run build`, and `git diff --check` after focused suites pass. Record exact totals and any browser/model/service limitations; no broad reruns without a new reason.
- [x] Self-review the complete owned diff against the five review focuses, update README/integrity/evaluation documentation and prepare the reviewed immutable inactive content candidate. Preserve unrelated work and Lovable history.
- [ ] On a separately requested release, activate/deploy through existing workflows and verify framed/no-frame, wellness-local, template, cache/archive/export and rollback behavior. Record source commit, deployment, content activation and live-reading evidence separately.

## Final acceptance checklist

- [ ] A ready reading develops `S1` or `I1` through one or two supported possible scenes; examples and supporting contacts cannot invent another subject.
- [ ] All six complete voice examples are reviewed, source-bounded and valid for their tone/depth/paragraph contracts.
- [ ] Daily editorial checks report stock/repetition problems separately from safety, with meaningful false-positive tests and no broad word bans.
- [ ] Warning-only prose remains usable; a blocking editorial defect reaches a valid finite fallback without another model call.
- [ ] Exactly one focused question follows the same central theme, including local wellness variants and failure paths.
- [ ] Wellness, reflection and recent-history changes leave model payloads identical under unchanged direct preferences/facts.
- [ ] Private writing/reflection evidence survives owner cache/archive/export reads exactly; legacy absence is readable and corruption is not silently repaired.
- [ ] Template, local, browser and actual-generated-text qualification pass and are reported separately; publication/deployment remains an explicitly requested stage.

## Historical checklist preparation evidence

The original 2026-10-11 preparation request created documentation only. Source inspection and document formatting/link/consistency checks prepare this design and checklist. Application edits, runtime tests, typecheck, lint, build, browser checks, paid model runs, commits, content activation, deployment and production verification are not performed while preparing them. At preparation, every implementation/qualification checkbox was open; current checkmarks above use later implementation evidence.

Preparation checks passed: Prettier on both documents, relative links, balanced code fences, trailing whitespace, ordered Tasks 1–9 and 90 unchecked items. A standalone document-copy check found all six examples within the stated word/paragraph/sentence bounds: standard examples contain 118/115/113 words and technical examples 166/169/160 words for plain/warm/clinical respectively. Each paragraph has four complete sentences, and no sentence combines an orb reference with exact timing. `git diff --check` also passed. These are document checks, not application or generated-text qualification.
