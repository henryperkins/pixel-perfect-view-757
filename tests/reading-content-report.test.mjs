import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  compareContentReports,
  extractContentResponses,
  freezeContentReviewRubric,
} from "../scripts/reading-content-comparison.mjs";
import {
  compareReports,
  replayContentReport,
  unpackContentEvidence,
  main as evaluateMain,
} from "../scripts/evaluate-readings.mjs";
import {
  prepareReview,
  prepareReflectionReview,
  qualifyReflectionReviews,
} from "../scripts/reading-writing-review.mjs";

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
let h, plan, repairPlan, armPlan;
before(async () => {
  h = await createRecordsHarness();
  const { createContentComparisonPlan, contentComparisonArmPlan } = await h.vite.ssrLoadModule(
    "/src/lib/ai/content-comparison-plan.server.ts",
  );
  armPlan = contentComparisonArmPlan;
  const { TRANSIT_CANDIDATE_BUNDLE } = await h.vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  );
  const { contentChecksum, compareContentBundles } = await h.vite.ssrLoadModule(
    "/src/lib/content/draft-comparison.ts",
  );
  const baseline = structuredClone(TRANSIT_CANDIDATE_BUNDLE);
  const delta = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/content-draft-effectiveness/2026-10-13/revised-fallback-entries.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const candidate = {
    ...structuredClone(baseline),
    version: "test-candidate",
    cycles: [
      ...baseline.cycles.filter(
        (entry) => !delta.entries.some((change) => change.key === entry.key),
      ),
      ...delta.entries.map((entry) => ({ ...entry, themes: [] })),
    ],
  };
  const identity = async (bundle) => ({
    version: bundle.version,
    canonicalHash: await contentChecksum(bundle),
    checksumAlgorithm: "sha256-canonical-json-v1",
    bundleHash: hash(bundle),
    bundleHashAlgorithm: "sha256-json-stringify-v1",
    storedChecksum: null,
    storedChecksumAlgorithm: null,
  });
  const changes = compareContentBundles(baseline, candidate).entries.filter(
    (entry) => entry.change !== "unchanged",
  );
  plan = createContentComparisonPlan(
    {
      source: { kind: "draft", draftId: "report-test-draft" },
      baseline,
      candidate,
      identities: { baseline: await identity(baseline), candidate: await identity(candidate) },
      changedKeys: changes.filter((entry) => entry.section === "cycles").map((entry) => entry.key),
      changes,
      guards: [],
    },
    "a".repeat(40),
    "gemini-enterprise",
  );
  repairPlan = createContentComparisonPlan(
    {
      source: plan.source,
      ...plan.bundles,
      identities: plan.identities,
      changedKeys: plan.changedKeys,
      changes: plan.changes,
      guards: [],
    },
    "a".repeat(40),
    "gemini-enterprise",
    "draft-pilot-2",
  );
});
after(async () => h?.close());

test("the pilot rubric freezes source and final question checks before outputs exist", () => {
  const rubric = freezeContentReviewRubric(plan);
  assert.equal(rubric.pairHash, plan.hash);
  assert.equal(rubric.cases.length, 4);
  assert.equal(rubric.qualified, false);
  assert.equal(rubric.minimumScore, 4);
  assert.deepEqual(rubric.additionalCandidateGates, ["voice", "repetition"]);
  assert.ok(Object.hasOwn(rubric.dimensions, "coherence"));
  for (const row of rubric.cases)
    for (const arm of ["baseline", "candidate"]) {
      assert.equal(row[arm].semanticIncorporation, "unreviewed");
      assert.equal(row[arm].finalQuestionReview, "unreviewed");
      assert.ok(Object.values(row[arm].scores).every((score) => score === null));
      assert.equal(typeof row[arm].sourceQuestion, "string");
      assert.equal(typeof row[arm].finalQuestion, "string");
    }
});

