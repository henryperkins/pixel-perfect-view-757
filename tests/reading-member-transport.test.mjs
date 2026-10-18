import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createServer } from "vite";

const originalFetch = globalThis.fetch;
const originalTimeout = AbortSignal.timeout;
const savedEnv = Object.fromEntries(
  ["LOVABLE_API_KEY", "GEMINI_ENTERPRISE_API_KEY", "PATTERN_MEMBER_LANGUAGE_PROVIDER"].map(
    (name) => [name, process.env[name]],
  ),
);
const privateMarker = "private-member-transport-marker";
let vite, language, readDiagnostics, responder, requests, controller, budgets;
const input = {
  facts: [
    {
      id: "C1",
      statement: "transiting saturn square natal sun, orb 1.25 degrees, phase approaching",
      cycle: { transitBody: "saturn", natalPoint: "sun", aspect: "square", orb: 1.25 },
    },
    { id: "I1", statement: "Published interpretation: a role is tested for fit." },
  ],
  hasEligibleCycles: true,
  tone: "plain",
  depth: "standard",
  suppression: { angles: false, houses: false },
  fallback: {
    headline: "Deterministic headline",
    body: "Deterministic body.",
    prompt: "What do you notice?",
  },
};
const draft = {
  paragraphs: [
    {
      text: "Saturn square natal Sun names the contact. The published interpretation describes a role being tested for fit.",
      facts: ["C1", "I1"],
    },
    {
      text: "The role can be considered through that supplied interpretation. Its fit remains the central theme.",
      facts: ["C1", "I1"],
    },
  ],
};
const enterpriseResponse = (extra = {}) =>
  Response.json({
    modelVersion: "gemini-4-argon",
    candidates: [
      {
        content: { parts: [{ text: JSON.stringify(draft) }] },
        finishReason: "STOP",
      },
    ],
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 60,
      thoughtsTokenCount: 120,
      totalTokenCount: 280,
    },
    ...extra,
  });

before(async () => {
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(init.body) });
    return responder(init);
  };
  AbortSignal.timeout = (ms) => {
    budgets.push(ms);
    return controller.signal;
  };
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  language = await vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  ({ readDailyDiagnostics: readDiagnostics } = await vite.ssrLoadModule(
    "/src/lib/ai/diagnostics.ts",
  ));
});
beforeEach(() => {
  process.env.LOVABLE_API_KEY = privateMarker;
  process.env.GEMINI_ENTERPRISE_API_KEY = privateMarker;
  delete process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER;
  requests = [];
  budgets = [];
  controller = new AbortController();
  responder = async () => enterpriseResponse();
});
after(async () => {
  globalThis.fetch = originalFetch;
  AbortSignal.timeout = originalTimeout;
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  await vite?.close();
});

function checked(output, expected) {
  const transport = output.meta.diagnostics.transport;
  assert.ok(transport, "Production daily diagnostics include a bounded transport observation");
  assert.equal(transport.version, "member-daily-transport-1");
  assert.equal(transport.provider, "gemini-enterprise");
  assert.equal(transport.requestedModel, "gemini-enterprise/gemini-4-argon");
  assert.equal(transport.deadlineMs, 60_000);
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(transport[key], value, key);
  assert.equal(requests.length, 1, "No retry or second-provider request");
  assert.equal(
    requests[0].url,
    "https://aiplatform.googleapis.com/v1/projects/rising-woods-449718-v6/locations/global/publishers/google/models/gemini-4-argon:generateContent",
  );
  assert.deepEqual(budgets, [60_000]);
  assert.deepEqual(Object.keys(requests[0].body.generationConfig).sort(), [
    "responseJsonSchema",
    "responseMimeType",
    "thinkingConfig",
  ]);
  assert.deepEqual(requests[0].body.generationConfig.thinkingConfig, { thinkingLevel: "LOW" });
  assert.equal(transport.thinkingLevel, "LOW");
  assert.doesNotMatch(
    JSON.stringify(transport),
    /private-member|paragraphs|Published|Deterministic/,
  );
  return transport;
}

test("accepted production generation records actual model and bounded usage without source text", async () => {
  const output = await language.generateReadingProse(input);
  assert.equal(output.meta.mode, "model");
  const t = checked(output, {
    phase: "body",
    actualModel: "gemini-4-argon",
    httpStatus: 200,
    deadlineAbortMs: null,
    finishReason: "STOP",
    usage: {
      inputTokens: 100,
      outputTokens: 60,
      thinkingTokens: 120,
      totalTokens: 280,
      outputIncludesThinking: false,
    },
  });
  assert.ok(t.headersMs >= 0 && t.bodyMs >= t.headersMs && t.durationMs >= t.bodyMs);
  assert.deepEqual(readDiagnostics(output.meta.diagnostics).transport, t);
});

test("deadline before headers is distinct from HTTP timeout", async () => {
  responder = async ({ signal }) => {
    controller.abort(new DOMException(privateMarker, "TimeoutError"));
    throw signal.reason;
  };
  const output = await language.generateReadingProse(input);
  assert.equal(output.meta.diagnostics.code, "timeout");
  assert.equal(output.body, input.fallback.body);
  const t = checked(output, {
    phase: "request",
    headersMs: null,
    bodyMs: null,
    httpStatus: null,
    actualModel: null,
  });
  assert.ok(t.deadlineAbortMs >= 0);
});

test("deadline while reading a response retains headers and its HTTP status", async () => {
  responder = async ({ signal }) => ({
    ok: true,
    status: 200,
    json: async () => {
      controller.abort(new DOMException(privateMarker, "TimeoutError"));
      throw signal.reason;
    },
  });
  const output = await language.generateReadingProse(input);
  assert.equal(output.meta.diagnostics.code, "timeout");
  const t = checked(output, { phase: "headers", bodyMs: null, httpStatus: 200 });
  assert.ok(t.headersMs >= 0 && t.deadlineAbortMs >= t.headersMs);
});

