/** Local-only accounting for an explicitly frozen four-case content comparison. */
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  DRAFT_PILOT_CASES,
  DRAFT_FALLBACK_CASES,
} from "../src/lib/ai/reading-evaluation.draft.fixtures.mjs";

export const CONTENT_REFLECTION_INSTRUCTIONS =
  "Content reflection supplement — content-reflection-review-1: Review sourceQuestion and reflectionQuestion separately. The source checks are singleQuestion, answerableWithoutPremise, and consistentWithSources; all must pass with a verbatim quote and explanation. For the final prompt record question count separately and check answerableWithoutPremise, consistentWithSources, and coherent. A schema-4 domain question is an inherited composition, not a second source question. Record all body dimensions using the existing 1–5 rubric and existing item-verdict rules. A separate qualification gate requires voice and repetition >= 4 for affected candidate items; packet origins remain concealed. Citations do not establish substantive incorporation.";
export function contentReflectionInstructions(plan) {
  return plan.version === "content-comparison-2"
    ? CONTENT_REFLECTION_INSTRUCTIONS.replace(
        "content-reflection-review-1",
        "content-reflection-review-2",
      ).replace(
        "A schema-4 domain question is an inherited composition, not a second source question.",
        "Require a single final question: finalPrompt.singleQuestion must pass independently of the source question, and its recorded question count must be one.",
      )
    : CONTENT_REFLECTION_INSTRUCTIONS;
}
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const withoutHash = ({ hash: _hash, ...value }) => value;
const normalized = (value) => value ?? null;
const requireEqual = (actual, expected, label) => {
  if (!isDeepStrictEqual(actual, expected))
    throw new Error(`Content comparison ${label} does not match the frozen plan`);
};
const POLICY_FIELDS = [
  "sourceSha",
  "fixtureVersion",
  "caseSetHash",
  "caseSetId",
  "bundleVersion",
  "bundleHash",
  "transitCopyHash",
  "planVersion",
  "qualificationProfile",
  "qualificationPolicyVersion",
  "requestPolicyVersion",
  "natalPlanVersion",
  "reliabilityVersion",
  "storyPlanVersion",
  "anchorVersion",
  "solverVersion",
  "sourceContract",
  "transitFixtureHash",
  "storyUse",
  "writingPlanVersion",
  "writingQualityVersion",
  "reflectionVersion",
  "voiceExamplesVersion",
  "promptVersion",
  "validatorVersion",
  "model",
  "gatewayTimeoutMs",
];

