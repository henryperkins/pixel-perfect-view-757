import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import {
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "../src/lib/ai/reading-evaluation.fixtures.mjs";
import {
  READING_EVAL_CASES as scriptCases,
  READING_EVAL_FIXTURE_VERSION as scriptVersion,
} from "../scripts/reading-eval-cases.mjs";

let vite, localNoon, daysToLocalDate, assembleReading, readingFacts;
before(async () => {
  vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ localNoon, daysToLocalDate } = await vite.ssrLoadModule("/src/lib/local-day.ts"));
  ({ assembleReading } = await vite.ssrLoadModule("/src/lib/reading.server.ts"));
  ({ readingFacts } = await vite.ssrLoadModule("/src/lib/ai/facts.ts"));
});
after(async () => {
  await vite?.close();
});

test("every synthetic contact's phase agrees with its fixed local-noon reference", () => {
  // This asserts fixture chronology only. It does not derive phases, orbs or positions from an ephemeris.
  for (const fixed of READING_EVAL_CASES) {
    const reference = localNoon(fixed.config.day, fixed.config.timeZone).getTime();
    for (const cycle of fixed.cycles) {
      const label = `${fixed.id}: ${cycle.cycle_key}`;
      const exact = Date.parse(cycle.exact_at);
      assert.ok(Number.isFinite(exact), `${label} must have a valid fixed exact timestamp`);
      assert.ok(
        Date.parse(cycle.ingress_at) <= exact && exact <= Date.parse(cycle.egress_at),
        `${label} exact timestamp must lie inside its synthetic window`,
      );
      if (cycle.phase === "approaching")
        assert.ok(
          exact > reference,
          `${label} approaching contact must have a future exact timestamp`,
        );
      else if (cycle.phase === "separating")
        assert.ok(
          exact < reference,
          `${label} separating contact must have a past exact timestamp`,
        );
      else if (cycle.phase === "exact")
        assert.equal(
          exact,
          reference,
          `${label} exact fixture must coincide with its fixed reference`,
        );
      else assert.fail(`${label} has an unsupported fixture phase`);
    }
  }
});

test("corrected Mercury fixture produces past timing and separating facts through the production plan", () => {
  const fixed = READING_EVAL_CASES.find((item) => item.id === "mercury-conjunction-clinical");
  const cycles = fixed.cycles.map((cycle) => ({
    ...cycle,
    days_to_exact: daysToLocalDate(cycle.exact_at, fixed.config.day, fixed.config.timeZone),
  }));
  assert.equal(cycles[0].days_to_exact, -1);
  const assembled = assembleReading(fixed.chart, cycles, {
    granted: new Set(fixed.config.granted),
    tone: fixed.config.tone,
    depth: fixed.config.depth,
    localBucket: null,
    checkIn: null,
    wellness: null,
  });
  const facts = readingFacts(fixed.chart, assembled, fixed.config.timeZone);
  assert.match(facts.find((fact) => fact.id === "C1").statement, /phase separating/);
  assert.equal(facts.find((fact) => fact.id === "C1").cycle.exactDate, "2026-10-10");
  assert.match(facts.find((fact) => fact.id === "T1").statement, /yesterday/);
});

test("corrected fixtures have a new identity shared by offline and server evaluation", () => {
  assert.equal(READING_EVAL_FIXTURE_VERSION, "synthetic-daily-3");
  assert.equal(scriptVersion, READING_EVAL_FIXTURE_VERSION);
  assert.equal(scriptCases, READING_EVAL_CASES);
});

for (const [id, status, key] of [
  ["synthesis-tension", "selected", "square:saturn:sun_tension_trine:jupiter:mars"],
  ["synthesis-reinforcement", "selected", "trine:saturn:sun_reinforcement_trine:mars:sun"],
  [
    "synthesis-independent",
    "independent",
    "opposition:venus:venus_independent_conjunction:mercury:mercury",
  ],
  ["synthesis-reversed", "selected", "trine:jupiter:mars_tension_square:saturn:sun"],
  ["synthesis-suppressed-support", "unmatched", null],
  ["synthesis-unmatched", "unmatched", null],
])
  test(`fixed ${id} pins the published pair and parent set`, () => {
    const fixed = READING_EVAL_CASES.find((c) => c.id === id);
    assert.ok(fixed, "The fixed synthesis case must exist");
    const assembled = assembleReading(fixed.chart, fixed.cycles, {
      ...fixed.config,
      granted: new Set(fixed.config.granted),
      localBucket: null,
      checkIn: null,
      wellness: null,
    });
    assert.equal(assembled.interpretationPlan.pairStatus, status);
    assert.equal(assembled.interpretationPlan.pairRuleKey, key);
    const facts = readingFacts(fixed.chart, assembled, fixed.config.timeZone);
    if (status === "selected")
      assert.deepEqual(facts.find((f) => f.id === "S1").dependsOn, ["C1", "I1", "C2", "I2"]);
    else assert.ok(!facts.some((f) => f.id === "S1"));
    if (id === "synthesis-suppressed-support")
      assert.ok(!JSON.stringify(facts).includes("ascendant"));
  });
