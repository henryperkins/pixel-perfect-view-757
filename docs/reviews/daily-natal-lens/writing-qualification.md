# Natal writing qualification — fresh round 2 fails

**Current stopping point (2026-10-12):** round-3 remediation is committed as
`948aa00`; its actual-model run was stopped at the operator's request after
37/38 cases per bundle. It preserved 69 raw drafts from 72 transports, three
timeouts and two unattempted final-pair cases, with no retries or unsettled
request. No round-3 blinded review or scores were produced. That partial run
cannot establish qualification. See the
[round-3 evidence](2026-10-12-qualification-round-3/README.md) and
[handoff prompt](2026-10-12-qualification-round-3/HANDOFF.md). Both candidates remain
inactive. The completed round-2 judgment below remains the latest writing result.

The 2026-10-12 actual-model and blinded AI round **fails writing qualification**.
For the nine natal-positive cases, **6/9 candidate model outputs pass, 9/9
candidate templates pass, and 6/9 cases fully pass**. Freedom has an unresolved
causal bridge, exact-house transfers a window-position claim to the future exact
date, and Moon fallback has no captured model response. Both candidates remain
inactive.

The [frozen round-2 summary](2026-10-12-qualification-round-2/qualification-summary.json)
(SHA-256 `7de4af6d2c59b62bb3d7c7d8a09f7a55e294cfb4642e53db2eb0c854f4b6bef1`) and
[evidence index](2026-10-12-qualification-round-2/README.md) retain the full results.
The [prior qualification document](2026-10-12-qualification-round-2/previous-qualification-document.md)
and all original [round-1 evidence](2026-10-11-blinded-review/README.md) are
preserved. The earlier body-8 round remains failed at 3/8 models and 0/8 templates;
its unproven generating revisions are not backfilled from this fresh run.

## Fresh paired run and source identity

Both runs executed the existing server-side
`runSyntheticEvaluationCase` function locally from **observed revision
`8b73148241adbe38d9e1f2e58e34e241314a92dd`**, with Gemini Enterprise only,
`gemini-enterprise/gemini-3.8-flash`, and a 60,000 ms deadline. The
[171-file source manifest](2026-10-12-qualification-round-2/source-manifest.json),
[identity sidecars](2026-10-12-qualification-round-2/builtin-identity.json),
[candidate identity](2026-10-12-qualification-round-2/natal-candidate-identity.json),
[strict comparison](2026-10-12-qualification-round-2/pair-integrity.json), and
[independent provenance audit](2026-10-12-qualification-round-2/integrity-audit.json)
bind the actual reports to that one generating revision. Source-file hashes were
checked before/after each case and before each transport.

This is a **local production-module synthetic run**. It does not verify the hosted
Workflow, signed callback or admin UI authentication. Member readings and natal
chapters retain the Lovable gateway; its acceptance and latency remain separate
qualification gaps. No serving-provider implementation, content pointer, account,
reading cache, native chart service or deployment was changed by this round.

| Field                          | Baseline                                                           | Candidate                                                          |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Bundle selector/version        | `builtin` / `builtin-0.5.0`                                        | `natal-candidate` / `builtin-0.6.1`, inactive                      |
| Source report SHA-256          | `fc584c35e13afb7fb1313b5c05cca696f75db8236bb3c45598ec7776308357b6` | `b51680f991ddf191ff8ed978e0f40891fa9bfe4d3db6cb354eb5f52f398658d9` |
| Inventory / model attempts     | 38 / 37                                                            | 38 / 37                                                            |
| Accepted / unavailable / quiet | 34 / 3 / 1                                                         | 31 / 6 / 1                                                         |
| Rejected returned drafts       | 0                                                                  | 0                                                                  |
| Generating revision            | `8b73148`, observed locally                                        | `8b73148`, observed locally                                        |

Shared policies are **`synthetic-daily-6`, `daily-astro-body-10`,
`daily-reference-6`, `daily-synthesis-1`, `daily-natal-lens-2`, and
`natal-reliability-1`**. All 38 configurations, non-natal facts and reliability
manifests match. Only the nine requests supplied with `N1` differ. The built-in,
natal and transit candidate bundles retain their previous hashes.

