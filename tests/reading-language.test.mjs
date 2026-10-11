import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const projectRoot =
  process.env.PATTERN_TEST_PROJECT_ROOT ?? fileURLToPath(new URL("../", import.meta.url));
const projectRequire = createRequire(join(projectRoot, "package.json"));
const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
const originalFetch = globalThis.fetch;
const originalKey = process.env.LOVABLE_API_KEY;
let vite, assembleReading, readingFacts, generateReadingProse, DEFAULT_BUNDLE;
let requests = [],
  draft;
const chart = {
  engine: "synthetic-reading-engine",
  engineVersion: "1-fixture",
  houseSystem: "Placidus",
  precision: "high",
  points: {
    sun: { angleDependent: false },
    moon: { angleDependent: false },
    ascendant: { angleDependent: true },
    midheaven: { angleDependent: true },
  },
  uncertainty: {
    accuracy: "exact",
    minutes: 2,
    ascendantSpreadDeg: 0.5,
    housesReliable: true,
    angleClaimsSuppressed: false,
  },
};
const ctx = {
  granted: new Set(["USR-01", "USR-02", "USR-04", "WEL-01", "WEL-03", "AMB-02"]),
  tone: "plain",
  depth: "standard",
  localBucket: null,
  checkIn: null,
  wellness: null,
};
function cycle(key = "saturn_square_sun", importance = 0.4, extras = {}) {
  return {
    cycle_key: key,
    transit_body: "saturn",
    natal_point: "sun",
    aspect: "square",
    orb: 1.25,
    phase: "approaching",
    domain: "identity",
    importance,
    ingress_at: "2026-10-01T12:00:00Z",
    exact_at: "2026-10-15T01:00:00Z",
    egress_at: "2026-10-28T12:00:00Z",
    label: "Saturn square natal Sun",
    days_to_exact: 4,
    arc_position: 0.3,
    ...extras,
  };
}
function validParagraphs() {
  return [
    {
      text: "Saturn square natal Sun is the strongest named contact. The published interpretation describes a role being tested for fit.",
      facts: ["C1", "I1"],
    },
    {
      text: "This contact touches identity and direction. It can be considered through the role you use to describe yourself.",
      facts: ["C1", "D1"],
    },
    {
      text: "The window is approaching its exact pass. Its timing describes the calculated contact rather than an event promised to you.",
      facts: ["C1", "P1", "T1"],
    },
  ];
}
function plan(inputChart = chart, cycles = [cycle()], context = ctx, bundle = DEFAULT_BUNDLE) {
  return assembleReading(inputChart, cycles, context, bundle);
}
function input(assembled = plan(), inputChart = chart) {
  return {
    facts: readingFacts(inputChart, assembled),
    hasEligibleCycles: assembled.eligibleCycles.length > 0,
    tone: ctx.tone,
    depth: ctx.depth,
    suppression: {
      angles: inputChart.uncertainty.angleClaimsSuppressed,
      houses: !inputChart.uncertainty.housesReliable,
    },
    fallback: { headline: assembled.headline, body: assembled.astroBody, prompt: assembled.prompt },
  };
}
before(async () => {
  process.env.LOVABLE_API_KEY = "synthetic-reading-test-no-network";
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(
      String(url),
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      "The harness forbids external application network calls",
    );
    requests.push(JSON.parse(String(init.body)));
    return Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] });
  };
  vite = await createServer({
    root: projectRoot,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ readingFacts } = await vite.ssrLoadModule("/src/lib/ai/facts.ts"));
  ({ generateReadingProse } = await vite.ssrLoadModule("/src/lib/ai/language.server.ts"));
  ({ DEFAULT_BUNDLE } = await vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
});
beforeEach(() => {
  requests = [];
  draft = {
    headline: "An invented headline",
    prompt: "An invented question?",
    paragraphs: validParagraphs(),
  };
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.LOVABLE_API_KEY;
  else process.env.LOVABLE_API_KEY = originalKey;
  await vite?.close();
});

test("quiet-day fallback has a readable body and never calls the model", async () => {
  const assembled = plan(chart, []);
  assert.ok(assembled.body.trim());
  assert.ok(assembled.astroBody.trim());
  const output = await generateReadingProse(input(assembled));
  assert.equal(output.meta.mode, "template");
  assert.equal(output.headline, "A quiet day in the pattern");
  assert.equal(output.body, assembled.astroBody);
  assert.equal(requests.length, 0);
});

