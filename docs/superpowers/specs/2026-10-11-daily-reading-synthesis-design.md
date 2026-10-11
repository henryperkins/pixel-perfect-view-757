# Daily reading synthesis design

Status: design contract for recommendation 1, “Expand the interpretation library into a synthesis library.” Prepared against local `main` at `d7a77f6` on 2026-10-11; implementation now exists locally on `feat/daily-reading-synthesis`. Actual-model writing qualification and publication remain pending. The checklist and local validation record track current evidence.

The reading should explore one supported relationship between its strongest two eligible contacts when a reviewed relationship exists. Calculation, published interpretation, and the language model's wording remain distinguishable.

## Scope

- Resolve curated meanings for the existing strongest-three eligible cycles, producing `I1`, `I2`, and `I3` where published copy exists.
- Select at most one published synthesis between `C1` and `C2`, producing `S1` for tension or reinforcement.
- Recognize an explicitly independent pair without inventing a joint story.
- Carry the same interpretation plan through template prose, model input, validation, saved evidence, cache reads, and evaluation.
- Include content authoring, release validation, drafting preservation, and immutable version handling because the reading must use the effective published graph.

Natal temperament, retrograde histories, wellness-derived external adaptation, ephemeris replacement, model upgrades, and global style changes are separate work. Existing chart ranking, eligibility threshold, suppression, headline, confidence, and local reflection assembly stay in their current roles.

## Verified starting points

- `src/lib/reading.server.ts` selects up to three eligible cycles but stores editorial meaning only for the primary cycle.
- `src/lib/content/default-bundle.ts` looks up aspect-family keys; different hard aspects can share one entry.
- `src/lib/ai/facts.ts` emits `C1–C3` and primary editorial references, without supporting meanings or synthesis.
- `src/lib/ai/language.server.ts` validates paragraph shape, IDs, and bounded contradictions; this does not prove semantic support.
- `src/lib/pattern.server.ts` persists only fact ID/statement pairs and records cited editorial provenance with a primary-only ID pattern.
- `activeBundle` spreads built-in defaults underneath an active bundle. A new synthesis field would therefore leak into legacy published bundles unless normalization handles absence explicitly.
- `draftRelease` currently constructs a reduced bundle and replaces its interpretation array. New fields and reviewed entries need explicit preservation.
- The signed ingest route currently upserts by release version. Differing content under one version would break cache and evidence identity.

## Editorial contracts

Keep existing `Interpretation` fields. Add optional `themes: ThemeTag[]`. Add optional `schemaVersion: 2` and `synthesisRules: SynthesisRule[]` to `ContentBundle`. Absence is the legacy format.

New rules or nonempty theme annotations require `schemaVersion: 2`. Preserve the raw published payload for identity/checksum checks; normalization produces a separate effective object.

```ts
type ThemeTag =
  | "structure"
  | "expansion"
  | "initiative"
  | "expression"
  | "connection"
  | "autonomy"
  | "rest"
  | "uncertainty";

type PairRelationship = "tension" | "reinforcement" | "independent";

interface SynthesisSelector {
  interpretationKey: string;
  theme: ThemeTag;
}

type SynthesisRule = {
  key: string;
  primary: SynthesisSelector;
  supporting: SynthesisSelector;
} & (
  | { relationship: "tension" | "reinforcement"; mechanism: string }
  | { relationship: "independent"; mechanism: null }
);
```

These tags describe reviewed editorial themes, not measured psychological properties. Do not infer them from a planet name, hard/soft classification, mood, or model output during reading generation.

New exact keys use `aspect:transitBody:natalPoint`, for example `square:saturn:sun`. Resolve these in this order:

1. Exact aspect/body/point.
2. Exact aspect/body/*.
3. Exact aspect/*/point.
4. Exact aspect/_/_.
5. Existing family/body/point.
6. Existing family/body/*.
7. Existing family/*/point.
8. Existing family/_/_.

An active interpretation array remains authoritative. Never search the built-in array after a miss in an explicitly supplied active array.

Synthesis selectors must reference fully specified exact-aspect entries in the same effective bundle. No wildcard selectors. Each selected tag must occur on its referenced interpretation. There can be only one rule per ordered pair of interpretation keys. Reversed pairs require their own reviewed rule; there is no automatic reversal or relationship inference.