The run completed **74 transports with zero retries**. Both reports have
`partial: false` because every fixed case settled; nine attempts timed out with no
model prose. Complete model-pair coverage is **28/37 overall, 7/9 natal-positive,
and 1/4 natal-negative**. A timeout remains an uncovered failure, never a prose
score or a passing fallback.

| Run       | Unavailable model cases                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline  | `natal-service-aspect`, `natal-legacy-snapshot`, `arc-return-five`                                                                                |
| Candidate | `saturn-square-sun`, `jupiter-trine-sun-technical`, `natal-moon-fallback`, `natal-unknown-time`, `natal-degraded-positions`, `arc-truncated-scan` |

[Transport observations](2026-10-12-qualification-round-2/transport-observations.json)
record the provider's `gemini-3.8-flash` response identity and token counters for
65 successful calls. Their reported total is **452,862 tokens**, including
311,262 thought tokens. Usage for the nine timed-out requests and monetary cost
remain unknown; absent counter fields are not proof of zero usage. Original
report `manualReview` fields remain null.

## Blinded AI protocol and coverage

Two fresh contexts, `/root/natal_round2_reviewer_a` and
`/root/natal_round2_reviewer_b`, each reviewed **99 unique prose/support contexts:
98 scored and one quiet safety check**, representing 217 occurrences: 65 captured
model outputs, 76 displayed bodies and 76 templates. Deduplication required
identical text and full visible fact/tone/depth/quiet context;
[suppression checks](2026-10-12-qualification-round-2/packet-context-integrity.json)
confirm identical suppression flags within every deduplicated context. All
paragraph citation arrays were masked uniformly. Structural acceptance was
reported separately.

Each reviewer received only an independently shuffled isolated packet with embedded
instructions, four contrast sets and eight cross-scenario repetition sets. Repeated
item IDs retained their occurrence counts. Both reviews were frozen before
[unblinding](2026-10-12-qualification-round-2/unblinding-receipt.json). Hash bindings,
complete item/set coverage, applicability, score bounds, verdict consistency and
exact quoted passages passed the saved checker. See
[review A](2026-10-12-qualification-round-2/review-a.json) and
[review B](2026-10-12-qualification-round-2/review-b.json).

The [established AI gate](../daily-reading-writing/review-protocol.md) requires
both reviewers to give every eligible raw candidate and template specificity,
grounding and coherence **at least 4/5**, plus lens integration when `N1` is supplied
and synthesis coherence when `S1` is supplied. Zero unresolved substantive findings
are allowed. Voice and repetition are recorded but do not gate alone. Both
reviewers must also identify a supported candidate duty/freedom distinction.
Scores are never averaged and safe templates cannot rescue raw failures.

The coordinator had prior unblinded context; reviewer model/configuration identities
were not exposed. Reviewers declared only their assigned packet as input, but tool
access was not technically sandboxed and style or `N1` presence can suggest an
origin. These are separate AI assessments using inherited contexts, with no
established model diversity or human approval. `humanReviewCompleted` remains
`false`.

## Natal-positive scores

Tuples are **specificity / grounding / voice / repetition / coherence / lens
integration / synthesis coherence**. `—` means inapplicable. Unavailable drafts
have no scores. The historical eight natal-positive cases are retained, plus the
current fixture's combined `arc-synthesis-natal-integration` case. That ninth case
supplies `N1`/`S1`; the natal bundle has no transit chapter catalogue, so it does not
qualify `P2`, native episode chronology or transit chapter integration.

### Raw candidate models

