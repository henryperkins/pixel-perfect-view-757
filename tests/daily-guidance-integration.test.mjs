import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness, successfulReadingResponse } from "./helpers/records-harness.mjs";
import { seedTransitReading } from "./helpers/transit-fixtures.mjs";

let h;
const now = new Date("2026-10-12T12:00:00Z");
const day = "2026-10-12";
before(async () => {
  h = await createRecordsHarness();
});
after(async () => h?.close());
beforeEach(async (context) => {
  await h.reset();
  context.mock.timers.enable({ apis: ["Date"], now });
  const e = h.ephemerisModule;
  const lon = (e.positionOf("saturn", e.toJulianDay(now)).lon + 90) % 360;
  await h.seedChart(h.records(), h.userA, {
    positions: {
      sun: {
        key: "sun",
        label: "Sun",
        lon,
        sign: e.signOf(lon),
        degree: e.degreeInSign(lon),
        house: 1,
        speed: 1,
        retrograde: false,
        angleDependent: false,
      },
    },
  });
  h.setGateway(successfulReadingResponse);
});
const today = () => h.app.getToday(h.records(), h.userA, "UTC");
const consent = (id, granted = true) => h.app.setConsent(h.records(), h.userA, id, granted);
const checkIn = (energy, checkDay = day) =>
  h.app.saveCheckIn(h.records(), h.userA, checkDay, 2, energy, "PRIVATE_GUIDANCE_NOTE", null, null);

test("Today supplies source-bound guidance without using unconsented check-in values", async () => {
  await checkIn(1);
  const reading = await today();
  const guidance = reading.localContext.guidance;
  assert.ok(guidance, "Today must expose the local guidance projection");
  assert.deepEqual(guidance.basis.context, []);
  assert.equal(guidance.framing, null);
  assert.equal(guidance.focus, null);
  assert.equal(guidance.basis.interpretation.key, "square:saturn:sun");
  assert.equal(guidance.basis.interpretation.releaseVersion, reading.reading.release_version);
  assert.equal(guidance.basis.interpretation.theme, "structure");
  const primary = reading.cycles.find(
    (cycle) => cycle.cycle_key === reading.reading.primary_cycle_key,
  );
  assert.equal(guidance.basis.calculation.cycleKey, primary.cycle_key);
  assert.equal(guidance.basis.calculation.orb, primary.orb);
  assert.equal(guidance.basis.calculation.exactAt, primary.exact_at);
  assert.equal(
    Object.hasOwn(reading, "guidanceSource"),
    false,
    "Internal binding is not a public field",
  );
  assert.doesNotMatch(JSON.stringify(guidance), /PRIVATE_GUIDANCE_NOTE/);
});

test("consented low energy changes local action while geometry and provider facts remain identical", async () => {
  await consent("USR-04");
  await checkIn(4);
  const first = await today();
  await checkIn(1);
  const second = await today();
  assert.ok(first.localContext.guidance && second.localContext.guidance);
  assert.notEqual(first.localContext.guidance.action, second.localContext.guidance.action);
  assert.notEqual(first.localContext.identity, second.localContext.identity);
  assert.ok(
    second.localContext.guidance.basis.context.some(
      (source) => source.sourceId === "USR-04" && source.value === 1,
    ),
  );
  assert.deepEqual(first.cycles, second.cycles);
  assert.deepEqual(first.language.facts, second.language.facts);
  assert.deepEqual(h.gatewayRequests[0], h.gatewayRequests[1]);
  assert.doesNotMatch(
    JSON.stringify(h.gatewayRequests),
    /PRIVATE_GUIDANCE_NOTE|self-reported energy|self-reported mood/,
  );
  assert.equal(h.gatewayRequests.length, 2, "Existing check-in cache identity is preserved");
});

test("focus-only guidance changes use a cached reading without another provider request", async () => {
  const first = await today();
  await h.app.updatePrefs(h.records(), h.userA, null, "plain", "standard", "work");
  await consent("USR-14");
  const second = await today();
  assert.ok(first.localContext.guidance && second.localContext.guidance);
  assert.equal(second.localContext.guidance.focus, "work");
  assert.equal(first.localContext.guidance.action, second.localContext.guidance.action);
  assert.equal(second.reading.id, first.reading.id);
  assert.equal(h.gatewayRequests.length, 1);
  await consent("USR-14", false);
  const revoked = await today();
  assert.equal(revoked.localContext.guidance.focus, null);
  assert.deepEqual(revoked.localContext.guidance.basis.context, []);
  assert.equal(h.gatewayRequests.length, 1);
});

