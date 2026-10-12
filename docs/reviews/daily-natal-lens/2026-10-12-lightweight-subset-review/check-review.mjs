import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Checks the single primary review of the lightweight natal subset and applies the targeted
// gate in docs/reviews/daily-natal-lens/lightweight-readiness.md. Item checks follow
// daily-writing-ai-review-1; only the reviewer count differs from the complete-round checker,
// which stays unchanged. An optional adjudication may resolve a disputed substantive finding.
// It never changes a score. Writes a new result file and never edits a review.
const [collectionDirectory, dispatchPath, receiptPath, outputPath, adjudicationPath] =
  process.argv.slice(2);
if (!outputPath)
  throw new Error(
    "Usage: node check-review.mjs COLLECTION_DIR DISPATCH RECEIPT OUTPUT [ADJUDICATION]",
  );

const PROTOCOL_VERSION = "daily-writing-ai-review-1";
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
const CONTEXT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z$/;

const hash = (value) => createHash("sha256").update(value).digest("hex");
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};

const directory = resolve(collectionDirectory);
const read = (path) => readFile(path);
const manifestBytes = await read(resolve(directory, "collection-manifest.json"));
const assignmentBytes = await read(resolve(directory, "private", "assignment.json"));
const dispatchBytes = await read(dispatchPath);
const receiptBytes = await read(receiptPath);
const manifest = JSON.parse(manifestBytes);
const assignment = JSON.parse(assignmentBytes);
const dispatch = JSON.parse(dispatchBytes);
const receipt = JSON.parse(receiptBytes);
const contextId = manifest.packet.contextId;
check(CONTEXT_ID.test(String(contextId)), "The collection names an invalid context");
const packetBytes = await read(resolve(directory, "blind", contextId, "packet.json"));
const reviewBytes = await read(resolve(directory, "blind", contextId, "review.json"));
const promptText = await readFile(dispatch.promptPath, "utf8");
const review = JSON.parse(reviewBytes);
const packetSha256 = hash(packetBytes);
const reviewSha256 = hash(reviewBytes);
const promptSha256 = hash(promptText);

// Bindings: packet, prompt, dispatch, frozen review and private assignment agree.
check(
  packetSha256 === manifest.packet.sha256 &&
    packetSha256 === assignment.packets[contextId]?.sha256 &&
    packetSha256 === dispatch.packetSha256,
  "The packet is not the one assigned and dispatched",
);
check(
  assignment.itemSetHash === manifest.packet.itemSetHash &&
    assignment.itemSetHash === dispatch.itemSetHash,
  "The item set differs between the assignment and dispatch",
);
check(dispatch.contextId === contextId, "The dispatch names a different context");
check(promptSha256 === dispatch.promptSha256, "The archived prompt does not match its dispatch hash");
check(
  receipt.contextId === contextId &&
    receipt.reviewSha256 === reviewSha256 &&
    receipt.packetSha256 === packetSha256 &&
    receipt.promptSha256 === promptSha256,
  "The review is not the frozen review",
);
check(ISO_UTC.test(String(receipt.frozenAtUTC)), "The frozen receipt needs a UTC time");

// Review artifact: the original fresh, blind review.
check(
  review?.protocolVersion === PROTOCOL_VERSION && review.kind === "review",
  `The review is not a ${PROTOCOL_VERSION} review`,
);
check(review.reviewer?.contextId === contextId, "The review names a different context");
for (const field of ["model", "configuration"])
  check(nonEmpty(review.reviewer[field]), `The review must record its ${field}, or "unknown"`);
check(review.reviewer.promptSha256 === promptSha256, "The review copies a different prompt hash");
check(review.packetSha256 === packetSha256, "The review is bound to a different packet");
check(review.itemSetHash === assignment.itemSetHash, "The review covers a different item set");
check(
  review.reviewedAt === dispatch.dispatchAtUTC && ISO_UTC.test(String(review.reviewedAt)),
  "reviewedAt must copy the dispatch time",
);
const blindness = review.blindness ?? {};
check(nonEmpty(blindness.declaration), "The review needs a blindness declaration");
check(
  Array.isArray(blindness.inputs) &&
    blindness.inputs.length === 1 &&
    blindness.inputs[0] === "packet",
  "The review declares inputs other than its packet",
);
for (const flag of BLIND_FLAGS) check(blindness[flag] === false, `The review is not blind: ${flag}`);
check((review.reassessmentOf ?? null) === null, "The primary review cannot be a reassessment");

