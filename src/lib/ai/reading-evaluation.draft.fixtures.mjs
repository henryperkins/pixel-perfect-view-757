/**
 * Synthetic editorial fixtures, never member charts or ephemeris evidence.
 * Geometry is fixed independently of candidate copy: do not select replacement
 * contacts merely because a future candidate no longer matches the expected key.
 * The complete 70-case catalogue is offline coverage, not paid-run authorization.
 */
export const DRAFT_FALLBACK_FIXTURE_VERSION = "draft-fallback-1";
export const DRAFT_PILOT_FIXTURE_VERSION = "draft-pilot-1";

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

// Explicit ordered inputs, including both families for every supported body.
const CONTACTS = [
  ["sun", "mercury", "square", "identity", "plain", "standard"],
  ["sun", "mercury", "sextile", "identity", "plain", "standard"],
  ["moon", "mercury", "square", "inner-life", "plain", "standard"],
  ["moon", "mercury", "sextile", "inner-life", "plain", "standard"],
  ["mercury", "moon", "square", "work", "plain", "standard"],
  ["mercury", "moon", "sextile", "work", "plain", "standard"],
  ["venus", "mercury", "square", "relationships", "plain", "standard"],
  ["venus", "mercury", "sextile", "relationships", "plain", "standard"],
  ["mars", "mercury", "square", "work", "plain", "standard"],
  ["mars", "mercury", "sextile", "work", "plain", "standard"],
  ["jupiter", "mercury", "square", "identity", "plain", "standard"],
  ["jupiter", "mercury", "sextile", "identity", "plain", "standard"],
  ["saturn", "mercury", "square", "work", "plain", "standard"],
  ["saturn", "mercury", "sextile", "work", "plain", "technical"],
  ["uranus", "mercury", "square", "identity", "warm", "standard"],
  ["uranus", "mercury", "sextile", "identity", "plain", "standard"],
  ["neptune", "mercury", "square", "inner-life", "plain", "standard"],
  ["neptune", "mercury", "sextile", "inner-life", "clinical", "standard"],
  ["pluto", "mercury", "square", "identity", "plain", "standard"],
  ["pluto", "mercury", "sextile", "identity", "plain", "standard"],
];

export const DRAFT_FALLBACK_CASES = CONTACTS.map(([body, target, aspect, domain, tone, depth]) => {
  const family = aspect === "square" ? "hard" : "soft";
  return {
    id: `fallback-${family}-${body}-${target}`,
    description: `Fixed ${body} ${aspect} natal ${target}; exercises the ${family}:${body}:* candidate source.`,
    chart: structuredClone(CHART),
    cycles: [
      {
        cycle_key: `${body}_${aspect}_${target}`,
        transit_body: body,
        natal_point: target,
        aspect,
        orb: 0.42,
        phase: "approaching",
        domain,
        importance: 0.4,
        ingress_at: "2026-10-01T12:00:00Z",
        exact_at: "2026-10-14T01:00:00Z",
        egress_at: "2026-10-28T12:00:00Z",
        label: `${body} ${aspect} natal ${target}`,
        arc_position: 0.3,
      },
    ],
    config: {
      day: "2026-10-11",
      timeZone: "UTC",
      tone,
      depth,
      granted: ["USR-01", "USR-02"],
    },
  };
});

// Four cases per arm, eight total generation attempts across the approved pair.
// These exact IDs are intentional; the selector never samples a larger suite.
export const DRAFT_PILOT_CASE_IDS = [
  "fallback-hard-mars-mercury",
  "fallback-hard-uranus-mercury",
  "fallback-soft-saturn-mercury",
  "fallback-soft-neptune-mercury",
];

export const DRAFT_PILOT_CASES = DRAFT_PILOT_CASE_IDS.map((id) => {
  const fixed = DRAFT_FALLBACK_CASES.find((item) => item.id === id);
  if (!fixed) throw new Error(`Missing fixed draft pilot case: ${id}`);
  return fixed;
});
