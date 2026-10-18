import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

let h, language, packet, revisions, adapter, diagnostics;
before(async () => {
  h = await createRecordsHarness();
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  adapter = await h.vite.ssrLoadModule("/src/lib/ai/member-context-reading.ts");
  packet = await readContextBenchmarks();
  const reviewed = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-reading-context-production/2026-10-17/revision-5/reference-readings.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  revisions = {
    cases: packet.cases.map((benchmark) => ({
      ...benchmark,
      paragraphs: reviewed.cases.find((entry) => entry.id === benchmark.id).paragraphs,
    })),
  };
});
beforeEach(() => h.reset());
after(async () => h?.close());

const response = (paragraphs) =>
  Response.json({ choices: [{ message: { content: JSON.stringify({ paragraphs }) } }] });

// A mode allowlist ignored by production would retain the established writer.
test("an explicitly enabled supported member graph uses the context writer", async () => {
  const benchmark = packet.cases.find((entry) => entry.id === "contact-only");
  const { input } = await contextWritingFixture(h, benchmark);
  process.env.LOVABLE_API_KEY = "test-member-context-key";
  h.setGateway(() => response(benchmark.paragraphs));
  const result = await language.generateReadingProse(input, { contextModes: ["contact-only"] });
  assert.equal(result.meta.diagnostics.promptVersion, "daily-context-body-5");
  assert.equal(result.meta.diagnostics.validatorVersion, "daily-context-reference-5");
  assert.equal(result.meta.mode, "model");
  assert.equal(result.headline, "The task that will not fit");
  assert.equal(h.gatewayRequests.length, 1);
});

// An authored rollout stage must not spend a sixth provider request.
test("authored context mode validates and serves every complete fallback with no request", async () => {
  diagnostics = await h.vite.ssrLoadModule("/src/lib/ai/diagnostics.ts");
  h.setGateway(() => new Response(null, { status: 503 }));
  h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
  for (const benchmark of packet.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const expected = revisions.cases.find((entry) => entry.id === benchmark.id) ?? benchmark;
    const result = await language.generateReadingProse(input, {
      contextModes: packet.cases.map((entry) => entry.id),
      contextRenderMode: "authored",
    });
    assert.equal(result.body, expected.paragraphs.map((paragraph) => paragraph.text).join("\n\n"));
    assert.equal(result.headline, expected.headline);
    assert.equal(result.prompt, expected.reflection);
    assert.equal(result.meta.mode, "template");
    assert.equal(result.meta.model, null);
    assert.equal(result.meta.diagnostics.code, "authored_context");
    assert.equal(result.meta.diagnostics.outcome, "skipped");
    assert.equal(result.meta.diagnostics.attempted, false);
    assert.equal(result.meta.diagnostics.durationMs, null);
    assert.equal(result.meta.writing.candidateQuality.outcome, "not_evaluated");
    assert.notEqual(result.meta.writing.finalQuality.outcome, "reject");
    assert.deepEqual(
      diagnostics.readDailyDiagnostics(result.meta.diagnostics),
      result.meta.diagnostics,
    );
    assert.deepEqual(
      result.meta.citations,
      expected.paragraphs.map(({ facts }, index) => ({ paragraph: index + 1, facts })),
    );
  }
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
});

// Saved reading validation requires the real published inventory even when its paragraphs are authored.
test("runtime writing plans retain complete published primary and synthesis source inventories", async () => {
  for (const benchmark of packet.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const selected = adapter.prepareMemberContextReading(input);
    const expected = [
      {
        factId: "I1",
        sourceKey: "square:saturn:sun",
        sentences: [
          "An established role can feel demanding when its obligations require more deliberate effort than usual.",
          "Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
        ],
      },
    ];
    if (benchmark.id === "synthesis-natal-and-transit")
      expected.push({
        factId: "S1",
        sourceKey: "square:saturn:sun_tension_trine:jupiter:mars",
        sentences: [
          "Giving a plan more scope can increase the structure needed to carry it.",
          "A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.",
        ],
      });
    assert.deepEqual(selected.writing.plan.templateSources, expected, benchmark.id);
  }
});