| Candidate case                    | A             | B             | Gate               |
| --------------------------------- | ------------- | ------------- | ------------------ |
| `natal-duty-reflex`               | 5/5/4/4/5/5/— | 5/5/4/3/4/5/— | Pass               |
| `natal-freedom-reflex`            | 5/5/4/4/5/5/— | 5/3/4/4/4/3/— | Fail               |
| `natal-service-aspect`            | 5/5/4/4/5/5/— | 5/5/4/3/4/4/— | Pass               |
| `natal-exact-house`               | 5/3/4/4/5/5/— | 5/3/4/3/4/4/— | Fail               |
| `natal-own-target`                | 5/5/4/3/5/5/— | 5/5/4/3/4/4/— | Pass               |
| `natal-moon-fallback`             | unavailable   | unavailable   | Uncovered: timeout |
| `natal-mixed-source`              | 5/5/4/4/5/5/— | 5/5/4/4/5/5/— | Pass               |
| `natal-synthesis-integration`     | 5/5/3/4/4/4/5 | 5/5/4/3/4/4/4 | Pass               |
| `arc-synthesis-natal-integration` | 5/5/4/4/5/5/5 | 5/5/4/3/4/4/4 | Pass               |

### Candidate templates

| Candidate case                    | A             | B             | Gate |
| --------------------------------- | ------------- | ------------- | ---- |
| `natal-duty-reflex`               | 5/5/4/3/5/5/— | 5/5/4/3/5/5/— | Pass |
| `natal-freedom-reflex`            | 5/5/4/4/5/5/— | 5/5/4/4/5/5/— | Pass |
| `natal-service-aspect`            | 5/5/4/4/5/5/— | 5/5/4/4/5/5/— | Pass |
| `natal-exact-house`               | 5/5/4/4/5/5/— | 5/5/4/4/5/5/— | Pass |
| `natal-own-target`                | 5/5/4/3/5/5/— | 5/5/4/3/5/5/— | Pass |
| `natal-moon-fallback`             | 5/5/4/4/5/5/— | 5/5/4/4/5/5/— | Pass |
| `natal-mixed-source`              | 5/5/4/3/5/5/— | 5/5/4/3/5/5/— | Pass |
| `natal-synthesis-integration`     | 5/5/4/3/5/5/4 | 5/5/4/3/5/5/4 | Pass |
| `arc-synthesis-natal-integration` | 5/5/4/3/5/5/4 | 5/5/4/3/5/5/4 | Pass |

All nine positive templates meet the fixed-suite AI gate. Both reviewers find a
supported practical duty/freedom contrast in models and templates. The freedom
model's contrast still contains B's unresolved causal claim and below-threshold
grounding/integration scores. Exact-house meaningfully applies its lens but fails
both reviewers' grounding checks on timing. Those failures remain separate from
lens use.

## Whole-suite failures and suppression controls

Across 37 non-quiet candidate cases, **26/37 raw models pass, 36/37 templates pass,
and 25/37 cases fully pass**. Six models are unavailable. Five captured candidate
model items have seven unresolved substantive findings; one additional template
fails coherence. The quiet template passes both safety checks with all scores null.

The four natal-negative templates pass and contain no `N1`. Available candidate
models for sign-boundary and legacy snapshot pass; unknown-time and degraded-position
models timed out. Therefore raw negative coverage is 2/4, paired negative coverage
1/4, and suppression qualification is incomplete. Available source-masked negative
prose does not supply a natal origin or require invented integration.

