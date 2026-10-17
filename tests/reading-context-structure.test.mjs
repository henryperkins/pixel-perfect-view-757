import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import {
  bodyPremises,
  premiseLocations,
  requestUnits,
  sourceOfPremise,
} from "./helpers/context-premises.mjs";
import {
  contextWritingFixture,
  readContextBenchmarks,
} from "./helpers/context-writing-fixture.mjs";

const REVIEW = "../docs/reviews/daily-reading-context-production/2026-10-17";
const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const joined = (paragraphs) => paragraphs.map((paragraph) => paragraph.text).join("\n\n");
let h, plans, evaluation, language, adapter, claims, packet, plan, references, edits;
before(async () => {
  h = await createRecordsHarness();
  plans = await h.vite.ssrLoadModule("/src/lib/ai/context-pilot-plan.server.ts");
  evaluation = await h.vite.ssrLoadModule("/src/lib/ai/reading-evaluation.server.ts");
  language = await h.vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  adapter = await h.vite.ssrLoadModule("/src/lib/ai/member-context-reading.ts");
  claims = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-claims.ts");
  packet = await readContextBenchmarks();
  plan = plans.createContextPilotPlan("b".repeat(40), "gemini-enterprise");
  references = (await readJson(`${REVIEW}/revision-5/reference-readings.json`)).cases;
  edits = (await readJson(`${REVIEW}/revision-5/edited-failures.json`)).cases;
});
beforeEach(async () => h.reset());
after(async () => h?.close());

const enterprise = (paragraphs) =>
  h.setGeminiEnterprise(() =>
    Response.json({
      modelVersion: "gemini-3.8-flash",
      candidates: [
        { finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ paragraphs }) }] } },
      ],
    }),
  );
// The exact frozen pilot path: member adapter, writer and Gemini Enterprise transport.
const pilotCase = (id) =>
  evaluation.runSyntheticEvaluationCase(
    id,
    plan.contextPilot.candidate,
    "gemini-enterprise",
    undefined,
    { boundedQualification: true },
    "daily-context-1",
  );
const wireMessages = (wire) => ({
  system: wire.systemInstruction.parts.map((part) => part.text).join(""),
  user: wire.contents[0].parts.map((part) => part.text).join(""),
});

// The fourth pilot sent up to nine separate wordings of one premise across
// instructions, summaries, scenes, distinctions and directions.
test("every intercepted production request words each selected premise once, inside its claim", async () => {
  for (const frozen of plan.cases) {
    h.setGeminiEnterprise(() => new Response(null, { status: 503 }));
    const before = h.geminiEnterpriseRequests.length;
    await pilotCase(frozen.id);
    assert.equal(h.geminiEnterpriseRequests.length, before + 1, frozen.id);
    const { system, user } = wireMessages(h.geminiEnterpriseRequests.at(-1));
    const selected = new Set(frozen.facts.map((fact) => fact.id));
    const locations = premiseLocations(requestUnits(system, user));
    assert.ok(Object.keys(locations).length >= 4, frozen.id);
    for (const [premise, paths] of Object.entries(locations)) {
      assert.equal(paths.length, 1, `${frozen.id}: ${premise} at ${paths.join(", ")}`);
      assert.match(paths[0], /^brief\.claims\[\d+\]\.write$/, `${frozen.id}: ${premise}`);
      assert.ok(selected.has(sourceOfPremise(premise)), `${frozen.id}: unselected ${premise}`);
    }
    const brief = JSON.parse(user.split("\n").find((line) => line.startsWith('{"version":')));
    for (const claim of brief.claims.filter((item) => item.write))
      assert.equal((system + user).split(claim.write).length - 1, 1);

    // The member Today route sends the same messages through the same adapter.
    const benchmark = packet.cases.find((item) => item.id === frozen.id);
    const { input } = await contextWritingFixture(h, benchmark);
    process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER = "gemini-enterprise";
    try {
      await language.generateReadingProse(input, {
        contextModes: plan.contextPilot.allowedModes,
        contextRenderMode: "model",
      });
    } finally {
      delete process.env.PATTERN_MEMBER_LANGUAGE_PROVIDER;
    }
    assert.deepEqual(wireMessages(h.geminiEnterpriseRequests.at(-1)), { system, user });
  }
  assert.equal(h.gatewayRequests.length, 0);
});

// Guards the instrument itself: weakening the premise signatures would hide the
// repetition recorded in the saved fourth-pilot requests.
test("the saved fourth-pilot requests fail the single-wording rule", async () => {
  for (const file of [
    "01-contact-only.json",
    "02-natal-only.json",
    "03-transit-only.json",
    "04-natal-and-transit.json",
  ]) {
    const { messages } = (await readJson(`${REVIEW}/revision-4/pilot/${file}`)).case.request;
    const locations = premiseLocations(requestUnits(messages[0].content, messages[1].content));
    assert.ok(locations["I1.capacity"].length >= 8, file);
    assert.ok(locations["I1.boundary"].length >= 6, file);
    assert.ok(locations["P2.adjustment"].length >= 2, `${file}: chapter wording sent regardless`);
  }
});

