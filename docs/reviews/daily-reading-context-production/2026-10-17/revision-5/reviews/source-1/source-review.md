# Independent AI source review: daily context material 5 and bodies B1 to B8

**This is an independent AI source-fidelity review, not human review.** An AI reviewer produced it from one packet. No human has reviewed, checked or approved these findings, and no part of it is human sign-off.

Scope: source fidelity only. Prose quality, voice and reader appeal are out of scope. The only input opened was the packet below, read in full (1,563 lines) with the Read tool and searched only with grep inside it. No repository file, other /tmp path, earlier review, web page or subagent was used. Besides the permitted commands, I used `echo` and `cut` to format grep output and one `ls` on the two output paths to confirm they did not exist yet.

- Packet: `/tmp/pattern-context-structure-private-5-src-20261017/source/source-review-packet.md`
- SHA-256: `933257344bd5c8e7a0e3e55ee31fea9abb70f8a273769f9079f4f94340e6e98b`
- Hash and time recorded before reading: 2026-10-17T12:20:49Z
- Hash re-checked, unchanged, immediately before writing: 2026-10-17T12:38:45Z

## Summary: compositions (Part A)

| Mode | Pass | Unsupported | Omitted | Notes |
|---|---|---|---|---|
| contact-only | Pass | 0 | none | Two borderline calls accepted: the I1.1 opening perception and the I1.4 rescheduling contrast. |
| natal-only | Fail | 0 | none | Lost condition in N1.1: drops "free" and places the competition in "hours that are already spoken for". |
| transit-only | Pass | 0 | none | Chronology copied by reference. P2 condition, "could" and "smaller" kept. |
| natal-and-transit | Fail | 0 | none | Same N1.1 lost condition as natal-only. |
| synthesis-natal-and-transit | Fail | 0 | none | N1.1 lost condition ("free" dropped; "several possible projects" become pieces of the task). Restatement: S1.1 "however easy starting feels" repeats I2.2's ease. |

## Summary: bodies (Part B)

| Label | Source graph | Pass | Unsupported | Omitted | Chronology | Citations | Integration |
|---|---|---|---|---|---|---|---|
| B1 | natal-only | Fail (lost condition) | 0 | none | not applicable | complete | 3 |
| B2 | natal-and-transit | Fail (lost condition) | 0 | none | exact, once, paragraph 1 | complete | 3 |
| B3 | synthesis-natal-and-transit | Fail (lost condition) | 0 | none | exact, once, paragraph 1 | complete | 3 |
| B4 | transit-only | Pass | 0 | none | exact, once, paragraph 1 | complete | 4 |
| B5 | transit-only | Pass | 0 | none | exact, once, paragraph 1 | complete | 4 |
| B6 | natal-only | Fail (lost condition) | 0 | none | not applicable | complete | 3 |
| B7 | contact-only | Pass | 0 | none | not applicable | complete | null |
| B8 | contact-only | Pass | 0 | none | not applicable | complete | null |

Counts: 2 of 5 compositions pass, 4 of 8 bodies pass, 0 unsupported claims (0 in compositions, 0 in bodies). There are 7 lost conditions in all (3 composition expressions, 4 body sentences), and every one is the same N1 "free afternoon" condition. One restatement is reported (synthesis composition and B3).

## Findings

### The decisive finding: N1's "free afternoon" condition

N1 reads: "If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages." In the packet the word "free" occurs only in the five copies of this source statement (lines 64, 864, 938, 1100, 1437). No claim, draft or body keeps it. The local claim N1.stages (line 83) already reads "compete for the same afternoon", so the claims/carries proof cannot show the loss.

Each N1 wording also puts the competition in an afternoon that the text has just made unavailable:

- natal-only, natal-and-transit, B1, B2: "If other projects are competing for those hours", directly after "anything else needs hours that are already spoken for".
- synthesis-natal-and-transit, B3: "If more than one piece is competing for the afternoon", the afternoon in which "the next piece needs hours that are already spoken for". This also turns "several possible projects" into pieces of the one growing task.
- B6: "If several projects compete for that same afternoon", the afternoon the task "already fills". This also drops "possible", although the next sentence treats the projects as ideas held in notes.