| Candidate model case / reviewer                             | Exact passage                                                                                                      | Unresolved issue                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unknown-birth-time` / A; `item-047`, paragraph 1           | “In the sky, Saturn forms a square to the Sun with an orb of 0.42 degrees.”                                        | C1 is a transit-to-natal contact. In the sky describes a current Saturn-to-current-Sun square and omits the natal target, which the supplied geometry does not establish.                                                             |
| `approximate-birth-time` / A; `item-081`, paragraph 2       | “The calculated exact date is 2026-10-14, which falls in the middle part of the window, exact in 3 days.”          | T1 places this reading in the middle part of the calculated window. The relative clause instead places the future calculated exact date there; no supplied fact establishes that date's position within the window.                   |
| `natal-exact-house` / A; `item-082`, paragraph 2            | “Calculated exact alignment occurs on 2026-10-14, which is in 3 days in the middle part of the calculated window.” | T1 places this reading in the middle part of the calculated window. The relative clause instead places the future calculated exact date there; no supplied fact establishes that date's position within the window.                   |
| `natal-exact-house` / B; `item-082`, paragraph 2            | “Calculated exact alignment occurs on 2026-10-14, which is in 3 days in the middle part of the calculated window.” | The sentence appears to locate the future exact alignment in the middle of the window. T1 locates this reading there. The referent is unresolved and the supplied facts do not support transferring that position to exact alignment. |
| `approximate-birth-time` / B; `item-081`, paragraph 2       | “The calculated exact date is 2026-10-14, which falls in the middle part of the window, exact in 3 days.”          | The relative clause assigns the middle-window position to the exact date. T1 assigns it to this reading, while C1 supplies only the exact date, orb and phase.                                                                        |
| `natal-freedom-reflex` / B; `item-027`, paragraph 2         | “When mentally tracking what comes next makes an obligation feel narrow”                                           | I1 supplies mentally tracking a task in a quiet moment, and N1 allows an obligation to feel narrow. Neither supplies mentally tracking as the cause of that narrowness; the conditional bridge adds that mechanism.                   |
| `mercury-conjunction-clinical` / B; `item-022`, paragraph 2 | “Pace, scope, and which part of the task is yours are separate pieces of working on something.”                    | D1 says the part of a task that feels like yours. This turns felt ownership into which part actually is yours, an objective allocation the supplied framing does not establish.                                                       |

The candidate `saturn-square-moon-warm` template also fails A's **coherence 3**:
its second paragraph repeats the full-calendar/obligation-in-a-quiet-moment scene
already developed in paragraph 1. Warmth is largely a “Taking this gently:” prefix;
voice/repetition weaknesses are recorded separately. The raw warm model passes.
This is an existing natal-free template issue, not a failing natal-positive template.

The summary retains **56 item disagreements** and **10 substantive reviewer
findings in total**: seven candidate findings across five items, and three baseline
findings across three separate model items. Baseline-only findings are comparison
evidence, not candidate failures. No adjudication or reassessment was performed.
Approximate-birth-time and exact-house timing findings are shared by both reviewers;
a single adjudicator cannot overturn them. A disagreement or a higher score from
the other reviewer does not resolve any original finding.

## Repetition and remaining qualification

| Reuse set            | Baseline model A/B | Baseline template A/B | Candidate model A/B | Candidate template A/B |
| -------------------- | ------------------ | --------------------- | ------------------- | ---------------------- |
| Moon/fallback        | 2/2                | 1/1                   | 4/3                 | 4/3                    |
| Own-target/synthesis | 4/4                | 3/3                   | 3/3                 | 3/3                    |

The candidate Moon set shows supported distinctions for preparation, accepting
support, and one task versus completing the routine; repeated duty/mixed-source
reply text remains. Own-target/synthesis share a primary project-choice paragraph,
with the supported synthesis adding a different second thought. These are
cross-scenario reuse assessments, not an observed chronological week. Identical
source meanings do not permit invented variation.

1. Remediate the freedom model's added cause, preserve the distinction between this
   reading's window position and a future exact date, preserve transit-to-natal
   geometry, and retain subjective “feels like yours” wording. Update the shared
   brief/guards with a new version if changed; never edit frozen model outputs.
2. Remediate the warm natal-free fallback's repeated scene and prefatory tone marker.
   Retain the nine passing natal templates while testing broader catalogue/source
   combinations; six authored pairings do not qualify all 62 catalogue entries in
   every primary context.
3. Qualify complete availability under the chosen provider/deadline and start a new
   frozen-source paired round. Preserve this round's nine timeouts and unknown failed
   usage. No automatic retries or backfilled drafts are part of this evidence.
4. Repeat fresh blinded review for all eligible raw outputs/templates and controls.
   Every applicable score and substantive finding must clear its gate; the current
   synthetic pipeline and writing qualification remain failed.
5. Complete member-serving Lovable, hosted Workflow/admin, live Swiss/owner-source,
   chronological-week/account/browser, cost and human-review lanes separately.
   Transit source/proof gaps remain in the
   [source discovery](../daily-transit-story/2026-10-12-source-discovery.md).
6. Keep both candidates inactive. Publication, activation, production verification
   and rollback remain separate requested gates.