// Stale source identities must not acquire reviewed material through a familiar fact ID.
test("changed source meaning, release, identity, parents and unsupported graphs decline member preparation", async () => {
  const benchmark = packet.cases.find((entry) => entry.id === "synthesis-natal-and-transit");
  const { input } = await contextWritingFixture(h, benchmark);
  for (const id of ["I1", "I2", "N1", "P2", "S1"]) {
    for (const field of ["statement", "sourceKey"]) {
      const changed = structuredClone(input);
      changed.facts.find((fact) => fact.id === id)[field] +=
        field === "statement" ? " An unreviewed change." : "-changed";
      assert.equal(adapter.prepareMemberContextReading(changed), null, `${id} ${field}`);
    }
  }
  for (const mutate of [
    (value) => {
      for (const fact of value.facts) if (fact.releaseVersion) fact.releaseVersion = "0.10.0";
    },
    (value) => {
      value.facts.find((fact) => fact.id === "N1").dependsOn = ["C1"];
    },
    (value) => {
      value.facts.find((fact) => fact.id === "P2").dependsOn = ["C1", "A1"];
    },
    (value) => {
      value.facts.find((fact) => fact.id === "S1").dependsOn = ["C1", "I1", "C2"];
    },
    (value) => {
      value.facts.find((fact) => fact.id === "C1").cycle.natalPoint = "moon";
    },
    (value) => {
      value.facts.find((fact) => fact.id === "C2").cycle.transitBody = "venus";
    },
    (value) => {
      value.facts = value.facts.filter((fact) => fact.id !== "N1");
    },
    (value) => {
      value.facts = value.facts.filter((fact) => !["A1", "P2"].includes(fact.id));
    },
    (value) => {
      value.tone = "plain";
    },
    (value) => {
      value.tone = "clinical";
    },
    (value) => {
      value.depth = "technical";
    },
    (value) => {
      value.hasEligibleCycles = false;
    },
  ]) {
    const changed = structuredClone(input);
    mutate(changed);
    assert.equal(adapter.memberContextMode(changed), null);
    assert.equal(adapter.prepareMemberContextReading(changed), null);
  }
});

// Default-off and stale selected source handling must resolve before the provider request is built.
test("absent, unknown and nonmatching mode authorizations retain the established writer", async () => {
  const benchmark = packet.cases.find((entry) => entry.id === "contact-only");
  for (const [modes, changed] of [
    [undefined, false],
    [[], false],
    [["unknown"], false],
    [["natal-only"], false],
    [["contact-only"], true],
  ]) {
    const { input } = await contextWritingFixture(h, benchmark);
    if (changed) input.facts.find((fact) => fact.id === "I1").statement += " An unreviewed change.";
    process.env.LOVABLE_API_KEY = "test-member-context-key";
    h.setGateway(() => response(benchmark.paragraphs));
    const result = await language.generateReadingProse(input, { contextModes: modes });
    assert.equal(result.meta.diagnostics.promptVersion, "daily-astro-body-16");
    assert.equal(result.headline, input.fallback.headline);
  }
  assert.equal(h.gatewayRequests.length, 5);
});

