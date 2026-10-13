# Draft effectiveness and utilization — completed pilot

The revised draft is wired into saved-source evaluation and its four tested additions materially affect generated prose. It is still an inactive draft: production member readings continue to use 0.7.1. This pilot establishes synthetic use of four entries, not adoption by members or qualification of all changed content.

## Evidence

| Question | Verified result |
| --- | --- |
| Was the original evaluation testing this draft? | No. Its active-0.7.1 results used different copy. The original 50 cases selected zero changed entries. |
| Can every new fallback be reached? | Yes, offline: 20 targeted fixtures plus the preserved 50 cover all 20 additions. Both edited global catch-alls are shadowed in the supported catalogue. |
| Did the saved revised copy reach the provider? | Yes: all four pilot additions were selected as I1 and present in actual requests. |
| Did it affect the displayed text? | Yes: all four outputs preserve the selected meaning. Two retain every source sentence literally; two paraphrase/reorder it. See the quoted semantic trace. |
| Did validator acceptance improve? | No measurable change: baseline 4/4, candidate 4/4. Automatic acceptance is not editorial quality. |
| What did the live run consume? | Exactly eight generation attempts, zero retries, eight intact captures, zero uncertain captures. Conservative usage accounting: $0.879908 against the $5 cap; invoiced charges were not available. |
| Did it run without the admin page? | Yes. The baseline advanced after the browser left /content and was recovered on return. |
| Is it used in member readings? | The revised draft is not active, so this work does not establish member use. Active content remains 0.7.1. |
| Did exact-source offline replay pass? | No. One unrelated legacy fixture speed differs by about 3e-17 between Node and workerd, changing the full catalogue hash. Local workerd reproduces the live hash. Strict checks stopped before replay; captures and policy were preserved. |

The four live keys are `hard:mars:*`, `hard:uranus:*`, `soft:saturn:*`, and `soft:neptune:*`. The other 16 reachable additions have offline coverage only. All 22 revised source entries have a separate unblinded editorial review; that is not human approval.

## Blinded editorial result

Two fresh reviewers assessed all 16 distinct model/template items; a third fresh adjudicator upheld all three disputed substantive findings (one candidate geometry statement and two baseline frequency statements). The JSON checks accepted the review records. Both body and reflection qualification results are **failed**; no human approval is claimed.

| Dimension | Paired result |
| --- | --- |
| Specificity | Both reviewers raised Mars and Uranus from 4 to 5. Neptune rose from 4/3 to 5/5. Saturn remained 4/4. |
| Saturn quality | Both reviewers reduced coherence from 4 to 3; voice fell from 4/4 to 2/3. One geometry wording concern was upheld. |
| Repetition | Every candidate model and template item remained below the frozen 4/5 threshold. The inherited phase sentence repeats across the packet. |
| Source reflection questions | Both reviewers: baseline 0/4 pass; candidate 4/4 pass. |
| Final assembled prompts | Both reviewers: baseline 0/4 pass; candidate 2/4 pass. Appended identity/rest questions cause the remaining failures. Every final prompt contains two questions. |

The practical improvement is more specific source meaning and safer source questions. The release blocker is downstream composition, including inherited text and template behavior. More automatic acceptance or extra samples would not by itself repair that.

## Remaining release checklist and concrete solutions

- [ ] **Editor: resolve downstream writing findings.** Use the blinded review and quoted source/output trace to distinguish new-copy issues from inherited framing. Preserve this round and its hash. Omit optional shared phase prose when it adds no case-specific distinction; remove mechanical template tone labels, and make technical templates name the contact their numbers describe. Repeated explanation such as “This perspective offers a way to read…” should be handled through a separately versioned serving-prompt refinement that keeps citations as metadata and avoids restating the planet contact in each paragraph. For the Saturn ambiguity, an explicit supported rendering is “Saturn’s sextile to natal Mercury is approaching exactness; its current aspect orb is 0.42 degrees.” Keep any frequency claim attached to the subject supplied by its source. Test with captured responses and fixed fixtures; do not make repair calls under the exhausted eight-attempt authorization.
- [ ] **Editor and engineer: review final reflection composition.** The new source questions allow an explicit “none” answer, but schema 4 appends inherited domain questions such as “Which description of yourself is out of date?” A separately reviewed assembly change should choose the primary interpretation question, use a safe domain fallback only when absent, version the reflection/cache identity, and cover all tone/depth combinations offline. Changing only the source question cannot remove the appended premise.
- [ ] **Engineer: make replay identities portable.** Preserve historical fixture hashes and plans. For a new fixture version, freeze analytic scan values as checked-in canonical data (or specify validated numeric normalization before hashing) and test Node/workerd parity. Do not silently reinterpret existing hashes. The current pilot remains a failed strict Node replay until it can be executed under its matching runtime.
- [ ] **Operator: choose any further paid scope explicitly.** No wider run is scheduled. The other 16 additions remain offline-only. Any additional generation or repaired round requires a new attempt limit and spending cap; never reuse this campaign or replace unfavorable outputs.
- [ ] **Human editor: approve exact qualified bytes and observed outputs.** Current baseline/candidate identities are in the manifest and complete frozen pair. Neither implementation approval nor AI review is the existing exact-content approval action. Keep the draft inactive while findings, coverage and applicable wider release gates remain open.
- [ ] **Release engineer, only after those gates: stage and activate through the existing guarded lifecycle.** Re-read the active pointer; if it changed, review the intervening delta. Stage under an unused numeric version, record the declared version/hash transformation, then activate against the expected pointer and verify the delivery receipt and immutable artifact.
- [ ] **Release engineer and consenting owner: prove member use and rollback.** Check a real calculated chart that selects a new wildcard and a specific-entry control, with new-reading provenance and rendered questions. Verify old saved readings retain their prior content. If no real contact reaches a new key, leave that item open. Retain 0.7.1 as the observed rollback target, rechecking it before activation; rollback on pointer/artifact, wrong-source or provenance defects through the same guarded action.

These are explicit release gates, not unfinished authorized paid work. The requested eight-call pilot is complete, and no further generation is authorized by its remaining dollar allowance.

## Evidence index

- [Full actionable implementation checklist](../../../superpowers/plans/2026-10-13-content-draft-effectiveness-checklist.md)
- [Manifest and identities](manifest.json)
- [Pilot result and usage](pilot/result.json), [raw envelope](pilot/raw-envelope.json), [paired comparison](pilot/comparison.json)
- [Quoted source-to-output trace](pilot/semantic-trace.json)
- [Runtime replay diagnostic](pilot/replay-runtime-diagnostic.json)
- [Frozen pre-generation rubric](review-rubric.json), [source review](source-editorial-review.md)
- [Blinded body qualification](review/body-qualification.json), [reflection qualification](review/reflection-qualification.json), [dispute adjudication](review/adjudication.json)
- [Publication decision](publication-decision.md), [execution ledger](progress.md)
