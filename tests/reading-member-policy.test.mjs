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
const response = () =>
  Response.json({
    modelVersion: "gemini-3.8-flash",
    candidates: [
      {
        content: { parts: [{ text: JSON.stringify(BASELINE_RESPONSES["saturn-square-sun"]) }] },
        finishReason: "STOP",
      },
    ],
  });

test("default member daily Enterprise writing explicitly uses LOW within the existing deadline", async () => {
  let signal;
  h.setGeminiEnterprise((_body, init) => {
    signal = init.signal;
    return response();
  });
  const prose = await language.generateReadingProse(input);
  assert.equal(prose.meta.mode, "model");
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.deepEqual(h.geminiEnterpriseRequests[0].generationConfig.thinkingConfig, {
    thinkingLevel: "LOW",
  });
  assert.equal(prose.meta.diagnostics.gatewayTimeoutMs, 60000);
  assert.equal(prose.meta.diagnostics.transport.thinkingLevel, "LOW");
  assert.equal(signal.aborted, false);
  assert.equal(h.gatewayRequests.length, 0);
});

test("synthetic member capture matches member thinking policy while explicit evaluation controls remain independent", async () => {
  h.setGeminiEnterprise(response);
  const member = await language.generateSyntheticMemberReadingProse(input, "gemini-enterprise");
  assert.equal(member.transport.thinkingLevel, "LOW");
  assert.deepEqual(h.geminiEnterpriseRequests[0].generationConfig.thinkingConfig, {
    thinkingLevel: "LOW",
  });
  await language.generateSyntheticReadingProse(input, "gemini-enterprise");
  assert.equal(h.geminiEnterpriseRequests[1].generationConfig.thinkingConfig, undefined);
  const controlled = await language.generateSyntheticMemberReadingProse(
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

test("LOW does not add retries or change the explicitly selected Lovable transport", async () => {
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
});