/** Reject cycles-only archives and unbound snapshots before touching a report. */
export function validateContentComparisonPlan(plan) {
  if (
    !(
      (plan?.version === "content-comparison-1" && plan.caseSetId === "draft-pilot-1") ||
      (plan?.version === "content-comparison-2" && plan.caseSetId === "draft-pilot-2")
    ) ||
    !/^[a-f0-9]{40}$/.test(plan.sourceSha ?? "")
  )
    throw new Error("Content comparison requires a frozen source-bound draft pilot plan");
  requireEqual(plan.hash, hash(withoutHash(plan)), "pair hash");
  requireEqual(plan.caseManifest?.id, plan.caseSetId, "manifest identity");
  requireEqual(plan.caseManifest?.fixtureVersion, plan.caseSetId, "fixture version");
  requireEqual(plan.caseManifest?.cases, DRAFT_PILOT_CASES, "ordered fixture catalogue");
  requireEqual(plan.caseManifest.caseSetHash, hash(DRAFT_PILOT_CASES), "fixture hash");
  requireEqual(plan.attemptLimit, 8, "eight-attempt scope");
  if (!["lovable", "gemini-enterprise"].includes(plan.provider) || typeof plan.model !== "string")
    throw new Error("Content comparison needs its recorded provider and model");
  for (const arm of ["baseline", "candidate"]) {
    const bundle = plan.bundles?.[arm],
      identity = plan.identities?.[arm],
      dry = plan.arms?.[arm];
    if (
      !bundle ||
      !Array.isArray(bundle.cycles) ||
      ["natal", "phases", "domains"].some(
        (key) => !bundle[key] || typeof bundle[key] !== "object" || Array.isArray(bundle[key]),
      )
    )
      throw new Error(
        "Content comparison requires complete bundle snapshots; a cycle archive is insufficient",
      );
    requireEqual(identity?.version, bundle.version, `${arm} bundle version`);
    requireEqual(identity?.bundleHash, hash(bundle), `${arm} bundle hash`);
    requireEqual(identity?.canonicalHash, hash(canonical(bundle)), `${arm} canonical hash`);
    requireEqual(dry?.hash, hash(withoutHash(dry ?? {})), `${arm} dry plan hash`);
    requireEqual(dry?.metadata?.bundleHash, hash(bundle), `${arm} dry bundle hash`);
    requireEqual(dry?.metadata?.sourceSha, plan.sourceSha, `${arm} source SHA`);
    requireEqual(dry?.metadata?.model, plan.model, `${arm} requested model`);
    requireEqual(dry?.metadata?.caseSetHash, plan.caseManifest.caseSetHash, `${arm} case set`);
    requireEqual(
      dry?.cases?.map(({ id, configHash }) => ({ id, configHash })),
      DRAFT_PILOT_CASES.map((fixed) => ({ id: fixed.id, configHash: hash(fixed) })),
      `${arm} ordered cases`,
    );
    for (const row of dry.cases)
      requireEqual(row.planHash, hash(withoutPlanHash(row)), `${arm}/${row.id} dry case hash`);
  }
  const outsideCycles = ({ version: _version, cycles: _cycles, ...bundle }) => bundle;
  requireEqual(
    canonical(outsideCycles(plan.bundles.baseline)),
    canonical(outsideCycles(plan.bundles.candidate)),
    "unchanged non-cycle catalogues",
  );
  const keys = [
    ...new Set(
      [...plan.bundles.baseline.cycles, ...plan.bundles.candidate.cycles].map((entry) => entry.key),
    ),
  ];
  const changed = keys.filter(
    (key) =>
      !isDeepStrictEqual(
        canonical(plan.bundles.baseline.cycles.find((entry) => entry.key === key)),
        canonical(plan.bundles.candidate.cycles.find((entry) => entry.key === key)),
      ),
  );
  requireEqual(
    [...plan.changedKeys].sort(),
    changed.sort(),
    "declared changed interpretation keys",
  );
  return plan;
}

function withoutPlanHash({ planHash: _hash, ...value }) {
  return value;
}

function expectedArm(plan, arm) {
  const frozen = withoutHash({ ...plan.arms[arm], contentComparison: { arm, pair: plan } });
  return { ...frozen, hash: hash(frozen) };
}

export function validateContentReport(report, { plan, arm }) {
  validateContentComparisonPlan(plan);
  if (!["baseline", "candidate"].includes(arm)) throw new Error("Unknown content comparison arm");
  if (
    report?.reportVersion !== 1 ||
    report.source !== "live-synthetic" ||
    report.partial !== false ||
    !Array.isArray(report.cases)
  )
    throw new Error("Content comparison requires complete live-synthetic reports");
  const dry = expectedArm(plan, arm);
  requireEqual(report.runPlanHash, dry.hash, `${arm} run plan hash`);
  requireEqual(report.sourceSha, plan.sourceSha, `${arm} source SHA`);
  requireEqual(report.expectedCases, 4, `${arm} case count`);
  requireEqual(
    report.contentComparison,
    {
      version: plan.version,
      arm,
      pairHash: plan.hash,
      baselineCanonicalHash: plan.identities.baseline.canonicalHash,
      candidateCanonicalHash: plan.identities.candidate.canonicalHash,
      caseSetId: plan.caseSetId,
    },
    `${arm} declared pair`,
  );
  for (const key of POLICY_FIELDS)
    requireEqual(normalized(report[key]), normalized(dry.metadata[key]), `${arm} ${key}`);
  requireEqual(
    report.cases.map((row) => row.id),
    dry.cases.map((row) => row.id),
    `${arm} ordered report cases`,
  );
  for (let index = 0; index < report.cases.length; index++) {
    const row = report.cases[index],
      expected = dry.cases[index];
    requireEqual(row.configHash, expected.configHash, `${arm}/${row.id} config hash`);
    requireEqual(row.facts, expected.facts, `${arm}/${row.id} source facts`);
    requireEqual(
      row.interpretationPlan,
      expected.interpretationPlan,
      `${arm}/${row.id} selected sources`,
    );
    requireEqual(
      row.template?.body,
      expected.template.body,
      `${arm}/${row.id} deterministic template`,
    );
    requireEqual(
      row.output?.prompt,
      expected.template.prompt,
      `${arm}/${row.id} final reflection question`,
    );
    if (
      !row.diagnostics ||
      !["accepted", "rejected", "unavailable", "skipped"].includes(row.diagnostics.outcome)
    )
      throw new Error(`Content comparison ${arm}/${row.id} lacks diagnostics`);
    for (const key of ["promptVersion", "validatorVersion"])
      requireEqual(row.diagnostics[key], dry.metadata[key], `${arm}/${row.id} ${key}`);
    if (row.request) requireEqual(row.request.model, plan.model, `${arm}/${row.id} request model`);
    if (row.transport) {
      requireEqual(row.transport.provider, plan.provider, `${arm}/${row.id} provider`);
      requireEqual(row.transport.requestedModel, plan.model, `${arm}/${row.id} requested model`);
      requireEqual(
        row.transport.deadlineMs,
        dry.metadata.gatewayTimeoutMs,
        `${arm}/${row.id} timeout`,
      );
    } else if (row.diagnostics.outcome === "accepted")
      throw new Error(`Content comparison ${arm}/${row.id} has no observed provider`);
  }
  return dry;
}

