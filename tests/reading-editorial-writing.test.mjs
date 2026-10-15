import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "vite";

let vite, writing, template, reflection, voice, prepare, candidate, language, storage;
const oldFetch = globalThis.fetch;
before(async () => {
  globalThis.fetch = () => {
    throw Error("Editorial writing tests forbid external requests.");
  };
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  writing = await vite.ssrLoadModule("/src/lib/content/daily-writing.ts");
  template = await vite.ssrLoadModule("/src/lib/content/daily-writing-template.ts");
  reflection = await vite.ssrLoadModule("/src/lib/content/daily-reflection.ts");
  voice = await vite.ssrLoadModule("/src/lib/ai/daily-voice.ts");
  ({ prepareSyntheticEvaluationCase: prepare } = await vite.ssrLoadModule(
    "/src/lib/ai/reading-evaluation.server.ts",
  ));
  ({ EDITORIAL_CANDIDATE_BUNDLE: candidate } = await vite.ssrLoadModule(
    "/src/lib/content/editorial-candidate-bundle.ts",
  ));
  language = await vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  storage = await vite.ssrLoadModule("/src/lib/content/daily-writing-storage.server.ts");
});
after(async () => {
  await vite?.close();
  globalThis.fetch = oldFetch;
});

const entry = {
  key: "editorial-reply",
  source: { kind: "interpretation", key: "conjunction:mercury:mercury" },
  cycleKeys: ["mercury_conjunction_mercury"],
  writingMaterial: {
    meaning: "Making a sentence kinder and making its meaning smaller are different things.",
    scene: "A question can become a suggestion in a reply.",
    imagery: "Mercury meeting natal Mercury is like a messenger rereading the original note.",
    direction: "A plain sentence can sit beside a reply while its wording changes.",
    reflection: "Directness and kindness can belong together.",
  },
  constraints: ["Do not assume an exchange happened or supply another person's response."],
  headline: "When the point gets edited out",
  reflection: "When is directness the kinder choice?",
  fallbackParagraphs: [
    "A question can become a suggestion in a reply. Making a sentence kinder and making its meaning smaller are different things.",
    "Mercury meeting natal Mercury is like a messenger rereading the original note. A plain sentence can sit beside a reply while its wording changes.",
  ],
};
const selected = (quiet = false) => ({
  version: "daily-editorial-1",
  releaseVersion: "editorial-test-1",
  mode: quiet ? "quiet" : "contact",
  entry: quiet
    ? {
        key: "ordinary-detail",
        writingMaterial: { ...entry.writingMaterial, imagery: null },
        constraints: ["An ordinary invitation supplies no astrological meaning."],
        headline: "A detail without a message",
        reflection: "What do you miss when looking for an answer?",
        fallbackParagraphs: [
          "A bright thread in a dark coat can catch your eye.",
          "A detail can be worth a second look without becoming a message.",
        ],
      }
    : structuredClone(entry),
  requiredFacts: quiet ? [] : ["C1", "I1"],
});
const plan = (quiet = false) => ({
  version: "daily-concrete-writing-1",
  releaseVersion: "editorial-test-1",
  theme: quiet
    ? null
    : {
        factId: "I1",
        sourceKey: entry.source.key,
        relationship: null,
        requiredFacts: ["C1", "I1"],
      },
  status: quiet ? "no_primary" : "no_frame",
  frame: null,
  scenes: [],
  templateSources: [],
  editorial: selected(quiet),
});
const context = {
  granted: new Set(),
  tone: "warm",
  depth: "standard",
  localBucket: null,
  checkIn: null,
  wellness: null,
};

test("candidate fallback and independent reflection use the exact selected authored material", () => {
  for (const quiet of [false, true]) {
    const p = plan(quiet);
    const result = template.composeDailyWritingTemplate(p, { lens: null }, { status: "omitted" });
    assert.deepEqual(
      result.paragraphs.map((paragraph) => paragraph.text),
      p.editorial.entry.fallbackParagraphs,
    );
    assert.deepEqual(
      result.paragraphs.map((paragraph) => paragraph.facts),
      result.paragraphs.map(() => p.editorial.requiredFacts),
    );
    assert.ok(result.paragraphs.every((paragraph) => paragraph.scenes.length === 0));
    assert.equal(result.renderMode, quiet ? "quiet" : "unframed");
    const question = reflection.resolveDailyReflection(p, "Which legacy detail matters?", context);
    assert.equal(question.question, p.editorial.entry.reflection);
    assert.equal(question.frameKey, p.editorial.entry.key);
    assert.equal(question.localSource, null);
  }
});