function report(arm, planOverride = plan) {
  const plan = planOverride;
  const dry = armPlan(plan, arm);
  return {
    ...dry.metadata,
    reportVersion: 1,
    runPlanHash: dry.hash,
    contentComparison: {
      version: plan.version,
      arm,
      pairHash: plan.hash,
      baselineCanonicalHash: plan.identities.baseline.canonicalHash,
      candidateCanonicalHash: plan.identities.candidate.canonicalHash,
      caseSetId: plan.caseSetId,
    },
    source: "live-synthetic",
    bundleSource: "content-comparison",
    partial: false,
    expectedCases: 4,
    cases: dry.cases.map((row, index) => {
      const body = plan.bundles[arm].cycles.find(
        (entry) => entry.key === row.interpretationPlan.interpretations[0].interpretationKey,
      ).mechanism;
      const paragraphs = [{ text: body, facts: ["C1", "I1"] }];
      return {
        ...structuredClone(row),
        config: structuredClone(plan.caseManifest.cases[index].config),
        request: {
          model: plan.model,
          messages: [
            {
              role: "user",
              content: row.facts.map((fact) => `${fact.id}: ${fact.statement}`).join("\n"),
            },
          ],
        },
        transport: {
          provider: plan.provider,
          requestedModel: plan.model,
          actualModel: "gemini-3.8-flash",
          deadlineMs: dry.metadata.gatewayTimeoutMs,
        },
        candidate: { paragraphs, paragraphCount: 1, truncated: false, captureLossless: true },
        diagnostics: {
          attempted: true,
          outcome: "accepted",
          code: "accepted",
          promptVersion: dry.metadata.promptVersion,
          validatorVersion: dry.metadata.validatorVersion,
        },
        output: {
          mode: "model",
          body,
          prompt: row.template.prompt,
          citations: [{ paragraph: 1, facts: ["C1", "I1"] }],
        },
      };
    }),
  };
}

test("repair comparison and rubric retain v2 identities and reject mixed historical reports", () => {
  const baseline = report("baseline", repairPlan),
    candidate = report("candidate", repairPlan);
  const result = compareContentReports(baseline, candidate, { plan: repairPlan });
  assert.equal(result.pairHash, repairPlan.hash);
  assert.equal(freezeContentReviewRubric(repairPlan).pairHash, repairPlan.hash);
  assert.throws(
    () => compareContentReports(report("baseline"), candidate, { plan: repairPlan }),
    /plan|pair|match/i,
  );
  assert.throws(() => compareContentReports(baseline, candidate, { plan }), /plan|pair|match/i);
});

test("repair review freezes a single final question gate under a new companion version", () => {
  const before = report("baseline", repairPlan),
    after = report("candidate", repairPlan);
  const rubric = freezeContentReviewRubric(repairPlan);
  assert.equal(rubric.reflectionProtocolVersion, "content-reflection-review-2");
  assert.ok(rubric.reflectionChecks.final.includes("singleQuestion"));
  const { assignment, packets } = prepareReview({
    before: { report: before, sha256: hash(before) },
    after: { report: after, sha256: hash(after) },
    contentPlan: repairPlan,
    instructions: "Review every supplied body and question.",
  });
  for (const packet of packets) assert.match(packet.packet.instructions, /single final question/i);
  const reviews = Object.keys(assignment.packets).map((contextId) =>
    prepareReflectionReview({ assignment, contextId }),
  );
  for (const review of reviews) {
    assert.equal(review.protocolVersion, "content-reflection-review-2");
    for (const item of review.items) {
      assert.equal(item.finalPrompt.checks.singleQuestion, null);
      for (const part of [item.sourceQuestion, item.finalPrompt]) {
        part.checks = Object.fromEntries(Object.keys(part.checks).map((key) => [key, true]));
        part.rationale = {
          quote: part.text,
          explanation: "The question permits a conditional answer.",
        };
        part.verdict = "pass";
      }
    }
    review.verdict = "pass";
  }
  assert.equal(qualifyReflectionReviews({ assignment, reviews }).passed, true);
  reviews[0].items[0].finalPrompt.questionCount = 2;
  assert.throws(() => qualifyReflectionReviews({ assignment, reviews }), /question count/i);
});

test("explicit frozen content comparison reports four exercised sources and leaves semantic quality unreviewed", () => {
  const result = compareContentReports(report("baseline"), report("candidate"), { plan });
  assert.equal(result.mode, "content-comparison");
  assert.equal(result.pairHash, plan.hash);
  assert.equal(result.cases.length, 4);
  assert.equal(result.coverage.entries.length, 22);
  assert.equal(result.coverage.entries.filter((entry) => entry.candidate.selected > 0).length, 4);
  assert.equal(
    result.coverage.entries.filter(
      (entry) => entry.reachability === "shadowed-in-supported-catalogue",
    ).length,
    2,
  );
  assert.equal(
    result.coverage.entries.filter(
      (entry) =>
        entry.candidate.selected === 0 && entry.reachability !== "shadowed-in-supported-catalogue",
    ).length,
    16,
  );
  for (const entry of result.coverage.entries)
    assert.equal(entry.semanticIncorporation, "unreviewed");
  for (const entry of result.coverage.entries.filter((item) => item.candidate.selected)) {
    assert.equal(entry.candidate.submitted, 1);
    assert.equal(entry.candidate.acceptedCited, 1);
    assert.equal(entry.candidate.templateRendered, 1);
    assert.equal(entry.candidate.finalRendered, 1);
  }
  assert.equal(result.qualified, false);
  assert.match(result.limitations.join(" "), /four|4/);
  assert.throws(() => compareReports(report("baseline"), report("candidate")), /fixture|content/i);
});