test("one shared plan sorts, filters at >0.02, caps at three, and removes suppressed angle contacts", () => {
  const unknown = {
    ...chart,
    uncertainty: {
      ...chart.uncertainty,
      accuracy: "unknown",
      housesReliable: false,
      angleClaimsSuppressed: true,
    },
  };
  const assembled = plan(unknown, [
    cycle("weak", 0.01),
    cycle("third", 0.2),
    cycle("threshold", 0.02),
    cycle("strong", 0.7),
    cycle("angle", 0.9, { natal_point: "ascendant" }),
    cycle("second", 0.4),
    cycle("fourth", 0.1),
  ]);
  assert.deepEqual(
    assembled.eligibleCycles.map((c) => c.cycle_key),
    ["strong", "second", "third"],
  );
  const facts = readingFacts(unknown, assembled);
  assert.equal(facts.filter((f) => /^C\d+$/.test(f.id)).length, 3);
  assert.ok(!facts.some((f) => f.statement.includes("transiting saturn square natal ascendant")));
  assert.equal(assembled.primary_cycle_key, "strong");
});

test("facts include the selected curated mechanism, domain, phase and timing", () => {
  const bundle = {
    ...DEFAULT_BUNDLE,
    cycles: [
      {
        key: "hard:saturn:sun",
        mechanism: "CURATED_MECHANISM_MARKER",
        question: "What is your selected question?",
      },
    ],
    domains: {
      identity: {
        label: "identity",
        hard: "CURATED_DOMAIN_MARKER",
        soft: "soft marker",
        prompt: "What is your domain question?",
      },
    },
    phases: { approaching: "CURATED_PHASE_MARKER" },
  };
  const assembled = plan(chart, [cycle()], ctx, bundle);
  const facts = readingFacts(chart, assembled);
  for (const [id, text] of [
    ["I1", "CURATED_MECHANISM_MARKER"],
    ["D1", "CURATED_DOMAIN_MARKER"],
    ["P1", "CURATED_PHASE_MARKER"],
  ])
    assert.ok(facts.find((f) => f.id === id)?.statement.includes(text));
  assert.ok(facts.find((f) => f.id === "T1"));
});

test("wellbeing and local-time context never enter facts or the gateway", async () => {
  const assembled = plan(chart, [cycle()], {
    ...ctx,
    localBucket: "evening",
    checkIn: { mood: 1, energy: 2 },
    wellness: { sleep: 1, stress: 5 },
  });
  assert.match(assembled.contextBody, /sleep 1\/5/);
  assert.match(assembled.contextBody, /stress 5\/5/);
  assert.match(assembled.contextBody, /mood 1\/5/);
  const facts = readingFacts(chart, assembled);
  assert.ok(!facts.some((f) => /^F/.test(f.id)));
  await generateReadingProse(input(assembled));
  const payload = requests[0].messages[1].content;
  assert.ok(
    !/self-reported|stress 5|sleep 1|mood 1|energy 2|local time of day|evening/.test(payload),
  );
});

test("model body preserves the deterministic headline and adapted reflection", async () => {
  const assembled = plan(chart, [cycle()], { ...ctx, wellness: { sleep: 1, stress: 5 } });
  const output = await generateReadingProse(input(assembled));
  assert.equal(output.meta.mode, "model");
  assert.equal(output.headline, assembled.headline);
  assert.equal(output.prompt, assembled.prompt);
  assert.match(output.prompt, /pressure running high/);
  assert.ok(!output.body.includes("stress 5/5"));
});

test("daily model accepts a complete three-paragraph draft with supplied-ID coverage", async () => {
  const output = await generateReadingProse(input());
  assert.equal(output.meta.mode, "model");
  assert.equal(output.body.split("\n\n").length, 3);
  assert.equal(output.meta.citations.length, 3);
  assert.equal(output.meta.reason, null);
});

for (const [name, paragraphs] of [
  ["one paragraph", () => validParagraphs().slice(0, 1)],
  ["five paragraphs", () => [...validParagraphs(), ...validParagraphs().slice(0, 2)]],
  [
    "unfinished sentence",
    () => validParagraphs().map((p) => ({ ...p, text: "An unfinished thought" })),
  ],
  [
    "five sentences",
    () =>
      validParagraphs().map((p) => ({
        ...p,
        text: "One sentence. Two sentences. Three sentences. Four sentences. Five sentences.",
      })),
  ],
])
  test(`daily draft rejects ${name}`, async () => {
    draft.paragraphs = paragraphs();
    const expected = input();
    const output = await generateReadingProse(expected);
    assert.equal(output.meta.mode, "template");
    assert.equal(output.body, expected.fallback.body);
  });

test("known IDs alone cannot satisfy cycle/editorial coverage", async () => {
  draft.paragraphs = validParagraphs().map((p) => ({ ...p, facts: ["E1"] }));
  const output = await generateReadingProse(input());
  assert.equal(output.meta.mode, "template");
  assert.ok(!/fact verification|semantically|supported claim/i.test(output.meta.reason));
});

