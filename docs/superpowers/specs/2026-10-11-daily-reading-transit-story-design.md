# Daily reading transit story design

Status: local app candidate implemented on 2026-10-11 in isolated branch `feat/daily-reading-transit-story`, based on `cc6a3cd` plus frozen prerequisite work. The native service repository/numerical qualification and actual-model writing gates remain open; source configuration remains disabled. This document remains the target contract, not proof of activation. See [local validation](../../reviews/daily-transit-story/local-validation.md).

Give the primary transit a supported place in time: a single passage, an opening contact, a return, a closing contact, or a pause between passes. Calculate the chronology first, then apply reviewed interpretive wording. A closing astronomical contact does not establish personal resolution.

## Scope and implementation order

Follow the [recommendation 1 checklist](../plans/2026-10-11-daily-reading-synthesis-checklist.md) and [recommendation 2 checklist](../plans/2026-10-11-daily-reading-natal-temperament-checklist.md). Their complete implementation and qualification remain prerequisites in this roadmap. Reuse their shared content graph, primary selection, fact dependencies, private evidence, and birth-window service sampling. A daily reading can still receive a story without a selected natal lens.

This increment supports Jupiter, Saturn, Uranus, Neptune, and Pluto as the already selected primary transit. Preserve strongest-three selection, importance weights, threshold `> 0.02`, interpretation/synthesis/natal selection, suppression, headline, confidence, local context, and reflection-question behavior. Do not promote a weaker transit because it has an interesting history. Fast-planet episodes, remembered life events, wellness adaptation, and an app-wide replacement of transit ranking are separate work.

Deliver both the app integration and a new capability in the external Swiss service. Its native implementation is outside this checkout. The new endpoint below is a proposed contract; the existing birth-chart endpoint cannot be assumed to provide it. Feature completion requires the service deliverable and its numerical qualification. Until then, retain the ordinary daily reading without a multi-pass claim.

## Starting-point audit and source qualification

- `cycles.ts` scans the current connected in-orb window, samples for the smallest orb within at most ±60 days, and treats a sampled minimum below `0.2°` as an exact time. It does not enumerate zero crossings, distinguish passes, find stations, or prove an episode's total contact count.
- `cycle_key` identifies the body/aspect/natal-point combination and recurs across years. It is not a unique episode ID. `arc_position` describes the current connected window, not a multi-pass episode or emotional progress.
- `positionOf` is the local `kepler-approx@1.0.0` engine; its speed is a forward finite difference. A Swiss natal chart does not make this transit scan a Swiss calculation.
- Before this increment, the Swiss HTTP client resolved a birth chart, with a six-second deadline and an explicit approximate fallback. It does not have a transit-history endpoint, nor a strict position-frame/returned-flags contract. Missing speed can currently become zero; that is unsuitable for station detection.
- `getToday` and `getCyclesFor` calculate at effective local noon. Calendar remapping and frontend `windowPhase` can disagree with a stored phase if timing is changed in only one layer. Timing currently draws one exact marker.
- Before this increment, model validation had one allowed exact date per `C` fact. Adding a general date whitelist would allow an unrelated event date to justify another transit's timing.

Coordinate compatibility is a qualification requirement. The local outer-planet formula uses coefficients matching JPL's approximate-element table and appears to use its J2000 Cartesian result without an explicit conversion to the date's apparent frame. This is a source-based inference from the formula, not a verified live service mismatch. JPL documents those elements as approximate and referred to J2000; Swiss documents its usual apparent geocentric positions as referred to the date's true equinox, with explicit speed and frame flags. Verify the actual service settings rather than assuming its defaults. [JPL approximate positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html), [Swiss programming reference](https://www.astro.com/swisseph/swephprg.htm).

The chosen solution is a source-qualified Swiss episode calculation, with ordinary phase wording as the fallback. Do not turn the local sampled minima into authoritative history, assume a frame mismatch is harmless, or repair chart sources with unqualified app math. Record any demonstrated broader transit-frame defect separately; a source disagreement suppresses this feature and must not silently become a ranking change.

