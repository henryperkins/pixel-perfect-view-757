import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedNatalReading, natalReadingResponse } from "./helpers/natal-fixtures.mjs";
let h;
before(async () => {
  h = await createRecordsHarness();
});
beforeEach(async () => h.reset());
after(async () => h?.close());
test("owner_export_contains_saved_natal_evidence_and_accounts_stay_isolated", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  await seedNatalReading(h);
  h.setGateway(natalReadingResponse);
  const today = await h.app.getToday(h.records(), h.userA, "UTC");
  const exported = await h.app.exportEverything(h.records(), h.userA);
  const reading = exported.readings.find((r) => r.id === today.reading.id);
  assert.deepEqual(reading.language.natalLens, today.language.natalLens);
  assert.equal(reading.release_version, today.reading.release_version);
  assert.deepEqual(reading.paragraphs, today.reading.paragraphs);
  const other = await h.app.exportEverything(h.records(), h.userB);
  assert.deepEqual(other.readings, []);
  assert.ok(!JSON.stringify(other).includes("nl-moon"));
});
test("failed_export_or_erasure_is_reported_and_retry_retains_the_owner_key", async () => {
  await seedNatalReading(h);
  h.setGateway(natalReadingResponse);
  await h.app.getToday(h.records(), h.userA, "UTC");
  h.setFault({ matches: (sql) => /select .* from "daily_readings"/i.test(sql) });
  await assert.rejects(h.app.exportEverything(h.records(), h.userA), /could not be exported/);
  h.setFault({ matches: (sql) => /delete from "chart_snapshots"/i.test(sql) });
  await assert.rejects(h.app.eraseEverything(h.records(), h.userA), /could not be fully deleted/);
  assert.ok(
    h.sqlite.prepare("SELECT wrapped_dek FROM profiles WHERE id=?").get(h.userA).wrapped_dek,
  );
  h.setFault(null);
  await h.app.eraseEverything(h.records(), h.userA);
  assert.equal(
    h.sqlite.prepare("SELECT count(*) AS n FROM chart_snapshots WHERE user_id=?").get(h.userA).n,
    0,
  );
});
test("account_erasure_removes_all_natal_evidence", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  const { snapshotId } = await seedNatalReading(h);
  h.setGateway(natalReadingResponse);
  await h.app.getToday(h.records(), h.userA, "UTC");
  // A chapter essay keeps a plaintext feature key; a birth save keeps a birth fingerprint.
  h.sqlite
    .prepare(
      "INSERT INTO feature_narratives (id, user_id, snapshot_id, feature_key, narrative_ct) VALUES (?, ?, ?, ?, ?)",
    )
    .run("essay-a", h.userA, snapshotId, "aspect_moon_trine_saturn", "sealed");
  h.sqlite
    .prepare("INSERT INTO audit_events (id, user_id, kind, detail) VALUES (?, ?, ?, ?)")
    .run(
      "audit-a",
      h.userA,
      "birth_profile.saved",
      JSON.stringify({ fingerprint: "birth-derived", accuracy: "exact" }),
    );
  await h.app.eraseEverything(h.records(), h.userA);
  for (const table of [
    "chart_snapshots",
    "daily_readings",
    "reading_sources",
    "birth_profiles",
    "feature_narratives",
  ])
    assert.equal(
      h.sqlite.prepare(`SELECT count(*) AS n FROM ${table} WHERE user_id=?`).get(h.userA).n,
      0,
      table,
    );
  assert.equal(
    h.sqlite.prepare("SELECT wrapped_dek FROM profiles WHERE id=?").get(h.userA).wrapped_dek,
    null,
  );
  const retained = h.sqlite
    .prepare("SELECT kind, detail FROM audit_events WHERE user_id=? ORDER BY kind")
    .all(h.userA);
  assert.deepEqual(
    retained.map((row) => [row.kind, row.detail]),
    [
      ["account.erased", "{}"],
      ["birth_profile.saved", "{}"],
    ],
  );
  assert.ok(!JSON.stringify(retained).includes("birth-derived"));
});

test("one_unreadable_saved_reading_is_marked_without_blocking_export", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  const { dek } = await seedNatalReading(h);
  h.setGateway(natalReadingResponse);
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  context.mock.timers.setTime(Date.parse("2026-10-12T12:00:00Z"));
  const second = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.notEqual(second.reading.id, first.reading.id);
  assert.ok(second.language.natalLens);
  const saved = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(first.reading.id);
  const meta = JSON.parse(saved.language_meta);
  h.sqlite
    .prepare("UPDATE daily_readings SET language_meta=? WHERE id=?")
    .run(JSON.stringify({ ...meta, natal_lens_ct: "broken" }), first.reading.id);
  const exported = await h.app.exportEverything(h.records(), h.userA);
  assert.equal(exported.unreadableReadings, 1);
  const broken = exported.readings.find((r) => r.id === first.reading.id);
  assert.deepEqual(broken.unreadable, ["language"]);
  assert.equal(broken.language, null);
  assert.equal(broken.body, first.reading.body);
  assert.deepEqual(broken.paragraphs, first.reading.paragraphs);
  const intact = exported.readings.find((r) => r.id === second.reading.id);
  assert.equal(intact.unreadable, undefined);
  assert.deepEqual(intact.language.natalLens, second.language.natalLens);
  // The owner's reading view still fails closed instead of reconstructing evidence.
  await assert.rejects(
    h.app.readingLanguage({ ...saved, language_meta: { ...meta, natal_lens_ct: "broken" } }, dek),
    /could not be loaded/,
  );
});