test("two concise paragraphs can focus on the primary meaning without unused editorial citations", async () => {
  draft.paragraphs = [
    { text: "A familiar role can ask more of you than it once did.", facts: ["C1", "I1"] },
    {
      text: "The distinction is between keeping a commitment and keeping it unchanged.",
      facts: ["I1"],
    },
  ];
  const output = await generateReadingProse(input());
  assert.equal(output.meta.mode, "model");
  assert.deepEqual(
    output.meta.citations.map((c) => c.facts),
    [["C1", "I1"], ["I1"]],
  );
  const prompt = requests[0].messages[1].content;
  assert.ok(
    prompt.indexOf("I1:") < prompt.indexOf("C1:"),
    "Meaning precedes calculation references",
  );
  assert.match(prompt, /Style example only/);
});

test("unknown citation IDs fail closed", async () => {
  draft.paragraphs[0].facts = ["C1", "I1", "NOT_SENT"];
  const output = await generateReadingProse(input());
  assert.equal(output.meta.mode, "template");
});

for (const claim of [
  "Your Ascendant is Aries.",
  "Your Moon occupies the tenth house.",
  "Your Midheaven defines your career.",
  "Your rising shapes first impressions.",
  "The rising is emphasized.",
  "Your rising, rather than your Sun, sets the tone.",
  "Your natal rising placement sets the tone.",
  "There is pressure on your rising.",
  "Your rising's influence shapes first impressions.",
  "Your rising’s influence shapes first impressions.",
  "Your rising and Sun describe how you present yourself.",
  "Your rising adds another layer to first impressions.",
])
  test(`suppressed draft rejects ${claim}`, async () => {
    const unknown = {
      ...chart,
      uncertainty: {
        ...chart.uncertainty,
        accuracy: "unknown",
        housesReliable: false,
        angleClaimsSuppressed: true,
      },
    };
    draft.paragraphs[0].text = claim + " This is an additional statement.";
    const output = await generateReadingProse(input(plan(unknown), unknown));
    assert.equal(output.meta.mode, "template");
  });

for (const wording of [
  "Your rising workload takes effort.",
  "Rising expectations take effort.",
  "Pressure keeps rising.",
  "The rising cost of effort is apparent.",
  "Your rising and falling workload takes effort.",
]) {
  test(`angle suppression permits ordinary wording: ${wording}`, async () => {
    const unknown = {
      ...chart,
      uncertainty: { ...chart.uncertainty, housesReliable: false, angleClaimsSuppressed: true },
    };
    draft.paragraphs[0].text = wording;
    assert.equal((await generateReadingProse(input(plan(unknown), unknown))).meta.mode, "model");
  });
}

test("an unsuppressed bare rising claim still needs an Ascendant cycle citation", async () => {
  draft.paragraphs[0].text =
    "Your rising shapes first impressions. This is an additional statement.";
  assert.equal((await generateReadingProse(input())).meta.diagnostics.code, "body");
});

test("daily safety flags reject the whole draft instead of retaining redacted prose", async () => {
  draft.paragraphs[0].text = "You must accept this shift. It will definitely happen.";
  const output = await generateReadingProse(input());
  assert.equal(output.meta.mode, "template");
  assert.ok(!output.body.includes("[removed:"));
});

test("unsupported numerical orb fails closed while the actual decimal orb is accepted", async () => {
  draft.paragraphs[0].text =
    "Saturn square natal Sun has an orb of 99 degrees. The contact is approaching.";
  assert.equal((await generateReadingProse(input())).meta.mode, "template");
  draft.paragraphs[0].text =
    "Saturn square natal Sun has an orb of 1.25 degrees. The contact is approaching.";
  assert.equal((await generateReadingProse(input())).meta.mode, "model");
});

test("malformed gateway paragraph data falls back without throwing", async () => {
  draft.paragraphs = { text: "Not an array", facts: ["C1"] };
  const output = await generateReadingProse(input());
  assert.equal(output.meta.mode, "template");
});

test("plain normalization and technical depth behave consistently in the template", () => {
  const plain = plan();
  const measured = plan(chart, [cycle()], { ...ctx, tone: "measured" });
  const unknown = plan(chart, [cycle()], { ...ctx, tone: "unknown" });
  assert.equal(plain.body, measured.body);
  assert.equal(plain.body, unknown.body);
  const technical = plan(chart, [cycle()], { ...ctx, depth: "technical" });
  assert.notEqual(plain.astroBody, technical.astroBody);
  assert.match(technical.astroBody, /1\.25|30%/);
});