test("guidance excludes a prior-day check-in and another member's current check-in", async () => {
  await consent("USR-04");
  await checkIn(1, "2026-10-11");
  await h.app.saveCheckIn(h.records(), h.userB, day, 1, 1, "OTHER_MEMBER_NOTE", null, null);
  const reading = await today();
  assert.ok(reading.localContext.guidance);
  assert.deepEqual(reading.localContext.guidance.basis.context, []);
  assert.doesNotMatch(JSON.stringify(reading.localContext.guidance), /OTHER_MEMBER_NOTE/);
});

function latch() {
  let enter, release;
  const entered = new Promise((resolve) => {
    enter = resolve;
  });
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  return { entered, blocked, enter, release };
}

test("an in-flight check-in edit cannot mix old reading context and new guidance", async () => {
  await consent("USR-04");
  await checkIn(4);
  const gate = latch();
  h.setGateway(async (body) => {
    gate.enter();
    await gate.blocked;
    return successfulReadingResponse(body);
  });
  const pending = today();
  await gate.entered;
  try {
    await checkIn(1);
  } finally {
    gate.release();
  }
  await assert.rejects(pending, /check-in changed/i);
  assert.equal(h.gatewayRequests.length, 1);
});

for (const change of ["unconsented scores", "private note only"]) {
  test(`an in-flight edit to ${change} does not block unrelated reading guidance`, async (context) => {
    if (change === "private note only") await consent("USR-04");
    await checkIn(4);
    const gate = latch();
    h.setGateway(async (body) => {
      gate.enter();
      await gate.blocked;
      return successfulReadingResponse(body);
    });
    const pending = today();
    await gate.entered;
    try {
      context.mock.timers.setTime(now.getTime() + 1000);
      await h.app.saveCheckIn(
        h.records(),
        h.userA,
        day,
        2,
        change === "unconsented scores" ? 1 : 4,
        "PRIVATE_EDITED_GUIDANCE_NOTE",
        null,
        null,
      );
    } finally {
      gate.release();
    }
    const reading = await pending;
    assert.ok(reading.localContext.guidance);
    if (change === "unconsented scores") {
      assert.deepEqual(reading.localContext.guidance.basis.context, []);
    } else {
      assert.ok(
        reading.localContext.guidance.basis.context.some(
          (source) =>
            source.sourceId === "USR-04" && source.label === "Energy" && source.value === 4,
        ),
      );
    }
    assert.equal(h.gatewayRequests.length, 1);
    assert.doesNotMatch(JSON.stringify(h.gatewayRequests), /PRIVATE_EDITED_GUIDANCE_NOTE/);
  });
}

test("a late note-only save retains consented energy in the current local projection", async (context) => {
  await consent("USR-04");
  await checkIn(1);
  const gate = latch();
  const original = globalThis.fetch;
  let reads = 0;
  globalThis.fetch = async (input, init = {}) => {
    const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
    if (/select .* from "check_ins"/i.test(body.sql ?? "") && ++reads === 2) {
      gate.enter();
      await gate.blocked;
    }
    return original(input, init);
  };
  const pending = today();
  try {
    await Promise.race([
      gate.entered,
      pending.then(() => {
        throw new Error("No post-reading context projection occurred");
      }),
    ]);
    context.mock.timers.setTime(now.getTime() + 1000);
    await h.app.saveCheckIn(h.records(), h.userA, day, 2, 1, "LATE_PRIVATE_NOTE", null, null);
    gate.release();
    const reading = await pending;
    assert.ok(
      reading.localContext.guidance.basis.context.some(
        (source) => source.sourceId === "USR-04" && source.label === "Energy" && source.value === 1,
      ),
    );
    assert.equal(
      reading.localContext.guidance.action,
      "Write down just the first step of one task.",
    );
    assert.equal(h.gatewayRequests.length, 1);
    assert.doesNotMatch(JSON.stringify(h.gatewayRequests), /LATE_PRIVATE_NOTE/);
  } finally {
    gate.release();
    globalThis.fetch = original;
    await pending.catch(() => {});
  }
});

