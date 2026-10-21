/** Admin report inventory only. Synthetic inputs, prompts and scans stay on the server. */
import type { EvaluationCaseSetId } from "./evaluation-case-sets";

export const READING_EVAL_FIXTURE_VERSION = "synthetic-daily-7";

// Kept in fixture order; parity is checked against the server manifests in tests.
const DESCRIPTIONS = [
  ["saturn-square-sun", "Common hard contact, plain standard reading."],
  ["saturn-square-moon-warm", "Warm tone with the published inner-life interpretation."],
  ["jupiter-trine-sun-technical", "Technical depth, soft contact, and exact phase."],
  ["mercury-conjunction-clinical", "Clinical tone and separating information-load contact."],
  ["venus-opposition-venus", "Short preference contact with relationship framing."],
  ["unknown-birth-time", "An apparently stronger angle contact is excluded rather than guessed."],
  [
    "approximate-birth-time",
    "Approximate time suppresses an apparent house placement while retaining a planet contact.",
  ],
  [
    "moon-dst-boundary",
    "Moon timing crosses the local date boundary before a daylight-saving transition.",
  ],
  ["multiple-cycles", "Unsorted contacts exercise the shared strongest-three plan and threshold."],
  ["quiet-threshold", "No contact exceeds the shared importance threshold."],
  ["synthesis-tension", "Reviewed structure and expansion relationship, primary first."],
  ["synthesis-reinforcement", "Reviewed steady commitment and practical initiative relationship."],
  ["synthesis-independent", "Reviewed preference and expression contacts remain separate."],
  ["synthesis-reversed", "Expansion leads the separately reviewed reversed tension rule."],
  [
    "synthesis-suppressed-support",
    "A strong supporting angle contact is suppressed; retained contacts have no reviewed relationship.",
  ],
  [
    "synthesis-unmatched",
    "Two reviewed exact meanings do not authorize an unreviewed ordered pair.",
  ],
  [
    "natal-duty-reflex",
    "Matched primary Moon contact, with a reviewed preparation-versus-settled lens.",
  ],
  [
    "natal-freedom-reflex",
    "Identical primary inputs; only synthetic natal evidence changes the commitment-versus-route distinction.",
  ],
  [
    "natal-service-aspect",
    "A synthetic raw service aspect qualifies the compound Moon lens for a Moon contact.",
  ],
  [
    "natal-exact-house",
    "A synthetic exact-time Placidus house qualifies the routine comparison for a Moon contact.",
  ],
  [
    "natal-own-target",
    "A screened sign of the transited body leads over an equally screened Moon sign.",
  ],
  [
    "natal-moon-fallback",
    "An unscreened transited-body sign falls back to the screened Moon sign.",
  ],
  ["natal-sign-boundary", "Both Moon and primary-target sign fail the three-sample sign screen."],
  ["natal-unknown-time", "Unknown time omits N1 while ordinary transit generation continues."],
  ["natal-mixed-source", "Missing boundary house source preserves the qualified single Moon sign."],
  [
    "natal-degraded-positions",
    "Degraded boundary positions make the whole assessment unavailable.",
  ],
  ["natal-legacy-snapshot", "Absent legacy manifest supplies no invented natal lens."],
  [
    "natal-synthesis-integration",
    "S1 and the transited body's N1 share an early paragraph with every explicit parent.",
  ],
  ["arc-single-pass", "A single complete contact without invented repetition."],
  ["arc-opening-three", "Opening contact: notice a response before settling it."],
  ["arc-return-three", "Returning contact: adjust a method or boundary."],
  [
    "arc-closing-three",
    "Closing calculated contact: repeat a useful response without promising resolution.",
  ],
  ["arc-return-five", "Five proven contacts, never forced into a three-pass story."],
  ["arc-between-passes", "A connecting station has no current ordinal."],
  ["arc-truncated-scan", "Resource limits omit chronology and keep primary prose."],
  ["arc-station-tangent", "A station too close to the target cannot certify a crossing."],
  ["arc-birth-window-disagreement", "Disagreeing sampled counts omit chronology."],
  ["arc-synthesis-natal-integration", "S1, N1 and P2 remain readable in the same bounded body."],
  [
    "writing-reply-scene",
    "One unfinished reply remains a possible comparison, never an observed event.",
  ],
  ["writing-calendar-scene", "A full calendar illustrates the room around an obligation."],
  [
    "writing-default-task-scene",
    "A default task illustrates the fit between a role and its effort.",
  ],
  [
    "writing-synthesis-focus",
    "Positive S1 owns one central thread with both interpretation parents.",
  ],
  [
    "writing-legacy-no-scenes",
    "An explicitly empty frame inventory yields useful source copy without borrowing a scene.",
  ],
  [
    "writing-example-isolation",
    "A Mercury reply cannot borrow the demonstration calendar or project subject.",
  ],
  ["writing-tone-plain", "Plain voice develops the same structure/initiative facts."],
  ["writing-tone-warm", "Warm voice develops the same structure/initiative facts."],
  ["writing-tone-clinical", "Clinical voice develops the same structure/initiative facts."],
  [
    "writing-technical-scene",
    "Technical prose keeps calculated measurements separate from a possible calendar illustration.",
  ],
  [
    "writing-recent-repeat",
    "Fixed recent prose is checked locally and never enters the provider request.",
  ],
  [
    "writing-all-evidence",
    "Synthesis, natal lens and calculated chapter retain one supported scene and one source reflection.",
  ],
] as const;

