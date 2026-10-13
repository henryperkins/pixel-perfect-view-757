# Content draft effectiveness and utilization implementation checklist

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` when implementing this checklist. Check a box only after its stated evidence exists. Implementation is approved. The only authorized live comparison is an eight-call pilot with a $5 total generation cap; publication and activation retain their exact-content approval gates.

**Goal:** Make the saved interpretation draft directly testable, improve its copy, demonstrate that the changed entries reach reading output, and activate only the exact qualified release.

**Architecture:** Extend the existing admin evaluation controller with a frozen baseline/candidate comparison mode. Store both content snapshots and their source identities in the existing evaluation plan, reuse signed Workflow steps and bounded reservations, and add a separate fixed case set covering the draft's fallback entries. Preserve existing serving, release and historical-report behavior.

**Tech stack:** TypeScript, React, TanStack Start/Query, D1/SQLite, Cloudflare Workflows, Node's test runner, explicitly selected language provider.

**Spec:** This conversation's draft audit and six next steps; [AGENTS.md](../../../AGENTS.md); [Reading evaluation](../../../READING-EVALUATION.md); [existing review protocol](../../reviews/daily-reading-writing/review-protocol.md). This is a scoped follow-up to Tasks 9–14 of the [release-completion checklist](2026-10-12-release-completion-checklist.md), not evidence that its broader writing, natal, synthesis or transit gates have passed.

## Evidence and status

The original audit used local source `b7aca0e` on 2026-10-13. Implementation and the completed eight-attempt live pilot used published source `82efe38df4c5ee571d6c583de144498c93f596f1`. Current execution evidence is in the [manifest](../../reviews/content-draft-effectiveness/2026-10-13/manifest.json) and [pilot result](../../reviews/content-draft-effectiveness/2026-10-13/pilot/result.json); the initial findings below are retained as the problem statement, not current implementation claims.

The user's replacement AGENTS instructions on 2026-10-13 resolve the earlier provider-policy conflict: member readings and natal chapters use an explicit `PATTERN_MEMBER_LANGUAGE_PROVIDER` selection when present, otherwise Gemini Enterprise when configured, otherwise Lovable. A failed request never retries through another provider; admin selection remains independent. Preserve that behavior. Earlier Lovable credit failures remain historical observations, not proof that the selected member provider is unavailable.

The user rejected the proposed full-suite live run and approved **four paired cases, at most eight generation attempts, with a $5 total generation cap**. `draft-fallback-1` remains a 70-case offline regression suite. Only the fixed four-case `draft-pilot-1` can be used for the authorized paid pilot. No additional model smoke test, retry, replacement output, paid reviewer call or wider qualification is included in that approval.

| Finding                                                 | Evidence                                                                                                           | Required solution                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Candidate is not serving                                | Export marks 0.7.1 live and requires candidate approval; `activeBundle` reads active releases                      | Keep evaluation independent of activation; verify the pointer before eventual release   |
| Narrow content delta                                    | 20 added and 2 rewritten cycle entries; 109 comparison rows unchanged                                              | Review changed entries; preserve inherited catalogues and explicit precedence           |
| Evaluation uses different copy                          | Export's 27/37 result names active 0.7.1 and Gemini Enterprise                                                     | Select and freeze the exact saved draft and its own baseline                            |
| Existing suite misses every edit                        | Offline extraction/lookup probe: 0/50 cases select changed keys at any of the first three positions                | Dedicated fallback fixtures and changed-entry coverage report                           |
| Generic draft copy is repetitive and overly categorical | All 22 mechanisms repeat a three-part structure; examples include “direct kinetic friction” and “mandatory reform” | Revise prose/questions and correct the reusable drafting prompt                         |
| Availability obscures quality                           | Export records 7/8 measured member attempts unavailable due credit                                                 | Separate provider availability, validator acceptance and editorial outcomes             |
| Existing run freezes plans, not content snapshots       | `evaluationStep` re-reads the source bundle and compares its regenerated plan                                      | Persist full comparison snapshots and execute those snapshots                           |
| Generic evaluation lacks the proposed bounded campaign  | Existing budget handling is restricted to writing qualification and Enterprise pilot branches                      | Explicit bounded content-comparison campaign, not an unbudgeted ordinary run            |
| Earlier isolation test failed on tables without `id`    | Prior audit: 57/58 passed; current source now uses `ORDER BY 1`                                                    | Verify the landed fix and strengthen coverage only if ordering remains nondeterministic |

Original comparison identities: baseline `44c05c8b0336dc778c2efdcbf0c28dc2091d33a96b91c352a2481123b7f7ccae`; candidate `3638d096972ab2f47616edff0da91c15ea6bccd29424e26ed2bf10b2ae77a42e`. These identify the attached draft, not a future revision. The earlier temporary lookup artifacts are `/tmp/content-draft-reachability.mjs` and `/tmp/content-draft-reachability.json`; archive or reproduce them before relying on their continued availability. That probe extracted cycle fields, used default ancillary content, and measured selection only, not complete candidate rendering or production frequency.

Current outcome: **pilot complete; editorial qualification failed; candidate inactive**. Read the [effectiveness result and remaining solutions](../../reviews/content-draft-effectiveness/2026-10-13/effectiveness-summary.md). No further paid calls are authorized.

## Global constraints

- Preserve unrelated `.env`, transcripts, untracked directories and other work. Use a separate implementation worktree if necessary; stage an explicit owned-file manifest. Never rewrite pushed history.
- Preserve the serving-provider boundary in the replacement AGENTS instructions: explicit selector, otherwise configured Enterprise, otherwise Lovable. Both comparison arms must explicitly use the same confirmed member provider/model. Keep administrative experiments with another provider separate, and never fail over to another provider after a request fails.
- One server Workflow per run; signed steps; no model retries, including uncertain captures. Evaluation persistence remains confined to `evaluation_runs` and `evaluation_results`; editorial-source reads are allowed during freezing.
- Swiss Ephemeris/Placidus remains the chart source. Do not change eligibility, strongest-three selection, suppression, ranking or aspect-family policy to make coverage pass.
- Source authoring, validation, AI review, human approval, deployment and content activation are distinct states. Never upgrade historical evidence to a current pass.
- Keep existing 50-case `synthetic-daily-7`, four-arm 196-call writing qualification and 24-call Enterprise pilot inventories intact. The new full 70-case suite is offline coverage; its fixed four-case pilot has a hard pair-wide limit of eight attempts and $5 generation. Never expand the pilot automatically.
- Preserve saved readings and their provenance. Changes to a draft invalidate its approval; old evaluation artifacts remain valid historical observations of their frozen copy.
- A content-only revision keeps schema 4 and its serving policy unless a separate migration is explicitly designed. Do not silently replace it with the unrelated schema-5 concrete-writing candidate.

## Review focus

1. A draft changes between preview and start: reject stale preparation before any reservation or provider request (Tasks 1–3).
2. A draft is edited/discarded, or the active pointer changes during a run: finish against the frozen snapshot, subject to current admin authority and runtime-identity checks (Task 3).
3. A changed entry is selectable but never reaches a submitted fact or rendered output: expose the missing stage rather than label it used (Tasks 2, 4 and 8).
4. Historical 38-case reports, new suite IDs and different hash algorithms coexist: preserve original identities and prevent invalid comparisons (Task 4).
5. Credit failure, uncertain capture or partial publication occurs: preserve evidence, stop further affected work and keep the previous live release recoverable (Tasks 3, 8 and 10).

## Task 0 — Freeze the implementation and editorial baseline

**Owner:** Engineer. **Depends on:** Nothing. **Files:** Read `AGENTS.md`, the source modules below and the attached export; create `docs/reviews/content-draft-effectiveness/<run-id>/manifest.json` and an owned-path manifest during implementation.

- [x] Record `git rev-parse HEAD`, `git status --short`, `git worktree list --porcelain`, dependency-lock identity and the intended implementation branch. Preserve unrelated work; do not include credentials or account plaintext in artifacts.
- [x] Record the replacement AGENTS instructions as the provider-policy authority. Inspect `memberLanguageProvider()`, the configured selector's non-secret identity, Privacy wording and current provider tests. Confirm the actual selected member provider, model and bounded transport/cost contract before paid work. Use that provider for both arms; do not mix providers or infer availability from configuration alone.
- [x] Obtain the exact draft ID, status, complete `bundle`, `base_bundle`, `base_version`, canonical hashes and review state through the existing admin path. Record the actual active release and rollback target separately. The clipped Markdown is audit evidence, not an authoritative JSON import.
- [x] Freeze a complete machine-readable delta. Assert the expected 20 additions/2 changes and list every inherited section. If the source differs from the attachment, describe the new delta and re-scope coverage before continuing.
- [x] Record the original 38-case evaluation as historical active-copy evidence; keep its provider, fixture, hash and cost limitations. Do not reuse its acceptance percentage for this candidate.

**Done when:** A reviewer can identify the precise baseline, candidate and source revision without opening production or guessing which draft was meant.

## Task 1 — Resolve exact draft and inactive-release sources

**Owner:** Engineer. **Depends on:** Task 0. **Create:** `src/lib/content/evaluation-source.server.ts`, `tests/reading-evaluation-source.test.mjs`. **Modify:** `src/lib/ai/reading-evaluation.shared.ts`, `src/lib/pattern.functions.ts`; reuse `src/lib/content/content-drafts.server.ts` and `draft-comparison.ts`.

**Interfaces to add:** `ContentComparisonSource = { kind: "draft"; draftId: string } | { kind: "release"; releaseId: string; baselineReleaseId: string }`; `resolveContentComparisonSource(db, userId, source)` returns validated baseline/candidate bundles, canonical identities and any transaction guards. The new start-request branch uses `mode: "content-comparison"`, this source selector, `arm: "baseline" | "candidate"`, `caseSetId: "draft-pilot-1"` for the approved live pilot, explicit `provider: LanguageProvider`, required `expectedPlanHash`, and existing campaign/budget fields. Its preview schema omits the required hash and execution budget so preparation is possible before either exists. The provider must match the Task 0 policy for member qualification; an alternative-provider experiment is a separate nonqualifying campaign. Preserve all existing request branches.

- [x] Write regressions for member denial, revoked admin role, missing/discarded draft, missing frozen baseline, corrupt baseline, stale hashes and identical baseline/candidate selection. Assert zero model calls and no content mutation.
- [x] Resolve draft sources with `loadReviewedDraft`; use its stored baseline, never today's active bundle. Evaluation must work before editorial approval. A missing baseline requires an explicit rebase outside evaluation, never an invented baseline.
- [x] Resolve releases by explicit immutable IDs. Validate labelled canonical checksums; preserve legacy checksum values and their `legacy-unlabelled` designation. Compute a separately labelled canonical identity for comparison.
- [x] Keep `contentChecksum` (`sha256-canonical-json-v1`) distinct from existing evaluation `bundleHash` (`SHA256(JSON.stringify(bundle))`). Retain both algorithms and values; do not reinterpret historical hashes.
- [x] Reject client-supplied bundles, prompts, arbitrary case lists and raw model settings. Recheck authority before returning source details. Follow existing shared-admin draft access while keeping run ownership scoped to its initiating administrator.
- [x] Run `node --test tests/reading-evaluation-source.test.mjs tests/content-draft-comparison.test.mjs` and require all tests to pass.

**Done when:** An administrator can prepare either exact source pair without publishing, approving or activating it; malformed or stale sources fail before provider traffic.

## Task 2 — Add a separate suite that exercises the changed copy

**Owner:** Engineer. **Depends on:** Task 0. **Create:** `src/lib/ai/reading-evaluation.draft.fixtures.mjs` and its `.d.mts` declaration, `src/lib/ai/evaluation-case-sets.ts`, `tests/reading-draft-coverage.test.mjs`. **Modify:** `reading-evaluation.server.ts`, `reading-evaluation.shared.ts`, `tests/reading-eval-fixtures.test.mjs` and the plan code in Task 3.

**Interfaces to add:** `getEvaluationCaseSet(caseSetId)` returns a closed, versioned manifest with ordered cases and a hash. Existing callers retain the existing case set by default. `prepareSyntheticEvaluationCase` and `runSyntheticEvaluationCase` gain a typed optional case-set argument; resolve IDs only within that manifest.

- [x] Add 20 committed primary fixtures: ten supported transit bodies × hard square/soft sextile. Use natal Mercury except Mercury-to-Moon; assert these contacts resolve to the intended new wildcard in the attached candidate and a global catch-all in its baseline. Freeze explicit geometry/configuration; do not dynamically pick easier cases when a candidate changes.
- [x] Define `draft-fallback-1` as the existing 50 cases plus those 20 cases: 70 cases for offline regression only. Define `draft-pilot-1` as exactly hard Mars, hard Uranus, soft Saturn and soft Neptune targeted fixtures: four calls per arm, eight across the pair. Freeze these IDs and derive the pilot limit from the prepared manifest; refuse any scope change instead of increasing the limit. Full-suite paid evaluation is not authorized.
- [x] Write offline secondary-position tests for every new key at I2 and I3. Verify source facts and actual assembled templates, including natal-lens composition. Do not require an optional secondary source to appear in generated prose merely because it was supplied.
- [x] Verify all exact-aspect and family/natal-specific entries retain precedence. Exercise each of the two global catch-alls only in isolated resolver fixtures with body-specific entries removed. Mark them `shadowed-in-supported-catalogue` in the complete-candidate report; do not invent unsupported planetary bodies to force a live hit.
- [x] Add unknown/approximate birth-time, below-threshold and quiet-day assertions. Preserve existing eligibility/suppression. New wildcard entries keep empty themes and do not acquire invented synthesis relationships.
- [x] Preserve existing writing/pilot case IDs, per-case configuration hashes, policy behavior and intended 196/24 counts. Recompute full plan hashes for the new source SHA; those hashes legitimately change with implementation commits. Run `node --test tests/reading-draft-coverage.test.mjs tests/reading-eval-fixtures.test.mjs tests/reading-qualification-plan.test.mjs tests/reading-qualification-profiles.test.mjs`.

**Done when:** Every reachable changed entry is primary in at least one declared comparison case; all shadowed entries have a documented reason and isolated fallback test; unrelated qualification scopes remain unchanged.

## Task 3 — Freeze full content and bound both comparison arms

**Owner:** Engineer. **Depends on:** Tasks 1–2. **Modify:** `src/lib/ai/qualification-plan.server.ts`, `src/lib/evaluation-runs.server.ts`, `src/lib/pattern.server.ts`, `src/lib/ai/admin-transport.ts`, `src/lib/ai/reading-evaluation.shared.ts`, `tests/reading-evaluation-runs.test.mjs`. **Create:** `tests/reading-content-comparison-plan.test.mjs`.

**Interfaces to add:** `createContentComparisonPlan(pair, caseSetId, sourceSha, provider)` returns `FrozenContentComparisonPlan` with a version tag, both complete bundle snapshots/identities, both dry arm plans, ordered case manifest, policies, source SHA, provider/model and combined attempt limit. Extend the stored-plan type as a versioned union; legacy decoding stays supported. Start requests require the reviewed hash; preview returns it without starting a run.

- [x] Write failing regressions for edits between preview/start, edits/discard/pointer moves during execution, role revocation, duplicate starts/steps, source-code drift, changed fixture/policy identity and lost capture acknowledgements.
- [x] At baseline start, resolve both bundles once, verify the prepared hash, and atomically guard authority/source identity while inserting the root run. Persist the frozen pair in `evaluation_runs.plan`; preserve the existing 1.9 MB bound and fail before Workflow dispatch if exceeded.
- [x] Start candidate only after that campaign's baseline completes with all required captures and no unresolved availability, identity or accounting halt. Reject conflicting source selectors or plan hashes on the child request. Load its snapshot from the root plan; never resolve the latest draft again. Bind both arms to the same initiating admin, source SHA, suite, provider/model, prompt/validator and request policies. Give each arm one immutable start slot; a failed baseline stays preserved and cannot be replaced inside that campaign.
- [x] During signed steps, load the frozen arm bundle and case manifest. Rebuild its dry plan with the executing runtime and reject drift before transport. Later editorial changes cannot alter an in-flight run; role revocation still stops it. Keep the current signed `runId`/`position`/`planHash` protocol and one Workflow per arm/run.
- [x] Explicitly route this mode through bounded request/response validation, pre-call reservations, dollar ceilings, review reserve and uncertain-capture handling. Pass `boundedQualification: true` through `evaluateFixedCase` even though this mode has neither an existing qualification profile nor Enterprise thinking controls. The current ordinary-run path is not sufficient. Retain spent reservations when capture is uncertain; halt on auth/credit/rate failures or missing/inconsistent model/usage identity; never retry a model call.
- [x] Enforce an eight-attempt pair-wide ceiling and immutable $5 total generation cap for the authorized pilot through existing campaign columns. Keep Enterprise pilot and four-arm schema-5 qualification behavior separate. Store all new snapshot/manifest fields inside the existing plan JSON; no migration is expected for this design. If implementation changes that decision, add a named additive migration, backup/rehearsal and deployment ordering before release.
- [x] Run `node --test tests/reading-content-comparison-plan.test.mjs tests/reading-evaluation-runs.test.mjs tests/reading-qualification-plan.test.mjs` with intercepted transport only.

**Done when:** Closing the browser, editing the draft or changing the active pointer cannot change the evaluated copy; all billable attempts remain bounded, uniquely reserved and attributable.

## Task 4 — Show actual utilization and support honest comparisons

**Owner:** Engineer. **Depends on:** Tasks 1–3. **Modify:** `src/components/pattern/ReadingEvaluation.tsx`, `src/routes/_authenticated/content.tsx`, `src/lib/pattern.functions.ts`, `reading-evaluation.shared.ts`, `reading-evaluation.server.ts`, `scripts/evaluate-readings.mjs`, `scripts/reading-writing-review.mjs`, `READING-EVALUATION.md`. **Created tooling:** `scripts/reading-content-comparison.mjs`, `tests/reading-content-report.test.mjs`, and [tooling instructions](../../reviews/content-draft-effectiveness/tooling.md).

**Implemented tooling interfaces:** `compareContentReports(before, after, { plan })` returns changed-key coverage with selected I1/I2/I3 positions, submitted fact IDs, literal template/final rendering, accepted-output citations and semantic incorporation (`unreviewed` until reviewed). `freezeContentReviewRubric(plan)` freezes the existing 1–5 body rubric plus the additional 4/5 voice/repetition gate and separate boolean reflection checks. `unpackContentEvidence(envelope)` converts the UI download into complete reports while preserving its raw captures and ledgers. `replayContentReport(report, { plan, arm })` uses current code and native provider responses in memory; `prepareReview({ ..., contentPlan })` permits only the declared source pair. Frozen exports carry the complete pair and its hash.

- [x] Add “Evaluate this draft” and an explicit inactive-release selector. Preparation shows baseline/candidate identities, changed-entry counts, case coverage and planned attempts. Starting evaluation never calls approval, publication or activation mutations. Changing selection clears prepared state.
- [x] Separate “selected”, “sent to model”, “cited in accepted output” and “shown in template”. Citation IDs are mechanical evidence, not proof of semantic use. Report global catch-alls as shadowed, and make missing primary coverage block comparison start.
- [x] Label draft authoring provider separately from evaluation provider and member-serving provider. Show historical-run fixture identity and frozen case count. A completed 38-case historical run remains complete for its own manifest, never “all current cases”.
- [x] Preserve separate availability, validator acceptance and editorial outcomes. Display unknown historical cost as unknown, not zero; keep unavailable, rejected, quiet and missing-interpretation cases distinct.
- [x] Extend combination to validate ordered case IDs/hashes from the new manifest while retaining historical fixture-version behavior. Reject duplicate/missing/foreign cases and mismatched pair or arm identities. Never loosen generic/natal comparison guards to allow arbitrary content differences.
- [x] Add manifest-bound comparison/replay and review-packet preparation. Permit only declared baseline/candidate content differences; require identical fixture/config, runtime, provider/model and policies. The current `transitCopyHash` includes cycle copy: allow its expected change only inside this declared pair while separately proving transit/natal/pair catalogues stayed unchanged. Preserve raw candidate, fallback and reflected question for review.
- [x] Implement and test the offline commands below, including mocked-capture replay guards, exact hash checks and no-overwrite behavior. Rubric freezing, evidence unpacking, paired comparison, response extraction and review preparation succeeded against the final frozen pair.
- [ ] Complete strict captured-response replay for the final live pair. Both attempts stopped before request equality or response replay because one legacy analytic fixture float differs between Node and workerd. The unchanged source reproduces the live identity under workerd. Retain this diagnosed failure; do not weaken hashes. The implemented replay blocks network and rejects dirty runtime or a different Git SHA; documentation, tests and evidence may differ. These are command capabilities, not a claim that final-pair replay passed:

```bash
node scripts/evaluate-readings.mjs --freeze-content-rubric frozen-pair.json --output review-rubric.json
node scripts/evaluate-readings.mjs --unpack-content-evidence content-pilot.json --output-dir NEW_DIRECTORY
node scripts/evaluate-readings.mjs --compare-content baseline-report.json candidate-report.json --content-plan frozen-pair.json --output comparison.json
node scripts/evaluate-readings.mjs --extract-content-responses candidate-report.json --content-plan frozen-pair.json --arm candidate --output candidate-responses.json
node scripts/evaluate-readings.mjs --replay-content candidate-report.json --content-plan frozen-pair.json --arm candidate --output candidate-replay.json
node scripts/reading-writing-review.mjs prepare --before baseline-report.json --after candidate-report.json --content-plan frozen-pair.json --output-dir NEW_REVIEW_DIRECTORY
```

The unpacked `review-rubric-reconstructed.json` is not proof of pre-generation freezing; retain the original preflight artifact. `prepare` also writes blank packet-bound reflection companions. Their validation command is `node scripts/reading-writing-review.mjs qualify-reflections --assignment assignment.json --review reflection-a.json --review reflection-b.json --output reflection-qualification.json`; use the existing `qualify` command for body review. Neither closes whole-draft or human-approval gates.

- [x] Run `node --test --test-concurrency=4 tests/reading-content-report.test.mjs tests/reading-eval.test.mjs tests/reading-natal-evaluation.test.mjs tests/reading-transit-evaluation.test.mjs tests/reading-writing-review.test.mjs` for pair binding, current-code replay, evidence unpacking, question companions, no-overwrite commands and historical review compatibility.

**Done when:** A reviewer can prove exactly which changed entries were evaluated and displayed, and cannot accidentally compare this draft with unrelated active-copy or Enterprise results.

## Task 5 — Rewrite the candidate and prevent the same drafting problem

**Owner:** Editor with engineer support. **Depends on:** Task 0; freezes for qualification depend on Tasks 1–4. **Modify:** the selected draft through `editContentDraft`; `src/lib/ai/language.server.ts` (`generateBundleEntries`); `tests/reading-content-releases.test.mjs`. **Create:** a versioned editorial delta and review notes in the evidence directory. Use `src/lib/ai/daily-voice.ts` as guidance, not as a source of reader facts.

- [x] Revise all 22 changed mechanism/question pairs in the proposed versioned editorial delta (the final refinement and authoritative save are recorded in the execution ledger). Each mechanism gets one distinct, conditional everyday comparison, familiar verbs and a clear interpretive distinction. Remove asserted planetary causation, mandatory outcomes, unsupported frequency, diagnoses and presumed biography. Review repeated openings across the whole set.
- [x] Keep one separate open question per slot in that delta. A reader must be able to answer “nothing” or “that does not fit” without accepting a claimed imbalance, boundary problem or productivity demand. Do not change question precedence or add additional reflection prompts as part of this content-only task.
- [x] Preserve the 24 inherited cycle entries, 62 lenses, five transit chapters, six synthesis rules and other unchanged sections byte-for-byte unless a separately documented correction is necessary. Keep new themes empty; approving prose alone does not approve new synthesis relationships.
- [x] Use a distinct editorial brief for every body pair in the delta and future drafting prompt. These are proposed reflective contrasts, not new claims about planetary causation:

| Body    | Hard-contact brief                                        | Soft-contact brief                             |
| ------- | --------------------------------------------------------- | ---------------------------------------------- |
| Saturn  | Commitment versus available capacity                      | A routine sustainable at an ordinary pace      |
| Jupiter | Added scope versus room to carry it                       | One additional option within an existing plan  |
| Mars    | Urgency versus task pace                                  | Effort with a clear next action                |
| Venus   | Habitual choice versus current preference                 | A small preference that is easy to name        |
| Mercury | Intended meaning versus wording                           | An idea becoming understandable                |
| Sun     | A role versus what receives attention                     | A description fitting a chosen activity        |
| Moon    | A moment versus a familiar rhythm                         | An ordinary arrangement that feels comfortable |
| Uranus  | A familiar arrangement versus room to vary it             | A small alternative without forced disruption  |
| Neptune | Impression versus available detail                        | Imagination with uncertainty left explicit     |
| Pluto   | An established arrangement versus what remains negotiable | Deliberate attention to a lasting priority     |

- [x] Update `generateBundleEntries` to ask for conditional reflective framing, one concrete comparison, varied sentence structure and a non-presumptive question. Version the bundle-drafting prompt and record that version in new draft notes. Keep the existing 22-slot scope, separate fields and validation. Do not regenerate already revised copy simply to exercise the new prompt; verify its contract with mocked responses.
- [x] Review these **illustrative replacements**, then author every remaining slot with the same standard; these examples are not approved production copy:

| Entry/problem                                          | Proposed solution                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hard:mars:*`: “direct kinetic friction”               | “Wanting to finish a task can run ahead of the space available to do it. A Mars contact offers a way to examine that mismatch: you might picture a reply started before the other person has finished explaining.” Question: “Where, if anywhere, is your preferred pace out of step with the task?” |
| `hard:uranus:*`: “disrupts routine and demands…”       | “A familiar routine can be useful while leaving little room to try another approach. A Uranus contact offers a frame for that tension, such as considering a different method for a recurring task.” Question: “Which familiar approach, if any, would you like to reconsider?”                      |
| `soft:*:*`: ease must produce something durable        | “Some tasks involve less friction than expected. A soft contact offers a way to notice that ease, whether in an exchange that is clear or a routine that leaves enough room.” Question: “What, if anything, has felt easier than expected?”                                                          |
| `hard:moon:*`: assumes a boundary must restore balance | Retain a conditional comparison between a passing moment and a familiar rhythm. Question: “What, if anything, feels different from your usual rhythm today?”                                                                                                                                         |

