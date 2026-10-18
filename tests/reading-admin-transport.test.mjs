import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, run, prepare, bundle, language;
before(async () => {
  h = await createRecordsHarness();
  ({ runSyntheticEvaluationCase: run, prepareSyntheticEvaluationCase: prepare } =
    await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts"));
  ({ TRANSIT_CANDIDATE_BUNDLE: bundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/transit-candidate-bundle.ts",
  ));
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
});
after(async () => h?.close());
test("budget reservations never refund missing, inconsistent or out-of-contract provider usage", async () => {
  const { qualificationReservationMicros: reserve } = await h.vite.ssrLoadModule(
    "/src/lib/ai/admin-transport.ts",
  );
  const base = {
    provider: "lovable",
    actualModel: "gemini-3.8-flash",
    maxOutputTokens: 65536,
    usage: {
      inputTokens: 100,
      outputTokens: 100,
      thinkingTokens: 50,
      totalTokens: 200,
      outputIncludesThinking: true,
    },
  };
  assert.equal(reserve(base, true), 2200);
  for (const change of [
    { usage: { ...base.usage, thinkingTokens: 500 } },
    { usage: { ...base.usage, totalTokens: 199 } },
    { usage: { ...base.usage, totalTokens: 201 } },
    { usage: { ...base.usage, inputTokens: 65537, totalTokens: 65637 } },
    { usage: { ...base.usage, outputTokens: 65537, totalTokens: 65637 } },
    { usage: { ...base.usage, thinkingTokens: null } },
    { actualModel: null },
    { actualModel: "gemini-2.5-pro" },
    { actualModel: "gemini-4-argon" },
  ])
    assert.equal(reserve({ ...base, ...change }, true), 2800000);
  assert.equal(
    reserve(
      {
        ...base,
        provider: "gemini-enterprise",
        usage: { ...base.usage, outputIncludesThinking: false, totalTokens: 250 },
      },
      true,
    ),
    3200,
  );
  assert.equal(reserve(undefined, false), 0);
});
test("Enterprise low/medium controls use the verified native API shape and retain bounded response identity/usage without thought text", async () => {
  for (const level of ["LOW", "MEDIUM"]) {
    h.setGeminiEnterprise(() =>
      Response.json(
        {
          modelVersion: "gemini-3.8-flash-20260902",
          responseId: "synthetic-response-123",
          usageMetadata: {
            promptTokenCount: 123,
            candidatesTokenCount: 234,
            thoughtsTokenCount: 345,
            totalTokenCount: 702,
          },
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  { thought: true, text: "PRIVATE_REASONING_SENTINEL" },
                  { text: JSON.stringify({ paragraphs: [] }) },
                ],
              },
            },
          ],
        },
        { headers: { "x-goog-request-id": "synthetic-request-123" } },
      ),
    );
    const result = await run("saturn-square-sun", bundle, "gemini-enterprise", undefined, {
      enterpriseThinking: level,
    });
    const request = h.geminiEnterpriseRequests.at(-1);
    assert.deepEqual(request.generationConfig.thinkingConfig, { thinkingLevel: level });
    const trace = result.case.transport;
    assert.equal(trace.thinkingLevel, level);
    assert.equal(trace.actualModel, "gemini-3.8-flash-20260902");
    assert.equal(trace.responseId, "synthetic-response-123");
    assert.equal(trace.requestId, "synthetic-request-123");
    assert.equal(trace.usage.thinkingTokens, 345);
    assert.equal(trace.usage.totalTokens, 702);
    for (const field of ["startedAt", "headersAt", "bodyAt"]) assert.match(trace[field], /^\d{4}-/);
    assert.equal(trace.abortAt, null);
    assert.equal(trace.deadlineMs, 60000);
    assert.equal(trace.httpStatus, 200);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_REASONING_SENTINEL/);
  }
  const before = h.geminiEnterpriseRequests.length;
  for (const enterpriseThinking of ["MINIMAL", "HIGH"])
    await assert.rejects(
      run("saturn-square-sun", bundle, "gemini-enterprise", undefined, { enterpriseThinking }),
      /thinking/,
    );
  assert.equal(h.geminiEnterpriseRequests.length, before);
});
test("member and default synthetic Lovable requests retain their original payload; admin transport records explicit unknown usage", async () => {
  h.setGateway(() =>
    Response.json({
      choices: [
        { finish_reason: "stop", message: { content: JSON.stringify({ paragraphs: [] }) } },
      ],
    }),
  );
  const result = await run("saturn-square-sun", bundle, "lovable");
  const request = h.gatewayRequests.at(-1);
  assert.equal(request.max_tokens, undefined);
  assert.equal(result.case.transport.thinkingLevel, null);
  assert.equal(result.case.transport.actualModel, null);
  assert.equal(result.case.transport.usage.totalTokens, null);
  const before = h.gatewayRequests.length;
  await assert.rejects(
    run("saturn-square-sun", bundle, "lovable", undefined, { enterpriseThinking: "LOW" }),
    /Enterprise/,
  );
  assert.equal(h.gatewayRequests.length, before);
});
test("qualified transport bounds input before any request and pins an explicit maximum output limit", async () => {
  const input = prepare("saturn-square-sun", bundle).input;
  h.setGateway(() =>
    Response.json({ choices: [{ message: { content: JSON.stringify({ paragraphs: [] }) } }] }),
  );
  const start = h.gatewayRequests.length;
  input.facts.find((f) => f.id === "I1").statement += " safe published wording".repeat(8000);
  const result = await language.generateSyntheticReadingProse(input, "lovable", {
    boundedQualification: true,
  });
  assert.equal(h.gatewayRequests.length, start);
  assert.equal(result.prose.meta.diagnostics.code, "request_limit");
  const normal = prepare("saturn-square-sun", bundle).input;
  await language.generateSyntheticReadingProse(normal, "lovable", { boundedQualification: true });
  assert.equal(h.gatewayRequests.at(-1).max_tokens, 65536);
});
