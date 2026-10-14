# Daily reading natal temperament design

**Status reconciled 2026-10-13:** Shipped in combined content `0.7.1` under the operator-approved lightweight writing gate. Implementation, targeted writing review and joint activation have evidence. The earlier exhaustive benchmark requirements were superseded for that release decision; failed and partial full runs remain historical results. No human approval or full benchmark pass is claimed.

**Evidence and scope:** The [approved lightweight gate](../../reviews/daily-natal-lens/lightweight-readiness.md) replaces exhaustive paired inventories, two full reviewer passes and catalogue-wide review as release prerequisites, and explicitly makes a human-review program optional for that decision. Its [passing continuation](../../reviews/daily-natal-lens/2026-10-12-raw-draft-continuation/README.md) and the later [joint activation receipt](../../reviews/daily-transit-story/2026-10-12-transit-runtime-fix/README.md) supersede the old inactive/local-only status. Production chart screening and timing were checked; natal selection on the same chart was local evidence, not a new live model-writing review. The later schema-5/final-provider qualification remains separate in the [central closeout record](../plans/2026-10-12-release-completion-checklist.md#reconciled-status). No new production check was performed for this reconciliation.

The daily reading can offer one reviewed natal lens through which to consider its primary contact. A calculated placement is evidence for selecting an astrological interpretation; it does not establish the reader's temperament, feelings, life history, or psychological functioning.

## Scope and implementation order

The [recommendation 1 checklist](../plans/2026-10-11-daily-reading-synthesis-checklist.md) supplies shared bundle validation, interpretation planning, fact dependencies, saved evidence, cache policy, and sixteen preserved cases. Its focused foundation suite passed 34/34 before natal implementation. Its actual-model writing gate remains open; the user authorized proceeding with local natal implementation against those shared foundations.

This work adds a reviewed natal catalogue, a conservative birth-window screen, a pure lens selector, one optional daily atom `N1`, and complete saved evidence. It covers personal-planet signs, service-reported natal aspects, and source-qualified Placidus house context. Angles, nodes, configurations, inferred psychological profiles, learned traits from feedback, retrograde histories, and wellness-derived provider adaptation are outside this increment.

The existing cycle ranking, strongest-three cap, threshold `> 0.02`, synthesis selection, headline, confidence, and locally assembled reflection question retain their roles. A quiet day does not turn into a natal personality report.

## Verified starting points — historical, 2026-10-11

- `src/lib/astro/chart.ts` records positions, per-aspect service/in-app provenance, Placidus or fallback house assignments, and birth-time uncertainty. Accuracy values are `exact`, `near`, `hour`, and `unknown`, mapped to ±2, ±15, ±60, and ±720 minutes.
- `exact` is a user-declared accuracy band, not verification of a birth certificate. `housesReliable` alone does not establish that a particular house or sign is stable.
- The Swiss client supplies central chart positions, houses, angles, and aspects. Missing service houses/angles can yield mixed provenance; missing service aspects can yield in-app aspects. Neither an engine name nor overall high precision proves every item came from the service.
- Current Moon/Ascendant spread estimates do not check sign or house boundaries. The chart's aspect orbs are rounded for display; the client retains unrounded service values before chart assembly.
- `saveBirth` persists snapshots with JSON house metadata; `getToday` does not perform a Swiss calculation. Existing snapshots lack a natal-lens reliability manifest.
- Daily facts currently contain no natal temperament. The daily validator rejects sign names and individual house placements even when the time is exact.
- Existing registry sources `AST-05`, `AST-07`, `AST-08`, and `AST-20` permit `external_language`; raw birth details and check-in, wellness, journal, ambient, and feedback inputs do not. Derived natal wording is still personal chart-derived information, not anonymous data.
- Fact statements and source details currently persist in clear JSON, while reading bodies and paragraph boundaries are encrypted. Personal natal interpretations and their detailed origins need their own encrypted envelope.

## Published catalogue

Extend `ContentBundle` with optional `natalLenses: NatalLensRule[]` and `schemaVersion?: 2 | 3`. Schema 3 extends schema 2; it retains all synthesis validation, allowing the existing synthesis fields in either version. A nonempty natal catalogue requires schema 3. Legacy bundles without `natalLenses` normalize to `[]`, never to the new built-in catalogue. An explicitly supplied active array is authoritative, including an empty array.

```ts
type NatalPersonalBody = "sun" | "moon" | "mercury" | "venus" | "mars";
type NatalLensRole =
  "emotional_reflex" | "self_direction" | "expression" | "preference" | "initiative";
// Reuse the existing Body and Sign types from ephemeris.ts.
type NatalSignSelector = {
  kind: "sign";
  body: NatalPersonalBody;
  sign: Sign;
};
type NatalAspectSelector = {
  kind: "aspect";
  a: NatalPersonalBody;
  b: Exclude<Body, "node">;
  aspect: AspectKey;
  maxOrb: number;
};
type NatalHouseSelector = {
  kind: "house";
  body: NatalPersonalBody;
  house: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};
interface NatalLensRule {
  key: string;
  role: NatalLensRole;
  anchorNatalPoints: NatalPersonalBody[];
  selectors: [NatalSignSelector] | [NatalSignSelector, NatalAspectSelector | NatalHouseSelector];
  mechanism: string;
}
```

Reuse the existing `Sign` union and `SIGNS` constant; do not create another sign type or order table. Roles map to the first selector's body: Moon/emotional reflex, Sun/self direction, Mercury/expression, Venus/preference, Mars/initiative. The second selector concerns that same first body; an aspect's other body must differ. Nodes and angles are not accepted selectors. No wildcard selectors, inferred element/modality keywords, freeform personal traits, or model-generated rule selection.

Bounds: 2,000 rules; 100 characters per unique opaque key; 1–5 unique anchor bodies; one or two selectors; aspect `0 < maxOrb <= 3`; mechanism 1–700 characters and 1–3 complete sentences. Reject duplicated canonical selector/anchor combinations, unsupported bodies/signs/roles, invalid houses, empty copy, and contradictory selector forms. Aspect matching treats the two body names as an unordered pair while retaining the rule's role-bearing body.

Mechanisms contain a specific interpretive possibility and a conditional everyday comparison. They contain no planet/sign/house names, technical measurements, fixed dates, birth details, diagnosis, biological explanation, identity certainty, prediction, directives, or claims about another person. Reuse existing safety checks and a daily natal wording policy. Human editorial review remains necessary: lexical checks cannot establish substantive support or psychological truth.

Seed 60 individually reviewed sign entries: five personal bodies × twelve signs. Moon entries can anchor any of the five supported daily natal targets, but serve a non-Moon target only as the fallback in the selection order below; other single-sign entries anchor only their own body. The catalogue ships in the inactive candidate bundle `builtin-0.6.0`, never in the built-in fallback (`builtin-0.5.0`), so deploying code cannot activate lenses. Do not automatically produce the Cartesian copy from adjectives or attach approval to generated text. Add two individually reviewed compound Moon entries:

1. Capricorn Moon plus service-reported Moon trine Saturn, `maxOrb: 3`: a possible preference for dependable structure with a distinction between useful support and taking on every obligation.
2. Capricorn Moon in service-qualified house 6: the same interpretive preference illustrated through ordinary routines or manageable tasks. A house describes an editorial life-area comparison, not proof of occupation, health, or a personality trait.

Use opaque keys such as `nl-moon-10`, `nl-moon-10-aspect-01`, and `nl-moon-10-house-01`; the key is not provider input. The initial 62 entries are a reviewed catalogue with explicit coverage, not a universal psychological taxonomy.

Illustrative copy to review, not automatically approved production text:

| Origin retained locally | Candidate meaning sent as `N1`                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Capricorn Moon          | A self-contained response to pressure can start with sorting what is manageable before sharing it. An unfinished reply can offer a place to notice the difference between useful preparation and waiting to have everything settled. |
| Sagittarius Moon        | Room to choose the route can matter as much as finishing the task. If an ordinary obligation feels narrow, the useful distinction may be between the commitment itself and how much choice it leaves in carrying it out.             |

Neither example establishes that this is the reader's actual response. The primary-cycle interpretation supplies today's subject; `N1` offers a conditional distinction within it.

## Birth-window screening and source reliability

Create `src/lib/astro/natal-reliability.ts` and `natal-reliability.server.ts`. The pure module exports `NATAL_RELIABILITY_VERSION = "natal-reliability-1"`, manifest types, `validateNatalReliability(value: unknown, fingerprint: string, accuracy: TimeAccuracy): NatalReliabilityManifest`, and `assessNatalReliability(samples: NatalWindowSample[], fingerprint: string, accuracy: TimeAccuracy): NatalReliabilityManifest`. The server module exports `resolveNatalReliability(input: BirthInput, fingerprint: string, center: EphemerisResult): Promise<NatalReliabilityManifest>`.

A sample contains its signed `offsetMinutes`, its `Chart`, and the raw `EphemerisResult` returned by the service client. Use raw service aspect orbs, not chart display rounding. The manifest binds its version, chart fingerprint, declared accuracy, exact sample offsets, engine versions, and accepted sign/aspect/house evidence. Evidence is retained only for the tracked personal bodies and non-node aspects touching them. Keep it bounded to five signs, 45 unordered body pairs, and five houses.

```ts
type SampleTriple<T> = [T, T, T]; // before, center, after
type NatalHouseNumber = NatalHouseSelector["house"];
interface NatalWindowSample {
  offsetMinutes: number;
  chart: Chart;
  ephemeris: EphemerisResult;
}
type NatalLensEvidence =
  | {
      kind: "sign";
      body: NatalPersonalBody;
      sign: Sign;
      source: "service";
      longitudes: SampleTriple<number>;
      marginsDeg: SampleTriple<number>;
    }
  | {
      kind: "aspect";
      a: Exclude<Body, "node">;
      b: Exclude<Body, "node">;
      aspect: AspectKey;
      source: "service";
      orbs: SampleTriple<number>;
      longitudes: SampleTriple<{ a: number; b: number }>;
    }
  | {
      kind: "house";
      body: NatalPersonalBody;
      house: NatalHouseNumber;
      source: "service";
      anglesSource: "service";
      system: "placidus";
      longitudes: SampleTriple<number>;
      cusps: SampleTriple<number[]>;
      angles: SampleTriple<{ ascendant: number; midheaven: number }>;
      marginsDeg: SampleTriple<number>;
    };
type NatalReliabilityManifest = {
  version: "natal-reliability-1";
  chartFingerprint: string;
  accuracy: TimeAccuracy;
} & (
  | {
      status: "screened";
      reason: null;
      sampleOffsetsMinutes: SampleTriple<number>;
      sampleEngines: SampleTriple<string>;
      evidence: NatalLensEvidence[];
    }
  | {
      status: "unavailable";
      reason: "unknown_time" | "service_unavailable" | "invalid_sample";
      sampleOffsetsMinutes: [];
      sampleEngines: [];
      evidence: [];
    }
);
```

Require the same Swiss engine/version across the three samples; retain an explicitly reported unknown version as unknown. Normalize longitudes to `[0, 360)`; validate stored margins against supplied geometry, each house cusp array as exactly twelve valid ordered values, house membership with the existing helper, and all aspect pairs as unique non-self pairs touching a personal body. A screened manifest can contain zero eligible records. Bound fingerprint/engine strings to 256/160 characters. Unavailable manifests carry no partial evidence. These proof records make owner read-back verifiable without a fresh calculation.

- `unknown`: return `unavailable/unknown_time` without additional requests; omit all natal lenses in this increment. The existing transit reading remains available. Do not treat noon as a confirmed time or use an invalid `approximate` accuracy label.
- `exact`, `near`, `hour`: reuse the central response and request the same Swiss service at UTC instant minus/plus the declared 2/15/60 minutes. Compute those instants by UTC elapsed-time arithmetic, without reinterpreting them as local civil times around a DST boundary.
- Skip boundary requests if the central result is degraded/unusable. Otherwise run the two boundary requests concurrently using the client's existing six-second deadlines. The birth calculation itself never retries; Today re-runs it only under the guarded policy in Snapshot integration. At most three Swiss calls per birth calculation including the existing center; boundary fetching is one concurrent batch under those deadlines. Keep central chart saving and degraded fallback operational when sampling fails.
- A sign qualifies only when all three samples have high-precision, non-degraded service positions, finite coherent longitude/sign values, the same sign, and distance at least `1.0°` from both sign boundaries in every sample. Recompute sign from the supplied longitude only to validate coherence; do not substitute an in-app position. Missing/nonfinite points are excluded.
- A natal aspect qualifies only when the same unordered body pair and exact aspect appear in all three raw service aspect lists, with finite nonnegative unrounded orbs and valid service positions for both bodies. Cross-check each reported orb against `abs(abs(signedDelta(lonA, lonB)) - ASPECTS[aspect].angle)` within `0.05°`; exclude inconsistent service geometry instead of repairing it. Its maximum sampled orb must be at most the selected rule's `maxOrb`; an in-app fill-in, absent list, duplicate/conflicting pair, node, angle, or mislabeled service item cannot qualify. Persist both longitudes in the encrypted proof so read-back can repeat the consistency check.
- A house qualifies only for `exact` (±2 minutes), with reliable houses and unsuppressed angles, service positions/houses/angles in every sample, a declared Placidus system, twelve valid ordered cusps, and the same house assignment in every sample. The body must be at least `0.5°` from every cusp in all three samples. Validate assignments using the existing service-cusp helper; expose that helper rather than adding another house system.
- Missing houses or aspects do not invalidate an otherwise eligible sign. Mixed provenance is evaluated per item. A failed/degraded boundary position response makes all natal evidence unavailable for that window.
- Validate encrypted manifests on read: supported version, matching snapshot fingerprint and accuracy, exact expected offsets, bounds, unique evidence, and the checks above. Absent legacy manifests mean no lens. A malformed or undecryptable present manifest is a read error, not a fabricated successful assessment.

This is a conservative three-sample screen with explicit margins, not a mathematical proof over every instant or a measurement of personality. Evidence UI must say “Checked at the recorded time and both uncertainty boundaries.” Do not label the result “verified temperament,” “certain placement,” or “confirmed birth time.” Improving interval certification later requires a new reliability version and separate qualification.

## Snapshot integration

Run the reliability resolver during `saveBirth`, after the central service response is available. Store the manifest as `houses.natalReliability_ct`, encrypted with the existing user DEK. Retain existing positions, service provenance, houses, aspects, uncertainty, and contract fields. No new table or schema migration is needed.

Add `loadNatalReliability(snapshot: SnapshotRow, dek: CryptoKey): Promise<NatalReliabilityManifest | null>` in `pattern.server.ts`. Load it once for daily assembly. Existing chart snapshots without the field remain usable with primary/synthesis readings and no `N1`. The existing birth recalculation path creates a new assessment when the user saves/recalculates birth details. While the active release carries a natal catalogue, Today also re-runs a missing, stale-version or retryably failed (`service_unavailable`, `invalid_sample`) screen through that same calculation before computing the reading's identity: at most once per six hours per snapshot (`houses.natalReliabilityCheckedAt`), never for an unknown time, and only with a configured service. It stores only an improvement (a screened assessment or a no-longer-degraded chart); otherwise it records the attempt time, which never enters cache identity. Existing readers therefore receive lenses after activation without re-saving, at the cost of up to three Swiss requests on their next Today load. A manifest from another reliability version is stale rather than corrupt: it supplies no lens and is re-screened. New manifest/source data participates in the keyed cache identity even when the birth fingerprint is unchanged.

## One deterministic daily lens

Create `src/lib/content/natal-lens.ts`:

```ts
interface SelectedNatalLens {
  ruleKey: string;
  role: NatalLensRole;
  mechanism: string;
  anchorCycleKey: string;
  dependsOn: ["C1", "I1"];
  evidenceId: "NL1";
  evidence: NatalLensEvidence[]; // discriminated sign/aspect/house proof records
  screen: {
    // private archived source labels, omitted from prompts/clear metadata
    accuracy: TimeAccuracy;
    sampleOffsetsMinutes: SampleTriple<number>;
    sampleEngines: SampleTriple<string>;
  };
}
interface DailyNatalLensPlan {
  version: "daily-natal-lens-1";
  reliabilityVersion: string | null;
  releaseVersion: string;
  status:
    | "selected"
    | "no_cycle"
    | "no_interpretation"
    | "unreliable"
    | "unsupported_anchor"
    | "unmatched";
  lens: SelectedNatalLens | null;
}
```

`resolveDailyNatalLens(bundle: ContentBundle, primary: CycleInstance | null, interpretation: ResolvedCycleInterpretation | null, reliability: NatalReliabilityManifest | null): DailyNatalLensPlan` reads only these inputs. It cannot access check-ins, wellness, journal, marked moments, feedback, ambient context, profile names, feature scores, or a model.

Require a published `I1`, a supported personal-body `C1` target, and eligible evidence for every selector. Match only rules whose anchor list includes that target. Select at most one in this order (`daily-natal-lens-2`):

1. Rules for `C1`'s own personal-body target: sign plus service aspect, then sign plus source-qualified house, then the single sign.
2. For a non-Moon target with no such match, Moon rules in the same order, as the fallback.

The lens therefore follows the day's contact rather than repeating the Moon text for every target. For multiple rules in one tier, use ascending opaque rule key with a fixed code-point comparator. Never select a weaker cycle to manufacture a temperament match, combine unrelated rules, infer a missing trait, or use importance/feedback to rank natal psychology. A cusp-screened target sign may fall back to a reliable Moon sign, and an unscreened Moon never blocks the target's own sign; unavailable evidence or missing catalogue copy yields no lens.

Add `natalLensPlan` to `AssembledReading`. Extend `assembleReading` with a fifth optional parameter `reliability: NatalReliabilityManifest | null = null`, preserving existing callers. Template prose appends the selected mechanism once to the primary interpretation paragraph. If synthesis is also selected, keep that shared relationship in its existing position. Template assembly and model facts use this exact same plan. No lens changes the headline, confidence, primary cycle, or reflection question.

## Provider facts, prompt, and validation

Extend daily `FactAtom.kind` with `temperament`. Newly emitted `N1` includes `dependsOn: ["C1", "I1"]`, `sourceKey`, `releaseVersion`, and `natalEvidenceId: "NL1"`; it has no `cycle` payload. Its dependencies establish reading relevance, not a claim that the transit calculated the natal trait. The encrypted local evidence is its chart basis.

Provider statement format:

```text
N1: Published natal lens, an interpretive possibility: <exact reviewed mechanism>
```

Only that ID and statement appear in the provider fact block. Rule selectors/keys, role labels, signs, houses, natal aspect geometry, fingerprints, raw birth details, manifests, and user IDs stay out of the request. Existing permitted `C1–C3` transit geometry is unaffected. Do not send the whole plan as JSON or include raw origins in a debugging message. Removing origins minimizes disclosure; derived wording still conveys personal chart-derived information and can permit inference.

Extend `assertDailyFactGraph` for `N1`. Add `assertNatalLensFact(facts: FactAtom[], plan: DailyNatalLensPlan): void` at fact assembly: exact published mechanism, one atom only, same release, selected anchor, correct two dependencies, local evidence ID, and absence of geometry. Reject invented `N2`, cross-release or missing parents, stale manifests, or arbitrary temperament atoms before provider traffic. The generator also enforces the fact graph for direct internal callers.

Place the optional natal lens after the selected synthesis/primary meaning and before the calculated reference sheet. Add daily-only system and voice instructions:

- Treat `N1` as a conditional symbolic reading, never a known nervous system, attachment style, diagnosis, biography, or proven character.
- When supplied, express one useful distinction from `N1` in paragraph 1 or 2 and cite `N1`, `C1`, and `I1` there. Every paragraph citing `N1` must explicitly cite both parents. A copied citation without meaningful use is a human-review failure.
- Keep the existing first-paragraph `C1/I1` requirement and all `S1` dependencies/coverage. `S1` and `N1` can share paragraph 2; two to four paragraphs remains sufficient.
- Apply the lens to the primary meaning rather than adding a personality paragraph. A scene is conditional, grounded in published copy, and does not assert that a reply, meeting, reaction, or event happened.
- Never verbalize sign names, natal placements/aspects, individual house numbers, or suppressed chart claims. Existing daily placement/geometry guards stay strict even for an exact time.

Create shared `natalLensWordingProblem(text: string): "certainty" | "clinical" | null` in `src/lib/content/natal-lens-policy.ts`, used by catalogue validation and daily candidate validation when `N1` is present. Bound the certainty check to phrases such as “you always,” “you never,” “you are fundamentally,” and “your innate nature”; clinical claims include “your nervous system,” “your attachment style,” and “your trauma response.” Retain existing safety checks. Test ordinary conditional prose so this does not become a blanket ban on direct address or the word “response.” Human review catches subtler stereotypes and certainty that lexical checks miss.

The natal system-voice sentence and brief line appear only when `N1` is supplied, so the lens addition itself leaves a no-lens request unchanged. Keep bounded rejection codes `natal_coverage`, `natal_claim`, and `dependencies` for missing parents. No lens is an ordinary reading state, not a gateway failure or a quiet-day skip. Preserve one model call, strict body-only JSON and a 60,000 ms daily deadline. Member readings and natal chapters follow [AGENTS.md](../../../AGENTS.md)'s configured-provider selection; admin drafting/evaluation selects independently. The original 3.7 model / 20,000 ms policy is historical. [Current identities](../plans/2026-10-12-release-completion-checklist.md#current-execution-reference) keep provider models and schema-specific prompts distinct.

## Saved evidence, privacy, and versions

Store `language_meta.natal_lens_ct` as an AES-GCM encrypted version-1 envelope `{ version: 1, plan: DailyNatalLensPlan, fact: FactAtom, usedParagraphs: number[] }` only when a lens is selected. Its plan contains the exact evidence; its fact is `N1`; paragraph IDs are unique integers within the saved astronomical body. Clear `facts` retains the other atoms; a bounded `factOrder` ID array permits restoring the original order. Clear metadata may contain plan/reliability versions and a closed selection status, but no trait copy, rule key, selectors, placement values, fingerprint, or proof records.

Revive `ReadingLanguage` asynchronously with the owner's DEK, merge `N1` in its saved order, and expose the decrypted lens evidence only in authenticated owner responses. `readingLanguage` consumes the saved row's language fields, `release_version`, and `primary_cycle_key` so it can validate the plan against that reading rather than live cycles. Validate envelope bounds, reading release, anchor and dependencies against saved atoms, and citation linkage. A present broken envelope or a cited `N1` with missing evidence fails read-back; never replace it with today's traits. Historical readings without natal metadata remain readable. Template provenance records exact consumed natal copy through the same private envelope.

`reading_sources` records bounded origin source IDs and `N1`/paragraph identifiers, not personal trait text or selector values. Gate the used origins with existing registry permissions: `AST-05` for positions, `AST-08` for service aspects, `AST-07` for qualified houses, and `AST-20` for the uncertainty screen. Do not add health/psychological inference permission or new compulsory source switches. Source sensitivity labels do not make a person's derived chart interpretation public.

Update owner evidence labels to “Published natal lens” / “Interpretive reference,” show the exact saved origin and uncertainty screen in the evidence panel, and distinguish supplied references from consumed/cited ones. Keep natal-chapter `N1` (“Natal structure”) in its separate UI contract.

Owner exports include decrypted saved natal evidence. A row whose text, paragraphs or evidence cannot be read is exported with an `unreadable` marker and counted rather than failing the whole export; it is never reconstructed, and owner reads of it still fail closed. Account erasure deletes the evidence through the existing chart/reading tables and DEK removal, also deletes chapter essays (their clear feature keys can name placements), and clears the birth-derived fingerprint from retained `birth_profile.saved` audit events. Admin quality reporting can count `N1` citation IDs and bounded diagnostics but cannot decrypt, group by, or export natal mechanisms, rules, placements, or evidence. No new sensitive cohort segmentation or inferred temperament score.

Historical local identities on 2026-10-11 were built-in fallback `builtin-0.5.0` (no catalogue), inactive candidate `builtin-0.6.0`, natal plan `daily-natal-lens-2`, reliability `natal-reliability-1`, prompt 6 / validator 5 and `synthetic-daily-5`. The corrected standalone natal candidate is `builtin-0.6.1`; recorded active `0.7.1` includes its catalogue and transit chapters. The fallback remains natal-free. Diagnostics envelope version 1 and tolerant historical readers are retained; subsequent reports keep their own actual identities.

The keyed daily cache identity includes the existing synthesis/interpretation policy, natal plan/reliability versions, canonical decrypted manifest or an explicit absence/unavailable state, prompt/validator/model, snapshot, effective copy, and existing consent/local context inputs. Do not use randomized ciphertext as a policy digest, expose low-entropy plain hashes, overwrite older rows, or detach their feedback. Upgrading a previously missing manifest or changing its qualified evidence refreshes Today even under the same birth fingerprint.

## Catalogue lifecycle and qualification

**Qualification scope:** The matched version-5 experiment and exhaustive review described below are the original 2026-10-11 design. They were superseded as prerequisites for the `0.7.1` release by the approved lightweight gate linked above, which passed. Current general fixtures are `synthetic-daily-7` (50 cases); archived v5 reports retain their 28-case identity. Future catalogue/policy changes require the applicable newly frozen review scope. The later final-stack/human-approval work in release-completion Task 13 is open and is not a retroactive prerequisite for the shipped release.

Use recommendation 1's shared validator/normalizer at load, drafting, inactive publication, signed ingest, activation, and rollback. Preserve the full natal catalogue when cycle copy is drafted. Existing cycle-draft slots must not rewrite or approve natal traits. A natal catalogue edit is explicitly reviewed copy under a new immutable content version; invalid graphs leave the active pointer intact. Previews show schema version, base/compound lens counts and coverage, not any user's natal origins.

Extend the sixteen prerequisite fixed fixtures with twelve natal cases: matched duty/freedom lenses under an identical Moon `C1`, a service-aspect compound, an exact Placidus-house compound, a screened target sign leading a screened Moon, an unscreened target sign falling back to the Moon, both candidate signs failing the cusp screen, unknown time, mixed house provenance with eligible sign, degraded positions, legacy missing manifest, and joint `S1/N1` use. The 28-case version-5 suite makes at most 27 model attempts with complete primary copy; only its quiet case skips. Reliability failures omit `N1` and still exercise the primary reading. Fixtures contain synthetic service-marked samples and never call Swiss or read birth records. Do not imply synthetic service labels qualify the live ephemeris service.

Unit/integration tests additionally cover missing catalogue, primary-target fallback, all three declared known-time bands, unrounded orb limits, same pair reversed, nodes/angles, contradictory selector candidates, failure/corruption, user isolation, drafting preservation, cache upgrades, archive evidence, encrypted storage, export, erasure, and the unchanged provider payload after local-context edits.

Create fresh baseline and candidate reports on the identical version-5 case set, hashes and synthetic samples in one isolated environment. The baseline runs with no active release (the natal-free built-in fallback); the candidate runs with the natal candidate release activated there. Comparison requires an identical normalized transit-copy hash (`transitCopyHash`) and model, so the bundles differ only by release identity and catalogue. This isolates the effect of using a lens from changing the transit copy without a separate checkout. Offline replay qualifies validator behavior only. Obtain actual synthetic model candidates only through an explicitly invoked evaluation in an isolated environment; do not switch a production release pointer to run an experiment.

Use the same blinded reviewers and existing 1–5 specificity, voice, repetition, and grounding rubric. Add a 1–5 `lensIntegration` rating and `unsupportedPersonalClaim` boolean in review notes. Every natal-positive candidate and its template fallback must score at least 4 for specificity, grounding, and lens integration, with zero unsupported personal claims. In the duty/freedom matched pair, reviewers must identify a different practical distinction supported by `N1`, rather than adjective swaps. Negative cases must receive no natal claim. Structural acceptance and manual writing judgments are reported separately.

Completion requires passing local implementation lanes, browser evidence review, and the actual-model writing gate. Publication, deployment, and production behavior require their own evidence; preparing this design does not complete any of them.

## Local implementation clarifications

- The selected lens's encrypted `screen` preserves the exact declared accuracy,
  offsets and engine labels for archived evidence. Reading UI/export do not borrow
  those labels from a current snapshot. Evidence for the same body is cross-checked
  for identical sampled longitudes across sign, house and aspect proofs.
- Synthetic fixtures store raw ephemeris samples; a shared TS preparation helper
  constructs `NatalWindowSample` Charts with production `computeChart` before the
  pure screen. This avoids a second fixture house/sign implementation.
- Canonical decrypted assessment data, not randomized ciphertext, enters the HMAC
  cache. Immutable release version identifies effective copy; cached reads restore
  exact saved text. Missing assessment is an explicit `null` state.
- Export includes all daily rows with decrypted saved evidence; export/deletion
  failures are bounded errors and an incomplete erasure retains the key for retry.
- Catalogue review is agent editorial/structural evidence. It creates no automatic
  approval field and does not replace independent editorial or blinded writing review.

## Revision 2: verification findings

An independent verification of the first candidate reproduced its checks and found
no defect against this design, but four consequences of it were judged undesirable
and one pre-existing erasure gap was found. Each is now part of the contract above:

- **Lens variety.** Moon-first selection gave about 90% of known-time readers the same
  Moon sentence on every lens day and left 48 entries nearly unused. Version
  `daily-natal-lens-2` lets the transited body's own rules lead, with Moon rules as
  the fallback. Compound rules for any personal body are now eligible for their own
  target instead of being silently ignored.
- **Deploy is not activation.** With the catalogue in the built-in fallback, a deploy
  to an environment without an active release would have activated lenses. The
  fallback stays `builtin-0.5.0`; `builtin-0.6.0` is an inactive candidate. Requests
  without `N1` match the pre-lens request byte for byte, verified against `cc6a3cd`
  for all fifteen pre-natal cases that call the model.
- **Existing readers.** Lenses would have reached only readers who re-saved birth
  details. The guarded Today re-screen in Snapshot integration was approved by the
  project owner on 2026-10-11, including its Swiss cost.
- **Failure isolation.** One unreadable saved row no longer blocks a whole export.
  An active-release read is retried once before failing closed; it still never falls
  back to built-in copy, which would cache Today under the wrong release and base
  drafts on the wrong catalogue.
- **Erasure.** Chapter essays and retained audit fingerprints are now covered.

## Addendum 2026-10-11: AI writing-review lane — historical

The following records the earlier lane. The 2026-10-12 approved lightweight gate superseded its exhaustive review prerequisites for the joint release, as described above. Human review was not completed and is not relabeled as completed.

No human prose reviewer is available. Catalogue approval and lens writing
qualification follow the AI review lane in
[`daily-writing-ai-review-1`](../../reviews/daily-reading-writing/review-protocol.md)
(two fresh, blinded AI reviewer contexts per review, explicit adjudication, and
`humanReviewCompleted: false`). AI approval is recorded separately from the
catalogue author's structural review. The independent editorial and blinded
human requirements above are left as written; they are deferred and remain
unsatisfied.