- [x] Save through optimistic concurrency with the expected candidate hash. Confirm approval clears, the baseline remains unchanged and a new full diff/hash is produced. Re-run offline complete-bundle templates; do not qualify using the earlier cycles-only audit probe.

**Done when:** Every changed entry has an editorial disposition and answerable question, no inherited content changed unintentionally, and future drafting requests address the identified cause of generic copy.

## Task 6 — Verify isolation and complete local acceptance

**Owner:** Engineer and reviewer. **Depends on:** Tasks 1–5. **Files:** `tests/reading-evaluation-runs.test.mjs`, `tests/helpers/records-harness.mjs`, all new tests above; browser fixture evidence under the implementation evidence directory.

- [x] Re-run the previously failing isolation test. Its `ORDER BY id` assumption is already replaced with `ORDER BY 1` in current source. Add a populated table without `id` and a composite-key/tied-first-column case; if ordering is unstable, use schema-derived primary-key ordering or canonical full-row sorting rather than excluding tables from comparison.
- [x] Separate isolation assertions by phase: freeze may read roles and the selected editorial sources; step execution reads roles and evaluation state, not member charts, notes or readings. Evaluation writes only its two existing tables. Verify all other table snapshots remain unchanged.
- [x] Verify draft/release hashes, selected keys, prompt/reflection assembly and saved-reading cache separation with the real complete bundles. Confirm a model failure uses the frozen candidate's deterministic template, not active copy; verify this with mocked transport.
- [x] Run targeted tests first, then `npm test`, `node_modules/.bin/tsc --noEmit`, scoped ESLint, `npm run build` and `git diff --check`. Record actual results for the final source; do not reuse the previous 57/58 audit result as the new gate.
- [x] At 1440px and 390px, verify the actual Content components: keyboard selection, source switching, stale preview rejection, budget error, browser departure/resume, historical report labels, partial/uncertain captures and downloads. Assert no overflow or console errors. Use fixture transport; no paid calls are needed for UI acceptance.
- [x] Obtain a fresh implementation review of authorization, frozen-source execution, campaign limits, report compatibility and release boundaries. Record unresolved findings before proceeding.