Bound new graphs: at most 2,000 interpretations, 2,000 rules, three unique themes per interpretation, 100 characters per key, 1,000 characters per mechanism, and 300 characters per question. Reject duplicate keys, duplicate ordered pairs, unknown tags, dangling references, wrong tag references, unsafe copy, empty positive synthesis text, and non-null independent synthesis text. Do not sanitize a published graph into different text while retaining its identity.

Synthesis copy is reusable everyday interpretation. It must not contain fixed exact dates, orb measurements, sign/house placements, or unsupplied technical claims. Copy review checks its substantive meaning against both parent mechanisms.

Legacy partial bundles may retain the existing fallback for missing phases, domains, or natal copy. Explicit `cycles` arrays replace defaults. Legacy bundles without `synthesisRules` normalize to an empty rule list even if the new built-in bundle has rules. Do not add themes to legacy published entries from a separate built-in entry.

## Initial editorial coverage

Create complete reviewed entries and directional rules for these three pairs:

| Relationship  | First contact                | Second contact                    | Required theme distinction                                              |
| ------------- | ---------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| Tension       | Saturn square natal Sun      | Jupiter trine natal Mars          | Structure and capacity alongside expansion and initiative               |
| Reinforcement | Saturn trine natal Sun       | Mars trine natal Sun              | Sustaining a commitment alongside practical initiative                  |
| Independent   | Venus opposition natal Venus | Mercury conjunction natal Mercury | Preference/connection and expression without a supported shared premise |

Add both primary/supporting orientations: six rules, six exact contact entries. Review every orientation rather than mechanically copying conclusions. Each entry needs a mechanism, one reflection question, and one to three supported theme tags. Retain existing family entries as fallback copy. This is the initial reviewed catalogue, not a claim of universal pair coverage; unmatched pairs deliberately remain unsynthesized.

Illustrative tension copy for review:

> Giving a plan more scope can increase the structure needed to carry it. A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.

This copy is a proposed editorial possibility, not a claim that the reader has such a task. A reviewer must confirm that both parent interpretations support it.

### Reviewed seed entries and directional rules (`builtin-0.5.0`)

#### Exact interpretations

1. `square:saturn:sun` (themes: `["structure", "autonomy"]`):
   - Mechanism: An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.
   - Question: What responsibility is currently asking for clearer boundaries?
2. `trine:jupiter:mars` (themes: `["expansion", "initiative"]`):
   - Mechanism: Enthusiasm and practical initiative reinforce one another when an aim is well chosen. Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.
   - Question: Where does your initiative have room to expand?
3. `trine:saturn:sun` (themes: `["structure"]`):
   - Mechanism: Durable progress comes from small, dependable actions repeated without drama. Saturn's trine to the Sun frames the quiet satisfaction of upholding a commitment at an even pace, where patience stabilizes long-term direction.
   - Question: Which commitment feels worth sustaining at a steady pace?
4. `trine:mars:sun` (themes: `["initiative"]`):
   - Mechanism: Energy flows easily when action lines up with what matters to you. Mars's trine to the Sun frames direct engagement with an immediate task, reducing hesitation and allowing effort to produce tangible results.
   - Question: Where can you apply direct effort without second-guessing yourself?
5. `opposition:venus:venus` (themes: `["connection"]`):
   - Mechanism: Recognizing personal preferences can involve noticing a contrast with what others want or expect. Venus's opposition to natal Venus brings differences in taste and social ease into view, clarifying what you genuinely value in company and quiet.
   - Question: What preference becomes clearer when you compare your pace with others?
6. `conjunction:mercury:mercury` (themes: `["expression"]`):
   - Mechanism: A cycle of thought and communication resets with fresh curiosity. Mercury's conjunction with natal Mercury sharpens interest in new phrasing, questions, or ideas, bringing mental focus back to how you articulate what you mean.
   - Question: What topic or question is currently holding your attention?

#### Reviewed directional rules

1. `square:saturn:sun_tension_trine:jupiter:mars` (relationship: `tension`):
   - Primary: `square:saturn:sun` (`structure`), Supporting: `trine:jupiter:mars` (`expansion`)
   - Mechanism: Giving a plan more scope can increase the structure needed to carry it. A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.
