# Natal writing qualification — pending

The local `synthetic-daily-5` suite has 28 frozen cases and at most 27 attempts.
Handwritten replay responses exercise production selection, prompting, validation
and report plumbing. They are not actual model candidates and receive no writing
scores. The catalogue's individual agent editorial review is separate from
independent approval.

## Paired run contract

Run the same version-5 fixtures twice on one deployed source revision, choosing the
copy with the admin evaluation selector: **Natal-free built-in baseline**
(`builtin`, `builtin-0.5.0`) and **Inactive natal candidate** (`natal-candidate`,
currently `builtin-0.6.1`). Choosing a copy never publishes or activates it. The
strict `--compare-natal` check requires identical source revision, prompt policy,
case input hashes, normalized transit copy (`transitCopyHash`) and model; the
bundles may differ only by release identity and catalogue. Keep each run's source
identity and the exact request/response, attempt count, duration, partial failure
and cost evidence.

Current paired-run artifacts (2026-10-11): a complete `builtin` run on source
`4c96fd5` and a **partial** `natal-candidate` (`builtin-0.6.0`) run that stopped on
its first case when the language gateway reported no available credit; nothing was
retried. `builtin-0.6.0` has since failed the AI catalogue review, so the pair must
be rerun, both runs on the revision that serves `builtin-0.6.1`. Blind writing
reviewers: **not yet run**. Scores below remain pending; an accepted citation graph
is not a quality judgment.

| Positive case               | Candidate specificity / grounding / integration | Template specificity / grounding / integration | Unsupported personal claim |
| --------------------------- | ----------------------------------------------- | ---------------------------------------------- | -------------------------- |
| natal-duty-reflex           | pending                                         | pending                                        | pending                    |
| natal-freedom-reflex        | pending                                         | pending                                        | pending                    |
| natal-service-aspect        | pending                                         | pending                                        | pending                    |
| natal-exact-house           | pending                                         | pending                                        | pending                    |
| natal-own-target            | pending                                         | pending                                        | pending                    |
| natal-moon-fallback         | pending                                         | pending                                        | pending                    |
| natal-mixed-source          | pending                                         | pending                                        | pending                    |
| natal-synthesis-integration | pending                                         | pending                                        | pending                    |

Each positive candidate and template needs ≥4/5 for specificity, grounding and
lens integration, with **zero** unsupported personal claims. Record voice and
repetition with the same existing rubric. Reviewers must identify the duty/freedom
pair's supported practical difference (preparation versus everything settled;
commitment versus choice in the route), rather than an adjective swap.

The lens follows the transited body, so one reader receives the same lens text on
every day whose primary contact touches that body, and the Moon text only when that
body's sign is unscreened. Read the own-target, fallback and Moon-contact cases
together and record whether the lens would read as repetitive across a week of
contacts to one body; the per-case scores alone cannot show that.

The four negative cases—sign boundary, unknown time, degraded positions and legacy
snapshot—must contain no natal claim. Independent/unmatched synthesis cases must
still contain no invented joint premise. Review concrete paragraphs against the
supplied copy; a reference ID alone cannot establish meaningful use or grounding.
Incomplete model runs, unblinded comparisons or offline replay do not satisfy this
gate. Publication/deployment require their own requested checks.
