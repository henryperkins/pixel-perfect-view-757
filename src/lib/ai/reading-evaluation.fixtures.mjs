import { analyticEpisode } from "./reading-evaluation.transit.fixtures.mjs";
/** Synthetic plans only: these are not birth records or an ephemeris quality test. */
export const READING_EVAL_FIXTURE_VERSION = "synthetic-daily-7";

const CHART = {
  engine: "synthetic-evaluation-engine",
  engineVersion: "fixture-1",
  houseSystem: "Placidus",
  precision: "high",
  points: {
    sun: { angleDependent: false },
    moon: { angleDependent: false },
    mercury: { angleDependent: false },
    venus: { angleDependent: false },
    mars: { angleDependent: false },
    ascendant: { angleDependent: true },
    midheaven: { angleDependent: true },
  },
  uncertainty: {
    accuracy: "exact",
    minutes: 2,
    ascendantSpreadDeg: 0.5,
    housesReliable: true,
    angleClaimsSuppressed: false,
  },
};

function cycle(transit, natal, aspect, extras = {}) {
  const key = `${transit}_${aspect}_${natal}`;
  return {
    cycle_key: key,
    transit_body: transit,
    natal_point: natal,
    aspect,
    orb: 0.42,
    phase: "approaching",
    domain: "identity",
    importance: 0.4,
    ingress_at: "2026-10-01T12:00:00Z",
    exact_at: "2026-10-14T01:00:00Z",
    egress_at: "2026-10-28T12:00:00Z",
    label: `${transit} ${aspect} natal ${natal}`,
    arc_position: 0.3,
    ...extras,
  };
}

function fixedCase(id, description, cycles, extras = {}) {
  return {
    id,
    description,
    chart: structuredClone(CHART),
    cycles,
    config: {
      day: "2026-10-11",
      timeZone: "UTC",
      tone: "plain",
      depth: "standard",
      granted: ["USR-01", "USR-02"],
      ...extras.config,
    },
    ...Object.fromEntries(Object.entries(extras).filter(([key]) => key !== "config")),
  };
}

