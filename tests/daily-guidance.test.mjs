import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, compose;
before(async () => {
  h = await createRecordsHarness();
  ({ composeDailyGuidance: compose } = await h.vite.ssrLoadModule("/src/lib/daily-guidance.ts"));
});
after(async () => h?.close());

function input() {
  return {
    day: "2026-10-18",
    now: new Date("2026-10-18T12:00:00Z"),
    timezone: "UTC",
    granted: new Set(),
    preferredDomain: null,
    primary: {
      cycle_key: "jupiter_trine_sun",
      label: "Jupiter trine natal Sun",
      phase: "separating",
      orb: 0.36,
      exact_at: "2026-10-16T02:39:25Z",
    },
    source: {
      key: "soft:jupiter:sun",
      releaseVersion: "0.9.2",
      themes: ["expansion", "expression"],
    },
    checkIn: {
      day: "2026-10-18",
      observedAt: "2026-10-18T10:00:00Z",
      mood: null,
      energy: 2,
      sleep: null,
      stress: null,
    },
  };
}

test("calculation theme and permitted energy each change the next step", () => {
  const value = input(),
    baseline = compose(value);
  assert.equal(baseline.action, "Sketch a bigger version of one idea in three bullet points.");
  assert.deepEqual(baseline.basis.context, []);
  value.granted.add("USR-04");
  const low = compose(value);
  assert.equal(low.action, "Add one possibility to an idea you choose.");
  assert.deepEqual(low.basis.calculation, baseline.basis.calculation);
  assert.equal(low.basis.interpretation.key, "soft:jupiter:sun");
  value.primary = {
    ...value.primary,
    cycle_key: "saturn_square_sun",
    label: "Saturn square natal Sun",
  };
  value.source = { key: "hard:saturn:sun", releaseVersion: "0.9.2", themes: ["structure"] };
  const structure = compose(value);
  assert.equal(structure.action, "Write down just the first step of one task.");
  assert.notEqual(structure.action, low.action);
  assert.equal(structure.basis.context[0].sourceId, "USR-04");
});

test("revocation ignores still-stored bands and focus", () => {
  const value = input();
  value.checkIn = { ...value.checkIn, mood: 1, stress: 5, sleep: 1 };
  value.preferredDomain = "work";
  const result = compose(value);
  assert.deepEqual(result.basis.context, []);
  assert.equal(result.framing, null);
  assert.equal(result.reflection, null);
  assert.equal(result.focus, null);
});

test("the reviewed 0.9.2 first-reading source works without legacy theme tags", () => {
  const value = input();
  value.source.themes = [];
  value.granted.add("USR-04");
  assert.equal(compose(value).action, "Add one possibility to an idea you choose.");
  value.source.releaseVersion = "0.9.3";
  assert.equal(compose(value).basis.interpretation, null);
});

test("every published 0.9.2 source offers its theme or its exact reflection with an energy-aware approach", async () => {
  const bundle = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-reading-quality/2026-10-18/followup/bundle-0.9.2.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const source of bundle.cycles) {
    const value = input();
    value.source = { ...source, releaseVersion: bundle.version };
    const standard = compose(value);
    assert.equal(standard.basis.interpretation.key, source.key);
    assert.equal(standard.basis.interpretation.releaseVersion, bundle.version);
    value.granted.add("USR-04");
    const low = compose(value);
    assert.deepEqual(low.basis.calculation, standard.basis.calculation);
    assert.ok(low.basis.context.some((item) => item.label === "Energy" && item.value === 2));
    if (standard.basis.interpretation.theme) {
      assert.notEqual(low.action, standard.action);
    } else {
      assert.equal(standard.action, source.question);
      assert.equal(low.action, source.question);
      assert.match(standard.framing, /If this question fits your day.*one small next step/);
      assert.match(low.framing, /If this question fits your day, one sentence is enough/);
      assert.notEqual(low.framing, standard.framing);
    }
  }
});

test("mood alone never invents an energy level or shrinks the action", () => {
  const value = input();
  value.granted.add("USR-04");
  value.checkIn.energy = null;
  value.checkIn.mood = 1;
  const result = compose(value);
  assert.equal(result.action, compose(input()).action);
  assert.match(result.framing, /mood 1\/5/);
  assert.deepEqual(
    result.basis.context.map((x) => x.label),
    ["Mood"],
  );
});

test("wellness shapes a reflection only, with independent per-source consent", () => {
  const value = input();
  value.granted.add("WEL-03");
  value.checkIn.stress = 5;
  value.checkIn.sleep = 1;
  const stress = compose(value);
  assert.equal(stress.action, compose(input()).action);
  assert.match(stress.reflection, /stress level you recorded/);
  assert.deepEqual(
    stress.basis.context.map((x) => [x.sourceId, x.use]),
    [["WEL-03", "reflection_prompt"]],
  );
  value.granted = new Set(["WEL-01"]);
  const sleep = compose(value);
  assert.equal(sleep.action, stress.action);
  assert.match(sleep.reflection, /sleep quality you recorded/);
});

test("same civil day, valid observation and finite bands are required", () => {
  for (const mutate of [
    (v) => {
      v.checkIn.day = "2026-10-17";
    },
    (v) => {
      v.checkIn.observedAt = null;
    },
    (v) => {
      v.checkIn.observedAt = "2026-10-19T00:00:00Z";
    },
    (v) => {
      v.checkIn.observedAt = "invalid";
    },
    (v) => {
      v.checkIn.energy = 0;
    },
    (v) => {
      v.checkIn.energy = 6;
    },
    (v) => {
      v.checkIn.energy = 1.5;
    },
    (v) => {
      v.checkIn.energy = NaN;
    },
    (v) => {
      v.now = new Date("2026-10-18T23:00:00Z");
      v.timezone = "Pacific/Kiritimati";
    },
  ]) {
    const value = input();
    value.granted.add("USR-04");
    mutate(value);
    assert.deepEqual(compose(value).basis.context, []);
  }
});

test("focus is a label and does not reinterpret the calculated theme", () => {
  const value = input();
  value.granted.add("USR-14");
  value.preferredDomain = "work";
  const result = compose(value);
  assert.equal(result.focus, "work");
  assert.equal(result.action, compose(input()).action);
  assert.equal(result.basis.context[0].use, "framing");
});

test("unbound, unsupported and quiet themes use an honestly unbound suggestion", () => {
  for (const mutate of [
    (v) => {
      v.source = null;
    },
    (v) => {
      v.source = { key: "unreviewed", releaseVersion: "0.9.2", themes: ["unknown", "constructor"] };
    },
    (v) => {
      v.primary = null;
    },
  ]) {
    const value = input();
    value.granted.add("USR-04");
    mutate(value);
    const result = compose(value);
    assert.equal(result.basis.interpretation, null);
    assert.equal(result.framing, null);
    assert.deepEqual(result.basis.context, []);
    assert.match(result.action, /one thing that has your attention/);
  }
});
