/**
 * Local bookkeeping only: no model/network calls and no new editorial scores.
 * node summarize-round.mjs --assignment FILE --review-a FILE --review-b FILE
 *   --prompt-a FILE --prompt-b FILE --receipt-a FILE --receipt-b FILE --output NEW_FILE
 * Prompt files contain the exact archived text BEFORE the hash-binding trailer.
 * Each frozen receipt supplies contextId, reviewSha256, promptSha256, packetSha256,
 * itemSetHash, dispatchAtUTC, frozenAtUTC. All references are explicitly supplied.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { qualifyReviews } from "../../../../scripts/reading-writing-review.mjs";
import { READING_EVAL_CASES } from "../../../../src/lib/ai/reading-evaluation.fixtures.mjs";

const POSITIVES = [
  "natal-duty-reflex",
  "natal-freedom-reflex",
  "natal-service-aspect",
  "natal-exact-house",
  "natal-own-target",
  "natal-moon-fallback",
  "natal-mixed-source",
  "natal-synthesis-integration",
  "arc-synthesis-natal-integration",
];
const NEGATIVES = [
  "natal-sign-boundary",
  "natal-unknown-time",
  "natal-degraded-positions",
  "natal-legacy-snapshot",
];
const DIMENSIONS = [
  "specificity",
  "grounding",
  "coherence",
  "voice",
  "repetition",
  "lensIntegration",
  "synthesisCoherence",
];
const LANES = ["candidate", "template"];
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const requireCheck = (condition, message) => {
  if (!condition) throw new Error(message);
};

function validateFrozen(binding, assignment) {
  const { review, receipt, reviewSha256, promptSha256 } = binding;
  const id = review.reviewer?.contextId;
  requireCheck(receipt.contextId === id, "Frozen receipt context differs from its review");
  for (const field of ["reviewSha256", "promptSha256", "packetSha256", "itemSetHash"]) {
    requireCheck(SHA256.test(String(receipt[field])), `Frozen receipt lacks ${field}`);
  }
  requireCheck(
    receipt.reviewSha256 === reviewSha256,
    "Frozen receipt does not bind the exact review bytes",
  );
  requireCheck(
    receipt.promptSha256 === promptSha256 && review.reviewer.promptSha256 === promptSha256,
    "Archived prompt hash differs from review or frozen receipt",
  );
  requireCheck(
    receipt.packetSha256 === review.packetSha256 &&
      receipt.packetSha256 === assignment.packets[id]?.sha256,
    "Frozen receipt packet hash differs from assignment",
  );
  requireCheck(
    receipt.itemSetHash === review.itemSetHash && receipt.itemSetHash === assignment.itemSetHash,
    "Frozen receipt item set differs from assignment",
  );
  for (const field of ["dispatchAtUTC", "frozenAtUTC"]) {
    requireCheck(
      ISO_UTC.test(String(receipt[field])) && Number.isFinite(Date.parse(receipt[field])),
      `Frozen receipt lacks valid ${field}`,
    );
  }
  requireCheck(
    review.reviewedAt === receipt.dispatchAtUTC,
    "Review timestamp differs from its supplied dispatch timestamp",
  );
  requireCheck(
    Date.parse(receipt.frozenAtUTC) >= Date.parse(receipt.dispatchAtUTC),
    "Review frozen before dispatch",
  );
  requireCheck(
    review.reassessmentOf == null,
    "This round requires original fresh reviews, not reassessments",
  );
}

function validateSets(review, assignment) {
  const contextId = review.reviewer.contextId;
  const sets = assignment.setAssignments;
  requireCheck(
    sets && typeof sets === "object" && !Array.isArray(sets),
    "Assignment lacks contrast/repetition sets",
  );
  const validated = {};
  for (const [kind, field] of [
    ["contrast", "contrastChecks"],
    ["repetition", "repetitionChecks"],
  ]) {
    requireCheck(Array.isArray(review[field]), `${contextId} lacks ${field}`);
    const expected = new Set(Object.keys(sets).filter((id) => sets[id].kind === kind));
    const seen = new Set();
    for (const check of review[field]) {
      requireCheck(
        expected.has(check?.setId) && !seen.has(check.setId),
        `${contextId} has unknown or duplicate ${kind} set`,
      );
      seen.add(check.setId);
      const set = sets[check.setId];
      requireCheck(
        ["before", "after"].includes(set.run) && LANES.includes(set.lane),
        "Set assignment has an invalid run/lane",
      );
      requireCheck(
        Array.isArray(set.itemIds) && set.itemIds.length > 0,
        "Set assignment has no members",
      );
      const members = new Set(set.itemIds);
      for (const itemId of members) {
        const entry = assignment.items[itemId];
        requireCheck(
          entry && entry.mappings.some((m) => m.run === set.run && m.output === set.lane),
          "Set member does not belong to its assigned run/lane",
        );
      }
      requireCheck(nonEmpty(check.reason), `${contextId} ${kind} check needs a reason`);
      if (kind === "contrast")
        requireCheck(
          typeof check.distinctSupportedDifference === "boolean",
          `${contextId} contrast needs a boolean judgment`,
        );
      else
        requireCheck(
          Number.isInteger(check.score) && check.score >= 1 && check.score <= 5,
          `${contextId} repetition needs an integer score 1-5`,
        );
      requireCheck(Array.isArray(check.passages), `${contextId} ${kind} check lacks passages`);
      const quoted = new Set();
      for (const passage of check.passages) {
        requireCheck(
          members.has(passage?.itemId),
          `${contextId} ${kind} passage names an unsupplied member`,
        );
        const paragraph =
          assignment.items[passage.itemId].content.paragraphs[passage.paragraph - 1];
        requireCheck(
          Number.isInteger(passage.paragraph) &&
            paragraph &&
            nonEmpty(passage.quote) &&
            paragraph.text.includes(passage.quote),
          `${contextId} ${kind} quote is not exact in its paragraph`,
        );
        quoted.add(passage.itemId);
      }
      requireCheck(
        [...members].every((id) => quoted.has(id)),
        `${contextId} ${kind} check omits a distinct member's quotation`,
      );
      validated[check.setId] = check;
    }
    requireCheck(seen.size === expected.size, `${contextId} is missing ${kind} checks`);
  }
  requireCheck(
    Object.values(sets).every((set) => ["contrast", "repetition"].includes(set.kind)),
    "Assignment has an unknown set kind",
  );
  return validated;
}

/** Pair coverage is independent of semantic grades and automated acceptance. */
export function modelPairCoverage(assignment) {
  const pairs = READING_EVAL_CASES.filter((fixed) => fixed.id !== "quiet-threshold").map(
    ({ id: caseId }) => {
      const sides = ["before", "after"].map((run) => {
        const row = assignment.cases[run]?.[caseId];
        const uncovered = assignment.uncovered.filter(
          (item) => item.run === run && item.caseId === caseId,
        );
        const rawItemPresent = Boolean(row?.candidate && assignment.items[row.candidate]);
        const captureReviewable = ["lossless", "historical-accepted"].includes(row?.capture);
        const complete = rawItemPresent && captureReviewable && uncovered.length === 0;
        return {
          run,
          complete,
          rawItemPresent,
          capture: row?.capture ?? null,
          automatedOutcome: row?.outcome ?? null,
          automatedCode: row?.code ?? null,
          uncovered,
          gaps: [
            ...(!row ? ["case missing"] : []),
            ...(!rawItemPresent ? ["raw model item missing"] : []),
            ...(!captureReviewable ? ["raw capture is not lossless or historical-accepted"] : []),
            ...(uncovered.length ? ["raw capture has uncovered failures"] : []),
          ],
        };
      });
      return { caseId, complete: sides.every((side) => side.complete), sides };
    },
  );
  const countFor = (ids) =>
    pairs.filter((pair) => ids.includes(pair.caseId) && pair.complete).length;
  return {
    eligibleModelCases: pairs.length,
    quietCasesExcluded: ["quiet-threshold"],
    completeModelPairs: pairs.filter((pair) => pair.complete).length,
    positive: { expected: POSITIVES.length, completeModelPairs: countFor(POSITIVES) },
    negative: { expected: NEGATIVES.length, completeModelPairs: countFor(NEGATIVES) },
    complete: pairs.every((pair) => pair.complete),
    missingPairCases: pairs.filter((pair) => !pair.complete),
  };
}

