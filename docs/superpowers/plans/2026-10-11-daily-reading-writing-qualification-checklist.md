# Daily Reading Writing Qualification Implementation Plan and Checklist

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the observed writing drift, qualify fresh hosted outputs through a documented blinded AI review process, and finish the release evidence without requiring a human prose reviewer.

**Original architecture (2026-10-11):** Keep the production daily reading on its then-existing one-call, 20-second path. Select frozen content only within the admin synthetic evaluator; review exported synthetic prose outside the reader request. Complete the ordinary/synthesis correction first, then qualify natal lenses in a separate paired experiment before any catalogue activation. Later runtime identities and the approved release-scope replacement are recorded below.

**Tech stack:** TanStack Start, React, TypeScript, Zod, Node test runner, Vite offline replay, Lovable's hosted language gateway, and the existing records service.

**Spec:** This checklist supplements the [synthesis design](../specs/2026-10-11-daily-reading-synthesis-design.md), the [natal design](../specs/2026-10-11-daily-reading-natal-temperament-design.md), and [Reading evaluation](../../../READING-EVALUATION.md). Task 2 explicitly defines a new AI review lane because the existing documents require human judgments.

**Status reconciled 2026-10-13:** Historical full qualification plan with delivered implementation and failed/partial writing evidence. The correction was published and its first blinded review failed; subsequent exhaustive natal rounds also failed or remained partial. The operator later approved a smaller natal/transit writing gate, which passed and supported joint `0.7.1` activation. Those scope changes do not turn the original failed rounds into passes. New schema-5/final-provider qualification remains open under release-completion Task 13.

**Evidence and disposition:** The original completion record below is dated historical evidence, not today's production status. See the [approved replacement natal gate](../../reviews/daily-natal-lens/lightweight-readiness.md), [passing transit review](../../reviews/daily-transit-story/2026-10-12-prompt-recheck/README.md), [joint activation](../../reviews/daily-transit-story/2026-10-12-transit-runtime-fix/README.md), and [central closeout record](2026-10-12-release-completion-checklist.md#reconciled-status). Tasks 1–8 retain their historical failed-round/implementation procedures; exhaustive Task 9 review prerequisites were superseded for that joint release, and Task 10's source/activation outcome was delivered through the owned-service plan. The unchecked count is not an outstanding task count. This reconciliation adds no live checks or review verdicts.

