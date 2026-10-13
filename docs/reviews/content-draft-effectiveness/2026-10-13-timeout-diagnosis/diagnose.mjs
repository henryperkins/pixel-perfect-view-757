// Offline diagnosis only. The records harness blocks external fetches and supplies fake keys.
// Run from any directory: node /path/to/this/diagnose.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRecordsHarness } from "../../../../tests/helpers/records-harness.mjs";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const base = new URL("../", import.meta.url);
const sourceSha = "9348a243e35b6af2ba1925a3265d0211f9a7bed4";
const legacySha = "82efe38df4c5ee571d6c583de144498c93f596f1";
const evidenceCommitSha = "3e89b3866db738c0e81372e512b606d32d079d40";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const encoded = (value) => JSON.stringify(value);
const sourceFiles = [
  "src/lib/ai/language.server.ts",
  "src/lib/ai/admin-transport.ts",
  "src/lib/ai/diagnostics.ts",
  "src/lib/ai/qualification-plan.server.ts",
  "src/lib/evaluation-runs.server.ts",
  "edge/pattern-workflows/worker.mjs",
  "tests/helpers/records-harness.mjs",
  "package.json",
  "bun.lock",
];
// Do not accidentally diagnose a different implementation under this source identity.
execFileSync(
  "git",
  [
    "diff",
    "--exit-code",
    sourceSha,
    "--",
    "src",
    "edge",
    "d1",
    "package.json",
    "bun.lock",
    "tests/helpers",
  ],
  { cwd: root },
);
const sourceFilesSha256 = {};
for (const path of sourceFiles) {
  const archived = execFileSync("git", ["show", `${sourceSha}:${path}`], { cwd: root });
  const current = await readFile(new URL(`../../../../${path}`, import.meta.url));
  assert.equal(digest(current), digest(archived), path);
  sourceFilesSha256[path] = digest(current);
}
const evidenceFilesSha256 = {};
async function load(path) {
  const raw = await readFile(new URL(path, base));
  const archived = execFileSync(
    "git",
    ["show", `${evidenceCommitSha}:docs/reviews/content-draft-effectiveness/${path}`],
    { cwd: root },
  );
  assert.equal(digest(raw), digest(archived), path);
  evidenceFilesSha256[path] = digest(raw);
  return JSON.parse(raw);
}
const legacy = await load("2026-10-13/pilot/raw-envelope.json");
const repair = await load("2026-10-13-repair-pilot/pilot/raw-envelope.json");
const pair = await load("2026-10-13-repair-pilot/frozen-pair.json");
const result = await load("2026-10-13-repair-pilot/pilot/result.json");
assert.equal(pair.sourceSha, sourceSha);
assert.equal(pair.hash, "804ad82b566574901b55c1fcdf2cefc76ceb4e6ed63c476dd3d525868c3b443c");
assert.equal(repair.baseline.run.status, "halted");
assert.equal(repair.baseline.results.length, 4);
assert.equal(repair.candidate, undefined);
assert.equal(legacy.baseline.results.length, 4);
assert.equal(legacy.candidate.results.length, 4);
assert.equal(result.sourceSha, sourceSha);
assert.equal(result.pairHash, pair.hash);
assert.equal(result.baselineRunId, repair.baseline.run.id);
assert.equal(result.generationAttempts, 4);
assert.equal(result.candidateAttempts, 0);
assert.equal(result.retries, 0);
assert.equal(result.conservativeAccountedMicros, 3100932);

