/**
 * Blinded AI writing-review bookkeeping for daily-writing-ai-review-1.
 * Works only on local synthetic report and review JSON: no model, network or database calls.
 * See docs/reviews/daily-reading-writing/review-protocol.md.
 */
import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compareContentReports,
  freezeContentReviewRubric,
  contentReflectionInstructions,
} from "./reading-content-comparison.mjs";

export const PROTOCOL_VERSION = "daily-writing-ai-review-1";
const DEFAULT_CONTEXTS = ["reviewer-a", "reviewer-b"];
const DEFAULT_INSTRUCTIONS = fileURLToPath(
  new URL("../docs/reviews/daily-reading-writing/reviewer-instructions.md", import.meta.url),
);
const DIMENSIONS = [
  "specificity",
  "grounding",
  "coherence",
  "voice",
  "repetition",
  "synthesisCoherence",
  "lensIntegration",
];
const SUBSTANTIVE = new Set([
  "unsupported_personal_claim",
  "invented_joint_premise",
  "suppression_breach",
  "factual_mismatch",
  "strengthened_modality",
  "unsupported_frequency",
  "unsupported_necessity",
  "unsupported_exclusion",
  "prohibited_instruction",
  "behavioral_prediction",
  "clinical_claim",
  "unsupported_claim",
]);
const MINOR = new Set(["specificity", "coherence", "voice", "repetition", "style"]);
const BLIND_FLAGS = [
  "sawOriginLabels",
  "sawPriorVerdicts",
  "sawOtherReviews",
  "sawImplementationContext",
];
/** Capture states that leave a model draft unreviewable as a lossless raw response. */
const UNCOVERED = new Set(["unavailable", "malformed", "truncated", "sanitized", "unproven"]);
const CONTEXT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z$/;
const LIMITATIONS = [
  "AI writing-review is not human approval, empirical psychological validation or proof of real-reader quality.",
  "Fresh contexts using one model are separate assessments, not evidence of independent model families.",
  "The checker validates bookkeeping; it does not establish that any reviewer judgment is true.",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const cryptoRandom = () => randomInt(0, 2 ** 32) / 2 ** 32;

function shuffle(values, random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function checkReport(label, report) {
  if (report?.reportVersion !== 1 || !Array.isArray(report.cases))
    throw new Error(`The ${label} report is not a supported evaluation report`);
  if (report.partial !== false) throw new Error(`The ${label} report is partial`);
  const ids = report.cases.map((row) => row.id);
  if (new Set(ids).size !== ids.length) throw new Error(`The ${label} report repeats a case`);
}

/** Reviewer-visible facts: statements and their relationships, never origins or versions. */
const visibleFacts = (facts) =>
  facts.map((fact) => ({
    id: fact.id,
    ...(fact.kind ? { kind: fact.kind } : {}),
    statement: fact.statement,
    ...(fact.dependsOn?.length ? { dependsOn: [...fact.dependsOn] } : {}),
  }));

const bodyParagraphs = (body, citations) =>
  body.split("\n\n").map((text, index) => ({
    number: index + 1,
    text,
    facts: citations ? (citations.find((c) => c.paragraph === index + 1)?.facts ?? []) : null,
  }));

function captureStatus(row) {
  const candidate = row.candidate;
  if (!candidate) return "unavailable";
  const readable =
    Array.isArray(candidate.paragraphs) &&
    candidate.paragraphs.every(
      (p) =>
        p &&
        typeof p.text === "string" &&
        Array.isArray(p.facts) &&
        p.facts.every((fact) => typeof fact === "string"),
    );
  if (!readable) return "malformed";
  if (candidate.truncated !== false || candidate.paragraphCount !== candidate.paragraphs.length)
    return "truncated";
  if (Object.hasOwn(candidate, "captureLossless"))
    return candidate.captureLossless === true ? "lossless" : "sanitized";
  // Validation proves an accepted historical draft was fully shaped; nothing proves a rejected one.
  return row.diagnostics.outcome === "accepted" ? "historical-accepted" : "unproven";
}

function reportIdentity(report, digest) {
  const outcomes = { accepted: 0, rejected: 0, unavailable: 0, skipped: 0 };
  for (const row of report.cases) outcomes[row.diagnostics.outcome] += 1;
  return {
    sha256: digest,
    fixtureVersion: report.fixtureVersion ?? null,
    caseSetHash: report.caseSetHash ?? null,
    bundleVersion: report.bundleVersion ?? null,
    bundleHash: report.bundleHash ?? null,
    transitCopyHash: report.transitCopyHash ?? null,
    promptVersion: report.promptVersion ?? null,
    validatorVersion: report.validatorVersion ?? null,
    model: report.model ?? null,
    bundleSource: report.bundleSource ?? null,
    source: report.source ?? null,
    outcomes,
  };
}

/**
 * Builds neutral items for every captured candidate and each distinct displayed or template
 * body, one independently shuffled packet per reviewer context, and the private assignment.
 */
export function prepareReview({
  before,
  after,
  instructions,
  random = cryptoRandom,
  contexts = DEFAULT_CONTEXTS,
  contentPlan = undefined,
}) {
  checkReport("before", before?.report);
  checkReport("after", after?.report);
  for (const side of [before, after])
    if (!SHA256.test(String(side.sha256))) throw new Error("Each report needs its SHA-256");
  const beforeIds = before.report.cases.map((row) => row.id).sort();
  const afterIds = after.report.cases.map((row) => row.id).sort();
  if (JSON.stringify(beforeIds) !== JSON.stringify(afterIds))
    throw new Error("Both reports must contain the same cases");
  if (!nonEmpty(instructions)) throw new Error("Reviewer instructions are required");
  if (new Set(contexts).size !== contexts.length || !contexts.every((c) => CONTEXT_ID.test(c)))
    throw new Error("Reviewer contexts must be distinct lowercase identifiers");
  if (contexts.length < 2) throw new Error("At least two distinct reviewer contexts are required");
  // Only a distinct pair of matched hosted runs can show what the correction changed.
  if (before.sha256 === after.sha256)
    throw new Error("The baseline and corrected inputs are the same report");
  for (const [label, side] of [
    ["before", before],
    ["after", after],
  ])
    if (side.report.source !== "live-synthetic")
      throw new Error(
        `The ${label} report is not a hosted live-synthetic run; offline replays contain no model writing`,
      );
  const contentComparison = contentPlan
    ? compareContentReports(before.report, after.report, { plan: contentPlan })
    : null;
  if (contentComparison) instructions += `\n\n${contentReflectionInstructions(contentPlan)}`;
  for (const [field, label] of [
    ["fixtureVersion", "fixture version"],
    ["caseSetHash", "case set"],
    ["model", "model"],
    ...(!contentComparison ? [["transitCopyHash", "transit copy"]] : []),
  ])
    if (before.report[field] !== after.report[field])
      throw new Error(`Unmatched reports: the ${label} differs`);
  if (!contentComparison && (before.report.contentComparison || after.report.contentComparison))
    throw new Error("Content comparison review requires its explicit frozen content plan");
  const afterConfig = new Map(after.report.cases.map((row) => [row.id, row.configHash]));
  for (const row of before.report.cases)
    if (row.configHash !== afterConfig.get(row.id))
      throw new Error(`Unmatched reports: the input config for ${row.id} differs`);

  // Items deduplicate only when text and the full fact, tone, depth and quiet context match.
  const entries = new Map();
  const record = (run, row, output, paragraphs) => {
    const content = {
      tone: row.config.tone,
      depth: row.config.depth,
      quiet: row.diagnostics.code === "no_cycle",
      facts: visibleFacts(row.facts),
      paragraphs,
      ...(contentComparison
        ? {
            sourceQuestion:
              contentPlan.bundles[run === "before" ? "baseline" : "candidate"].cycles.find(
                (entry) =>
                  entry.key ===
                  row.interpretationPlan.interpretations.find((item) => item.index === 1)
                    ?.interpretationKey,
              )?.question ?? null,
            reflectionQuestion: row.output.prompt,
            questionReview: "unreviewed",
          }
        : {}),
    };
    const key = JSON.stringify(content);
    if (!entries.has(key)) entries.set(key, { content, mappings: [] });
    entries.get(key).mappings.push({ run, caseId: row.id, output });
    return key;
  };
  const caseKeys = { before: {}, after: {} };
  const uncovered = [];
  for (const [run, side] of [
    ["before", before],
    ["after", after],
  ])
    for (const row of side.report.cases) {
      const keys = {
        outcome: row.diagnostics.outcome,
        code: row.diagnostics.code,
        capture: null,
        candidate: null,
        template: record(run, row, "template", bodyParagraphs(row.template.body, null)),
        displayed: record(
          run,
          row,
          "displayed",
          bodyParagraphs(
            row.output.body,
            row.output.mode === "model" ? row.output.citations : null,
          ),
        ),
      };
      if (row.diagnostics.attempted) {
        keys.capture = captureStatus(row);
        if (UNCOVERED.has(keys.capture))
          uncovered.push({ run, caseId: row.id, reason: keys.capture });
        if (!["unavailable", "malformed"].includes(keys.capture))
          keys.candidate = record(
            run,
            row,
            "candidate",
            row.candidate.paragraphs.map((p, index) => ({
              number: index + 1,
              text: p.text,
              facts: [...p.facts],
            })),
          );
      }
      caseKeys[run][row.id] = keys;
    }

  // Neutral IDs follow a random order, so neither IDs nor canonical order reveal origin.
  const width = Math.max(2, String(entries.size).length);
  const ids = new Map();
  shuffle([...entries.keys()], random).forEach((key, index) =>
    ids.set(key, `item-${String(index + 1).padStart(width, "0")}`),
  );
  const items = {};
  for (const [key, entry] of entries) {
    const itemId = ids.get(key);
    const facts = entry.content.facts.map((fact) => fact.id);
    items[itemId] = {
      content: { itemId, ...entry.content },
      mappings: entry.mappings,
      applicable: {
        synthesisCoherence: !entry.content.quiet && facts.includes("S1"),
        lensIntegration: !entry.content.quiet && facts.includes("N1"),
      },
    };
  }
  const canonical = Object.keys(items)
    .sort()
    .map((itemId) => items[itemId].content);
  const itemSetHash = sha256(JSON.stringify(canonical));
  const instructionsSha256 = sha256(instructions);
  const packets = contexts.map((contextId) => {
    const packet = {
      protocolVersion: PROTOCOL_VERSION,
      kind: "packet",
      contextId,
      itemSetHash,
      instructionsSha256,
      instructions,
      items: shuffle(canonical, random),
    };
    const json = `${JSON.stringify(packet, null, 2)}\n`;
    return { contextId, packet, json, sha256: sha256(json) };
  });
  const cases = {};
  for (const run of ["before", "after"])
    cases[run] = Object.fromEntries(
      Object.entries(caseKeys[run]).map(([caseId, keys]) => [
        caseId,
        {
          outcome: keys.outcome,
          code: keys.code,
          capture: keys.capture,
          candidate: keys.candidate ? ids.get(keys.candidate) : null,
          displayed: ids.get(keys.displayed),
          template: ids.get(keys.template),
        },
      ]),
    );
  return {
    packets,
    assignment: {
      protocolVersion: PROTOCOL_VERSION,
      kind: "assignment",
      itemSetHash,
      instructionsSha256,
      reports: {
        before: reportIdentity(before.report, before.sha256),
        after: reportIdentity(after.report, after.sha256),
      },
      packets: Object.fromEntries(packets.map((p) => [p.contextId, { sha256: p.sha256 }])),
      items,
      cases,
      uncovered,
      ...(contentComparison
        ? { contentComparison, contentReviewRubric: freezeContentReviewRubric(contentPlan) }
        : {}),
    },
  };
}

export const REFLECTION_PROTOCOL_VERSION = "content-reflection-review-1";
const SOURCE_QUESTION_CHECKS = [
  "singleQuestion",
  "answerableWithoutPremise",
  "consistentWithSources",
];
const FINAL_QUESTION_CHECKS = ["answerableWithoutPremise", "consistentWithSources", "coherent"];

/** Blank companion; no checker guesses an editorial answer from punctuation or citations. */
export function prepareReflectionReview({ assignment, contextId }) {
  if (!assignment?.contentComparison || !assignment.packets?.[contextId])
    throw new Error("Reflection review needs a content-pair assignment and assigned context");
  const protocolVersion =
    assignment.contentReviewRubric?.reflectionProtocolVersion ?? REFLECTION_PROTOCOL_VERSION;
  if (![REFLECTION_PROTOCOL_VERSION, "content-reflection-review-2"].includes(protocolVersion))
    throw new Error("Unknown content reflection review version");
  const finalChecks =
    protocolVersion === "content-reflection-review-2"
      ? ["singleQuestion", ...FINAL_QUESTION_CHECKS]
      : FINAL_QUESTION_CHECKS;
  return {
    protocolVersion,
    kind: "reflection-review",
    pairHash: assignment.contentComparison.pairHash,
    itemSetHash: assignment.itemSetHash,
    packetSha256: assignment.packets[contextId].sha256,
    contextId,
    items: Object.values(assignment.items).map(({ content }) => ({
      itemId: content.itemId,
      sourceQuestion: {
        text: content.sourceQuestion,
        checks: Object.fromEntries(SOURCE_QUESTION_CHECKS.map((key) => [key, null])),
        rationale: { quote: null, explanation: null },
        verdict: "unreviewed",
      },
      finalPrompt: {
        text: content.reflectionQuestion,
        questionCount: (content.reflectionQuestion.match(/\?/g) ?? []).length,
        checks: Object.fromEntries(finalChecks.map((key) => [key, null])),
        rationale: { quote: null, explanation: null },
        verdict: "unreviewed",
      },
    })),
    verdict: "unreviewed",
  };
}

export function qualifyReflectionReviews({ assignment, reviews }) {
  if (!assignment?.contentComparison || !Array.isArray(reviews))
    throw new Error("Reflection qualification needs the content-pair assignment and reviews");
  const contexts = Object.keys(assignment.packets);
  if (
    contexts.length < 2 ||
    reviews.length !== contexts.length ||
    new Set(reviews.map((review) => review.contextId)).size !== contexts.length
  )
    throw new Error("Reflection qualification needs every assigned fresh reviewer exactly once");
  const failures = [];
  for (const review of reviews) {
    const blank = prepareReflectionReview({ assignment, contextId: review.contextId });
    for (const key of ["protocolVersion", "kind", "pairHash", "itemSetHash", "packetSha256"])
      if (review[key] !== blank[key]) throw new Error(`Reflection review ${key} binding differs`);
    if (
      !Array.isArray(review.items) ||
      review.items.length !== blank.items.length ||
      new Set(review.items.map((item) => item.itemId)).size !== blank.items.length
    )
      throw new Error("Reflection review must cover every neutral item exactly once");
    let anyFailure = false;
    for (const expected of blank.items) {
      const item = review.items.find((row) => row.itemId === expected.itemId);
      if (!item) throw new Error("Reflection review has a missing or foreign item");
      for (const [part, checks] of [
        ["sourceQuestion", SOURCE_QUESTION_CHECKS],
        ["finalPrompt", Object.keys(expected.finalPrompt.checks)],
      ]) {
        const result = item[part],
          source = expected[part];
        if (
          !result ||
          result.text !== source.text ||
          Object.keys(result.checks ?? {})
            .sort()
            .join() !== [...checks].sort().join() ||
          checks.some((key) => typeof result.checks[key] !== "boolean")
        )
          throw new Error(
            "Reflection review needs the exact question and completed boolean checks",
          );
        if (part === "finalPrompt" && result.questionCount !== source.questionCount)
          throw new Error("Final prompt question count differs from the recorded prompt");
        if (result.checks.singleQuestion && (source.text.match(/\?/g) ?? []).length !== 1)
          throw new Error("singleQuestion conflicts with the recorded question count");
        if (
          !nonEmpty(result.rationale?.quote) ||
          !source.text.includes(result.rationale.quote) ||
          !nonEmpty(result.rationale?.explanation)
        )
          throw new Error("Reflection review needs a verbatim quoted rationale and explanation");
        const passed = checks.every((key) => result.checks[key]);
        if (result.verdict !== (passed ? "pass" : "fail"))
          throw new Error("Reflection verdict disagrees with its checks");
        if (!passed) {
          anyFailure = true;
          failures.push({
            contextId: review.contextId,
            itemId: item.itemId,
            part,
            checks: checks.filter((key) => !result.checks[key]),
            rationale: result.rationale,
          });
        }
      }
    }
    if (review.verdict !== (anyFailure ? "fail" : "pass"))
      throw new Error("Reflection overall verdict disagrees with its checks");
  }
  const candidateFailures = failures.filter((failure) =>
    assignment.items[failure.itemId].mappings.some((mapping) => mapping.run === "after"),
  );
  return {
    protocolVersion:
      assignment.contentReviewRubric?.reflectionProtocolVersion ?? REFLECTION_PROTOCOL_VERSION,
    kind: "reflection-qualification",
    pairHash: assignment.contentComparison.pairHash,
    itemSetHash: assignment.itemSetHash,
    passed: candidateFailures.length === 0,
    candidateFailures,
    allFindings: failures,
    wholeDraftQualified: false,
    humanApproval: "deferred",
    limitation:
      "A reflection review covers this four-case pilot only; it does not close body, semantic-incorporation, other-source or human-approval gates.",
  };
}

const gateDimensions = (entry) => [
  "specificity",
  "grounding",
  "coherence",
  ...(entry.applicable.synthesisCoherence ? ["synthesisCoherence"] : []),
  ...(entry.applicable.lensIntegration ? ["lensIntegration"] : []),
];

function expectedVerdict(item, entry) {
  if (item.findings.some((finding) => finding.severity === "substantive")) return "fail";
  if (entry.content.quiet) return item.quietCheck.safe === true ? "pass" : "fail";
  return gateDimensions(entry).some((d) => item.scores[d].score < 4) ? "fail" : "pass";
}

function validateFinding(where, finding, entry, findingIds) {
  const id = finding?.findingId;
  if (!nonEmpty(id)) throw new Error(`${where} has a finding without an ID`);
  if (findingIds.has(id)) throw new Error(`${where} repeats finding ID ${id}`);
  findingIds.add(id);
  const paragraph = entry.content.paragraphs[finding.paragraph - 1];
  if (!Number.isInteger(finding.paragraph) || !paragraph)
    throw new Error(`${where} finding ${id} names a paragraph the item does not have`);
  if (!nonEmpty(finding.passage) || !paragraph.text.includes(finding.passage))
    throw new Error(
      `${where} finding ${id} passage is not verbatim in paragraph ${finding.paragraph}`,
    );
  const supplied = new Set(entry.content.facts.map((fact) => fact.id));
  for (const field of ["supportingFactIds", "missingFactIds"]) {
    if (!Array.isArray(finding[field])) throw new Error(`${where} finding ${id} lacks ${field}`);
    for (const factId of finding[field])
      if (!supplied.has(factId))
        throw new Error(
          `${where} finding ${id} names fact ${factId}, which the item does not supply`,
        );
  }
  if (!finding.supportingFactIds.length && !finding.missingFactIds.length)
    throw new Error(`${where} finding ${id} needs a supporting or missing fact ID`);
  if (!SUBSTANTIVE.has(finding.category) && !MINOR.has(finding.category))
    throw new Error(`${where} finding ${id} has an unknown category`);
  const severity = SUBSTANTIVE.has(finding.category) ? "substantive" : "minor";
  if (finding.severity !== severity)
    throw new Error(`${where} finding ${id} severity must be ${severity} for ${finding.category}`);
  if (!nonEmpty(finding.explanation) || !nonEmpty(finding.proposedCorrection))
    throw new Error(`${where} finding ${id} needs an explanation and a proposed correction`);
}

function validateItemReview(where, item, entry, findingIds) {
  const quiet = entry.content.quiet;
  for (const dimension of DIMENSIONS) {
    const score = item.scores?.[dimension];
    if (!score || typeof score !== "object") throw new Error(`${where} lacks ${dimension}`);
    if (!nonEmpty(score.reason)) throw new Error(`${where} ${dimension} needs a reason`);
    if (
      score.score !== null &&
      !(Number.isInteger(score.score) && score.score >= 1 && score.score <= 5)
    )
      throw new Error(`${where} ${dimension} score must be an integer from 1 to 5, or null`);
    const applicable =
      !quiet &&
      (dimension === "synthesisCoherence"
        ? entry.applicable.synthesisCoherence
        : dimension === "lensIntegration"
          ? entry.applicable.lensIntegration
          : true);
    if (applicable && score.score === null)
      throw new Error(`${where} ${dimension} is applicable and needs a score`);
    if (!applicable && score.score !== null)
      throw new Error(`${where} ${dimension} is not applicable; record null with the reason`);
  }
  if (quiet) {
    // Like a score, the check gives its `reason`; `explanation` is the earlier field name.
    const why = item.quietCheck?.reason ?? item.quietCheck?.explanation;
    if (typeof item.quietCheck?.safe !== "boolean" || !nonEmpty(why))
      throw new Error(`${where} is a quiet item and needs a quiet check`);
  } else if (item.quietCheck !== null)
    throw new Error(`${where} is not quiet; quietCheck must be null`);
  if (!Array.isArray(item.findings)) throw new Error(`${where} needs a findings array`);
  for (const finding of item.findings) validateFinding(where, finding, entry, findingIds);
  if (item.verdict !== expectedVerdict(item, entry))
    throw new Error(`${where} verdict ${item.verdict} disagrees with its own scores and findings`);
}

function validateReview(review, assignment) {
  if (review?.protocolVersion !== PROTOCOL_VERSION || review.kind !== "review")
    throw new Error(`A review is not a ${PROTOCOL_VERSION} review`);
  const reviewer = review.reviewer ?? {};
  const id = reviewer.contextId;
  if (!CONTEXT_ID.test(String(id))) throw new Error("A review has an invalid context ID");
  for (const field of ["model", "configuration"])
    if (!nonEmpty(reviewer[field]))
      throw new Error(`Review ${id} must record its observed ${field}, or "unknown"`);
  if (!SHA256.test(String(reviewer.promptSha256)))
    throw new Error(`Review ${id} needs the SHA-256 of its prompt`);
  if (!ISO_UTC.test(String(review.reviewedAt)))
    throw new Error(`Review ${id} needs a UTC timestamp`);
  const blindness = review.blindness ?? {};
  if (!nonEmpty(blindness.declaration))
    throw new Error(`Review ${id} needs a blindness declaration`);
  if (
    !Array.isArray(blindness.inputs) ||
    blindness.inputs.length !== 1 ||
    blindness.inputs[0] !== "packet"
  )
    throw new Error(`Review ${id} is not blind: it declares inputs other than its packet`);
  for (const flag of BLIND_FLAGS)
    if (blindness[flag] !== false) throw new Error(`Review ${id} is not blind: ${flag}`);
  if (review.itemSetHash !== assignment.itemSetHash)
    throw new Error(`Review ${id} reviewed a different item set`);
  const reassessmentOf = review.reassessmentOf ?? null;
  if (reassessmentOf !== null) {
    if (Object.hasOwn(assignment.packets, id))
      throw new Error(`Reassessment context ${id} is not fresh`);
    if (!Object.hasOwn(assignment.packets, reassessmentOf))
      throw new Error(`Review ${id} reassesses an unassigned context`);
  } else if (!Object.hasOwn(assignment.packets, id))
    throw new Error(`Review ${id} has no assigned packet`);
  const bound = reassessmentOf ?? id;
  if (review.packetSha256 !== assignment.packets[bound].sha256)
    throw new Error(`Review ${id} is bound to a different packet than ${bound}'s assigned packet`);
  if (!Array.isArray(review.items)) throw new Error(`Review ${id} has no items`);
  const seen = new Set();
  for (const item of review.items) {
    if (!Object.hasOwn(assignment.items, item?.itemId))
      throw new Error(`Review ${id} has an unknown item ${item?.itemId}`);
    if (seen.has(item.itemId)) throw new Error(`Review ${id} has a duplicate item ${item.itemId}`);
    seen.add(item.itemId);
  }
  for (const itemId of Object.keys(assignment.items))
    if (!seen.has(itemId)) throw new Error(`Review ${id} is missing ${itemId}`);
  const findingIds = new Set();
  for (const item of review.items)
    validateItemReview(
      `Review ${id} ${item.itemId}`,
      item,
      assignment.items[item.itemId],
      findingIds,
    );
  const verdict = review.items.some((item) => item.verdict === "fail") ? "fail" : "pass";
  if (review.verdict !== verdict)
    throw new Error(`Review ${id} overall verdict disagrees with its item verdicts`);
}

/** True when the quote is the whole statement or runs from a sentence start to a sentence end. */
function quotesWholeSentences(statement, quote) {
  if (quote === statement) return true;
  for (let at = statement.indexOf(quote); at >= 0; at = statement.indexOf(quote, at + 1)) {
    const startsSentence = at === 0 || /[.!?:]["')\]]*\s+$/.test(statement.slice(0, at));
    const after = statement.slice(at + quote.length);
    if (startsSentence && /[.!?]["')\]]*$/.test(quote) && (after === "" || /^\s/.test(after)))
      return true;
  }
  return false;
}

function passageRange(assignment, itemId, finding) {
  const text = assignment.items[itemId].content.paragraphs[finding.paragraph - 1].text;
  const start = text.indexOf(finding.passage);
  return { paragraph: finding.paragraph, start, end: start + finding.passage.length };
}
const overlapping = (a, b) => a.paragraph === b.paragraph && a.start < b.end && b.start < a.end;

function validateAdjudication(adjudication, assignment, reviews) {
  if (adjudication?.protocolVersion !== PROTOCOL_VERSION || adjudication.kind !== "adjudication")
    throw new Error(`The adjudication is not a ${PROTOCOL_VERSION} adjudication`);
  if (adjudication.itemSetHash !== assignment.itemSetHash)
    throw new Error("The adjudication covers a different item set");
  const adjudicator = adjudication.adjudicator ?? {};
  if (!CONTEXT_ID.test(String(adjudicator.contextId)))
    throw new Error("The adjudicator needs a context ID");
  if (
    reviews.some((r) => r.reviewer.contextId === adjudicator.contextId) ||
    Object.hasOwn(assignment.packets, adjudicator.contextId)
  )
    throw new Error(`Adjudicator context ${adjudicator.contextId} is not fresh`);
  for (const field of ["model", "configuration"])
    if (!nonEmpty(adjudicator[field]))
      throw new Error(`The adjudicator must record its observed ${field}, or "unknown"`);
  if (!SHA256.test(String(adjudicator.promptSha256)))
    throw new Error("The adjudicator needs the SHA-256 of its prompt");
  if (!ISO_UTC.test(String(adjudication.adjudicatedAt)))
    throw new Error("The adjudication needs a UTC timestamp");
  const blindness = adjudication.blindness ?? {};
  if (
    !nonEmpty(blindness.declaration) ||
    blindness.sawOriginLabels !== false ||
    blindness.sawImplementationContext !== false
  )
    throw new Error("The adjudication is not blind to origin and implementation context");
  if (
    !Array.isArray(blindness.inputs) ||
    !blindness.inputs.length ||
    blindness.inputs.some((input) => !["findings", "items"].includes(input))
  )
    throw new Error(
      "The adjudication is not blind: it may declare only the disputed findings and their items",
    );
  if (!Array.isArray(adjudication.resolutions))
    throw new Error("The adjudication needs resolutions");
  const resolved = new Set();
  for (const resolution of adjudication.resolutions) {
    const key = `${resolution?.reviewerContextId}\u0000${resolution?.findingId}`;
    if (resolved.has(key))
      throw new Error(`Duplicate resolution for finding ${resolution.findingId}`);
    resolved.add(key);
    const review = reviews.find((r) => r.reviewer.contextId === resolution.reviewerContextId);
    const item = review?.items.find((i) =>
      i.findings.some((f) => f.findingId === resolution.findingId),
    );
    const finding = item?.findings.find((f) => f.findingId === resolution.findingId);
    if (!finding)
      throw new Error(
        `The adjudication names unknown finding ${resolution.findingId} from ${resolution.reviewerContextId}`,
      );
    if (resolution.itemId !== item.itemId)
      throw new Error(`Resolution for ${resolution.findingId} names the wrong item`);
    if (resolution.passage !== finding.passage)
      throw new Error(`Resolution passage differs from finding ${resolution.findingId}`);
    if (!["supported", "unsupported"].includes(resolution.resolution))
      throw new Error(`Resolution for ${resolution.findingId} must be supported or unsupported`);
    if (!Array.isArray(resolution.factEvidence))
      throw new Error(`Resolution for ${resolution.findingId} needs fact evidence`);
    if (resolution.resolution === "supported" && !resolution.factEvidence.length)
      throw new Error(`A supported resolution needs fact evidence for ${resolution.findingId}`);
    const facts = assignment.items[item.itemId].content.facts;
    for (const evidence of resolution.factEvidence) {
      const fact = facts.find((f) => f.id === evidence?.factId);
      if (!fact || !nonEmpty(evidence.statement) || !fact.statement.includes(evidence.statement))
        throw new Error(
          `Fact evidence for ${resolution.findingId} is not verbatim from supplied fact ${evidence?.factId}`,
        );
      if (!quotesWholeSentences(fact.statement, evidence.statement))
        throw new Error(
          `Fact evidence for ${resolution.findingId} must quote whole sentences of fact ${fact.id}`,
        );
    }
    if (!nonEmpty(resolution.explanation))
      throw new Error(`Resolution for ${resolution.findingId} needs an explanation`);
    // Only a disagreement can be adjudicated: a finding another assessment shares stands.
    if (resolution.resolution === "supported") {
      const range = passageRange(assignment, item.itemId, finding);
      for (const other of reviews) {
        if (other.reviewer.contextId === resolution.reviewerContextId) continue;
        const shared = other.items
          .find((i) => i.itemId === item.itemId)
          ?.findings.find(
            (f) =>
              f.severity === "substantive" &&
              overlapping(range, passageRange(assignment, item.itemId, f)),
          );
        if (shared)
          throw new Error(
            `Finding ${resolution.findingId} is shared with ${other.reviewer.contextId}'s finding ${shared.findingId}; one adjudicator cannot overturn a finding both assessments raised`,
          );
      }
    }
  }
}

/**
 * Validates both reviews (and any adjudication or reassessment) against the private assignment,
 * then applies the protocol gate to the corrected run. Invalid artifacts throw; a valid record
 * either passes or fails. Human review is never claimed.
 */
export function qualifyReviews({ assignment, reviews, adjudication = null }) {
  if (assignment?.protocolVersion !== PROTOCOL_VERSION || assignment.kind !== "assignment")
    throw new Error(`The assignment is not a ${PROTOCOL_VERSION} assignment`);
  if (!Array.isArray(reviews)) throw new Error("Reviews are required");
  const assigned = Object.keys(assignment.packets ?? {});
  if (assigned.length < 2)
    throw new Error(
      "The assignment needs at least two reviewer contexts; one review never qualifies",
    );
  const byContext = new Map();
  for (const review of reviews) {
    const id = review?.reviewer?.contextId;
    if (byContext.has(id)) throw new Error(`Duplicate reviewer context ${id}`);
    byContext.set(id, review);
  }
  for (const review of reviews) validateReview(review, assignment);
  for (const contextId of assigned)
    if (!byContext.has(contextId)) throw new Error(`Missing review from ${contextId}`);
  const reassessments = reviews.filter((r) => r.reassessmentOf);
  if (reassessments.length && !adjudication)
    throw new Error("A reassessment is accepted only together with an adjudication record");
  if (adjudication) validateAdjudication(adjudication, assignment, reviews);
  // A fresh reassessment may replace a reviewer's scores only on items where the
  // adjudication found one of that reviewer's disputed passages supported.
  const replaced = new Map();
  for (const review of reassessments) {
    if (replaced.has(review.reassessmentOf))
      throw new Error(`More than one reassessment of ${review.reassessmentOf}`);
    const items = new Set(
      adjudication.resolutions
        .filter(
          (r) => r.reviewerContextId === review.reassessmentOf && r.resolution === "supported",
        )
        .map((r) => r.itemId),
    );
    if (!items.size)
      throw new Error(
        `A reassessment of ${review.reassessmentOf} needs an adjudication that resolves one of its findings as supported`,
      );
    replaced.set(review.reassessmentOf, { by: review, items });
  }
  const assessmentFor = (contextId, itemId) => {
    const swap = replaced.get(contextId);
    return swap?.items.has(itemId) ? swap.by : byContext.get(contextId);
  };
  const resolutions = new Map(
    (adjudication?.resolutions ?? []).map((r) => [`${r.reviewerContextId}\u0000${r.findingId}`, r]),
  );
  // Every substantive finding stays in force, including a superseded reviewer's, until an
  // adjudication finds the passage supported. Scores are never averaged.
  const unresolved = reviews.flatMap((review) =>
    review.items.flatMap((item) =>
      item.findings
        .filter((finding) => finding.severity === "substantive")
        .filter(
          (finding) =>
            resolutions.get(`${review.reviewer.contextId}\u0000${finding.findingId}`)
              ?.resolution !== "supported",
        )
        .map((finding) => ({ reviewer: review.reviewer.contextId, itemId: item.itemId, finding })),
    ),
  );
  const itemIds = Object.keys(assignment.items).sort();
  const reviewOf = (review, itemId) => review.items.find((item) => item.itemId === itemId);
  const gateReasons = (review, itemId) => {
    const entry = assignment.items[itemId];
    const item = reviewOf(review, itemId);
    if (entry.content.quiet)
      return item.quietCheck.safe === true
        ? []
        : [`${review.reviewer.contextId}: quiet message judged unsafe`];
    return [
      ...gateDimensions(entry),
      ...(assignment.contentComparison && entry.mappings.some((mapping) => mapping.run === "after")
        ? ["voice", "repetition"]
        : []),
    ]
      .filter((dimension) => item.scores[dimension].score < 4)
      .map(
        (dimension) =>
          `${review.reviewer.contextId}: ${dimension} ${item.scores[dimension].score} is below 4`,
      );
  };
  const failures = (run) =>
    itemIds
      .filter((itemId) => assignment.items[itemId].mappings.some((m) => m.run === run))
      .map((itemId) => {
        const entry = assignment.items[itemId];
        const reasons = assigned.flatMap((contextId) =>
          gateReasons(assessmentFor(contextId, itemId), itemId),
        );
        for (const open of unresolved.filter((u) => u.itemId === itemId))
          reasons.push(
            `unresolved substantive finding ${open.finding.findingId} (${open.finding.category}) from ${open.reviewer}`,
          );
        return {
          itemId,
          mappings: entry.mappings.filter((m) => m.run === run),
          reasons,
        };
      })
      .filter((failure) => failure.reasons.length);
  const corrected = failures("after");
  const uncoveredAfter = assignment.uncovered.filter((u) => u.run === "after");
  const passed = corrected.length === 0 && uncoveredAfter.length === 0;
  const scoreDeltas = [];
  for (const [caseId, after] of Object.entries(assignment.cases.after)) {
    const before = assignment.cases.before[caseId];
    if (!before?.candidate || !after.candidate) continue;
    for (const contextId of assigned)
      for (const dimension of DIMENSIONS) {
        const was = reviewOf(assessmentFor(contextId, before.candidate), before.candidate).scores[
          dimension
        ].score;
        const now = reviewOf(assessmentFor(contextId, after.candidate), after.candidate).scores[
          dimension
        ].score;
        if (was === null && now === null) continue;
        scoreDeltas.push({
          caseId,
          reviewer: contextId,
          dimension,
          before: was,
          after: now,
          delta: was !== null && now !== null ? now - was : null,
        });
      }
  }
  const quietItems = itemIds.filter((id) => assignment.items[id].content.quiet).length;
  return {
    protocolVersion: PROTOCOL_VERSION,
    kind: "qualification",
    humanReviewCompleted: false,
    result:
      assignment.contentComparison && passed
        ? "Body writing-review passed; content comparison remains unqualified"
        : passed
          ? "AI writing-review passed"
          : "AI writing-review failed",
    passed: assignment.contentComparison ? false : passed,
    ...(assignment.contentComparison
      ? {
          bodyReviewPassed: passed,
          contentComparison: {
            pairHash: assignment.contentComparison.pairHash,
            qualified: false,
            semanticIncorporation: "unreviewed",
            reflectionQuestionQuality: "unreviewed",
            limitation:
              "The body-review protocol does not score source incorporation or reflection questions, and a four-case pilot cannot qualify all changed sources.",
          },
        }
      : {}),
    itemSetHash: assignment.itemSetHash,
    automated: assignment.reports,
    reviewerCount: assigned.length,
    reviewers: reviews.map((review) => ({
      contextId: review.reviewer.contextId,
      model: review.reviewer.model,
      configuration: review.reviewer.configuration,
      promptSha256: review.reviewer.promptSha256,
      packetSha256: review.packetSha256,
      reviewedAt: review.reviewedAt,
      reassessmentOf: review.reassessmentOf ?? null,
      superseded: replaced.has(review.reviewer.contextId),
    })),
    // Original judgments stay visible wherever a reassessment replaced them.
    supersededAssessments: [...replaced].map(([contextId, swap]) => ({
      contextId,
      reassessedBy: swap.by.reviewer.contextId,
      items: [...swap.items].sort().map((itemId) => ({
        itemId,
        reasons: gateReasons(byContext.get(contextId), itemId),
      })),
    })),
    adjudication: adjudication && {
      contextId: adjudication.adjudicator.contextId,
      model: adjudication.adjudicator.model,
      configuration: adjudication.adjudicator.configuration,
      promptSha256: adjudication.adjudicator.promptSha256,
      adjudicatedAt: adjudication.adjudicatedAt,
      resolutions: adjudication.resolutions.length,
    },
    coverage: {
      items: itemIds.length,
      correctedItems: itemIds.filter((id) =>
        assignment.items[id].mappings.some((m) => m.run === "after"),
      ).length,
      quietItems,
      scoredItems: itemIds.length - quietItems,
      uncovered: assignment.uncovered,
    },
    corrected: { failures: corrected },
    baseline: { failures: failures("before") },
    scoreDeltas,
    resolvedDisputes: (adjudication?.resolutions ?? []).map((resolution) => ({
      reviewerContextId: resolution.reviewerContextId,
      findingId: resolution.findingId,
      itemId: resolution.itemId,
      resolution: resolution.resolution,
      factEvidence: resolution.factEvidence,
      explanation: resolution.explanation,
      original: reviewOf(
        byContext.get(resolution.reviewerContextId),
        resolution.itemId,
      ).findings.find((finding) => finding.findingId === resolution.findingId),
    })),
    limitations: LIMITATIONS,
  };
}

// ---------------------------------------------------------------------------
// Natal lens catalogue review: every frozen entry, two fresh contexts, no model calls.
// ---------------------------------------------------------------------------

const DEFAULT_CATALOGUE_INSTRUCTIONS = fileURLToPath(
  new URL("../docs/reviews/daily-natal-lens/catalogue-reviewer-instructions.md", import.meta.url),
);
/** Each check and the substantive finding category that must explain a `false` answer. */
const CATALOGUE_CHECKS = {
  conditionalFraming: "unconditional_claim",
  ordinaryScene: "missing_scene",
  practicalDistinction: "missing_distinction",
  roleAndAnchors: "role_mismatch",
  compoundEligibility: "compound_ineligible",
  noBiography: "biography",
  noClinicalExplanation: "clinical_claim",
  noBehavioralPrediction: "behavioral_prediction",
  noStereotypeCertainty: "stereotype_certainty",
  noDirectives: "directive",
  noRawOrigin: "raw_origin",
};
const CATALOGUE_SUBSTANTIVE = new Set(Object.values(CATALOGUE_CHECKS));
const CATALOGUE_BLIND_FLAGS = ["sawPriorVerdicts", "sawOtherReviews", "sawImplementationContext"];

function frozenCatalogue({ bundle, expectedSha256 = null }) {
  if (!Array.isArray(bundle?.natalLenses) || !bundle.natalLenses.length)
    throw new Error("The frozen bundle has no natal lens catalogue");
  const catalogueSha256 = sha256(JSON.stringify(bundle));
  if (expectedSha256 !== null && expectedSha256 !== catalogueSha256)
    throw new Error("The frozen bundle does not match its recorded catalogue hash");
  const entries = new Map();
  for (const lens of bundle.natalLenses) {
    if (!nonEmpty(lens?.key) || entries.has(lens.key))
      throw new Error("The frozen catalogue has a missing or repeated key");
    entries.set(lens.key, {
      key: lens.key,
      role: lens.role,
      anchorNatalPoints: [...lens.anchorNatalPoints],
      selectors: structuredClone(lens.selectors),
      mechanism: lens.mechanism,
    });
  }
  return { catalogueSha256, bundleVersion: bundle.version, entries };
}

/**
 * One reviewer's catalogue packet. The order is reproducible from the catalogue hash and
 * context ID, so the checker can rebuild and bind every packet without a private key file.
 */
export function cataloguePacket({ bundle, expectedSha256 = null, instructions, contextId }) {
  if (!CONTEXT_ID.test(String(contextId))) throw new Error("A catalogue packet needs a context ID");
  if (!nonEmpty(instructions)) throw new Error("Catalogue reviewer instructions are required");
  const frozen = frozenCatalogue({ bundle, expectedSha256 });
  const order = (key) => sha256(`${frozen.catalogueSha256}:${contextId}:${key}`);
  const packet = {
    protocolVersion: PROTOCOL_VERSION,
    kind: "catalogue-packet",
    contextId,
    bundleVersion: frozen.bundleVersion,
    catalogueSha256: frozen.catalogueSha256,
    instructionsSha256: sha256(instructions),
    instructions,
    entries: [...frozen.entries.values()].sort((x, y) => order(x.key).localeCompare(order(y.key))),
  };
  const json = `${JSON.stringify(packet, null, 2)}\n`;
  return { packet, json, sha256: sha256(json) };
}

function validateProvenance(label, reviewer, timestamp) {
  if (!CONTEXT_ID.test(String(reviewer?.contextId)))
    throw new Error(`${label} has an invalid context ID`);
  for (const field of ["model", "configuration"])
    if (!nonEmpty(reviewer[field]))
      throw new Error(`${label} must record its observed ${field}, or "unknown"`);
  if (!SHA256.test(String(reviewer.promptSha256)))
    throw new Error(`${label} needs the SHA-256 of its prompt`);
  if (!ISO_UTC.test(String(timestamp))) throw new Error(`${label} needs a UTC timestamp`);
}

function validateCatalogueReview(review, frozen, packetFor) {
  if (review?.protocolVersion !== PROTOCOL_VERSION || review.kind !== "catalogue-review")
    throw new Error(`A catalogue review is not a ${PROTOCOL_VERSION} catalogue review`);
  const id = review.reviewer?.contextId;
  validateProvenance(`Catalogue review ${id}`, review.reviewer, review.reviewedAt);
  const blindness = review.blindness ?? {};
  if (!nonEmpty(blindness.declaration))
    throw new Error(`Catalogue review ${id} needs a blindness declaration`);
  if (!Array.isArray(blindness.inputs) || blindness.inputs.join() !== "packet")
    throw new Error(
      `Catalogue review ${id} is not blind: it declares inputs other than its packet`,
    );
  for (const flag of CATALOGUE_BLIND_FLAGS)
    if (blindness[flag] !== false) throw new Error(`Catalogue review ${id} is not blind: ${flag}`);
  if (review.catalogueSha256 !== frozen.catalogueSha256)
    throw new Error(`Catalogue review ${id} reviewed a different catalogue hash`);
  if (review.bundleVersion !== frozen.bundleVersion)
    throw new Error(`Catalogue review ${id} reviewed a different bundle version`);
  if (review.packetSha256 !== packetFor(id))
    throw new Error(`Catalogue review ${id} is bound to a different packet than its own`);
  if (!Array.isArray(review.entries)) throw new Error(`Catalogue review ${id} has no entries`);
  const seen = new Set();
  for (const entry of review.entries) {
    if (!frozen.entries.has(entry?.key))
      throw new Error(`Catalogue review ${id} has an unknown key ${entry?.key}`);
    if (seen.has(entry.key))
      throw new Error(`Catalogue review ${id} has a duplicate key ${entry.key}`);
    seen.add(entry.key);
  }
  for (const key of frozen.entries.keys())
    if (!seen.has(key)) throw new Error(`Catalogue review ${id} is missing ${key}`);
  const findingIds = new Set();
  for (const entry of review.entries) {
    const where = `Catalogue review ${id} ${entry.key}`;
    const lens = frozen.entries.get(entry.key);
    const compound = lens.selectors.length > 1;
    const checks = entry.checks ?? {};
    if (Object.keys(checks).sort().join() !== Object.keys(CATALOGUE_CHECKS).sort().join())
      throw new Error(`${where} must answer exactly the catalogue checks`);
    for (const check of Object.keys(CATALOGUE_CHECKS)) {
      if (check === "compoundEligibility") {
        if (compound && typeof checks[check] !== "boolean")
          throw new Error(`${where} is a compound entry; compoundEligibility needs true or false`);
        if (!compound && checks[check] !== null)
          throw new Error(`${where} has one selector; compoundEligibility must be null`);
      } else if (typeof checks[check] !== "boolean")
        throw new Error(`${where} ${check} needs true or false`);
    }
    if (!Array.isArray(entry.findings)) throw new Error(`${where} needs a findings array`);
    for (const finding of entry.findings) {
      const fid = finding?.findingId;
      if (!nonEmpty(fid) || findingIds.has(fid))
        throw new Error(`${where} has a missing or repeated finding ID`);
      findingIds.add(fid);
      if (!nonEmpty(finding.passage) || !lens.mechanism.includes(finding.passage))
        throw new Error(`${where} finding ${fid} passage is not verbatim in the mechanism`);
      if (!CATALOGUE_SUBSTANTIVE.has(finding.category) && finding.category !== "style")
        throw new Error(`${where} finding ${fid} has an unknown category`);
      const severity = finding.category === "style" ? "minor" : "substantive";
      if (finding.severity !== severity)
        throw new Error(
          `${where} finding ${fid} severity must be ${severity} for ${finding.category}`,
        );
      if (!nonEmpty(finding.explanation) || !nonEmpty(finding.proposedCorrection))
        throw new Error(`${where} finding ${fid} needs an explanation and a proposed correction`);
    }
    for (const [check, category] of Object.entries(CATALOGUE_CHECKS))
      if (checks[check] === false && !entry.findings.some((f) => f.category === category))
        throw new Error(`${where} answers ${check} false without a ${category} finding`);
    const fails =
      Object.values(checks).some((value) => value === false) ||
      entry.findings.some((f) => f.severity === "substantive");
    if (entry.verdict !== (fails ? "fail" : "pass"))
      throw new Error(
        `${where} verdict ${entry.verdict} disagrees with its own checks and findings`,
      );
  }
  const verdict = review.entries.some((entry) => entry.verdict === "fail") ? "fail" : "pass";
  if (review.verdict !== verdict)
    throw new Error(`Catalogue review ${id} overall verdict disagrees with its entry verdicts`);
}

function validateCatalogueAdjudication(adjudication, frozen, reviews) {
  if (
    adjudication?.protocolVersion !== PROTOCOL_VERSION ||
    adjudication.kind !== "catalogue-adjudication"
  )
    throw new Error(`The catalogue adjudication is not a ${PROTOCOL_VERSION} adjudication`);
  if (adjudication.catalogueSha256 !== frozen.catalogueSha256)
    throw new Error("The catalogue adjudication covers a different catalogue hash");
  const adjudicator = adjudication.adjudicator ?? {};
  validateProvenance("The catalogue adjudicator", adjudicator, adjudication.adjudicatedAt);
  if (reviews.some((r) => r.reviewer.contextId === adjudicator.contextId))
    throw new Error(`Adjudicator context ${adjudicator.contextId} is not fresh`);
  const blindness = adjudication.blindness ?? {};
  if (
    !nonEmpty(blindness.declaration) ||
    blindness.sawImplementationContext !== false ||
    !Array.isArray(blindness.inputs) ||
    !blindness.inputs.length ||
    blindness.inputs.some((input) => !["findings", "entries"].includes(input))
  )
    throw new Error(
      "The catalogue adjudication is not blind: it may declare only the disputed findings and entries",
    );
  if (!Array.isArray(adjudication.resolutions))
    throw new Error("The catalogue adjudication needs resolutions");
  const resolved = new Set();
  for (const resolution of adjudication.resolutions) {
    const key = `${resolution?.reviewerContextId}\u0000${resolution?.findingId}`;
    if (resolved.has(key))
      throw new Error(`Duplicate resolution for finding ${resolution.findingId}`);
    resolved.add(key);
    const review = reviews.find((r) => r.reviewer.contextId === resolution.reviewerContextId);
    const entry = review?.entries.find((e) =>
      e.findings.some((f) => f.findingId === resolution.findingId),
    );
    const finding = entry?.findings.find((f) => f.findingId === resolution.findingId);
    if (!finding)
      throw new Error(
        `The catalogue adjudication names unknown finding ${resolution.findingId} from ${resolution.reviewerContextId}`,
      );
    if (resolution.key !== entry.key)
      throw new Error(`Resolution for ${resolution.findingId} names the wrong entry`);
    if (resolution.passage !== finding.passage)
      throw new Error(`Resolution passage differs from finding ${resolution.findingId}`);
    if (!["acceptable", "defect"].includes(resolution.resolution))
      throw new Error(`Resolution for ${resolution.findingId} must be acceptable or defect`);
    if (!nonEmpty(resolution.explanation))
      throw new Error(`Resolution for ${resolution.findingId} needs an explanation`);
    if (resolution.resolution === "acceptable" && finding.severity === "substantive") {
      const mechanism = frozen.entries.get(entry.key).mechanism;
      const range = (passage) => {
        const start = mechanism.indexOf(passage);
        return [start, start + passage.length];
      };
      const [start, end] = range(finding.passage);
      for (const other of reviews) {
        if (other.reviewer.contextId === resolution.reviewerContextId) continue;
        const shared = other.entries
          .find((e) => e.key === entry.key)
          ?.findings.find((f) => {
            const [s, e] = range(f.passage);
            return f.severity === "substantive" && s < end && start < e;
          });
        if (shared)
          throw new Error(
            `Finding ${resolution.findingId} is shared with ${other.reviewer.contextId}'s finding ${shared.findingId}; one adjudicator cannot overturn a defect both reviewers raised`,
          );
      }
    }
  }
}

/**
 * Validates at least two catalogue reviews (and any adjudication) against the frozen bundle,
 * then approves only when no substantive finding stays unresolved. Human approval stays deferred.
 */
export function qualifyCatalogue({
  bundle,
  expectedSha256 = null,
  instructions,
  reviews,
  adjudication = null,
}) {
  const frozen = frozenCatalogue({ bundle, expectedSha256 });
  if (!Array.isArray(reviews)) throw new Error("Catalogue reviews are required");
  const contexts = new Set();
  for (const review of reviews) {
    const id = review?.reviewer?.contextId;
    if (contexts.has(id)) throw new Error(`Duplicate reviewer context ${id}`);
    contexts.add(id);
  }
  if (contexts.size < 2)
    throw new Error("A catalogue review needs at least two reviewer contexts; one never approves");
  const packetFor = (contextId) =>
    cataloguePacket({ bundle, expectedSha256, instructions, contextId }).sha256;
  for (const review of reviews) validateCatalogueReview(review, frozen, packetFor);
  if (adjudication) validateCatalogueAdjudication(adjudication, frozen, reviews);
  const acceptable = new Set(
    (adjudication?.resolutions ?? [])
      .filter((r) => r.resolution === "acceptable")
      .map((r) => `${r.reviewerContextId}\u0000${r.findingId}`),
  );
  const failures = [...frozen.entries.keys()]
    .sort()
    .map((key) => ({
      key,
      reasons: reviews.flatMap((review) =>
        review.entries
          .find((entry) => entry.key === key)
          .findings.filter(
            (f) =>
              f.severity === "substantive" &&
              !acceptable.has(`${review.reviewer.contextId}\u0000${f.findingId}`),
          )
          .map(
            (f) =>
              `unresolved ${f.category} finding ${f.findingId} from ${review.reviewer.contextId}`,
          ),
      ),
    }))
    .filter((failure) => failure.reasons.length);
  const passed = failures.length === 0;
  return {
    protocolVersion: PROTOCOL_VERSION,
    kind: "catalogue-qualification",
    humanReviewCompleted: false,
    humanApproval: "deferred",
    authorStructuralReview:
      "The catalogue author's agent editorial/structural review (docs/reviews/daily-natal-lens/catalogue-review.md) is separate evidence and is not counted here.",
    result: passed ? "AI catalogue review passed" : "AI catalogue review failed",
    passed,
    bundleVersion: frozen.bundleVersion,
    catalogueSha256: frozen.catalogueSha256,
    instructionsSha256: sha256(instructions),
    entries: frozen.entries.size,
    compoundEntries: [...frozen.entries.values()].filter((e) => e.selectors.length > 1).length,
    reviewerCount: contexts.size,
    reviewers: reviews.map((review) => ({
      contextId: review.reviewer.contextId,
      model: review.reviewer.model,
      configuration: review.reviewer.configuration,
      promptSha256: review.reviewer.promptSha256,
      packetSha256: review.packetSha256,
      reviewedAt: review.reviewedAt,
    })),
    adjudication: adjudication && {
      contextId: adjudication.adjudicator.contextId,
      model: adjudication.adjudicator.model,
      configuration: adjudication.adjudicator.configuration,
      promptSha256: adjudication.adjudicator.promptSha256,
      adjudicatedAt: adjudication.adjudicatedAt,
      resolutions: adjudication.resolutions.length,
    },
    failures,
    minorFindings: reviews.flatMap((review) =>
      review.entries.flatMap((entry) =>
        entry.findings
          .filter((f) => f.severity === "minor")
          .map((f) => ({ key: entry.key, reviewer: review.reviewer.contextId, finding: f })),
      ),
    ),
    resolvedDisputes: (adjudication?.resolutions ?? []).map((resolution) => ({
      ...resolution,
      original: reviews
        .find((r) => r.reviewer.contextId === resolution.reviewerContextId)
        .entries.find((e) => e.key === resolution.key)
        .findings.find((f) => f.findingId === resolution.findingId),
    })),
    limitations: [
      "AI catalogue approval is not human editorial approval, empirical temperament evidence or publication.",
      "Fresh contexts using one model are separate assessments, not evidence of independent model families.",
      "The checker validates bookkeeping; it does not establish that any reviewer judgment is true.",
    ],
  };
}

async function readJsonFile(path) {
  const bytes = await readFile(path);
  if (bytes.length > 8_000_000) throw new Error(`${path} is larger than 8 MB`);
  return { value: JSON.parse(bytes.toString("utf8")), sha256: sha256(bytes) };
}

function parseArgs(args, repeatable = []) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const [flag, value] = [args[i], args[i + 1]];
    if (!flag?.startsWith("--") || value === undefined || value.startsWith("--"))
      throw new Error(`Expected a value after ${flag}`);
    const key = flag.slice(2);
    if (repeatable.includes(key)) (options[key] ??= []).push(value);
    else if (key in options) throw new Error(`${flag} given twice`);
    else options[key] = value;
  }
  return options;
}

export async function main([command, ...args]) {
  if (command === "prepare") {
    const options = parseArgs(args);
    for (const key of ["before", "after", "output-dir"])
      if (!options[key]) throw new Error(`prepare needs --${key}`);
    const before = await readJsonFile(options.before);
    const after = await readJsonFile(options.after);
    const instructions = await readFile(options.instructions ?? DEFAULT_INSTRUCTIONS, "utf8");
    const prepared = prepareReview({
      before: { report: before.value, sha256: before.sha256 },
      after: { report: after.value, sha256: after.sha256 },
      instructions,
      contexts: options.contexts ? options.contexts.split(",") : DEFAULT_CONTEXTS,
      contentPlan: options["content-plan"]
        ? (await readJsonFile(options["content-plan"])).value
        : undefined,
    });
    // A new directory each time: an earlier round is never overwritten.
    await mkdir(options["output-dir"]);
    await mkdir(join(options["output-dir"], "packets"));
    for (const packet of prepared.packets)
      await writeFile(
        join(options["output-dir"], "packets", `packet-${packet.contextId}.json`),
        packet.json,
        {
          flag: "wx",
        },
      );
    await writeFile(
      join(options["output-dir"], "assignment.json"),
      `${JSON.stringify(prepared.assignment, null, 2)}\n`,
      { flag: "wx" },
    );
    if (prepared.assignment.contentComparison) {
      await mkdir(join(options["output-dir"], "reflections"));
      for (const packet of prepared.packets)
        await writeFile(
          join(options["output-dir"], "reflections", `reflection-${packet.contextId}.json`),
          `${JSON.stringify(prepareReflectionReview({ assignment: prepared.assignment, contextId: packet.contextId }), null, 2)}\n`,
          { flag: "wx" },
        );
    }
    process.stdout.write(
      `${JSON.stringify(
        {
          itemSetHash: prepared.assignment.itemSetHash,
          items: Object.keys(prepared.assignment.items).length,
          packets: Object.fromEntries(prepared.packets.map((p) => [p.contextId, p.sha256])),
          uncovered: prepared.assignment.uncovered,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }
  if (command === "qualify-reflections") {
    const options = parseArgs(args, ["review"]);
    for (const key of ["assignment", "output"])
      if (!options[key]) throw new Error(`qualify-reflections needs --${key}`);
    if (!options.review?.length) throw new Error("qualify-reflections needs --review files");
    const assignment = await readJsonFile(options.assignment);
    const reviews = await Promise.all(options.review.map(readJsonFile));
    const summary = qualifyReflectionReviews({
      assignment: assignment.value,
      reviews: reviews.map((review) => review.value),
    });
    summary.files = {
      assignmentSha256: assignment.sha256,
      reviewSha256: reviews.map((review) => review.sha256),
    };
    await writeFile(options.output, `${JSON.stringify(summary, null, 2)}\n`, { flag: "wx" });
    process.stdout.write(
      `Reflection pilot review ${summary.passed ? "passed" : "failed"}; whole-draft approval remains open.\n`,
    );
    return;
  }
  if (command === "qualify") {
    const options = parseArgs(args, ["review"]);
    for (const key of ["assignment", "output"])
      if (!options[key]) throw new Error(`qualify needs --${key}`);
    if (!options.review?.length) throw new Error("qualify needs --review files");
    const assignment = await readJsonFile(options.assignment);
    const reviews = await Promise.all(options.review.map(readJsonFile));
    const adjudication = options.adjudication ? await readJsonFile(options.adjudication) : null;
    const summary = qualifyReviews({
      assignment: assignment.value,
      reviews: reviews.map((r) => r.value),
      adjudication: adjudication?.value ?? null,
    });
    summary.files = {
      assignmentSha256: assignment.sha256,
      reviewSha256: reviews.map((r) => r.sha256),
      adjudicationSha256: adjudication?.sha256 ?? null,
    };
    await writeFile(options.output, `${JSON.stringify(summary, null, 2)}\n`, { flag: "wx" });
    process.stdout.write(`${summary.result}\n`);
    return;
  }
  if (command === "catalogue-packets" || command === "catalogue") {
    const options = parseArgs(args, ["review"]);
    if (!options.bundle) throw new Error(`${command} needs --bundle`);
    // A release manifest carries the frozen bundle and its recorded checksum.
    const source = (await readJsonFile(options.bundle)).value;
    const bundle = source.bundle ?? source;
    const expectedSha256 = source.bundle ? (source.checksum ?? null) : null;
    const instructions = await readFile(
      options.instructions ?? DEFAULT_CATALOGUE_INSTRUCTIONS,
      "utf8",
    );
    if (command === "catalogue-packets") {
      if (!options["output-dir"]) throw new Error("catalogue-packets needs --output-dir");
      const contexts = (options.contexts ?? "catalogue-a,catalogue-b").split(",");
      if (new Set(contexts).size < 2)
        throw new Error("At least two distinct reviewer contexts are required");
      await mkdir(options["output-dir"]);
      const hashes = {};
      for (const contextId of contexts) {
        const packet = cataloguePacket({ bundle, expectedSha256, instructions, contextId });
        await writeFile(join(options["output-dir"], `packet-${contextId}.json`), packet.json, {
          flag: "wx",
        });
        hashes[contextId] = packet.sha256;
      }
      process.stdout.write(`${JSON.stringify({ packets: hashes }, null, 2)}\n`);
      return;
    }
    if (!options.output) throw new Error("catalogue needs --output");
    if (!options.review?.length) throw new Error("catalogue needs --review files");
    const reviews = await Promise.all(options.review.map(readJsonFile));
    const adjudication = options.adjudication ? await readJsonFile(options.adjudication) : null;
    const summary = qualifyCatalogue({
      bundle,
      expectedSha256,
      instructions,
      reviews: reviews.map((r) => r.value),
      adjudication: adjudication?.value ?? null,
    });
    summary.files = {
      reviewSha256: reviews.map((r) => r.sha256),
      adjudicationSha256: adjudication?.sha256 ?? null,
    };
    await writeFile(options.output, `${JSON.stringify(summary, null, 2)}\n`, { flag: "wx" });
    process.stdout.write(`${summary.result}\n`);
    return;
  }
  throw new Error(
    "Usage: reading-writing-review.mjs prepare --before report.json --after report.json [--content-plan frozen-pair.json] --output-dir NEW_DIR\n" +
      "       reading-writing-review.mjs qualify --assignment assignment.json --review a.json --review b.json [--adjudication adjudication.json] --output NEW_FILE\n" +
      "       reading-writing-review.mjs qualify-reflections --assignment assignment.json --review reflection-a.json --review reflection-b.json --output NEW_FILE\n" +
      "       reading-writing-review.mjs catalogue-packets --bundle frozen-candidate.json --output-dir NEW_DIR\n" +
      "       reading-writing-review.mjs catalogue --bundle frozen-candidate.json --review a.json --review b.json [--adjudication adjudication.json] --output NEW_FILE",
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`Writing review failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
