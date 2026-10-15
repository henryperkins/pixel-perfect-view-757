/** Pure, immutable candidate-only plan. No provider, member records or release pointer access. */
import { createHash } from "node:crypto";
import {
  EDITORIAL_CANDIDATE_BUNDLE,
  EDITORIAL_CANDIDATE_BASELINE,
} from "../content/editorial-candidate-bundle";
import { canonicalContentJson } from "../content/draft-comparison";
import { validateContentGraph } from "../content/schema";
import { languageModel, type LanguageProvider } from "./diagnostics";
import { getEvaluationCaseSet } from "./evaluation-case-sets";
import { EDITORIAL_SOURCE_FIXTURES } from "./reading-evaluation.editorial.fixtures";
import { createEvaluationPlan, type EvaluationPlan } from "./qualification-plan.server";
import {
  EDITORIAL_PILOT_VERSION,
  EDITORIAL_PILOT_CASE_SET_ID,
  EDITORIAL_PILOT_ATTEMPT_LIMIT,
  EDITORIAL_PILOT_DOLLAR_CEILING_MICROS,
  EDITORIAL_PILOT_REVIEW_RUBRIC,
} from "./editorial-pilot";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const canonicalHash = (value: unknown) =>
  createHash("sha256").update(canonicalContentJson(value)).digest("hex");

export function createEditorialPilotPlan(sourceSha: string | null, provider: LanguageProvider) {
  if (!sourceSha || !/^[a-f0-9]{40}$/.test(sourceSha))
    throw Error("The editorial pilot requires the exact built source SHA.");
  if (provider !== "lovable" && provider !== "gemini-enterprise")
    throw Error("Unsupported editorial pilot provider.");
  const candidate = structuredClone(EDITORIAL_CANDIDATE_BUNDLE);
  validateContentGraph(candidate);
  const caseManifest = getEvaluationCaseSet(EDITORIAL_PILOT_CASE_SET_ID);
  const base = createEvaluationPlan(candidate, undefined, sourceSha, provider, caseManifest.id);
  if (
    base.cases.length !== 9 ||
    base.attemptLimit !== EDITORIAL_PILOT_ATTEMPT_LIMIT ||
    base.cases.some((item) => !item.writingPlan.editorial) ||
    base.cases.slice(5).some((item) => item.expectsModel) ||
    base.cases[4]?.interpretationPlan.interpretations[0]?.interpretationKey !==
      "square:neptune:mercury"
  )
    throw Error("The closed editorial pilot scope or selected Neptune source changed.");
  const editorialPilot = {
    version: EDITORIAL_PILOT_VERSION,
    provider,
    model: languageModel(provider),
    caseSetId: EDITORIAL_PILOT_CASE_SET_ID,
    caseManifest,
    candidate,
    candidateHash: hash(candidate),
    candidateCanonicalHash: canonicalHash(candidate),
    baselineIdentity: EDITORIAL_CANDIDATE_BASELINE,
    originalFixtures: EDITORIAL_SOURCE_FIXTURES.map((fixture) => ({
      fixture: structuredClone(fixture),
      configHash: hash(fixture),
    })),
    dollarCeilingMicros: EDITORIAL_PILOT_DOLLAR_CEILING_MICROS,
    reviewReserveMicros: 0,
    reviewRubric: EDITORIAL_PILOT_REVIEW_RUBRIC,
    quietSequence: {
      from: "2026-10-11",
      through: "2026-10-14",
      modelAttempts: 0,
      history:
        "No member history; deterministic local-day rotation, reviewed together after capture.",
    },
  };
  const { hash: _previous, ...dry } = base;
  const frozen = structuredClone({ ...dry, editorialPilot });
  const plan = { ...frozen, hash: hash(frozen) };
  if (Buffer.byteLength(JSON.stringify(plan)) > 1_900_000)
    throw Error("The frozen editorial pilot exceeds the database row size.");
  return plan;
}

export type EditorialPilotPlan = ReturnType<typeof createEditorialPilotPlan>;
export type EditorialPilotDetails = EditorialPilotPlan["editorialPilot"];

export function revalidateEditorialPilotPlan(
  stored: EvaluationPlan,
  sourceSha: string | null,
  provider: LanguageProvider,
): EditorialPilotPlan {
  if (
    !stored.editorialPilot ||
    stored.editorialPilot.version !== EDITORIAL_PILOT_VERSION ||
    stored.sourceSha !== sourceSha ||
    stored.editorialPilot.provider !== provider
  )
    throw Error("The frozen editorial pilot source or provider changed.");
  const { hash: expected, ...frozen } = stored;
  if (hash(frozen) !== expected)
    throw Error("The frozen editorial pilot hash failed its integrity check.");
  const rebuilt = createEditorialPilotPlan(sourceSha, provider);
  if (rebuilt.hash !== expected)
    throw Error("The editorial pilot runtime, candidate, fixture or policy changed.");
  return rebuilt;
}
