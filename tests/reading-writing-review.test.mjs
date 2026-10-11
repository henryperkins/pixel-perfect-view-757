import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  PROTOCOL_VERSION,
  cataloguePacket,
  prepareReview,
  qualifyCatalogue,
  qualifyReviews,
} from "../scripts/reading-writing-review.mjs";

// These tests check bookkeeping: blinding, coverage, bindings and the gate arithmetic.
// They cannot establish that any reviewer judgment is true.
const SOURCE = new URL(
  "../docs/reviews/daily-reading-writing/2026-10-11/source-report.json",
  import.meta.url,
);
const INSTRUCTIONS = new URL(
  "../docs/reviews/daily-reading-writing/reviewer-instructions.md",
  import.meta.url,
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
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

async function inputs(change = () => {}) {
  const bytes = await readFile(SOURCE);
  const before = JSON.parse(bytes.toString("utf8"));
  const after = structuredClone(before);
  after.promptVersion = "daily-astro-body-8";
  for (const row of after.cases) {
    if (row.candidate) row.candidate.captureLossless = true;
    row.diagnostics = { ...row.diagnostics, promptVersion: "daily-astro-body-8" };
  }
  const revise = (id, index, text) => {
    const row = after.cases.find((c) => c.id === id);
    row.candidate.paragraphs[index].text = text;
    row.output.body = row.candidate.paragraphs.map((p) => p.text).join("\n\n");
  };
  revise(
    "natal-moon-fallback",
    0,
    "An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity.",
  );
  revise(
    "natal-freedom-reflex",
    0,
    "An unclaimed hour can remain crowded if an obligation follows you into rest. A small obligation can take up more room than its size suggests.",
  );
  change(after);
  return {
    before: { report: before, sha256: sha256(bytes) },
    after: { report: after, sha256: sha256(JSON.stringify(after)) },
    instructions: await readFile(INSTRUCTIONS, "utf8"),
  };
}

const itemFor = (assignment, run, caseId, output) =>
  Object.entries(assignment.items).find(([, entry]) =>
    entry.mappings.some((m) => m.run === run && m.caseId === caseId && m.output === output),
  )?.[0];

/** Mirrors the protocol's verdict rule so fixtures stay internally consistent. */
function settle(artifact, assignment) {
  for (const item of artifact.items) {
    const entry = assignment.items[item.itemId];
    const gate = ["specificity", "grounding", "coherence"];
    if (entry?.applicable.synthesisCoherence) gate.push("synthesisCoherence");
    if (entry?.applicable.lensIntegration) gate.push("lensIntegration");
    const fails =
      item.findings.some((f) => f.severity === "substantive") ||
      (!entry?.content.quiet && gate.some((d) => (item.scores[d]?.score ?? 0) < 4)) ||
      (entry?.content.quiet && item.quietCheck?.safe !== true);
    item.verdict = fails ? "fail" : "pass";
  }
  artifact.verdict = artifact.items.some((item) => item.verdict === "fail") ? "fail" : "pass";
  return artifact;
}

function review(prepared, contextId, edit = () => {}, packetOf = contextId) {
  const { assignment } = prepared;
  const score = (applicable, value = 4) =>
    applicable
      ? { score: value, reason: "Synthetic bookkeeping score." }
      : { score: null, reason: "Not applicable: the item does not supply this fact." };
  const items = Object.keys(assignment.items)
    .sort()
    .map((itemId) => {
      const entry = assignment.items[itemId];
      const quiet = entry.content.quiet;
      return {
        itemId,
        scores: quiet
          ? Object.fromEntries(
              DIMENSIONS.map((d) => [d, { score: null, reason: "Quiet template-only item." }]),
            )
          : {
              specificity: score(true),
              grounding: score(true),
              coherence: score(true),
              voice: score(true),
              repetition: score(true),
              synthesisCoherence: score(entry.applicable.synthesisCoherence),
              lensIntegration: score(entry.applicable.lensIntegration),
            },
        quietCheck: quiet ? { safe: true, explanation: "A safe quiet-day message." } : null,
        findings: [],
        verdict: "pass",
      };
    });
  const artifact = {
    protocolVersion: PROTOCOL_VERSION,
    kind: "review",
    packetSha256: prepared.packets.find((p) => p.contextId === packetOf).sha256,
    itemSetHash: assignment.itemSetHash,
    reviewer: {
      contextId,
      model: "unknown",
      configuration: "unknown",
      promptSha256: "a".repeat(64),
    },
    reviewedAt: "2026-10-11T18:00:00Z",
    blindness: {
      declaration: "I saw only my packet.",
      inputs: ["packet"],
      sawOriginLabels: false,
      sawPriorVerdicts: false,
      sawOtherReviews: false,
      sawImplementationContext: false,
    },
    reassessmentOf: packetOf === contextId ? null : packetOf,
    items,
    verdict: "pass",
  };
  edit(artifact);
  return settle(artifact, assignment);
}

function finding(prepared, itemId, overrides = {}) {
  const paragraph = prepared.assignment.items[itemId].content.paragraphs[0];
  return {
    findingId: `f-${itemId}`,
    paragraph: 1,
    passage: paragraph.text.split(" ").slice(0, 4).join(" "),
    supportingFactIds: [],
    missingFactIds: ["I1"],
    category: "strengthened_modality",
    severity: "substantive",
    explanation: "The cited statement says this can happen, not that it does.",
    proposedCorrection: "Keep the possibility.",
    ...overrides,
  };
}

function adjudication(prepared, resolutions, overrides = {}) {
  return {
    protocolVersion: PROTOCOL_VERSION,
    kind: "adjudication",
    itemSetHash: prepared.assignment.itemSetHash,
    adjudicator: {
      contextId: "adjudicator-1",
      model: "unknown",
      configuration: "unknown",
      promptSha256: "b".repeat(64),
    },
    adjudicatedAt: "2026-10-11T19:00:00Z",
    blindness: {
      declaration: "I saw the disputed findings and their items only.",
      inputs: ["findings", "items"],
      sawOriginLabels: false,
      sawImplementationContext: false,
    },
    resolutions,
    ...overrides,
  };
}

const statementOf = (prepared, itemId, factId) =>
  prepared.assignment.items[itemId].content.facts.find((f) => f.id === factId).statement;

const itemReview = (artifact, itemId) => artifact.items.find((item) => item.itemId === itemId);

test("packets are blinded, independently ordered and bound to one canonical item set", async () => {
  const data = await inputs();
  const prepared = prepareReview({ ...data, random: seeded(7) });
  const [a, b] = prepared.packets;
  assert.deepEqual(
    prepared.packets.map((p) => p.contextId),
    ["reviewer-a", "reviewer-b"],
  );
  assert.notEqual(a.sha256, b.sha256);
  assert.equal(a.sha256, sha256(a.json));
  assert.equal(prepared.assignment.packets["reviewer-a"].sha256, a.sha256);
  assert.equal(a.packet.itemSetHash, b.packet.itemSetHash);
  assert.equal(a.packet.itemSetHash, prepared.assignment.itemSetHash);
  assert.notDeepEqual(
    a.packet.items.map((item) => item.itemId),
    b.packet.items.map((item) => item.itemId),
  );
  assert.deepEqual(
    a.packet.items.map((item) => item.itemId).sort(),
    b.packet.items.map((item) => item.itemId).sort(),
  );
  assert.equal(a.packet.instructions, data.instructions);
  assert.equal(a.packet.instructionsSha256, sha256(data.instructions));
  const visible = JSON.stringify(a.packet.items);
  for (const leak of [
    ...data.before.report.cases.map((c) => c.id),
    "daily-astro-body",
    "daily-reference",
    "gemini",
    "builtin-0.5.0",
    "live-synthetic",
    "accepted",
    "rejected",
    "manualReview",
    '"before"',
    '"after"',
    "candidate",
    "template",
  ])
    assert.ok(!visible.includes(leak), `packet items leak ${leak}`);
  for (const item of a.packet.items) {
    assert.deepEqual(Object.keys(item).sort(), [
      "depth",
      "facts",
      "itemId",
      "paragraphs",
      "quiet",
      "tone",
    ]);
    assert.match(item.itemId, /^item-\d{2,}$/);
    for (const fact of item.facts)
      assert.ok(
        Object.keys(fact).every((key) => ["id", "kind", "statement", "dependsOn"].includes(key)),
      );
  }
  // Every case keeps its mapping privately; the quiet case is one shared item.
  const { assignment } = prepared;
  for (const run of ["before", "after"])
    for (const row of data[run].report.cases) {
      assert.ok(itemFor(assignment, run, row.id, "template"), `${run} ${row.id} template`);
      assert.ok(itemFor(assignment, run, row.id, "displayed"), `${run} ${row.id} displayed`);
      if (row.diagnostics.attempted)
        assert.ok(itemFor(assignment, run, row.id, "candidate"), `${run} ${row.id} candidate`);
    }
  const quiet = itemFor(assignment, "after", "quiet-threshold", "template");
  assert.equal(quiet, itemFor(assignment, "before", "quiet-threshold", "template"));
  assert.equal(assignment.items[quiet].content.quiet, true);
  assert.deepEqual(assignment.uncovered, []);
});

test("deduplication requires identical text and the full fact, tone and depth context", async () => {
  const data = await inputs((after) => {
    const a = after.cases.find((c) => c.id === "natal-unknown-time");
    const b = after.cases.find((c) => c.id === "natal-legacy-snapshot");
    b.candidate.paragraphs = structuredClone(a.candidate.paragraphs);
    b.output.body = a.output.body;
    b.output.citations = structuredClone(a.output.citations);
  });
  const { assignment } = prepareReview({ ...data, random: seeded(3) });
  // Same text under different supplied facts stays two items.
  assert.notEqual(
    itemFor(assignment, "after", "natal-unknown-time", "candidate"),
    itemFor(assignment, "after", "natal-legacy-snapshot", "candidate"),
  );
  // An accepted draft and its displayed body are one item; unchanged templates are shared.
  const candidate = itemFor(assignment, "after", "saturn-square-sun", "candidate");
  assert.equal(candidate, itemFor(assignment, "after", "saturn-square-sun", "displayed"));
  const template = itemFor(assignment, "after", "saturn-square-sun", "template");
  assert.equal(template, itemFor(assignment, "before", "saturn-square-sun", "template"));
  assert.notEqual(candidate, template);
  // An unchanged candidate is shared across runs; a corrected one is not.
  assert.equal(candidate, itemFor(assignment, "before", "saturn-square-sun", "candidate"));
  assert.notEqual(
    itemFor(assignment, "after", "natal-moon-fallback", "candidate"),
    itemFor(assignment, "before", "natal-moon-fallback", "candidate"),
  );
  // Template paragraphs record no per-paragraph citations.
  assert.ok(assignment.items[template].content.paragraphs.every((p) => p.facts === null));
});

test("a complete passing review pair qualifies the corrected run without human review", async () => {
  const prepared = prepareReview({ ...(await inputs()), random: seeded(11) });
  const summary = qualifyReviews({
    assignment: prepared.assignment,
    reviews: [review(prepared, "reviewer-a"), review(prepared, "reviewer-b")],
  });
  assert.equal(summary.protocolVersion, PROTOCOL_VERSION);
  assert.equal(summary.humanReviewCompleted, false);
  assert.equal(summary.passed, true);
  assert.equal(summary.result, "AI writing-review passed");
  assert.deepEqual(summary.corrected.failures, []);
  assert.deepEqual(
    summary.reviewers.map((r) => r.contextId),
    ["reviewer-a", "reviewer-b"],
  );
  assert.equal(summary.automated.after.outcomes.accepted, 27);
  assert.equal(summary.automated.before.outcomes.skipped, 1);
  assert.equal(summary.coverage.quietItems, 1);
  assert.equal(summary.coverage.scoredItems, summary.coverage.items - 1);
  assert.match(summary.limitations.join(" "), /not.*independent model famil/i);
});

test("a quiet check gives its reason the way scores do", async () => {
  const prepared = prepareReview({ ...(await inputs()), random: seeded(11) });
  const quietId = Object.keys(prepared.assignment.items).find(
    (id) => prepared.assignment.items[id].content.quiet,
  );
  const withQuietCheck = (quietCheck) =>
    review(prepared, "reviewer-a", (artifact) => {
      artifact.items.find((item) => item.itemId === quietId).quietCheck = quietCheck;
    });
  const summary = qualifyReviews({
    assignment: prepared.assignment,
    reviews: [
      withQuietCheck({ safe: true, reason: "No invented signal, claim or instruction." }),
      review(prepared, "reviewer-b"),
    ],
  });
  assert.equal(summary.passed, true);
  assert.throws(
    () =>
      qualifyReviews({
        assignment: prepared.assignment,
        reviews: [withQuietCheck({ safe: true }), review(prepared, "reviewer-b")],
      }),
    /needs a quiet check/,
  );
});

test("coverage, identity bindings, scores and blindness are validated before any gate", async () => {
  const prepared = prepareReview({ ...(await inputs()), random: seeded(5) });
  const good = () => review(prepared, "reviewer-b");
  const someItem = Object.keys(prepared.assignment.items).find(
    (id) => !prepared.assignment.items[id].content.quiet,
  );
  const withS1 = Object.keys(prepared.assignment.items).find(
    (id) => prepared.assignment.items[id].applicable.synthesisCoherence,
  );
  const without = Object.keys(prepared.assignment.items).find(
    (id) =>
      !prepared.assignment.items[id].content.quiet &&
      !prepared.assignment.items[id].applicable.synthesisCoherence,
  );
  for (const [name, edit, message] of [
    ["missing item", (r) => r.items.pop(), /missing/i],
    ["duplicate item", (r) => r.items.push(structuredClone(r.items[0])), /duplicate/i],
    [
      "unknown item",
      (r) => r.items.push({ ...structuredClone(r.items[0]), itemId: "item-999" }),
      /unknown/i,
    ],
    ["packet binding", (r) => (r.packetSha256 = prepared.packets[1].sha256), /packet/i],
    ["item set", (r) => (r.itemSetHash = "0".repeat(64)), /item set/i],
    ["score range", (r) => (itemReview(r, someItem).scores.voice.score = 6), /score/i],
    ["missing reason", (r) => (itemReview(r, someItem).scores.voice.reason = ""), /reason/i],
    [
      "applicable dimension left null",
      (r) => (itemReview(r, withS1).scores.synthesisCoherence = { score: null, reason: "n/a" }),
      /applicab/i,
    ],
    [
      "inapplicable dimension scored",
      (r) => (itemReview(r, without).scores.synthesisCoherence = { score: 4, reason: "scored" }),
      /applicab/i,
    ],
    ["unblinded", (r) => (r.blindness.sawPriorVerdicts = true), /blind/i],
    [
      "declared unblinded input",
      (r) => (r.blindness.inputs = ["packet", "assignment.json", "source-report.json"]),
      /blind/i,
    ],
    [
      "passage not verbatim",
      (r) =>
        itemReview(r, someItem).findings.push(
          finding(prepared, someItem, { passage: "Not in the text." }),
        ),
      /passage/i,
    ],
    [
      "unsupplied fact",
      (r) =>
        itemReview(r, someItem).findings.push(
          finding(prepared, someItem, { missingFactIds: ["Z9"] }),
        ),
      /fact/i,
    ],
    [
      "severity mismatch",
      (r) =>
        itemReview(r, someItem).findings.push(
          finding(prepared, someItem, { category: "voice", severity: "substantive" }),
        ),
      /severity/i,
    ],
  ]) {
    const broken = review(prepared, "reviewer-a", edit);
    assert.throws(
      () => qualifyReviews({ assignment: prepared.assignment, reviews: [broken, good()] }),
      message,
      name,
    );
  }
  const inconsistent = review(prepared, "reviewer-a");
  itemReview(inconsistent, someItem).findings.push(finding(prepared, someItem));
  assert.throws(
    () => qualifyReviews({ assignment: prepared.assignment, reviews: [inconsistent, good()] }),
    /verdict/i,
  );
  assert.throws(
    () => qualifyReviews({ assignment: prepared.assignment, reviews: [good()] }),
    /reviewer-a/i,
  );
  const twin = review(prepared, "reviewer-b");
  assert.throws(
    () => qualifyReviews({ assignment: prepared.assignment, reviews: [twin, good()] }),
    /duplicate reviewer/i,
  );
});

test("a supported-claim failure fails despite high scores until adjudication resolves it", async () => {
  const prepared = prepareReview({ ...(await inputs()), random: seeded(13) });
  const { assignment } = prepared;
  const target = itemFor(assignment, "after", "synthesis-tension", "candidate");
  const a = review(prepared, "reviewer-a", (r) => {
    for (const dimension of ["specificity", "grounding", "coherence", "voice", "repetition"])
      itemReview(r, target).scores[dimension].score = 5;
    itemReview(r, target).findings.push(finding(prepared, target));
  });
  const b = review(prepared, "reviewer-b");
  const failed = qualifyReviews({ assignment, reviews: [a, b] });
  assert.equal(failed.passed, false);
  assert.equal(failed.result, "AI writing-review failed");
  assert.ok(
    failed.corrected.failures.some(
      (f) => f.itemId === target && /unresolved substantive/i.test(f.reasons.join(" ")),
    ),
  );
  const original = finding(prepared, target);
  const resolution = (verdict) => ({
    reviewerContextId: "reviewer-a",
    findingId: original.findingId,
    itemId: target,
    passage: original.passage,
    factEvidence: [{ factId: "I1", statement: statementOf(prepared, target, "I1") }],
    resolution: verdict,
    explanation: "Compared the exact passage with the supplied statement.",
  });
  const resolved = qualifyReviews({
    assignment,
    reviews: [a, b],
    adjudication: adjudication(prepared, [resolution("supported")]),
  });
  assert.equal(resolved.passed, true);
  assert.equal(resolved.resolvedDisputes.length, 1);
  assert.equal(resolved.resolvedDisputes[0].findingId, original.findingId);
  assert.equal(resolved.resolvedDisputes[0].original.category, "strengthened_modality");
  const upheld = qualifyReviews({
    assignment,
    reviews: [a, b],
    adjudication: adjudication(prepared, [resolution("unsupported")]),
  });
  assert.equal(upheld.passed, false);
});

test("invalid adjudications are rejected", async () => {
  const prepared = prepareReview({ ...(await inputs()), random: seeded(17) });
  const { assignment } = prepared;
  const target = itemFor(assignment, "after", "synthesis-tension", "candidate");
  const a = review(prepared, "reviewer-a", (r) =>
    itemReview(r, target).findings.push(finding(prepared, target)),
  );
  const b = review(prepared, "reviewer-b");
  const original = finding(prepared, target);
  const statement = statementOf(prepared, target, "I1");
  const valid = {
    reviewerContextId: "reviewer-a",
    findingId: original.findingId,
    itemId: target,
    passage: original.passage,
    factEvidence: [{ factId: "I1", statement }],
    resolution: "supported",
    explanation: "Exact comparison.",
  };
  // A whole sentence after the statement's label is acceptable evidence.
  const sentence = statement.slice(statement.indexOf(": ") + 2).split(/(?<=\.) /)[0];
  assert.equal(
    qualifyReviews({
      assignment,
      reviews: [a, b],
      adjudication: adjudication(prepared, [
        { ...valid, factEvidence: [{ factId: "I1", statement: sentence }] },
      ]),
    }).passed,
    true,
  );
  for (const [name, adj, message] of [
    [
      "one-letter evidence",
      adjudication(prepared, [{ ...valid, factEvidence: [{ factId: "I1", statement: "a" }] }]),
      /whole sentence/i,
    ],
    [
      "mid-sentence evidence",
      adjudication(prepared, [
        { ...valid, factEvidence: [{ factId: "I1", statement: sentence.slice(0, 30) }] },
      ]),
      /whole sentence/i,
    ],
    [
      "unblinded adjudicator",
      adjudication(prepared, [valid], {
        blindness: {
          ...adjudication(prepared, []).blindness,
          inputs: ["findings", "items", "assignment.json"],
        },
      }),
      /blind/i,
    ],
    ["unknown finding", adjudication(prepared, [{ ...valid, findingId: "nope" }]), /finding/i],
    [
      "passage changed",
      adjudication(prepared, [{ ...valid, passage: "Different words" }]),
      /passage/i,
    ],
    [
      "paraphrased evidence",
      adjudication(prepared, [
        { ...valid, factEvidence: [{ factId: "I1", statement: "A paraphrase of the fact." }] },
      ]),
      /verbatim/i,
    ],
    ["no evidence", adjudication(prepared, [{ ...valid, factEvidence: [] }]), /evidence/i],
    [
      "reused context",
      adjudication(prepared, [valid], {
        adjudicator: { ...adjudication(prepared, []).adjudicator, contextId: "reviewer-b" },
      }),
      /fresh/i,
    ],
    ["item set", adjudication(prepared, [valid], { itemSetHash: "0".repeat(64) }), /item set/i],
    ["duplicate", adjudication(prepared, [valid, valid]), /duplicate/i],
  ])
    assert.throws(
      () => qualifyReviews({ assignment, reviews: [a, b], adjudication: adj }),
      message,
      name,
    );
  // A finding both reviewers raised is not a disagreement: one adjudicator cannot overturn it.
  const shared = review(prepared, "reviewer-b", (r) =>
    itemReview(r, target).findings.push(finding(prepared, target, { findingId: "b-shared" })),
  );
  assert.throws(
    () =>
      qualifyReviews({
        assignment,
        reviews: [a, shared],
        adjudication: adjudication(prepared, [valid]),
      }),
    /shared/i,
  );
});

test("fewer than two reviewer contexts can neither prepare nor qualify", async () => {
  const data = await inputs();
  assert.throws(
    () => prepareReview({ ...data, random: seeded(31), contexts: ["reviewer-a"] }),
    /two/i,
  );
  assert.throws(() => prepareReview({ ...data, random: seeded(31), contexts: [] }), /two/i);
  const prepared = prepareReview({ ...data, random: seeded(31) });
  const single = structuredClone(prepared.assignment);
  delete single.packets["reviewer-b"];
  assert.throws(
    () => qualifyReviews({ assignment: single, reviews: [review(prepared, "reviewer-a")] }),
    /two/i,
  );
  const summary = qualifyReviews({
    assignment: prepared.assignment,
    reviews: [review(prepared, "reviewer-a"), review(prepared, "reviewer-b")],
  });
  assert.equal(summary.reviewerCount, 2);
});

test("only distinct, matched hosted reports can be prepared for review", async () => {
  const data = await inputs();
  assert.throws(
    () => prepareReview({ ...data, after: data.before, random: seeded(37) }),
    /same report/i,
  );
  for (const [name, change, message] of [
    ["model", (r) => (r.model = "another-model"), /model/i],
    ["case set", (r) => (r.caseSetHash = "0".repeat(64)), /case set/i],
    ["transit copy", (r) => (r.transitCopyHash = "0".repeat(64)), /transit copy/i],
    ["input config", (r) => (r.cases[3].configHash = "0".repeat(64)), /input config/i],
    ["offline replay", (r) => (r.source = "candidate-replay"), /live-synthetic/i],
  ]) {
    const changed = structuredClone(data.after.report);
    change(changed);
    assert.throws(
      () =>
        prepareReview({
          ...data,
          after: { report: changed, sha256: sha256(JSON.stringify(changed)) },
          random: seeded(37),
        }),
      message,
      name,
    );
  }
});

test("adjudication cannot raise a low score; only a fresh blinded reassessment replaces it", async () => {
  const prepared = prepareReview({ ...(await inputs()), random: seeded(19) });
  const { assignment } = prepared;
  const target = itemFor(assignment, "after", "synthesis-reinforcement", "candidate");
  const other = itemFor(assignment, "after", "saturn-square-moon-warm", "candidate");
  // Reviewer A disputes a passage and scores the item low because of it.
  const disputed = finding(prepared, target);
  const a = review(prepared, "reviewer-a", (r) => {
    itemReview(r, target).findings.push(disputed);
    itemReview(r, target).scores.grounding = { score: 3, reason: "The disputed passage." };
  });
  const b = review(prepared, "reviewer-b");
  const supported = adjudication(prepared, [
    {
      reviewerContextId: "reviewer-a",
      findingId: disputed.findingId,
      itemId: target,
      passage: disputed.passage,
      factEvidence: [{ factId: "I1", statement: statementOf(prepared, target, "I1") }],
      resolution: "supported",
      explanation: "The passage repeats the supplied statement.",
    },
  ]);
  const stillLow = qualifyReviews({ assignment, reviews: [a, b], adjudication: supported });
  assert.equal(stillLow.passed, false, "Adjudication never raises a score");
  assert.ok(stillLow.corrected.failures.some((f) => f.itemId === target));
  const fresh = review(prepared, "reviewer-c", () => {}, "reviewer-a");
  assert.throws(() => qualifyReviews({ assignment, reviews: [a, b, fresh] }), /adjudication/i);
  // An adjudication that resolves none of A's findings cannot open a reassessment.
  assert.throws(
    () =>
      qualifyReviews({
        assignment,
        reviews: [a, b, fresh],
        adjudication: adjudication(prepared, []),
      }),
    /supported/i,
  );
  const reassessed = qualifyReviews({
    assignment,
    reviews: [a, b, fresh],
    adjudication: supported,
  });
  assert.equal(reassessed.passed, true);
  assert.deepEqual(
    reassessed.reviewers.map((r) => [r.contextId, r.reassessmentOf, r.superseded]),
    [
      ["reviewer-a", null, true],
      ["reviewer-b", null, false],
      ["reviewer-c", "reviewer-a", false],
    ],
  );
  assert.deepEqual(
    reassessed.supersededAssessments.map((s) => [s.contextId, s.reassessedBy, s.items.length]),
    [["reviewer-a", "reviewer-c", 1]],
  );
  assert.equal(reassessed.supersededAssessments[0].items[0].itemId, target);
  assert.match(reassessed.supersededAssessments[0].items[0].reasons.join(" "), /grounding 3/);
  // The reassessment replaces scores only on the adjudicated item, never a whole review.
  const broad = review(prepared, "reviewer-a", (r) => {
    itemReview(r, target).findings.push(disputed);
    itemReview(r, target).scores.grounding = { score: 3, reason: "The disputed passage." };
    itemReview(r, other).scores.grounding = { score: 2, reason: "Unsupported throughout." };
  });
  const scoped = qualifyReviews({
    assignment,
    reviews: [broad, b, fresh],
    adjudication: supported,
  });
  assert.equal(scoped.passed, false);
  assert.ok(scoped.corrected.failures.some((f) => f.itemId === other));
  // Nor can it launder another substantive finding by the superseded reviewer.
  const flagged = review(prepared, "reviewer-a", (r) => {
    itemReview(r, target).findings.push(disputed);
    itemReview(r, target).scores.grounding = { score: 3, reason: "The disputed passage." };
    itemReview(r, other).findings.push(finding(prepared, other));
  });
  const laundered = qualifyReviews({
    assignment,
    reviews: [flagged, b, fresh],
    adjudication: supported,
  });
  assert.equal(laundered.passed, false);
  const reused = review(prepared, "reviewer-b", () => {}, "reviewer-a");
  assert.throws(
    () => qualifyReviews({ assignment, reviews: [a, b, reused], adjudication: supported }),
    /duplicate reviewer|fresh/i,
  );
});

test("baseline defects stay comparison evidence while the corrected run decides", async () => {
  const prepared = prepareReview({ ...(await inputs()), random: seeded(23) });
  const { assignment } = prepared;
  const baselineOnly = itemFor(assignment, "before", "natal-moon-fallback", "candidate");
  const corrected = itemFor(assignment, "after", "natal-moon-fallback", "candidate");
  assert.notEqual(baselineOnly, corrected);
  const mark = (r) => {
    itemReview(r, baselineOnly).scores.grounding = { score: 2, reason: "Unsupported exclusion." };
    itemReview(r, baselineOnly).findings.push(
      finding(prepared, baselineOnly, { category: "unsupported_exclusion" }),
    );
    itemReview(r, corrected).scores.grounding = { score: 5, reason: "Every claim traced." };
  };
  const summary = qualifyReviews({
    assignment,
    reviews: [review(prepared, "reviewer-a", mark), review(prepared, "reviewer-b", mark)],
  });
  assert.equal(summary.passed, true);
  assert.ok(summary.baseline.failures.some((f) => f.itemId === baselineOnly));
  const delta = summary.scoreDeltas.find(
    (d) =>
      d.caseId === "natal-moon-fallback" &&
      d.reviewer === "reviewer-a" &&
      d.dimension === "grounding",
  );
  assert.deepEqual([delta.before, delta.after, delta.delta], [2, 5, 3]);
});

test("unavailable or partial corrected drafts are uncovered failures, never dropped", async () => {
  const data = await inputs((after) => {
    const timedOut = after.cases.find((c) => c.id === "saturn-square-moon-warm");
    timedOut.diagnostics = { ...timedOut.diagnostics, outcome: "unavailable", code: "timeout" };
    timedOut.candidate = null;
    timedOut.output = { ...timedOut.output, mode: "template", body: timedOut.template.body };
    const sanitized = after.cases.find((c) => c.id === "venus-opposition-venus");
    sanitized.diagnostics = { ...sanitized.diagnostics, outcome: "rejected", code: "id" };
    sanitized.candidate.captureLossless = false;
    sanitized.output = { ...sanitized.output, mode: "template", body: sanitized.template.body };
  });
  const prepared = prepareReview({ ...data, random: seeded(29) });
  const { assignment } = prepared;
  assert.deepEqual(
    assignment.uncovered.map((u) => [u.run, u.caseId, u.reason]),
    [
      ["after", "saturn-square-moon-warm", "unavailable"],
      ["after", "venus-opposition-venus", "sanitized"],
    ],
  );
  assert.ok(itemFor(assignment, "after", "venus-opposition-venus", "candidate"));
  assert.equal(itemFor(assignment, "after", "saturn-square-moon-warm", "candidate"), undefined);
  const summary = qualifyReviews({
    assignment,
    reviews: [review(prepared, "reviewer-a"), review(prepared, "reviewer-b")],
  });
  assert.equal(summary.passed, false);
  assert.deepEqual(
    summary.coverage.uncovered.map((u) => u.caseId),
    ["saturn-square-moon-warm", "venus-opposition-venus"],
  );
  assert.equal(summary.automated.after.outcomes.unavailable, 1);
});

// --- Natal lens catalogue review (Task 9) ---

const CANDIDATE = new URL(
  "../docs/superpowers/releases/2026-10-11-daily-natal-candidate-0.6.1.json",
  import.meta.url,
);
const CATALOGUE_INSTRUCTIONS = new URL(
  "../docs/reviews/daily-natal-lens/catalogue-reviewer-instructions.md",
  import.meta.url,
);
const CATALOGUE_SHA256 = "b073d625c23b5bede66eba25e37bd3f3397263710dd63ab67d8af06b6e216500";
const CHECK_CATEGORY = {
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

async function catalogueInputs() {
  const manifest = JSON.parse(await readFile(CANDIDATE, "utf8"));
  return {
    bundle: manifest.bundle,
    expectedSha256: manifest.checksum,
    instructions: await readFile(CATALOGUE_INSTRUCTIONS, "utf8"),
  };
}

function settleCatalogue(artifact) {
  for (const entry of artifact.entries)
    entry.verdict =
      Object.values(entry.checks).some((value) => value === false) ||
      entry.findings.some((f) => f.severity === "substantive")
        ? "fail"
        : "pass";
  artifact.verdict = artifact.entries.some((e) => e.verdict === "fail") ? "fail" : "pass";
  return artifact;
}

function catalogueReview(data, contextId, edit = () => {}) {
  const { packet, sha256: packetSha256 } = cataloguePacket({ ...data, contextId });
  const artifact = {
    protocolVersion: PROTOCOL_VERSION,
    kind: "catalogue-review",
    packetSha256,
    catalogueSha256: packet.catalogueSha256,
    bundleVersion: packet.bundleVersion,
    reviewer: {
      contextId,
      model: "unknown",
      configuration: "unknown",
      promptSha256: "c".repeat(64),
    },
    reviewedAt: "2026-10-11T20:00:00Z",
    blindness: {
      declaration: "I saw only my catalogue packet.",
      inputs: ["packet"],
      sawPriorVerdicts: false,
      sawOtherReviews: false,
      sawImplementationContext: false,
    },
    entries: packet.entries.map((entry) => ({
      key: entry.key,
      checks: Object.fromEntries(
        Object.keys(CHECK_CATEGORY).map((check) => [
          check,
          check === "compoundEligibility" ? (entry.selectors.length > 1 ? true : null) : true,
        ]),
      ),
      findings: [],
      verdict: "pass",
    })),
    verdict: "pass",
  };
  edit(artifact);
  return settleCatalogue(artifact);
}

const catalogueEntry = (artifact, key) => artifact.entries.find((entry) => entry.key === key);
const defect = (data, key, overrides = {}) => {
  const mechanism = data.bundle.natalLenses.find((entry) => entry.key === key).mechanism;
  return {
    findingId: `d-${key}`,
    passage: mechanism.split(" ").slice(0, 3).join(" "),
    category: "stereotype_certainty",
    severity: "substantive",
    explanation: "Reads as a certain trait.",
    proposedCorrection: "Keep it conditional.",
    ...overrides,
  };
};

test("catalogue packets carry every frozen entry, bound to its hash and a per-context order", async () => {
  const data = await catalogueInputs();
  const a = cataloguePacket({ ...data, contextId: "catalogue-a" });
  const b = cataloguePacket({ ...data, contextId: "catalogue-b" });
  assert.equal(a.packet.catalogueSha256, CATALOGUE_SHA256);
  assert.equal(a.packet.bundleVersion, "builtin-0.6.1");
  assert.equal(a.sha256, sha256(a.json));
  assert.equal(cataloguePacket({ ...data, contextId: "catalogue-a" }).sha256, a.sha256);
  assert.notEqual(a.sha256, b.sha256);
  assert.notDeepEqual(
    a.packet.entries.map((e) => e.key),
    b.packet.entries.map((e) => e.key),
  );
  assert.equal(a.packet.entries.length, 62);
  assert.deepEqual(
    a.packet.entries.map((e) => e.key).sort(),
    data.bundle.natalLenses.map((e) => e.key).sort(),
  );
  for (const entry of a.packet.entries)
    assert.deepEqual(Object.keys(entry).sort(), [
      "anchorNatalPoints",
      "key",
      "mechanism",
      "role",
      "selectors",
    ]);
  // The author's own review rationale never reaches a reviewer.
  assert.ok(!a.json.includes("Stalled task"));
  assert.equal(a.packet.instructions, data.instructions);
  assert.throws(
    () => cataloguePacket({ ...data, expectedSha256: "0".repeat(64), contextId: "catalogue-a" }),
    /catalogue hash/i,
  );
});

test("a complete passing catalogue pair is AI approval only", async () => {
  const data = await catalogueInputs();
  const summary = qualifyCatalogue({
    ...data,
    reviews: [catalogueReview(data, "catalogue-a"), catalogueReview(data, "catalogue-b")],
  });
  assert.equal(summary.passed, true);
  assert.equal(summary.result, "AI catalogue review passed");
  assert.equal(summary.humanReviewCompleted, false);
  assert.equal(summary.humanApproval, "deferred");
  assert.match(summary.authorStructuralReview, /separate/i);
  assert.deepEqual([summary.entries, summary.compoundEntries, summary.reviewerCount], [62, 2, 2]);
  assert.equal(summary.catalogueSha256, CATALOGUE_SHA256);
});

test("catalogue coverage, bindings, checks and verdicts are validated", async () => {
  const data = await catalogueInputs();
  const good = () => catalogueReview(data, "catalogue-b");
  const single = "nl-sun-01";
  const compound = "nl-moon-10-house-01";
  for (const [name, edit, message] of [
    ["missing key", (r) => r.entries.pop(), /missing/i],
    ["duplicate key", (r) => r.entries.push(structuredClone(r.entries[0])), /duplicate/i],
    [
      "unknown key",
      (r) => r.entries.push({ ...structuredClone(r.entries[0]), key: "nl-x" }),
      /unknown/i,
    ],
    ["catalogue hash", (r) => (r.catalogueSha256 = "0".repeat(64)), /catalogue hash/i],
    ["packet", (r) => (r.packetSha256 = good().packetSha256), /packet/i],
    ["unblinded", (r) => (r.blindness.inputs = ["packet", "catalogue-review.md"]), /blind/i],
    [
      "false check without finding",
      (r) => (catalogueEntry(r, single).checks.noDirectives = false),
      /finding/i,
    ],
    [
      "compound check on a single entry",
      (r) => (catalogueEntry(r, single).checks.compoundEligibility = true),
      /compound/i,
    ],
    [
      "compound check missing",
      (r) => (catalogueEntry(r, compound).checks.compoundEligibility = null),
      /compound/i,
    ],
    [
      "passage not verbatim",
      (r) =>
        catalogueEntry(r, single).findings.push(defect(data, single, { passage: "Not there." })),
      /passage/i,
    ],
  ])
    assert.throws(
      () =>
        qualifyCatalogue({
          ...data,
          reviews: [catalogueReview(data, "catalogue-a", edit), good()],
        }),
      message,
      name,
    );
  const inconsistent = catalogueReview(data, "catalogue-a");
  catalogueEntry(inconsistent, single).findings.push(defect(data, single));
  assert.throws(() => qualifyCatalogue({ ...data, reviews: [inconsistent, good()] }), /verdict/i);
  assert.throws(() => qualifyCatalogue({ ...data, reviews: [good()] }), /two/i);
  assert.throws(
    () => qualifyCatalogue({ ...data, reviews: [good(), good()] }),
    /duplicate reviewer/i,
  );
});

test("a catalogue defect fails until a fresh adjudication finds it acceptable; shared defects stand", async () => {
  const data = await catalogueInputs();
  const key = "nl-moon-09";
  const flagged = (contextId) =>
    catalogueReview(data, contextId, (r) => {
      catalogueEntry(r, key).checks.noStereotypeCertainty = false;
      catalogueEntry(r, key).findings.push(defect(data, key, { findingId: `${contextId}-1` }));
    });
  const a = flagged("catalogue-a");
  const b = catalogueReview(data, "catalogue-b");
  const failed = qualifyCatalogue({ ...data, reviews: [a, b] });
  assert.equal(failed.passed, false);
  assert.ok(failed.failures.some((f) => f.key === key));
  const resolution = (resolution) => ({
    reviewerContextId: "catalogue-a",
    findingId: "catalogue-a-1",
    key,
    passage: defect(data, key).passage,
    resolution,
    explanation: "The sentence keeps the possibility conditional.",
  });
  const adjudication = (resolutions, overrides = {}) => ({
    protocolVersion: PROTOCOL_VERSION,
    kind: "catalogue-adjudication",
    catalogueSha256: CATALOGUE_SHA256,
    adjudicator: {
      contextId: "catalogue-adjudicator-1",
      model: "unknown",
      configuration: "unknown",
      promptSha256: "d".repeat(64),
    },
    adjudicatedAt: "2026-10-11T21:00:00Z",
    blindness: {
      declaration: "I saw the disputed findings and their entries only.",
      inputs: ["findings", "entries"],
      sawImplementationContext: false,
    },
    resolutions,
    ...overrides,
  });
  const resolved = qualifyCatalogue({
    ...data,
    reviews: [a, b],
    adjudication: adjudication([resolution("acceptable")]),
  });
  assert.equal(resolved.passed, true);
  assert.equal(resolved.resolvedDisputes[0].original.category, "stereotype_certainty");
  assert.equal(
    qualifyCatalogue({
      ...data,
      reviews: [a, b],
      adjudication: adjudication([resolution("defect")]),
    }).passed,
    false,
  );
  assert.throws(
    () =>
      qualifyCatalogue({
        ...data,
        reviews: [a, b],
        adjudication: adjudication([resolution("acceptable")], {
          adjudicator: { ...adjudication([]).adjudicator, contextId: "catalogue-b" },
        }),
      }),
    /fresh/i,
  );
  assert.throws(
    () =>
      qualifyCatalogue({
        ...data,
        reviews: [a, flagged("catalogue-b")],
        adjudication: adjudication([resolution("acceptable")]),
      }),
    /shared/i,
  );
});
