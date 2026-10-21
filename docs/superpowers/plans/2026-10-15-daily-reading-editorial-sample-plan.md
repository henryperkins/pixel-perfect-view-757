# Daily Reading Editorial Sample Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver six complete before-and-after readings and a reviewable writing standard for Pattern's reader-centered editorial direction.

**Architecture:** Recompute a fixed, offline template baseline from saved content, then author original target readings against the same synthetic scenarios. Keep proposed interpretation expansions and policy conflicts visible in author notes; use independent reader and grounding reviews before the user's editorial decision. Reuse existing fixtures and assembly functions without changing application behavior.

**Tech Stack:** Markdown and JSON artifacts; existing Node/Vite offline module-loading pattern for baseline extraction only.

**Spec:** [Daily reading editorial sample design](../specs/2026-10-15-daily-reading-editorial-sample-design.md).

**Status:** Planning only. The user approved creating this first-step plan. All execution checkboxes below are intentionally open.

## Global Constraints

- Use exactly six cases, in the order in the spec, from `draft-fallback-2`.
- Use warm, standard presentation for all six pairs. Preserve the original fixture/config/hash and record this presentation override separately. Keep chart geometry, cycle ordering, date, timezone, and uncertainty unchanged.
- Call no provider, database, ephemeris service, or member endpoint. Use no member charts, notes, check-ins, or private records. Provider identity is `none`; the proposed readings are authored editorial drafts.
- Describe the before text as a **recomputed template baseline using saved content**. Describe the after text as an **editorial target draft**. This is not a matched comparison of two live generation systems.
- Every proposed reading has a human theme headline, a complete body, and exactly one separate reflection question of at most 220 characters.
- Keep proposed interpretation extensions and policy conflicts explicit. Preserve existing factual, privacy, uncertainty, and provider boundaries.
- This work writes only the review artifacts below. Do not edit production content, prompts, validators, UI, fixtures, caches, or historical review records; do not commit, push, publish, or activate as part of this step.
- Preserve the existing dirty checkout, including `.env` and unrelated untracked artifacts. Do not read or copy secret values.

## Review Focus

1. Generic Neptune–Mercury source: the target must identify its new editorial meaning as a proposal, never as already-supported copy — Tasks 2 and 3.
2. Self-worth: no claim that a chart establishes low confidence or deservingness; proposed meaning has a contact-specific rationale — Tasks 2 and 3.
3. Quiet case: preserve zero selected contacts while still offering an honest and useful reading — Tasks 1–3.
4. Cross-case repetition: the reader should encounter distinct situations and insights, including positive possibilities, without six variations of task management — Tasks 2 and 3.
5. Baseline identity and instruction policy: keep saved-content templates, authored targets, source proposals, and runtime compatibility separate — Tasks 1, 3, and 4.

## Output and existing interfaces

All new execution artifacts belong in
`docs/reviews/daily-reading-editorial/2026-10-15/` (called `PACK` below).

| Artifact                                        | Responsibility                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `capture-baseline.mjs`                          | Small offline extraction helper, no application integration.                                            |
| `baseline.json`                                 | Frozen bundle identity, original/effective case inputs, six exact template readings and selected facts. |
| `editorial-standard.md`                         | One-page author/reviewer standard distilled from the spec.                                              |
| `sample-pack.md`                                | Six labeled before/after pairs followed by separate source and policy notes.                            |
| `reader-packet.md` and `reader-assignment.json` | Neutrally labeled reading texts and the separately retained identity mapping.                           |
| `reader-review.md` and `source-review.md`       | Separate reader and source/policy assessments, including revisions.                                     |
| `decision.md`                                   | Current delivery status, user decisions, and dependencies for later work.                               |

Read-only source interfaces:

- `getEvaluationCaseSet("draft-fallback-2")` in `src/lib/ai/evaluation-case-sets.ts` returns cloned fixtures and their catalogue hash.
- `daysToLocalDate(exact_at, day, timeZone)` in `src/lib/local-day.ts` supplies each cycle's `days_to_exact` for the fixed historical scenario.
- `assembleReading(chart, cycles, context, bundle, null, null)` in `src/lib/reading.server.ts` supplies the deterministic baseline; these six cases require no natal samples or transit sequence scans.
- `readingFacts(chart, assembled, timeZone)` in `src/lib/ai/facts.ts` supplies the exact baseline reference set.
- Follow the Vite setup in `tests/reading-primary-composition.test.mjs`: `configFile: false`, `envFile: false`, middleware mode, HMR/websocket disabled. Do not call `runSyntheticEvaluationCase`, `generateSyntheticReadingProse`, or application server functions.

## Task 1: Freeze six comparable baseline readings