// A material edit that drops, duplicates or under-cites a claim must not reach
// a provider; the member route then keeps the established writer.
test("an incomplete or inconsistent composition fails closed before any provider request", async () => {
  const mutations = [
    (data) => {
      const entries = data.compositions[0].entries;
      entries.splice(
        entries.findIndex((entry) => entry.carries.includes("I1.capacity")),
        1,
      );
    },
    (data) => {
      const entries = data.compositions[0].entries;
      entries.find((entry) => entry.carries.includes("I1.boundary")).carries.push("I1.capacity");
    },
    (data) => {
      const entry = data.compositions[2].entries.find((item) =>
        item.carries.includes("P2.adjustment"),
      );
      entry.cite = entry.cite.filter((id) => id !== "A1");
    },
    (data) => {
      data.compositions[0].entries[1].keep = ["might"];
    },
  ];
  const ids = ["contact-only", "contact-only", "transit-only", "contact-only"];
  for (const [index, mutate] of mutations.entries()) {
    const isolated = await createRecordsHarness({
      plugins: [
        {
          name: "inconsistent-context-composition",
          enforce: "pre",
          async load(id) {
            if (!id.endsWith("/src/lib/ai/context-writing-material.json")) return null;
            const data = JSON.parse(await readFile(id, "utf8"));
            mutate(data);
            return JSON.stringify(data);
          },
        },
      ],
    });
    try {
      const brief = await isolated.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
      const member = await isolated.vite.ssrLoadModule("/src/lib/ai/member-context-reading.ts");
      const benchmark = packet.cases.find((item) => item.id === ids[index]);
      const { input } = await contextWritingFixture(isolated, benchmark);
      assert.throws(
        () => brief.toDailyContextBrief(input.facts, "warm", "standard"),
        /composition is incomplete or inconsistent/,
      );
      assert.equal(member.memberContextMode(input), null);
      assert.equal(isolated.gatewayRequests.length + isolated.geminiEnterpriseRequests.length, 0);
    } finally {
      await isolated.close();
    }
  }
});

test("a source graph with no reviewed composition keeps the established member writer", async () => {
  const benchmark = packet.cases.find((item) => item.id === "synthesis-natal-and-transit");
  const { input } = await contextWritingFixture(h, benchmark);
  const removed = new Set(["A1", "P2"]);
  input.facts = input.facts.filter((fact) => !removed.has(fact.id));
  for (let changed = true; changed;) {
    changed = false;
    for (const fact of input.facts)
      if (fact.dependsOn?.some((id) => removed.has(id)) && !removed.has(fact.id)) {
        removed.add(fact.id);
        changed = true;
      }
    input.facts = input.facts.filter((fact) => !removed.has(fact.id));
  }
  const brief = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
  assert.throws(
    () => brief.toDailyContextBrief(input.facts, "warm", "standard"),
    /No reviewed context composition/,
  );
  assert.equal(adapter.memberContextMode(input), null);
  process.env.LOVABLE_API_KEY = "test-member-context-key";
  h.setGateway(() => new Response(null, { status: 503 }));
  const result = await language.generateReadingProse(input, {
    contextModes: plan.contextPilot.allowedModes,
  });
  assert.notEqual(result.meta.diagnostics.promptVersion, "daily-context-body-5");
  assert.equal(h.gatewayRequests.length, 1);
});

// Today previews sources before the transit service adds A1/P2, so the pre-transit
// synthesis graph has no composition yet. Using the full brief there would switch
// the reviewed synthesis mode off for every member.
test("the Today preview checks reviewed sources before transit context completes the graph", async () => {
  const brief = await h.vite.ssrLoadModule("/src/lib/ai/daily-context-writing.ts");
  const benchmark = packet.cases.find((item) => item.id === "synthesis-natal-and-transit");
  const { input } = await contextWritingFixture(h, benchmark);
  const preTransit = brief
    .selectDailyContextFacts(input.facts)
    .filter((fact) => fact.id !== "A1" && fact.id !== "P2");
  assert.doesNotThrow(() => brief.assertReviewedContextSources(preTransit));
  assert.throws(
    () => brief.toDailyContextBrief(preTransit, "warm", "standard"),
    /No reviewed context composition/,
  );
  assert.doesNotThrow(() => brief.toDailyContextBrief(input.facts, "warm", "standard"));
  const changed = structuredClone(preTransit);
  changed.find((fact) => fact.id === "N1").statement += " Another meaning.";
  assert.throws(() => brief.assertReviewedContextSources(changed), /does not match source N1/);
});