## Birth anchor contract

Create `transit-anchors.ts` and `transit-anchors.server.ts`. Reuse recommendation 2's central/boundary Swiss responses at birth-save time. Refactor its sampling into one `resolveNatalWindowSamples` coordinator so both assessments consume the same responses. At most three total service calls remain: center and offsets `[-2, 0, 2]`, `[-15, 0, 15]`, or `[-60, 0, 60]` minutes for `exact`, `near`, or `hour`. Unknown time produces no story anchors or additional requests.

Keep anchors for the nine existing natal targets: Sun through Saturn, Ascendant, and Midheaven. Accept finite, unrounded, service-origin longitudes with explicit tropical/apparent/geocentric/true-equinox-of-date metadata and coherent source identity across all three samples. Angles additionally require `exact`, service-origin Placidus angles/houses, and existing suppression checks. Missing one point excludes that anchor. Degraded/mixed-frame position samples make the manifest unavailable. Sign-boundary and natal-lens eligibility are independent: a valid transit anchor does not need an eligible sign lens.

```ts
type Triple<T> = [T, T, T]; // before, center, after
type StoryBody = "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";
type StoryTarget =
  "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "ascendant" | "midheaven";
interface PositionSource {
  engine: "swiss-ephemeris";
  engineVersion: string;
  dataId: string;
  frame: "tropical-apparent-geocentric-true-equinox-of-date";
  timeScale: "UT";
  returnedFlags: number;
}
type TransitAnchorManifest = {
  version: "transit-anchor-1";
  chartFingerprint: string;
  accuracy: TimeAccuracy;
} & (
  | {
      status: "screened";
      sampleOffsetsMinutes: Triple<number>;
      sources: Triple<PositionSource>;
      anchors: { target: StoryTarget; longitudes: Triple<number> }[];
    }
  | {
      status: "unavailable";
      reason: "unknown_time" | "service_unavailable" | "unqualified_source";
      sampleOffsetsMinutes: [];
      sources: [];
      anchors: [];
    }
);
```

Validate exact offsets, fingerprint, existing accuracy enum, unique targets, angle restrictions, normalized longitudes, finite values, frame/flags, and source identities. Bound strings to 160 characters, fingerprint to 256, and anchors to nine. Store this manifest encrypted with the owner DEK as `houses.transitAnchors_ct`. Existing snapshots without it continue with no story; create it through the existing birth-save/recalculation path, never by daily birth-service fan-out. A corrupt present manifest fails owner read-back rather than masquerading as a successful or absent assessment.

This is a three-sample uncertainty screen. It neither certifies the whole birth-time interval nor independently confirms a birth time. Preserve that limitation in owner evidence.

## Proposed external service endpoint

Implement `POST /v1/transit-episodes` in the native Swiss service. Configure its complete URL separately as `SWISS_TRANSIT_EPISODE_URL`, reuse the existing server-only `SWISS_EPHEMERIS_KEY`, and require a reviewed `SWISS_TRANSIT_EPISODE_SOURCE_ID`. Missing configuration disables the story capability; it must not disable birth calculation or ordinary readings. Use the existing authentication scheme. Never log request/response bodies.

The request contains only `{ contract: "swiss-transit-episode/1", solverVersion: "transit-episode-1", sourceId, transitBody, aspect, targets: [{ offsetMinutes, longitude }], referenceAt, maxOrbDegrees }`. `targets` is exactly the qualified triple for the selected anchor; `aspect` is the existing exact aspect enum. Send no user ID, birth instant, coordinates, full chart, wellness values, or notes. Derived natal longitudes are still personal information sent to the existing chart processor; disclose this in the privacy page. Nothing from this request goes to the language gateway.

The response is a strict, bounded `TransitEpisodeScan`: matching contract/solver/source/request values, an actual `PositionSource`, UTC coverage, numerical tolerances, reference longitude/speed, and exactly three offset-labelled sample results. Use these proof records, with IDs unique within each sample and exact UTC ISO instants:

```ts
type Motion = "direct" | "retrograde";
interface TrackPoint {
  at: string;
  unwrappedLongitude: number;
  speed: number; // actual analytic longitudinal speed, degrees/day
}
interface RefinedPoint extends TrackPoint {
  bracket: [TrackPoint, TrackPoint];
}
interface TransitContact extends RefinedPoint {
  id: string;
  residualDeg: number;
  direction: Motion;
  branch: "plus" | "minus";
  targetTurn: number;
  legId: string;
  windowId: string;
}
interface TransitStation extends RefinedPoint {
  id: string;
  directionBefore: Motion;
  directionAfter: Motion;
}
interface TransitLeg {
  id: string;
  start: TrackPoint;
  end: TrackPoint;
  direction: Motion;
  startStationId: string | null;
  endStationId: string | null;
}
interface TransitWindow {
  id: string;
  ingress: RefinedPoint | null;
  egress: RefinedPoint | null;
  contactIds: string[];
}
interface TransitComponent {
  id: string;
  contactIds: string[];
  leftClosureLegId: string | null;
  rightClosureLegId: string | null;
  complete: boolean;
  reason:
    | null
    | "scan_limit"
    | "evaluation_limit"
    | "time_limit"
    | "output_limit"
    | "source_range"
    | "window_unclosed"
    | "ambiguous_station_contact";
}
interface TransitSampleScan {
  offsetMinutes: number;
  natalLongitude: number;
  limit: null | "scan_limit" | "evaluation_limit" | "time_limit" | "output_limit" | "source_range";
  contacts: TransitContact[];
  stations: TransitStation[];
  legs: TransitLeg[];
  windows: TransitWindow[];
  components: TransitComponent[];
}
interface TransitEpisodeScan {
  contract: "swiss-transit-episode/1";
  solverVersion: "transit-episode-1";
  sourceId: string;
  source: PositionSource;
  request: TransitEpisodeRequest; // exact echoed request defined above
  coverage: { from: string; to: string };
  tolerance: { bracketSeconds: number; rootResidualDeg: number };
  reference: TrackPoint;
  samples: Triple<TransitSampleScan>;
}
```

Define the request object above as `TransitEpisodeRequest`. `TransitEpisodeScanResult` is `{ status: "available", scan: TransitEpisodeScan } | { status: "unavailable", reason: "not_configured" | "timeout" | "transport" | "unqualified_source" | "invalid_response" }`; unavailable responses carry no successful scan. Map client failures to the story omission union without exposing raw errors. Any non-null sample limit immediately omits the story as `incomplete_scan`; bounded partial diagnostics are not eligible calculation evidence. Validate root residuals against the supplied unwrapped geometry/target, every bracket's ordering/sign change, station reversals, orb-edge geometry, leg continuity, and component closure. A complete component requires `reason: null`, both closure legs and all contact-associated edges; an incomplete one requires its actual closed reason. For each monotonic leg, independently infer target crossings from its endpoints and require the corresponding contacts, rather than trusting only the reported event list. Native qualification establishes the underlying track's accuracy.

Reject nonfinite/unsorted/out-of-range events, duplicate IDs, missing speed, invalid directions, mismatched aspect/orb/source/offsets, unsupported versions, incomplete brackets, and inconsistent dependencies. Bound the response to 128 KiB, 16 contacts/components, 40 stations, 41 legs, and 32 windows **per sample**, and 160-character source/event identifiers. Excess output returns an incomplete result rather than truncating a complete component. Use one six-second abort deadline for fetch, bounded body read, and parsing, with cleanup in `finally`; no automatic retries and no request per root. A service error returns a closed no-story status and the existing reading fallback.

The service may cache source-specific position samples and complete scans internally. Cache keys must cover frame, ephemeris files/version, solver, body, anchor triple, orb, and coverage; derived-anchor cache entries require the chart processor's existing privacy/retention boundary. Do not assume an in-app memory cache persists across worker instances. No new app database table is needed.