**Done when:** Local behavior and browser evidence pass on the exact implementation revision, including the restored isolation check. This is readiness for deployment and paid qualification, not content approval.

## Task 7 — Publish the evaluation capability while keeping content inactive

**Owner:** Release engineer. **Depends on:** Task 6. **Files:** owned manifest, publication receipt and deployment checks; `edge/pattern-workflows/worker.mjs` only if its protocol actually changes.

- [x] Commit only owned files using ordinary commits, then follow the authorized normal push/publication workflow. Record local/remote commit parity separately from the published application source/build and served asset identity.
- [x] Deploy a Worker only if changed, from a copy outside the app tree as required by `AGENTS.md`; otherwise record its observed version and unchanged protocol. Apply any necessary additive migration before deploying its consumer.
- [x] Verify authenticated admin preparation/download against the published application with zero model requests. Confirm member denial, frozen source identity, manifest limits and that the active content pointer has not changed.

**Done when:** The published evaluation capability matches reviewed source and can prepare the exact comparison without making the candidate live.

## Task 8 — Run the authorized eight-call member-provider pilot

**Owner:** Evaluation operator. **Depends on:** Tasks 5–7 and the confirmed Task 0 provider selection. **Inputs:** exact frozen pair, fixed four-case pilot manifest, source identity, $5 total generation cap and confirmed member-provider availability.

