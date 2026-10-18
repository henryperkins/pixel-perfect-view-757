import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { BASELINE_RESPONSES, READING_EVAL_CASES } from "../scripts/reading-eval-cases.mjs";
import { compareReports } from "../scripts/evaluate-readings.mjs";

const ENTERPRISE_MODEL = "gemini-enterprise/gemini-3.8-flash";
let h, runCase, combine, language, bundle;
before(async () => {
  h = await createRecordsHarness();
  ({ runSyntheticEvaluationCase: runCase } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  ({ combineReadingEvaluationResults: combine } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.shared.ts",
  ));
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  ({ DEFAULT_BUNDLE: bundle } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
});
beforeEach(async () => {
  await h.reset();
});
after(async () => {
  await h?.close();
});

const lovableResponse = (draft) =>
  Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] });
const enterpriseResponse = (draft, leadingParts = [], modelVersion = "gemini-3.8-flash") =>
  Response.json({
    candidates: [
      {
        content: { role: "model", parts: [...leadingParts, { text: JSON.stringify(draft) }] },
        finishReason: "STOP",
      },
    ],
    modelVersion,
  });
async function makeAdmin() {
  const result = await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  assert.equal(result.error, null);
}

test("Gemini Enterprise receives the gateway prompt and schema with only its own key", async () => {
  const draft = BASELINE_RESPONSES["saturn-square-sun"];
  h.setGateway(() => lovableResponse(draft));
  const lovable = await runCase("saturn-square-sun", bundle);
  let headers;
  h.setGeminiEnterprise((_body, init) => {
    headers = new Headers(init.headers);
    return enterpriseResponse(draft);
  });
  const result = await runCase("saturn-square-sun", bundle, "gemini-enterprise");

  assert.equal(h.gatewayRequests.length, 1);
  assert.deepEqual(h.geminiEnterpriseRequests, [
    {
      systemInstruction: { parts: [{ text: lovable.case.request.messages[0].content }] },
      contents: [{ role: "user", parts: [{ text: lovable.case.request.messages[1].content }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: lovable.case.request.response_format.json_schema.schema,
      },
    },
  ]);
  assert.equal(headers.get("x-goog-api-key"), "local-test-gemini-key-never-a-real-secret");
  assert.equal(headers.get("authorization"), null);
  assert.equal(headers.get("lovable-api-key"), null);

  assert.deepEqual(result.case.request.messages, lovable.case.request.messages);
  assert.deepEqual(result.case.request.response_format, lovable.case.request.response_format);
  assert.equal(result.case.request.model, ENTERPRISE_MODEL);
  assert.equal(result.case.diagnostics.outcome, "accepted");
  assert.equal(result.case.diagnostics.model, ENTERPRISE_MODEL);
  assert.equal(result.case.output.body, lovable.case.output.body);
  assert.equal(result.metadata.model, ENTERPRISE_MODEL);
  assert.match(result.metadata.network, /Gemini Enterprise/);
  assert.equal(result.metadata.gatewayTimeoutMs, lovable.metadata.gatewayTimeoutMs);
  assert.doesNotMatch(JSON.stringify(result), /local-test|x-goog-api-key/);
});

test("thought parts never become draft text and split text parts are joined", async () => {
  const draft = BASELINE_RESPONSES["saturn-square-sun"];
  const text = JSON.stringify(draft);
  h.setGeminiEnterprise(() =>
    Response.json({
      candidates: [
        {
          content: {
            parts: [
              { text: "PRIVATE_THOUGHT_SUMMARY", thought: true },
              { text: text.slice(0, 40) },
              { text: text.slice(40) },
            ],
          },
        },
      ],
    }),
  );
  const result = await runCase("saturn-square-sun", bundle, "gemini-enterprise");
  assert.equal(result.case.diagnostics.code, "accepted");
  assert.deepEqual(result.case.candidate.paragraphs, draft.paragraphs);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_THOUGHT_SUMMARY/);
});

test("Gemini Enterprise failures become closed codes without provider text", async () => {
  const error = (status, reason) => ({
    error: {
      code: 403,
      status,
      message: "PRIVATE_PROVIDER_MESSAGE",
      ...(reason
        ? { details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason }] }
        : {}),
    },
  });
  const failures = [
    [400, error("INVALID_ARGUMENT", "API_KEY_INVALID"), "auth"],
    [403, error("PERMISSION_DENIED", "BILLING_DISABLED"), "credit"],
    [403, error("PERMISSION_DENIED", "SERVICE_DISABLED"), "auth"],
    [401, error("UNAUTHENTICATED"), "auth"],
    [429, error("RESOURCE_EXHAUSTED"), "rate_limit"],
    [404, error("NOT_FOUND"), "http"],
    [400, error("INVALID_ARGUMENT"), "http"],
    [504, "PRIVATE_PROVIDER_MESSAGE", "timeout"],
    [500, "PRIVATE_PROVIDER_MESSAGE", "http"],
  ];
  for (const [status, body, code] of failures) {
    h.setGeminiEnterprise(() =>
      typeof body === "string" ? new Response(body, { status }) : Response.json(body, { status }),
    );
    const result = await runCase("saturn-square-sun", bundle, "gemini-enterprise");
    assert.equal(result.case.diagnostics.outcome, "unavailable", `${status} → ${code}`);
    assert.equal(result.case.diagnostics.code, code, `${status} → ${code}`);
    assert.equal(result.case.diagnostics.attempted, true);
    assert.equal(result.case.output.mode, "template");
    assert.equal(result.case.output.body, result.case.template.body);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_PROVIDER_MESSAGE/);
  }
});

