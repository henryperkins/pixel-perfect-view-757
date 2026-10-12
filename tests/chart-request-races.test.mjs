import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness, successfulReadingResponse } from "./helpers/records-harness.mjs";
import { syntheticNatalSamples, activateNatalCandidate } from "./helpers/natal-fixtures.mjs";

let h, chart, anchors, oldReply;
const details = {
  birthDate: "1990-01-01",
  birthTime: "12:00",
  placeLabel: "Synthetic place",
  latitude: 30,
  longitude: 0,
};
before(async () => {
  h = await createRecordsHarness();
  chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  anchors = await h.vite.ssrLoadModule("/src/lib/astro/transit-anchors.server.ts");
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  oldReply = {
    positions: samples[1].ephemeris.positions,
    version: "synthetic-old",
    positionSource: {
      engine: "swiss-ephemeris",
      engineVersion: "synthetic-old",
      dataId: "synthetic",
      frame: "tropical-apparent-geocentric-true-equinox-of-date",
      timeScale: "UT",
      returnedFlags: 258,
    },
  };
});
beforeEach(async (ctx) => {
  await h.reset();
  ctx.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-12T12:00:00Z") });
});
after(async () => h?.close());
async function savedLegacy() {
  h.setSwiss(() => Response.json(oldReply));
  await h.app.saveBirth(h.records(), h.userA, details, "exact", "UTC");
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  const houses = { ...snapshot.houses };
  delete houses.natalReliability_ct;
  delete houses.natalReliabilityCheckedAt;
  delete houses.transitAnchors_ct;
  await h.records().from("chart_snapshots").update({ houses }).eq("id", snapshot.id);
  return {
    snapshot: await h.app.loadSnapshot(h.records(), h.userA),
    dek: await h.app.getDek(h.records(), h.userA),
  };
}
function holdDatabase(matches) {
  const original = globalThis.fetch;
  let enter, release;
  let first = true;
  const started = new Promise((r) => {
    enter = r;
  });
  const held = new Promise((r) => {
    release = r;
  });
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    let statements = [];
    if (url.includes("/d1/")) {
      const body = JSON.parse(init.body);
      statements = body.statements ?? [body];
    }
    if (first && statements.some(matches)) {
      first = false;
      enter();
      await held;
    }
    return original(input, init);
  };
  return {
    started,
    release,
    restore: () => {
      release();
      globalThis.fetch = original;
    },
  };
}
test("a newer same-fingerprint birth save cannot be overwritten by an older natal rescreen", async () => {
  const { snapshot, dek } = await savedLegacy();
  const pause = holdDatabase(({ sql }) => /^select\s+"?id"?\s+from\s+"chart_snapshots"/i.test(sql));
  const running = h.app.rescreenNatalSnapshot(h.records(), h.userA, snapshot, dek);
  await pause.started;
  try {
    h.setSwiss(() =>
      Response.json({
        ...oldReply,
        version: "synthetic-new",
        positionSource: { ...oldReply.positionSource, engineVersion: "synthetic-new" },
      }),
    );
    const newer = await h.app.saveBirth(h.records(), h.userA, details, "exact", "UTC");
    assert.equal(newer.changeSummary.current.engine, "swiss-ephemeris@synthetic-new");
    pause.release();
    await assert.rejects(running, /birth.*changed|records batch/i);
    assert.equal(
      (await h.app.loadSnapshot(h.records(), h.userA)).engine,
      "swiss-ephemeris@synthetic-new",
    );
  } finally {
    pause.restore();
    await running.catch(() => {});
  }
});
test("a failed natal attempt cannot erase anchors and metadata recovered concurrently", async () => {
  const { snapshot, dek } = await savedLegacy();
  h.setSwiss(() => new Response(null, { status: 503 }));
  const pause = holdDatabase(({ sql }) => /^update\s+"?chart_snapshots/i.test(sql));
  const running = h.app.rescreenNatalSnapshot(h.records(), h.userA, snapshot, dek);
  await pause.started;
  try {
    h.setSwiss(() => Response.json(oldReply));
    assert.equal(
      (await anchors.ensureTransitAnchors(h.records(), h.userA, snapshot, dek, new Date())).status,
      "available",
    );
    const before = await h.app.loadSnapshot(h.records(), h.userA);
    pause.release();
    assert.equal(await running, false);
    const after = await h.app.loadSnapshot(h.records(), h.userA);
    assert.equal(after.houses.transitAnchors_ct, before.houses.transitAnchors_ct);
    assert.deepEqual(after.houses.transitAnchorRecovery, before.houses.transitAnchorRecovery);
  } finally {
    pause.restore();
    await running.catch(() => {});
  }
});
test("a failed natal assessment cannot take over an active independent recovery lease", async () => {
  const { snapshot, dek } = await savedLegacy();
  let natalEntered, natalRelease, recoveryEntered, recoveryRelease;
  const natalStarted = new Promise((r) => {
    natalEntered = r;
  });
  const natalHeld = new Promise((r) => {
    natalRelease = r;
  });
  const recoveryStarted = new Promise((r) => {
    recoveryEntered = r;
  });
  const recoveryHeld = new Promise((r) => {
    recoveryRelease = r;
  });
  h.setSwiss(async () => {
    natalEntered();
    await natalHeld;
    return new Response(null, { status: 503 });
  });
  const natal = h.app.rescreenNatalSnapshot(h.records(), h.userA, snapshot, dek);
  await natalStarted;
  let first = true;
  h.setSwiss(async () => {
    if (first) {
      first = false;
      recoveryEntered();
      await recoveryHeld;
    }
    return Response.json(oldReply);
  });
  const recovery = anchors.ensureTransitAnchors(h.records(), h.userA, snapshot, dek, new Date());
  await recoveryStarted;
  try {
    const token = (await h.app.loadSnapshot(h.records(), h.userA)).houses.transitAnchorRecovery
      .token;
    natalRelease();
    assert.equal(await natal, false);
    assert.equal(
      (await h.app.loadSnapshot(h.records(), h.userA)).houses.transitAnchorRecovery.token,
      token,
    );
    recoveryRelease();
    assert.equal((await recovery).status, "available");
    assert.equal(
      (await h.app.loadTransitAnchors(await h.app.loadSnapshot(h.records(), h.userA), dek)).status,
      "screened",
    );
  } finally {
    natalRelease();
    recoveryRelease();
    await Promise.all([natal.catch(() => {}), recovery.catch(() => {})]);
  }
});

test("one Today preparation does not repeat a failed shared birth calculation", async () => {
  await savedLegacy();
  await activateNatalCandidate(h);
  h.setSwiss(() => new Response(null, { status: 503 }));
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 4);
  const again = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.swissRequests.length, 4);
  assert.equal(again.reading.id, first.reading.id);
});
test("Timing refuses an old exact-time result after a held recovery overlaps an unknown-time save", async () => {
  await savedLegacy();
  let enter, release;
  let first = true;
  const started = new Promise((r) => {
    enter = r;
  });
  const held = new Promise((r) => {
    release = r;
  });
  h.setSwiss(async () => {
    if (first) {
      first = false;
      enter();
      await held;
    }
    return Response.json(oldReply);
  });
  const running = h.app.getCyclesFor(h.records(), h.userA, "2026-10-12", "UTC");
  await started;
  try {
    await h.app.saveBirth(h.records(), h.userA, details, "unknown", "UTC");
    release();
    await assert.rejects(running, /birth.*changed|chart.*changed|reload/i);
    assert.equal((await h.app.loadSnapshot(h.records(), h.userA)).uncertainty.accuracy, "unknown");
  } finally {
    release();
    await running.catch(() => {});
  }
});
test("a held member model result cannot save or return after a birth revision changes", async () => {
  const e = h.ephemerisModule,
    lon = e.positionOf("saturn", e.toJulianDay(new Date())).lon;
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
  let enter, release;
  const started = new Promise((r) => {
    enter = r;
  });
  const held = new Promise((r) => {
    release = r;
  });
  h.setGateway(async (body) => {
    enter();
    await held;
    return successfulReadingResponse(body);
  });
  const running = h.app.getToday(h.records(), h.userA, "UTC");
  await started;
  try {
    await h.app.saveBirth(h.records(), h.userA, details, "unknown", "UTC");
    release();
    await assert.rejects(running, /birth.*changed|chart.*changed|reload/i);
    assert.equal(
      h.sqlite.prepare("SELECT COUNT(*) n FROM daily_readings WHERE user_id=?").get(h.userA).n,
      0,
    );
    assert.equal(h.gatewayRequests.length, 1);
  } finally {
    release();
    await running.catch(() => {});
  }
});