- [x] Freeze the Task 9 review rubric, proposed voice/repetition threshold, reflection-review schema and packet-generation version before making any model call. Record their hashes alongside the comparison plan; do not choose pass criteria after seeing outputs.
- [ ] Confirm credit/configuration and actual account pricing for the Task 0 member provider through account/provider evidence. Configuration availability alone does not prove sufficient credit. Freeze the approved $5 total generation cap across both arms; keep reservations identified as estimates until billed cost is reconciled. No additional paid reviewer calls or uncounted model smoke test are authorized.
- [x] Show the frozen provider-specific reservation bound before starting and prove each next reservation fits the remaining $5 cap. Existing conservative bounds may stop the pilot before eight attempts; that is a partial pilot, never grounds to weaken accounting or increase the budget. Reconcile captured usage where supported and retain uncertain reservations. A reservation is not a billed-cost claim.
- [x] Freeze both arms from the final edited draft and its stored baseline. Confirm the four fixed `draft-pilot-1` cases and exactly four expected calls per arm, identical serving prompt/validator/model settings and the 60-second member deadline. Reject any larger manifest. Record the full 70-case suite as offline evidence only.
- [x] Start baseline and then candidate under the same bounded pilot campaign. Each case position is attempted at most once, with at most eight calls total. Preserve stopped, failed and uncertain runs; no repair calls, retries or cherry-picked replacement outputs. Any further paid round requires new authorization as well as a new recorded identity and ceiling.
- [x] Download all pilot captures, fallback bodies, deterministic reflection questions, usage/reservation ledger and coverage. Confirm the four selected candidate keys reached I1 in their declared cases and actual requests. Report the other 16 reachable keys as offline-covered, not live-evaluated. Record final citation/template use and manually inspect meaning; do not equate citations with semantic use.
- [x] Generate the manifest-bound pilot comparison. Require all four pairs captured and reviewed before calling the pilot complete; an unavailable case remains an evidence gap, even if its fallback is sound. Keep availability failure distinct from copy rejection. A complete pilot still does not establish full affected-key qualification.