test("provider, model, source SHA, pair, ordered cases, facts, and policy cannot drift across reports", () => {
  for (const change of [
    (r) => (r.sourceSha = "b".repeat(40)),
    (r) => (r.model = "other-model"),
    (r) => (r.caseSetHash = "b".repeat(64)),
    (r) => (r.contentComparison.pairHash = "b".repeat(64)),
    (r) => (r.transitCopyHash = "b".repeat(64)),
    (r) => (r.promptVersion = "other-prompt"),
    (r) => r.cases.reverse(),
    (r) => (r.cases[0].transport.provider = "lovable"),
    (r) => (r.cases[0].transport.actualModel = "gemini-changed"),
    (r) => (r.cases[0].facts[0].statement += " Modified."),
    (r) => (r.cases[0].configHash = "b".repeat(64)),
    (r) => r.cases.push(r.cases[0]),
    (r) => (r.partial = true),
  ]) {
    const changed = report("candidate");
    change(changed);
    assert.throws(() => compareContentReports(report("baseline"), changed, { plan }));
  }
  const incomplete = structuredClone(plan);
  delete incomplete.bundles.baseline.phases;
  assert.throws(() =>
    compareContentReports(report("baseline"), report("candidate"), { plan: incomplete }),
  );
});

test("selection, request inclusion, accepted citation, and literal rendering remain separate observations", () => {
  const after = report("candidate");
  const row = after.cases[0];
  const key = row.interpretationPlan.interpretations[0].interpretationKey;
  row.request.messages = [{ role: "user", content: "No interpretation fact here." }];
  row.output.body = "Different generated wording cannot prove literal incorporation.";
  row.output.citations = [];
  const entry = compareContentReports(report("baseline"), after, { plan }).coverage.entries.find(
    (item) => item.key === key,
  );
  assert.equal(entry.candidate.selected, 1);
  assert.equal(entry.candidate.submitted, 0);
  assert.equal(entry.candidate.acceptedCited, 0);
  assert.equal(entry.candidate.templateRendered, 1);
  assert.equal(entry.candidate.finalRendered, 0);
  assert.equal(entry.semanticIncorporation, "unreviewed");
});

test("raw response extraction is arm-bound and rejects missing or uncertain captures", () => {
  const after = report("candidate");
  const responses = extractContentResponses(after, { plan, arm: "candidate" });
  assert.equal(Object.keys(responses).length, 4);
  assert.throws(() => extractContentResponses(after, { plan, arm: "baseline" }));
  for (const change of [
    (r) => (r.cases[0].candidate.captureLossless = false),
    (r) => (r.cases[0].candidate.truncated = true),
    (r) => (r.cases[0].candidate = null),
  ]) {
    const changed = structuredClone(after);
    change(changed);
    assert.throws(
      () => extractContentResponses(changed, { plan, arm: "candidate" }),
      /capture|draft/,
    );
  }
});

test("review permits content differences only with the exact pair and exposes source and final questions", () => {
  const before = report("baseline"),
    after = report("candidate");
  const input = {
    before: { report: before, sha256: hash(before) },
    after: { report: after, sha256: hash(after) },
    instructions: "Review the sources and questions independently.",
    random: () => 0.25,
  };
  assert.throws(() => prepareReview(input), /transit copy/);
  const reviewed = prepareReview({ ...input, contentPlan: plan });
  assert.equal(reviewed.assignment.contentComparison.pairHash, plan.hash);
  assert.equal(reviewed.assignment.contentComparison.qualified, false);
  for (const packet of reviewed.packets)
    for (const item of packet.packet.items) {
      assert.equal(typeof item.reflectionQuestion, "string");
      assert.equal(typeof item.sourceQuestion, "string");
      assert.equal(item.questionReview, "unreviewed");
    }
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});