// Fixed synthetic geometry would make the writer unusable for a real calculation.
test("member preparation keeps actual measurements and substitutes actual immutable chronology once", async () => {
  const benchmark = packet.cases.find((entry) => entry.id === "synthesis-natal-and-transit");
  const { input } = await contextWritingFixture(h, benchmark);
  const c1 = input.facts.find((fact) => fact.id === "C1");
  c1.cycle.orb = 1.37;
  c1.cycle.exactDate = "2028-07-04";
  c1.statement =
    "transiting saturn square natal sun. Current orb at the reading's calculation time: 1.37 degrees. phase approaching. domain identity. Calculated exact date: 2028-07-04.";
  const c2 = input.facts.find((fact) => fact.id === "C2");
  c2.cycle.orb = 0.71;
  c2.cycle.exactDate = "2028-07-06";
  c2.statement =
    "transiting jupiter trine natal mars. Current orb at the reading's calculation time: 0.71 degrees. phase approaching. domain identity. Calculated exact date: 2028-07-06.";
  const a1 = input.facts.find((fact) => fact.id === "A1");
  const chronology =
    "This is the second of three calculated contacts; the first exact contact falls in March 2028.";
  a1.statement = a1.arc.chronologySentence = chronology;
  a1.arc.dates = ["2028-03-01", "2028-07-04", "2028-11-06"].map((civilDay, index) => ({
    eventId: `pass-${index + 1}`,
    kind: "exact-contact",
    civilDay,
    monthYear: civilDay.slice(0, 7),
  }));
  const original = structuredClone(input);
  const selected = adapter.prepareMemberContextReading(input);
  assert.ok(selected);
  assert.equal(adapter.memberContextMode(input), "synthesis-natal-and-transit");
  assert.deepEqual(
    selected.facts.find((fact) => fact.id === "C1"),
    c1,
  );
  assert.deepEqual(
    selected.facts.find((fact) => fact.id === "C2"),
    c2,
  );
  assert.deepEqual(
    selected.facts.find((fact) => fact.id === "A1"),
    a1,
  );
  assert.equal(selected.fallback.body.split(chronology).length - 1, 1);
  assert.ok(!selected.fallback.body.includes(benchmark.chronology));
  assert.ok(!selected.fallback.body.includes("{{A1_CHRONOLOGY}}"));
  assert.deepEqual(adapter.prepareMemberContextReading(selected), selected);
  h.setGateway(() => response(selected.writing.template.paragraphs));
  const result = await language.generateSyntheticMemberReadingProse(input, "lovable", {}, [
    "synthesis-natal-and-transit",
  ]);
  assert.equal(result.prose.meta.mode, "model");
  assert.equal(result.prose.body, selected.fallback.body);
  assert.ok(
    result.request.messages.find((message) => message.role === "user").content.includes(chronology),
  );
  assert.deepEqual(input, original);
});

// Member and pilot output must use the same reviewed fallback rather than immutable benchmark bodies.
test("each synthetic member mode uses the production adapter and captures the raw candidate", async () => {
  for (const benchmark of packet.cases) {
    const { input } = await contextWritingFixture(h, benchmark);
    const expected = revisions.cases.find((entry) => entry.id === benchmark.id) ?? benchmark;
    h.setGateway(() => response(expected.paragraphs));
    const result = await language.generateSyntheticMemberReadingProse(input, "lovable", {}, [
      benchmark.id,
    ]);
    assert.equal(result.prose.meta.mode, "model", benchmark.id);
    assert.equal(
      result.prose.body,
      expected.paragraphs.map((paragraph) => paragraph.text).join("\n\n"),
    );
    assert.equal(result.prose.meta.diagnostics.promptVersion, "daily-context-body-5");
    assert.equal(result.candidate.captureLossless, true);
    assert.equal(result.candidate.truncated, false);
    assert.deepEqual(result.candidate.paragraphs, expected.paragraphs);
    assert.ok(result.request);
  }
  assert.equal(h.gatewayRequests.length, 5);
});

// A rejected model draft may not remove selected context or lose the local-source boundary.
test("lost context or dropped qualifiers reject once and restore the complete member fallback", async () => {
  for (const [id, remove, code] of [
    ["natal-and-transit", "N1", "natal_coverage"],
    ["natal-and-transit", "P2", "arc_coverage"],
    ["contact-only", "qualifier", "editorial_claim"],
  ]) {
    const benchmark = packet.cases.find((entry) => entry.id === id);
    const expected = revisions.cases.find((entry) => entry.id === id) ?? benchmark;
    const { input } = await contextWritingFixture(h, benchmark);
    const paragraphs = structuredClone(expected.paragraphs);
    if (remove === "qualifier")
      paragraphs[1].text =
        "An established role feels demanding when its obligations require more deliberate effort than usual.";
    else
      for (const paragraph of paragraphs)
        paragraph.facts = paragraph.facts.filter((fact) => fact !== remove);
    h.setGateway(() => response(paragraphs));
    const before = h.gatewayRequests.length;
    const result = await language.generateSyntheticMemberReadingProse(input, "lovable", {}, [id]);
    assert.equal(result.prose.meta.mode, "template");
    assert.equal(result.prose.meta.diagnostics.code, code);
    assert.equal(
      result.prose.body,
      expected.paragraphs.map((paragraph) => paragraph.text).join("\n\n"),
    );
    assert.equal(h.gatewayRequests.length - before, 1);
  }
});