const expectedVerdict = (item, entry) => {
  if (item.findings.some((finding) => finding.severity === "substantive")) return "fail";
  if (entry.content.quiet) return item.quietCheck.safe === true ? "pass" : "fail";
  return gateDimensions(entry).some((d) => item.scores[d].score < 4) ? "fail" : "pass";
};
const gateDimensions = (entry) => [
  "specificity",
  "grounding",
  "coherence",
  ...(entry.applicable.synthesisCoherence ? ["synthesisCoherence"] : []),
  ...(entry.applicable.lensIntegration ? ["lensIntegration"] : []),
];

function validateFinding(where, finding, entry, findingIds) {
  const id = finding?.findingId;
  check(nonEmpty(id), `${where} has a finding without an ID`);
  check(!findingIds.has(id), `${where} repeats finding ID ${id}`);
  findingIds.add(id);
  const paragraph = entry.content.paragraphs[finding.paragraph - 1];
  check(
    Number.isInteger(finding.paragraph) && paragraph,
    `${where} finding ${id} names a paragraph the item does not have`,
  );
  check(
    nonEmpty(finding.passage) && paragraph.text.includes(finding.passage),
    `${where} finding ${id} passage is not verbatim in paragraph ${finding.paragraph}`,
  );
  const supplied = new Set(entry.content.facts.map((fact) => fact.id));
  for (const field of ["supportingFactIds", "missingFactIds"]) {
    check(Array.isArray(finding[field]), `${where} finding ${id} lacks ${field}`);
    for (const factId of finding[field])
      check(supplied.has(factId), `${where} finding ${id} names unsupplied fact ${factId}`);
  }
  check(
    finding.supportingFactIds.length || finding.missingFactIds.length,
    `${where} finding ${id} needs a supporting or missing fact ID`,
  );
  check(
    SUBSTANTIVE.has(finding.category) || MINOR.has(finding.category),
    `${where} finding ${id} has an unknown category`,
  );
  const severity = SUBSTANTIVE.has(finding.category) ? "substantive" : "minor";
  check(finding.severity === severity, `${where} finding ${id} severity must be ${severity}`);
  check(
    nonEmpty(finding.explanation) && nonEmpty(finding.proposedCorrection),
    `${where} finding ${id} needs an explanation and a proposed correction`,
  );
}

function validateItem(where, item, entry, findingIds) {
  const quiet = entry.content.quiet;
  for (const dimension of DIMENSIONS) {
    const score = item.scores?.[dimension];
    check(score && typeof score === "object", `${where} lacks ${dimension}`);
    check(nonEmpty(score.reason), `${where} ${dimension} needs a reason`);
    check(
      score.score === null ||
        (Number.isInteger(score.score) && score.score >= 1 && score.score <= 5),
      `${where} ${dimension} must be an integer from 1 to 5, or null`,
    );
    const applicable =
      !quiet &&
      (dimension === "synthesisCoherence"
        ? entry.applicable.synthesisCoherence
        : dimension === "lensIntegration"
          ? entry.applicable.lensIntegration
          : true);
    check(!applicable || score.score !== null, `${where} ${dimension} is applicable`);
    check(applicable || score.score === null, `${where} ${dimension} is not applicable`);
  }
  if (quiet) {
    const why = item.quietCheck?.reason ?? item.quietCheck?.explanation;
    check(
      typeof item.quietCheck?.safe === "boolean" && nonEmpty(why),
      `${where} is quiet and needs a quiet check`,
    );
  } else check(item.quietCheck === null, `${where} is not quiet; quietCheck must be null`);
  check(Array.isArray(item.findings), `${where} needs a findings array`);
  for (const finding of item.findings) validateFinding(where, finding, entry, findingIds);
  check(
    item.verdict === expectedVerdict(item, entry),
    `${where} verdict disagrees with its own scores and findings`,
  );
}