test("reflection companions bind neutral items, pair, packets, quoted rationale and separate final question counts", () => {
  const before = report("baseline"),
    after = report("candidate");
  const { assignment } = prepareReview({
    before: { report: before, sha256: hash(before) },
    after: { report: after, sha256: hash(after) },
    instructions: "Use the supplied rubric.",
    contentPlan: plan,
    random: () => 0.25,
  });
  const reviews = Object.keys(assignment.packets).map((contextId) =>
    prepareReflectionReview({ assignment, contextId }),
  );
  assert.throws(() => qualifyReflectionReviews({ assignment, reviews }), /completed boolean/);
  for (const review of reviews) {
    for (const item of review.items) {
      assert.equal(item.finalPrompt.questionCount, 1);
      for (const section of [item.sourceQuestion, item.finalPrompt]) {
        section.checks = Object.fromEntries(Object.keys(section.checks).map((key) => [key, true]));
        section.rationale = {
          quote: section.text,
          explanation: "Synthetic bookkeeping example; not an editorial judgment.",
        };
        section.verdict = "pass";
      }
    }
    review.verdict = "pass";
  }
  const summary = qualifyReflectionReviews({ assignment, reviews });
  assert.equal(summary.passed, true);
  assert.equal(summary.wholeDraftQualified, false);
  for (const change of [
    (r) => (r[0].packetSha256 = "b".repeat(64)),
    (r) => (r[0].items[0].finalPrompt.questionCount = 2),
    (r) => (r[0].items[0].sourceQuestion.rationale.quote = "Not a supplied quote"),
    (r) => r[0].items.pop(),
  ]) {
    const changed = structuredClone(reviews);
    change(changed);
    assert.throws(() => qualifyReflectionReviews({ assignment, reviews: changed }));
  }
});

test("archived pilot reflection packets retain their original two-question composition", async () => {
  const directory = new URL(
    "../docs/reviews/content-draft-effectiveness/2026-10-13/pilot/",
    import.meta.url,
  );
  const archivedPlan = JSON.parse(await readFile(new URL("frozen-pair.json", directory), "utf8"));
  const before = JSON.parse(await readFile(new URL("baseline-report.json", directory), "utf8"));
  const after = JSON.parse(await readFile(new URL("candidate-report.json", directory), "utf8"));
  const { assignment } = prepareReview({
    before: { report: before, sha256: hash(before) },
    after: { report: after, sha256: hash(after) },
    instructions: "Use the historical rubric.",
    contentPlan: archivedPlan,
    random: () => 0.25,
  });
  for (const contextId of Object.keys(assignment.packets)) {
    const review = prepareReflectionReview({ assignment, contextId });
    for (const item of review.items) assert.equal(item.finalPrompt.questionCount, 2);
  }
});

function captureEnvelope() {
  const captured = (arm) => {
    const { cases, partial: _partial, expectedCases: _expectedCases, ...metadata } = report(arm);
    const results = cases.map((row) => ({ metadata, case: row }));
    return {
      run: {
        id: arm,
        status: "complete",
        total: 4,
        completed: 4,
        provider: plan.provider,
        campaignId: "baseline",
        contentComparison: { arm, pairHash: plan.hash, caseSetId: plan.caseSetId },
      },
      results,
      ledger: {
        version: "evaluation-ledger-1",
        costStatus: "reservation-estimates-not-invoices",
        sourcePlan: armPlan(plan, arm),
        dollarCeilingMicros: 5_000_000,
        reviewReserveMicros: 0,
        campaignAttempts: arm === "baseline" ? 4 : 8,
        campaignReservedMicros: 2_000_000,
        entries: results.map((result, index) => ({
          position: index,
          caseId: result.case.id,
          attempted: true,
          reservedMicros: 100_000,
          capture: "stored",
          raw: result,
        })),
      },
    };
  };
  return {
    version: "content-pilot-evidence-1",
    baseline: captured("baseline"),
    candidate: captured("candidate"),
  };
}

test("UI evidence unpacking preserves ledgers and refuses partial or uncertain arms", async () => {
  const envelope = captureEnvelope();
  const unpacked = await unpackContentEvidence(envelope);
  assert.equal(unpacked.plan.hash, plan.hash);
  assert.equal(unpacked.reports.baseline.partial, false);
  assert.equal(unpacked.reports.candidate.cases.length, 4);
  assert.deepEqual(unpacked.ledgers.candidate, envelope.candidate.ledger);
  assert.deepEqual(unpacked.rawEnvelope, envelope);
  for (const change of [
    (e) => delete e.candidate,
    (e) => (e.candidate.run.status = "stopped"),
    (e) => (e.candidate.ledger.entries[0].capture = "uncertain"),
    (e) => e.candidate.results.pop(),
    (e) => (e.candidate.run.campaignId = "foreign"),
    (e) => (e.candidate.ledger.dollarCeilingMicros = 10_000_000),
  ]) {
    const changed = structuredClone(envelope);
    change(changed);
    await assert.rejects(() => unpackContentEvidence(changed));
  }
});