**Files:** Create `PACK/capture-baseline.mjs` and `PACK/baseline.json`. Read the existing fixture, bundle, assembler, and fact interfaces above.

**Interface:** `node docs/reviews/daily-reading-editorial/2026-10-15/capture-baseline.mjs` writes only `baseline.json`. The JSON root contains `version: "editorial-sample-baseline-1"`, `capturedAt`, `sourceCommit`, `sourceFileHashes`, `bundle`, `caseSetId`, `caseSetHash`, `provider: "none"`, `networkAttempts`, and `cases`. Each case contains `id`, `topic`, `originalFixture`, `originalFixtureHash`, `presentationOverride`, `effectiveContext`, `effectiveInputHash`, `selectedSourceKeys`, `facts`, and `reading: { headline, body, paragraphs, prompt }`.

- [ ] Record initial Git status and ensure the intended output paths do not overwrite existing work. If a prior pack exists, preserve it and choose a clearly versioned sibling directory before writing.
- [ ] Implement the helper with this exact ordered ID list: `writing-reply-scene`, `venus-opposition-venus`, `synthesis-tension`, `jupiter-trine-sun-technical`, `fallback-hard-neptune-mercury`, `quiet-threshold`.
- [ ] Read only `bundles.baseline` from the saved frozen pair. Require version `0.7.1`, schema `4`, and SHA-256(`JSON.stringify(bundle)`) `300173610977707a1852f4e5898d8e27a2e0d4b932ab3fc4db398eda7efbdad8`; abort on mismatch without substituting another bundle. Archive the full bundle inside `baseline.json` alongside its hash and source path.
- [ ] Resolve fixtures from the cloned case set, preserving their original JSON. Build cycles with fixed-date `days_to_exact`; set context to `granted: new Set(["USR-01", "USR-02"])`, `tone: "warm"`, `depth: "standard"`, and null `localBucket`, `checkIn`, and `wellness`. Record overrides separately and serialize the grant set as an array in evidence.
- [ ] Replace `globalThis.fetch` with a counter that throws before loading application modules. Load only the pure helpers through the offline Vite setup, capture assembly/facts, and close Vite in `finally`. Do not load `.env` or invoke a generation runner. Record `networkAttempts: 0`; any attempt makes the capture fail.
- [ ] Assert six unique IDs in the exact order, the expected selected source keys from the spec, nonempty headline/body/prompt, and no selected primary or interpretation for `quiet-threshold`. Verify the ambition case retains the exact supplied synthesis relationship; assert Neptune uses `hard:*:*`.
- [ ] Capture source identity: Git HEAD plus SHA-256 values for the helper, fixture modules, case-set module, assembler, facts, local-day utilities, and `src/lib/content/*.ts`. Hash content without writing copies of unrelated files.
- [ ] Run the helper once and inspect `baseline.json`. Confirm all comparison text is assembled output with no editorial cleanup, all source notes remain separate, and the labels describe historical synthetic inputs. Run `git diff --check -- docs/reviews/daily-reading-editorial/2026-10-15/`; check new untracked artifacts directly for formatting; confirm no application files changed. Existing unrelated whitespace findings do not authorize cleanup.

**Acceptance:** Six reproducible, correctly labeled template readings; zero network attempts; preserved original inputs; no claims about the current live release.

## Task 2: Author the standard and six complete target readings

**Files:** Create `PACK/editorial-standard.md` and `PACK/sample-pack.md`.

**Consumes:** The spec and Task 1's exact baseline case records. **Produces:** One complete target draft per baseline ID, with stable headings `Case 1` through `Case 6`, and separate `Existing support`, `Proposed editorial extension`, and `Policy dependencies` notes.

- [ ] Distill the spec into a one-page standard: recognition, emotional meaning, a supported astrological connection, one optional response, and one earned reflection. State length guidance, original Pattern voice, and the quiet-day exception. Link the two reference articles without reproducing their prose.
- [ ] For each case, write a short source note before drafting. Identify the human tension the existing material actually supports and any new meaning being proposed. Record why a proposed extension belongs to this contact; a planet-name substitution is insufficient.
- [ ] Draft six complete readings in the fixed order, using the same synthetic scenario and warm/standard presentation as the baseline. Target 130–200 words for non-quiet bodies and 60–110 for the quiet body; record purposeful deviations instead of padding. Use one theme headline and one separate, independently readable reflection question of at most 220 characters.
- [ ] Include the exact baseline headline/body/prompt beside each draft. Label the after text as authored and proposed. Keep all source commentary and compatibility notes outside the reader-facing prose.
- [ ] Review every substantive sentence against existing support or a clearly identified proposed extension. Remove unsupported factual/personal claims. Do not derive another person's thoughts, a personality diagnosis, or a future event from geometry; do not import a different contact's interpretation.
- [ ] Check the five Review Focus cases: explicit Neptune source gap; bounded self-worth proposal; quiet-day honesty; varied non-work settings and positive possibilities; accurate baseline and policy labels. Record the result under each affected case.
- [ ] Read the six drafts together. Give each a one-sentence description of what a reader gains. If two have substantially the same insight or optional response, revise their substance before sending to review.