## Solver and episode definition

The native service must implement and qualify this algorithm:

1. Calculate longitude and analytic longitudinal speed with explicit Swiss settings, including requested Swiss files and speed. Check returned flags/data identity at every evaluation; a silent Moshier fallback or source change is not a qualified Swiss scan. Use UTC-to-UT conversion appropriate to the service, not UTC Julian days passed to a dynamical-time API.
2. For aspect angle `a`, examine the oriented targets `natalLongitude + a` and `natalLongitude - a`; deduplicate conjunction/opposition. Unwrap longitude and retain the same target turn. A square on the other side of the chart or a later revolution is a different branch.
3. Start with ±400 days around the reference instant, extending only the unresolved side in 200-day increments to a maximum ±1,460 days. Stay within the service's declared ephemeris-validity interval. Cap at 20,000 unique position evaluations and four seconds of native calculation per request; a cap produces incomplete coverage, never an invented total.
4. Begin at half-day samples; bracket analytic speed reversals, refine stations, and split the track into monotonic legs. Verify/refine segments with uncertain motion or curvature. Find every signed target crossing on every leg, including two crossings around a station that an absolute-orb minimum can conceal.
5. Refine crossing, station, and orb-edge brackets to at most 60 seconds. Exact-contact residual must be at most `0.000001°`. These are numerical stopping criteria, not an asserted physical timing accuracy. A station within `0.001°` of the target, an exact tangent, or inseparable roots is `ambiguous_station_contact`; omit ordinal/total claims instead of merging it into one ordinary pass.
6. Find crossings of the existing `transitOrb` limit on both sides of each contact. Preserve every connected in-orb window and any out-of-orb gaps. Contacts can share a window. A near miss without an exact root is not an exact pass.
7. Connect adjacent roots only when they share the oriented target/turn and occupy adjacent monotonic legs separated by one station. Connected components define repeat-pass episodes. Do not group by `cycle_key`, a fixed date gap, or an assumed direct/retrograde/direct template.
8. Certify closure on both sides using fully bracketed neighboring monotonic legs that cannot cross that same target, plus closed first/last contact windows. Scan edges alone are not closure evidence. Accept one, three, five, or another proven count. Exceeding a bound, a missing side, or a proof inconsistency yields incomplete coverage and no “first,” “last,” or “of N” statement.

Use an episode's first/last **contact-associated window** as its envelope; use its first/last exact roots as contact dates. Neither is the date a reader's life problem began. Store a private episode identity binding source/solver, target branch, anchor, and event component. Keep episode identity distinct from reusable `cycle_key` and per-day `cycle_instances` rows.

The service deliverable needs native tests and recorded Swiss reference fixtures. App-side synthetic acceptance tests cannot establish that this algorithm ran correctly outside the app.

## Pure server selection and calendar presentation

Create `transit-episodes.ts` for strict scan/proof validation and selecting the component containing the already eligible primary's current in-orb window. Create `transit-episodes.server.ts` for the single authenticated request. Reuse/expose the existing `transitOrb` policy; do not create different arc orbs.

Before selecting a story, require all three birth anchors to produce complete components with the same contact count, ordered motion directions, oriented branch, and chapter at the reference instant. Each sample must place the reference transit within the same existing orb limit. A service/local eligibility disagreement produces `source_disagreement` and no story; record it for source qualification without changing daily ranking.

Map chapter position from the monotonic leg at `referenceAt`, not the nearest root or an elapsed percentage. For multi-pass episodes within twelve hours of a verified station connecting their passes, use `between`, with `passIndex: null`. This twelve-hour window is an explicit presentation policy, not a physical uncertainty bound. Otherwise the current leg must identify one exact pass. If the triple disagrees on ordinal/chapter, return `birth_window_disagreement` with no story. A single passage has `passTotal: 1` and `chapter: "single"`.

