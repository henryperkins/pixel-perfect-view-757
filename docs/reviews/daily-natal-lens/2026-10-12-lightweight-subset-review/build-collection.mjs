import { createHash, randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Lightweight natal writing-readiness subset: a targeted review of partial-run evidence.
// Reads the closed round-3 artifacts read-only and verifies their recorded hashes. Writes one
// isolated reviewer packet, a private assignment and a public collection manifest to a new
// directory. No model, network, database or source-report writes; partial flags stay as captured.
// The complete-round verifier and packet builder are deliberately not used or changed.
const [roundDirectory, newDirectory, contextId] = process.argv.slice(2);
if (!contextId) throw new Error("Usage: node build-collection.mjs ROUND3_DIR NEW_DIR CONTEXT_ID");
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(contextId)) throw new Error("Invalid context ID");

const COLLECTION_VERSION = "natal-lightweight-subset-1";
const LABEL = "Targeted review of partial-run evidence";
const SOURCE_REVISION = "948aa00ed8935a6026904461831844a47e98356c";
const TRACKED_SOURCE_SHA256 = "a50ca0c80f0998ff2c884ad70c5e9fa6548d7e60f30aabbe29bac31017fad7e0";
const RUNNER_SHA256 = "b0616656b470dc9e482e907a008a6a061f1d7b641d1a62e526e23305480d518b";
const SERVING_DEADLINE_MS = 60_000;
const BOUND = {
  "natal-candidate-partial-report.json":
    "75a082fc149dc616b994b358978afa61d224d0af4c14beec9bdfdacfa9a19d60",
  "templates.json": "f2434374eeccae29c27fc02d1827ab8ca8002340d85c12934ce82f56c49e1254",
  "template-source-manifest.json":
    "84282660e25ca4b80e249b2e890ac11c6443d742a8d76c4c7a370e557d2c09b2",
  "template-capture-receipt.json":
    "fe65d9e6bfabe0480e43ec8bdfcba24068a708a495e33147305f6627da827c22",
  "case-contexts.json": "52a0e08caccb3015aaee0fd1a7934744253d91fe7256466fda6d0b97443a985e",
  "source-manifest.json": "e078ef5bbbc4a93344b38499b3f75012fc3d3271cc57e83f8388bdb19c7692f2",
  "run-plan.json": "e83c37a74f2c9e68e29882ca12a74820aca5fb3d43f83a5aaf55f4d198569682",
  "run-finished.json": "420e838af6895e8c04b9bc7a07bbcc6ebfcbc35929c903a574164ce56db5bc74",
  "interrupted-evidence-index.json":
    "2457d6598fc4ed6c3118777b0a6b90b1a715e40910102020b2884588354ff95f",
  "interrupted-run-audit.json": "cea348b52506b962b5aea605435a142ccd4f7e9a8f95a52e3ab06e23ce3b1a3e",
  "reviewer-instructions.md": "822af5b1599feb0384768d857feabd89f63691fe806b203b16dffe084dd7a42b",
};
// Seven prose cases, each reviewed as its captured raw draft and its deterministic template.
const SELECTED = [
  ["natal-duty-reflex", "natal-positive"],
  ["natal-freedom-reflex", "natal-positive"],
  ["natal-exact-house", "natal-positive"],
  ["natal-moon-fallback", "natal-positive"],
  ["natal-synthesis-integration", "natal-positive"],
  ["saturn-square-moon-warm", "natal-free"],
  ["natal-legacy-snapshot", "natal-negative"],
];
const QUIET = "quiet-threshold";
const CONTRAST = ["natal-duty-reflex", "natal-freedom-reflex"];
const LANES = ["candidate", "template"];
const TARGETED_SCOPE = [
  "Targeted review scope. This packet holds 15 items: 14 prose items and 1 quiet item. Apply the embedded instructions to every item and every contrast set.",
  "- Gate dimensions are specificity, grounding and coherence, plus lensIntegration when the item supplies N1 and synthesisCoherence when it supplies S1. Each must be at least 4. Any substantive finding fails the item, and so does an unresolved grounding doubt.",
  "- Voice and repetition are recorded with reasons and do not gate by themselves. Where a concrete wording change would make an item clearer or more useful to a reader, record it as a minor finding with that proposedCorrection.",
  "- Preserve conditional source wording. Keep each calculated contact's transiting body and natal point in their supplied roles, and keep the reading's own position in the calculated window distinct from the calculated exact date. Invented geometry, causal links that the supplied statements do not make, and clinical or biological claims are substantive findings.",
  "- The quiet item receives null scores and a quietCheck only.",
  "- This packet has no repetitionSets; write repetitionChecks as an empty array. Write one contrastChecks entry for every contrastSets entry.",
].join("\n");
const CONTRAST_QUESTION =
  "Do these samples offer distinct practical choices supported by their respective supplied facts? Absence of N1 does not require invented variation.";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const shuffle = (values) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