**Execution reference:** All 20-second/3.7/v5 inputs, version reservations, branch ownership and CLI-availability statements below describe the original frozen round. Future work uses [current provider, policy and fixture identities](2026-10-12-release-completion-checklist.md#current-execution-reference) and a newly authorized plan; never rewrite the identities of archived reports.

## Verified starting point

| Evidence                     | What is established                                                                                                                                 | What remains open                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Git snapshot                 | `HEAD`, local `main` and local `origin/main` all resolve to `5ff869b91c3b44fa6b7e5da0d36d9666fd2debba`. The approved normal push completed earlier. | Recheck the remote before the next integration; a push alone does not establish the published app's SHA.              |
| Committed-code checks        | An isolated clean snapshot of `5ff869b` passed 369/369 tests, typecheck and build.                                                                  | New changes need their own checks; do not reuse this total as their result.                                           |
| Hosted admin report          | Complete `live-synthetic` run: 28 unique v5 cases, 27 accepted model attempts, zero rejected/unavailable, one `no_cycle` skip; no truncation.       | Writing qualification and correction comparison are incomplete.                                                       |
| Content used by that run     | Natal-free `builtin-0.5.0`; no `N1` facts anywhere, including cases with `natal-` names.                                                            | No actual-model natal-candidate run is established.                                                                   |
| Gateway                      | Hosted generation succeeded in the uploaded run. Missing local `LOVABLE_API_KEY` does not invalidate that evidence.                                 | Fresh hosted availability and credits must be established by a fresh run.                                             |
| Review                       | AI advisory findings identify specific semantic drift. Every exported `manualReview` field is null.                                                 | No blinded review or completed human review exists.                                                                   |
| Production content inventory | Earlier read-only production query returned zero `content_releases` rows.                                                                           | This was a point-in-time inventory; recheck before a later content action.                                            |
| Publication                  | Git sync to Lovable was established earlier.                                                                                                        | Updated public deployment identity, authenticated live behavior and natal catalogue activation are separate evidence. |

The original upload is `reading-evaluation-complete-2026-10-11T16-31-23.json` at:

`/tmp/codex-remote-attachments/01a12b9b-938c-7d72-8077-01a4fdd6ae69/7B7141B3-D398-4168-BA32-D505F40FD200/1-reading-evaluation-complete-2026-10-11T16-31-23.json`

Its SHA-256 is `166124efbabfb7ad690bda2d178fa4fd8fbbc7f9e7b4df668cdb4db0c6dc588f`. It records:

- Fixture `synthetic-daily-5`; case-set hash `1fec5a7a3842cbc4f374a9058dfa3264294df875db607db2d3a92aa1306f9b07`.
- Bundle hash `f68cc97e749d78d6a2332b9d87fb9fc4ce367d61d437ffa19f8485a2778330c1`; transit-copy hash `4d6048ea1d303410e2845d9dde9960da95749ff7ab20fd886779a4627abc677d`.
- Model `google/gemini-3.7-flash`; plan `daily-synthesis-1`; natal plan `daily-natal-lens-2`; reliability `natal-reliability-1`.
- Prompt `daily-astro-body-6`; validator `daily-reference-5`; gateway timeout `20000` ms.
- Attempt latency median 11.538 seconds, maximum 18.432 seconds, sum 315.934 seconds. These describe this run.
- No returned billing usage/cost, raw HTTP response, or explicit deployed commit identity. Preserve those gaps.

The matched offline replay in `/tmp/pattern-live-eval-review-20261011-9xsz690y/` reproduced all cases using the exact natal-free bundle without additional calls. The files named `unmatched-natal-candidate-probe` used the CLI's different default bundle; their eight natal-coverage rejections are not failures of the upload.

## Global constraints

- Preserve published Git history. Use normal merges and pushes; never force-push or rewrite already pushed commits.
- Preserve the four unrelated, currently untracked concrete-writing/transit-story planning documents. Do not stage directories or overwrite another agent's work.
- Coordinate shared-file ownership with `feat/daily-reading-transit-story`. It starts from `cc6a3cd` and needs the newer main before integration.
- Maintain fixed synthetic case inputs, production ranking/suppression, the one-call `20000` ms daily policy, and strict response shape. AI review adds no per-reader calls.
- Keep keys server-side. Synthetic evaluation reads no birth records, private notes or real readings and writes no application records.
- Keep `builtin-0.5.0` natal-free. Choosing an evaluation bundle must never insert, publish or activate a release.
- Natal geometry comes from Swiss Ephemeris/Placidus service responses; synthetic service labels do not prove live astronomical accuracy.
- Preserve Shell motion, reduced-motion behavior, retained chapter content, and independently validated natal essay reflection questions.
- Keep validator acceptance, AI writing review, human review, cost, Git sync, app publication and content activation as separate results.
- Never fill historical metadata from assumptions. Leave `manualReview` untouched; record AI assessments in separate artifacts with explicit provenance.

## Review focus

1. A source possibility becomes frequency, certainty or an unsupported exclusion: Tasks 3 and 7 must catch this.
2. Independent/unmatched contacts acquire a joint story, or suppressed geometry reappears: Tasks 3 and 7 retain negative controls.
3. A natal-free upload is replayed against natal content, or unlike configurations are combined: Task 4 rejects mismatches.
4. A safe fallback hides a failed raw candidate, or a reviewer sees prior verdicts: Tasks 5 and 7 preserve both outputs and blind the assignment.
5. Missing gateway access, a partial run or absent deployment identity is described as success: Tasks 6, 8 and 10 record the actual boundary.

## Execution order and responsibility

An implementation agent owns Tasks 1–6 and 8. Two fresh reviewer contexts own Task 7; neither authors the correction. An authenticated admin session supplies hosted runs in Tasks 6 and 9, which an agent can operate when that session is available. No human prose reviewer is required by the proposed AI lane. Natal Tasks 9–10 do not block release of the ordinary/synthesis correction.

| Current problem                                        | Concrete solution                                                              | Completion gate                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| No human reviewer                                      | Versioned, blinded AI review with two fresh contexts and explicit adjudication | Both verdicts and coverage recorded; `humanReviewCompleted: false`           |
| Modal/frequency/exclusion drift                        | Tighten daily instructions and review the actual replacement prose             | No unsupported substantive claims; applicable scores meet Task 7             |
| Missing local gateway key                              | Run synthetic evaluation in the existing hosted admin                          | Download a complete fresh report; preserve failures if access is unavailable |
| CLI defaults to a different bundle                     | Add explicit bundle selection and identity-checked report extraction           | Exact replay against the source bundle; mismatches fail before replay        |
| Natal candidate cannot be selected in current admin UI | Add a closed admin-only evaluation selector                                    | Paired runs without any production release-pointer change                    |
| Old docs say v3/v4, 26 cases, and model access pending | Add dated evidence and current 28-case/AI-lane instructions                    | Historical claims remain historical; new status cites real artifacts         |
| Push/deploy/activation are being conflated             | Capture each release stage separately                                          | Verified deployment plus a separate natal activation record if requested     |

## Task 1: Preserve the evidence and establish an owned workspace

**Files:** Create evidence under `docs/reviews/daily-reading-writing/2026-10-11/`: `source-report.json`, `source-identity.json` and `evidence-index.md`. Keep the original upload unchanged. Treat temporary review artifacts as supporting material rather than durable release records.

**Depends on:** Nothing. **Produces:** An immutable pre-correction baseline and an owned-path manifest.

- [ ] Record `git status --short --branch`, `git rev-parse HEAD main origin/main` and `git worktree list` before changes. Hash the four unrelated planning documents and retain the hashes outside the repo.
- [ ] If implementation would collide with active shared-file work, create a dedicated worktree from current `main`. Do not switch, clean or stash another agent's checkout. Merge the new main into unpublished feature work before integration; do not rebase pushed history.
- [ ] Copy the source report without editing it; verify its SHA-256 against the value above. Copy the matched integrity summary and label advisory prose reviews as unblinded AI evidence.
- [ ] Record the known source versions, all content/input hashes, 28-case coverage, 27 attempts, null manual scores, absent `N1`, and missing cost/deployed-SHA data in `source-identity.json`. Preserve originals rather than filling gaps.
- [ ] Use this report as the **pre-correction writing baseline**. Do not call it a pre-synthesis comparison or natal-candidate result. The earlier historical-code runner used different copy and is not the matched comparison for this plan.

**Acceptance:** The saved report matches the original hash; the evidence index states the limits; unrelated files and other worktrees are unchanged.

## Task 2: Define the AI qualification contract

**Files:** Create `docs/reviews/daily-reading-writing/review-protocol.md`. Update the current gate in `READING-EVALUATION.md`; link a dated addendum from the synthesis/natal specifications instead of rewriting their historical human-review evidence.

**Depends on:** Task 1. **Produces:** Protocol `daily-writing-ai-review-1` and a machine-checkable review artifact contract used by Tasks 5 and 7.

- [ ] State that this is an **AI writing-review lane**, with human review deferred. Existing historical requirements for blinded human review remain unsatisfied; a pass may be reported only as AI-reviewed synthetic qualification under the revised lane.
- [ ] Define each review artifact with `protocolVersion`, packet SHA-256, reviewer/context identifier, observed reviewer model/configuration when exposed, reviewer prompt SHA-256, review timestamp, blindness declaration, per-item scores, claim findings and final verdict. Unexposed model/configuration values remain unknown.
- [ ] Define each finding with neutral item ID, paragraph number, exact passage, supporting/missing fact IDs, explanation, severity and a proposed correction. Check substantive claims, rather than treating a citation as proof.
- [ ] Score `specificity`, `grounding`, `voice` and `repetition` from 1–5 using the existing rubric. Define general `coherence` explicitly: 1 = contradictory/disjointed; 3 = understandable but repetitive; 4 = a clear supported progression with only minor editing needed; 5 = each paragraph advances a distinct useful thought. Add `synthesisCoherence` when `S1` exists and `lensIntegration` when `N1` exists; use null with a reason where inapplicable.
- [ ] Define the 4/5 boundary: specificity identifies a useful source-supported practical distinction; grounding supports every substantive claim without strengthened modality; synthesis coherence develops the actual parent-supported relationship; lens integration applies N1 within that primary distinction. Conditional interpretation supported by I/D/S/N is editorial framing, not a measured personal state. A source-supported possibility must remain a possibility.
- [ ] Set the corrected-output gate: both reviewers require specificity, grounding and coherence ≥4/5 for each eligible candidate and each distinct non-quiet served/template body; selected synthesis also requires synthesis coherence ≥4/5. Record voice and repetition with explanations and fix material defects. Every substantive claim must have support, regardless of scores. Quiet template-only cases use the separate safety/skip check in Task 5.
- [ ] Require zero unsupported personal claims, invented joint premises, suppression breaches, factual mismatches, unsupported frequency/necessity/exclusions, prohibited instructions or behavioral predictions. A properly supported calculated future exact date is not a behavioral prediction.
- [ ] Require a supported practical distinction, not more planet names or extra prose. Standard-depth P/T coverage is optional. Review the technical-depth fixture against its separate detail guidance; never force technical padding or claim suppressed specificity.
- [ ] Define dispute resolution: compare exact quotes with the supplied statements; use a third fresh AI context if needed. An unresolved grounding dispute fails the case. Preserve original judgments and adjudication; never average away a substantive failure.
- [ ] Require `humanReviewCompleted: false` and separate automated/AI outcomes in the qualification summary. Fresh contexts using one model are separate assessments, not evidence of independent model families.

**Acceptance:** The gate, exclusions, reviewer provenance and failure handling are explicit. No advisory score is relabeled as blind or human evidence.

## Task 3: Correct the daily writing instructions without overclaiming validator coverage

**Files:** Modify `src/lib/ai/daily-voice.ts` and `src/lib/ai/diagnostics.ts`. Change `src/lib/ai/language.server.ts` only if the request assembly needs the new guidance. Extend `tests/reading-language.test.mjs`, `tests/reading-natal-language.test.mjs` and `tests/reading-request-policy.test.mjs` as needed. Keep semantic regression examples in the review protocol.

**Depends on:** Tasks 1–2. **Produces:** A new daily prompt identity and concrete regression examples; the content bundle and fixtures remain frozen for the correction comparison.

| Observed passage                                                                  | Missing support                                                        | Required correction                                                   |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `natal-moon-fallback` p1: “Rather than indicating a sudden change in purpose”     | C1/I1 do not exclude a change in purpose                               | Remove the exclusion; develop the supplied role/capacity distinction  |
| Same p1: “daily obligations have expanded”                                        | Source describes a role that can feel demanding, not a known expansion | Keep the scene conditional and avoid asserting a reader event         |
| `natal-freedom-reflex` and `natal-service-aspect` p1: “often” where I1 says “can” | Possibility does not establish frequency                               | Preserve possibility unless frequency is explicitly supported         |
| `natal-synthesis-integration` p2: scope “also increases” structure                | S1 says “can increase”                                                 | Preserve that qualification in the joint relationship                 |
| Reinforcement repeats dependable progress/persistence                             | The second paragraph adds little                                       | Distinguish continuity from targeted action using I1/I2/S1, then stop |

The `natal-` case names above come from the natal-free report; these findings do not establish a lens-writing defect.

- [ ] Add explicit guidance to preserve the supplied strength of a claim: possibility stays possibility, conditional scenes stay conditional, and new frequency, necessity or exclusions need their own support. Do not globally ban “often” or “must” when the supplied source legitimately supports them.
- [ ] Add guidance that a contrast may explain two supported options but must not claim that an unsupplied alternative is absent. Keep role/capacity scenes separate from invented personal history or relationship events.
- [ ] Require distinct paragraph functions for selected reinforcement: sustained commitment and targeted action, followed only by supported useful detail. Preserve the permission to retain clear source wording; do not manufacture novelty with new scenes.
- [ ] Add meaningful intercepted-request tests that preserve the exact source I/S statements, parents, suppression and body-only schema after changing instructions. Keep a structurally accepted but semantically unsupported example to demonstrate the validator's limit; semantic success must come from fresh prose review, not a mocked response or prompt-string assertion.
- [ ] Bump `DAILY_PROMPT_VERSION` from `daily-astro-body-6` to the next unused identity (expected `daily-astro-body-7` after checking other agent changes). Bump the validator only if its behavior changes; a prompt correction alone retains `daily-reference-5`.
- [ ] Run the focused language/policy/cache tests below. Confirm one eligible dispatch, no retry, no quiet-day call, historical diagnostics retained, and cache reuse governed by the existing version digest.
- [ ] If a later review finds a deterministic template defect, fix `src/lib/reading.server.ts` with a targeted regression test. Preserve the primary meaning, selected synthesis exactly once, and provenance. If editorial copy must change, create a new immutable bundle identity and obtain a newly matched comparison rather than altering the frozen baseline.

```sh
node --test tests/reading-language.test.mjs tests/reading-natal-language.test.mjs tests/reading-request-policy.test.mjs tests/reading-cache.test.mjs tests/reading-synthesis.test.mjs
```

**Acceptance:** Request and cache contracts pass. The prompt addresses each observed error without broadening claims, adding per-reader review calls or pretending lexical validation proves semantics. Actual improvement remains pending Task 7.

## Task 4: Make admin and offline evaluations use explicit, matching bundles

**Files:** Modify `src/lib/pattern.functions.ts`, `src/lib/pattern.server.ts`, `src/lib/ai/language.server.ts` (synthetic capture only), `src/lib/ai/reading-evaluation.shared.ts`, `src/components/pattern/ReadingEvaluation.tsx` and `scripts/evaluate-readings.mjs`. Extend `tests/reading-live-eval-auth.test.mjs`, `tests/reading-live-eval.test.mjs`, `tests/reading-eval.test.mjs`, `tests/reading-natal-evaluation.test.mjs` and `tests/reading-request-policy.test.mjs`.

**Depends on:** Task 1. **Produces:** Hosted bundle selection and safe extraction/replay of complete synthetic reports.

**Interfaces to implement:**

- Strict authenticated POST: `{ caseId: string, bundleSource?: 'active' | 'builtin' | 'natal-candidate' }`; default `active`.
- Server wrapper: `runReadingEvaluationCase(db, userId, caseId, bundleSource = 'active')`. Resolve only after the existing admin-role check; continue calling `runSyntheticEvaluationCase(caseId, bundle)`.
- Optional report `bundleSource` metadata, checked for consistency within a run; absent historical values remain absent.
- Offline API: `evaluateReadings({ responses, bundleSource })`; bounded choices `builtin` or `natal-candidate`.
- New CLI options: `--bundle builtin|natal-candidate`, `--extract-responses complete-report.json --bundle ... --output responses.json` and `--source-report complete-report.json` to bind a replay to that report. These options **do not exist yet**.
- Strict natal comparison mode: `--compare-natal baseline.json candidate.json`, with `--before-identity identity.json --after-identity identity.json` for recorded source/build evidence. Ordinary `--compare` remains flexible about the intended prompt correction.

- [ ] Extend the strict Zod schema and server wrapper with the closed selector. Reject arbitrary bundles, private contexts, charts, prompts, model overrides and unknown fields.
- [ ] Map `active` to the existing fail-closed active read, `builtin` to `DEFAULT_BUNDLE` and `natal-candidate` to `NATAL_CANDIDATE_BUNDLE`. Validate unknown selectors even when calling the server wrapper directly. No publication/activation helper may run.
- [ ] Add a labeled admin selector for current active copy, natal-free baseline and inactive natal candidate. Freeze it at Start, disable it while running, send the frozen choice with every case, and display the resulting version/hash. Add `bundleSource` to mixed-run checks.
- [ ] Require explicit `--bundle` for offline replay/extraction. Preserve no-network enforcement, fake key, no project config/`.env` loading, non-executable JSON and exclusive new output paths.
- [ ] Implement extraction of `case.candidate.paragraphs` into the existing case-keyed response dictionary, not the whole report or its `paragraphCount/truncated` wrapper. The quiet case is null. Accept only complete reports with all 28 unique cases, losslessly recoverable candidates and matching fixture/input/model/selected-bundle identity.
- [ ] Add optional `captureLossless` to new synthetic candidates, computed before truncation or sanitization. `truncated: false` alone is insufficient: current capture can discard a non-string fact ID or malformed shape. Reject unavailable/malformed/truncated/sanitized captures; reject historical rejected drafts without proof of lossless capture. The uploaded accepted, untruncated, fully shaped candidates remain usable. Never turn a rejected draft into acceptance by filtering it or substituting its fallback.
- [ ] Add `--source-report` verification for evidence replay: check the original report SHA-256, selected bundle/input/model identities and exact extracted paragraph dictionary, then save that original identity separately from current replay metadata. Handwritten replay without source evidence remains labeled a fixture run. Replaying old text must not give the source report a new prompt or deployed-SHA identity.
- [ ] Reject unsupported active custom-copy hashes against the two shipped bundle choices. Do not silently substitute built-in copy. A future frozen custom-bundle import is separate work if an actual run needs it.
- [ ] Test all selectors for non-admin denial, failed role query, zero application writes, no private reads and zero dispatch for invalid input. Built-in choices read only roles; `active` retains fail-closed content reads.
- [ ] Test positive natal facts only under the candidate, no catalogue leakage under `builtin`, unchanged fixture/transit-copy/model identities, mid-run selector changes, historical absent metadata, lossless extraction and rejection of mismatched hashes/incomplete reports. Include the exact sanitization trap `facts: ['C1', 'I1', 42]`: capture cannot make it a successful replay.
- [ ] Add a dedicated natal identity guard requiring equal fixture/case/config hashes, transit-copy hash, model, prompt/validator/plan/natal-plan/reliability versions and timeout. Check equal observed build/source revision through the supplied identity records; missing proof remains an explicit qualification gap. Allow only the documented bundle/catalogue and evaluation-selector differences. Test changed policy/source rejection; keep ordinary correction comparisons permissive about intentional prompt changes.
- [ ] Run the focused suites below. Browser-check the selector and Start/Stop/download flow with keyboard and reduced motion; no real model call is needed for this UI check.

```sh
node --test tests/reading-live-eval-auth.test.mjs tests/reading-live-eval.test.mjs tests/reading-eval.test.mjs tests/reading-natal-evaluation.test.mjs tests/reading-request-policy.test.mjs
```

**Acceptance:** Evaluation-only content choice cannot affect production content, reads or caches. Replaying the uploaded report explicitly selects `builtin-0.5.0` and reproduces 27 accepted/one quiet skip; the natal default cannot contaminate that check.

## Task 5: Prepare blinded packets and enforce review completeness

**Files:** Create `scripts/reading-writing-review.mjs` and `tests/reading-writing-review.test.mjs`. Create packet/review/qualification JSON under the Task 1 evidence directory; retain the assignment key outside reviewer-visible inputs.

**Depends on:** Tasks 1–2 and 4. **Produces:** Review packets, private assignment mapping, reviewer artifacts and a strict coverage/gate summary.

**CLI to implement:** `prepare --before report.json --after report.json --output-dir NEW_DIR` and `qualify --assignment assignment.json --review reviewer-a.json --review reviewer-b.json [--adjudication adjudication.json] --output NEW_FILE`. This script operates only on local synthetic JSON; it makes no model/network calls.

Task 9 also uses `catalogue --bundle frozen-candidate.json --review catalogue-a.json --review catalogue-b.json [--adjudication catalogue-adjudication.json] --output NEW_FILE`. Validate every `natalLenses` key against that frozen bundle and its hash; this mode also makes no model calls.

- [ ] Build items for all captured candidates and each distinct displayed/template body, including rejected drafts. Give each item the exact applicable facts, tone/depth and suppression limits. Deduplicate only when text and the full fact/tone/depth/suppression context match, retaining all case/output mappings. A sanitized capture is a partial view of the draft, not a lossless raw response.
- [ ] Replace case/run names with neutral aliases. Hide before/after labels, model/template origin, generator identity, versions, acceptance/rejection outcomes, advisory findings and existing scores. Keep fact IDs needed for claim checking. Source content may reveal its subject; blind origin/assignment rather than claiming perfect concealment of the text's nature.
- [ ] Randomize order separately for two packets and save each packet hash plus the private reverse mapping. Save a shared canonical item-set hash; bind each review to its own expected packet hash, because different orders produce different packet hashes. Reviewers may inspect a sequence of neutral items for repetition but must not see each other's answers or the implementation conversation.
- [ ] Require claim findings and scores for every applicable item. Exclude quiet-day template-only items from model-writing score counts, while checking their safe quiet behavior. Record unavailable/malformed drafts as uncovered failures instead of silently dropping them.
- [ ] Validate review JSON against the Task 2 contract: missing item, duplicate reviewer/context, a packet hash that differs from that reviewer's assigned hash, wrong canonical item-set hash, out-of-range score, missing applicability reason, unblinded input or unresolved substantive finding prevents qualification.
- [ ] Validate optional adjudication against the same item set: reference the original reviewer/finding ID, exact passage, fact evidence, resolution and adjudicator provenance. Preserve both original judgments. An adjudication can resolve a disputed finding but cannot silently raise a below-threshold score; obtain and retain a fresh blinded reassessment if a score still fails.
- [ ] Compute candidate qualification from the **corrected run**, not from whether the old baseline passes. Preserve baseline defects and score deltas as comparison evidence. A safe displayed fallback cannot rescue a failed raw candidate.
- [ ] Test one complete passing synthetic review pair with different packet orders/hashes, missing/duplicate coverage, mismatched packet/item-set identity, unsupported-claim findings despite high scores, invalid adjudication, low-score failure after adjudication, context-sensitive deduplication, inapplicable dimensions, and baseline failure with a valid corrected pass.

```sh
node --test tests/reading-writing-review.test.mjs
```

**Acceptance:** Review preparation cannot bias the judges with earlier verdicts, and the summary cannot pass on incomplete/high-scoring-but-unsupported evidence. Synthetic checker tests establish bookkeeping, not the truth of reviewer judgments.

## Task 6: Integrate the corrections and obtain a fresh hosted report

**Files:** Task 3–5 owned implementation/tests; save `corrected-report.json`, `corrected-source-identity.json`, `comparison.json` and replay logs in the evidence directory.

**Depends on:** Tasks 3–5. **Produces:** New actual-model evidence for the frozen natal-free correction.

- [ ] Review the whole final owned diff and run the full tests, typecheck and build against a clean snapshot of the final implementation. Record actual totals and source SHA; if the source changes afterwards, rerun the affected checks.
- [ ] Lint only changed code paths and record any repository-wide baseline separately. Do not use the existing broad `npm run format` command; format only owned paths.
- [ ] Stage an explicit owned-path manifest and commit the reviewed changes. Integrate with a normal merge after verifying current main/other-agent state. Do not include the four unrelated planning docs.
- [ ] Establish an isolated hosted qualification route before syncing a correction to connected main. Verify the actual project's deployment/auto-publication behavior; the repo proves main sync but has no branch-preview configuration. Use a supported unpublished Lovable remix/staging project or a verified existing isolated preview, with the exact tested revision, gateway access, admin authentication and confirmed runtime bindings. If unavailable, keep the correction unpublished and record the precise hosting/access dependency; do not assume a main push is isolated. Preserve a tested rollback commit and honor any already-authorized release scope without requesting it again.
- [ ] In an available authenticated admin session, open `/content` → Reading quality → select **Natal-free built-in baseline** → **Run synthetic evaluation**. An agent can operate the existing signed-in session; do not export keys/cookies or weaken authentication. If no authorized session is available, record admin sign-in/report delivery as the remaining operational dependency.
- [ ] On missing key/auth/credits/rate limit/timeout, preserve the partial report and bounded error code. Resolve configuration in the hosted project; resolve credits/rate limits at that service. The earlier Lovable plugin credit rejection and local absent key are separate from the hosted report's successful inference. Never bypass the admin gate or automatically retry paid calls.
- [ ] Download the complete fresh report. Require the same 28 inputs, case/config hashes, `builtin-0.5.0` hashes and model as the upload; new prompt identity is the intended change. Record all changed metadata, exact source/build identity if exposed and remaining unknowns. If model/copy/fixtures differ, create a new matched baseline.
- [ ] Capture returned usage or dashboard billing evidence if available, with its scope. Otherwise record cost as unknown. One complete suite has at most 27 model calls; do not derive dollar cost from latency.
- [ ] Extract/replay each report with its explicit bundle and compare the two **live reports**. Replay demonstrates validation integrity; it cannot demonstrate the changed prompt's effect. A partial fresh run does not qualify.

Verification commands for the final implementation:

```sh
node --test --test-timeout=120000 tests/*.test.mjs
npx tsc --noEmit
npm run build
git diff --check
```

Evaluation commands **after Task 4 implements the new flags**, using new output paths:

```sh
npm run eval:reading -- --extract-responses "$EVIDENCE/source-report.json" --bundle builtin --output "$EVIDENCE/source-responses.json"
npm run eval:reading -- --bundle builtin --responses "$EVIDENCE/source-responses.json" --source-report "$EVIDENCE/source-report.json" --output "$EVIDENCE/source-replay.json"
npm run eval:reading -- --extract-responses "$EVIDENCE/corrected-report.json" --bundle builtin --output "$EVIDENCE/corrected-responses.json"
npm run eval:reading -- --bundle builtin --responses "$EVIDENCE/corrected-responses.json" --source-report "$EVIDENCE/corrected-report.json" --output "$EVIDENCE/corrected-replay.json"
npm run eval:reading -- --compare "$EVIDENCE/source-report.json" "$EVIDENCE/corrected-report.json" --output "$EVIDENCE/comparison.json"
```

Set `EVIDENCE` to the owned evidence directory first. Do not overwrite an earlier attempt. Replaying the old report with corrected code can reveal validator compatibility but must not acquire the corrected prompt's historical identity.

**Acceptance:** Complete source/corrected live reports are matched on frozen inputs, copy and model; intentional code/prompt changes and any failures are visible. Tests/build prove the final commit, rather than a dirty checkout.

## Task 7: Run two fresh AI reviews and resolve every substantive finding

**Files:** `reviewer-a.json`, `reviewer-b.json`, any `adjudication.json`, `qualification.json` and `writing-review.md` in the evidence directory.

**Depends on:** Tasks 5–6. **Owner:** Two fresh reviewer contexts, followed by an adjudicator when necessary.

- [ ] Prepare blinded packets for the uploaded baseline and fresh correction. Spawn two new contexts with no inherited implementation history; provide only their packet, rubric and review instructions. The prior ordinary/synthesis advisory reviewers are evidence inputs for regressions, not the fresh blind judges.
- [ ] Require paragraph-level claim tracing. Explicitly inspect certainty, frequency, necessity, exclusions, personal events, clinical/behavioral claims, instructions, suppression and unsupplied joint relationships.
- [ ] Review selected tension/reinforcement/reversed synthesis for a distinct supported relationship. Review independent, unmatched and suppressed-support cases for absence of a joint premise. Optional timing omissions in standard depth are not failures by themselves.
- [ ] Review ordinary cases, tone/depth differences and all distinct fallbacks. Record quiet-day template checks separately from 27 possible model candidates. Compare suite-wide repeated phrasing without demanding unsupported variety.
- [ ] Apply Task 2's gate to the corrected run and its current fallbacks; preserve baseline grades solely for comparison. Report raw-candidate failures and displayed fallback behavior separately.
- [ ] Resolve disagreements with exact supporting statements and a fresh adjudication context if needed. If prose or source copy changes, create a new evidence round with a new actual-model run and fresh blind review; do not hand-edit model output into a passing report. If adjudication establishes support without changing prose, retain the original live run and obtain any required fresh score reassessment without another provider call.
- [ ] Run the local qualification checker and record per-item failures, score deltas, resolved disputes, coverage, reviewer provenance, `humanReviewCompleted: false` and known limitations.

**Acceptance:** Every required corrected output meets the AI lane's gate, with no unresolved substantive finding. Qualification is reported as **AI writing-review passed**, never as human approval, empirical psychological validation or proof of real-reader quality.

## Task 8: Reconcile the documents and finish the ordinary/synthesis release

**Files:** Update `README.md`, `READING-EVALUATION.md`, `READING-INTEGRITY.md`, the existing synthesis/natal checklists, and the synthesis validation record. Create `docs/superpowers/releases/2026-10-11-daily-writing-qualification.md`.

**Depends on:** Task 7 for a pass declaration; failed-round documentation can be completed earlier.

- [ ] Correct current instructions to 28 fixed cases/at most 27 attempts and `synthetic-daily-5`. Explain explicit evaluation bundle selection, server-side key access, extraction format and AI review provenance.
- [ ] Append dated evidence to historical records: commit/push completed; hosted natal-free generation completed; original checks are historical; fresh AI review result is separate. Do not retroactively tick old procedural steps or replace “no external calls” statements that described an earlier local phase.
- [ ] Link source reports, hashes, final code identity, comparison, both reviews and adjudication. Report gateway outcomes, writing scores, failures, latency and unknown cost independently. Keep natal status pending.
- [ ] Recheck effective production content before release. If a legacy active release lacks new rules, keep its authoritative copy semantics and do not silently inherit or activate the new catalogue. Earlier zero rows do not establish today's state.
- [ ] When the correction release is authorized, push the tested commit normally and verify remote parity and Lovable sync. Update the public app through the established Publish changes workflow if needed; record actual deployment/version evidence instead of assuming a push updated it.
- [ ] Smoke the deployed app and an authorized signed-in Today reading: response succeeds, source/evidence links restore, repeated load reuses the same new-version reading, and quiet/suppressed paths remain safe. An automated agent can run these in an existing session; absent authentication leaves this check explicitly open.
- [ ] Record the cache consequence: a prompt identity change produces one regeneration on each active reader's first Today load under the new version. Retain old rows/feedback. This correction requires no database migration; it does not activate natal lenses.
- [ ] Preserve rollback through a forward revert/new commit and normal push/publication, plus the actual prior content pointer if content changed. Rollback does not rewrite previously saved reading evidence or promise zero additional cache regeneration.

**Acceptance:** The correction has an accurate evidence record and independently verified Git, preview/public deployment and live behavior. If writing fails, publish the failure record and continue correction; do not mark the release qualified.

## Task 9: Qualify natal lenses separately without activating production

**Files:** Existing `src/lib/content/natal-candidate-bundle.ts`, `natal-lens-catalogue.ts` and natal evaluation fixtures; update `docs/reviews/daily-natal-lens/catalogue-review.md` and `writing-qualification.md`. Save fresh paired reports/reviews under `docs/reviews/daily-natal-lens/2026-10-11/`.

**Depends on:** Tasks 4–7. **Produces:** Candidate-only AI catalogue approval and matched actual-model lens qualification.

- [ ] Freeze the catalogue and candidate identity. Current candidate is `builtin-0.6.0`, schema 3, 62 entries (60 single-sign plus two compound); hash `99ddec7c32088a75e7ff84427c83780415d15402287b0e27e2aa9b206ce8d994`. Changes require a new immutable identity and renewed review.
- [ ] Use two fresh reviewers for all 62 entries. Check conditional framing, ordinary scene, practical distinction, roles/anchors, compound eligibility and absence of biography, clinical explanation, behavioral prediction, stereotype certainty, directives or raw origin claims. Require both reviewers to cover every frozen key with per-entry verdicts/findings, zero unresolved substantive defects, the catalogue hash and reviewer provenance. Extend Task 5's local checker with a `catalogue` mode that rejects missing/duplicate keys and unresolved findings. Record AI approval separately from the catalogue author's structural review and deferred human approval.
- [ ] Obtain two complete fresh hosted v5 runs using Task 4's selector: `builtin` baseline and `natal-candidate` candidate. Keep the **same corrected code, prompt policy/version, model, preferences, input hashes and normalized transit-copy hash** across both. The intended N1 facts, lens instructions and dependencies may differ; identical rendered request text is not required. Choosing the candidate does not activate a release.
- [ ] Reuse the corrected Task 6 run as the natal-free baseline only if its full identities match the candidate run. Otherwise rerun the baseline. The uploaded pre-correction report cannot isolate the lens effect when the candidate uses a new prompt.
- [ ] Record up to 54 model calls for two full fresh runs, or up to 27 additional calls when the unchanged Task 6 baseline is reused. Preserve all attempts, partial failures, durations and known/unknown billing evidence.
- [ ] Explicitly replay/extract each bundle with Task 4's flags and use its strict `--compare-natal` mode on the live reports and source-identity records. Permit only bundle release/schema/catalogue and evaluation-selector differences for this experiment; reject changed transit copy, model, case inputs, source revision or prompt policy. The existing general comparison command reports policy changes but does not reject them, so it cannot enforce this experiment by itself.
- [ ] Blind-review captured candidates and templates using Task 2's protocol. Each of the eight candidate-side positive cases needs specificity, grounding and lens integration ≥4/5 from both reviewers; retain the general coherence/substantive-claim gate. Baseline outputs without N1 receive null lens-integration scores with an applicability reason.
- [ ] Require the duty/freedom pair's supported distinction: preparation versus needing everything settled; commitment versus choice of route. Confirm own-target selection and Moon fallback actually affect prose meaning, rather than merely changing adjectives.
- [ ] Review same-body/Moon/fallback examples together for likely repetition across contacts. The one lens per body remains deterministic; do not solve repetition by inventing a new natal meaning.
- [ ] Require no natal claim in sign-boundary, unknown-time, degraded-position or legacy-snapshot negatives. Verify mixed-source/house suppression, all early `N1/C1/I1` parents and joint `S1/N1` dependencies; structural acceptance remains separate from semantic support.
- [ ] Record the result with paired identities, case coverage, exact positive-case grades, reviewer artifacts and disputes. If source/lens copy changes to fix a failure, version it and repeat the matched experiment.

**Acceptance:** Independent fresh AI catalogue reviews and a complete matched natal experiment pass. Synthetic source marking still does not prove live Swiss reliability; production activation remains a separate action.

## Task 10: Prepare the natal activation and operational closeout

**Files:** Update `docs/superpowers/releases/2026-10-11-daily-natal-validation.md` with a dated addendum; create a new candidate/rollback manifest if the content or code identity changed. Use `src/routes/api/public/content-releases.ts`, `src/lib/content/schema.ts` and `src/lib/pattern.server.ts` as the publication/normalization/activation contracts.

**Depends on:** Task 9 passing and a separately requested natal release action.

- [ ] Run the natal reliability/data/storage/privacy/cache/evaluation checks against the final candidate. Include owner reopen/archive/export, one unreadable-row isolation, erasure, inactive-catalogue behavior, stale/retryable assessment backoff and canonical cache identity.
- [ ] Verify an authorized known-time service-backed chart and an unknown/degraded-time chart through the real configured Swiss service. Confirm Placidus provenance, uncertainty screening, permitted lens versus suppression, and owner-only encrypted evidence. Do not mistake fixture labels for this live check.
- [ ] Inventory the actual active release and save its version/checksum/pointer or the explicit no-active-release state. If no row exists, use authorized records administration to stage the exact validated natal-free prior graph as an immutable **inactive** release; verify the admin rollback path can select it before candidate activation. Existing activation/rollback APIs require a row. Signed ingestion activates and cannot stage it inactive; generating a draft would change the reviewed copy.
- [ ] If authorized records staging is unavailable, add `stageContentRelease({ version: numericVersion, bundleSource: 'builtin' | 'natal-candidate' })` in `src/lib/pattern.functions.ts` and `src/lib/pattern.server.ts`. Use a strict bounded numeric-version/source-enum input and require admin authorization. Resolve only the two server-owned constants, validate the graph, compute SHA-256 of its JSON like `publishDraft`, and insert/reuse immutable inactive content using `samePublishedBundle` for equality; reject differing same-version copy and leave every active pointer untouched. Extend `tests/reading-natal-content.test.mjs` to prove non-admin denial, no provider call, immutability, inactive state and successful rollback selection; verify this path before activation.
- [ ] Prepare publication identity correctly: signed ingestion requires a new unused numeric outer version `X.Y.Z`, so `builtin-0.6.0` is not a valid published row version. The outer version need not equal the frozen payload's `bundle.version`. Record the candidate-copy SHA-256, signed-ingest HMAC checksum, effective normalized published version/hash and rollback-row identity separately; verify normalized transit copy/catalogue still match the qualified payload.
- [ ] Publish and activate only after the natal release action is requested, using the established signed editorial release or admin activation path. Never activate merely to run synthetic qualification. Verify rollback selects the prepared prior row and preserves saved reading history.
- [ ] Record operational effects accurately: birth saves can add two uncertainty-boundary Swiss calls even while lenses are inactive; activating the catalogue also enables Today re-screening for missing/stale/retryable assessments, at most once per six hours, up to three Swiss calls bounded by existing six-second deadlines. Daily prose remains one model call.
- [ ] Verify the activated content version, permitted `N1` in a known-time reading, suppressed/unknown cases without a lens, cache reuse, saved origin evidence and absence of private text in admin metrics. Record public deployment and content-pointer proof separately.
- [ ] Complete the final evidence index: original/corrected/natal reports, exact source identities, structural results, AI writing/catalogue judgments, human review deferred, costs or unknowns, publication/activation status, live checks and rollback. Mark each missing item explicitly.

```sh
node --test tests/reading-natal-reliability.test.mjs tests/reading-natal-data.test.mjs tests/reading-natal-storage.test.mjs tests/reading-natal-evidence.test.mjs tests/reading-natal-evaluation.test.mjs tests/reading-natal-content.test.mjs tests/reading-cache.test.mjs tests/reading-writing-privacy.test.mjs
```

**Acceptance:** Natal activation is supported by its own qualification, source/operational evidence and reversible content/code release path. A successful ordinary correction, Git push or hosted natal-free report cannot complete this task.

## Completion record — historical writing round

This original completion record and its later full-round natal result are preserved. Its pending/inactive/source-match entries describe those recorded rounds, before the approved lightweight review and joint activation linked above. Each historical outcome is reported separately.

| Outcome                                         | Current status                                        | Evidence                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corrected implementation and final clean checks | Done                                                  | `4c96fd5`: 395/395 tests, typecheck and build on a clean snapshot before the push; later branch commits 401/401 at `67805ea`                                                                                                                                                            |
| Hosted corrected natal-free generation          | Done                                                  | [`corrected-report.json`](../../reviews/daily-reading-writing/2026-10-11/corrected-report.json), matched on all inputs; [comparison](../../reviews/daily-reading-writing/2026-10-11/comparison.json)                                                                                    |
| Blinded AI writing qualification                | **Failed, round 1**                                   | [writing review](../../reviews/daily-reading-writing/2026-10-11/writing-review.md): 17 corrected-run items fail; a second correction round is required                                                                                                                                  |
| Human writing review                            | Deferred                                              | `humanReviewCompleted: false` in every summary                                                                                                                                                                                                                                          |
| Ordinary/synthesis public release               | Deployed, not qualified                               | `origin/main` = `4c96fd5`; public app served `4c96fd5` at 19:55Z (published by the owner, most likely); authenticated smoke not run ([release record](../releases/2026-10-11-daily-writing-qualification.md))                                                                           |
| Independent AI natal catalogue review           | `builtin-0.6.0` failed; `builtin-0.6.1` passed        | [catalogue review](../../reviews/daily-natal-lens/catalogue-review.md); human approval deferred                                                                                                                                                                                         |
| Matched actual-model natal qualification        | **Failed, blinded AI round 1; source match unproven** | [Natal writing qualification](../../reviews/daily-natal-lens/writing-qualification.md): two 28-case Enterprise reports, three timeouts; 24 complete model pairs, 7 natal-positive pairs; 3/8 candidate model and 0/8 template passes, 0 fully passing; generating revisions/cost absent |
| Live Swiss/owner-path natal verification        | Pending                                               | Not attempted                                                                                                                                                                                                                                                                           |
| Natal content activation                        | Inactive                                              | No release action requested                                                                                                                                                                                                                                                             |