A qualified result overlays the primary's **timing** using its selected current-leg root/window, while retaining its key, current approximate orb, importance, domain, and ranking. Label the current orb/ranking engine and the Swiss event-timing engine separately. The orb is not a measurement made at a historical root. Do not relabel supporting cycles as Swiss or conflate that orb with an event's zero residual.

Use an explicit presentation DTO instead of adding `between` to the existing astronomical `CycleInstance.phase` enum:

```ts
interface StoryTimingOverlay {
  cycleKey: string;
  phase: "approaching" | "exact" | "separating" | "between" | "uncertain";
  centralExactAt: string | null;
  qualifiedExactDay: string | null;
  daysToExact: number | null;
  centralIngressAt: string;
  centralEgressAt: string;
  windowPosition: number | null;
}
type DailyTransitCalculation =
  | { status: "qualified"; evidence: ValidatedTransitEpisode; timingOverlay: StoryTimingOverlay }
  | { status: "omitted"; reason: StoryOmissionReason };
```

`centralExactAt` is null during a between-pass interval; do not choose an arbitrary nearest root. Model `C1` timing and owner timing helpers prefer the overlay's qualified fields; never fall back from an uncertain `qualifiedExactDay` to its private central timestamp or the old sampled minimum. `CycleInstance` remains the ranking input. The shared fact input gains the overlay explicitly, while `P1/T1` use neutral wording for `between/uncertain` rather than an unsupported legacy phase label.

Extend `ephemerisState` and the `E1` fact input with optional event-timing provenance. Keep natal source/precision, current transit geometry source, and event-timing source distinct; a qualified history must not turn the approximate orb/ranking values or supporting transits into Swiss positions.

Derive local days from saved UTC events using `localDayString`, `daysToLocalDate`, and the effective validated timezone. A root date can enter model facts only when all three corresponding sample roots land on that same civil day. A month/year label can enter only when all three agree on that month/year. Otherwise omit that date from prose; owner evidence shows the central calculation and sampled date range. If the primary's exact civil day is uncertain, expose no single exact date/`days_to_exact` to the model, and suppress frontend “exact today” claims. Preserve the central UTC instant in private evidence.

Normalize `P1`, `T1`, primary timing fields, and frontend phase labels from the same presentation result. Approaching/separating may be stated only when all three roots agree on that relation to the reference; `exact` is the qualified common civil day. In a between-pass interval use neutral phase wording and no invented nearest-exact assertion. `arc_position` continues to refer only to the connected current window; no percentage represents whole-episode completion.

## Reviewed chapter catalogue and shared plan

Extend `ContentBundle` to `schemaVersion?: 2 | 3 | 4` and optional `transitChapters: TransitChapterCopy[]`. A nonempty chapter catalogue requires schema 4. Legacy absence normalizes to `[]`; an explicit empty active catalogue remains authoritative. Retain all synthesis/natal validation and immutable raw payload identity in every lifecycle. Existing cycle drafting preserves the complete chapter catalogue verbatim.

Also replace the three built-in `phases` strings in this new reviewed release with brief experiential copy, while keeping `P1`'s existing role and field contract. Approaching invites noticing a response before acting; exact narrows attention to one observable choice; separating asks which response remains useful, conditional on any felt pressure easing. For example, exact can say “If a demand feels immediate, start with the one choice you can describe clearly.” Do not infer urgency, easing or resolution from geometry. Active published phase copy remains authoritative; rollback restores that release's actual copy. During `between/uncertain`, use the presentation's neutral timing line instead of selecting an unsupported three-phase entry. This supplies the requested phase-language improvement alongside the new episode chapter.

```ts
type TransitChapter = "single" | "opening" | "return" | "closing" | "between";
interface TransitChapterCopy {
  key: string;
  chapter: TransitChapter;
  mechanism: string; // conditional everyday meaning; no embedded dates/counts
}
type DailyTransitStoryPlan = {
  version: "daily-transit-story-1";
  solverVersion: "transit-episode-1";
  anchorVersion: "transit-anchor-1";
} & (
  | {
      status: "selected";
      cycleKey: string;
      releaseVersion: string;
      chapter: TransitChapter;
      passIndex: number | null;
      passTotal: number;
      chronologySentence: string;
      approvedDates: StoryDateReference[];
      copy: TransitChapterCopy;
      evidence: ValidatedTransitEpisode;
    }
  | { status: "omitted"; reason: StoryOmissionReason }
);
```

