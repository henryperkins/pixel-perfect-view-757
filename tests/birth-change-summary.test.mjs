import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { syntheticNatalSamples } from "./helpers/natal-fixtures.mjs";

let h, chart;
before(async () => {
  h = await createRecordsHarness();
  chart = await h.vite.ssrLoadModule("/src/lib/astro/chart.ts");
});
beforeEach(async () => h.reset());
after(async () => h?.close());
const details = {
  birthDate: "1990-01-01",
  birthTime: "08:10",
  placeLabel: "Synthetic place",
  latitude: 30,
  longitude: 0,
};
const save = (value = details, accuracy = "exact", timezone = "UTC", revision) =>
  h.app.saveBirth(h.records(), h.userA, value, accuracy, timezone, revision);

test("birth save reports the precision and support of the committed chart", async () => {
  const saved = await save();
  assert.ok(saved.changeSummary, "Birth change feedback is missing");
  const stored = h.app.snapshotToChart(await h.app.loadSnapshot(h.records(), h.userA));
  const summary = saved.changeSummary;
  assert.deepEqual(summary.changedFields, ["date", "time", "accuracy", "place"]);
  assert.equal(summary.previous, null);
  assert.equal(summary.current.engine, `${stored.engine}@${stored.engineVersion}`);
  assert.equal(summary.current.precision, stored.precision);
  assert.equal(summary.current.houseSystem, stored.houseSystem);
  assert.equal(summary.current.timeAccuracy, stored.uncertainty.accuracy);
  assert.equal(summary.current.housesSupported, stored.uncertainty.housesReliable);
  assert.equal(summary.current.anglesSupported, !stored.uncertainty.angleClaimsSuppressed);
  assert.equal(summary.unchanged, false);
  assert.equal(h.gatewayRequests.length, 0);
});

test("exact to unknown and back reports suppression from the saved calculation", async () => {
  await save();
  const unknown = await save({ ...details, birthTime: "12:00" }, "unknown");
  assert.deepEqual(unknown.changeSummary.changedFields, ["time", "accuracy"]);
  assert.equal(unknown.changeSummary.previous.housesSupported, true);
  assert.equal(unknown.changeSummary.current.housesSupported, false);
  assert.equal(unknown.changeSummary.current.anglesSupported, false);
  const exact = await save();
  assert.equal(exact.changeSummary.previous.anglesSupported, false);
  assert.equal(exact.changeSummary.current.anglesSupported, true);
});

test("place coordinates and timezone changes are explained as a place change", async () => {
  await save();
  const result = await save(
    { ...details, latitude: 41.8, longitude: -87.6, placeLabel: "Other synthetic place" },
    "exact",
    "America/Chicago",
  );
  assert.deepEqual(result.changeSummary.changedFields, ["place"]);
  assert.equal(result.changeSummary.unchanged, false);
});

test("unchanged birth details have an explicit no-change result and reuse their snapshot", async () => {
  const first = await save();
  const again = await save();
  assert.equal(again.snapshotId, first.snapshotId);
  assert.deepEqual(again.changeSummary.changedFields, []);
  assert.equal(again.changeSummary.unchanged, true);
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) n FROM chart_snapshots WHERE user_id=?").get(h.userA).n,
    1,
  );
});

test("a failed snapshot write preserves the previous encrypted birth and usable chart atomically", async () => {
  const first = await save();
  const before = h.sqlite.prepare("SELECT * FROM birth_profiles WHERE user_id=?").get(h.userA);
  const features = h.sqlite
    .prepare("SELECT * FROM natal_features WHERE snapshot_id=? ORDER BY id")
    .all(first.snapshotId);
  h.setFault({ matches: (sql) => /^insert into "?chart_snapshots/i.test(sql) });
  await assert.rejects(
    save({ ...details, birthDate: "1991-02-03" }),
    /could not be saved|records batch failed|forced/i,
  );
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM birth_profiles WHERE user_id=?").get(h.userA),
    before,
  );
  assert.equal((await h.app.loadSnapshot(h.records(), h.userA)).id, first.snapshotId);
  assert.deepEqual(
    h.sqlite
      .prepare("SELECT * FROM natal_features WHERE snapshot_id=? ORDER BY id")
      .all(first.snapshotId),
    features,
  );
});

test("a stale form revision cannot overwrite a birth record saved in another tab", async () => {
  await save();
  const old = await h.app.loadBirthRecord(h.records(), h.userA);
  assert.equal(typeof old.revision, "string", "Birth forms need an owner-scoped revision");
  await save({ ...details, birthDate: "1991-02-03" }, "exact", "UTC", old.revision);
  await assert.rejects(
    save({ ...details, birthDate: "1992-03-04" }, "exact", "UTC", old.revision),
    /changed in another tab/,
  );
  assert.equal((await h.app.loadBirthRecord(h.records(), h.userA)).birthDate, "1991-02-03");
});

test("a slower overlapping save cannot claim success after a newer chart has committed", async () => {
  await save();
  const samples = syntheticNatalSamples(chart, h.ephemerisModule);
  let entered, release;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let firstRequest = true;
  h.setSwiss(async () => {
    if (firstRequest) {
      firstRequest = false;
      entered();
      await held;
    }
    return Response.json({ positions: samples[1].ephemeris.positions, version: "synthetic-1" });
  });
  const older = save({ ...details, birthDate: "1991-02-03" });
  await started;
  let newer;
  try {
    newer = await save({ ...details, birthDate: "1992-03-04" });
  } finally {
    release();
  }
  await assert.rejects(older, /changed in another tab/);
  assert.equal((await h.app.loadSnapshot(h.records(), h.userA)).id, newer.snapshotId);
  assert.equal((await h.app.loadBirthRecord(h.records(), h.userA)).birthDate, "1992-03-04");
});

test("invalid calculation input leaves the prior chart and record available", async () => {
  const first = await save();
  await assert.rejects(save(details, "exact", "Invalid/Zone"));
  assert.equal((await h.app.loadSnapshot(h.records(), h.userA)).id, first.snapshotId);
  assert.equal((await h.app.loadBirthRecord(h.records(), h.userA)).birthDate, details.birthDate);
});