So the source offers the stage distinction for discretionary time, and the drafts apply it to committed time. That is a changed source condition, which I record as a lost condition, and it fails every item that carries N1. It is the only failing finding in the packet. If the operator decides "free" is incidental, then natal-only, natal-and-transit, B1, B2 and B6 have no other failing finding. The synthesis composition and B3 would still change "possible projects" into pieces of the task.

### Calls applied throughout (recorded, not failing)

1. **I1's effort sentence is compressed.** I1 says "An established role can feel demanding when its obligations require more deliberate effort than usual." Every version says the task "can take more effort than usual" or "can need more effort than usual". The when-clause content becomes the possibility, still under "can", so nothing is hardened. "Feel demanding" is folded into the extra effort and "deliberate" is dropped. This narrows the source and adds nothing, so I treat it as a plainer restatement, not an omission.
2. **The opening perception lines are borderline but accepted.** These are "can look like almost nothing", "can look small" and "can look like plenty of room". I1 never says an addition or an afternoon looks small or roomy. I accept them as illustrations of "Saturn's square to the Sun highlights where expectations outpace available capacity", because "highlights" implies a mismatch that may not be obvious. Each line stays a possibility ("can"), says nothing about the reader's actual day and adds nothing from the unsupported list.
3. **The rescheduling contrast is borderline but accepted.** The sentence is "Moving the task to another afternoon (or a later opening) only takes the check along with it". I1 says nothing about rescheduling, so this is authored application content (local claim I1.calendar). I accept it as a definitional illustration. The scene makes the check part of the task, so moving the task moves the check. The sentence only marks out the boundary I1 names ("a routine or responsibility needs clearer boundaries"), and it claims no outcome, history or effect of the transit. A stricter rule that counts any authored distinction as an added meaning would make it unsupported, and contact-only, B7 and B8 would then fail.
4. **C1 and C2 technical fields are not counted as omissions.** Orb, phase, exact date and domain are excluded by the depth control ("Add no orb, degree, phase or date", `technicalDetails: false`). The requests send C1 and C2 as cycle data only.
5. **Only one alternative of I2's "or" is carried.** I2 makes it "natural to take on a larger piece of work or pursue an emerging opening". Only the first alternative appears. Dropping one alternative of an "or" narrows the source, so it is recorded but not counted.
6. **Restatements are reported but do not fail anything.** They are not among the stated pass criteria.
7. **Context integration is scored only where more than one interpretive source contributes.** Contact-only bodies (I1 with its calculation C1) get null.

### Part A: compositions

#### contact-only (graph C1, I1): Pass

| ID | Wording | Cites | Supported | Supporting source words | Conditions and additions |
|---|---|---|---|---|---|
| I1.1 observe | An extra check can look like almost nothing next to a task you know well. | C1, I1 | Yes, borderline | I1: "An established role"; "highlights where expectations outpace available capacity" | "can" kept. The check illustrates an added expectation, and "a task you know well" renders "an established role". See call 2. |
| I1.2 explain | With Saturn squaring your natal Sun, even that task can take more effort than usual. | C1, I1 | Yes | C1: "transiting saturn square natal sun". I1: "can feel demanding when its obligations require more deliberate effort than usual" | "can" kept. "even" follows from "established ... than usual". See call 1. |
| I1.3 explain | If it fills the whole afternoon, the check needs hours that are already spoken for. | C1, I1 | Yes | I1: "expectations outpace available capacity" | The mismatch stays inside the if-clause, so there is no actual overloaded afternoon. "needs" is the mismatch itself, not a necessity placed on the reader. |
| I1.4 distinguish | Moving the task to another afternoon only takes the check along with it. | C1, I1 | Yes, borderline | I1: "a routine or responsibility needs clearer boundaries" (by contrast) | Authored application (I1.calendar). Definitional, with no outcome or history. See call 3. |
| I1.5 choose | Changing what the task includes is the other option: the check could stay outside it. | C1, I1 | Yes | I1: "showing where a routine or responsibility needs clearer boundaries" | "could" kept. The step is optional and is not a command to refuse work. |

