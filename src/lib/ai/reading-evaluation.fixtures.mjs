/** Synthetic plans only: these are not birth records or an ephemeris quality test. */
export const READING_EVAL_FIXTURE_VERSION = "synthetic-daily-2";

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
];
