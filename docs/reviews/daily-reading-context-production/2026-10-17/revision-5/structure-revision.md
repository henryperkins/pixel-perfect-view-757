# Revision 5: one wording per source claim

> **Offline follow-up to `716fe80`:** See the [source wording follow-up](source-fix-1/report.md) for current material and review evidence. The account below records the original revision-5 handoff before that follow-up.

**The context writer now receives exactly one drafted wording for each necessary source claim, chosen for its source graph, and no second expression of the same meaning anywhere in the request.** Source proof stays in the local material file. This is an offline revision: no provider request, push, deployment or activation was made, and `writer_rollout` stays off.

## What the provider actually received

The fourth pilot's request was traced through the production path: Workflow step → `evaluateFixedCase` → `runSyntheticEvaluationCase("daily-context-1")` → member adapter `prepareMemberContextReading` → `generateDailyProse` → `toDailyContextBrief` → `callGateway` → Gemini Enterprise `generateContent`. The member Today route (`generateReadingProse` → `memberReadingSelection`) sends identical messages; only `maxOutputTokens` differs, because the pilot sets a bounded qualification. An offline capture with fetch intercepted reproduced all four saved pilot requests byte-for-byte ([before](request-trace/before-requests.json)).

Counting every separately draftable or instructive string in those requests showed each premise worded many times over. In the natal-and-transit request:

| Premise | Separate wordings | Where |
| --- | ---: | --- |
| I1: a full afternoon leaves no hours for the check | 8 | two system sentences, a user instruction, `practicalDistinction`, `optionalDirections`, the role label `effort-and-what-fits`, `sourceMeanings`, `sourceConditions` |
| I1: a clearer limit on what the task includes | 9 | system, user instruction, I1 direction, P2 scene and direction, an editing principle, two `sourceMeanings`, a condition |
| P2: if an earlier way no longer fits, a smaller adjustment | 8 | user instruction, P2 scene, distinction and direction, role label, an editing principle, `sourceMeanings`, a condition |
| N1: exploring and choosing are different stages | 6 | system, user instruction, distinction, role label, `sourceMeanings`, a condition |

The contact-only request also carried natal and chapter wording through general instructions, although neither source was selected. Every generated body then stitched these pieces together. The contact-only body, for example, reproduced the scene, the summary's two sentences, the distinction and the direction in order, and stated the full-afternoon condition twice. Moving prose into `controls` did not stop it acting as drafting copy: the model treated each string as something it had to preserve. The analysis is in [premise-analysis.json](request-trace/premise-analysis.json).

## The new brief

`daily-context-material-5` has two parts.

- **Local proof, never sent.** For each source: the exact published fact, its claims (`I1.effort`, `I1.capacity`, `I1.boundary`, `N1.curiosity`, `N1.stages`, `P2.adjustment`, `I2.reinforce`, `I2.ease`, `S1.structure`, `S1.notice`), each claim's meaning and qualifier, and the reviewed limitations. Two reviewed benchmark applications are recorded as optional claims: `I1.calendar` and `N1.hold`.
- **One composition per supported source graph.** An ordered list of drafted claims: `write` (the single wording), `cite`, `keep` (the possibility word that must stay on that claim), `continues` (the earlier claim whose condition or setup it relies on) and `byParagraph`. The local `carries` field records which source claims each wording carries. One wording may carry two claims. For example, N1's curiosity and stages claims share one sentence, because separate wordings read as one point made twice.

`toDailyContextBrief` fails closed unless every selected source matches its reviewed fact exactly, the graph has exactly one composition, every required source claim is carried exactly once, nothing unselected is carried, each wording cites the full parent closure of what it carries, and each `keep` word is in its wording. An unsupported graph therefore keeps the established member writer. The Today preview, which runs before transit context completes the graph, uses only the source-identity half, `assertReviewedContextSources`, so it keeps its revision-4 meaning. The request sends only the projected claims, structural references and seven control flags. There are no summaries, scene lists, distinctions, directions, condition lists, role maps or editing principles.

The instructions now carry no reading content. Each rule is stated once: tone, depth, format and citations, astrology naming, and what to leave out. The system message states the composition rule. Use every claim exactly once, join or reorder freely, and never restate a claim, explain it after making it, or close with a summary. A condition is stated once, and a claim marked `continues` stays inside it. In the final requests every premise appears in exactly one string, its claim's `write`, and unselected premises are absent ([after](request-trace/after-requests.json)).