test("candidate provider material excludes headline, reflection question, fallback and catalogue evidence", () => {
  const p = plan();
  const brief = writing.toDailyWritingBrief(p);
  assert.deepEqual(brief.editorial.writingMaterial, p.editorial.entry.writingMaterial);
  assert.deepEqual(brief.editorial.constraints, p.editorial.entry.constraints);
  for (const privateCopy of [entry.headline, entry.reflection, entry.fallbackParagraphs.join(" ")])
    assert.ok(!JSON.stringify(brief).includes(privateCopy));
  delete p.editorial;
  assert.deepEqual(writing.toDailyWritingBrief(p), {
    themeFactId: "I1",
    requiredFacts: ["C1", "I1"],
    scenes: [],
  });
});

test("observational candidate voice permits supported optional direction without changing legacy policy", () => {
  assert.equal(typeof voice.dailyEditorialVoice, "function");
  assert.match(voice.dailyEditorialVoice(), /optional direction/i);
  assert.match(voice.dailyEditorialSystemVoice(false), /constraints/i);
  assert.doesNotMatch(voice.dailyEditorialSystemVoice(false), /predict, instruct/);
  assert.match(voice.DAILY_SYSTEM_VOICE, /predict, instruct/);
  assert.doesNotMatch(voice.dailyEditorialVoice(), /Prefer 'offers a way to read'/);
});

const caseIds = [
  "writing-reply-scene",
  "venus-opposition-venus",
  "synthesis-tension",
  "jupiter-trine-sun-technical",
  "fallback-hard-neptune-mercury",
  "quiet-threshold",
];
const prepared = (id) => prepare(id, candidate, undefined, "daily-editorial-1");
async function mockGeneration(input, raw) {
  const fetch = globalThis.fetch;
  const key = process.env.LOVABLE_API_KEY;
  const requests = [];
  process.env.LOVABLE_API_KEY = "editorial-offline-fixture-only";
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://ai.gateway.lovable.dev/v1/chat/completions");
    assert.equal(init.headers.Authorization, "Bearer editorial-offline-fixture-only");
    requests.push(JSON.parse(init.body));
    return Response.json({ choices: [{ message: { content: JSON.stringify(raw) } }] });
  };
  try {
    return { ...(await language.generateSyntheticReadingProse(input)), requests };
  } finally {
    globalThis.fetch = fetch;
    if (key === undefined) delete process.env.LOVABLE_API_KEY;
    else process.env.LOVABLE_API_KEY = key;
  }
}

test("the six selected sources reach exact fallback/headline/reflection and accept supported optional direction", async () => {
  for (const id of caseIds) {
    const p = prepared(id),
      selected = p.assembled.writingPlan.editorial;
    assert.ok(selected, id);
    assert.equal(p.assembled.headline, selected.entry.headline);
    assert.equal(p.assembled.prompt, selected.entry.reflection);
    assert.equal(p.assembled.astroBody, selected.entry.fallbackParagraphs.join("\n\n"));
    const result = await mockGeneration(p.input, {
      paragraphs: p.input.writing.template.paragraphs,
    });
    assert.equal(result.prose.body, p.assembled.astroBody, id);
    assert.equal(
      result.prose.meta.mode,
      id === "quiet-threshold" ? "template" : "model",
      `${id}: ${result.prose.meta.diagnostics.code}`,
    );
    assert.equal(result.requests.length, id === "quiet-threshold" ? 0 : 1);
    assert.equal(result.prose.meta.diagnostics.promptVersion, voice.EDITORIAL_DAILY_PROMPT_VERSION);
    if (id === "quiet-threshold") {
      assert.equal(result.request, null);
      assert.ok(!p.facts.some((fact) => /^(?:C|I|S)\d/.test(fact.id)));
      assert.deepEqual(result.prose.meta.citations, []);
    } else {
      const system = result.request.messages.find((message) => message.role === "system").content;
      const prompt = result.request.messages.find((message) => message.role === "user").content;
      assert.match(system, /Supported optional direction/);
      assert.doesNotMatch(system, /predict, instruct/);
      assert.match(prompt, /writingMaterial/);
      assert.match(prompt, /constraints/);
      assert.ok(!prompt.includes(selected.entry.headline));
      assert.ok(!prompt.includes(selected.entry.reflection));
    }
  }
});