Execution: all eight attempts completed; $0.879908 conservative accounting, no retries or uncertain captures. Account-specific invoiced pricing remains unavailable; published provider pricing and conservative reservations were recorded before generation. Strict Node replay failed on a diagnosed legacy runtime float difference.

**Done when:** The authorized pilot is complete or its safe stop is documented, with the exact candidate, member-serving provider, attempt count, costs and remaining coverage gaps attributable. A safe stop is not a completed comparison, and four successful pairs are not full 20-key live qualification. No wider paid run is implied.

## Task 9 — Qualify writing and bind human approval

**Owner:** Independent reviewers and human editor. **Depends on:** Task 8. **Files:** versioned review packets, private assignment, reviewer results, adjudication and qualification summary in the evidence directory. The pilot can support a scoped review only; full affected-key qualification and exact-content human approval remain open gates. Additional paid review or generation needs separate authorization.

- [x] Extend the existing packet preparation with the declared content-pair manifest. Include every captured model candidate, rejected candidate, distinct displayed/fallback body and reflection question, with supplied facts and tone/depth. Keep authorship, arm, acceptance and provider labels outside reviewer packets.
- [x] Obtain two fresh blinded assessments using the existing protocol; preserve prompts, packet hashes and coverage. Resolve disagreements through its adjudication procedure. AI review is not human approval.
- [x] Apply the existing substantive-claim and specificity/grounding/coherence gates, plus applicable natal/synthesis criteria. For this remediation, set an additional proposed target of at least 4/5 for voice and repetition on each affected candidate item; freeze this addition before generation. Review source copy and questions directly as well as downstream prose.
- [x] Add a versioned companion `reflection-review.json`, bound to packet/pair hashes and neutral item IDs. For each source question record `singleQuestion`, `answerableWithoutPremise`, `consistentWithSources`, a quoted rationale and pass/fail; all three checks must pass. Also review the final assembled prompt for assumptions, coherence and source consistency, recording its question count separately: schema 4 currently appends a domain question, so one question per source does not imply one question in the final UI. Record inherited composition limitations explicitly; changing final reflection precedence requires a separately reviewed assembly change. Update the review instructions/packet tooling for this lane before Task 8; preserve historical protocol-v1 artifacts.
- [ ] Require no unresolved substantive findings or new failures in preserved specific-entry cases. Report paired improvements and regressions by changed key; length or higher validator acceptance alone cannot qualify the draft. If revisions are needed, save a new hash and preserve the failed round; no same-hash pass may be claimed for revised text.
- [ ] Obtain actual human editorial approval of the exact baseline/candidate hashes and the observed outputs. Use the existing approval action only after that review. Check the broader release checklist for applicable open gates; a scoped content comparison does not close schema-5 four-arm, seven-day, Enterprise or other independent qualifications.