const bytes = {};
for (const [name, expected] of Object.entries(BOUND)) {
  bytes[name] = await readFile(resolve(roundDirectory, name));
  check(hash(bytes[name]) === expected, `${name} does not match its bound SHA-256`);
}
const load = (name) => JSON.parse(bytes[name]);
const report = load("natal-candidate-partial-report.json");
const templates = load("templates.json");
const contexts = load("case-contexts.json");
const receipt = load("template-capture-receipt.json");
const templateManifest = load("template-source-manifest.json");
const sourceManifest = load("source-manifest.json");
const runPlan = load("run-plan.json");
const finished = load("run-finished.json");
const index = load("interrupted-evidence-index.json");
const audit = load("interrupted-run-audit.json");
const instructions = bytes["reviewer-instructions.md"].toString("utf8");
const reportSha256 = BOUND["natal-candidate-partial-report.json"];

// One closed generating source binds the report, the run receipts and the offline templates.
for (const [label, identity] of [
  ["source manifest", sourceManifest],
  ["run plan", runPlan],
  ["run finish", finished],
  ["template source manifest", templateManifest],
  ["template capture receipt", receipt.sourceIdentity],
])
  check(
    identity.sourceRevision === SOURCE_REVISION &&
      identity.trackedSourceSha256 === TRACKED_SOURCE_SHA256,
    `The ${label} names a different source`,
  );
check(index.sourceRevision === SOURCE_REVISION, "The evidence index names a different source");
check(
  sourceManifest.runnerSha256 === RUNNER_SHA256 && runPlan.runnerSha256 === RUNNER_SHA256,
  "The runner hash differs",
);
check(
  finished.status === "halted" && finished.unsettledCase === null && finished.retries === 0,
  "The run did not close as recorded",
);
check(
  index.resumable === false && index.qualified === false && index.reviewScoresAssigned === false,
  "The evidence index no longer records a closed, unscored round",
);
check(
  index.partialReportHashes["natal-candidate"] === reportSha256 &&
    index.frozenFiles["natal-candidate-partial-report.json"].sha256 === reportSha256 &&
    audit.bundles["natal-candidate"].lastCheckpointSha256 === reportSha256,
  "The candidate report is not the recorded final partial checkpoint",
);
check(
  audit.provenanceIntegrityPassed === true && audit.reviewState.scoresAssigned === false,
  "The partial-run audit does not record clean, unscored provenance",
);
for (const name of ["templates.json", "case-contexts.json", "template-source-manifest.json"])
  check(
    receipt.files.some((file) => file.path === name && file.sha256 === BOUND[name]),
    `The template capture receipt does not bind ${name}`,
  );