`StoryDateReference` is `{ eventId, kind: "exact-contact", civilDay: string | null, monthYear: string | null }`, derived from the sampled roots; bounds and format are checked. `ValidatedTransitEpisode` retains the exact source scan, selected component IDs, anchor fingerprint, reference instant, timezone, uncertainty comparison, and timing overlay. `StoryOmissionReason` is the closed union `unsupported_primary | no_primary_copy | no_catalogue | no_anchor | unqualified_source | service_unavailable | invalid_scan | incomplete_scan | ambiguous_station_contact | no_current_pass | source_disagreement | birth_window_disagreement`. No omitted plan contains a claimed history.

Allow at most five catalogue entries, one per chapter, with unique keys of at most 100 characters and mechanism text of at most 240 characters/two sentences. Validate safe conditional copy, existing sign/house/technical bans, and no fixed counts, calendar dates, diagnosis, invented biography, or guaranteed outcome. Seed and review all five under `builtin-0.7.0`:

| Chapter | Supported framing                                   | Example practical distinction                                                               |
| ------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Single  | One complete calculated passage                     | Notice the demand in one concrete choice; do not invent return chapters                     |
| Opening | First contact in a proven repeat episode            | Notice a response before treating it as settled; avoid asserting a rupture                  |
| Return  | An intermediate contact, including multiple returns | Reconsider a method or boundary; avoid “the same event happened again”                      |
| Closing | Last contact in the calculated episode              | Try a response that can be repeated; avoid promising resolution or closure                  |
| Between | Verified station connecting passes                  | Let a decision remain provisional; avoid interpreting apparent motion as personal paralysis |

Make the experiential language conditional: “If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment.” Tie it to `I1`, the existing scene, and optional `S1/N1`; do not add an unrelated second essay or a universal story of trauma.

Create `resolveDailyTransitStory(bundle, primary, interpretation, calculation)` in `content/transit-story.ts`. It chooses exactly one chapter entry without built-in substitution after an active miss. Add a sixth optional `storyCalculation: DailyTransitCalculation | null = null` parameter to the recommendation 2 `assembleReading` signature, preserving its optional fifth reliability argument and four-argument callers. Add `transitStoryPlan` to `AssembledReading`. Resolve interpretations before calculation; asynchronous source loading stays in the server coordinator, not the pure assembler. Keep template chronology/chapter wording in its first two astronomical paragraphs, using the same selected plan as the model.

## Model facts and chronology guard

Keep `P1` for today's approach/exact/separation wording and `T1` for qualified current-pass timing. Add optional `A1` as a calculation atom depending on `C1`, and `P2` as a published interpretation atom depending on `C1`, `I1`, and `A1`. `A1` contains the bounded count/index/chapter, approved event-date labels, and the server-rendered `chronologySentence`; `P2` contains only selected reviewed copy and its public content identity. The provider payload excludes the scan, anchor longitudes, fingerprint, episode ID, exact UTC brackets, station coordinates, uncertainty samples, and private history. Approved chronology remains chart-derived personal information, not anonymous data.

Provider event references are generic `pass-1` through `pass-16`, mapped to native event IDs only inside private evidence. Do not leak source-generated IDs that could encode anchors or target turns. Keep current `AST-05/AST-08` source-use checks for calculation/timing and external-language facts; local context and wellness grants still cannot enable a private-history payload.

Render chronology deterministically, at most 180 characters, with a fixed ordinal/count vocabulary for 1–16. For example: “This is the second of three calculated contacts; the first exact contact was in May 2026.” Emit that month only when the samples support it. For an undated case use the count sentence alone. For `between`, name the proven episode and connecting pause without an ordinal. A single passage never receives “first of three.”