- **Complete meaning:** effort (I1.2), capacity (I1.3), boundary (I1.5), and the C1 contact named in I1.2. Nothing is omitted.
- **Citations:** every claim cites C1 and I1, and I1's only parent is C1. Complete.
- **Restatement:** none. I1.4 and I1.5 are the two halves of one contrast.
- **Request:** the user message sends the five claims, C1 (cycle only), I1 (key and version) and the controls. There is no drafting copy beyond the claims, no unselected source content and nothing that contradicts a source. The generic line "The only dated sentence is a copied A1 chronology claim" names a claim that is absent here. It has no effect and is not counted.

#### natal-only (graph C1, I1, N1): Fail

| ID | Wording | Cites | Supported | Supporting source words | Conditions and additions |
|---|---|---|---|---|---|
| I1.1 observe | An afternoon set aside for a task you know well can look like plenty of room. | C1, I1 | Yes, borderline | I1: "An established role"; "expectations outpace available capacity" | "can" kept. See call 2. |
| I1.2 explain | With Saturn squaring your natal Sun, even that task can take more effort than usual. | C1, I1 | Yes | C1 and I1 as in contact-only | "can" kept. |
| I1.3 explain | If it fills the whole afternoon, anything else needs hours that are already spoken for. | C1, I1 | Yes | I1: "expectations outpace available capacity" | The mismatch stays inside the if-clause. |
| N1.1 distinguish | If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape. | N1, C1, I1 | Content yes, condition changed | N1: "Following more than one line of curiosity can help a direction take shape." (verbatim); "If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages." | "can" and "may" stay on their own claims, and the notes and tab sit inside the condition, so they are not observed behaviour. **Lost condition:** "the same free afternoon" becomes "those hours", which I1.3 has just made "already spoken for". "this afternoon" sits inside the consequence and removes urgency rather than adding it. |
| N1.2 choose | A note can keep an idea in view without promising it the afternoon. | N1, C1, I1 | Yes | N1: "sampling a few and choosing one to pursue may be different stages" (application N1.hold). I1: "a routine or responsibility needs clearer boundaries" | "can" kept and the step is optional. It carries the boundary implicitly: the afternoon set aside for the task is not promised to the idea. The idea is not abandoned. |

- **Complete meaning:** effort, capacity, boundary (implicitly, in N1.2), curiosity and stages are all carried. Nothing is omitted.
- **Citations:** N1's parents C1 and I1 are cited wherever N1 is. Complete.
- **Restatement:** none. N1.1 defers a choice, and N1.2 keeps time unpromised.
- **Request:** clean. The system line "The N1 claim is a conditional possibility, never a personality description..." treats both N1 sentences as conditional. That is more cautious than the source, whose curiosity sentence is unconditional, but it does not contradict the source.
- **Verdict:** Fail, because N1.1 has a lost condition.

#### transit-only (graph A1, C1, I1, P2): Pass

| ID | Wording | Cites | Supported | Supporting source words | Conditions and additions |
|---|---|---|---|---|---|
| I1.1 observe | An extra check can look like almost nothing next to a task you know well. | C1, I1 | Yes, borderline | As in contact-only | "can" kept. |
| I1.2 explain | With Saturn squaring your natal Sun, even that task can take more effort than usual. | C1, I1 | Yes | As in contact-only | "can" kept. |
| I1.3 explain | If it fills the whole afternoon, the check needs hours that are already spoken for. | C1, I1 | Yes | As in contact-only | The mismatch stays inside the if-clause. |
| A1.1 chronology | copy of A1.chronologySentence | A1, C1 | Yes | A1: "This is the second of three calculated contacts; the first exact contact falls in September 2026." | Exact by reference. A1's parent is C1. |
| P2.1 choose | If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a new plan: a stopping point that comes before the check. | P2, C1, I1, A1 | Yes | P2: "If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary." I1: "clearer boundaries" | The condition stays on this claim and "offers a chance" becomes "could". "smaller" is kept, and "rather than a new plan" restates it as not a wholesale restart. The stopping point illustrates the boundary. No failed attempt, recurrence or closure is asserted. |

