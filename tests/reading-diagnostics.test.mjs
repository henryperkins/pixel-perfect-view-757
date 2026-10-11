import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const root =
  process.env.PATTERN_TEST_PROJECT_ROOT ?? fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(join(root, "package.json"));
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);
const originalFetch = globalThis.fetch;
const originalKey = process.env.LOVABLE_API_KEY;
const sentinel = "synthetic-private-marker-DO-NOT-RETURN";
let vite, language, calls, responder;
const facts = [
  {
    id: "C1",
    statement: "transiting saturn square natal sun, orb 1.25 degrees, phase approaching",
    cycle: {
      transitBody: "saturn",
      natalPoint: "sun",
      aspect: "square",
      orb: 1.25,
      exactDate: "2026-10-15",
    },
  },
  { id: "I1", statement: "Published interpretation: a role is tested for fit." },
  { id: "D1", statement: "Published domain: identity and direction." },
  { id: "P1", statement: "Published phase: the window is approaching." },
  { id: "T1", statement: "Timing: exact in four days." },
  { id: "E1", statement: "Synthetic positions at high precision." },
];
const input = () => ({
  facts,
  hasEligibleCycles: true,
  tone: "plain",
  depth: "standard",
  suppression: { angles: false, houses: false },
  fallback: {
    headline: "Deterministic headline",
    body: "Deterministic body.",
    prompt: "What do you notice in your day?",
  },
});
const paragraphs = () => [
  {
    text: "Saturn square natal Sun names the contact. The published interpretation describes a role being tested for fit.",
    facts: ["C1", "I1"],
  },
  {
    text: "The contact concerns identity and direction. The domain describes how you name your role.",
    facts: ["C1", "D1"],
  },
  {
    text: "The window is approaching its exact pass. Timing describes the contact rather than a promised event.",
    facts: ["C1", "P1", "T1"],
  },
];
const response = (draft) =>
  Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] });
function diagnostics(output, expected) {
  const d = output.meta.diagnostics;
  assert.ok(d, "Daily diagnostics are attached");
  assert.equal(d.version, 1);
  assert.equal(d.promptVersion, "daily-astro-body-3");
  assert.equal(d.validatorVersion, "daily-reference-2");
  assert.equal(d.gatewayTimeoutMs, 20_000);
  assert.equal(d.model, language.LANGUAGE_MODEL);
  for (const [key, value] of Object.entries(expected)) assert.equal(d[key], value, key);
  if (d.attempted) assert.ok(Number.isInteger(d.durationMs) && d.durationMs >= 0);
  else assert.equal(d.durationMs, null);
  assert.ok(!JSON.stringify(output.meta).includes(sentinel));
  return d;
}
before(async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(
      String(url),
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      "No live network call is permitted",
    );
    calls += 1;
    return responder(url, init);
  };
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false },
  });
  language = await vite.ssrLoadModule("/src/lib/ai/language.server.ts");
});
beforeEach(() => {
  calls = 0;
  process.env.LOVABLE_API_KEY = "synthetic-diagnostics-no-live-key";
  responder = async () => response({ paragraphs: paragraphs() });
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.LOVABLE_API_KEY;
  else process.env.LOVABLE_API_KEY = originalKey;
  await vite?.close();
});

test("accepted daily generation measures one attempt without changing output", async () => {
  const result = await language.generateReadingProse(input());
  diagnostics(result, { outcome: "accepted", attempted: true, code: "accepted", paragraph: null });
  assert.equal(result.meta.mode, "model");
  assert.equal(result.headline, input().fallback.headline);
  assert.equal(result.prompt, input().fallback.prompt);
  assert.equal(
    result.body,
    paragraphs()
      .map((p) => p.text)
      .join("\n\n"),
  );
  assert.equal(calls, 1);
});

test("quiet day is skipped before configuration and is never attempted", async () => {
  delete process.env.LOVABLE_API_KEY;
  const result = await language.generateReadingProse({ ...input(), hasEligibleCycles: false });
  diagnostics(result, { outcome: "skipped", attempted: false, code: "no_cycle", paragraph: null });
  assert.equal(result.meta.reason, "no eligible cycle to write from");
  assert.equal(calls, 0);
});