/** Applies the existing item gate and the explicit natal contrast gate without averaging. */
export function summarizeRound({ assignment, bindings, references = {} }) {
  requireCheck(bindings.length === 2, "Exactly two frozen fresh reviewer bindings are required");
  for (const binding of bindings) validateFrozen(binding, assignment);
  const reviews = bindings.map((binding) => binding.review);
  const generic = qualifyReviews({ assignment, reviews });
  const expectedIds = READING_EVAL_CASES.map((row) => row.id).sort();
  requireCheck(expectedIds.length === 38, "Frozen fixture inventory must contain 38 cases");
  for (const run of ["before", "after"]) {
    requireCheck(
      JSON.stringify(Object.keys(assignment.cases[run]).sort()) === JSON.stringify(expectedIds),
      "This round requires exactly all 38 fixed cases on both sides",
    );
    for (const id of [...POSITIVES, ...NEGATIVES, "quiet-threshold"])
      requireCheck(assignment.cases[run][id], `Assignment lacks ${run} ${id}`);
  }
  const checkedSets = Object.fromEntries(
    reviews.map((review) => [review.reviewer.contextId, validateSets(review, assignment)]),
  );
  const assessments = Object.fromEntries(
    reviews.map((review) => [
      review.reviewer.contextId,
      new Map(review.items.map((item) => [item.itemId, item])),
    ]),
  );
  const caseLane = (run, caseId, lane) => {
    const row = assignment.cases[run][caseId];
    const itemId = row[lane];
    const entry = itemId ? assignment.items[itemId] : null;
    const judged = reviews.map((review) => ({
      contextId: review.reviewer.contextId,
      assessment: itemId ? assessments[review.reviewer.contextId].get(itemId) : null,
    }));
    const uncovered = assignment.uncovered.filter(
      (item) => item.run === run && item.caseId === caseId,
    );
    return {
      itemId,
      available: Boolean(itemId),
      passed:
        Boolean(itemId) &&
        judged.every((item) => item.assessment.verdict === "pass") &&
        (lane !== "candidate" || uncovered.length === 0),
      suppliesN1: Boolean(entry?.content.facts.some((fact) => fact.id === "N1")),
      suppliesS1: Boolean(entry?.content.facts.some((fact) => fact.id === "S1")),
      automatedOutcome: row.outcome,
      automatedCode: row.code,
      rawCapture: lane === "candidate" ? row.capture : null,
      uncovered: lane === "candidate" ? uncovered : [],
      assessments: judged,
    };
  };
  const afterCases = Object.entries(assignment.cases.after).map(([caseId, row]) => ({
    caseId,
    quiet: row.code === "no_cycle",
    model: caseLane("after", caseId, "candidate"),
    template: caseLane("after", caseId, "template"),
  }));
  const positiveCaseResults = POSITIVES.map((caseId) => {
    const result = afterCases.find((row) => row.caseId === caseId);
    return {
      ...result,
      passed:
        result.model.passed &&
        result.template.passed &&
        result.model.suppliesN1 &&
        result.template.suppliesN1,
    };
  });
  const negativeCaseResults = NEGATIVES.map((caseId) => {
    const result = afterCases.find((row) => row.caseId === caseId);
    return {
      ...result,
      passed:
        result.model.passed &&
        result.template.passed &&
        !result.model.suppliesN1 &&
        !result.template.suppliesN1,
    };
  });
  const allSets = Object.entries(assignment.setAssignments).map(([setId, set]) => ({
    setId,
    ...set,
    memberOccurrences: [...new Set(set.itemIds)].map((itemId) => ({
      itemId,
      count: set.itemIds.filter((id) => id === itemId).length,
    })),
    assessments: reviews.map((review) => ({
      contextId: review.reviewer.contextId,
      check: checkedSets[review.reviewer.contextId][setId],
    })),
  }));
  const afterContrasts = allSets.filter((set) => set.kind === "contrast" && set.run === "after");
  for (const lane of LANES) {
    const matching = afterContrasts.filter((set) => set.lane === lane);
    requireCheck(matching.length === 1, `Assignment needs one after ${lane} duty/freedom contrast`);
    const expected = ["natal-duty-reflex", "natal-freedom-reflex"].map(
      (id) => assignment.cases.after[id][lane],
    );
    requireCheck(
      JSON.stringify([...matching[0].itemIds].sort()) === JSON.stringify(expected.sort()),
      "Candidate contrast does not cover the duty/freedom pair",
    );
  }
  const natalContrastPassed = afterContrasts.every((set) =>
    set.assessments.every(({ check }) => check.distinctSupportedDifference),
  );
  const counts = (rows) => ({
    cases: rows.length,
    modelPassed: rows.filter((row) => row.model.passed).length,
    modelUnavailableOrUncovered: rows.filter(
      (row) => !row.quiet && (!row.model.available || row.model.uncovered.length),
    ).length,
    templatePassed: rows.filter((row) => row.template.passed).length,
    fullyPassing: rows.filter((row) => row.passed ?? (row.model.passed && row.template.passed))
      .length,
  });
  const disagreements = [];
  for (const itemId of Object.keys(assignment.items)) {
    const pair = reviews.map((review) => assessments[review.reviewer.contextId].get(itemId));
    const dimensions = DIMENSIONS.filter(
      (dimension) => pair[0].scores[dimension].score !== pair[1].scores[dimension].score,
    );
    const substantive = pair.map((item) =>
      item.findings.filter((finding) => finding.severity === "substantive"),
    );
    const signature = (findings) =>
      JSON.stringify(
        findings
          .map(({ category, paragraph, passage }) => ({ category, paragraph, passage }))
          .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      );
    if (
      dimensions.length ||
      pair[0].verdict !== pair[1].verdict ||
      signature(substantive[0]) !== signature(substantive[1])
    ) {
      disagreements.push({
        itemId,
        dimensions,
        verdicts: pair.map((item) => item.verdict),
        assessments: reviews.map((review, index) => ({
          contextId: review.reviewer.contextId,
          scores: pair[index].scores,
          findings: pair[index].findings,
        })),
      });
    }
  }
  const controlsPassed =
    positiveCaseResults.every((row) => row.passed) &&
    negativeCaseResults.every((row) => row.passed);
  const passed = generic.passed && natalContrastPassed && controlsPassed;
  const pairCoverage = modelPairCoverage(assignment);
  const automatedCases = afterCases
    .filter((row) => row.caseId !== "quiet-threshold")
    .map(({ caseId, model }) => ({
      caseId,
      outcome: model.automatedOutcome,
      code: model.automatedCode,
    }));
  const automatedCandidateModelOutcomes = {
    cases: automatedCases.length,
    counts: Object.fromEntries(
      ["accepted", "rejected", "unavailable", "skipped"].map((outcome) => [
        outcome,
        automatedCases.filter((row) => row.outcome === outcome).length,
      ]),
    ),
    allAccepted: automatedCases.every((row) => row.outcome === "accepted"),
    nonAcceptedCases: automatedCases.filter((row) => row.outcome !== "accepted"),
    quietSkip: {
      outcome: assignment.cases.after["quiet-threshold"].outcome,
      code: assignment.cases.after["quiet-threshold"].code,
    },
  };
  const pipelineGatePassed =
    passed && automatedCandidateModelOutcomes.allAccepted && pairCoverage.complete;
  return {
    protocolVersion: "natal-writing-round-summary-2",
    generatedAt: new Date().toISOString(),
    result: passed ? "AI natal writing-review passed" : "AI natal writing-review failed",
    passed,
    pipelineGatePassed,
    overallQualificationEligible: pipelineGatePassed,
    pairCoverage,
    automatedCandidateModelOutcomes,
    humanReviewCompleted: false,
    modelDiversity: "unknown",
    modelDiversityEstablished: false,
    genericQualification: generic,
    sourceComparisonCheckedByThisWrapper: false,
    references,
    frozenReviews: bindings.map(({ receipt }) => receipt),
    setIntegrity: {
      passed: true,
      reviewers: reviews.length,
      contrastSets: allSets.filter((set) => set.kind === "contrast").length,
      repetitionSets: allSets.filter((set) => set.kind === "repetition").length,
      exactQuotesAndDistinctMemberCoverage: true,
      occurrenceMultiplicityRetained: true,
    },
    natalContrast: { passed: natalContrastPassed, candidateAndTemplate: afterContrasts },
    positiveCaseResults,
    negativeCaseResults,
    candidateCaseResults: afterCases,
    repetitionAssessments: allSets.filter((set) => set.kind === "repetition"),
    modelAndTemplatePassCounts: {
      allCandidateCases: counts(afterCases),
      nonQuietCandidateRun: counts(afterCases.filter((row) => !row.quiet)),
      positive: counts(positiveCaseResults),
      negative: counts(negativeCaseResults),
      quietSafetyChecks: afterCases
        .filter((row) => row.quiet)
        .map(({ caseId, template }) => ({ caseId, template })),
    },
    disagreements,
    adjudicationPerformed: false,
    scoresAveraged: false,
    unresolvedSubstantiveFindings: reviews.flatMap((review) =>
      review.items.flatMap((item) =>
        item.findings
          .filter((finding) => finding.severity === "substantive")
          .map((finding) => ({
            contextId: review.reviewer.contextId,
            itemId: item.itemId,
            mappings: assignment.items[item.itemId].mappings,
            finding,
          })),
      ),
    ),
    limitations: [
      ...generic.limitations,
      "Citation arrays were uniformly masked; structural citation outcomes are separate.",
      "Set checks preserve reviewers' judgments; this checker does not establish their truth.",
      "Source comparison, costs, hosted admin authentication, member-provider behavior, live Swiss/owner paths, chronological-week repetition and content activation are separate evidence.",
    ],
  };
}

