# Daily reading editorial sample — decision record

packStatus: delivered
editorialTargetStatus: pending
humanReviewCompleted: true
humanReviewedRevisionSet: human-reviewed-1
currentDraftsHumanReviewed: false
voiceDirectionStatus: selected_case_5_observational_voice

The user has reviewed the first delivered set and selected case 5's tone. Cases 5, 1, and 4 were worth receiving with line edits; cases 3 and 2 needed more work; case 6 missed. Those verdicts and scores are recorded in [human-review-1.md](human-review-1.md), bound to the exact [archived readings](human-reviewed-1/README.md). This is one reader's judgment, not member-outcome evidence.

The current drafts respond to that feedback. They are new revisions, not retroactively approved texts. Human review of the archived set is complete; approval of the exact current set remains open. The earlier AI reviews remain historical and do not override the user's assessment.

## Read and review

- [Six current before-and-after pairs](sample-pack.md)
- [Revised voice standard with teaching examples](editorial-standard.md)
- [Human review of the previous delivered set](human-review-1.md)
- [Reader review status](reader-review.md) and [source review status](source-review.md)
- [Separated source proposals](source-proposals.json) and [source coverage](author-notes.md)
- [Quiet-day variation proposal](quiet-variation-plan.md)
- [Exact frozen baseline](baseline.json), [offline artifact checks](validation.json), and [execution ledger](progress.md)

The before readings remain recomputed templates using the exact saved content. The after readings are assistant-authored editorial drafts. All scenarios remain synthetic, dated 2026-10-11 UTC, using warm/standard presentation. This is not a live model comparison. No member records, application/provider endpoint calls, or production changes were used.

## Decisions on the exact current drafts

| caseId | draftRevision | userDecision | userFeedback | sourceDependencies | policyDependencies |
| --- | --- | --- | --- | --- | --- |
| `writing-reply-scene` | 3 | pending | Reviewed v2: worth receiving with line edits. Retained the concrete editing gesture and kindness distinction; removed scaffolding and unnecessary sending caveat. Current text unseen. | Review new Mercury messenger imagery, frame, and deeper reflection against the existing conjunction source. | Meaning/control separation, optional sentence response, supported headline and reflection. |
| `venus-opposition-venus` | 4 | pending | Reviewed v2: a paragraph away. Replaced the tiring/enjoyable judgment with an observable reply, removed reassurance, and made the alternative genuinely different. Current text unseen. | Review the invitation-with-two-versions image, visible scene, shared-plan question, and receiving-side reflection. | Optional question, image/meaning support, headline and reflection. |
| `synthesis-tension` | 5 | pending | Reviewed v3: a paragraph away. Replaced the lookup-table paragraph with stride-and-pack imagery and shifted the ending toward noticing a motive. Current text unseen. | Review imagery and direction against the exact synthesis, preserving both parents and the source's qualified meaning. | Optional observation, supported synthesis headline and reflection. |
| `jupiter-trine-sun-technical` | 4 | pending | Reviewed v2: worth receiving with line edits. Kept lighting up and saying just a hobby; removed repeated music and rewrote the closing sentence. Current text unseen. | Review wider-frame imagery and the bounded interest/self-description proposal. | Supported meaning and optional response; warm/standard remains distinct from the original technical fixture. |
| `fallback-hard-neptune-mercury` | 4 | pending | Reviewed v3: strongest voice, worth receiving with line edits. Kept opening/headline, used the proposed symbolism, cut repetition, and deepened reflection. Current text unseen. | New proposed square:neptune:mercury is still required; selected hard:*:* cannot supply this meaning. | Imagery without causal claims, permission without consolation, supported headline and reflection. |
| `quiet-threshold` | 4 | pending | Reviewed v2: misses. Rebuilt around a visual observation; removed system explanation, announced emotional openness, and consolation. Current text unseen. | Review the new ordinary observation and broader quiet repertoire; retain no selected source. | Quiet voice and guidance policy; any later variation is editorial, not a newly found chart signal. |

Allowed decisions are `pending`, `revise`, and `approved_as_editorial_target`. The recorded human decisions on the previous revisions are all `revise`; the current rows remain pending until reviewed. Approving the selected tone does not approve new imagery, an unseen revision, source publication, or activation.

## Editorial choices retained for judgment

- Kept the user's proposed Neptune/Mercury sentence as an explicit candidate. The source reviewer finds the proposed symbolism coherent. The AI reader still finds “Neptune blurs; Mercury names” and “a fair picture” explanatory. That disagreement remains visible for the next human read; a source pass is not a voice verdict.
- Kept the ambition reflection because the human review singled it out as the one that goes deeper. The AI reader would change its angle. This preference was not allowed to overwrite the user's selection.
- Removed redundant explanations in relationships, ambition, and self-description. Kept complete shorter readings: the contact bodies now run 97–126 words, all below the original usual 130–200 range. Each exception is recorded. The next writing specification should derive length guidance from the selected examples, not add padding to meet the earlier range.
- Structure is more varied, but the set still frequently lands on permission and uses “can.” Future multi-day evaluation must check cadence and endings as well as repeated words. One stronger quiet reading and a repertoire outline do not establish sustained variety.

## Next implementation work, after editorial selection

1. **Review and author the separated source content.** `source-proposals.json` distinguishes writing material, constraints, and evidence. It is a proposed document structure, not the runtime schema. All new symbolism and the Neptune-specific interpretation need exact source identities and review. Preserve contact/synthesis dependencies and factual conditions.
2. **Make the separation real in the writer.** Treat meaning and imagery as writing material, and limits as controls to obey rather than prose to paraphrase. Align optional-direction and voice policy across source rules, model instructions, validators, deterministic copy, and reviewer criteria. Shared protections for other reading types remain in scope when changing common guards.
3. **Support headlines, reflections, and varied composition.** A prompt alone cannot replace the current contact-label headline. Use source-bound theme headlines and independently validated reflections. Teach the voice through the user's contrast pairs, and evaluate repeated structure and endings across days, not just individual outputs.
4. **Bring fallback and quiet readings to the same standard.** Quiet writing can use observations, waiting, asking, or letting something stand as well as enjoyment. A reviewed repertoire must provide genuinely different insights without inventing date-specific astrology. Determine cache and content/prompt/validator versions deliberately.
5. **Evaluate actual generated outputs separately.** Bind results to the exact candidate sources, selected provider, and model identity. Preserve no retries or cross-provider failover. Other tones/depths, multi-day repetition, publication, and member activation remain separate later work.

No application source, content release, prompts, validators, fixtures, UI, or cache was changed. No commit, push, publication, or activation was performed.