Execution: two fresh reviewers and one fresh adjudicator completed the scoped assessment. Body and final-reflection qualification failed. Source questions pass 4/4; final prompts pass 2/4. Correct the documented composition issues and close remaining coverage/replay gates before asking for exact-content human approval.

**Done when:** The final candidate has complete affected-key evidence, passes the declared editorial gates, and has human approval bound to its exact bytes. Otherwise keep it inactive.

## Task 10 — Stage, activate, verify utilization and retain rollback

**Owner:** Release engineer and editor. **Depends on:** Task 9 and applicable existing release gates. **Files:** existing `src/lib/content/release-lifecycle.server.ts`, release receipt and live acceptance evidence. Reuse the established lifecycle rather than introducing another activation path.

- [ ] Read the current active pointer again. If it differs from the frozen baseline, review the intervening release/delta and explicitly decide whether to rebase and requalify; do not overwrite a newer release based on the original export.
- [ ] Stage the exact approved content under an unused numeric release version. Verify its canonical checksum and inactive state, immutable artifact and delivery receipt. Record the mapping between the approved `version: pending` draft hash and the staged bundle's new version/hash; the only permitted publication transformation is the declared release identity.
- [ ] Activate using the expected-current-pointer guard. Verify the authoritative application pointer, edge delivery state and immutable artifact agree. Reconcile an incomplete delivery using its existing operation; do not create a replacement version or regenerate content to hide the failure.
- [ ] With controlled consented owner accounts, verify new readings report the activated release and correct selected interpretation keys; inspect rendered wording/questions and saved provenance. Include an account whose real calculated contact selects a new wildcard, plus an existing specific-entry control. Do not fabricate member chart facts or call synthetic fixtures live-member evidence.
- [ ] Verify old saved readings retain their prior release and content, and fresh cache identity follows the new release. Confirm requests use exactly the Task 0 provider/model policy and never fall over to another provider. Natal feature essays are a separate generation path and are not a success criterion for these cycle edits.
- [ ] If no controlled live chart currently reaches a new key, report synthetic proof and live reachability as separate states; keep that acceptance item open. Any usage summary must distinguish generated readings from cached views and use existing consented aggregate diagnostics, not export private reading text.
- [ ] Freeze rollback triggers before activation: incorrect pointer/artifact, wrong-source rendering, provenance mismatch or a newly substantiated editorial defect. Roll back to the verified previous release through the existing guarded action, verify both planes and new generation, and preserve all historical records and incident evidence. A credit failure alone is an availability incident, not evidence the editorial bundle is wrong.