test("missing configuration is unavailable without a gateway attempt", async () => {
  delete process.env.LOVABLE_API_KEY;
  const result = await language.generateReadingProse(input());
  diagnostics(result, {
    outcome: "unavailable",
    attempted: false,
    code: "not_configured",
    paragraph: null,
  });
  assert.equal(result.meta.reason, "language layer is not configured");
  assert.equal(calls, 0);
});

for (const [status, code] of [
  [429, "rate_limit"],
  [402, "credit"],
  [401, "auth"],
  [403, "auth"],
  [408, "timeout"],
  [504, "timeout"],
  [503, "http"],
])
  test(`gateway HTTP ${status} has a safe closed ${code} code`, async () => {
    let bodyReads = 0;
    responder = async () => ({
      ok: false,
      status,
      text: async () => {
        bodyReads += 1;
        return sentinel;
      },
      json: async () => {
        bodyReads += 1;
        return { error: sentinel };
      },
    });
    const result = await language.generateReadingProse(input());
    diagnostics(result, { outcome: "unavailable", attempted: true, code, paragraph: null });
    assert.equal(bodyReads, 0, "HTTP error bodies are neither inspected nor returned");
    assert.equal(calls, 1);
  });

for (const [name, code] of [
  ["TimeoutError", "timeout"],
  ["AbortError", "timeout"],
  ["TypeError", "network"],
  ["Error", "network"],
])
  test(`gateway ${name} never returns an exception message`, async () => {
    responder = async () => {
      throw Object.assign(new Error(sentinel), { name });
    };
    const result = await language.generateReadingProse(input());
    diagnostics(result, { outcome: "unavailable", attempted: true, code, paragraph: null });
  });

test("malformed envelope JSON does not leak its parse error", async () => {
  responder = async () => new Response(sentinel, { status: 200 });
  diagnostics(await language.generateReadingProse(input()), {
    outcome: "unavailable",
    attempted: true,
    code: "bad_json",
    paragraph: null,
  });
});

test("malformed model JSON does not leak its parse error", async () => {
  responder = async () => Response.json({ choices: [{ message: { content: sentinel } }] });
  diagnostics(await language.generateReadingProse(input()), {
    outcome: "unavailable",
    attempted: true,
    code: "bad_json",
    paragraph: null,
  });
});

test("empty gateway content is unavailable", async () => {
  responder = async () => Response.json({ choices: [{ message: {} }] });
  diagnostics(await language.generateReadingProse(input()), {
    outcome: "unavailable",
    attempted: true,
    code: "empty_response",
    paragraph: null,
  });
});

test("body stream failures are sanitized and classified", async () => {
  responder = async () => ({
    ok: true,
    json: async () => {
      throw new Error(sentinel);
    },
  });
  diagnostics(await language.generateReadingProse(input()), {
    outcome: "unavailable",
    attempted: true,
    code: "network",
    paragraph: null,
  });
});