test("content CLI freezes, unpacks and compares local artifacts without overwriting evidence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pattern-content-cli-"));
  const file = (name) => join(directory, name);
  try {
    await writeFile(file("plan.json"), JSON.stringify(plan));
    await writeFile(file("envelope.json"), JSON.stringify(captureEnvelope()));
    await evaluateMain([
      "--freeze-content-rubric",
      file("plan.json"),
      "--output",
      file("rubric.json"),
    ]);
    assert.equal(JSON.parse(await readFile(file("rubric.json"), "utf8")).minimumScore, 4);
    await assert.rejects(
      () =>
        evaluateMain([
          "--freeze-content-rubric",
          file("plan.json"),
          "--output",
          file("rubric.json"),
        ]),
      /EEXIST/,
    );
    const output = file("unpacked");
    await evaluateMain([
      "--unpack-content-evidence",
      file("envelope.json"),
      "--output-dir",
      output,
    ]);
    await evaluateMain([
      "--compare-content",
      join(output, "baseline-report.json"),
      join(output, "candidate-report.json"),
      "--content-plan",
      join(output, "frozen-pair.json"),
      "--output",
      file("comparison.json"),
    ]);
    assert.equal(JSON.parse(await readFile(file("comparison.json"), "utf8")).pairHash, plan.hash);
    await evaluateMain([
      "--extract-content-responses",
      join(output, "candidate-report.json"),
      "--content-plan",
      file("plan.json"),
      "--arm",
      "candidate",
      "--output",
      file("responses.json"),
    ]);
    assert.equal(Object.keys(JSON.parse(await readFile(file("responses.json"), "utf8"))).length, 4);
    await assert.rejects(
      () =>
        evaluateMain(["--unpack-content-evidence", file("envelope.json"), "--output-dir", output]),
      /EEXIST/,
    );
    await assert.rejects(
      () => evaluateMain(["--compare-content", "before.json", "after.json"]),
      /content-plan/,
    );
    await assert.rejects(
      () =>
        evaluateMain([
          "--replay-content",
          join(output, "candidate-report.json"),
          "--content-plan",
          file("plan.json"),
          "--arm",
          "candidate",
          "--source-sha",
          plan.sourceSha,
          "--output",
          file("replay.json"),
        ]),
      /Unknown argument/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("current-code content replay consumes exactly four in-memory Enterprise captures and rejects source drift", async () => {
  const { runSyntheticEvaluationCase } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  );
  const source = report("candidate");
  let index = 0;
  process.env.GEMINI_ENTERPRISE_API_KEY = "synthetic-fixture-key";
  h.setGeminiEnterprise(() =>
    Response.json({
      candidates: [
        {
          content: {
            parts: [
              { text: JSON.stringify({ paragraphs: source.cases[index++].candidate.paragraphs }) },
            ],
          },
          finishReason: "STOP",
        },
      ],
      modelVersion: "gemini-3.8-flash",
    }),
  );
  const actual = [];
  for (const fixed of plan.caseManifest.cases)
    actual.push(
      (
        await runSyntheticEvaluationCase(
          fixed.id,
          plan.bundles.candidate,
          plan.provider,
          undefined,
          { boundedQualification: true },
          plan.caseSetId,
        )
      ).case,
    );
  source.cases = actual;
  const beforeCount = h.geminiEnterpriseRequests.length;
  const runtimeIdentity = { sourceSha: plan.sourceSha, sourceClean: true, kind: "test-fixture" };
  const replay = await replayContentReport(source, { plan, arm: "candidate", runtimeIdentity });
  assert.equal(replay.source, "source-report-replay");
  assert.equal(replay.summary.gatewayReplays, 4);
  assert.equal(replay.summary.modelAttempts, 0);
  assert.equal(replay.sourceComparison.matchingOutcomes, 4);
  assert.equal(h.geminiEnterpriseRequests.length, beforeCount);
  assert.equal(replay.qualified, false);
  for (const runtime of [
    { ...runtimeIdentity, sourceClean: false },
    { ...runtimeIdentity, sourceSha: "b".repeat(40) },
  ])
    await assert.rejects(
      () => replayContentReport(source, { plan, arm: "candidate", runtimeIdentity: runtime }),
      /clean runtime source/,
    );
  const changedRequest = structuredClone(source);
  changedRequest.cases[0].request.messages[0].content += " Changed prompt.";
  await assert.rejects(
    () => replayContentReport(changedRequest, { plan, arm: "candidate", runtimeIdentity }),
    /request changed/,
  );
});
