# Natal prose and template remediation — 2026-10-12

Status: **implemented remediation, not writing qualification**. The previous
[blinded round](../writing-qualification.md) remains failed: 3/8 candidate model
positives passed and 0/8 candidate templates passed. None of those reports,
responses, review judgments, or source identities has been edited or rescored.

The implementation starts from `da4be89fb521b4b06c689b13f44dc42c9d877838`.
Both candidates remain inactive. The built-in fallback is still `builtin-0.5.0`,
the natal candidate `builtin-0.6.1`, and the transit candidate `builtin-0.7.0`.
Their content and catalogue hashes are unchanged. Member readings and natal
chapters retain the Lovable gateway; Gemini Enterprise remains an admin-only
evaluation/drafting option. No actual-model, chart, episode, activation or
deployment request was made for this remediation.

## What changed

The daily prompt is now `daily-astro-body-10`; the validator remains
`daily-reference-6`, with the same `synthetic-daily-6` fixture inputs. Prompt
identity already participates in the reading cache identity. Shared guidance
preserves the direction of conditions and causal statements: a condition for
reinforcement cannot become a cause of low friction, and the natal distinction
cannot establish a need for boundaries. Natal-specific guidance requires one
supported scene to carry both the primary interpretation and the natal distinction.

The deterministic natal composer contains six authored pairings. It compares both
complete source strings against fixed literal bindings before using the composed
text. Matching a rule key alone is insufficient. A changed or unfamiliar source
pair retains current source wording conservatively and cannot reuse the old
composition. This does not establish integration quality for every catalogue pair.

| Primary interpretation             | Natal distinction                                          | Fixed cases covered               |
| ---------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| Obligation and uninterrupted space | Useful preparation versus waiting for everything to settle | Duty reflex, mixed source         |
| Obligation and uninterrupted space | Commitment versus choice in carrying it out                | Freedom reflex                    |
| Obligation and uninterrupted space | Useful support versus taking every obligation              | Service aspect                    |
| Obligation and uninterrupted space | One useful task versus completing a routine before pausing | Exact house                       |
| Role and capacity                  | Sampling projects versus choosing one                      | Own target, synthesis integration |
| Role and capacity                  | Useful preparation versus waiting for everything to settle | Moon fallback                     |

The natal application stays in paragraph one, preserving saved private evidence
linkage. A supplied synthesis keeps its distinct relationship. Standard depth
omits repeated domain, phase, timing and supporting-contact filler; technical depth
adds a compact calculation passage when the optional-detail budget permits.
Selected transit chronology stays unchanged and appears once within the first two
paragraphs. Required source conditions are not truncated to force a word count.

Saved-reading validation accepts either historical verbatim lens copy or the exact
authored opening bound to archived I1/N1, with only its validated chronology suffix.
It never substitutes current catalogue text during readback. Transit chapter
linkage now records the actual paragraph containing its complete saved copy and
rejects missing, duplicate or mismatched occurrences. This preserves older
paragraph-one templates and the revised paragraph-two chapter placement.

Headlines, reflection questions, consented context, natal selectors, suppression,
calculation facts and content activation behavior are unchanged. The broader
grounding guidance affects model prompts without a natal lens as well; their
deterministic templates are unchanged.

## Offline preview and preservation

The preview is a deterministic template comparison, not a new model evaluation or
blinded review. The capture harness blocks networking, runs the production
assembly against the existing fixed cases, and discards its handwritten model
replays. It retains template bodies and their supplied facts only.

- [Baseline templates](templates-before.json): 38 cases for each of the built-in,
  natal and transit bundles, captured from the exact base revision.
- [Revised templates](templates-after.json), [comparison](comparison.json), and
  [readable before/after examples](template-changes.md): all 114 rows retain the
  same facts, input hashes, headlines, questions, selected lens keys and story
  status. All 38 built-in templates and the 29 non-natal templates in each
  candidate are unchanged. Nine natal-bearing templates change in each candidate.
  The eight reviewed positives shrink from 129–170 to 71–83 words; the combined
  transit example shrinks from 211 to 124 words. These are length measurements,
  not writing-quality scores.
- [Capture script](capture-templates.mjs): accepts a source root and a new output
  path; refuses to overwrite an existing artifact. Run each source in a separate
  Node process to prevent module-cache mixing.

The baseline source can be reproduced with `git archive da4be89 src scripts
package.json` in an isolated directory with the pinned dependencies available.
Run `node capture-templates.mjs SOURCE_ROOT NEW_OUTPUT_JSON` from this directory.
The baseline predates `natal-template.ts`; the corrected capture includes that
module's hash. New captures should always use a new filename and retain their
source revision or complete changed-source hashes.

Before editing, the preservation check verified all 395 original files and all
five original worktree HEAD/status records against the previous recovery manifest.
It separately froze hashes for all 94 existing tracked review/release files.
Local receipts and intermediate captures are under
`/home/ubuntu/.local/state/pixel-perfect-view-757/natal-remediation/20261012/`.

## Verification

The final source passed 494/494 tests with no failures or skipped cases, using
`node --test --test-concurrency=1 --test-timeout=30000 tests/*.test.mjs` on Node
24.21.0. Typecheck (`npx tsc --noEmit`), production build (`npm run build`), lint
on all 15 changed/new code paths, and `git diff --check` passed. Logs and hashes
are retained in the local receipt directory above.

Regression coverage includes all eight positive template bodies, unknown/edited
copy and later conditions, decimal punctuation, technical depth and denied
preferences, suppression, combined synthesis/natal/transit chronology, unchanged
questions/context, saved-reading cache/export, legacy consumption, and altered
paragraph/source/linkage rejection. All calculation/provider responses in these
tests are local synthetic fixtures.

A separate unblinded implementation reviewer examined the eight positive previews,
combined preview, final source diff and regression assertions. The review found no
remaining material issue after correcting unknown-source clause loss and archived
paragraph consumption. It did not assign scores or conduct the formal blinded
qualification. Repository-wide lint, browser/device behavior, actual-model quality,
native numerical accuracy and production behavior were not reverified here.

## Remaining qualification

1. Freeze the corrected generating revision and run complete paired actual-model
   responses on that observed revision. For natal isolation, compare the unchanged
   built-in and natal candidate under the same current policy and model. Do not
   relabel archived body-8/body-9 evidence as body-10 results.
2. Repeat the established blinded AI review for raw candidates and templates.
   Applicable gated scores must each reach 4/5 for both reviewers, with no
   unresolved substantive claims or unavailable drafts. This implementation review
   supplies no new qualification scores.
3. Verify chronological-week repetition, member-provider behavior, native sources
   and account/browser behavior in their separate lanes. The additional
   [transit source discovery](../../daily-transit-story/2026-10-12-source-discovery.md)
   records why native source qualification remains open.
4. Keep natal and transit content inactive until their qualification gates pass.
   Human review remains deferred; no model-family diversity is established by the
   implementation review.
