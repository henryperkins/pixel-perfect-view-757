import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h;
before(async () => {
  h = await createRecordsHarness({
    plugins: [
      {
        name: "historical-member-language-policy",
        enforce: "pre",
        transform(code, id) {
          if (id.endsWith("/src/lib/ai/diagnostics.ts"))
            return (
              code.replace(
                "export function memberDailyLanguagePolicy(",
                "function originalMemberDailyLanguagePolicy(",
              ) +
              `
export function memberDailyLanguagePolicy(provider) {
  return { ...originalMemberDailyLanguagePolicy(provider), ...globalThis.__memberPolicyOverride };
}`
            );
          if (id.endsWith("/src/lib/crypto.server.ts")) {
            const signature =
              "export async function keyedFingerprint(userId: string, context: unknown): Promise<string> {";
            assert.ok(code.includes(signature));
            return code.replace(
              signature,
              signature + "\ncontext = globalThis.__memberCacheContext(context);",
            );
          }
        },
      },
    ],
  });
});
beforeEach(async () => {
  await h.reset();
  globalThis.__memberPolicyOverride = {};
  globalThis.__memberCacheContext = (context) => context;
  const e = h.ephemerisModule;
  const day = new Date().toISOString().slice(0, 10);
  const saturn = e.positionOf("saturn", e.toJulianDay(new Date(`${day}T12:00:00Z`)));
  await h.seedChart(h.records(), h.userA, {
    positions: {
      sun: {
        key: "sun",
        label: "Sun",
        lon: saturn.lon,
        sign: e.signOf(saturn.lon),
        degree: e.degreeInSign(saturn.lon),
        house: 1,
        speed: 1,
        retrograde: false,
        angleDependent: false,
      },
    },
  });
  h.setGeminiEnterprise(() => Response.json({ error: {} }, { status: 504 }));
  h.setGateway(() => Response.json({ error: {} }, { status: 504 }));
});
after(async () => {
  delete globalThis.__memberPolicyOverride;
  delete globalThis.__memberCacheContext;
  await h?.close();
});
const today = () => h.app.getToday(h.records(), h.userA, "UTC");
const row = (id) => h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(id);
const diagnostics = (id) => JSON.parse(row(id).language_meta).diagnostics;

test("a pre-migration Flash reading gets a new immutable Argon row without changing saved evidence or feedback", async () => {
  globalThis.__memberPolicyOverride = {
    nativeModel: "gemini-3.8-flash",
    model: "gemini-enterprise/gemini-3.8-flash",
    thinkingLevel: "LOW",
  };
  globalThis.__memberCacheContext = (context) => {
    if (context?.version !== "daily-privacy-3") return context;
    const { memberLanguage: _policy, ...historical } = context;
    return { ...historical, model: "google/gemini-3.8-flash" };
  };
  const first = await today();
  await h.app.submitFeedback(h.records(), h.userA, first.reading.id, 1, []);
  const saved = row(first.reading.id);
  const sources = h.sqlite
    .prepare("SELECT * FROM reading_sources WHERE reading_id=?")
    .all(first.reading.id);
  globalThis.__memberPolicyOverride = {};
  globalThis.__memberCacheContext = (context) => context;
  const current = await today();
  assert.notEqual(current.reading.id, first.reading.id);
  assert.equal(diagnostics(current.reading.id).model, "gemini-enterprise/gemini-4-argon");
  assert.equal(diagnostics(current.reading.id).transport.thinkingLevel, "LOW");
  h.reopen();
  assert.equal((await today()).reading.id, current.reading.id);
  assert.deepEqual(row(first.reading.id), saved);
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM reading_sources WHERE reading_id=?").all(first.reading.id),
    sources,
  );
  assert.equal(
    h.sqlite
      .prepare("SELECT resonance FROM reading_feedback WHERE reading_id=?")
      .get(first.reading.id).resonance,
    1,
  );
  assert.equal(h.geminiEnterpriseRequests.length, 2);
});

test("model, thinking, deadline and provider changes partition Today cache and rollback reuses the correct saved branch", async () => {
  const current = await today();
  const ids = new Set([current.reading.id]);
  for (const override of [
    { nativeModel: "gemini-3.8-flash", model: "gemini-enterprise/gemini-3.8-flash" },
    { thinkingLevel: "HIGH" },
    { gatewayTimeoutMs: 59_000 },
  ]) {
    globalThis.__memberPolicyOverride = override;
    const changed = await today();
    assert.ok(!ids.has(changed.reading.id));
    ids.add(changed.reading.id);
    assert.equal((await today()).reading.id, changed.reading.id);
    const trace = diagnostics(changed.reading.id).transport;
    assert.equal(trace.requestedModel, override.model ?? "gemini-enterprise/gemini-4-argon");
    assert.equal(trace.thinkingLevel, override.thinkingLevel ?? "LOW");
    assert.equal(trace.deadlineMs, override.gatewayTimeoutMs ?? 60_000);
  }
  globalThis.__memberPolicyOverride = {};
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
  const lovable = await today();
  assert.ok(!ids.has(lovable.reading.id));
  assert.equal(diagnostics(lovable.reading.id).transport.provider, "lovable");
  assert.equal(diagnostics(lovable.reading.id).transport.thinkingLevel, null);
  process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
  assert.equal((await today()).reading.id, current.reading.id);
  assert.equal(h.geminiEnterpriseRequests.length, 4);
  assert.equal(h.gatewayRequests.length, 1);
});

test("Today pins the provider before cache calculation even if configuration changes while awaiting storage", async () => {
  globalThis.__memberCacheContext = (context) => {
    if (context?.version === "daily-privacy-3")
      process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "lovable";
    return context;
  };
  const result = await today();
  assert.equal(diagnostics(result.reading.id).transport.provider, "gemini-enterprise");
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});

test("an incompatible direct member thinking option is refused before the gateway and recorder", async () => {
  globalThis.__memberPolicyOverride = { thinkingLevel: "HIGH" };
  const language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  const { prepareSyntheticEvaluationCase } = await h.vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  );
  const { DEFAULT_BUNDLE } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  const { input } = prepareSyntheticEvaluationCase("saturn-square-sun", DEFAULT_BUNDLE);
  await assert.rejects(
    language.generateReadingProse(input, { provider: "lovable" }),
    /require Gemini Enterprise/,
  );
  await assert.rejects(
    language.generateSyntheticMemberReadingProse(input, { provider: "lovable" }),
    /require Gemini Enterprise/,
  );
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});