test("candidate factual and personal-event failures reject once and return the selected authored fallback", async () => {
  const p = prepared("writing-reply-scene");
  for (const [text, expectedCode] of [
    ["Mercury is square your natal Mercury.", "relation"],
    ["You ignored the reply yesterday.", "editorial_claim"],
    ["You must send this reply now.", "safety"],
  ]) {
    const raw = structuredClone({ paragraphs: p.input.writing.template.paragraphs });
    raw.paragraphs[1].text = text;
    const result = await mockGeneration(p.input, raw);
    assert.equal(result.requests.length, 1);
    assert.equal(result.prose.meta.mode, "template");
    assert.equal(result.prose.meta.diagnostics.code, expectedCode);
    assert.equal(result.prose.body, p.assembled.astroBody);
  }
  const p4 = prepared("jupiter-trine-sun-technical");
  for (const possessive of ["'s", "’s"]) {
    const wrongAspect = structuredClone({ paragraphs: p4.input.writing.template.paragraphs });
    wrongAspect.paragraphs[0].text = `Jupiter${possessive} sextile to your natal Sun is a wider frame around a familiar self-portrait.`;
    const rejected = await mockGeneration(p4.input, wrongAspect);
    assert.equal(rejected.prose.meta.diagnostics.code, "relation", possessive);
    assert.equal(rejected.prose.meta.mode, "template");
    assert.equal(rejected.requests.length, 1);
  }
  const raw = structuredClone({ paragraphs: p4.input.writing.template.paragraphs });
  raw.paragraphs[1].text =
    p4.assembled.writingPlan.editorial.entry.writingMaterial.direction.replace(
      "can leave",
      "leaves",
    );
  const result = await mockGeneration(p4.input, raw);
  assert.equal(result.prose.meta.diagnostics.code, "editorial_claim");
});

test("every candidate synthesis paragraph retains its selected relationship and secondary parent facts", async () => {
  const p = prepared("synthesis-tension");
  for (const [index, facts] of [
    [1, ["C1", "I1", "C2", "I2"]],
    [2, ["S1", "C1", "I1", "I2"]],
    [2, ["C1", "I1"]],
  ]) {
    const raw = structuredClone({ paragraphs: p.input.writing.template.paragraphs });
    raw.paragraphs[index].facts = facts;
    const result = await mockGeneration(p.input, raw);
    assert.equal(result.prose.meta.mode, "template", JSON.stringify(facts));
    assert.equal(result.prose.meta.diagnostics.code, "dependencies");
    assert.equal(result.requests.length, 1);
    assert.equal(result.prose.body, p.assembled.astroBody);
  }
});

test("saved editorial source identity and independently selected questions reject tampering", async () => {
  for (const id of ["writing-reply-scene", "synthesis-tension", "quiet-threshold"]) {
    const p = prepared(id);
    const { prose } = await mockGeneration(p.input, { paragraphs: [] });
    const selected = p.assembled.writingPlan.editorial;
    const saved = {
      version: 1,
      readingId: "reading-1",
      snapshotId: "snapshot-1",
      releaseVersion: candidate.version,
      primaryCycleKey: p.assembled.primary_cycle_key,
      plan: p.assembled.writingPlan,
      ...prose.meta.writing,
      reflection: p.assembled.reflectionPlan,
      legacySourceQuestion: null,
      effectiveTimezone: "UTC",
      astroParagraphCount: prose.paragraphs.length,
      historyAvailability: { status: "available", inspected: 0, retainedDays: 0, omissions: [] },
    };
    const row = {
      id: saved.readingId,
      snapshot_id: saved.snapshotId,
      reading_date: "2026-10-11",
      release_version: candidate.version,
      primary_cycle_key: saved.primaryCycleKey,
      headline: prose.headline,
      language_mode: prose.meta.mode,
      language_meta: {
        astroParagraphCount: prose.paragraphs.length,
        dailyEditorialDigest: storage.dailyEditorialDigest(selected),
      },
    };
    assert.deepEqual(
      storage.validateSavedDailyWriting(
        saved,
        row,
        p.facts,
        prose.paragraphs,
        prose.meta.citations,
      ),
      saved,
    );
    for (const mutate of [
      (s) => {
        s.plan.editorial.entry.writingMaterial.direction =
          "An unrelated possibility can remain unnamed.";
      },
      (s) => {
        s.reflection.question = "Which unrelated detail matters?";
      },
      (s) => {
        s.plan.editorial.releaseVersion = "wrong-release";
      },
      (s) => {
        s.plan.editorial.entry.fallbackParagraphs[0] =
          "A changed first paragraph remains possible.";
      },
    ]) {
      const changed = structuredClone(saved);
      mutate(changed);
      assert.throws(() =>
        storage.validateSavedDailyWriting(
          changed,
          row,
          p.facts,
          prose.paragraphs,
          prose.meta.citations,
        ),
      );
    }
    assert.throws(() =>
      storage.validateSavedDailyWriting(
        saved,
        { ...row, headline: "An unrelated headline" },
        p.facts,
        prose.paragraphs,
        prose.meta.citations,
      ),
    );
    if (selected.mode === "contact") {
      const changedCitations = structuredClone(prose.meta.citations);
      changedCitations[1].facts = ["C1"];
      assert.throws(() =>
        storage.validateSavedDailyWriting(
          saved,
          { ...row, language_mode: "model" },
          p.facts,
          prose.paragraphs,
          changedCitations,
        ),
      );
    }
  }
});