for (const cached of [false, true]) {
  test(`revoking consent during the ${cached ? "cached" : "fresh"} local projection prevents its return`, async () => {
    await consent("USR-04");
    await checkIn(1);
    if (cached) await today();
    const gate = latch();
    const original = globalThis.fetch;
    let reads = 0;
    globalThis.fetch = async (input, init = {}) => {
      const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
      if (/select .* from "check_ins"/i.test(body.sql ?? "") && ++reads === 2) {
        gate.enter();
        await gate.blocked;
      }
      return original(input, init);
    };
    const pending = today();
    try {
      await Promise.race([
        gate.entered,
        pending.then(() => {
          throw new Error("No post-reading context projection occurred");
        }),
      ]);
      await consent("USR-04", false);
      gate.release();
      await assert.rejects(pending, /privacy settings changed|context settings changed/i);
      assert.equal(h.gatewayRequests.length, 1);
    } finally {
      gate.release();
      globalThis.fetch = original;
      await pending.catch(() => {});
    }
  });
}

test("a cached source statement mismatch cannot be labelled as published guidance", async () => {
  const first = await today();
  const row = h.sqlite
    .prepare("SELECT language_meta FROM daily_readings WHERE id=?")
    .get(first.reading.id);
  const meta = JSON.parse(row.language_meta);
  meta.facts.find((fact) => fact.id === "I1").statement =
    "Published interpretation square:saturn:sun: Unrelated saved wording.";
  h.sqlite
    .prepare("UPDATE daily_readings SET language_meta=? WHERE id=?")
    .run(JSON.stringify(meta), first.reading.id);
  const cached = await today();
  assert.ok(cached.localContext.guidance);
  assert.equal(cached.localContext.guidance.basis.interpretation, null);
  assert.equal(h.gatewayRequests.length, 1);
});

for (const changed of ["release", "parent", "geometry", "identity"]) {
  test(`a cached ${changed} mismatch withholds the guidance interpretation binding`, async () => {
    const first = await today();
    const row = h.sqlite
      .prepare("SELECT language_meta FROM daily_readings WHERE id=?")
      .get(first.reading.id);
    const meta = JSON.parse(row.language_meta);
    if (changed === "release")
      meta.facts.find((fact) => fact.id === "I1").releaseVersion = "different-release";
    if (changed === "parent") meta.facts.find((fact) => fact.id === "I1").dependsOn = ["C2"];
    if (changed === "geometry") meta.facts.find((fact) => fact.id === "C1").cycle.orb += 1;
    if (changed === "identity")
      meta.interpretationPlan.interpretations[0].cycleKey = "different-cycle";
    h.sqlite
      .prepare("UPDATE daily_readings SET language_meta=? WHERE id=?")
      .run(JSON.stringify(meta), first.reading.id);
    const cached = await today();
    assert.equal(cached.localContext.guidance.basis.interpretation, null);
    assert.equal(h.gatewayRequests.length, 1);
  });
}

test("a publication during generation cannot rebind guidance to a different active bundle", async () => {
  const { DEFAULT_BUNDLE } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  const next = structuredClone(DEFAULT_BUNDLE);
  next.version = "next-guidance-fixture";
  next.cycles.find((source) => source.key === "square:saturn:sun").themes = ["autonomy"];
  h.setGateway(async (body) => {
    const inserted = await h.records().from("content_releases").insert({
      version: next.version,
      checksum: "guidance-fixture",
      bundle: next,
      is_active: true,
    });
    assert.equal(inserted.error, null);
    return successfulReadingResponse(body);
  });
  const reading = await today();
  assert.equal(reading.reading.release_version, "builtin-0.5.0");
  assert.deepEqual(reading.localContext.guidance.basis.interpretation, {
    key: "square:saturn:sun",
    releaseVersion: "builtin-0.5.0",
    theme: "structure",
  });
  assert.equal(h.gatewayRequests.length, 1);
});