check(
  report.partial === true && report.expectedCases === 38 && report.cases.length === 37,
  "The candidate report is not the closed 37/38 partial report",
);
check(
  report.source === "live-synthetic" &&
    report.bundleSource === "natal-candidate" &&
    report.bundleVersion === "builtin-0.6.1" &&
    report.promptVersion === "daily-astro-body-11" &&
    report.validatorVersion === "daily-reference-7",
  "The candidate report identity differs",
);
const snapshot = templates.snapshots.find((s) => s.bundleSource === "natal-candidate");
check(snapshot, "The offline template capture lacks the natal candidate");
for (const field of [
  "bundleVersion",
  "bundleHash",
  "fixtureVersion",
  "caseSetHash",
  "transitCopyHash",
  "promptVersion",
  "validatorVersion",
  "planVersion",
  "natalPlanVersion",
  "reliabilityVersion",
])
  check(snapshot[field] === report[field], `Template capture ${field} differs from the report`);

const rows = new Map(report.cases.map((row) => [row.id, row]));
const offline = new Map(snapshot.cases.map((row) => [row.id, row]));
const fixed = new Map(contexts.map((row) => [row.id, row]));
const visibleFacts = (facts) =>
  facts.map((fact) => ({
    id: fact.id,
    ...(fact.kind ? { kind: fact.kind } : {}),
    statement: fact.statement,
    ...(fact.dependsOn?.length ? { dependsOn: [...fact.dependsOn] } : {}),
  }));
const masked = (texts) => texts.map((text, i) => ({ number: i + 1, text, facts: null }));

const entries = new Map();
const record = (row, output, texts, origin) => {
  const content = {
    tone: row.config.tone,
    depth: row.config.depth,
    quiet: row.diagnostics.code === "no_cycle",
    facts: visibleFacts(row.facts),
    paragraphs: masked(texts),
  };
  // Only identical complete visible contexts deduplicate.
  const key = JSON.stringify(content);
  if (!entries.has(key)) entries.set(key, { content, mappings: [] });
  entries.get(key).mappings.push({ caseId: row.id, output, ...origin });
  return key;
};

const samples = [];
const caseKeys = {};
for (const [caseId, sampleClass] of [...SELECTED, [QUIET, "quiet-control"]]) {
  const row = rows.get(caseId);
  const template = offline.get(caseId);
  const context = fixed.get(caseId);
  check(row && template && context, `${caseId} is missing from the bound evidence`);
  check(
    row.configHash === template.configHash && same(row.config, context.config),
    `${caseId} configuration differs between the report and the fixed contexts`,
  );
  check(same(row.facts, template.facts), `${caseId} supplied facts differ from the template capture`);
  check(
    row.template.body === template.templateBody,
    `${caseId} template differs from the offline capture`,
  );
  const templateTexts = row.template.body.split("\n\n");
  const keys = {
    template: record(row, "template", templateTexts, {
      bodySha256: hash(row.template.body),
      displayed: row.output.mode === "template",
    }),
    candidate: null,
  };
  let raw = null;
  if (caseId === QUIET) {
    check(
      row.diagnostics.code === "no_cycle" &&
        row.diagnostics.attempted === false &&
        !row.candidate &&
        row.output.mode === "template" &&
        row.output.body === row.template.body,
      "The quiet control is not an unattempted template-only case",
    );
  } else {
    const candidate = row.candidate;
    check(
      row.diagnostics.attempted === true && row.diagnostics.outcome === "accepted",
      `${caseId} has no accepted raw draft`,
    );
    check(
      candidate?.captureLossless === true &&
        candidate.truncated === false &&
        candidate.paragraphCount === candidate.paragraphs.length &&
        candidate.paragraphs.every(
          (p) =>
            typeof p.text === "string" &&
            Array.isArray(p.facts) &&
            p.facts.every((id) => typeof id === "string"),
        ),
      `${caseId} raw capture is not lossless`,
    );
    const texts = candidate.paragraphs.map((p) => p.text);
    check(
      row.output.mode === "model" && row.output.body === texts.join("\n\n"),
      `${caseId} displayed body differs from its raw draft`,
    );
    raw = {
      capture: "lossless",
      automatedOutcome: row.diagnostics.outcome,
      automatedCode: row.diagnostics.code,
      durationMs: row.diagnostics.durationMs,
      servingDeadlineMs: SERVING_DEADLINE_MS,
      exceededServingDeadline: row.diagnostics.durationMs > SERVING_DEADLINE_MS,
      bodySha256: hash(row.output.body),
    };
    keys.candidate = record(row, "candidate", texts, {
      ...raw,
      originalCitations: candidate.paragraphs.map((p) => [...p.facts]),
      displayed: true,
    });
  }
  caseKeys[caseId] = keys;
  const supplied = row.facts.map((fact) => fact.id);
  samples.push({
    caseId,
    class: sampleClass,
    description: row.description,
    tone: row.config.tone,
    depth: row.config.depth,
    configHash: row.configHash,
    suppliedFactIds: supplied,
    factsSha256: hash(JSON.stringify(visibleFacts(row.facts))),
    limits: row.facts.filter((fact) => /^[EU]\d+$/.test(fact.id)).map((fact) => fact.statement),
    suppression: context.suppression,
    natalLens: {
      status: row.natalLensPlan?.status ?? null,
      ruleKey: row.natalLensPlan?.lens?.ruleKey ?? null,
      role: row.natalLensPlan?.lens?.role ?? null,
      n1Supplied: supplied.includes("N1"),
    },
    synthesisSupplied: supplied.includes("S1"),
    raw,
    template: { bodySha256: hash(row.template.body), matchesOfflineCapture: true },
  });
}