**Done when:** The intended release is live, new member readings demonstrably use its selected entries, history remains intact, and the exact previous release remains a verified rollback target.

## Execution order and completion record

Tasks 1–4 are the evaluation capability; Task 5 can proceed alongside them after the baseline is frozen. Task 6 is the local gate, Task 7 publishes that capability, Task 8 executes only the approved eight-call/$5 pilot, Task 9 records scoped review and remaining qualification/approval gates, and Task 10 changes serving content only after those gates close. The proposed editorial delta and its limitations are recorded in [editorial notes](../../reviews/content-draft-effectiveness/2026-10-13/editorial-notes.md) and the [publication decision](../../reviews/content-draft-effectiveness/2026-10-13/publication-decision.md).

At closeout record each status independently: implementation SHA; tests/typecheck/lint/build/browser results; application and Worker deployment identities; baseline/candidate/source-plan hashes; case-set identity and changed-key coverage; captured and uncertain attempts; reserved and reconciled cost; validator results; AI review; human approval; staged release/version mapping; active pointer and delivery state; member provenance/render evidence; prior-release preservation; rollback target; remaining gaps.

Execution evidence: [manifest](../../reviews/content-draft-effectiveness/2026-10-13/manifest.json), [progress and validation](../../reviews/content-draft-effectiveness/2026-10-13/progress.md), [source editorial review](../../reviews/content-draft-effectiveness/2026-10-13/source-editorial-review.md), and [browser checks](../../reviews/content-draft-effectiveness/2026-10-13/browser/result.json). Checked tasks describe verified work. The authorized pilot completed 8/8 attempts with $0.879908 conservative accounting; human approval and content activation remain open. Strict Node response replay did not pass because one legacy floating-point fixture value differs from workerd; see the runtime diagnostic. The four live case plans and captures remain intact.
