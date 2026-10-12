import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

// Retains the established score, finding, blindness and hash checks for one fresh
// review. Raw drafts and current templates remain distinct in the private mapping.
const [collectionDirectory, dispatchPath, receiptPath, outputPath] = process.argv.slice(2);
if (!outputPath)
  throw new Error("Usage: node check-review.mjs COLLECTION_DIR DISPATCH RECEIPT OUTPUT");

const PROTOCOL_VERSION = "daily-writing-ai-review-1";
const DIMENSIONS = [
  "specificity",
  "grounding",
  "coherence",
  "voice",
  "repetition",
  "synthesisCoherence",
  "lensIntegration",
  "temporalCoherence",
  "chapterIntegration",
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
const packet = JSON.parse(packetBytes);
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
check(
  promptSha256 === dispatch.promptSha256,
  "The archived prompt does not match its dispatch hash",
);
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
for (const flag of BLIND_FLAGS)
  check(blindness[flag] === false, `The review is not blind: ${flag}`);
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
  ...(entry.applicable.temporalCoherence ? ["temporalCoherence"] : []),
  ...(entry.applicable.chapterIntegration ? ["chapterIntegration"] : []),
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
          : dimension === "temporalCoherence"
            ? entry.applicable.temporalCoherence
            : dimension === "chapterIntegration"
              ? entry.applicable.chapterIntegration
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
const contrastChecks = review.contrastChecks;
check(Array.isArray(contrastChecks), "Missing contrast checks");
check(contrastChecks.length === packet.contrastSets.length, "Incomplete chapter contrast coverage");
const seenContrasts = new Set();
for (const graded of contrastChecks) {
  const set = packet.contrastSets.find((s) => s.setId === graded.setId);
  check(set && !seenContrasts.has(graded.setId), "Unknown or repeated chapter contrast");
  seenContrasts.add(graded.setId);
  check(
    typeof graded.supported === "boolean" && nonEmpty(graded.explanation),
    "Invalid contrast verdict",
  );
  check(Array.isArray(graded.passages), "Missing contrast passages");
  for (const itemId of set.itemIds) {
    check(
      graded.passages.some((p) => p.itemId === itemId),
      "Missing contrast item passage",
    );
  }
  for (const passage of graded.passages) {
    check(set.itemIds.includes(passage.itemId), "Contrast passage uses an unassigned item");
    const entry = assignment.items[passage.itemId].content;
    const paragraph = entry.paragraphs[passage.paragraph - 1];
    check(
      Number.isInteger(passage.paragraph) &&
        paragraph &&
        nonEmpty(passage.passage) &&
        paragraph.text.includes(passage.passage),
      "Contrast quote is not exact",
    );
    check(
      Array.isArray(passage.factIds) &&
        passage.factIds.length &&
        passage.factIds.every((id) => entry.facts.some((f) => f.id === id)),
      "Invalid contrast fact references",
    );
  }
}
check(
  Array.isArray(review.repetitionChecks) && review.repetitionChecks.length === 0,
  "There are no formal repetition sets",
);
const gradedPass =
  review.items.every((item) => item.verdict === "pass") &&
  contrastChecks.every((graded) => graded.supported);
check(review.verdict === (gradedPass ? "pass" : "fail"), "Overall verdict is inconsistent");

check(
  hash(JSON.stringify([...packet.items].sort((a, b) => a.itemId.localeCompare(b.itemId)))) ===
    assignment.itemSetHash,
  "Packet item set hash does not match its contents",
);
const captureBytes = await read(manifest.capturePath);
check(hash(captureBytes) === manifest.captureSha256, "Capture changed");
const capture = JSON.parse(captureBytes);
const runDirectory = dirname(manifest.capturePath);
const planBytes = await read(resolve(runDirectory, "run-plan.json"));
const finishBytes = await read(resolve(runDirectory, "run-finished.json"));
check(hash(planBytes) === manifest.runPlanSha256, "Run plan changed");
check(hash(finishBytes) === manifest.runFinishedSha256, "Run receipt changed");
const plan = JSON.parse(planBytes);
const finish = JSON.parse(finishBytes);
check(
  capture.complete === true && finish.status === "complete" &&
    finish.sourceUnchangedThroughout === true && finish.haltReason === null &&
    finish.unsettledSample === null && finish.captureSha256 === manifest.captureSha256 &&
    finish.sourceRevision === capture.sourceRevision && plan.sourceRevision === capture.sourceRevision &&
    manifest.modelGeneratingRevision === capture.sourceRevision &&
    finish.trackedSourceSha256 === plan.trackedSourceSha256 &&
    finish.modelAttempts === 6 && finish.settledSamples === 6 &&
    finish.losslessRawDrafts === 6 && finish.retries === 0,
  "Paid capture is incomplete or its source binding changed",
);
check(
  plan.schedule.length === 6 && new Set(plan.schedule.map((s) => s.caseId)).size === 6 &&
    JSON.stringify(capture.samples.map(({ sampleId, caseId, repetition }) => ({ sampleId, caseId, repetition }))) === JSON.stringify(plan.schedule),
  "Paid capture does not match the six-case schedule",
);
const templatesBytes = await read(manifest.templatesPath);
check(hash(templatesBytes) === manifest.templatesSha256, "Offline templates changed");
const templates = JSON.parse(templatesBytes);
const revalidationBytes = await read(manifest.revalidationPath);
check(hash(revalidationBytes) === manifest.revalidationSha256, "Revalidation evidence changed");
const revalidation = JSON.parse(revalidationBytes);
check(
  revalidation.paidCaptureSha256 === manifest.captureSha256 &&
    revalidation.sourceRevision === manifest.sourceRevision,
  "Revalidation source binding changed",
);
const samples = manifest.samples.map((sample) => {
  const raw = sample.output === "raw-model";
  const row = raw
    ? capture.samples.find((s) => s.sampleId === sample.sampleId)?.result.case
    : templates.results.find((r) => r.case.id === sample.caseId)?.case;
  check(row && (!raw || row.candidate?.captureLossless === true), "Missing source prose");
  check(
    hash(JSON.stringify(raw ? row.candidate : row.template)) === sample.sourceSha256,
    "Original source prose changed",
  );
  const paragraphs = raw
    ? row.candidate.paragraphs.map((p) => p.text)
    : row.template.body.split("\n\n");
  const item = assignment.items[sample.itemId];
  check(
    JSON.stringify(item.content.paragraphs.map((p) => p.text)) === JSON.stringify(paragraphs),
    "Packet prose differs from the source",
  );
  const facts = row.facts.map((f) => ({
    id: f.id,
    ...(f.kind ? { kind: f.kind } : {}),
    statement: f.statement,
    ...(f.dependsOn?.length ? { dependsOn: [...f.dependsOn] } : {}),
  }));
  check(JSON.stringify(item.content.facts) === JSON.stringify(facts), "Packet facts changed");
  check(
    item.content.tone === row.config.tone && item.content.depth === row.config.depth,
    "Packet tone/depth changed",
  );
  check(
    item.content.paragraphs.every((p) => p.facts === null),
    "Citations not uniformly masked",
  );
  check(
    JSON.stringify(packet.items.find((p) => p.itemId === sample.itemId)) ===
      JSON.stringify(item.content),
    "Packet and assignment differ",
  );
  const graded = assessed.get(sample.itemId);
  return {
    sampleId: sample.sampleId,
    caseId: sample.caseId,
    output: sample.output,
    itemId: sample.itemId,
    structuralOutcome: row.diagnostics.outcome,
    structuralCode: row.diagnostics.code,
    verdict: graded.verdict,
    scores: graded.scores,
    findings: graded.findings,
  };
});
const allPass =
  samples.length === 12 &&
  samples.filter((s) => s.output === "raw-model").length === 6 &&
  samples.filter((s) => s.output === "template").length === 6 &&
  revalidation.allAccepted === true &&
  revalidation.allRequestsUnchanged === true &&
  revalidation.allRawDraftsUnchanged === true &&
  contrastChecks.length === 2 &&
  contrastChecks.every((c) => c.supported) &&
  manifest.unavailable.length === 0 &&
  samples.every((s) => s.verdict === "pass");
const result = {
  kind: "targeted-transit-writing-review-result",
  sourceRevision: manifest.sourceRevision,
  packetSha256,
  promptSha256,
  reviewSha256,
  itemSetHash: assignment.itemSetHash,
  reviewedDrafts: samples.length,
  passedDrafts: samples.filter((s) => s.verdict === "pass").length,
  unavailable: manifest.unavailable,
  verdict: allPass ? "pass" : "fail",
  fullBenchmarkClaim: false,
  candidatesActivated: false,
  humanReviewCompleted: false,
  contrastChecks,
  sourceQualificationEstablished: false,
  samples,
};
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
console.log(
  JSON.stringify(
    {
      verdict: result.verdict,
      reviewedDrafts: result.reviewedDrafts,
      passedDrafts: result.passedDrafts,
      checks:
        "hash bindings, blindness, raw prose/facts, applicability, scores, exact findings, verdict consistency",
    },
    null,
    2,
  ),
);