export const EVALUATION_CASE_CATALOG = DESCRIPTIONS.map(([id, description]) => ({
  id,
  description,
}));
const baseIds = EVALUATION_CASE_CATALOG.map(({ id }) => id);
const fallbackIds = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
].flatMap((body) =>
  ["hard", "soft"].map(
    (aspect) => `fallback-${aspect}-${body}-${body === "mercury" ? "moon" : "mercury"}`,
  ),
);
const pilotIds = [
  "fallback-hard-mars-mercury",
  "fallback-hard-uranus-mercury",
  "fallback-soft-saturn-mercury",
  "fallback-soft-neptune-mercury",
];

interface CaseSetInventory {
  fixtureVersion: string;
  caseSetHash: string;
  cases: { id: string }[];
}

const inventory = (
  fixtureVersion: string,
  caseSetHash: string,
  ids: readonly string[],
): CaseSetInventory => ({
  fixtureVersion,
  caseSetHash,
  cases: ids.map((id) => ({ id })),
});
const fallbackHash = "047e6aaa68f78985b1541423110a4e81d38062d9997945d1dff2b214f2dbc641";
const pilotHash = "43562fc3e43edfa47087c1461209b6592269ec2d9b9f048a6e08a2f1c0e33aac";
const INVENTORIES: Record<EvaluationCaseSetId, CaseSetInventory> = {
  "synthetic-daily-7": inventory(
    READING_EVAL_FIXTURE_VERSION,
    "245cd4480c6b11cf15d703915bf49af4785744fdf998115e00341b20a51b0bfa",
    baseIds,
  ),
  "draft-fallback-1": inventory("draft-fallback-1", fallbackHash, [...baseIds, ...fallbackIds]),
  "draft-fallback-2": inventory("draft-fallback-2", fallbackHash, [...baseIds, ...fallbackIds]),
  "draft-pilot-1": inventory("draft-pilot-1", pilotHash, pilotIds),
  "draft-pilot-2": inventory("draft-pilot-2", pilotHash, pilotIds),
  "daily-editorial-1": inventory(
    "daily-editorial-1",
    "21d23904d7966433d58419261da78a64d5f1434421d4104306c194f225a75eb2",
    [
      "writing-reply-scene",
      "venus-opposition-venus",
      "synthesis-tension",
      "jupiter-trine-sun-technical",
      "fallback-hard-neptune-mercury",
      "quiet-threshold",
      "editorial-quiet-2026-10-12",
      "editorial-quiet-2026-10-13",
      "editorial-quiet-2026-10-14",
    ],
  ),
  "daily-context-1": inventory(
    "daily-context-1",
    "93855b484ef95b1b950fc229633d4467215ff0cd2c6d6ce1eb1445ba3375f5c4",
    [
      "contact-only",
      "natal-only",
      "transit-only",
      "natal-and-transit",
      "synthesis-natal-and-transit",
    ],
  ),
};

export function getEvaluationCaseInventory(id: EvaluationCaseSetId): CaseSetInventory {
  if (!Object.hasOwn(INVENTORIES, id)) throw new Error("Unknown synthetic evaluation case set");
  return structuredClone(INVENTORIES[id]);
}