The daily system brief asks the model to copy this chronology sentence once in paragraph 1 or 2, then connect the chapter's conditional meaning to the primary interpretation. A paragraph using chronology cites `C1/A1`; a paragraph using chapter meaning cites `C1/I1/A1/P2`. Preserve first-paragraph `C1/I1`, first-two-paragraph synthesis/natal requirements, two-to-four-paragraph strict JSON, existing limits, `google/gemini-3.7-flash`, one model call, and its independent 20-second deadline. Verify combined `S1/N1/P2` actually fits the brief and body budget.

Extend the shared fact graph and daily reference checks: a selected story requires both new atoms, exact parents, matching primary/content identity, valid count/index/chapter, exactly one unchanged chronology sentence within the first two paragraphs, and correct citation coverage. Event-date support is paragraph-local and tied to `A1`'s exact-contact references; ordinary dates still require the appropriate `C` fact. Do not let a date from `A1` justify a supporting transit, a station date, a different orb, or a personal event. Add bounded checks for extra/incorrect pass counts, ordinals, final-pass claims and timeline dates outside the approved chronology, with closed diagnostic codes `arc_dependencies`, `arc_coverage`, `arc_chronology`, `arc_claim`, and `arc_date`.

If an arc is omitted, send no `A1/P2` and no history instruction. Reject unsupplied multi-pass assertions. A malformed candidate falls back as a whole to the same supported template; no repair request. Literal chronology/citation checks and wording checks constrain output but do not prove every sentence's meaning. Writing qualification must independently check unsupported biography and deterministic promises.

## Storage, cache, and archived evidence

Use existing encrypted JSON storage. Save `language_meta.transit_story_ct` as an AES-GCM envelope `{ version: 1, plan, facts: [A1, P2], usedParagraphs, timingOverlay, resultDigest }`. Encrypt source/anchor proof, dates, selected copy, and consumed template/model provenance. Keep clear fact/provenance arrays free of the two personal atoms and scan values. Reuse the safe `factOrder` mechanism from recommendation 2, restoring both natal and story atoms in saved order with the owner's DEK. Owner exports include the decrypted evidence; erasure removes it with existing reading/snapshot records. Admin quality views receive closed statuses/IDs/versions, never bodies, event dates, episode IDs, or anchors.

The keyed cache identity includes story/anchor/solver/prompt/validator versions, qualified source ID and endpoint configuration identity, enablement, canonical decrypted anchor manifest or absence, all previous interpretation/natal/context inputs, timezone/day/snapshot, and effective content. Exclude random ciphertext and request timestamps. Look up the existing daily row **before** the external episode request. The policy/source/anchor inputs determine that immutable generation; bind its actual returned calculation with `resultDigest`, a keyed digest of the canonical validated result excluding duration/cache metadata.

A valid cached reading restores the exact saved story/timing overlay and adds no Swiss or language request. An unavailable source is recorded as an immutable omission for that generation: subsequent cached reads do not retry or retrofit it. Recovery is used on a new day or a deliberate source/policy/birth-content version change. Old reading IDs and feedback remain attached. Changes in actual source identity require a reviewed configured source ID change, not reuse of old prose under an untracked engine update.

Validate envelopes against the saved release/primary/anchor/source policy, fact graph, calculation bounds, result digest, paragraph linkage, and timing overlay. Present-but-broken evidence is a read error. Legacy absence remains readable; never recompute an archived episode using today's chart or new content. Do not overwrite a saved scan with freshly calculated cycles in `getToday`'s cache path. The existing `cycle_instances` schema remains per-day and does not acquire whole-episode semantics.

## Timing and owner evidence

Share a `DailyTransitCalculation` DTO through Today and Time Travel; an omitted result is a reason code, not a partial total. Apply the selected primary timing overlay everywhere the reading's primary is shown. Time Travel resolves only its already selected supported primary, with at most one episode request for a new day selection; it must not scan all forty returned cycles. Today includes its saved calculation so timing/evidence panels do not fetch it separately.

