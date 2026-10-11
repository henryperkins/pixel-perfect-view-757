/** Synthetic plans only: these are not birth records or an ephemeris quality test. */
export const READING_EVAL_FIXTURE_VERSION = "synthetic-daily-5";

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