test("provider HTTP 504 is recorded without inventing an application deadline abort", async () => {
  responder = async () => Response.json({ error: { message: privateMarker } }, { status: 504 });
  const output = await language.generateReadingProse(input);
  assert.equal(output.meta.diagnostics.code, "timeout");
  checked(output, { phase: "body", httpStatus: 504, deadlineAbortMs: null, finishReason: null });
});

test("a network exception remains pre-header without a fabricated deadline abort", async () => {
  responder = async () => {
    throw new TypeError(privateMarker);
  };
  const output = await language.generateReadingProse(input);
  assert.equal(output.meta.diagnostics.code, "network");
  checked(output, { phase: "request", httpStatus: null, deadlineAbortMs: null });
});

test("untrusted provider metadata and stored additions cannot leak through diagnostics", async () => {
  responder = async () =>
    enterpriseResponse({
      modelVersion: privateMarker,
      candidates: [
        { content: { parts: [{ text: JSON.stringify(draft) }] }, finishReason: privateMarker },
      ],
      usageMetadata: {
        promptTokenCount: privateMarker,
        candidatesTokenCount: -1,
        thoughtsTokenCount: 2_000_001,
        totalTokenCount: 1.5,
        secret: privateMarker,
      },
      secret: privateMarker,
    });
  const output = await language.generateReadingProse(input);
  const t = checked(output, {
    actualModel: null,
    finishReason: null,
    usage: {
      inputTokens: null,
      outputTokens: null,
      thinkingTokens: null,
      totalTokens: null,
      outputIncludesThinking: false,
    },
  });
  const stored = structuredClone(output.meta.diagnostics);
  stored.transport.secret = privateMarker;
  stored.transport.usage.secret = privateMarker;
  assert.deepEqual(readDiagnostics(stored).transport, t);
  stored.transport.provider = privateMarker;
  assert.equal(readDiagnostics(stored).transport, null);
  const historical = { ...output.meta.diagnostics };
  delete historical.transport;
  assert.deepEqual(
    readDiagnostics(historical),
    historical,
    "Historical rows retain their original shape",
  );
});

test("a bounded reported model mismatch is retained for routing diagnosis", async () => {
  responder = async () => enterpriseResponse({ modelVersion: "gemini-3.1-pro-preview" });
  const output = await language.generateReadingProse(input);
  const t = checked(output, { actualModel: "gemini-3.1-pro-preview" });
  assert.deepEqual(readDiagnostics(output.meta.diagnostics).transport, t);
});

test("malformed stored transport cannot rewrite a valid historical reading diagnostic", async () => {
  const output = await language.generateReadingProse(input);
  for (const change of [
    { version: privateMarker },
    { requestedModel: "google/gemini-3.8-flash" },
    { deadlineMs: -1 },
    { durationMs: 120_001 },
    { headersMs: privateMarker },
    { bodyMs: null },
    { deadlineAbortMs: -1 },
    { httpStatus: 999 },
    { phase: "request" },
  ]) {
    const stored = structuredClone(output.meta.diagnostics);
    Object.assign(stored.transport, change);
    const read = readDiagnostics(stored);
    assert.equal(read.code, "accepted");
    assert.equal(read.transport, null);
    assert.doesNotMatch(JSON.stringify(read), /private-member/);
  }
});

test("Lovable member calls retain their independent provider and completion-token accounting", async () => {
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  responder = async () =>
    Response.json({
      model: "google/gemini-3.8-flash",
      choices: [{ message: { content: JSON.stringify(draft) }, finish_reason: "stop" }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 180,
        total_tokens: 280,
        completion_tokens_details: { reasoning_tokens: 120 },
      },
    });
  const output = await language.generateReadingProse(input);
  assert.equal(output.meta.mode, "model");
  const t = output.meta.diagnostics.transport;
  assert.ok(t);
  assert.equal(t.provider, "lovable");
  assert.equal(t.requestedModel, "google/gemini-3.8-flash");
  assert.equal(t.actualModel, "google/gemini-3.8-flash");
  assert.equal(t.finishReason, "stop");
  assert.deepEqual(t.usage, {
    inputTokens: 100,
    outputTokens: 180,
    thinkingTokens: 120,
    totalTokens: 280,
    outputIncludesThinking: true,
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://ai.gateway.lovable.dev/v1/chat/completions");
});

test("a skipped member reading has no fabricated transport attempt", async () => {
  const output = await language.generateReadingProse({ ...input, hasEligibleCycles: false });
  assert.equal(output.meta.diagnostics.attempted, false);
  assert.equal(output.meta.diagnostics.transport, undefined);
  assert.equal(requests.length, 0);
});

test("transport construction rejects provider-incompatible and unknown thinking before recording an attempt", async () => {
  const { createMemberDailyTransport } = await vite.ssrLoadModule(
    "/src/lib/ai/member-transport.ts",
  );
  for (const level of ["LOW", "MEDIUM", "HIGH"])
    assert.throws(
      () =>
        createMemberDailyTransport(
          "lovable",
          "google/gemini-3.8-flash",
          60_000,
          controller.signal,
          level,
        ),
      /require Gemini Enterprise/,
    );
  assert.throws(
    () =>
      createMemberDailyTransport(
        "gemini-enterprise",
        "gemini-enterprise/gemini-4-argon",
        60_000,
        controller.signal,
        "MINIMAL",
      ),
    /Unsupported member thinking/,
  );
  assert.equal(requests.length, 0);
});