Extend `TimingWindow` to display a chronological contact list and an optional timeline with all contacts and explicitly separate connected windows. Out-of-orb gaps stay unfilled. State “Contact 2 of 3” only for a qualified ordinal; `between` uses its separate label. Mark sampled date ranges and label source engines separately for natal positions, current approximate transit geometry, and Swiss event timing. Fix the broad Swiss notice that currently only reflects natal provenance. Incomplete/omitted episodes retain ordinary window timing without first/final/total assertions.

Today evidence links `A1` to the saved calculated sequence and `P2` to the exact published chapter copy. Show first exact contact separately from first ingress. Explain “Calculated contacts, not a record of events in your life” and the three-sample birth-time screen briefly. These distinctions help the reader understand the claim; numerical tolerances and solver internals belong in expandable source details.

Use existing Buttons, mounted visited panels, keyboard focus/`aria`/`inert` patterns, global motion and reduced-motion overrides. Provide a readable text list when a graphical timeline is unavailable or markers overlap. Never hide visible asynchronous content, replay motion/refetch on close, or disclose another account's evidence.

## Versions and qualification

Reserve content `builtin-0.7.0`/schema 4, anchor `transit-anchor-1`, contract `swiss-transit-episode/1`, solver `transit-episode-1`, story plan `daily-transit-story-1`, prompt `daily-astro-body-7`, validator `daily-reference-6`, and fixtures `synthetic-daily-5`. Retain diagnostics/report envelope version 1 with tolerant historical readers. These are proposed identities beyond recommendations 1 and 2, not current runtime values.

Numerical qualification precedes model qualification. Record native solver commit, Swiss version, actual flags/files/frame/time scale, reference tool version/commands, fixture hashes, and exact event comparisons. Use at least fifteen recorded real-position tracks: each supported body with single/repeat, station-near, and wrap/branch behavior collectively covered. Independently enumerate roots with a dense Swiss reference track and refined brackets; do not generate expected output by calling the candidate solver. Require identical nonambiguous event count/directions, at most five minutes difference for every root/station/edge, correct closure/omission, and matching sampled uncertainty behavior. These reference thresholds qualify the pipeline against Swiss, not astrology's causal validity or minute-perfect personal timing. Tangent/incomplete/out-of-range cases must omit claims. Synthetic analytic curves separately test one/three/five passes, missed crossings, multiple windows, reversed motion, limits, and malformed proof.

Preserve the 26 prerequisite writing fixtures and add ten: `arc-single-pass`, `arc-opening-three`, `arc-return-three`, `arc-closing-three`, `arc-return-five`, `arc-between-passes`, `arc-truncated-scan`, `arc-station-tangent`, `arc-birth-window-disagreement`, and `arc-synthesis-natal-integration`. Version 5 has 36 cases and at most 35 model attempts with complete primary copy; only the existing quiet case skips. Arc omissions still exercise ordinary primary prose. Use synthetic service-response fixtures through production validation/planning; no Swiss calls or user records in the writing runner.

Compare fresh baseline/candidate runs on identical version-5 fixtures, source hashes, reviewed content, model, tone/depth and existing policies, disabling only story use in the isolated baseline. Offline replay establishes validator behavior only. Actual model generation requires an explicitly invoked synthetic evaluation; preparing this document authorizes no model spend or live experiment.

Blind-review primary specificity, voice, repetition and grounding, plus `temporalCoherence` and `chapterIntegration` on 1–5 scales and `unsupportedHistory`/`promisedResolution` booleans. Every arc-positive candidate and template fallback must score at least 4 for grounding, temporal coherence and chapter integration, with zero unsupported-history/outcome claims. The matched opening/return/closing cases must express a practical difference beyond ordinal/adjective swaps. Negative cases must invent no history. Report structural, numerical, runtime/browser and writing gates separately; release/deployment/production proof remains a later explicitly requested workflow.