test("daily tone and depth guidance is defined, normalized and separate from facts", async () => {
  for (const [tone, expected, phrase] of [
    ["measured", "plain", "Direct and observant"],
    ["warm", "warm", "Attentive and conversational"],
    ["clinical", "clinical", "Precise and reserved"],
  ]) {
    const factsBefore = JSON.stringify(input().facts);
    await generateReadingProse({ ...input(), tone, depth: "technical" });
    const prompt = requests.at(-1).messages[1].content;
    assert.match(prompt, new RegExp(`Tone: ${expected}\\. ${phrase}`));
    assert.match(prompt, /Style example only — not a factual source/);
    assert.match(prompt, /Depth: technical/);
    assert.equal(JSON.stringify(input().facts), factsBefore);
  }
  assert.equal(requests[0].response_format.json_schema.schema.properties.paragraphs.minItems, 2);
  assert.equal(requests[0].response_format.json_schema.schema.properties.paragraphs.maxItems, 4);
});

test("local exact-date facts use the consented calendar zone", () => {
  const facts = readingFacts(chart, plan(), "America/Los_Angeles");
  const first = facts.find((f) => f.id === "C1");
  assert.equal(first.cycle.exactDate, "2026-10-14");
  assert.match(first.statement, /exact on 2026-10-14/);
});

for (const text of [
  "Mars square natal Sun is approaching. This describes the calculated contact.",
  "Saturn trine natal Sun is approaching. This describes the calculated contact.",
  "Transiting Sun square natal Saturn is approaching. This describes the calculated contact.",
  "The contact is exact on 2026-10-22. This describes the calculated contact.",
  "Your Sun is in Aries. This describes the calculated contact.",
])
  test(`daily references reject an absent or contradictory claim: ${text}`, async () => {
    draft.paragraphs[0].text = text;
    const output = await generateReadingProse(input());
    assert.equal(output.meta.mode, "template");
  });

test("valid exact date and qualified rounded orb are accepted", async () => {
  draft.paragraphs[0].text =
    "Saturn square natal Sun has an orb of about 1.3 degrees. The contact is exact on 2026-10-15.";
  assert.equal((await generateReadingProse(input())).meta.mode, "model");
});

test("everyday counts, household routines and ordinary opposition are not astronomy claims", async () => {
  draft.paragraphs[1].text =
    "You can notice two competing plans in your household routines. Opposition to a plan does not determine your identity.";
  assert.equal((await generateReadingProse(input())).meta.mode, "model");
});

test("house-dependent contacts are suppressed even in stale supplied cycles", () => {
  const uncertain = { ...chart, uncertainty: { ...chart.uncertainty, housesReliable: false } };
  const assembled = plan(uncertain, [cycle("house_10", 0.8, { natal_point: "house_10" }), cycle()]);
  assert.deepEqual(
    assembled.eligibleCycles.map((c) => c.cycle_key),
    ["saturn_square_sun"],
  );
});

test("unconsented local context and wellness do not enter deterministic appended copy", () => {
  const assembled = plan(chart, [cycle()], {
    ...ctx,
    granted: new Set(),
    localBucket: "evening",
    checkIn: { mood: 1, energy: 2 },
    wellness: { sleep: 1, stress: 5 },
  });
  assert.equal(assembled.contextBody, "");
  assert.ok(!assembled.prompt.includes("pressure running high"));
});

test("an oversized draft fails closed", async () => {
  draft.paragraphs[0].text = "A " + "word ".repeat(220) + "ends here. This is another sentence.";
  assert.equal((await generateReadingProse(input())).meta.mode, "template");
});

test("the daily rewrite does not change existing natal paragraph validation behavior", async () => {
  const { generateFeatureNarrative } = await vite.ssrLoadModule("/src/lib/ai/language.server.ts");
  draft = {
    paragraphs: [{ text: "This structure names a lifelong tendency.", facts: ["N1"] }],
    reflection_question: "Where in your life do you notice this pattern?",
  };
  const output = await generateFeatureNarrative({
    facts: [{ id: "N1", statement: "Synthetic natal structure." }],
    title: "Synthetic chapter",
    tone: "plain",
  });
  assert.equal(output.meta.mode, "model");
  const schema = requests[0].response_format.json_schema.schema.properties.paragraphs;
  assert.equal(schema.minItems, undefined);
  assert.equal(schema.maxItems, undefined);
});

for (const text of [
  "Saturn is trine your Sun. This describes the calculated contact.",
  "Saturn forms a trine to the Sun. This describes the calculated contact.",
  "Saturn and Sun form a trine. This describes the calculated contact.",
  "Your Sun occupies house ten. This describes the calculated contact.",
])
  test(`daily references reject common unsupported wording: ${text}`, async () => {
    draft.paragraphs[0].text = text;
    assert.equal((await generateReadingProse(input())).meta.mode, "template");
  });

test("worded and hyphenated degree values cannot bypass numeric reference checks", async () => {
  for (const value of ["ninety-nine degrees", "99-degree"]) {
    draft.paragraphs[0].text = `Saturn square natal Sun has a ${value} orb. This describes the calculated contact.`;
    assert.equal((await generateReadingProse(input())).meta.mode, "template");
  }
});