2. `trine:jupiter:mars_tension_square:saturn:sun` (relationship: `tension`):
   - Primary: `trine:jupiter:mars` (`expansion`), Supporting: `square:saturn:sun` (`structure`)
   - Mechanism: Expanding the reach of a project tests the framework supporting it. Taking on a promising new direction while existing commitments are still demanding attention can highlight where capacity needs to catch up with ambition.
3. `trine:saturn:sun_reinforcement_trine:mars:sun` (relationship: `reinforcement`):
   - Primary: `trine:saturn:sun` (`structure`), Supporting: `trine:mars:sun` (`initiative`)
   - Mechanism: Steady persistence pairs naturally with targeted action. Focusing on a durable priority makes it easier to direct effort toward concrete, incremental steps without wasting momentum.
4. `trine:mars:sun_reinforcement_trine:saturn:sun` (relationship: `reinforcement`):
   - Primary: `trine:mars:sun` (`initiative`), Supporting: `trine:saturn:sun` (`structure`)
   - Mechanism: Active initiative finds firmer footing when backed by consistent habits. Putting energy into a defined routine or clear responsibility helps immediate progress hold its ground over time.
5. `opposition:venus:venus_independent_conjunction:mercury:mercury` (relationship: `independent`):
   - Primary: `opposition:venus:venus` (`connection`), Supporting: `conjunction:mercury:mercury` (`expression`)
   - Mechanism: `null`
6. `conjunction:mercury:mercury_independent_opposition:venus:venus` (relationship: `independent`):
   - Primary: `conjunction:mercury:mercury` (`expression`), Supporting: `opposition:venus:venus` (`connection`)
   - Mechanism: `null`

## Deterministic plan

Add a pure planner in `src/lib/content/synthesis.ts`:

```ts
interface ResolvedCycleInterpretation {
  index: 1 | 2 | 3;
  cycleKey: string;
  interpretationKey: string;
  mechanism: string;
  themes: ThemeTag[];
}

interface ReadingSynthesis {
  ruleKey: string;
  relationship: "tension" | "reinforcement";
  mechanism: string;
  dependsOn: ["C1", "I1", "C2", "I2"];
  releaseVersion: string;
}

interface DailyInterpretationPlan {
  interpretations: ResolvedCycleInterpretation[];
  synthesis: ReadingSynthesis | null;
  pairStatus: "selected" | "independent" | "unmatched" | "insufficient";
  pairRuleKey: string | null;
  releaseVersion: string;
}
```

`resolveInterpretationPlan(bundle: ContentBundle, eligibleCycles: CycleInstance[]): DailyInterpretationPlan` consumes the already-filtered, already-ranked top three. It neither changes ranking nor fetches data. Resolve copy separately for each cycle; omit unpublished fallback sentinels from `interpretations`. Match only the ordered `C1/C2` pair. `C3` can supply its own meaning but cannot replace `C2` merely to find a more dramatic pairing.

- Zero/one eligible contact: `insufficient`, no `S1`.
- Missing parent interpretation or no rule: `unmatched`, no `S1`.
- Explicit independent rule: `independent`, retain its rule key, no `S1`.
- Matching tension/reinforcement rule: `selected`, emit its exact published text as `S1`.
- Suppressed, weak, nonfinite, and fourth-or-lower cycles can never contribute parents.

Make equal-importance selection stable with `cycle_key` as the reading-boundary tie-breaker. This only resolves ties; it does not replace the existing ranking formula.

## Facts, generation, and fallback

Add `interpretationPlan` to `AssembledReading` while retaining existing primary `editorial` fields for domain, phase, and timing.

Extend `FactAtom` with optional `kind` (`calculation | interpretation | synthesis`), `dependsOn: string[]`, `sourceKey`, and `releaseVersion`. Optional fields keep saved historical atoms readable. Newly emitted interpretation and synthesis atoms always include these fields.

- `I1/I2/I3` map to the same-index `C1/C2/C3`; metadata records that parent.
- `S1` is `kind: synthesis` and records all four parents plus the rule key and release version.
- `S1` has no `cycle` geometry payload and is never categorized as a calculated fact.
- All fact IDs are unique; all dependencies exist; the graph is acyclic; `S1` parents match the selected two contacts and their interpretation keys. Reject a `C1/C3` substitution and cross-release editorial dependencies. Historical test/input atoms without the new optional metadata remain valid unless they attempt to supply `S1`; `S1` always requires the complete new metadata.
- Preserve existing geometry statements and primary `D1/P1/T1/E1/U1/U2` behavior.