| Case | User message before → after (characters) | System before → after | Most wordings of one premise, before → after |
| --- | ---: | ---: | ---: |
| contact-only | 7,470 → 2,417 | 2,112 → 1,049 | 8 → 1 |
| natal-only | 8,823 → 2,739 | 2,498 → 1,172 | 8 → 1 |
| transit-only | 8,885 → 2,813 | 2,112 → 1,049 | 9 → 1 |
| natal-and-transit | 10,238 → 3,317 | 2,498 → 1,172 | 9 → 1 |
| synthesis | 12,894 → 4,189 | 2,498 → 1,172 | 9 → 1 |

## What added context contributes

Each source adds a different move to one afternoon, and each body has a single direction.

- **Contact only.** The check looks small (observe); the familiar task can take more effort (explain); if it fills the afternoon, the check needs hours already spoken for (explain); moving the task only takes the check along (distinguish); changing what the task includes is the other option (choose).
- **Natal.** The scene is one free afternoon, so N1's own condition applies to it unchanged: if several possible projects are competing for that same free afternoon, the reader may not need to decide between them yet, because following more than one line of curiosity can help a direction take shape. The familiar task can fill the same afternoon, which is I1's mismatch. A note keeps an idea in view without promising it the afternoon, which also carries I1's clearer limit. Curiosity is the reason not to decide yet, not a call to spend hours already spoken for.
- **Transit.** The exact chronology follows the sentence that names Saturn's square, so "contacts" and "this return" have a referent. P2's condition stays first: if an earlier way no longer fits, "you could use this return to try one smaller change rather than a new plan: a stopping point that comes before the check." That carries I1's limit and gives the chronology a practical use without history, a failed attempt, a lesson or closure.
- **Natal and transit.** The return's smaller change is "a clear point where the task stops, with the other ideas waiting as notes". One direction serves both the task and the ideas.
- **Synthesis.** It is built on stable referents: the familiar task, its notes, the outline they start to form and the next piece. Jupiter's trine adds conditional momentum and ease. Saturn's square adds effort and the full afternoon. S1 then states the synthesis plainly: a bigger task can need more structure to carry it, and that need can show where the task grows past what it was set up for. N1 keeps its own condition, possible projects competing for the same free afternoon, and says they need not be decided yet. P2's smaller change lets the next piece wait as a note.

Reference readings for all five graphs are in [reference-readings.md](reference-readings.md). Versioned edits of the three saved failures, with cuts, carriers and per-sentence contributions, are in [edited-failures.md](edited-failures.md).

## How the reader rounds changed the material

Four blind reader rounds were run, each by a fresh reviewer that saw only bodies ([reviews](reviews/)).

1. **Round 1** passed 1 of 8. It found that separate N1 wordings read as one point made twice. "This return offers a chance to try" read as a stock formula. In synthesis the chronology followed two contacts, so it was unclear which one returned. The edited failures never named the contact.
2. **Round 2** passed 5 of 8, including every contact-only and transit-only body. A sentence like "following your curiosity into both" asked for time the body had just said was taken, so it pulled against the note direction. Synthesis lost its referents.
3. **Round 3** reviewed only the four bodies changed after round 2. The other four keep their round-2 verdicts on byte-identical text. It passed the natal-only reference and edit and the natal-and-transit reference. Synthesis failed again.
4. **Round 4** reviewed only the final synthesis revision. Recognition, meaning, direction and voice reached 4, but distinctness stayed at 3, as it had in every round.

Each round changed only the claims' wording and order. The validator, thresholds and source facts did not change. After round 4, seven of the eight bodies scored at least 4 on every reader dimension. The synthesis reference did not, and four rounds was the bound set for it in advance, so it was not reworded for the reader again.

The independent source review then found that every natal wording had dropped part of N1's condition, "If several possible projects compete for the same free afternoon", and had put the competition in hours already spoken for. The earlier benchmarks and material-4 had done the same. The condition was restored verbatim in the local proof, and the natal scenes now use one free afternoon. In synthesis, the clause "however easy starting feels" was also removed, because both reviewers read it as restating I2's ease. Four bodies changed as a result: the natal-only reference and edit, natal-and-transit, and synthesis. To save time they were not given to a fifth reader, so they have no reader verdict on their final wording. A second source review of the changed items found no lost condition and no unsupported claim. It found two omissions, which remain open: natal-only does not put I1's boundary on the task itself, and synthesis does not carry I2's "or pursue an emerging opening" ([source reviews](reviews/)).

## Paragraph requirements: no padding, but synthesis is crowded

The validator contract is unchanged: two to four paragraphs of one to four sentences, C1/I1 in paragraph 1, N1, S1 and P2 cited in paragraphs 1–2, and chronology exactly once there. What changed is the prompt. The old wording, "integrate every selected meaning in paragraph 1 or 2", asked for more than the validator does. Now only a source's first claim carries `byParagraph: 2`; its later claims may continue in paragraph 3.