- **Complete meaning:** effort, capacity, boundary (P2.1), chronology (A1.1) and adjustment (P2.1). Nothing is omitted. The change applies to "an earlier way of handling the task", which is a method, and a boundary illustrates it.
- **Citations:** P2's parents are C1, I1 and A1, and A1's parent is C1. All are cited. Complete.
- **Restatement:** none.
- **Request:** clean. The A1 reference sends the chronology sentence needed for the copy, and the controls set chronologyFirstTwo and chronologyOnce.

#### natal-and-transit (graph A1, C1, I1, N1, P2): Fail

- **I1.1, I1.2, I1.3:** the same wording as natal-only, and supported (I1.1 borderline).
- **A1.1:** copied by reference, supported.
- **N1.1:** identical to natal-only, so the content is supported but the condition is lost ("free afternoon" becomes "hours that are already spoken for").
- **P2.1:** "If an earlier way of handling the task no longer fits, you could use this return to try one smaller change: a clear point where the task stops, with the other ideas waiting as notes." It cites P2, C1, I1, A1 and N1. Each part is supported:
  - P2 gives the condition, "offers a chance" (as "could") and "smaller adjustment".
  - I1's "clearer boundaries" becomes "a clear point where the task stops".
  - N1.hold becomes "the other ideas waiting as notes". This sits under "could", and the ideas are kept, not abandoned.
  - The citation closure is complete.
- **Complete meaning:** nothing is omitted.
- **Restatement:** none. N1.1 (deferring a choice) and the notes in P2.1 (holding ideas) sit side by side but say different things.
- **Request:** clean.
- **Verdict:** Fail, because N1.1 has a lost condition.

#### synthesis-natal-and-transit (graph A1, C1, C2, I1, I2, N1, P2, S1): Fail

| ID | Wording | Cites | Supported | Supporting source words | Conditions and additions |
|---|---|---|---|---|---|
| I2.1 observe | The notes for a task you know well can start turning into an outline. | C1, I1, C2, I2 | Yes | I1: "An established role". I2: "take on a larger piece of work" | "can" kept. A growth scene, not an asserted event. |
| I2.2 explain | With Jupiter trining your natal Mars, the notes and your interest in them can feed each other when the aim is well chosen, and adding the next piece can feel natural. | C2, I2 | Yes | C2: "transiting jupiter trine natal mars". I2: "Enthusiasm and practical initiative reinforce one another when an aim is well chosen"; "effort encounters little friction, making it natural to take on a larger piece of work" | The "when" condition stays on the reinforcement clause. "feed each other" is mutual, not one-way cause. See call 5 for "or pursue an emerging opening". |
| I1.2 explain | With Saturn squaring your natal Sun, the task itself can take more effort than usual. | C1, I1 | Yes | C1 and I1 as in contact-only | "can" kept. |
| I1.3 explain | If it fills the whole afternoon, the next piece needs hours that are already spoken for. | C1, I1 | Yes | I1: "expectations outpace available capacity" | The mismatch stays inside the if-clause. "the next piece" points back to I2.2's scene. I1.3 carries only I1.capacity, so C1 and I1 are the closure of what it carries. Note that N1.1 cites C2 and I2 for "piece" while I1.3 does not. That is inconsistent but not incomplete. |
| A1.1 chronology | copy of A1.chronologySentence | A1, C1 | Yes | A1 sentence | Exact by reference. |
| S1.1 distinguish | A bigger task can need more structure to carry it, however easy starting feels, and that need can show up where the task grows past what it was set up for. | S1, C1, I1, C2, I2 | Yes | S1: "Giving a plan more scope can increase the structure needed to carry it."; "A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension." I2: "effort encounters little friction" | "can" is kept twice, and outgrowing the limits stays possible ("can show up where"). **Restatement:** "however easy starting feels" repeats the I2 ease that I2.2 already carries. |
| N1.1 distinguish | If more than one piece is competing for the afternoon, you may not need to decide between them yet: following more than one line of curiosity can help a direction take shape. | N1, C1, I1, C2, I2 | Content yes, condition changed | N1 as above | "can" and "may" kept. **Lost condition:** "free" is dropped, and the afternoon is the one I1.3 says the task may fill. "several possible projects" also become pieces of the one growing task. |
| P2.1 choose | If an earlier way of handling the task no longer fits, you could use this return to try one smaller change: the next piece can wait as a note instead of joining the outline. | P2, C1, I1, A1, C2, I2, S1, N1 | Yes | P2 as above. I1: "clearer boundaries". N1 (hold). S1: "growing beyond its agreed limits" | "could" and "can" kept. It does not promise that the boundary brings success or less strain. Citation closure complete. |