Format the prompt with selected synthesis first when present, then primary meaning, supporting meanings, optional primary framing, and calculated references/limits. Include all supplied statements with their IDs. Do not send personal context or authoring notes.

Use a daily-only system brief that identifies calculated references and published interpretations as different kinds of evidence. Retain the existing prohibitions on invented facts, predictions, directives, and personal-state assertions. Other callers of the shared gateway keep their current system brief.

The first paragraph still cites `C1` and `I1`. When `S1` exists, paragraph 1 or 2 must cite `S1` and explicitly include `C1, I1, C2, I2`. Every paragraph citing `S1` must carry those parents. Technical claims still require the directly cited matching calculated cycle; editorial or synthesis IDs cannot stand in for geometry.

When `S1` is absent, keep `C1` as the focus and do not invent a relationship. `I2/I3` may provide separately supported context. A generic wildcard interpretation does not itself authorize synthesis.

Reject malformed fact graphs before any model request with a closed `InvalidDailyFactGraph` error. Do not send partial or guessed graphs. If `I1` is unavailable, return the established deterministic primary body without a model call and record `skipped/no_interpretation`. Quiet days remain `skipped/no_cycle`.

The deterministic astronomical body includes selected published synthesis once, immediately after the primary mechanism and before optional framing/timing. Primary headline, confidence, and reflection assembly remain deterministic. Model rejection or gateway failure returns this same synthesis-aware body. For independent/unmatched pairs, retain the primary template and existing supporting-calculation summary.

## Provenance and versioning

Save full safe fact metadata alongside statements in `language_meta.facts` and restore it on cached reads. Also save bounded `interpretationPlan` identity: selected keys, pair status, rule key, and content version. Existing JSON columns can carry this; no new database columns are proposed.

Record `I1–I3` and `S1` in the content provenance lane only when actually used in displayed model paragraphs; keep available-but-uncited facts in the saved supplied-reference list. For template prose, record the editorial references used by that template. Use the existing published-content source policy; no new external data source or consent bypass.

Display `S1` as “Published synthesis,” with its saved relationship and links to saved parent facts. Historical references lacking metadata retain their current display. Never reconstruct an archived synthesis from today's content bundle.

Use `DAILY_READING_PLAN_VERSION = "daily-synthesis-1"`, `DAILY_PROMPT_VERSION = "daily-astro-body-5"`, `DAILY_VALIDATOR_VERSION = "daily-reference-4"`, and built-in bundle `builtin-0.5.0`. Include plan/prompt/validator/model identity in the daily idempotency digest in addition to current context and content version. Retain old rows, IDs, and feedback. Preserve the one-call 20,000 ms gateway policy and existing response schema.

Add closed diagnostics codes `dependencies`, `synthesis_coverage`, and `no_interpretation`. Keep diagnostics envelope version 1 and historical codes readable; extend valid skipped outcomes to `no_cycle` or `no_interpretation`. Label and count those skip reasons separately.

## Content lifecycle

Use one schema/normalizer at runtime loading, signed ingestion, draft publication, admin activation, and signed rollback. Validate before any content write or active-pointer change. A malformed graph must not deactivate the current release.

Publish reviewed new content under a new version. An identical signed-ingest replay reuses the stored row/checksum; conflicting content under the same version returns HTTP 409 without modifying the row or pointer. Object-property ordering is irrelevant to equality; array order is material. Preserve existing signature/checksum protocols.

Draft generation overlays returned keys onto the full effective base bundle, retaining untouched entries, domains, phases, natal copy, themes, schema version, and rules. Changed interpretation text loses inherited theme approval; remove dependent rules from that candidate and record their keys in draft notes for editorial review. Unchanged reviewed rules remain. Model-produced copy must not automatically acquire reviewed themes.

The admin draft preview shows affected interpretation keys, theme tags, pair-rule relationship, and any removed rule keys. Validate its graph before publication. Previewing/publishing an inactive candidate must not silently activate it.

## Completion criteria

Complete means source resolution, planning, templates, model input, validation, persistence, evidence display, content lifecycle, cache identity, and evaluation all implement this contract. Every structural check needs a meaningful test. Human review of actual generated synthetic candidates must separately confirm support and writing quality; validator acceptance alone is insufficient.