**Acceptance:** Six complete drafts with a distinct reader benefit, traceable source notes, and explicit proposed-content dependencies. No draft is described as production-valid or human-approved.

## Task 3: Review reader value and source fit independently

**Files:** Create `PACK/reader-packet.md`, `PACK/reader-assignment.json`, `PACK/reader-review.md`, and `PACK/source-review.md`; revise owned standard/sample files when findings warrant it.

**Consumes:** All twelve reading texts and each after draft's source notes. **Produces:** Passage-specific findings, scores, a revision record, and a clear ready/revise decision for each target.

- [ ] Create a shuffled reader packet with all twelve texts labeled `Item 01`–`Item 12`, no before/after designation, technical source notes, prior verdicts, or implementation context. Preserve headline, body, and reflection. Save the mapping and packet hash in `reader-assignment.json`; do not give the mapping to the reader reviewer.
- [ ] Give a fresh reviewer only that packet and the one-page standard. Request 1–5 scores for recognition, meaning, useful direction, distinctness, and voice/readability, each with a short cited passage. Also ask which readings feel interchangeable, overbearing, hollow, or dominated by productivity advice. Record the limits of context separation honestly.
- [ ] Give a different fresh reviewer the baseline evidence, full pack, and standard. Request a sentence-level check of factual/source support, proposed-extension rationale, uncertainty, optional guidance, and quiet-day honesty. They see source identities and are explicitly not a blind reviewer. They must not see the reader review until their assessment is complete.
- [ ] Record policy conflicts separately from editorial defects. In particular, compare optional guidance with `daily-voice.ts`, shared `safetyPass`, and the historical review protocol. Do not change those contracts or call this an existing writing-qualification pass.
- [ ] Revise drafts with any score below 4 or an unresolved unsupported factual, personal, predictive, or causal claim. Keep the previous revision and findings in the review record. Reassess changed passages and their surrounding reading; rereview the set only if shared voice or distinctness changed.
- [ ] Decode the reader mapping after the initial review. Record baseline and target scores separately without claiming a model-performance improvement. Require every target dimension to reach 4 before the proposed pack is marked ready for user review; quiet distinctness rewards honesty and useful latitude, not an invented signal.

**Acceptance:** Both reviews are complete, substantive findings are resolved, and remaining source-authoring/policy dependencies are explicit. Label results as internal editorial assessment; human review stays pending.

## Task 4: Deliver the pack and record the user's editorial decision

**Files:** Create `PACK/decision.md`; link the finished standard, pack, baseline, and reviews.

**Interface:** The decision table has six rows with `caseId`, `draftRevision`, `userDecision`, `userFeedback`, `sourceDependencies`, and `policyDependencies`. Allowed `userDecision` values: `pending`, `revise`, `approved_as_editorial_target`.

- [ ] Confirm the delivered pack contains exactly six complete pairs, all baseline text matches `baseline.json`, every reflection is separate and at most 220 characters, and all source/compatibility notes are outside the reading. Validate JSON parsing and local Markdown links, run `git diff --check -- docs/reviews/daily-reading-editorial/2026-10-15/`, check untracked artifacts directly, and inspect Git status. Documentation/extraction work does not require a full application test or build.
- [ ] Mark `packStatus: delivered` only after the pack and reviews exist. Initialize all human decisions to `pending`; do not reuse approval of this plan or the general editorial direction as approval of unseen readings.
- [ ] Present the six pairs and ask for feedback on the actual wording: which feel worth receiving, which miss, and which tone should define Pattern. Preserve the user's decisions at the exact draft revision; revise only affected cases if requested.
- [ ] Mark `editorialTargetStatus: approved` only after explicit approval covers all six target revisions. Until then record `pending` or `revise`. Pack delivery can be complete while editorial approval remains open.
- [ ] List the concrete later work revealed by the pack: exact interpretation extensions, headline support, optional-guidance policy alignment, complete voice examples, fallback parity, and subsequent provider evaluation. The handoff does not implement or activate them.

**Completion boundary:** The authored/reviewed pack is the first delivery. The user-approved six-reading set is the completion of editorial standard selection. Neither milestone is live-model qualification, content publication, or member activation.