export const READING_EVAL_CASES = [
  fixedCase("saturn-square-sun", "Common hard contact, plain standard reading.", [
    cycle("saturn", "sun", "square"),
  ]),
  fixedCase(
    "saturn-square-moon-warm",
    "Warm tone with the published inner-life interpretation.",
    [cycle("saturn", "moon", "square", { domain: "inner-life" })],
    { config: { tone: "warm" } },
  ),
  fixedCase(
    "jupiter-trine-sun-technical",
    "Technical depth, soft contact, and exact phase.",
    [cycle("jupiter", "sun", "trine", { phase: "exact", exact_at: "2026-10-11T12:00:00Z" })],
    { config: { depth: "technical" } },
  ),
  fixedCase(
    "mercury-conjunction-clinical",
    "Clinical tone and separating information-load contact.",
    [
      cycle("mercury", "mercury", "conjunction", {
        phase: "separating",
        domain: "work",
        exact_at: "2026-10-10T12:00:00Z",
      }),
    ],
    { config: { tone: "clinical" } },
  ),
  fixedCase("venus-opposition-venus", "Short preference contact with relationship framing.", [
    cycle("venus", "venus", "opposition", { domain: "relationships" }),
  ]),
  fixedCase(
    "unknown-birth-time",
    "An apparently stronger angle contact is excluded rather than guessed.",
    [cycle("saturn", "ascendant", "square", { importance: 0.8 }), cycle("saturn", "sun", "square")],
    {
      chart: {
        ...structuredClone(CHART),
        uncertainty: {
          accuracy: "unknown",
          minutes: 720,
          ascendantSpreadDeg: 180,
          housesReliable: false,
          angleClaimsSuppressed: true,
        },
      },
    },
  ),
  fixedCase(
    "approximate-birth-time",
    "Approximate time suppresses an apparent house placement while retaining a planet contact.",
    [
      cycle("saturn", "house_10", "square", { importance: 0.8 }),
      cycle("mars", "sun", "square", { domain: "work" }),
    ],
    {
      chart: {
        ...structuredClone(CHART),
        uncertainty: {
          accuracy: "approximate",
          minutes: 60,
          ascendantSpreadDeg: 15,
          housesReliable: false,
          angleClaimsSuppressed: false,
        },
      },
    },
  ),
  fixedCase(
    "moon-dst-boundary",
    "Moon timing crosses the local date boundary before a daylight-saving transition.",
    [
      cycle("moon", "moon", "conjunction", {
        phase: "separating",
        domain: "inner-life",
        exact_at: "2026-11-01T03:30:00Z",
        ingress_at: "2026-10-31T03:30:00Z",
        egress_at: "2026-11-02T03:30:00Z",
      }),
    ],
    { config: { day: "2026-11-01", timeZone: "America/New_York" } },
  ),
  fixedCase(
    "multiple-cycles",
    "Unsorted contacts exercise the shared strongest-three plan and threshold.",
    [
      cycle("venus", "venus", "opposition", { importance: 0.2, domain: "relationships" }),
      cycle("mars", "sun", "square", { importance: 0.01 }),
      cycle("saturn", "sun", "square", { importance: 0.7 }),
      cycle("jupiter", "sun", "trine", { importance: 0.3 }),
      cycle("mercury", "mercury", "conjunction", { importance: 0.1 }),
    ],
    { config: { tone: "warm" } },
  ),
  fixedCase("quiet-threshold", "No contact exceeds the shared importance threshold.", [
    cycle("mars", "sun", "square", { importance: 0.02 }),
    cycle("venus", "venus", "opposition", { importance: 0.01 }),
  ]),
  fixedCase("synthesis-tension", "Reviewed structure and expansion relationship, primary first.", [
    cycle("saturn", "sun", "square", { importance: 0.7 }),
    cycle("jupiter", "mars", "trine", { importance: 0.5 }),
  ]),
  fixedCase(
    "synthesis-reinforcement",
    "Reviewed steady commitment and practical initiative relationship.",
    [
      cycle("saturn", "sun", "trine", { importance: 0.7 }),
      cycle("mars", "sun", "trine", { importance: 0.5 }),
    ],
  ),
  fixedCase(
    "synthesis-independent",
    "Reviewed preference and expression contacts remain separate.",
    [
      cycle("venus", "venus", "opposition", { importance: 0.7, domain: "relationships" }),
      cycle("mercury", "mercury", "conjunction", { importance: 0.5 }),
    ],
  ),
  fixedCase(
    "synthesis-reversed",
    "Expansion leads the separately reviewed reversed tension rule.",
    [
      cycle("saturn", "sun", "square", { importance: 0.5 }),
      cycle("jupiter", "mars", "trine", { importance: 0.7 }),
    ],
  ),
  fixedCase(
    "synthesis-suppressed-support",
    "A strong supporting angle contact is suppressed; retained contacts have no reviewed relationship.",
    [
      cycle("saturn", "sun", "square", { importance: 0.8 }),
      cycle("jupiter", "ascendant", "trine", { importance: 0.7 }),
      cycle("venus", "venus", "opposition", { importance: 0.3 }),
    ],
    {
      chart: {
        ...structuredClone(CHART),
        uncertainty: {
          ...CHART.uncertainty,
          accuracy: "unknown",
          housesReliable: false,
          angleClaimsSuppressed: true,
        },
      },
    },
  ),
  fixedCase(
    "synthesis-unmatched",
    "Two reviewed exact meanings do not authorize an unreviewed ordered pair.",
    [
      cycle("saturn", "sun", "square", { importance: 0.7 }),
      cycle("mars", "sun", "trine", { importance: 0.5 }),
    ],
  ),
];