const literalUse = (body, mechanism) =>
  typeof body === "string" &&
  typeof mechanism === "string" &&
  mechanism.trim().length > 0 &&
  mechanism.split(/(?<=[.!?])\s+/).every((sentence) => body.includes(sentence));
const captureReady = (row) =>
  row.candidate?.captureLossless === true &&
  row.candidate?.truncated === false &&
  Array.isArray(row.candidate?.paragraphs) &&
  row.candidate.paragraphCount === row.candidate.paragraphs.length &&
  row.candidate.paragraphs.every(
    (paragraph) =>
      typeof paragraph?.text === "string" &&
      Array.isArray(paragraph.facts) &&
      paragraph.facts.every((id) => typeof id === "string"),
  );

function observation(report, source) {
  const evidence = [];
  if (source)
    for (const row of report.cases) {
      for (const selected of row.interpretationPlan.interpretations.filter(
        (entry) => entry.interpretationKey === source.key,
      )) {
        const id = `I${selected.index}`;
        const fact = row.facts.find((entry) => entry.id === id && entry.sourceKey === source.key);
        const request =
          row.request?.messages
            ?.filter((message) => message.role === "user")
            .map((message) => message.content)
            .join("\n") ?? "";
        evidence.push({
          caseId: row.id,
          factId: id,
          selected: true,
          submitted: Boolean(fact && request.includes(`${id}: ${fact.statement}`)),
          acceptedCited:
            row.diagnostics.outcome === "accepted" &&
            row.output.mode === "model" &&
            Boolean(row.output.citations?.some((citation) => citation.facts.includes(id))),
          templateRendered: literalUse(row.template.body, source.mechanism),
          finalRendered: literalUse(row.output.body, source.mechanism),
          sourceQuestion: source.question,
          finalQuestion: row.output.prompt,
          semanticIncorporation: "unreviewed",
        });
      }
    }
  const stages = ["selected", "submitted", "acceptedCited", "templateRendered", "finalRendered"];
  return {
    ...Object.fromEntries(
      stages.map((stage) => [stage, evidence.filter((entry) => entry[stage]).length]),
    ),
    evidence,
  };
}