test("blocked, empty and non-JSON responses fall back to template copy", async () => {
  const responses = [
    [{ promptFeedback: { blockReason: "SAFETY" } }, "empty_response"],
    [{ candidates: [{ finishReason: "SAFETY" }] }, "empty_response"],
    [
      { candidates: [{ content: { parts: [{ text: "PRIVATE", thought: true }] } }] },
      "empty_response",
    ],
    [{ candidates: [{ content: { parts: [{ text: "PRIVATE not JSON" }] } }] }, "bad_json"],
  ];
  for (const [payload, code] of responses) {
    h.setGeminiEnterprise(() => Response.json(payload));
    const result = await runCase("saturn-square-sun", bundle, "gemini-enterprise");
    assert.equal(result.case.diagnostics.outcome, "unavailable");
    assert.equal(result.case.diagnostics.code, code);
    assert.equal(result.case.output.mode, "template");
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
  }
});

test("a missing Gemini Enterprise key makes no request even when Lovable is configured", async () => {
  h.setGateway(() => {
    throw new Error("A Gemini Enterprise run must not fall back to the Lovable gateway");
  });
  const result = await runCase("saturn-square-sun", bundle, "gemini-enterprise");
  assert.equal(result.case.diagnostics.code, "not_configured");
  assert.equal(result.case.diagnostics.attempted, false);
  assert.equal(result.case.diagnostics.model, ENTERPRISE_MODEL);
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
  assert.deepEqual(
    language.languageProviderStatus().map(({ id, configured }) => [id, configured]),
    [
      ["lovable", true],
      ["gemini-enterprise", false],
    ],
  );
});

test("member readings and natal chapters use configured Gemini Enterprise and record its identity", async () => {
  h.setGateway(() => {
    throw new Error("Configured member language must not reach the Lovable gateway");
  });
  const draft = BASELINE_RESPONSES["saturn-square-sun"];
  h.setGeminiEnterprise(() => enterpriseResponse(draft));
  const synthetic = await runCase("saturn-square-sun", bundle, "gemini-enterprise");
  h.setGeminiEnterprise(() => enterpriseResponse(draft, [], "gemini-4-argon"));
  const production = await language.generateReadingProse({
    facts: synthetic.case.facts,
    hasEligibleCycles: true,
    tone: "plain",
    depth: "standard",
    suppression: { angles: false, houses: false },
    fallback: {
      headline: synthetic.case.output.headline,
      body: synthetic.case.template.body,
      prompt: synthetic.case.output.prompt,
    },
  });
  assert.equal(production.meta.diagnostics.model, "gemini-enterprise/gemini-4-argon");
  assert.equal(production.meta.model, "gemini-enterprise/gemini-4-argon");
  assert.equal(production.meta.diagnostics.transport.actualModel, "gemini-4-argon");
  h.setGeminiEnterprise(() =>
    enterpriseResponse({
      paragraphs: [{ text: "A supplied natal pattern. A second sentence.", facts: ["F1"] }],
      reflection_question: "Where do you recognise this pattern in your life?",
    }),
  );
  const chapter = await language.generateFeatureNarrative({
    facts: [{ id: "F1", statement: "Synthetic natal pattern." }],
    title: "Synthetic natal chapter",
    tone: "plain",
  });
  assert.equal(chapter.meta.model, ENTERPRISE_MODEL);
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 3);
});

