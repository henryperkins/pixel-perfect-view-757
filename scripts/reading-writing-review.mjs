/**
 * Blinded AI writing-review bookkeeping for daily-writing-ai-review-1.
 * Works only on local synthetic report and review JSON: no model, network or database calls.
 * See docs/reviews/daily-reading-writing/review-protocol.md.
 */
import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
  for (const [field, label] of [
    ["fixtureVersion", "fixture version"],
    ["caseSetHash", "case set"],
    ["model", "model"],
    ["transitCopyHash", "transit copy"],
  ])
    if (before.report[field] !== after.report[field])
      throw new Error(`Unmatched reports: the ${label} differs`);
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
    },
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
    if (typeof item.quietCheck?.safe !== "boolean" || !nonEmpty(item.quietCheck.explanation))
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
    return gateDimensions(entry)
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
    result: passed ? "AI writing-review passed" : "AI writing-review failed",
    passed,
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
  throw new Error(
    "Usage: reading-writing-review.mjs prepare --before report.json --after report.json --output-dir NEW_DIR\n" +
      "       reading-writing-review.mjs qualify --assignment assignment.json --review a.json --review b.json [--adjudication adjudication.json] --output NEW_FILE",
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