- **Complete meaning:** carried are I1 effort, capacity and boundary; I2 reinforcement and ease; S1 structure and notice; N1 curiosity and stages; A1; and P2. Nothing is omitted, though I2's second alternative is narrowed (call 5).
- **Citations:** complete for every claim.
- **Restatement:** S1.1's "however easy starting feels" repeats I2.2's ease.
- **Request:** clean beyond the claims. The references are the selected eight and carry no statement text except A1's chronology sentence.
- **Verdict:** Fail, because N1.1 has a lost condition.

### Part B: bodies

#### B1 (natal-only): Fail

| Para.Sent | Sentence | Supported by | Unsupported | Note |
|---|---|---|---|---|
| 1.1 | An afternoon set aside for a task you know well can look like plenty of room. | I1 | none | Illustration of "expectations outpace available capacity" (call 2). |
| 1.2 | With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, anything else needs hours that are already spoken for. | C1, I1 | none | C1: "transiting saturn square natal sun". I1: "more deliberate effort than usual"; "expectations outpace available capacity". "can" and the if-clause each stay on their own claim. |
| 2.1 | If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape. | N1, I1 | none | N1 curiosity is verbatim, and "may be different stages" becomes "may not need to decide". **Lost condition:** "the same free afternoon" becomes "those hours", the ones already spoken for. |
| 2.2 | A note can keep an idea in view without promising it the afternoon. | N1, I1 | none | N1 hold, plus the I1 boundary carried implicitly. |

- Omitted: none. Lost conditions: 1. Chronology: not applicable.
- Citations: paragraph 1 cites C1 and I1; paragraph 2 cites C1, I1 and N1. Complete.
- Integration: 3. One afternoon holds distinct I1 and N1 contributions, but N1 only fits because its condition was changed.

#### B2 (natal-and-transit): Fail

| Para.Sent | Sentence | Supported by | Unsupported | Note |
|---|---|---|---|---|
| 1.1 | An afternoon set aside for a task you know well can look like plenty of room. | I1 | none | As in B1 1.1. |
| 1.2 | With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, anything else needs hours that are already spoken for. | C1, I1 | none | As in B1 1.2. |
| 1.3 | This is the second of three calculated contacts; the first exact contact falls in September 2026. | A1, C1 | none | Exact copy of A1, appearing once. |
| 2.1 | If other projects are competing for those hours, with notes on one idea and a tab open on another, you may not need to decide between them this afternoon: following more than one line of curiosity can help a direction take shape. | N1, I1 | none | **Lost condition**, as in B1 2.1. |
| 2.2 | And if an earlier way of handling the task no longer fits, you could use this return to try one smaller change: a clear point where the task stops, with the other ideas waiting as notes. | P2, A1, I1, N1 | none | P2: "If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary". The condition, "could" and "smaller" are kept. I1 gives "clearer boundaries" and N1 the hold. |

- Omitted: none. Lost conditions: 1. Chronology: exact, once, paragraph 1.
- Citations: paragraph 1 cites C1, I1 and A1; paragraph 2 cites C1, I1, N1, A1 and P2. Complete.
- Integration: 3. The same N1 condition change holds it back.

#### B3 (synthesis-natal-and-transit): Fail