check(Array.isArray(review.items), "The review has no items");
const assessed = new Map();
for (const item of review.items) {
  check(Object.hasOwn(assignment.items, item?.itemId), `Unknown item ${item?.itemId}`);
  check(!assessed.has(item.itemId), `Duplicate item ${item.itemId}`);
  assessed.set(item.itemId, item);
}
for (const itemId of Object.keys(assignment.items))
  check(assessed.has(itemId), `The review is missing ${itemId}`);
const findingIds = new Set();
for (const item of review.items)
  validateItem(`Item ${item.itemId}`, item, assignment.items[item.itemId], findingIds);
check(
  review.verdict === (review.items.some((item) => item.verdict === "fail") ? "fail" : "pass"),
  "The overall verdict disagrees with the item verdicts",
);

// Contrast sets: one judgment per set, with exact quotations from each member.
check(Array.isArray(review.contrastChecks), "The review lacks contrastChecks");
check(
  review.repetitionChecks === undefined ||
    (Array.isArray(review.repetitionChecks) && review.repetitionChecks.length === 0),
  "The packet has no repetition sets",
);
const sets = assignment.setAssignments;
const contrasts = new Map();
for (const entry of review.contrastChecks) {
  const set = sets[entry?.setId];
  check(set?.kind === "contrast" && !contrasts.has(entry.setId), "Unknown or duplicate contrast");
  check(nonEmpty(entry.reason), "A contrast check needs a reason");
  check(
    typeof entry.distinctSupportedDifference === "boolean",
    "A contrast check needs a boolean judgment",
  );
  check(Array.isArray(entry.passages), "A contrast check lacks passages");
  const quoted = new Set();
  for (const passage of entry.passages) {
    check(set.itemIds.includes(passage?.itemId), "A contrast passage names a non-member");
    const paragraph =
      assignment.items[passage.itemId].content.paragraphs[passage.paragraph - 1];
    check(
      Number.isInteger(passage.paragraph) &&
        paragraph &&
        nonEmpty(passage.quote) &&
        paragraph.text.includes(passage.quote),
      "A contrast quote is not exact in its paragraph",
    );
    quoted.add(passage.itemId);
  }
  check(
    set.itemIds.every((id) => quoted.has(id)),
    "A contrast check omits a member's quotation",
  );
  contrasts.set(entry.setId, entry);
}
check(
  Object.keys(sets).every((setId) => contrasts.has(setId)),
  "The review is missing a contrast check",
);

