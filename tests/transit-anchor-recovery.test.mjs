import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { syntheticNatalSamples } from "./helpers/natal-fixtures.mjs";

let h, api, chart, reply;
const now = new Date("2026-10-12T12:00:00Z");
const details = {
  birthDate: "1990-01-01",
  birthTime: "12:00",
  placeLabel: "Synthetic place",
  latitude: 30,
  longitude: 0,
};
before(async () => {
  h = await createRecordsHarness();
  api = await h.vite.ssrLoadModule("/src/lib/astro/transit-anchors.server.ts");
  chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  reply = {
    positions: samples[1].ephemeris.positions,
    version: "synthetic-1",
    positionSource: {
      engine: "swiss-ephemeris",
      engineVersion: "synthetic-1",
      dataId: "synthetic",
      frame: "tropical-apparent-geocentric-true-equinox-of-date",
      timeScale: "UT",
      returnedFlags: 258,
    },
  };
});
beforeEach(async (ctx) => {
  await h.reset();
  ctx.mock.timers.enable({ apis: ["Date"], now });
});
after(async () => h?.close());
async function legacy(accuracy = "exact") {
  h.setSwiss(() => Response.json(reply));
  await h.app.saveBirth(h.records(), h.userA, details, accuracy, "UTC");
  const snapshot = await h.app.loadSnapshot(h.records(), h.userA);
  const houses = { ...snapshot.houses };
  delete houses.transitAnchors_ct;
  await h.records().from("chart_snapshots").update({ houses }).eq("id", snapshot.id);
  return {
    snapshot: await h.app.loadSnapshot(h.records(), h.userA),
    dek: await h.app.getDek(h.records(), h.userA),
  };
}
async function recover(snapshot, dek, at = now) {
  assert.equal(
    typeof api.ensureTransitAnchors,
    "function",
    "Independent legacy anchor recovery is missing",
  );
  return api.ensureTransitAnchors(h.records(), h.userA, snapshot, dek, at);
}
test("current natal reliability does not prevent independent legacy anchor recovery", async () => {
  const { snapshot, dek } = await legacy();
  const oldNatal = snapshot.houses.natalReliability_ct;
  assert.equal((await h.app.loadNatalReliability(snapshot, dek)).status, "screened");
  const result = await recover(snapshot, dek);
  assert.equal(result.status, "available");
  assert.equal(result.origin, "recovered");
  assert.equal(h.swissRequests.length, 6);
  const saved = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal(saved.houses.natalReliability_ct, oldNatal);
  assert.equal((await h.app.loadTransitAnchors(saved, dek)).status, "screened");
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal((await recover(snapshot, dek)).origin, "existing");
  assert.equal(h.swissRequests.length, 6, "A stale caller snapshot must reuse completed recovery");
});

test("Timing can perform the first recovery and leaves saved historical readings intact", async () => {
  const { dek } = await legacy();
  const body = await h.cryptoModule.encryptField(dek, "Synthetic historical body");
  h.sqlite
    .prepare(
      "INSERT INTO daily_readings(id,user_id,reading_date,headline,body_ct,idempotency_key) VALUES(?,?,?,?,?,?)",
    )
    .run("historical", h.userA, "2026-10-01", "Historical", body, "historical");
  await h.app.getCyclesFor(h.records(), h.userA, "2026-10-12", "UTC");
  assert.equal(h.swissRequests.length, 6);
  assert.equal(
    (await h.app.loadTransitAnchors(await h.app.loadSnapshot(h.records(), h.userA), dek)).status,
    "screened",
  );
  assert.equal(
    h.sqlite.prepare("SELECT body_ct FROM daily_readings WHERE id='historical'").get().body_ct,
    body,
  );
});

