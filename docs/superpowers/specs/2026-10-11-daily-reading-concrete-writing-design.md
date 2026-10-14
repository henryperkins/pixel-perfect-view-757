# Daily reading concrete writing design

**Status reconciled 2026-10-13:** Implementation is on main and published; the schema-5 content candidate remains inactive. All nine implementation packages have local verification, including 50-case fixtures, encrypted writing evidence, templates and reflection assembly. Matched actual-model qualification, the expanded synthesis matrix, seven-day review, human editorial approval and live candidate activation remain open.

**Evidence and scope:** [Implementation/publication](../../reviews/release-completion/2026-10-13-concrete-writing/README.md) records source `78c9b53`, deployment `64812d27-6fd5-4710-8b97-c21dec23a72c`, and candidate `builtin-0.8.0`: 81 interpretations, 110 positive directional syntheses and 191 frames. The [evaluation controller](../../reviews/release-completion/2026-10-13-evaluation-controller/README.md) is also published. Later schema-4 composition repairs and content-draft pilots are separate evidence and do not qualify this candidate. The [central closeout record](../plans/2026-10-12-release-completion-checklist.md#reconciled-status) owns the remaining gates and controller-alignment work; this reconciliation adds no new runtime verification.

The reading should develop one central meaning through one or two recognizable situations, then offer one question about that same meaning. A scene is a published illustration the reader might recognize. It is not an event the app knows happened.

## Scope and relationship to the other recommendations

Use recommendation 1's interpretation/synthesis selection, content lifecycle, fact graph and saved source trail. Integrate the optional natal and story contracts from [recommendation 2](2026-10-11-daily-reading-natal-temperament-design.md) and [recommendation 3](2026-10-11-daily-reading-transit-story-design.md). Neither an eligible natal lens nor an available transit-history service is required for concrete writing. Version reservations and the final fixture totals below assume their app contracts have landed; their separate numerical/service qualification must not be represented as completed by this work.

This increment owns published scene guidance, complete daily voice examples, daily-only editorial checks, template integration, a single local reflection question, private saved evidence and its writing qualification. It does not add automatic wellness-derived provider adaptation, a production semantic-reviewer call, model comparison, inferred life events or new astronomical calculations. Recommendations 5 and 6 own the broader wellness and evaluation work. Recommendation 7 should audit these new evidence and cache contracts alongside the preceding features.

Preserve the existing primary and strongest-three ranking, threshold, suppression and astronomical source rules. Preserve one model call, no retry and the current 60-second daily deadline. Member readings and natal chapters use [AGENTS.md](../../../AGENTS.md)'s explicit provider selection, otherwise configured Enterprise, otherwise Lovable; admin selection is independent. The original 20-second reservation is historical. The shared `safetyPass` remains a separate safety boundary; editorial observations never become safety flags.

## Verified starting points — historical, 2026-10-11

- `daily-voice.ts` already asks for conditional scenes supported by published copy, but its three tone examples are two-sentence fragments. The actual tone keys are `plain`, `warm` and `clinical`.
- The current built-in bundle has 26 cycle interpretations and four positive synthesis rules, plus two explicit independent rules. Some interpretations already name concrete situations; others remain abstract or make overly definite statements. A generic scene inferred from a planet is not a sufficient editorial source.
- `reading.server.ts` starts the question with `interp.question`, appends `dom.prompt`, and can append a high-stress question or a low-sleep instruction. This can create multiple questions with different centers of attention.
- Daily generation rewrites only the astronomical body. The reflection remains server-authored. The strict model schema contains two to four paragraphs with `text` and `facts`; each paragraph has one to four complete sentences, at most 200 words and 1,600 characters, and the whole body at most 700 words. The 1,600-character limit is per paragraph.
- Model validation checks safety, structure, supplied references, geometry and selected source coverage. It has no separate editorial-quality result or explicit scene-use contract.
- New readings already include plan/prompt/validator/model identity in the keyed cache identity. Additional writing-policy identities must join it.
- Saved paragraph boundaries are encrypted, but there is no reliable saved astronomical-paragraph count for a history comparison. The current reflection is also stored in the clear `daily_readings.prompt` column. New private reflection evidence must not be duplicated there.

## One central theme and a reviewed scene catalogue

The central theme is `S1` when a positive synthesis is selected; otherwise it is `I1`. Explicit independent pairs remain centered on `I1`. Supporting cycles, a natal lens and a transit chapter can qualify that theme but do not introduce three additional scenes or questions. No primary interpretation means no invented scene requirement.

Add optional `dailyWritingFrames` to `ContentBundle` under schema 5, preserving all earlier schema validation. Each frame refers to one actual published interpretation key or positive synthesis-rule key. Matching is exact against that resolved source key; a literal key such as `hard:*:*` can identify an existing fallback interpretation, but the frame selector does not perform another wildcard search. Independent rules cannot own a synthesis frame.

```ts
interface DailyScene {
  key: string;
  situation: string; // one conditional, observable situation
  focus: string; // one sentence connecting it to the source meaning
  cues: { objects: string[]; actions: string[] };
}
interface DailyWritingFrame {
  key: string;
  source: { kind: "interpretation" | "synthesis"; key: string };
  templateSentenceIndex: number; // reviewed complete sentence in source.mechanism
  scenes: DailyScene[];
  reflection: {
    standard: string;
    highStress?: string;
    lowSleep?: string;
  };
}
interface DailyWritingPlan {
  version: "daily-concrete-writing-1";
  releaseVersion: string;
  theme: {
    factId: "I1" | "S1";
    sourceKey: string;
    relationship: "tension" | "reinforcement" | null;
    requiredFacts: string[];
  } | null;
  status: "ready" | "no_frame" | "no_primary";
  frame: DailyWritingFrame | null;
  scenes: (DailyScene & { id: "SC1" | "SC2" })[];
  templateSources: {
    factId: "I1" | "S1";
    sourceKey: string;
    sentences: string[];
  }[];
}
```

Use at most 2,000 frames, unique 100-character frame keys and unique `(source.kind, source.key)` pairs. Each frame has one or two uniquely keyed scenes, each with situation/focus strings of at most 180 characters and one sentence each. Cue groups contain one to five unique lowercase words or phrases, at most 40 characters each. Cues support bounded observation checks; they are not a semantic certificate. Questions are at most 220 characters and must pass the independent daily-question checks below. The template index is a nonnegative, in-range integer into the source mechanism's complete sentences, split with the same English `Intl.Segmenter` as daily validation. Human review must approve that sentence independently, including its qualifications; it is never selected by a first-sentence heuristic. Validate references, bounds, safety, daily placement/technical restrictions and content identity at every existing content-release boundary.

Require schema 5 for a nonempty frame catalogue. Legacy absence normalizes to `[]`, and an explicitly empty active catalogue stays empty. Never borrow built-in frames for an active release's missing key. Preserve existing synthesis, natal and chapter arrays through drafting/ingest/activation/rollback. Cycle drafting cannot approve new frames automatically: editing a referenced interpretation invalidates its frame and the frames of affected synthesis rules, with their keys recorded for editorial review; untouched frames remain intact. A deleted source removes its frame from the candidate. Reject a conflicting payload under an existing immutable release version.

Seed 30 reviewed frames under `builtin-0.8.0`: one for each of the current 26 interpretations and four positive directional synthesis rules. If preceding work changes this inventory, enumerate its actual published sources and require complete coverage instead of retaining a stale count. Do not annotate the two independent rules. Review source mechanisms together with frames; where a source makes an unsupported definite psychological/biographical claim, revise that source under the new release rather than hiding it behind a conditional scene. Keep every change attributable to reviewed copy.

Examples of source-owned frames:

| Source                                         | Possible observable situation                                                                                         | Meaning and focused standard question                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `hard:mercury:mercury`                         | “If a reply is still unfinished after several revisions, the missing piece might be the point it needs to make.”      | Meaning versus wording. “Which point needs clearer wording?”                                            |
| `hard:saturn:moon`                             | “If a calendar has no space between commitments, a small obligation can occupy more attention than expected.”         | Responsibility versus room. “Which commitment could leave a little more room around it?”                |
| `hard:saturn:sun`                              | “If a task has become yours by default, accepting it again can make the role behind it easier to notice.”             | Chosen responsibility versus habit. “Which responsibility would you choose again today?”                |
| Saturn-square-Sun/Jupiter-trine-Mars synthesis | “If a new project would occupy the last open part of a calendar, its appeal and its demands become visible together.” | Expansion alongside capacity. “Which commitment could be made smaller to leave room for the next step?” |

The question examples illustrate the desired focus. Published questions must make sense without assuming the reader actually has the example's reply/task/calendar; avoid wording such as “that unfinished reply.” Scene examples and their focus sentences require human source review; regexes cannot establish their interpretive support.

## Scene planning and the provider boundary

Implement `resolveDailyWritingPlan(bundle: ContentBundle, interpretationPlan: DailyInterpretationPlan): DailyWritingPlan` as a pure function. It reads no profile, wellness, recent-reading text or model output. Select the frame for the central source, preserving its authored scene order and assigning local IDs `SC1/SC2`. Copy the actual synthesis relationship into the theme; use null for `I1`. Resolve template source sentences for `I1` and optional `S1` using each source's own reviewed frame index; if that source has no frame, retain its complete mechanism. This does not select additional scenes or reflection questions. A missing central frame yields `no_frame`; the existing reading can use concrete details already present in its interpretation, with no fabricated scene annotation or forced scene count.

Add `writingPlan` to `AssembledReading`. Resolve it inside the assembler after interpretation selection; the existing four-argument call and planned fifth/sixth optional natal/story arguments remain valid. The model receives a whitelisted `DailyWritingBrief` containing only `themeFactId`, `requiredFacts` and the scene IDs/situation/focus/cues. It receives no frame reflection variants, selected reflection, local context or history. Verify the brief against the selected saved source key/release and actual fact graph before the request; do not serialize the full frame or plan.

```ts
interface DailyWritingBrief {
  themeFactId: "I1" | "S1" | null;
  requiredFacts: string[];
  scenes: (Pick<DailyScene, "situation" | "focus" | "cues"> & {
    id: "SC1" | "SC2";
  })[];
}
```

Scene guidance extends the referenced published interpretation; it is not a calculated fact or an extra private natal atom. Keep `C/I/S/N/A/P` atom meanings and parent rules from earlier plans. Each paragraph declaring a scene must cite the central source and its parents: `C1/I1` for an interpretation frame, or `S1/C1/I1/C2/I2` for a synthesis frame. The first paragraph still cites `C1/I1`; all existing natal/story/synthesis coverage applies.

Extend only the daily model paragraph schema to `{ text: string, facts: string[], scenes: string[] }`, with `scenes` required and at most two unique supplied IDs. When scenes are available, require one or two unique declared scenes across the complete reading; one scene can be developed in one paragraph, and the same ID cannot be declared again in another paragraph. No-frame/quiet cases use empty scene arrays. Supporting meanings can appear without being turned into extra situations. Save declared scene use separately from fact citations; an ID proves a declared reference, not that the prose faithfully rendered the scene.

The prompt explicitly asks for one central thread, one or two possible situations, and conditional comparisons. It forbids turning “an unfinished reply” into “the reply you avoided this morning,” supplying another person's motives, or introducing a third setting to make every transit concrete. Use natural conditional phrasing once where it carries the example; do not prefix every sentence with “perhaps.” The separate reflection is not a requested model field.

## Complete edited examples in `daily-voice.ts`

Export `DAILY_VOICE_EXAMPLES_VERSION = "daily-voice-examples-1"` and six complete examples, one for each existing tone/depth pair. `dailyVoice(tone, depth)` includes only the matching complete example, with a clearly separated synthetic source card and demonstration output using `EX-` fact/scene IDs. Those IDs are never valid in the live reading. Examples supply rhythm and organization, never extra facts or scene permission.

Define `DailyVoiceExample` as `{ sourceCard: string; paragraphs: { text: string; facts: string[]; scenes: string[] }[] }`. Export `DAILY_VOICE_EXAMPLES` as a tone/depth record of that type from `daily-voice.ts`; production and tests read the same authored constants. Keep the source card identical across tones at each depth and the complete output separate from its source card.

Use this same synthetic source card for all six, so differences demonstrate tone/depth rather than different source material: Saturn square natal Sun frames responsibility/capacity (`EX-C1/EX-I1`); Jupiter trine natal Mars frames room for initiative (`EX-C2/EX-I2`); their published synthesis connects expanding scope with the capacity to carry it (`EX-S1`). Its two reviewed examples are a full calendar (`EX-SC1`) and a task accepted by default (`EX-SC2`). For technical demonstrations only, `EX-C1` has current orb `1.2°`, reference day `2026-10-11`, and exact date `2026-10-15`. These values are fictitious fixture inputs, not a claim about an actual chart.

Store the following complete two-paragraph standard examples. Each paragraph cites all five demonstration source IDs and declares its corresponding `EX-SC1` or `EX-SC2`. Their reflection is shown separately below and is not included in the model example.

**Plain / standard**

> If a new project would take the last open space in your calendar, its appeal and its cost are visible in the same place. Wanting to begin does not make the existing commitments smaller. The tension here is between room to grow and the structure needed to carry that growth. A workable next step has to account for both.
>
> A task accepted by default offers another possible view of the same tension. If it is still occupying time, that commitment has a place in the decision about what comes next. The useful distinction is between work you would choose again and work that continues through habit. That can make the cost of a larger plan easier to describe.

**Warm / standard**

> If a new project catches your attention while your calendar is already full, interest and hesitation may arrive together. The possibility can be appealing without there being a clear place for it yet. Making room is part of considering it. You can take the appeal seriously while giving the existing commitments their full weight.
>
> A task you've kept accepting by default might offer a smaller example. If that fits, its claim on your time belongs in the picture too. It can help make a distinction visible: a commitment you still choose has a different place from one that carries on through habit. The larger possibility can then be considered alongside what is already being carried.

**Clinical / standard**

> If a proposed project would fill the last gap in your calendar, its attraction and its demands are visible in the same place. The point of comparison is the fit between expanding scope and existing capacity. Available time gives that comparison a concrete measure. A larger plan can be appealing while its practical requirements remain unclear.
>
> A task accepted by default provides a second possible example. If it remains on the calendar, it occupies capacity whether or not you would choose it again. The distinction concerns the basis of the commitment: an active choice or an arrangement continuing through habit. Naming that basis can make the trade-off in a new project more precise.

For each technical example, retain the corresponding two paragraphs above and append its complete third paragraph below, citing `EX-C1` and declaring no scene. The provider receives the full three-paragraph result. Review each final example for the technical 140–240-word aim, paragraph limits and source support.

| Tone     | Technical third paragraph                                                                                                                                                                                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plain    | “The current orb for Saturn square natal Sun is 1.2°. The calculated exact date is 2026-10-15. An orb measures the angular distance from the named aspect at the time this reading was calculated. The date describes the contact's timing without establishing when a personal decision will be made.”          |
| Warm     | “For the timing detail, Saturn square natal Sun has a current orb of 1.2°. Its calculated exact date is 2026-10-15. The angular distance describes the contact at the time of the reading. That date can give the theme a place on the calendar without deciding when something in your life has to be settled.” |
| Clinical | “Saturn square natal Sun has a current orb of 1.2°. The calculated exact date is 2026-10-15. The orb measures angular deviation from the named aspect at calculation time. The date identifies a calculated astronomical contact and establishes neither the occurrence of an example nor a personal deadline.”  |

The common standard reflection is “Which commitment could be made smaller to leave room for the next step?” All six examples receive human editing/source review before inclusion. Add fixture checks for full paragraph/sentence/word bounds, identical demonstration sources across tones, a factual timing sentence separate from its orb sentence, and absence of invalid example IDs in live output. Test an unrelated Mercury/reply input so the model cannot borrow the calendar/project examples as its subject.

## A separate daily editorial quality check

Create `src/lib/ai/daily-writing-quality.ts`. Do not add broad words such as “energy,” “alignment,” “space,” “process,” or “transformation” to `safetyPass`, and do not make an editorial warning a medical/safety event. Existing safety and reference checks run first; then this checker evaluates the astronomical body only. It neither rewrites text nor makes a second model request.

```ts
type DailyWritingIssueCode =
  | "scene_reference"
  | "scene_missing"
  | "scene_parent"
  | "scene_assertion"
  | "scene_unverified"
  | "scene_unavailable"
  | "sentence_duplicate"
  | "phrase_repeat"
  | "stock_abstraction"
  | "example_copy"
  | "recent_opening_repeat"
  | "recent_sentence_repeat";
interface DailyWritingIssue {
  code: DailyWritingIssueCode;
  severity: "info" | "warning" | "reject";
  paragraph: number | null;
  ruleId: string | null;
}
interface DailyWritingQualityReport {
  version: "daily-writing-quality-1";
  outcome: "pass" | "warning" | "reject" | "not_evaluated";
  issues: DailyWritingIssue[];
}
interface DailyWritingParagraph {
  text: string;
  facts: string[];
  scenes: string[];
}
interface RecentDailyBody {
  day: string;
  paragraphs: string[];
  requiredLiteralSentences: string[];
}
type DailyWritingRenderMode = "framed" | "unframed" | "quiet" | "minimal";
interface RecentDailyWritingHistory {
  bodies: RecentDailyBody[];
  availability: {
    status: "available" | "partial" | "unavailable";
    inspected: number; // 0..12
    retainedDays: number; // 0..3
    omissions: {
      reason: "legacy" | "invalid" | "timezone" | "candidate_limit";
      count: number;
    }[];
  };
}
```

Export `checkDailyWritingQuality(input: { paragraphs: DailyWritingParagraph[]; plan: DailyWritingPlan; renderMode: DailyWritingRenderMode; recent: RecentDailyBody[]; requiredLiteralSentences: string[]; sourceTexts: string[]; example: DailyVoiceExample | null }): DailyWritingQualityReport`. The server derives render mode; the model cannot choose it. `sourceTexts` contains only actually supplied published atom text and selected scene situation/focus copy, at most 32 strings of at most 2,000 characters. Use it for the independently supplied source exception in copying checks. Bound output to 20 issues, fixed rule IDs and one-based paragraph indexes matching existing citations; retain no matched text or prior-reading identifiers in diagnostics.

Apply these concrete rules:

| Check                      | Rule and response                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scene declarations         | Reject unknown/duplicate/reused IDs, more than two unique IDs, missing required parent citations, or zero declared scenes in `framed` mode. Model candidates with a ready plan always use `framed`. `unframed/quiet` requires empty scene arrays and produces only `scene_unavailable` information. Server-only `minimal` requires empty scene arrays and produces a `scene_unavailable` warning with rule ID `template_editorial_failure`. |
| Observable support         | For each declared scene, match at least one object cue and one action cue in its paragraph after case/Unicode/punctuation normalization. Missing cues produce `scene_unverified` warning; paraphrases can be valid. Cue matches do not prove support.                                                                                                                                                                                       |
| Asserted personal events   | Reject narrowly recognized unqualified claims in a declared-scene sentence such as “you ignored the reply this morning,” “you accepted that task yesterday,” or “you missed the meeting earlier today.” Require second-person past action plus a personal time marker and no conditional construction in that clause. Maintain paired positive/negative fixtures; broader biography remains a human-review responsibility.                  |
| Exact sentence duplication | Reject a normalized sentence of at least eight words repeated in the same body. Normalize with NFKC, lowercase, straight apostrophes, punctuation removal and collapsed spaces. Do not remove numbers, negate words or stem meaning. A repeated published sentence still needs only one occurrence.                                                                                                                                         |
| Repeated phrasing          | Warn when a contiguous six-word sequence occurs at least three times across at least two distinct sentences; count non-overlapping occurrences. Report one issue per paragraph, not every overlapping n-gram.                                                                                                                                                                                                                               |
| Stock abstractions         | Warn on complete phrases: “trust the process,” “embrace the journey,” “step into your power,” “align with your authentic self,” “everything happens for a reason,” “navigate these energies,” and “lean into this transformation.” Match token boundaries, not substrings. A quoted phrase can still be observed but never triggers rejection by itself.                                                                                    |
| Example copying            | Reject a complete normalized demonstration sentence of at least ten words when copied into live text, unless that exact sentence is independently present in supplied published copy. Shared short expressions and ordinary vocabulary pass.                                                                                                                                                                                                |
| Recent reuse               | Warn if the first eight words of the first non-required sentence repeat an eligible recent opening, or a complete sentence of at least twelve words repeats a recent sentence. Exclude only required literal chronology sentences from this cross-day comparison, not arbitrary repeated prose. Do not reject an otherwise valid reading solely for cross-day reuse.                                                                        |

Literal legitimate language such as “leave space between appointments,” “align the columns,” or “the energy needed for a task” must pass without an abstraction issue. An editorial warning does not make a reading unsafe. Warning-only candidates remain accepted and measurable; do not replace a useful paragraph solely because a common word appears in it.

Report the highest issue severity: any reject yields `reject`, otherwise any warning yields `warning`, otherwise `pass`. Informational unavailable-scene reports alone still pass. Use `not_evaluated` with no issues only when an earlier generation/safety/reference failure prevented this checker from running; do not claim an editorial pass for such a candidate.

A reject uses the established whole-draft template fallback with a new closed generation code `writing_quality`. Store the detailed editorial result separately from safety/reference diagnostics. Preserve the rejected candidate's code-only report and the final template's report; the UI should not imply the model failed safety. No automatic repair/retry call. A template content defect is an editorial source issue: use the verified minimal fallback described below and record it, without a regeneration loop.

These checks detect specific observable failures. They do not prove that the model used exactly two meaningful scenes, that all claims follow from the source, or that a question has only one conceptual focus. Human qualification below remains necessary; recommendation 6 can add a calibrated semantic reviewer later.

## Local repetition history

Add `loadRecentDailyWritingBodies(db, userId, snapshotId, day, timezone, dek): Promise<RecentDailyWritingHistory>` in `pattern.server.ts`. Call it only on a new reading generation, after the cache lookup. Query at most four candidate rows for each of the preceding three civil days, restricted to the same owner and snapshot, ordered by creation time descending with ID as a stable tie-breaker. Decrypt and filter their saved effective timezone locally; take the newest valid matching row per day, up to three bodies. Twelve rows is the total inspection cap, including excluded rows. Report bounded availability/omission counts and stop at the cap; a day with four unusable candidates may supply no comparison. Do not include today, future days, other accounts or another snapshot. Use civil-date arithmetic, not three multiples of 24 hours around DST.

Only use rows with authenticated/decryptable saved paragraph boundaries and the new writing envelope's validated `astroParagraphCount`. Slice exactly those astronomical paragraphs. Never infer the boundary by stripping wellness phrases, read journal entries, or forward historical text to the gateway. Legacy/unavailable history contributes no comparison; a corrupt optional history row is excluded with a closed local availability code. Corruption of the current requested reading still follows the strict owner-read error path.

History warnings are diagnostic and cannot change the request, select an external tone/depth, alter the primary, or trigger another call. They do not enter the immutable reading identity; the saved report is a record of the history available when that reading was made. Broader multi-day experiments belong to recommendation 6.

## One focused local reflection question

Create `src/lib/content/daily-reflection.ts`, exporting `dailyQuestionProblem(text): "shape" | "compound" | "unsafe" | null` and `resolveDailyReflection(plan: DailyWritingPlan, legacyPrimaryQuestion: string | null, context: ReadingContext): DailyReflectionPlan`.

```ts
interface DailyReflectionPlan {
  version: "daily-reflection-1";
  question: string;
  themeFactId: "I1" | "S1" | null;
  frameKey: string | null;
  variant: "standard" | "high_stress" | "low_sleep" | "legacy" | "fallback";
  localSource: "WEL-03" | "WEL-01" | null;
}
```

Validate one trimmed line, one sentence, at most 220 characters, exactly one final question mark, no headings/prefaces/list markers/semicolon, and no preceding instruction. Reject common joined interrogatives such as “what … and how …” or “which … and which …”; allow coordinated nouns such as “the obligation and the opportunity.” Apply existing safety and daily placement restrictions independently. Review published questions for a single mental task because punctuation alone cannot establish focus. Do not repair an invalid two-question string by truncating it or deleting punctuation.

Select exactly one question:

1. Use the selected frame's standard question, tied to `S1` or `I1` as above.
2. Preserve the existing local wellness precedence only through reviewed variants of that same question: consented `WEL-03` reflection use and stress `>= 4` may select `highStress`; otherwise consented `WEL-01` reflection use and sleep `<= 2` may select `lowSleep`. Missing or invalid variants retain the standard question. Never choose an unrelated wellness question.
3. Without a frame, use a valid single legacy primary question only when the theme is `I1`. A selected `S1` without a frame uses the relationship fallback below. No domain question is appended.
4. Use a fixed safe fallback for an invalid/missing question: tension, “Which ordinary choice brings these competing demands into focus?”; reinforcement, “Which ordinary choice could give both priorities a place?”; primary interpretation, “Where could this theme show up in one ordinary choice?”; quiet/no primary, “What has your attention today?”

For the expansion/capacity frame, a high-stress variant can be “Which existing commitment could be made a little smaller?” and a low-sleep variant “Which commitment would be simplest to reconsider?” All are one question about capacity. They assert no diagnosis or known event. This replaces current concatenation; it does not expand the registry's allowed uses or derive any provider setting from wellness. A selected variant and its final text stay local, including when the model fails or is unavailable.

Keep the public API's existing `reading.prompt` field as the final question for compatibility. `ReadingProse.prompt` continues to pass through the server's choice; the model has no reflection field. Natal essays retain their separate reflection-question contract and cache/versioning.

## Deterministic template behavior

Build the template from the same writing plan. Remove the formulaic `Taking this gently:` and `Observation:` prefixes from daily templates. Use the primary interpretation and selected synthesis as the central body, inserting the first reviewed scene's conditional situation/focus once. The initial deterministic renderer uses one scene; the model may use one or both published scenes. Preserve natal/story content and their literal chronology/dependencies when available. Omit optional domain/phase/timing filler from the framed template; retain calculated detail and supporting contacts in evidence/timing instead of automatically appending an “Also in range” prose list.

Use an explicit sentence-aware paragraph packer over `plan.templateSources`, preserving complete sentences and their associated citations. The frame's `templateSentenceIndex` makes the compact source selection reproducible; if no sentence works independently, edit and review the published mechanism before release. Keep all selected natal/chapter mechanism sentences and the unchanged literal chronology. Pack required source sentences into one or two initial paragraphs, preserving the prior coverage rules and at most four sentences/200 words/1,600 characters per paragraph; the first sentence uses `I1`, with `S1` next when present. Keep them together if they fit one paragraph; otherwise select the earliest legal split between complete sentences. If no split fits, fail template preflight rather than shortening or dropping required meaning. Put the scene situation/focus together in the next paragraph. This yields two or three paragraphs for normal reviewed sources. Prove the combined `I1/S1/N1/A1/P2` release fixtures fit structural limits and depth aims; keep aiming limits distinct from hard caps and do not pad. Legacy template behavior can remain available when no reviewed frame exists.

If the new framed template itself fails a blocking writing check, render those same required source sentences without the optional scene, using the server-only `minimal` render mode and `template_editorial_failure` reason. Preserve the ready source plan as historical evidence; record empty final scene use and a degraded-quality warning rather than altering that plan or claiming a scene was used. The model cannot request this exemption. A minimal template may contain one paragraph when only one compact primary sentence exists; the two-to-four-paragraph model contract stays unchanged. Retain source/citation/chronology validation, exactly one local reflection and saved paragraph boundaries. The minimal fallback is prevalidated against the release fixtures; if required source/chronology cannot be rendered validly, fail the generation cleanly instead of saving a false successful reading. A minimal result preserves availability but does not satisfy the concrete-writing qualification gate. No fallback recursively retries or calls a model.

## Saved evidence, privacy and cache

Save `language_meta.daily_writing_ct` with the owner's existing DEK as an AES-GCM version-1 envelope containing `readingId`, `snapshotId`, `releaseVersion`, `primaryCycleKey`, exact writing plan, final render mode, declared scene use, reflection plan/question, effective timezone, `astroParagraphCount`, candidate/final quality reports and `RecentDailyWritingHistory.availability`. Scene-use records are `{ id: "SC1" | "SC2", paragraph: number }`, with one-based positions validated against the saved plan and astronomical paragraph range. Store no historical body inside the new envelope; keep recent text in memory only. The minimal final fallback records no scene use plus its explicit `template_editorial_failure` reason. Validate envelope bindings against the containing row and restored source/paragraph evidence.

For newly instrumented readings, store `daily_readings.prompt = null`; retrieve the final question from this envelope for owner responses and exports. Retain legacy clear-column reads when the envelope is absent. A present malformed/undecryptable envelope or an envelope bound to the wrong saved reading/release/primary is a read error, never a request to recalculate from today's content. The encrypted envelope prevents newly selected wellness reflection variants from being duplicated in clear metadata. This change does not retroactively migrate historical questions or claim to remediate every existing wellness-provenance field; recommendation 5 owns that broader review.

Extend the async owner `readingLanguage` restoration from recommendations 2/3 and add `readSavedDailyWriting(row, dek)` with strict version/identity/paragraph validation. Restore the exact saved question and source/scene evidence after a cache hit. New reading creation, owner export, account erasure and failure-to-save-source behavior must all include the new envelope. Do not send reflection variants, raw history, matched phrases or scene text to admin quality telemetry. It may receive bounded writing-policy versions, outcome, issue codes and counts only.

Add writing-plan, quality-check, reflection and voice-example versions to the existing HMAC cache inputs alongside prompt/validator/model, source content, snapshot, consent and local context. Use canonical effective content/plan inputs and exclude randomized ciphertext, prior-reading text and warning timestamps. Updating the voice examples or reflection/compiler/checker policy yields a new immutable reading; old IDs, bodies and feedback remain intact. Reopening a valid cached reading performs no history query, model call or source recalculation for the saved writing evidence.

Owner evidence can show “Published illustration” and “Used by this paragraph,” with the saved parent interpretation/synthesis and scene wording. Explain that it is a possible example. The main reading does not display internal scene IDs, quality scores or a safety warning for ordinary editorial observations. Keep the existing reflection area and accessible evidence/paragraph links; no additional question panel or motion system is needed.

## Versions and qualification

Implemented identities are content `builtin-0.8.0`/schema 5, plan `daily-concrete-writing-1`, quality `daily-writing-quality-1`, reflection `daily-reflection-1`, examples `daily-voice-examples-1`, prompt `daily-astro-body-14`, validator `daily-reference-11`, and fixtures `synthetic-daily-7`. Original prompt 8 / validator 7 / fixture v6 reservations were superseded before implementation. Schema-4 serving separately uses prompt 15 / validator 10 and `primary-reflection-1`; numerical prompt order does not imply that it enables concrete writing. Keep diagnostics/report envelope version 1 and tolerant historical readers. See the [current execution reference](../plans/2026-10-12-release-completion-checklist.md#current-execution-reference).

The implemented suite preserves the 38 version-6 cases and adds twelve: `writing-reply-scene`, `writing-calendar-scene`, `writing-default-task-scene`, `writing-synthesis-focus`, `writing-legacy-no-scenes`, `writing-example-isolation`, `writing-tone-plain`, `writing-tone-warm`, `writing-tone-clinical`, `writing-technical-scene`, `writing-recent-repeat`, and `writing-all-evidence`. `synthetic-daily-7` has 50 cases and at most 49 model attempts with complete primary copy; only the existing quiet case skips. The original proposed 48/47 total was corrected before implementation. Synthetic recent text is fixed fixture data consumed locally. No user record or real ephemeris service is read by the runner.

Keep a separate handwritten candidate corpus for hard rejection and false-positive checks: duplicate sentences; unknown scenes; citations without required parents; copied example sentence; asserted event versus conditional version; literal space/alignment/energy vocabulary; one stock phrase warning; valid paraphrase without exact cues; required chronology repeated across days; a repeated opening; and a valid fallback. Ordinary safety/reference tests remain distinct and are not weakened to make writing checks pass.

Prepare fresh baseline/candidate runs on identical version-7 inputs/content/history/provider-model and earlier feature policies, changing only the declared concrete-writing policy. Release-completion Task 13 owns the four-arm design, review-tooling gaps and provider/baseline alignment required before freezing new plans. Freeze case, catalogue, example and source hashes. Offline replay establishes deterministic validation behavior only. Actual generated-text comparison requires an explicitly authorized synthetic evaluation with attempt and dollar ceilings.

Blind-review central-theme coherence, scene support/concreteness, natural voice, useful variation and one-question focus on 1–5 scales. Record `inventedEvent`, `exampleSubjectLeak`, `unrelatedScene`, `multipleQuestionFocus` and `unsupportedMeaning` booleans. Every framed candidate and template must score at least 4 for coherence, scene support and question focus, with all five failure flags false. Ready-frame qualification fixtures must require no minimal fallbacks. Review all three tones and both depths; a clinical reading must still sound like direct human prose. The combined-evidence case must retain the central thread and one or two situations. Negative/legacy cases must remain useful without invented scaffolding.

Compare baseline and candidate means and paired changes, and report warning/rejection/fallback rates, latency and cost separately. Require no decline in grounding or voice and a higher mean concreteness/question-focus score for the previously abstract or compound-question cases. A test passing, a cited scene ID, or a cue match is not proof of better writing. Recommendation 6's future calibrated semantic reviewer can use these artifacts; it is not a required extra production call here.