// Opaque IDs follow a random order, so neither IDs nor canonical order reveal origin.
const ids = new Map();
shuffle([...entries.keys()]).forEach((key, i) =>
  ids.set(key, `item-${String(i + 1).padStart(2, "0")}`),
);
const items = {};
for (const [key, entry] of entries) {
  const itemId = ids.get(key);
  const supplied = entry.content.facts.map((fact) => fact.id);
  items[itemId] = {
    content: { itemId, ...entry.content },
    mappings: entry.mappings,
    applicable: {
      synthesisCoherence: !entry.content.quiet && supplied.includes("S1"),
      lensIntegration: !entry.content.quiet && supplied.includes("N1"),
    },
  };
}
check(Object.keys(items).length === 15, "Expected 15 unique items: 14 prose and one quiet");
const cases = Object.fromEntries(
  Object.entries(caseKeys).map(([caseId, keys]) => [
    caseId,
    {
      candidate: keys.candidate ? ids.get(keys.candidate) : null,
      template: ids.get(keys.template),
    },
  ]),
);
const contrastSets = [];
const setAssignments = {};
for (const lane of LANES) {
  const setId = `contrast-${hash(`${lane}:${randomInt(2 ** 32)}`).slice(0, 10)}`;
  const members = shuffle(CONTRAST.map((caseId) => ({ caseId, itemId: cases[caseId][lane] })));
  contrastSets.push({
    setId,
    itemIds: members.map((m) => m.itemId),
    question: CONTRAST_QUESTION,
  });
  setAssignments[setId] = {
    kind: "contrast",
    lane,
    itemIds: members.map((m) => m.itemId),
    caseIds: members.map((m) => m.caseId),
  };
}

const canonical = Object.keys(items)
  .sort()
  .map((id) => items[id].content);
const itemSetHash = hash(JSON.stringify(canonical));
const instructionsSha256 = hash(instructions);
const targetedScopeSha256 = hash(TARGETED_SCOPE);
const packet = {
  protocolVersion: "daily-writing-ai-review-1",
  kind: "packet",
  contextId,
  itemSetHash,
  instructionsSha256,
  instructions,
  targetedScopeSha256,
  targetedScope: TARGETED_SCOPE,
  items: shuffle(canonical),
  contrastSets: shuffle(contrastSets),
  repetitionSets: [],
};
const packetBytes = json(packet);
const packetSha256 = hash(packetBytes);