const rejected = [
  ["shape", () => null, null],
  ["count", () => ({ paragraphs: paragraphs().slice(0, 1) }), null],
  [
    "sentence",
    () => ({ paragraphs: paragraphs().map((p) => ({ ...p, text: "An unfinished thought" })) }),
    1,
  ],
  [
    "length",
    () => ({
      paragraphs: [
        {
          ...paragraphs()[0],
          text: "A " + "word ".repeat(220) + "ends here. Another sentence follows.",
        },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
  ["id", () => ({ paragraphs: paragraphs().map((p) => ({ ...p, facts: ["NOT_SENT"] })) }), 1],
  [
    "coverage",
    () => ({
      paragraphs: paragraphs().map((p) => ({
        ...p,
        text: "This names a calculated contact. A published reference gives context.",
        facts: ["E1"],
      })),
    }),
    null,
  ],
  [
    "safety",
    () => ({
      paragraphs: [
        { ...paragraphs()[0], text: "You must accept it. It will definitely happen." },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
  [
    "suppression",
    () => ({
      paragraphs: [
        { ...paragraphs()[0], text: "Your Ascendant gives direction. This is a second statement." },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
  [
    "placement",
    () => ({
      paragraphs: [
        { ...paragraphs()[0], text: "Your Sun is in Aries. This is a second statement." },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
  [
    "body",
    () => ({
      paragraphs: [
        {
          ...paragraphs()[0],
          text: "Mars square natal Sun is approaching. This is a second statement.",
        },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
  [
    "relation",
    () => ({
      paragraphs: [
        {
          ...paragraphs()[0],
          text: "Saturn trine natal Sun is approaching. This is a second statement.",
        },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
  [
    "worded_degree",
    () => ({
      paragraphs: [
        {
          ...paragraphs()[0],
          text: "Saturn has a ninety-nine degrees orb. This is a second statement.",
        },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
  [
    "orb",
    () => ({
      paragraphs: [
        { ...paragraphs()[0], text: "Saturn has a 99 degrees orb. This is a second statement." },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
  [
    "date",
    () => ({
      paragraphs: [
        { ...paragraphs()[0], text: "Saturn is exact on 2026-10-22. This is a second statement." },
        ...paragraphs().slice(1),
      ],
    }),
    1,
  ],
];
for (const [code, fixture, paragraph] of rejected)
  test(`validator ${code} records a closed rejection without changing fallback`, async () => {
    responder = async () => response(fixture());
    const request = input();
    if (code === "suppression") request.suppression.angles = true;
    const result = await language.generateReadingProse(request);
    diagnostics(result, { outcome: "rejected", attempted: true, code, paragraph });
    assert.equal(result.meta.mode, "template");
    assert.equal(result.body, request.fallback.body);
  });

test("located rejection paragraph is one-based", async () => {
  const fixture = paragraphs();
  fixture[2].text = "An unfinished thought";
  responder = async () => response({ paragraphs: fixture });
  diagnostics(await language.generateReadingProse(input()), {
    outcome: "rejected",
    attempted: true,
    code: "sentence",
    paragraph: 3,
  });
});

test("natal gateway failures also exclude raw status bodies and exception text", async () => {
  responder = async () => ({ ok: false, status: 503, text: async () => sentinel });
  const result = await language.generateFeatureNarrative({
    facts: [{ id: "N1", statement: "Synthetic structure." }],
    title: "Synthetic chapter",
    tone: "plain",
  });
  assert.equal(result.narrative, "");
  assert.ok(!JSON.stringify(result.meta).includes(sentinel));
  assert.equal(result.meta.diagnostics, undefined, "This task instruments daily diagnostics only");
});

test("diagnostic exports and reader validate the exact closed contract", async () => {
  const module = await vite.ssrLoadModule("/src/lib/ai/diagnostics.ts");
  const result = await language.generateReadingProse(input());
  assert.equal(module.DAILY_DIAGNOSTICS_VERSION, 1);
  assert.equal(module.DAILY_PROMPT_VERSION, "daily-astro-body-3");
  assert.equal(module.DAILY_GATEWAY_TIMEOUT_MS, 20_000);
  assert.equal(module.DAILY_VALIDATOR_VERSION, "daily-reference-2");
  assert.ok(module.DAILY_DIAGNOSTIC_CODES.includes("accepted"));
  assert.deepEqual(module.readDailyDiagnostics(result.meta.diagnostics), result.meta.diagnostics);
  for (const invalid of [
    null,
    {},
    { ...result.meta.diagnostics, code: sentinel },
    { ...result.meta.diagnostics, version: 2 },
    { ...result.meta.diagnostics, outcome: "accepted", attempted: false },
    { ...result.meta.diagnostics, durationMs: -1 },
    { ...result.meta.diagnostics, paragraph: 1 },
  ])
    assert.equal(module.readDailyDiagnostics(invalid), null);
  assert.equal(typeof module.dailyDiagnosticLabel("id"), "string");
});

test("diagnostics duration includes a delayed gateway attempt", async () => {
  responder = async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return response({ paragraphs: paragraphs() });
  };
  const d = diagnostics(await language.generateReadingProse(input()), {
    outcome: "accepted",
    attempted: true,
    code: "accepted",
    paragraph: null,
  });
  assert.ok(d.durationMs >= 10);
});

test("diagnostics reader permits safe future labels and removes unknown fields", async () => {
  const { readDailyDiagnostics } = await vite.ssrLoadModule("/src/lib/ai/diagnostics.ts");
  const d = (await language.generateReadingProse(input())).meta.diagnostics;
  const future = {
    ...d,
    promptVersion: "daily-astro-body-3",
    validatorVersion: "daily-reference-2",
    model: "provider/model-next",
    raw: sentinel,
  };
  const parsed = readDailyDiagnostics(future);
  assert.equal(parsed.promptVersion, future.promptVersion);
  assert.equal(parsed.validatorVersion, future.validatorVersion);
  assert.equal(parsed.model, future.model);
  assert.equal(parsed.raw, undefined);
  for (const invalid of [
    { ...d, promptVersion: "unsafe label with spaces" },
    { ...d, validatorVersion: "<raw>" },
    { ...d, model: "line\nbreak" },
    { ...d, durationMs: 120001 },
    { ...d, durationMs: Infinity },
    { ...d, durationMs: 0.5 },
    { ...d, outcome: "unavailable", code: "id" },
    { ...d, outcome: "rejected", code: "timeout" },
    { ...d, outcome: "skipped", code: "no_cycle", attempted: true },
    { ...d, outcome: "rejected", code: "id", paragraph: 0 },
    { ...d, outcome: "rejected", code: "id", paragraph: 101 },
  ])
    assert.equal(readDailyDiagnostics(invalid), null);
});

test("older structured diagnostics keep their measurements with an unrecorded gateway budget", async () => {
  const { readDailyDiagnostics } = await vite.ssrLoadModule("/src/lib/ai/diagnostics.ts");
  const generated = (await language.generateReadingProse(input())).meta.diagnostics;
  const { gatewayTimeoutMs: omitted, ...legacy } = generated;
  void omitted;
  legacy.promptVersion = "daily-astro-body-1";
  const parsed = readDailyDiagnostics(legacy);
  assert.deepEqual(parsed, { ...legacy, gatewayTimeoutMs: null });
  assert.equal(parsed.attempted, true);
  assert.equal(parsed.outcome, "accepted");
  assert.equal(parsed.promptVersion, "daily-astro-body-1", "Do not relabel prior measurements");
});

test("gateway timeout provenance accepts only bounded integer budgets or unrecorded null", async () => {
  const { readDailyDiagnostics, MAX_DAILY_DURATION_MS } = await vite.ssrLoadModule(
    "/src/lib/ai/diagnostics.ts",
  );
  const d = (await language.generateReadingProse(input())).meta.diagnostics;
  for (const budget of [null, 1, 20_000, MAX_DAILY_DURATION_MS]) {
    const parsed = readDailyDiagnostics({ ...d, gatewayTimeoutMs: budget, raw: sentinel });
    assert.equal(parsed.gatewayTimeoutMs, budget);
    assert.equal(parsed.raw, undefined);
  }
  for (const budget of [
    undefined,
    0,
    -1,
    0.5,
    MAX_DAILY_DURATION_MS + 1,
    Infinity,
    NaN,
    "20000",
    sentinel,
    {},
  ])
    assert.equal(readDailyDiagnostics({ ...d, gatewayTimeoutMs: budget }), null);
});

test("response-body timeouts preserve the timeout classification", async () => {
  responder = async () => ({
    ok: true,
    json: async () => {
      throw Object.assign(new Error(sentinel), { name: "TimeoutError" });
    },
  });
  diagnostics(await language.generateReadingProse(input()), {
    outcome: "unavailable",
    attempted: true,
    code: "timeout",
    paragraph: null,
  });
});