async function main() {
  const keys = [
    "assignment",
    "review-a",
    "review-b",
    "prompt-a",
    "prompt-b",
    "receipt-a",
    "receipt-b",
    "output",
  ];
  const options = {};
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]?.replace(/^--/, "");
    requireCheck(
      keys.includes(key) && args[index + 1] && !args[index + 1].startsWith("--") && !options[key],
      "Invalid or duplicate CLI option",
    );
    options[key] = resolve(args[index + 1]);
  }
  requireCheck(
    keys.every((key) => options[key]),
    "Supply assignment, both reviews/prompts/receipts and a new output path",
  );
  const loaded = {};
  for (const key of keys.filter((key) => key !== "output")) {
    const bytes = await readFile(options[key]);
    loaded[key] = {
      bytes,
      sha256: hash(bytes),
      value: key.startsWith("prompt-") ? null : JSON.parse(bytes.toString("utf8")),
    };
  }
  const bindings = ["a", "b"].map((suffix) => ({
    review: loaded[`review-${suffix}`].value,
    receipt: loaded[`receipt-${suffix}`].value,
    reviewSha256: loaded[`review-${suffix}`].sha256,
    promptSha256: loaded[`prompt-${suffix}`].sha256,
  }));
  const references = Object.fromEntries(
    Object.entries(loaded).map(([key, value]) => [
      key,
      { path: options[key], sha256: value.sha256 },
    ]),
  );
  const summary = summarizeRound({ assignment: loaded.assignment.value, bindings, references });
  const bytes = `${JSON.stringify(summary, null, 2)}\n`;
  await writeFile(options.output, bytes, { flag: "wx" });
  console.log(
    JSON.stringify(
      {
        path: options.output,
        sha256: hash(bytes),
        result: summary.result,
        passed: summary.passed,
        pipelineGatePassed: summary.pipelineGatePassed,
        pairCoverage: summary.pairCoverage,
        setIntegrity: summary.setIntegrity,
        counts: summary.modelAndTemplatePassCounts,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Round summary refused: ${error.message}`);
    process.exitCode = 1;
  });
}