test("member provider selection supports an explicit override and never retries another provider", async () => {
  h.setGateway(() => {
    throw new Error("A failed Enterprise member request must not fall back to Lovable");
  });
  assert.equal(language.memberLanguageProvider(), "lovable");
  h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
  assert.equal(language.memberLanguageProvider(), "gemini-enterprise");
  const input = {
    facts: [{ id: "F1", statement: "Synthetic natal pattern." }],
    title: "Synthetic natal chapter",
    tone: "plain",
  };
  const failed = await language.generateFeatureNarrative(input);
  assert.equal(failed.narrative, "");
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);

  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  h.setGateway(() =>
    lovableResponse({
      paragraphs: [{ text: "A supplied natal pattern. A second sentence.", facts: ["F1"] }],
      reflection_question: "Where do you recognise this pattern?",
    }),
  );
  const overridden = await language.generateFeatureNarrative(input);
  assert.equal(overridden.meta.model, "google/gemini-3.8-flash");
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(h.geminiEnterpriseRequests.length, 1);

  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
  h.setGeminiEnterprise(null);
  const unconfigured = await language.generateFeatureNarrative(input);
  assert.equal(unconfigured.narrative, "");
  assert.match(unconfigured.meta.reason, /not configured/);
  assert.equal(h.gatewayRequests.length, 1);
});

test("one report cannot mix providers; Gemini Enterprise results combine together", async () => {
  h.setGateway(() => lovableResponse(BASELINE_RESPONSES["saturn-square-sun"]));
  h.setGeminiEnterprise((body) => {
    const warm = /warm/i.test(body.contents[0].parts[0].text);
    return enterpriseResponse(
      BASELINE_RESPONSES[warm ? "saturn-square-moon-warm" : "saturn-square-sun"],
    );
  });
  const lovable = await runCase("saturn-square-sun", bundle);
  const first = await runCase("saturn-square-sun", bundle, "gemini-enterprise");
  const second = await runCase("saturn-square-moon-warm", bundle, "gemini-enterprise");
  assert.throws(() => combine([lovable, second], { partial: true }), /configuration changed/i);
  const report = combine([first, second], { partial: true });
  assert.equal(report.model, ENTERPRISE_MODEL);
  assert.equal(report.cases.length, 2);
});

test("complete Gemini Enterprise reports compare with each other but not with gateway reports", async () => {
  let expected;
  h.setGateway(() => lovableResponse(expected));
  h.setGeminiEnterprise(() => enterpriseResponse(expected));
  const completeRun = async (provider) => {
    const results = [];
    for (const fixed of READING_EVAL_CASES) {
      expected = BASELINE_RESPONSES[fixed.id];
      results.push(await runCase(fixed.id, bundle, provider));
    }
    return combine(results);
  };
  const lovable = await completeRun("lovable");
  const before = await completeRun("gemini-enterprise");
  const after = await completeRun("gemini-enterprise");
  assert.equal(before.partial, false);
  assert.equal(compareReports(before, after).acceptedDelta, 0);
  assert.throws(() => compareReports(lovable, after), /model/);
});