test("fresh and cached guidance use qualified Swiss primary geometry and its published source", async () => {
  await h.reset();
  await seedTransitReading(h);
  const first = await today();
  const cached = await today();
  for (const reading of [first, cached]) {
    assert.equal(reading.storyCalculation.status, "qualified");
    const overlay = reading.storyCalculation.timingOverlay;
    assert.equal(reading.localContext.guidance.basis.calculation.orb, overlay.referenceOrb);
    assert.equal(reading.localContext.guidance.basis.calculation.exactAt, overlay.centralExactAt);
    assert.equal(reading.localContext.guidance.basis.interpretation.key, "square:saturn:sun");
    assert.equal(
      reading.localContext.guidance.basis.interpretation.releaseVersion,
      reading.reading.release_version,
    );
  }
  assert.deepEqual(first.localContext.guidance, cached.localContext.guidance);
  assert.equal(h.episodeRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
});

test("the actual 0.9.2 Jupiter source with empty theme tags supports energy-sensitive guidance", async () => {
  await h.reset();
  const bundle = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-reading-quality/2026-10-18/followup/bundle-0.9.2.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const source = bundle.cycles.find((entry) => entry.key === "soft:jupiter:sun");
  assert.equal(bundle.version, "0.9.2");
  assert.deepEqual(source.themes, []);
  const inserted = await h.records().from("content_releases").insert({
    version: bundle.version,
    checksum: "published-guidance-fixture",
    bundle,
    is_active: true,
  });
  assert.equal(inserted.error, null);
  const e = h.ephemerisModule;
  const lon = e.norm360(e.positionOf("jupiter", e.toJulianDay(now)).lon + 120);
  await h.seedChart(h.records(), h.userA, {
    positions: {
      sun: {
        key: "sun",
        label: "Sun",
        lon,
        sign: e.signOf(lon),
        degree: e.degreeInSign(lon),
        house: 1,
        speed: 1,
        retrograde: false,
        angleDependent: false,
      },
    },
  });
  await consent("USR-04");
  await checkIn(4);
  const first = await today();
  await checkIn(1);
  const second = await today();
  for (const reading of [first, second]) {
    assert.equal(
      reading.language.facts.find((fact) => fact.id === "I1").statement,
      `Published interpretation soft:jupiter:sun: ${source.mechanism}`,
    );
    assert.deepEqual(reading.localContext.guidance.basis.interpretation, {
      key: "soft:jupiter:sun",
      releaseVersion: "0.9.2",
      theme: "expansion",
    });
  }
  assert.notEqual(first.localContext.guidance.action, second.localContext.guidance.action);
  assert.deepEqual(first.cycles, second.cycles);
  assert.deepEqual(first.language.facts, second.language.facts);
  assert.equal(h.gatewayRequests.length, 0);
});

test("an untagged published source supplies its exact question for grounded local guidance", async () => {
  await h.reset();
  const bundle = JSON.parse(
    await readFile(
      new URL(
        "../docs/reviews/daily-reading-quality/2026-10-18/followup/bundle-0.9.2.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const source = bundle.cycles.find((entry) => entry.key === "hard:saturn:sun");
  assert.deepEqual(source.themes, []);
  const inserted = await h.records().from("content_releases").insert({
    version: bundle.version,
    checksum: "published-question-fixture",
    bundle,
    is_active: true,
  });
  assert.equal(inserted.error, null);
  const e = h.ephemerisModule;
  const lon = e.positionOf("saturn", e.toJulianDay(now)).lon;
  await h.seedChart(h.records(), h.userA, {
    positions: {
      sun: {
        key: "sun",
        label: "Sun",
        lon,
        sign: e.signOf(lon),
        degree: e.degreeInSign(lon),
        house: 1,
        speed: 1,
        retrograde: false,
        angleDependent: false,
      },
    },
  });
  await consent("USR-04");
  await checkIn(4);
  const standard = await today();
  await checkIn(1);
  const reading = await today();
  assert.equal(reading.language.facts.find((fact) => fact.id === "I1").sourceKey, source.key);
  assert.deepEqual(reading.localContext.guidance.basis.interpretation, {
    key: source.key,
    releaseVersion: "0.9.2",
    theme: null,
  });
  assert.equal(reading.localContext.guidance.action, source.question);
  assert.equal(standard.localContext.guidance.action, source.question);
  assert.notEqual(standard.localContext.guidance.framing, reading.localContext.guidance.framing);
  assert.deepEqual(standard.language.facts, reading.language.facts);
  assert.deepEqual(standard.cycles, reading.cycles);
  assert.equal(h.gatewayRequests.length, 0);
});