// Optional adjudication of particular disputed or uncertain substantive findings.
const resolutions = new Map();
let adjudication = null;
let adjudicationSha256 = null;
if (adjudicationPath) {
  const bytes = await read(adjudicationPath);
  adjudication = JSON.parse(bytes);
  adjudicationSha256 = hash(bytes);
  check(
    adjudication?.protocolVersion === PROTOCOL_VERSION && adjudication.kind === "adjudication",
    "The adjudication is not a protocol adjudication",
  );
  check(adjudication.itemSetHash === assignment.itemSetHash, "Adjudication item set differs");
  const adjudicator = adjudication.adjudicator ?? {};
  check(
    CONTEXT_ID.test(String(adjudicator.contextId)) && adjudicator.contextId !== contextId,
    "The adjudicator is not a fresh context",
  );
  for (const field of ["model", "configuration"])
    check(nonEmpty(adjudicator[field]), `The adjudicator must record its ${field}`);
  check(SHA256.test(String(adjudicator.promptSha256)), "The adjudicator needs a prompt hash");
  check(ISO_UTC.test(String(adjudication.adjudicatedAt)), "The adjudication needs a UTC time");
  const declared = adjudication.blindness ?? {};
  check(
    nonEmpty(declared.declaration) &&
      declared.sawOriginLabels === false &&
      declared.sawImplementationContext === false &&
      Array.isArray(declared.inputs) &&
      declared.inputs.length > 0 &&
      declared.inputs.every((input) => ["findings", "items"].includes(input)),
    "The adjudication is not blind to origin and implementation",
  );
  check(Array.isArray(adjudication.resolutions), "The adjudication needs resolutions");
  for (const resolution of adjudication.resolutions) {
    check(resolution?.reviewerContextId === contextId, "A resolution names another reviewer");
    check(!resolutions.has(resolution.findingId), "Duplicate resolution");
    const item = review.items.find((i) =>
      i.findings.some((f) => f.findingId === resolution.findingId),
    );
    const finding = item?.findings.find((f) => f.findingId === resolution.findingId);
    check(finding?.severity === "substantive", "Only a substantive finding is adjudicated");
    check(resolution.itemId === item.itemId, "A resolution names the wrong item");
    check(resolution.passage === finding.passage, "A resolution passage differs");
    check(
      ["supported", "unsupported"].includes(resolution.resolution),
      "A resolution must be supported or unsupported",
    );
    check(Array.isArray(resolution.factEvidence), "A resolution needs fact evidence");
    check(
      resolution.resolution !== "supported" || resolution.factEvidence.length > 0,
      "A supported resolution needs fact evidence",
    );
    const facts = assignment.items[item.itemId].content.facts;
    for (const evidence of resolution.factEvidence) {
      const fact = facts.find((f) => f.id === evidence?.factId);
      check(
        fact && nonEmpty(evidence.statement) && wholeSentences(fact.statement, evidence.statement),
        `Fact evidence for ${resolution.findingId} is not whole verbatim sentences`,
      );
    }
    check(nonEmpty(resolution.explanation), "A resolution needs an explanation");
    resolutions.set(resolution.findingId, resolution);
  }
}
function wholeSentences(statement, quote) {
  if (quote === statement) return true;
  for (let at = statement.indexOf(quote); at >= 0; at = statement.indexOf(quote, at + 1)) {
    const startsSentence = at === 0 || /[.!?:]["')\]]*\s+$/.test(statement.slice(0, at));
    const after = statement.slice(at + quote.length);
    if (startsSentence && /[.!?]["')\]]*$/.test(quote) && (after === "" || /^\s/.test(after)))
      return true;
  }
  return false;
}

// Targeted gate: every prose sample passes, the quiet template is safe, and both duty/freedom
// contrasts are supported. A substantive finding passes only when adjudicated as supported;
// scores are never changed, averaged or replaced.
const assess = (itemId) => {
  const item = assessed.get(itemId);
  const entry = assignment.items[itemId];
  const findings = item.findings.map((finding) => ({
    ...finding,
    resolution:
      finding.severity === "substantive"
        ? (resolutions.get(finding.findingId)?.resolution ?? "unresolved")
        : null,
  }));
  const open = findings.filter(
    (f) => f.severity === "substantive" && f.resolution !== "supported",
  );
  const low = entry.content.quiet
    ? []
    : gateDimensions(entry).filter((d) => item.scores[d].score < 4);
  const safe = entry.content.quiet ? item.quietCheck.safe === true : null;
  return {
    itemId,
    scores: Object.fromEntries(DIMENSIONS.map((d) => [d, item.scores[d].score])),
    reasons: Object.fromEntries(DIMENSIONS.map((d) => [d, item.scores[d].reason])),
    quietCheck: item.quietCheck,
    originalVerdict: item.verdict,
    findings,
    belowThreshold: low,
    unresolvedSubstantive: open.map((f) => f.findingId),
    passed: open.length === 0 && low.length === 0 && safe !== false,
  };
};
const cases = manifest.samples.map((sample) => {
  const mapping = assignment.cases[sample.caseId];
  const raw = mapping.candidate ? assess(mapping.candidate) : null;
  const template = assess(mapping.template);
  return {
    caseId: sample.caseId,
    class: sample.class,
    raw: raw && {
      ...raw,
      durationMs: sample.raw.durationMs,
      exceededServingDeadline: sample.raw.exceededServingDeadline,
    },
    template,
    passed: (raw ? raw.passed : true) && template.passed,
  };
});
const contrastResults = Object.entries(sets).map(([setId, set]) => ({
  setId,
  lane: set.lane,
  caseIds: set.caseIds,
  itemIds: set.itemIds,
  ...contrasts.get(setId),
}));
const prose = cases.filter((row) => row.class !== "quiet-control");
const quiet = cases.find((row) => row.class === "quiet-control");
const proseSamplesPassed =
  prose.filter((row) => row.raw.passed).length + prose.filter((row) => row.template.passed).length;
const passed =
  prose.every((row) => row.raw.passed && row.template.passed) &&
  quiet.template.passed &&
  contrastResults.every((row) => row.distinctSupportedDifference === true);
const allFindings = cases.flatMap((row) =>
  [row.raw && ["raw", row.raw], ["template", row.template]]
    .filter(Boolean)
    .flatMap(([lane, result]) =>
      result.findings.map((finding) => ({ caseId: row.caseId, lane, itemId: result.itemId, ...finding })),
    ),
);
const result = {
  kind: "natal-lightweight-subset-result",
  collectionVersion: manifest.collectionVersion,
  label: manifest.label,
  result: passed
    ? "AI targeted writing-readiness review passed"
    : "AI targeted writing-readiness review failed",
  passed,
  scope: manifest.establishes,
  fullBenchmarkClaim: false,
  humanReviewCompleted: false,
  aiAssessmentOnly: true,
  bindings: {
    collectionManifestSha256: hash(manifestBytes),
    assignmentSha256: hash(assignmentBytes),
    packetSha256,
    itemSetHash: assignment.itemSetHash,
    promptSha256,
    dispatchSha256: hash(dispatchBytes),
    reviewSha256,
    reviewFrozenAtUTC: receipt.frozenAtUTC,
    receiptSha256: hash(receiptBytes),
    candidateReportSha256: manifest.candidateReport.sha256,
    sourceRevision: manifest.sourceIdentity.sourceRevision,
    adjudicationSha256,
  },
  reviewer: {
    contextId,
    model: review.reviewer.model,
    configuration: review.reviewer.configuration,
    declaration: blindness.declaration,
    reviewerCount: 1,
  },
  counts: {
    proseSamples: prose.length * 2,
    proseSamplesPassed,
    rawPassed: prose.filter((row) => row.raw.passed).length,
    templatesPassed: prose.filter((row) => row.template.passed).length,
    casesFullyPassing: prose.filter((row) => row.passed).length,
    quietSafe: quiet.template.passed,
    contrastSetsSupported: contrastResults.filter((row) => row.distinctSupportedDifference).length,
    substantiveFindings: allFindings.filter((f) => f.severity === "substantive").length,
    unresolvedSubstantiveFindings: allFindings.filter(
      (f) => f.severity === "substantive" && f.resolution !== "supported",
    ).length,
    minorFindings: allFindings.filter((f) => f.severity === "minor").length,
  },
  cases,
  contrast: contrastResults,
  substantiveFindings: allFindings.filter((f) => f.severity === "substantive"),
  minorFindings: allFindings.filter((f) => f.severity === "minor"),
  adjudication: adjudication && { sha256: adjudicationSha256, resolutions: [...resolutions.values()] },
  reliabilityObservations: {
    rawDraftsOverServingDeadline: prose
      .filter((row) => row.raw.exceededServingDeadline)
      .map((row) => ({ caseId: row.caseId, durationMs: row.raw.durationMs })),
    note: "Raw drafts were captured with a 120,000 ms runtime deadline. A draft over 60,000 ms would have returned the labeled template in the serving path; both are reviewed here.",
    missingInventory: manifest.missingInventory,
  },
  limitations: [
    "Targeted review of partial-run evidence: seven cases from the closed round-3 capture. It is not a complete benchmark and does not change any round's qualification or partial flags.",
    "One AI reviewer context. AI assessment is not human approval, empirical psychological validation or proof of real-reader quality.",
    "The reviewer was instructed to read only its packet; tool access was not technically sandboxed, and prose style or N1 can suggest an origin.",
    "The checker validates bookkeeping and applies the gate; it does not establish that a reviewer judgment is true.",
    "Natal writing only. Transit candidate chapters, P2 and activation are outside this gate; both candidates remain inactive.",
  ],
};
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
console.log(
  JSON.stringify({ result: result.result, counts: result.counts, contrast: contrastResults.map((c) => [c.lane, c.distinctSupportedDifference]) }, null, 2),
);