test("provider status and Gemini Enterprise runs are admin-only and expose no key", async () => {
  h.setGateway(() => lovableResponse(BASELINE_RESPONSES["saturn-square-sun"]));
  h.setGeminiEnterprise(() => enterpriseResponse(BASELINE_RESPONSES["saturn-square-sun"]));
  await assert.rejects(h.app.listLanguageProviders(h.records(), h.userA), /Only admins/);
  await assert.rejects(
    h.app.runReadingEvaluationCase(
      h.records(),
      h.userA,
      "saturn-square-sun",
      "active",
      "gemini-enterprise",
    ),
    /Only admins/,
  );
  assert.equal(h.geminiEnterpriseRequests.length, 0);

  await makeAdmin();
  const status = await h.app.listLanguageProviders(h.records(), h.userA);
  assert.deepEqual(status, {
    memberProvider: "gemini-enterprise",
    providers: [
      {
        id: "lovable",
        label: "Lovable AI gateway",
        model: "google/gemini-3.8-flash",
        configured: true,
      },
      {
        id: "gemini-enterprise",
        label: "Gemini Enterprise",
        model: ENTERPRISE_MODEL,
        configured: true,
      },
    ],
  });
  assert.doesNotMatch(JSON.stringify(status), /local-test/);
  const result = await h.app.runReadingEvaluationCase(
    h.records(),
    h.userA,
    "saturn-square-sun",
    "active",
    "gemini-enterprise",
  );
  assert.equal(result.metadata.model, ENTERPRISE_MODEL);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});

test("a Gemini Enterprise release draft records its provider in the draft and audit trail", async () => {
  await makeAdmin();
  h.setGateway(() => {
    throw new Error("A Gemini Enterprise draft must not call the Lovable gateway");
  });
  h.setGeminiEnterprise((body) => {
    const prompt = body.contents[0].parts[0].text;
    const entries = [...prompt.matchAll(/^(\S+) — /gm)].map(([, key]) => ({
      key,
      mechanism: `Drafted copy for ${key}.`,
      question: "Drafted question?",
    }));
    return enterpriseResponse({ entries });
  });
  const drafted = await h.app.draftRelease(h.records(), h.userA, "gemini-enterprise");
  assert.equal(drafted.model, ENTERPRISE_MODEL);
  assert.ok(drafted.entries > 0);
  assert.deepEqual(h.geminiEnterpriseRequests[0].generationConfig.responseJsonSchema.required, [
    "entries",
  ]);
  const [draft] = await h.app.listDrafts(h.records(), h.userA);
  assert.equal(draft.model, ENTERPRISE_MODEL);
  const audit = h.sqlite
    .prepare("SELECT detail FROM audit_events WHERE kind = 'content_draft_generated'")
    .all();
  assert.equal(JSON.parse(audit[0].detail).model, ENTERPRISE_MODEL);
  assert.equal(h.gatewayRequests.length, 0);
});

test("the evaluation panel offers a labeled provider choice that defaults to the gateway", async () => {
  const stubs = fileURLToPath(
    new URL("./helpers/reading-evaluation-ui-stubs.mjs", import.meta.url),
  );
  const ui = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    resolve: {
      alias: [
        { find: /^@tanstack\/react-start$/, replacement: stubs },
        { find: /^@\/lib\/pattern\.functions$/, replacement: stubs },
        { find: /^@\//, replacement: fileURLToPath(new URL("../src/", import.meta.url)) },
      ],
    },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  try {
    const { ReadingEvaluation } = await ui.ssrLoadModule(
      "/src/components/pattern/ReadingEvaluation.tsx",
    );
    const { LanguageProviderChoice } = await ui.ssrLoadModule(
      "/src/components/pattern/LanguageProviderChoice.tsx",
    );
    const buttons = (markup) =>
      [...markup.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)]
        .filter(([, , label]) => /gateway|Gemini Enterprise/.test(label))
        .map(([, attributes, label]) => [
          label,
          /aria-pressed="true"/.test(attributes),
          /disabled=""/.test(attributes),
        ]);

    const panel = renderToStaticMarkup(createElement(ReadingEvaluation));
    const label = panel.match(/<span id="([^"]+)"[^>]*>Language provider<\/span>/);
    assert.ok(label, "A visible label names the provider group");
    assert.match(panel, new RegExp(`role="group" aria-labelledby="${label[1]}"`));
    assert.deepEqual(buttons(panel), [
      ["Lovable AI gateway", true, false],
      ["Gemini Enterprise", false, false],
    ]);

    const missing = renderToStaticMarkup(
      createElement(LanguageProviderChoice, {
        value: "lovable",
        onChange() {},
        configured: { lovable: true, "gemini-enterprise": false },
      }),
    );
    assert.deepEqual(buttons(missing), [
      ["Lovable AI gateway", true, false],
      ["Gemini Enterprise · not configured", false, true],
    ]);
    assert.match(missing, /needs a GEMINI_ENTERPRISE_API_KEY secret/);
  } finally {
    await ui.close();
  }
});
