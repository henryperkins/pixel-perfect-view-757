import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { BASELINE_RESPONSES } from "../scripts/reading-eval-cases.mjs";

let h, language, input;
before(async () => {
  h = await createRecordsHarness();
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  const { prepareSyntheticEvaluationCase } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  );
  const { DEFAULT_BUNDLE } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  ({ input } = prepareSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE));
  assert.equal(input.tone, "plain");
  assert.equal(input.depth, "standard");
});
beforeEach(async () => h.reset());
after(async () => h?.close());
const response = (modelVersion = "gemini-4-argon") =>
  Response.json({
    modelVersion,
    candidates: [
      {
        content: { parts: [{ text: JSON.stringify(BASELINE_RESPONSES["saturn-square-sun"]) }] },
        finishReason: "STOP",
      },
    ],
  });

test("default member daily Enterprise writing uses Argon with HIGH thinking within the existing deadline", async () => {
  let signal;
  h.setGeminiEnterprise((_body, init) => {
    signal = init.signal;
    return response();
  });
  const prose = await language.generateReadingProse(input);
  assert.equal(prose.meta.mode, "model");
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.deepEqual(h.geminiEnterpriseRequests[0].generationConfig.thinkingConfig, {
    thinkingLevel: "HIGH",
  });
  assert.equal(prose.meta.model, "gemini-enterprise/gemini-4-argon");
  assert.equal(prose.meta.diagnostics.model, "gemini-enterprise/gemini-4-argon");
  assert.equal(prose.meta.diagnostics.transport.requestedModel, "gemini-enterprise/gemini-4-argon");
  assert.equal(prose.meta.diagnostics.gatewayTimeoutMs, 60000);
  assert.equal(prose.meta.diagnostics.transport.thinkingLevel, "HIGH");
  assert.equal(signal.aborted, false);
  assert.equal(h.gatewayRequests.length, 0);
});

test("frozen synthetic member evaluations retain Flash and their independent thinking controls", async () => {
  h.setGeminiEnterprise(() => response("gemini-3.8-flash"));
  const member = await language.generateFrozenSyntheticMemberReadingProse(
    input,
    "gemini-enterprise",
  );
  assert.equal(member.request.model, "gemini-enterprise/gemini-3.8-flash");
  assert.equal(member.transport.thinkingLevel, "LOW");
  assert.deepEqual(h.geminiEnterpriseRequests[0].generationConfig.thinkingConfig, {
    thinkingLevel: "LOW",
  });
  await language.generateSyntheticReadingProse(input, "gemini-enterprise");
  assert.equal(h.geminiEnterpriseRequests[1].generationConfig.thinkingConfig, undefined);
  const controlled = await language.generateFrozenSyntheticMemberReadingProse(
    input,
    "gemini-enterprise",
    { enterpriseThinking: "MEDIUM" },
  );
  assert.equal(controlled.transport.thinkingLevel, "MEDIUM");
  assert.equal(h.geminiEnterpriseRequests.length, 3);
  assert.deepEqual(h.geminiEnterpriseRequests[2].generationConfig.thinkingConfig, {
    thinkingLevel: "MEDIUM",
  });
});

test("current-member captures use the full serving wire policy while frozen pilots stay independent", async () => {
  const wires = [];
  const originalFetch = globalThis.fetch;
  const originalTimeout = AbortSignal.timeout;
  const deadlines = [];
  globalThis.fetch = (url, init) => {
    if (String(url).startsWith("https://aiplatform.googleapis.com/"))
      wires.push({ url: String(url), body: JSON.parse(init.body) });
    return originalFetch(url, init);
  };
  AbortSignal.timeout = (ms) => {
    deadlines.push(ms);
    return originalTimeout(ms);
  };
  try {
    h.setGeminiEnterprise(() => response());
    const live = await language.generateReadingProse(input);
    const captured = await language.generateSyntheticMemberReadingProse(input);
    assert.equal(captured.version, "member-daily-capture-1");
    assert.equal(captured.policy.model, live.meta.model);
    assert.equal(captured.policy.thinkingLevel, "HIGH");
    assert.equal(captured.transport.actualModel, "gemini-4-argon");
    assert.equal(captured.transport.thinkingLevel, "HIGH");
    assert.equal(captured.request.model, live.meta.model);
    assert.equal(captured.prose.body, live.body);
    assert.equal(captured.candidate.captureLossless, true);
    assert.deepEqual(wires[1], wires[0], "URL, native body, schema and thinking match serving");
    assert.deepEqual(deadlines, [60_000, 60_000]);
    assert.equal(wires[0].body.generationConfig.maxOutputTokens, undefined);

    h.setGeminiEnterprise(() => response("gemini-3.8-flash"));
    const frozen = await language.generateFrozenSyntheticMemberReadingProse(
      input,
      "gemini-enterprise",
    );
    assert.equal(frozen.request.model, "gemini-enterprise/gemini-3.8-flash");
    assert.equal(frozen.transport.thinkingLevel, "LOW");
    assert.notEqual(frozen.request.model, captured.request.model);
  } finally {
    globalThis.fetch = originalFetch;
    AbortSignal.timeout = originalTimeout;
  }
});

test("current-member captures cannot accept Flash qualification controls or silently ignore old arguments", async () => {
  h.setGeminiEnterprise(() => response());
  for (const options of [
    "gemini-enterprise",
    { provider: "gemini-enterprise", enterpriseThinking: "LOW" },
    { provider: "gemini-enterprise", boundedQualification: true },
  ])
    await assert.rejects(
      language.generateSyntheticMemberReadingProse(input, options),
      /member reading option/,
    );
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

test("Argon with HIGH thinking does not add retries or change the explicitly selected Lovable transport", async () => {
  h.setGeminiEnterprise(() => new Response(null, { status: 504 }));
  h.setGateway(() => {
    throw Error("No cross-provider retry");
  });
  const failure = await language.generateReadingProse(input);
  assert.equal(failure.meta.mode, "template");
  assert.equal(failure.meta.diagnostics.code, "timeout");
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  h.setGateway(() =>
    Response.json({
      choices: [{ message: { content: JSON.stringify(BASELINE_RESPONSES["saturn-square-sun"]) } }],
    }),
  );
  const lovable = await language.generateReadingProse(input);
  assert.equal(lovable.meta.mode, "model");
  assert.equal(lovable.meta.diagnostics.transport.thinkingLevel, null);
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.deepEqual(Object.keys(h.gatewayRequests[0]).sort(), [
    "messages",
    "model",
    "response_format",
  ]);
  assert.equal(h.gatewayRequests[0].thinkingConfig, undefined);
  assert.equal(h.gatewayRequests[0].reasoning_effort, undefined);
  const captured = await language.generateSyntheticMemberReadingProse(input);
  assert.deepEqual(h.gatewayRequests[1], h.gatewayRequests[0]);
  assert.equal(captured.policy.provider, "lovable");
  assert.equal(captured.request.model, lovable.meta.model);
  assert.equal(captured.transport.thinkingLevel, null);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
});
