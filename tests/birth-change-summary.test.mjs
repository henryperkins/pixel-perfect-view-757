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

function assertReadOnlyRecovery(start) {
  assert.equal(h.swissRequests.length, 0, "Recovery must not request another calculation");
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  assert.deepEqual(
    h.requests.slice(start).filter(({ sql }) => /^\s*(insert|update|delete|replace)\b/i.test(sql)),
    [],
    "Recovery must not rewrite the profile, snapshot, features or audit history",
  );
}

test("retrying a birth correction after its response is lost returns the committed chart without writes", async () => {
  const initial = await save();
  const correction = { ...details, birthDate: "1991-02-03" };
  const committed = await save(correction, "exact", "UTC", initial.revision);
  const profileBefore = h.sqlite
    .prepare("SELECT * FROM birth_profiles WHERE user_id=?")
    .get(h.userA);
  const chartBefore = h.sqlite
    .prepare("SELECT * FROM chart_snapshots WHERE id=?")
    .get(committed.snapshotId);
  const auditBefore = h.sqlite
    .prepare("SELECT * FROM audit_events WHERE user_id=? ORDER BY id")
    .all(h.userA);
  const start = h.requests.length;
  h.setSwiss(() => Response.json({ error: "Recovery must not calculate" }, { status: 503 }));

  // The browser retained the pre-save revision because it never received the first response.
  const recovered = await save(correction, "exact", "UTC", initial.revision);

  assert.equal(recovered.snapshotId, committed.snapshotId);
  assert.equal(recovered.fingerprint, committed.fingerprint);
  assert.equal(recovered.revision, committed.revision);
  assert.deepEqual(recovered.changeSummary.changedFields, []);
  assert.equal(recovered.changeSummary.unchanged, true);
  assert.deepEqual(recovered.changeSummary.current, committed.changeSummary.current);
  assert.deepEqual(recovered.changeSummary.previous, committed.changeSummary.current);
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM birth_profiles WHERE user_id=?").get(h.userA),
    profileBefore,
  );
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM chart_snapshots WHERE id=?").get(committed.snapshotId),
    chartBefore,
  );
  assert.deepEqual(
    h.sqlite.prepare("SELECT * FROM audit_events WHERE user_id=? ORDER BY id").all(h.userA),
    auditBefore,
  );
  assertReadOnlyRecovery(start);
});

test("a first-save replay with a null revision recovers only the same canonical values", async () => {
  const committed = await save(details, "exact", "UTC", null);
  const start = h.requests.length;
  h.setSwiss(() => Response.json({ error: "Recovery must not calculate" }, { status: 503 }));

  const recovered = await save(details, "exact", "UTC", null);
  assert.equal(recovered.snapshotId, committed.snapshotId);
  assert.equal(recovered.revision, committed.revision);
  assert.equal(recovered.changeSummary.unchanged, true);
  await assert.rejects(
    save({ ...details, birthDate: "1992-03-04" }, "exact", "UTC", null),
    /changed in another tab/,
  );
  assertReadOnlyRecovery(start);
});

test("unknown-time recovery compares noon without changing the committed record", async () => {
  const initial = await save();
  const committed = await save(
    { ...details, birthTime: "12:00" },
    "unknown",
    "UTC",
    initial.revision,
  );
  const start = h.requests.length;
  h.setSwiss(() => Response.json({ error: "Recovery must not calculate" }, { status: 503 }));

  const recovered = await save(details, "unknown", "UTC", initial.revision);
  assert.equal(recovered.revision, committed.revision);
  assert.equal(recovered.changeSummary.unchanged, true);
  assert.equal((await h.app.loadBirthRecord(h.records(), h.userA)).birthTime, "12:00");
  assertReadOnlyRecovery(start);
});

test("stale unchanged forms and fingerprint-equivalent but distinct values still conflict", async () => {
  const initial = await save();
  const correction = { ...details, birthDate: "1991-02-03" };
  const committed = await save(correction, "exact", "UTC", initial.revision);
  const start = h.requests.length;
  h.setSwiss(() => Response.json({ error: "Conflicts must not calculate" }, { status: 503 }));
  const distinct = [
    [details, "exact", "UTC"],
    [{ ...correction, birthTime: "08:11" }, "exact", "UTC"],
    [{ ...correction, placeLabel: "A different label" }, "exact", "UTC"],
    [{ ...correction, latitude: 30.000001 }, "exact", "UTC"],
    [{ ...correction, longitude: 0.000001 }, "exact", "UTC"],
    [correction, "near", "UTC"],
    [correction, "exact", "Etc/UTC"],
  ];
  for (const [value, accuracy, timezone] of distinct) {
    await assert.rejects(
      save(value, accuracy, timezone, initial.revision),
      /changed in another tab/,
    );
  }
  assert.equal((await h.app.loadBirthRecord(h.records(), h.userA)).revision, committed.revision);
  assertReadOnlyRecovery(start);
});

test("recovery never claims success without the matching committed chart", async () => {
  const initial = await save();
  const correction = { ...details, birthDate: "1991-02-03" };
  const committed = await save(correction, "exact", "UTC", initial.revision);
  h.sqlite.prepare("DELETE FROM chart_snapshots WHERE id=?").run(committed.snapshotId);
  const start = h.requests.length;
  h.setSwiss(() => Response.json({ error: "Recovery must not calculate" }, { status: 503 }));

  await assert.rejects(
    save(correction, "exact", "UTC", initial.revision),
    /saved chart could not be loaded/,
  );
  assert.ok(h.sqlite.prepare("SELECT id FROM chart_snapshots WHERE id=?").get(initial.snapshotId));
  assertReadOnlyRecovery(start);
});

test("a birth edit committed during recovery cannot be acknowledged as the recovered chart", async () => {
  const initial = await save();
  const correction = { ...details, birthDate: "1991-02-03" };
  await save(correction, "exact", "UTC", initial.revision);
  const committedRow = h.sqlite
    .prepare("SELECT * FROM birth_profiles WHERE user_id=?")
    .get(h.userA);
  const newer = await save({ ...details, birthDate: "1992-03-04" });
  const newerRow = h.sqlite.prepare("SELECT * FROM birth_profiles WHERE user_id=?").get(h.userA);
  const replace = h.sqlite.prepare(
    "UPDATE birth_profiles SET payload_ct=?,fingerprint=? WHERE user_id=?",
  );
  replace.run(committedRow.payload_ct, committedRow.fingerprint, h.userA);
  let replaced = false;
  h.setFault({
    matches: (sql) => {
      if (!replaced && /^select .*from "?chart_snapshots/i.test(sql)) {
        replaced = true;
        replace.run(newerRow.payload_ct, newerRow.fingerprint, h.userA);
      }
      return false;
    },
  });
  const start = h.requests.length;
  h.setSwiss(() => Response.json({ error: "Recovery must not calculate" }, { status: 503 }));

  await assert.rejects(
    save(correction, "exact", "UTC", initial.revision),
    /changed in another tab/,
  );
  assert.equal(replaced, true);
  assert.equal((await h.app.loadBirthRecord(h.records(), h.userA)).revision, newer.revision);
  assertReadOnlyRecovery(start);
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

test("a failed birth-record read cannot be mistaken for an empty account during recovery", async () => {
  await save();
  h.setFault({ matches: (sql) => /select .*from "?birth_profiles"?/i.test(sql) });
  await assert.rejects(h.app.loadBirthRecord(h.records(), h.userA), /could not be loaded|retry/i);
});