/** Raw, synthetic service samples. The shared runner builds Charts and screens them in production code. */
function natalSamples({
  accuracy = "near",
  freedom = false,
  aspect = false,
  boundary = false,
  sunBoundary = false,
  mixed = false,
  degraded = false,
} = {}) {
  const band = { exact: 2, near: 15, hour: 60, unknown: 720 }[accuracy];
  const coordinates = {
    sun: [75, "Gemini"],
    moon: [freedom ? 255 : 285, freedom ? "Sagittarius" : "Capricorn"],
    mercury: [105, "Cancer"],
    venus: [135, "Leo"],
    mars: [165, "Virgo"],
    jupiter: [195, "Libra"],
    saturn: [166, "Virgo"],
    uranus: [225, "Scorpio"],
    neptune: [255, "Sagittarius"],
    pluto: [315, "Aquarius"],
    node: [345, "Pisces"],
  };
  return [-band, 0, band].map((offsetMinutes, index) => {
    const positions = Object.fromEntries(
      Object.entries(coordinates).map(([body, pair]) => {
        const [lon, sign] =
          boundary && body === "moon"
            ? [
                [269.5, "Sagittarius"],
                [270.1, "Capricorn"],
                [271, "Capricorn"],
              ][index]
            : (boundary || sunBoundary) && body === "sun"
              ? [
                  [29.5, "Aries"],
                  [30.1, "Taurus"],
                  [31, "Taurus"],
                ][index]
              : pair;
        return [body, { body, lon, sign, degree: lon % 30, lat: 0, speed: 1, retrograde: false }];
      }),
    );
    return {
      offsetMinutes,
      ephemeris: {
        positions,
        engine: "swiss-ephemeris",
        engineVersion: "synthetic-swiss-1",
        precision: "high",
        degraded: degraded && index === 0,
        degradedReason: degraded && index === 0 ? "Synthetic failed boundary" : null,
        ...(mixed && index === 0
          ? {}
          : {
              houses: {
                system: "placidus",
                cusps: [120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90],
              },
              angles: { ascendant: 120, midheaven: 30 },
            }),
        aspects: aspect
          ? [{ a: "moon", b: "saturn", aspect: "trine", orb: 1, applying: false }]
          : [],
      },
    };
  });
}
function natalCase(id, description, options = {}, cycles = [cycle("saturn", "sun", "square")]) {
  const accuracy = options.accuracy ?? "near";
  return fixedCase(id, description, cycles, {
    chart: {
      ...structuredClone(CHART),
      uncertainty: {
        ...CHART.uncertainty,
        accuracy,
        minutes: { exact: 2, near: 15, hour: 60, unknown: 720 }[accuracy],
        housesReliable: accuracy === "exact" || accuracy === "near",
        angleClaimsSuppressed: accuracy === "unknown",
      },
    },
    ...(options.legacy ? {} : { natalWindowSamples: natalSamples(options) }),
  });
}
const moonContact = () => [cycle("saturn", "moon", "square", { domain: "inner-life" })];
READING_EVAL_CASES.push(
  natalCase(
    "natal-duty-reflex",
    "Matched primary Moon contact, with a reviewed preparation-versus-settled lens.",
    {},
    moonContact(),
  ),
  natalCase(
    "natal-freedom-reflex",
    "Identical primary inputs; only synthetic natal evidence changes the commitment-versus-route distinction.",
    { freedom: true },
    moonContact(),
  ),
  natalCase(
    "natal-service-aspect",
    "A synthetic raw service aspect qualifies the compound Moon lens for a Moon contact.",
    { accuracy: "exact", aspect: true },
    moonContact(),
  ),
  natalCase(
    "natal-exact-house",
    "A synthetic exact-time Placidus house qualifies the routine comparison for a Moon contact.",
    { accuracy: "exact" },
    moonContact(),
  ),
  natalCase(
    "natal-own-target",
    "A screened sign of the transited body leads over an equally screened Moon sign.",
  ),
  natalCase(
    "natal-moon-fallback",
    "An unscreened transited-body sign falls back to the screened Moon sign.",
    { sunBoundary: true },
  ),
  natalCase(
    "natal-sign-boundary",
    "Both Moon and primary-target sign fail the three-sample sign screen.",
    { boundary: true },
  ),
  natalCase(
    "natal-unknown-time",
    "Unknown time omits N1 while ordinary transit generation continues.",
    { accuracy: "unknown" },
  ),
  natalCase(
    "natal-mixed-source",
    "Missing boundary house source preserves the qualified single Moon sign.",
    { accuracy: "exact", mixed: true },
    moonContact(),
  ),
  natalCase(
    "natal-degraded-positions",
    "Degraded boundary positions make the whole assessment unavailable.",
    { degraded: true },
  ),
  natalCase("natal-legacy-snapshot", "Absent legacy manifest supplies no invented natal lens.", {
    legacy: true,
  }),
  natalCase(
    "natal-synthesis-integration",
    "S1 and the transited body's N1 share an early paragraph with every explicit parent.",
    {},
    [
      cycle("saturn", "sun", "square", { importance: 0.7 }),
      cycle("jupiter", "mars", "trine", { importance: 0.5 }),
    ],
  ),
);