const output = resolve(newDirectory);
await mkdir(output);
await mkdir(resolve(output, "blind", contextId), { recursive: true });
await mkdir(resolve(output, "private"));
await writeFile(resolve(output, "blind", contextId, "packet.json"), packetBytes, { flag: "wx" });

const missingInventory = {
  sourceIndex: "../2026-10-12-qualification-round-3/interrupted-evidence-index.json",
  sourceAudit: "../2026-10-12-qualification-round-3/interrupted-run-audit.json",
  expectedCasesPerBundle: index.expectedCasesPerBundle,
  settledCasesPerBundle: index.settledCasesPerBundle,
  timeouts: index.timeouts,
  unattemptedCasesByBundle: index.unattemptedCasesByBundle,
  plannedNonquietSlotsWithoutRawCapture:
    audit.captureIntegrity.plannedNonquietSlotsWithoutRawCapture,
  note: "Timeouts and unattempted cases have no raw draft and no passing writing score. They are retained, never backfilled, and outside this subset.",
};
const manifest = {
  kind: "natal-lightweight-subset-collection",
  collectionVersion: COLLECTION_VERSION,
  label: LABEL,
  policy: "../lightweight-readiness.md",
  establishes: "AI-reviewed lightweight subset writing readiness for natal writing only",
  fullBenchmarkClaim: false,
  roundQualificationChanged: false,
  partialFlagsChanged: false,
  missingDraftsBackfilled: false,
  newModelRequests: 0,
  baselineReviewed: false,
  humanReviewCompleted: false,
  candidatesActivated: false,
  sourceIdentity: {
    sourceRevision: SOURCE_REVISION,
    trackedSourceSha256: TRACKED_SOURCE_SHA256,
    runnerSha256: RUNNER_SHA256,
    servingDeadlineMs: SERVING_DEADLINE_MS,
    captureDeadlineMs: finished.runtimeDeadlineMs,
  },
  boundFiles: Object.fromEntries(
    Object.entries(BOUND).map(([name, sha256]) => [
      `../2026-10-12-qualification-round-3/${name}`,
      sha256,
    ]),
  ),
  candidateReport: {
    sha256: reportSha256,
    partial: report.partial,
    bundleSource: report.bundleSource,
    bundleVersion: report.bundleVersion,
    bundleHash: report.bundleHash,
    promptVersion: report.promptVersion,
    validatorVersion: report.validatorVersion,
    model: report.model,
  },
  selection: {
    proseCases: SELECTED.map(([caseId]) => caseId),
    proseSamples: SELECTED.length * 2,
    quietSafetyCase: QUIET,
    contrast: CONTRAST,
    uniqueItems: Object.keys(items).length,
  },
  samples,
  packet: {
    contextId,
    sha256: packetSha256,
    itemSetHash,
    instructionsSha256,
    targetedScopeSha256,
    masking:
      "Every paragraph citation array is masked as null; original citations stay in the private assignment.",
  },
  missingInventory,
};
const assignment = {
  protocolVersion: "daily-writing-ai-review-1",
  kind: "targeted-subset-assignment",
  collectionVersion: COLLECTION_VERSION,
  label: LABEL,
  itemSetHash,
  instructionsSha256,
  targetedScopeSha256,
  packets: { [contextId]: { sha256: packetSha256 } },
  report: { sha256: reportSha256, partial: report.partial },
  items,
  cases,
  setAssignments,
};
await writeFile(resolve(output, "private", "assignment.json"), json(assignment), { flag: "wx" });
await writeFile(resolve(output, "collection-manifest.json"), json(manifest), { flag: "wx" });
console.log(
  JSON.stringify(
    { items: canonical.length, itemSetHash, packetSha256, contrastSets: contrastSets.length },
    null,
    2,
  ),
);