test("a saved fingerprint that disagrees with birth input never triggers a recovery calculation", async () => {
  const { snapshot, dek } = await legacy();
  h.sqlite
    .prepare("UPDATE birth_profiles SET fingerprint=? WHERE user_id=?")
    .run("wrong-saved-fingerprint", h.userA);
  h.sqlite
    .prepare("UPDATE chart_snapshots SET fingerprint=? WHERE id=?")
    .run("wrong-saved-fingerprint", snapshot.id);
  const result = await recover({ ...snapshot, fingerprint: "wrong-saved-fingerprint" }, dek);
  assert.equal(result.reason, "fingerprint_mismatch");
  assert.equal(h.swissRequests.length, 3);
});
test("Today and Timing recover missing anchors without re-saving birth details", async () => {
  const { dek } = await legacy();
  const before = h.sqlite
    .prepare("SELECT payload_ct FROM birth_profiles WHERE user_id=?")
    .get(h.userA).payload_ct;
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(
    (await h.app.loadTransitAnchors(await h.app.loadSnapshot(h.records(), h.userA), dek))?.status,
    "screened",
  );
  assert.equal(h.swissRequests.length, 6);
  const again = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(
    again.reading.id,
    first.reading.id,
    "Recovery bookkeeping must not create another reading identity",
  );
  await h.app.getCyclesFor(h.records(), h.userA, "2026-10-12", "UTC");
  assert.equal(h.swissRequests.length, 6);
  assert.equal(
    h.sqlite.prepare("SELECT payload_ct FROM birth_profiles WHERE user_id=?").get(h.userA)
      .payload_ct,
    before,
  );
});
test("unknown time and absent saved birth input stay explicitly unavailable", async () => {
  const unknown = await legacy("unknown");
  assert.equal((await recover(unknown.snapshot, unknown.dek)).reason, "unknown_time");
  assert.equal(h.swissRequests.length, 1);
  await h.reset();
  const { snapshot, dek } = await legacy();
  h.sqlite
    .prepare("UPDATE birth_profiles SET payload_ct=? WHERE user_id=?")
    .run(await h.cryptoModule.encryptJson(dek, {}), h.userA);
  const result = await recover(snapshot, dek);
  assert.equal(result.status, "unavailable");
  assert.equal(result.reason, "birth_input_unavailable");
  assert.equal(h.swissRequests.length, 3);
});
test("present corrupt or mismatched ciphertext fails integrity without a calculation", async () => {
  const { snapshot, dek } = await legacy();
  const broken = { ...snapshot, houses: { ...snapshot.houses, transitAnchors_ct: "broken" } };
  await assert.rejects(recover(broken, dek), /assessment could not be loaded/);
  await assert.rejects(
    recover({ ...snapshot, houses: "broken-json" }, dek),
    /assessment could not be loaded/,
  );
  assert.equal(h.swissRequests.length, 3);
});
test("two recovery requests share a persisted lease and preserve newer natal metadata", async () => {
  const { snapshot, dek } = await legacy();
  let entered, release;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let first = true;
  h.setSwiss(async () => {
    if (first) {
      first = false;
      entered();
      await held;
    }
    return Response.json(reply);
  });
  const running = recover(snapshot, dek);
  await started;
  try {
    const second = await recover(snapshot, dek);
    assert.equal(second.status, "unavailable");
    assert.equal(second.reason, "recovery_in_progress");
    const current = await h.app.loadSnapshot(h.records(), h.userA);
    await h
      .records()
      .from("chart_snapshots")
      .update({ houses: { ...current.houses, separateNatalRevision: "newer" } })
      .eq("id", snapshot.id);
  } finally {
    release();
  }
  assert.equal((await running).status, "available");
  assert.equal(h.swissRequests.length, 6);
  assert.equal(
    (await h.app.loadSnapshot(h.records(), h.userA)).houses.separateNatalRevision,
    "newer",
  );
});
test("an overlapping birth save discards the recovery result for the old fingerprint", async () => {
  const { snapshot, dek } = await legacy();
  let entered, release;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let first = true;
  h.setSwiss(async () => {
    if (first) {
      first = false;
      entered();
      await held;
    }
    return Response.json(reply);
  });
  const running = recover(snapshot, dek);
  await started;
  let saved;
  try {
    saved = await h.app.saveBirth(
      h.records(),
      h.userA,
      { ...details, birthDate: "1991-02-03" },
      "exact",
      "UTC",
    );
  } finally {
    release();
  }
  assert.equal((await running).reason, "snapshot_changed");
  const old = await h.records().from("chart_snapshots").select("*").eq("id", snapshot.id).single();
  assert.equal(old.data.houses.transitAnchors_ct, undefined);
  assert.equal((await h.app.loadSnapshot(h.records(), h.userA)).id, saved.snapshotId);
});
test("degraded recovery waits six hours before another bounded attempt", async (ctx) => {
  const { snapshot, dek } = await legacy();
  h.setSwiss(() => new Response(null, { status: 503 }));
  const failed = await recover(snapshot, dek);
  assert.equal(failed.status, "unavailable");
  const attempted = h.swissRequests.length;
  const current = await h.app.loadSnapshot(h.records(), h.userA);
  assert.equal((await recover(current, dek)).reason, "recovery_backoff");
  assert.equal(h.swissRequests.length, attempted);
  ctx.mock.timers.setTime(now.getTime() + 6 * 60 * 60 * 1000);
  h.setSwiss(() => Response.json(reply));
  assert.equal(
    (await recover(await h.app.loadSnapshot(h.records(), h.userA), dek, new Date())).status,
    "available",
  );
  assert.equal(h.swissRequests.length, attempted + 3);
});
