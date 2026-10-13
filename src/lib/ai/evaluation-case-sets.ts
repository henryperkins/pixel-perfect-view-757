/** Closed, synchronous manifests shared by the server and report UI. */
import {
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
  type SyntheticFixture,
} from "./reading-evaluation.fixtures.mjs";
import {
  DRAFT_FALLBACK_CASES,
  DRAFT_FALLBACK_FIXTURE_VERSION,
  DRAFT_PILOT_CASES,
  DRAFT_PILOT_FIXTURE_VERSION,
} from "./reading-evaluation.draft.fixtures.mjs";

export type EvaluationCaseSetId = "synthetic-daily-7" | "draft-fallback-1" | "draft-pilot-1";

export interface EvaluationCaseSet {
  id: EvaluationCaseSetId;
  fixtureVersion: string;
  cases: SyntheticFixture[];
  caseSetHash: string;
}

// SHA-256(JSON.stringify(cases)), verified by reading-draft-coverage.test.mjs.
// Pinned values keep this shared module browser-safe and preserve the historical
// hash algorithm. Fixture edits require an explicit new version and identity.
const MANIFESTS: Record<EvaluationCaseSetId, EvaluationCaseSet> = {
  "synthetic-daily-7": {
    id: "synthetic-daily-7",
    fixtureVersion: READING_EVAL_FIXTURE_VERSION,
    cases: READING_EVAL_CASES,
    caseSetHash: "245cd4480c6b11cf15d703915bf49af4785744fdf998115e00341b20a51b0bfa",
  },
  "draft-fallback-1": {
    id: "draft-fallback-1",
    fixtureVersion: DRAFT_FALLBACK_FIXTURE_VERSION,
    cases: [...READING_EVAL_CASES, ...DRAFT_FALLBACK_CASES],
    caseSetHash: "047e6aaa68f78985b1541423110a4e81d38062d9997945d1dff2b214f2dbc641",
  },
  "draft-pilot-1": {
    id: "draft-pilot-1",
    fixtureVersion: DRAFT_PILOT_FIXTURE_VERSION,
    cases: DRAFT_PILOT_CASES,
    caseSetHash: "43562fc3e43edfa47087c1461209b6592269ec2d9b9f048a6e08a2f1c0e33aac",
  },
};

export function getEvaluationCaseSet(
  caseSetId: EvaluationCaseSetId = "synthetic-daily-7",
): EvaluationCaseSet {
  if (!Object.hasOwn(MANIFESTS, caseSetId))
    throw new Error("Unknown synthetic evaluation case set");
  // Preparation and UI callers cannot mutate the catalogue of a subsequent run.
  return structuredClone(MANIFESTS[caseSetId]);
}