| Para.Sent | Sentence | Supported by | Unsupported | Note |
|---|---|---|---|---|
| 1.1 | The notes for a task you know well can start turning into an outline. | I2, I1 | none | I2: "take on a larger piece of work"; I1: "An established role". |
| 1.2 | With Jupiter trining your natal Mars, the notes and your interest in them can feed each other when the aim is well chosen, and adding the next piece can feel natural. | C2, I2 | none | I2: "reinforce one another when an aim is well chosen"; "making it natural to take on a larger piece of work". The condition is kept. |
| 1.3 | With Saturn squaring your natal Sun, though, the task itself can take more effort than usual, and if it fills the whole afternoon, the next piece needs hours that are already spoken for. | C1, I1 | none | "though" only connects two supported claims and carries no S1 meaning, so paragraph 1 does not need to cite S1. |
| 1.4 | This is the second of three calculated contacts; the first exact contact falls in September 2026. | A1, C1 | none | Exact copy, appearing once. |
| 2.1 | A bigger task can need more structure to carry it, however easy starting feels, and that need can show up where the task grows past what it was set up for. | S1, I2 | none | S1: "Giving a plan more scope can increase the structure needed to carry it"; "growing beyond its agreed limits offers one place to notice that tension". **Restatement** of 1.2's ease. |
| 2.2 | If more than one piece is competing for the afternoon, you may not need to decide between them yet: following more than one line of curiosity can help a direction take shape. | N1, I1, I2 | none | **Lost condition:** "free" is dropped, the afternoon is the one already spoken for, and "possible projects" become pieces of the task. |
| 2.3 | And if an earlier way of handling the task no longer fits, you could use this return to try one smaller change: the next piece can wait as a note instead of joining the outline. | P2, A1, I1, N1, S1 | none | P2's condition, "could" and "smaller" are kept, along with the I1 boundary and the N1 hold. No outcome is promised. |

- Omitted: none. Lost conditions: 1. Chronology: exact, once, paragraph 1.
- Citations: paragraph 1 cites C1, I1, C2, I2 and A1; paragraph 2 cites all eight sources. Complete.
- Integration: 3. Six interpretive sources share one task-and-afternoon scene. Two things hold it back: the N1 condition change, and I2's ease appearing twice (1.2 and 2.1), so the contributions are not fully distinct.

#### B4 (transit-only): Pass

| Para.Sent | Sentence | Supported by | Unsupported | Note |
|---|---|---|---|---|
| 1.1 | An extra check can look like almost nothing next to a task you know well. | I1 | none | Borderline illustration, accepted (call 2). |
| 1.2 | With Saturn squaring your natal Sun, even that task can take more effort than usual, and if it fills the whole afternoon, the check needs hours that are already spoken for. | C1, I1 | none | "can" and the if-clause kept. |
| 1.3 | This is the second of three calculated contacts; the first exact contact falls in September 2026. | A1, C1 | none | Exact copy, appearing once. |
| 2.1 | If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a new plan: a stopping point that comes before the check. | P2, A1, I1 | none | P2's condition, "could" and "smaller" (as "rather than a new plan") are kept. The stopping point illustrates the boundary. |

- Omitted: none. Lost conditions: none. Chronology: exact, once, paragraph 1.
- Citations: paragraph 1 cites C1, I1 and A1; paragraph 2 cites C1, I1, A1 and P2. Complete.
- Integration: 4. I1, A1 and P2 each contribute fully and distinctly to one task-and-check situation, and P2's smaller change and I1's boundary meet in one stopping point. It is economical, but not unusually so, because it follows the transit-only material clause for clause.

#### B5 (transit-only): Pass

| Para.Sent | Sentence | Supported by | Unsupported | Note |
|---|---|---|---|---|
| 1.1 | An extra check can look small beside a familiar task. | I1 | none | A milder version of the borderline perception, accepted. |
| 1.2 | With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours. | C1, I1 | none | "already" and "still" sit inside the if-clause and its consequence, so there is no actual overloaded afternoon. |
| 1.3 | This is the second of three calculated contacts; the first exact contact falls in September 2026. | A1, C1 | none | Exact copy, appearing once. |
| 2.1 | If an earlier way of handling the task no longer fits, you could use this return to try one smaller change rather than a whole new plan: stopping before the extra check, for instance. | P2, A1, I1 | none | "rather than a whole new plan" restates "smaller", and "for instance" marks the illustration. |