// The stored request uses the common adapter shape. This reconstructs the native
// body from the pinned adapter; below, intercepted real adapter calls verify it.
function nativeBody(request, transport) {
  assert.equal(request.model, "gemini-enterprise/gemini-3.8-flash");
  assert.equal(request.max_tokens, 65536);
  assert.equal(transport.maxOutputTokens, 65536);
  return {
    systemInstruction: { parts: [{ text: request.messages[0].content }] },
    contents: [{ role: "user", parts: [{ text: request.messages[1].content }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: request.response_format.json_schema.schema,
      ...(transport.thinkingLevel
        ? { thinkingConfig: { thinkingLevel: transport.thinkingLevel } }
        : {}),
      maxOutputTokens: 65536,
    },
  };
}
const rows = [];
for (const [campaign, envelope, sha] of [
  ["original", legacy, legacySha],
  ["repair", repair, sourceSha],
]) {
  for (const arm of ["baseline", "candidate"]) {
    for (const record of envelope[arm]?.results ?? []) {
      assert.equal(record.metadata.sourceSha, sha);
      const { transport: t, request: q, diagnostics: d } = record.case;
      assert.equal(t.deadlineMs, 60000);
      assert.equal(t.thinkingLevel, null);
      const native = nativeBody(q, t);
      rows.push({
        campaign,
        arm,
        caseId: record.case.id,
        sourceSha: sha,
        promptVersion: record.metadata.promptVersion,
        elapsedMs: Date.parse(t.finishedAt) - Date.parse(t.startedAt),
        untilHeadersMs: t.headersAt ? Date.parse(t.headersAt) - Date.parse(t.startedAt) : null,
        bodyAfterHeadersMs:
          t.bodyAt && t.headersAt ? Date.parse(t.bodyAt) - Date.parse(t.headersAt) : null,
        outcome: d.outcome,
        code: d.code,
        httpStatus: t.httpStatus,
        aborted: t.abortAt !== null,
        actualModel: t.actualModel,
        usage: t.usage,
        storedRequestBytes: Buffer.byteLength(encoded(q)),
        reconstructedNativeBytes: Buffer.byteLength(encoded(native)),
        reconstructedNativeSha256: digest(encoded(native)),
        schemaSha256: digest(encoded(q.response_format.json_schema.schema)),
      });
    }
  }
}
assert.equal(new Set(rows.map((r) => r.schemaSha256)).size, 1);
assert.equal(rows.filter((r) => r.outcome === "accepted").length, 11);
const unavailable = rows.filter((r) => r.outcome !== "accepted");
assert.equal(unavailable.length, 1);
assert.equal(unavailable[0].caseId, "fallback-soft-neptune-mercury");
assert.equal(unavailable[0].elapsedMs, 60000);
assert.equal(unavailable[0].untilHeadersMs, null);
assert.equal(unavailable[0].code, "timeout");
assert.equal(unavailable[0].aborted, true);
assert.equal(unavailable[0].httpStatus, null);
const legacyBase = legacy.baseline.results.map((r) => r.case);
const repairBase = repair.baseline.results.map((r) => r.case);
const instructionPrefixes = [
  "Citations belong in the facts arrays, not in explanatory prose.",
  "Keep every frequency or tendency claim attached to the subject named by its source.",
  "An approaching phase means approaching the exact aspect, not approaching the natal point.",
];
const comparisons = repairBase.map((now) => {
  const before = legacyBase.find((c) => c.id === now.id);
  const beforeUser = before.request.messages[1].content;
  const nowUser = now.request.messages[1].content;
  const added = nowUser
    .split("\n")
    .filter((line) => instructionPrefixes.some((p) => line.startsWith(p)));
  assert.equal(added.length, 3);
  const removed = nowUser
    .split("\n")
    .filter((line) => !added.includes(line))
    .join("\n");
  const changedFactIds = now.facts
    .filter((f) => encoded(f) !== encoded(before.facts.find((b) => b.id === f.id)))
    .map((f) => f.id);
  assert.deepEqual(changedFactIds, now.id.includes("saturn") ? ["T1"] : []);
  if (!changedFactIds.length) assert.equal(removed, beforeUser);
  assert.deepEqual(now.config, before.config);
  assert.equal(now.request.messages[0].content, before.request.messages[0].content);
  assert.deepEqual(now.request.response_format, before.request.response_format);
  return {
    caseId: now.id,
    sameConfig: true,
    sameSystem: true,
    sameSchema: true,
    changedFactIds,
    addedWritingInstructions: 3,
    otherUserLinesEqual: removed === beforeUser,
  };
});

let h;
const wireChecks = [];
const controlChecks = [];
const probes = [];
const originalTimeout = AbortSignal.timeout;
const untilAbort = (signal) => {
  // AbortSignal.timeout uses an unref timer in Node. Keep this offline probe alive.
  const keepAlive = setInterval(() => {}, 10);
  return new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }).finally(() => clearInterval(keepAlive));
};
try {
  h = await createRecordsHarness();
  const { runSyntheticEvaluationCase: run } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  );
  const { qualificationReservationMicros: reserve } = await h.vite.ssrLoadModule(
    "/src/lib/ai/admin-transport.ts",
  );
  // Mock response text is an archived fixture, never a replacement pilot result.
  const responseFixture = (caseId) => {
    const c = repairBase.find((r) => r.id === caseId);
    const captured = c.candidate ?? legacyBase.find((r) => r.id === caseId).candidate;
    return Response.json({
      modelVersion: "gemini-3.8-flash",
      responseId: "offline-fixture",
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: encoded({ paragraphs: captured.paragraphs }) }] },
        },
      ],
      usageMetadata: {
        promptTokenCount: 2000,
        candidatesTokenCount: 200,
        thoughtsTokenCount: 3000,
        totalTokenCount: 5200,
      },
    });
  };
  const observedRun = (caseId, control = {}) =>
    run(
      caseId,
      pair.bundles.baseline,
      "gemini-enterprise",
      undefined,
      { boundedQualification: true, ...control },
      "draft-pilot-2",
    );
  for (const captured of repairBase) {
    h.setGeminiEnterprise(() => responseFixture(captured.id));
    const observed = await observedRun(captured.id);
    assert.deepEqual(observed.case.request, captured.request);
    assert.deepEqual(
      h.geminiEnterpriseRequests.at(-1),
      nativeBody(captured.request, captured.transport),
    );
    wireChecks.push({
      caseId: captured.id,
      storedRequestMatchesPreparedSource: true,
      interceptedNativeMatchesReconstruction: true,
    });
  }
  const neptune = repairBase.find((c) => c.id === "fallback-soft-neptune-mercury");
  for (const thinking of ["LOW", "MEDIUM"]) {
    h.setGeminiEnterprise(() => responseFixture(neptune.id));
    const observed = await observedRun(neptune.id, { enterpriseThinking: thinking });
    const native = structuredClone(h.geminiEnterpriseRequests.at(-1));
    assert.deepEqual(native.generationConfig.thinkingConfig, { thinkingLevel: thinking });
    delete native.generationConfig.thinkingConfig;
    assert.deepEqual(native, nativeBody(neptune.request, neptune.transport));
    assert.equal(observed.case.transport.deadlineMs, 60000);
    controlChecks.push({
      thinkingLevel: thinking,
      onlyNativeChange: "generationConfig.thinkingConfig",
      deadlineMs: 60000,
      maxOutputTokens: 65536,
    });
  }
  for (const scenario of [
    "immediate_valid",
    "waiting_for_headers",
    "waiting_for_body",
    "http_504",
    "network_error",
    "malformed_json",
  ]) {
    const deadlines = [];
    AbortSignal.timeout = (ms) => {
      deadlines.push(ms);
      return originalTimeout(25);
    };
    h.setGeminiEnterprise((_body, init) => {
      if (scenario === "waiting_for_headers") return untilAbort(init.signal);
      if (scenario === "network_error") throw new TypeError("offline network fixture");
      if (scenario === "waiting_for_body")
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          text: () => untilAbort(init.signal),
        };
      if (scenario === "http_504")
        return Response.json({ error: { status: "DEADLINE_EXCEEDED" } }, { status: 504 });
      if (scenario === "malformed_json") return new Response("not JSON", { status: 200 });
      return responseFixture(repairBase[0].id);
    });
    const requestCount = h.geminiEnterpriseRequests.length;
    const observed = await observedRun(repairBase[0].id);
    const t = observed.case.transport,
      d = observed.case.diagnostics;
    assert.deepEqual(deadlines, [60000]);
    assert.equal(h.geminiEnterpriseRequests.length - requestCount, 1);
    assert.equal(h.gatewayRequests.length, 0);
    assert.equal(t.deadlineMs, 60000);
    assert.ok(t.finishedAt);
    if (scenario === "immediate_valid") {
      assert.equal(d.outcome, "accepted");
      assert.equal(t.abortAt, null);
      assert.equal(t.httpStatus, 200);
    } else {
      const code =
        scenario === "network_error"
          ? "network"
          : scenario === "malformed_json"
            ? "bad_json"
            : "timeout";
      assert.equal(d.code, code);
      assert.equal(d.outcome, "unavailable");
      assert.equal(observed.case.output.body, observed.case.template.body);
      assert.equal(observed.case.candidate, null);
      if (scenario.startsWith("waiting_")) {
        assert.ok(t.abortAt);
        assert.equal(t.bodyAt, null);
        assert.equal(t.httpStatus, scenario === "waiting_for_body" ? 200 : null);
      } else assert.equal(t.abortAt, null);
      assert.equal(reserve(t, true), 2800000);
    }
    probes.push({
      scenario,
      requestedDeadlineMs: 60000,
      simulatedDeadlineMs: 25,
      fetches: 1,
      failoverFetches: 0,
      outcome: d.outcome,
      code: d.code,
      headersObserved: t.headersAt !== null,
      bodyObserved: t.bodyAt !== null,
      signalAborted: t.abortAt !== null,
      httpStatus: t.httpStatus,
    });
    AbortSignal.timeout = originalTimeout;
  }
} finally {
  AbortSignal.timeout = originalTimeout;
  await h?.close();
}
const diagnostics = {
  version: "content-timeout-diagnosis-1",
  mode: "offline-capture-analysis-and-intercepted-transport",
  sourceSha,
  legacySourceSha: legacySha,
  evidenceCommitSha,
  pairHash: pair.hash,
  sourceFilesSha256,
  evidenceFilesSha256,
  rows,
  baselineRequestComparisons: comparisons,
  wireChecks,
  controlChecks,
  probes,
  interpretation: {
    observedBoundary:
      "The live repair Neptune fetch had no response headers when its 60000ms application signal aborted.",
    deliveryUnconfirmed:
      "A recorded request and initiated fetch do not establish that the failed request arrived at Google; no response or request ID was received.",
    timerHierarchy:
      "SyntheticEvaluationWorkflow step.do allows 5 minutes with retry limit 0. The 240000ms fetch deadline belongs to RetentionWorkflow, not synthetic evaluation.",
    establishedAdapterBehavior:
      "Offline intercepted calls reproduce pre-header and post-header body timeouts, HTTP 504, network errors and malformed JSON as distinct recorded paths, with one fetch and no provider failover.",
    rootCause:
      "Not established for the live pre-header wait. Provider queueing, reasoning, generation, network transit and prompt complexity remain unseparated.",
    confounding:
      "Original and repair runs differ in prompt, fixture/runtime identities and time of day. Eleven successful responses and one censored failure are not a controlled latency experiment.",
    wireProofLimit:
      "Native payloads are reconstructed from pinned source and verified against mocked adapter fetches; they are not raw live HTTP captures.",
    runtimeProofLimit:
      "Offline abort probes use Node and a simulated 25ms deadline; they do not reproduce live provider latency or establish workerd timing parity.",
  },
  historicalResultFile: "2026-10-13-repair-pilot/pilot/result.json",
  historicalResultSha256: evidenceFilesSha256["2026-10-13-repair-pilot/pilot/result.json"],
  historicalResultSummary: {
    generationAttempts: result.generationAttempts,
    candidateAttempts: result.candidateAttempts,
    retries: result.retries,
    conservativeAccountedMicros: result.conservativeAccountedMicros,
    unknownProviderResults: result.unknownProviderResults,
  },
  changes: {
    servingPolicy: false,
    modelCalls: 0,
    retries: 0,
    replacementOutputs: 0,
    publication: false,
    contentApproval: false,
    contentActivation: false,
  },
};
await writeFile(
  new URL("diagnostic.json", import.meta.url),
  JSON.stringify(diagnostics, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    sourceSha,
    capturedAttempts: rows.length,
    wireChecks: wireChecks.length,
    controlChecks: controlChecks.length,
    offlineBoundaryProbes: probes.length,
    modelCalls: 0,
    rootCause: "unresolved pre-header wait",
  }),
);