function arcCase(id, description, options = {}, mutate = () => {}, combined = false) {
  const f = analyticEpisode(options);
  mutate(f);
  return fixedCase(
    `arc-${id}`,
    description,
    [
      f.primary,
      ...(combined
        ? [
            cycle("jupiter", "mars", "trine", {
              importance: 0.5,
              exact_at: new Date(
                Date.parse(f.scan.request.referenceAt) + 2 * 86400000,
              ).toISOString(),
              ingress_at: new Date(
                Date.parse(f.scan.request.referenceAt) - 10 * 86400000,
              ).toISOString(),
              egress_at: new Date(
                Date.parse(f.scan.request.referenceAt) + 10 * 86400000,
              ).toISOString(),
            }),
          ]
        : []),
    ],
    {
      config: { day: f.day, timeZone: f.timezone },
      transitEpisodeScan: f.scan,
      transitAnchor: f.anchor,
      ...(combined ? { natalWindowSamples: natalSamples({ accuracy: "exact" }) } : {}),
    },
  );
}
READING_EVAL_CASES.push(
  arcCase("single-pass", "A single complete contact without invented repetition.", {
    count: 1,
    index: 1,
  }),
  arcCase("opening-three", "Opening contact: notice a response before settling it.", { index: 1 }),
  arcCase("return-three", "Returning contact: adjust a method or boundary.", { index: 2 }),
  arcCase(
    "closing-three",
    "Closing calculated contact: repeat a useful response without promising resolution.",
    { index: 3 },
  ),
  arcCase("return-five", "Five proven contacts, never forced into a three-pass story.", {
    count: 5,
    index: 3,
  }),
  arcCase("between-passes", "A connecting station has no current ordinal.", {
    station: true,
    amplitude: 2,
  }),
  arcCase("truncated-scan", "Resource limits omit chronology and keep primary prose.", {}, (f) => {
    f.scan.samples[0].limit = "time_limit";
  }),
  arcCase("station-tangent", "A station too close to the target cannot certify a crossing.", {
    amplitude: 0.0005,
  }),
  arcCase("birth-window-disagreement", "Disagreeing sampled counts omit chronology.", {
    birthDisagreement: true,
  }),
  arcCase(
    "synthesis-natal-integration",
    "S1, N1 and P2 remain readable in the same bounded body.",
    {},
    () => {},
    true,
  ),
);

// v6's first 38 plans remain byte-identical. These twelve are the approved
// concrete-writing population; the quiet case remains the sole model skip.
const writingCase = (id, description, sourceId, overrides = {}) => {
  const original = READING_EVAL_CASES.find((item) => item.id === sourceId);
  if (!original) throw Error("Missing fixed source for writing fixture.");
  return {
    ...structuredClone(original),
    id,
    description,
    ...overrides,
    config: { ...original.config, ...(overrides.config ?? {}) },
  };
};
READING_EVAL_CASES.push(
  writingCase(
    "writing-reply-scene",
    "One unfinished reply remains a possible comparison, never an observed event.",
    "mercury-conjunction-clinical",
    { config: { tone: "plain" } },
  ),
  writingCase(
    "writing-calendar-scene",
    "A full calendar illustrates the room around an obligation.",
    "saturn-square-moon-warm",
  ),
  fixedCase(
    "writing-default-task-scene",
    "A default task illustrates the fit between a role and its effort.",
    [cycle("saturn", "sun", "opposition")],
  ),
  writingCase(
    "writing-synthesis-focus",
    "Positive S1 owns one central thread with both interpretation parents.",
    "synthesis-tension",
  ),
  writingCase(
    "writing-legacy-no-scenes",
    "An explicitly empty frame inventory yields useful source copy without borrowing a scene.",
    "saturn-square-sun",
    { writingFrameMode: "none" },
  ),
  writingCase(
    "writing-example-isolation",
    "A Mercury reply cannot borrow the demonstration calendar or project subject.",
    "mercury-conjunction-clinical",
    { config: { tone: "plain" } },
  ),
  writingCase(
    "writing-tone-plain",
    "Plain voice develops the same structure/initiative facts.",
    "synthesis-tension",
    { config: { tone: "plain" } },
  ),
  writingCase(
    "writing-tone-warm",
    "Warm voice develops the same structure/initiative facts.",
    "synthesis-tension",
    { config: { tone: "warm" } },
  ),
  writingCase(
    "writing-tone-clinical",
    "Clinical voice develops the same structure/initiative facts.",
    "synthesis-tension",
    { config: { tone: "clinical" } },
  ),
  writingCase(
    "writing-technical-scene",
    "Technical prose keeps calculated measurements separate from a possible calendar illustration.",
    "saturn-square-sun",
    { config: { depth: "technical" } },
  ),
  writingCase(
    "writing-recent-repeat",
    "Fixed recent prose is checked locally and never enters the provider request.",
    "mercury-conjunction-clinical",
    {
      config: { tone: "plain" },
      recentWritingBodies: [
        {
          day: "2026-10-10",
          paragraphs: [
            "If a reply remains unfinished, its point can need clearer wording. The comparison concerns what is meant and the words used to articulate it.",
          ],
          requiredLiteralSentences: [],
        },
      ],
    },
  ),
  writingCase(
    "writing-all-evidence",
    "Synthesis, natal lens and calculated chapter retain one supported scene and one source reflection.",
    "arc-synthesis-natal-integration",
  ),
);