- Omitted: none. Lost conditions: none. Chronology: exact, once, paragraph 1.
- Citations: paragraph 1 cites A1, C1 and I1; paragraph 2 cites A1, C1, I1 and P2. Complete.
- Integration: 4, for the same reasons as B4.

#### B6 (natal-only): Fail

| Para.Sent | Sentence | Supported by | Unsupported | Note |
|---|---|---|---|---|
| 1.1 | An extra check can look small beside a familiar task. | I1 | none | Borderline illustration, accepted. |
| 1.2 | As Saturn squares your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, anything added needs hours that are already spoken for. | C1, I1 | none | "As" can be read as "while" or "because". Either way it ties I1's possibility, still under "can", to the transit I1 interprets, so it is not counted as an added cause. |
| 2.1 | If several projects compete for that same afternoon, you may not need to choose between them yet: following a few lines of curiosity may help a direction take shape. | N1, I1 | none | **Lost condition:** "free" is dropped, and the afternoon is the one the task already fills. "possible" is also dropped, although 2.2 treats the projects as ideas. "can" becomes "may" and "more than one line" becomes "a few lines": the possibility is kept and nothing is hardened. |
| 2.2 | A page of notes can hold them without promising them those hours. | N1, I1 | none | N1 hold, plus the I1 boundary carried implicitly. |

- Omitted: none. Lost conditions: 1. Chronology: not applicable.
- Citations: paragraph 1 cites C1 and I1; paragraph 2 cites C1, I1 and N1. Complete.
- Integration: 3. N1 only fits because its condition was changed, and the opening check is not carried past 1.1.

#### B7 (contact-only): Pass

| Para.Sent | Sentence | Supported by | Unsupported | Note |
|---|---|---|---|---|
| 1.1 | An extra check can look small beside a familiar task you've set an afternoon aside to finish. | I1 | none | Borderline, accepted. "you've set an afternoon aside to finish" describes a kind of task, under an indefinite article and "can". I read it as a generic illustration, not a report that the reader has set an afternoon aside. "to finish" is the scene's purpose, not closure. |
| 1.2 | With Saturn squaring your natal Sun, that task can need more effort than usual, and if it already fills the afternoon, the check still needs some of the same hours. | C1, I1 | none | "can" and the if-clause kept. |
| 2.1 | Moving the task to a later opening only takes the check along with it, but the check could also stay outside the task. | I1 | none | Borderline rescheduling contrast, accepted (call 3). "could" stays on the boundary. |

- Omitted: none. Lost conditions: none. Chronology: not applicable.
- Citations: C1 and I1 in both paragraphs. Complete.
- Integration: null, because I1 is the only interpretive source.

#### B8 (contact-only): Pass

| Para.Sent | Sentence | Supported by | Unsupported | Note |
|---|---|---|---|---|
| 1.1 | An extra check can look like almost nothing next to a task you know well. | I1 | none | Borderline perception, accepted. |
| 1.2 | With Saturn squaring your natal Sun, even that task can take more effort than usual. | C1, I1 | none | "can" kept. |
| 1.3 | If it fills the whole afternoon, the check needs hours that are already spoken for. | I1 | none | The mismatch stays inside the if-clause. |
| 2.1 | Moving the task to another afternoon only takes the check along with it. | I1 | none | Borderline rescheduling contrast, accepted. |
| 2.2 | Changing what the task includes is the other option: the check could stay outside it. | I1 | none | I1: "a routine or responsibility needs clearer boundaries". "could" kept. |

- Omitted: none. Lost conditions: none. Chronology: not applicable.
- Citations: C1 and I1 in both paragraphs. Complete.
- Integration: null. B8 reproduces the contact-only material word for word.

---

Frozen at 2026-10-17T12:38:45Z. Both files were written right after the final hash check and then set read-only (444). They have not been changed since.