- **No padding.** The two-paragraph minimum fits all five graphs once each claim is worded once: five to eight drafted claims, never filler. The fourth pilot's contact-only second paragraph was made of the remaining supplied wordings: the summary's second sentence, the calendar scene and the direction. Its repetition traces to the brief, not to the minimum.
- **Synthesis is crowded, and the contract causes part of it.** In synthesis, S1, N1 and P2 each have one wording, so each is its source's first claim and must land in paragraphs 1–2. The chronology must land there too, and paragraph 1 must cite C1 and I1. Those two paragraphs hold at most eight sentences. They must take the setup, I2, I1's effort and full afternoon, the fixed chronology sentence, S1, N1 and P2, each with the condition its source gives it. The reference already joins claims: N1's two claims share a sentence, and P2's wording also carries I1's boundary and N1's note. It still needs seven sentences. The round-4 reader described the result: "Seven sentences carry two contacts, the chronology, a distinction, a curiosity point and a method change, and no idea gets a second sentence." The conditions that N1 and P2 must keep then stack: "If more than one piece is competing…", "And if an earlier way…".
- **S1 overlaps its parents.** S1 is the published tension between Saturn's square and Jupiter's trine, and its parents are C1, I1, C2 and I2. Once I1's effort and I2's ease are each worded in full in paragraph 1, any wording of S1 has to refer back to both. The reader heard "however easy starting feels" as re-saying "adding the next piece can feel natural", and "more structure to carry it" as re-saying "more effort than usual".

### Proposed contract change (for review; not implemented)

This applies to the synthesis graph only (`A1, C1, C2, I1, I2, N1, P2, S1`).

1. **Placement.** N1 may be introduced in paragraph 3 instead of paragraphs 1–2. C1 and I1 stay in paragraph 1. S1, P2 and the chronology stay in paragraphs 1–2, with the chronology still copied exactly once. Every source, every required claim, every parent citation and the chronology are preserved. The change is one validator rule (N1's paragraph window for this graph) and the composition's `byParagraph`, under a new validator version.
2. **Composition.** S1's wording carries the meeting of I2's ease and I1's effort, rather than following full separate wordings of both. Each required I1 and I2 claim is still carried exactly once, inside the S1 passage. This is a material revision, not a contract change, and it was not tried within the four rounds.

Both parts should be demonstrated offline before any validator change. That means an authored synthesis reference under the proposed rule, reviewed by a fresh blind reader and an independent source reviewer. The other four graphs keep the current contract, under which their references pass. If the proposal also fails, the next question is the selection policy: whether N1 belongs in the synthesis reading at all. That would reduce what the reading covers, so it is not proposed here.

## Validator change

One bounded body-level check was added for context candidates (`daily-context-reference-5`). It rejects a body that states one of the four reviewed 0.9.0 source conditions twice: I1's full afternoon, N1's competing projects, P2's earlier way no longer fitting, or I2's well-chosen aim. The rejection uses the existing `writing_quality` code and serves the authored runtime fallback. It rejects the saved contact-only failure and accepts every authored fallback, benchmark, earlier reviewed revision, reference reading and edit. It does not detect a paraphrased restatement; that remains a reader-review judgment.

## Identities and preserved boundaries

Prompt `daily-context-body-5`, validator `daily-context-reference-5`, voice `daily-context-voice-5`, brief `daily-context-brief-5` and material `daily-context-material-5` are new. The member rollout policy identity hashes these bytes, so any stored revision-4 policy no longer loads and the route stays off. Runtime fallback bodies, headlines and reflections are unchanged; only their `materialVersion` is rebound. The source bundle, the five original benchmarks, the selected source facts and the saved pilot captures are byte-identical.

The campaign identity is now `daily-context-pilot-5`: a new single allowance, unused and unauthorized. Historical pilot 1–4 rows stay readable and closed, and a stored pilot-4 plan can no longer be revalidated. Provider, the 60-second deadline, no-retry and halt-on-timeout are unchanged; the timeout is analysed separately in [timeout-analysis.md](timeout-analysis.md).

## Limits

The synthesis graph has no reference reading that passes the reader bar. Its generated readings are therefore at risk under the current contract (see the proposal above).

The premise signatures in `tests/helpers/context-premises.mjs` are written for these five sources and their observed synonyms. They measure repetition in this closed set, not meaning in general. The authored readings show that the claims can compose into coherent bodies without additions. They do not show that a provider will produce them: the model may still restate, crowd or drift, and only generated readings with independent source and reader reviews can qualify a mode. Readers also differ: round 2 passed a natal-only body that round 3's revision replaced, and every verdict here is an AI review, not human research.