export function compareContentReports(before, after, { plan } = {}) {
  validateContentReport(before, { plan, arm: "baseline" });
  validateContentReport(after, { plan, arm: "candidate" });
  const actual = new Set(
    [...before.cases, ...after.cases].map((row) => row.transport?.actualModel).filter(Boolean),
  );
  if (actual.size > 1)
    throw new Error("Content comparison actual provider model changed across the pair");
  const expectedModel = plan.model.replace(/^(?:google|gemini-enterprise)\//, "");
  for (const model of actual)
    if (
      model.replace(/^google\//, "") !== expectedModel &&
      !new RegExp(`^${expectedModel.replaceAll(".", "\\.")}-\\d{3,8}$`).test(
        model.replace(/^google\//, ""),
      )
    )
      throw new Error("Content comparison actual model is outside the frozen model family");
  const bodies = [...new Set(DRAFT_FALLBACK_CASES.map((fixed) => fixed.cycles[0].transit_body))];
  const entries = plan.changedKeys.map((key) => {
    const base = plan.bundles.baseline.cycles.find((entry) => entry.key === key);
    const candidate = plan.bundles.candidate.cycles.find((entry) => entry.key === key);
    const family = key.split(":")[0];
    const shadowed =
      ["hard:*:*", "soft:*:*"].includes(key) &&
      bodies.every((body) =>
        plan.bundles.candidate.cycles.some((entry) => entry.key === `${family}:${body}:*`),
      );
    return {
      key,
      reachability: shadowed ? "shadowed-in-supported-catalogue" : "supported-source",
      baseline: observation(before, base),
      candidate: observation(after, candidate),
      semanticIncorporation: "unreviewed",
    };
  });
  const gaps = [
    "Semantic incorporation and reflection-question quality require independent review.",
  ];
  const unexercised = entries.filter(
    (entry) =>
      entry.reachability !== "shadowed-in-supported-catalogue" && !entry.candidate.selected,
  );
  if (unexercised.length)
    gaps.push(`${unexercised.length} changed reachable sources were not exercised by this pilot.`);
  for (const [arm, report] of [
    ["baseline", before],
    ["candidate", after],
  ])
    for (const row of report.cases) {
      if (!row.transport?.actualModel)
        gaps.push(`${arm}/${row.id}: actual model was not observed.`);
      if (!captureReady(row)) gaps.push(`${arm}/${row.id}: lossless model capture is unavailable.`);
      if (row.diagnostics.outcome !== "accepted")
        gaps.push(`${arm}/${row.id}: generation outcome was ${row.diagnostics.outcome}.`);
    }
  return {
    version: "content-comparison-report-1",
    mode: "content-comparison",
    pairHash: plan.hash,
    sourceSha: plan.sourceSha,
    provider: plan.provider,
    model: plan.model,
    actualModel: [...actual][0] ?? null,
    caseSetId: plan.caseSetId,
    caseSetHash: plan.caseManifest.caseSetHash,
    baselineCanonicalHash: plan.identities.baseline.canonicalHash,
    candidateCanonicalHash: plan.identities.candidate.canonicalHash,
    acceptedDelta:
      after.cases.filter((row) => row.diagnostics.outcome === "accepted").length -
      before.cases.filter((row) => row.diagnostics.outcome === "accepted").length,
    cases: before.cases.map((row, index) => ({
      id: row.id,
      baseline: { outcome: row.diagnostics.outcome, code: row.diagnostics.code },
      candidate: {
        outcome: after.cases[index].diagnostics.outcome,
        code: after.cases[index].diagnostics.code,
      },
      textChanged: row.output.body !== after.cases[index].output.body,
    })),
    coverage: { version: "content-source-utilization-1", entries },
    qualified: false,
    semanticIncorporation: "unreviewed",
    qualificationGaps: gaps,
    limitations: [
      "This four-case pilot cannot qualify all 20 new body-specific sources.",
      "Selected sources, submitted facts, accepted citations and literal rendered text are distinct observations; none establishes semantic incorporation.",
      "Literal rendering checks every source sentence; a paraphrase or authored composition requires manual review.",
      "Synthetic reports do not establish production use, member acceptance or empirical astrology validity.",
    ],
  };
}

/** Lossless capture export only; this performs no generation or provider request. */
export function extractContentResponses(report, { plan, arm } = {}) {
  validateContentReport(report, { plan, arm });
  return Object.fromEntries(
    report.cases.map((row) => {
      if (!captureReady(row))
        throw new Error(
          `Content comparison ${arm}/${row.id} draft capture is missing or uncertain`,
        );
      return [row.id, { paragraphs: structuredClone(row.candidate.paragraphs) }];
    }),
  );
}

/** Save this artifact before generation; scores remain blank until outputs are reviewed. */
export function freezeContentReviewRubric(plan) {
  validateContentComparisonPlan(plan);
  const repair = plan.version === "content-comparison-2";
  const rubric = {
    version: repair ? "content-pilot-review-rubric-2" : "content-pilot-review-rubric-1",
    packetGenerationVersion: repair ? "content-writing-packet-2" : "content-writing-packet-1",
    packetInstructionsSupplement: contentReflectionInstructions(plan),
    pairHash: plan.hash,
    caseSetId: plan.caseSetId,
    scope: "Four matched cases only; no whole-catalogue qualification or production-use claim.",
    scoreScale: {
      1: "Interchangeable, unsupported, contradictory, stiff, or dominated by stock phrasing.",
      2: "Between the existing protocol's 1 and 3 anchors.",
      3: "Recognizable but needs editing, support review, or less repetition.",
      4: "Useful supported distinction; clear progression; natural voice and little unsupported reuse.",
      5: "Concrete and traceable throughout; each paragraph advances a distinct useful thought.",
    },
    bodyProtocolVersion: "daily-writing-ai-review-1",
    bodyProtocol: "docs/reviews/daily-reading-writing/review-protocol.md",
    minimumScore: 4,
    additionalCandidateGates: ["voice", "repetition"],
    dimensions: {
      specificity: "Names a distinct ordinary situation or practical contrast.",
      voice: "Uses familiar, concrete language with conditional framing.",
      repetition: "Gives each sentence a purpose and avoids repeated openings across cases.",
      grounding: "Preserves supplied meanings, uncertainty, conditions and cycle roles.",
      coherence: "Maintains a clear supported progression, with only minor editing needed.",
      synthesisCoherence:
        "When S1 is supplied, develops the relationship supported by both parents.",
      lensIntegration: "When N1 is supplied, applies its distinction within the primary meaning.",
    },
    reflectionProtocolVersion: repair
      ? "content-reflection-review-2"
      : "content-reflection-review-1",
    reflectionChecks: {
      source: ["singleQuestion", "answerableWithoutPremise", "consistentWithSources"],
      final: [
        ...(repair ? ["singleQuestion"] : []),
        "answerableWithoutPremise",
        "consistentWithSources",
        "coherent",
      ],
      evidence:
        "Quote the reviewed question verbatim and explain the judgment; every check must pass.",
      finalQuestionCount: repair
        ? "Require exactly one final question, reviewed independently from the source question."
        : "Record separately; schema 4 may append a domain question. Do not assume a one-question final prompt.",
    },
    requiredChecks: [
      "No planetary causal assertion, prediction, directive, clinical claim or invented personal history.",
      "No loss or strengthening of any source qualification.",
      "The candidate's distinctive published meaning is substantively present; a citation alone is insufficient.",
      "Review the source question and assembled final question separately; inherited domain wording can introduce an assumption.",
      "A question may be answered with nothing relevant without implying a defect.",
    ],
    decisionRule: [
      "Use the existing substantive-claim and specificity/grounding/coherence gates at 4/5, including applicable synthesis and natal criteria.",
      "Both fresh blinded reviewers must score voice and repetition at least 4/5 for each affected candidate item; legacy item-verdict rules remain unchanged and this is an additional qualification gate.",
      "All source-question and final-prompt boolean checks must pass with quoted rationale. Keep inherited composition limitations explicit.",
      "No unresolved substantive finding or new preserved-entry failure is allowed. Record paired improvements and regressions rather than inferring quality from length or acceptance.",
      "Unavailable, uncertain or missing captures are unevaluable; never replace them silently.",
      "Even a passing pilot leaves the other 16 reachable additions unqualified by live comparison and both globals isolated-only.",
    ],
    cases: plan.caseManifest.cases.map((fixed, index) => ({
      id: fixed.id,
      baseline: reviewSlot(plan, "baseline", index),
      candidate: reviewSlot(plan, "candidate", index),
      pairedDecision: "unreviewed",
      notes: null,
    })),
    qualified: false,
  };
  return { ...rubric, hash: hash(rubric) };
}

function reviewSlot(plan, arm, index) {
  const dry = plan.arms[arm].cases[index];
  const key = dry.interpretationPlan.interpretations.find(
    (entry) => entry.index === 1,
  )?.interpretationKey;
  return {
    sourceKey: key,
    sourceQuestion: plan.bundles[arm].cycles.find((entry) => entry.key === key)?.question ?? null,
    finalQuestion: dry.template.prompt,
    sourceQuestionReview: "unreviewed",
    finalQuestionReview: "unreviewed",
    finalQuestionCount: (dry.template.prompt.match(/\?/g) ?? []).length,
    semanticIncorporation: "unreviewed",
    scores: {
      specificity: null,
      voice: null,
      repetition: null,
      grounding: null,
      coherence: null,
      synthesisCoherence: null,
      lensIntegration: null,
    },
    evidence: null,
  };
}