// The authored examples are what the brief asks for; the saved failures are what it replaced.
test("authored reference and edited readings pass the production gate and state each premise once", async () => {
  const examples = [
    ...references.map((item) => ({ id: item.id, paragraphs: item.paragraphs })),
    ...edits.map((item) => ({ id: item.id, paragraphs: item.edited.paragraphs })),
  ];
  for (const example of examples) {
    enterprise(example.paragraphs);
    const result = await pilotCase(example.id);
    assert.equal(
      result.case.output.mode,
      "model",
      `${example.id}: ${result.case.diagnostics.code}`,
    );
    assert.equal(result.case.output.body, joined(example.paragraphs));
    assert.deepEqual(
      result.case.output.citations,
      example.paragraphs.map(({ facts }, index) => ({ paragraph: index + 1, facts })),
    );
    for (const [premise, at] of Object.entries(bodyPremises(joined(example.paragraphs))))
      assert.equal(at.length, 1, `${example.id}: ${premise} in sentences ${at.join(", ")}`);
  }
  for (const item of edits) {
    const repeated = Object.values(bodyPremises(joined(item.original.paragraphs))).filter(
      (at) => at.length > 1,
    );
    assert.ok(repeated.length, `${item.blindLabel} restates a premise in the saved capture`);
  }
  assert.equal(h.geminiEnterpriseRequests.length, examples.length);
});

test("the versioned edits leave the saved captures and their review hashes intact", async () => {
  const qualification = await readJson(`${REVIEW}/revision-4/pilot/qualification.json`);
  for (const item of edits) {
    const bytes = await readFile(new URL(`../${item.original.capture}`, import.meta.url));
    const expected = qualification.cases.find((entry) => entry.id === item.id);
    assert.equal(sha256(bytes), expected.captureSha256);
    assert.equal(item.original.captureSha256, expected.captureSha256);
    assert.equal(sha256(joined(item.original.paragraphs)), expected.bodySha256);
    assert.notEqual(item.edited.bodySha256, expected.bodySha256);
  }
});

// The contact-only failure stated its full-afternoon condition twice.
test("a restated source condition rejects once and serves the authored member fallback", async () => {
  const saved = edits.find((item) => item.blindLabel === "R3");
  const frozen = plan.cases.find((item) => item.id === "contact-only");
  enterprise(saved.original.paragraphs);
  const result = await pilotCase("contact-only");
  assert.equal(result.case.output.mode, "template");
  assert.equal(result.case.diagnostics.code, "writing_quality");
  assert.equal(result.case.diagnostics.outcome, "rejected");
  assert.equal(result.case.output.body, frozen.template.body);
  assert.equal(result.case.candidate.captureLossless, true);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});

test("every authored fallback, benchmark and reviewed revision states each condition once", async () => {
  const revisions = await readJson(
    "../docs/reviews/daily-reading-context-writer/2026-10-17/voice-qualifiers-3/revised-readings.json",
  );
  const fallbacks = await readJson("../src/lib/ai/member-context-readings.json");
  for (const benchmark of packet.cases) {
    const facts = benchmark.selectedSources;
    for (const paragraphs of [
      benchmark.paragraphs,
      fallbacks.cases.find((item) => item.id === benchmark.id).paragraphs,
      revisions.cases.find((item) => item.id === benchmark.id)?.paragraphs ?? [],
      references.find((item) => item.id === benchmark.id).paragraphs,
    ])
      assert.equal(
        claims.dailyContextRepeatProblem(
          paragraphs.map((p) => p.text.replace("{{A1_CHRONOLOGY}}", benchmark.chronology ?? "")),
          facts,
        ),
        null,
        benchmark.id,
      );
  }
  const contact = packet.cases.find((item) => item.id === "contact-only").selectedSources;
  assert.match(
    claims.dailyContextRepeatProblem(
      edits.find((item) => item.blindLabel === "R3").original.paragraphs.map((p) => p.text),
      contact,
    ),
    /restates a supplied source condition/,
  );
  assert.equal(
    claims.dailyContextRepeatProblem(
      ["If it fills the whole afternoon, the check needs hours. It fills the whole afternoon."],
      contact.map((fact) => (fact.id === "I1" ? { ...fact, releaseVersion: "0.9.1" } : fact)),
    ),
    null,
    "the bounded check applies only to the reviewed release",
  );
});

// The fourth pilot's timeout cause is unknown; this revision leaves the policy alone.
test("a provider timeout keeps one request, the 60-second deadline and no provider failover", async () => {
  const benchmark = packet.cases.find((item) => item.id === "natal-and-transit");
  const frozen = plan.cases.find((item) => item.id === benchmark.id);
  h.setGeminiEnterprise(() => {
    throw Object.assign(new Error("controlled deadline"), { name: "TimeoutError" });
  });
  h.setGateway(() => Response.json({ choices: [] }));
  const result = await pilotCase(benchmark.id);
  assert.equal(result.case.diagnostics.code, "timeout");
  assert.equal(result.case.diagnostics.outcome, "unavailable");
  assert.equal(result.case.diagnostics.gatewayTimeoutMs, 60_000);
  assert.equal(result.metadata.gatewayTimeoutMs, 60_000);
  assert.equal(result.case.transport.deadlineMs, 60_000);
  assert.equal(result.case.output.body, frozen.template.body);
  assert.equal(h.geminiEnterpriseRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});