// A provider failure must not trigger fallback routing through a second provider.
test("member and synthetic member paths retain single-provider one-attempt failure behavior", async () => {
  const benchmark = packet.cases.find((entry) => entry.id === "contact-only");
  const expected = revisions.cases.find((entry) => entry.id === "contact-only");
  h.setGateway(() => new Response(null, { status: 503 }));
  h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
  for (const provider of ["lovable", "gemini-enterprise"]) {
    const { input } = await contextWritingFixture(h, benchmark);
    process.env.LOVABLE_API_KEY = "test-member-context-key";
    process.env.GEMINI_ENTERPRISE_API_KEY = "test-member-context-key";
    process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = provider;
    const output = await language.generateReadingProse(input, { contextModes: ["contact-only"] });
    assert.equal(output.body, expected.paragraphs.map((paragraph) => paragraph.text).join("\n\n"));
    assert.equal(output.meta.diagnostics.code, "http");
    assert.equal(output.meta.diagnostics.attempted, true);
    const captured = await language.generateSyntheticMemberReadingProse(input, provider, {}, [
      "contact-only",
    ]);
    assert.equal(captured.prose.meta.diagnostics.code, "http");
    assert.equal(captured.candidate, null);
    assert.ok(captured.request);
  }
  assert.equal(h.gatewayRequests.length, 2);
  assert.equal(h.geminiEnterpriseRequests.length, 2);
});

// Local prose, recent history and reviewed fallback bodies must never become model input.
test("member provider boundary exposes only selected source-bound material and chronology", async () => {
  const benchmark = packet.cases.find((entry) => entry.id === "natal-and-transit");
  const { input } = await contextWritingFixture(h, benchmark);
  input.facts.push({ id: "X1", statement: "PRIVATE LOCAL NOTE" });
  input.fallback.body = "PRIVATE LEGACY BODY";
  input.writing = {
    recent: [
      { day: "2026-12-16", paragraphs: ["PRIVATE RECENT BODY"], requiredLiteralSentences: [] },
    ],
  };
  const original = structuredClone(input);
  h.setGateway(() => response(benchmark.paragraphs));
  const result = await language.generateSyntheticMemberReadingProse(input, "lovable", {}, [
    "natal-and-transit",
  ]);
  const user = result.request.messages.find((message) => message.role === "user").content;
  assert.doesNotMatch(
    user,
    /PRIVATE|Published interpretation|Published natal lens|Published transit chapter/,
  );
  assert.ok(!user.includes(benchmark.headline));
  assert.ok(!user.includes(benchmark.reflection));
  for (const paragraph of benchmark.paragraphs) assert.ok(!user.includes(paragraph.text));
  const brief = JSON.parse(user.split("\n").find((line) => line.startsWith('{"version":')));
  assert.deepEqual([...new Set(brief.claims.flatMap((claim) => claim.cite))].sort(), [
    "A1",
    "C1",
    "I1",
    "N1",
    "P2",
  ]);
  // The chapter's one wording also carries the natal note, so it cites N1 as well.
  assert.deepEqual(brief.claims.find((claim) => claim.cite[0] === "P2").cite, [
    "P2",
    "C1",
    "I1",
    "A1",
    "N1",
  ]);
  assert.deepEqual(input, original);
});

// A bad authored fallback must be detected before a paid request or an authored rendering.
test("member fallback source validation runs before either render mode can request a provider", async () => {
  const isolated = await createRecordsHarness({
    plugins: [
      {
        name: "invalid-member-fallback-source",
        enforce: "pre",
        async load(id) {
          if (!id.endsWith("/src/lib/ai/member-context-readings.json")) return null;
          const data = JSON.parse(await readFile(id, "utf8"));
          data.cases.find((entry) => entry.id === "contact-only").paragraphs[0].facts = ["I1"];
          return JSON.stringify(data);
        },
      },
    ],
  });
  try {
    const boundary = await isolated.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
    const benchmark = packet.cases.find((entry) => entry.id === "contact-only");
    const { input } = await contextWritingFixture(isolated, benchmark);
    process.env.LOVABLE_API_KEY = "test-member-context-key";
    isolated.setGateway(() => response(benchmark.paragraphs));
    for (const contextRenderMode of ["model", "authored"])
      await assert.rejects(
        boundary.generateReadingProse(input, {
          contextModes: ["contact-only"],
          contextRenderMode,
        }),
        /Required template failed/,
      );
    assert.equal(isolated.gatewayRequests.length, 0);
    assert.equal(isolated.geminiEnterpriseRequests.length, 0);
  } finally {
    await isolated.close();
  }
});
