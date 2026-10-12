import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedTransitReading } from "./helpers/transit-fixtures.mjs";

let h;
before(async () => (h = await createRecordsHarness()));
beforeEach(() => h.reset());
after(async () => h?.close());

async function enableContext() {
  await h.app.setConsent(h.records(), h.userA, "USR-01", true);
  await h.app.setConsent(h.records(), h.userA, "AMB-02", true);
  await h.records().from("profiles").update({ tone_pref: "warm" }).eq("id", h.userA);
}

const sourceInsert = (sql) => sql.startsWith('insert into "reading_sources"');

test("a natal story with context saves complete provenance within the D1 parameter limit", async () => {
  await seedTransitReading(h, { natal: true });
  await enableContext();
  h.setFault({ matches: (_sql, params) => params.length > 100 });

  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.ok(first.language.natalLens);
  assert.equal(first.language.transitStory.plan.status, "selected");
  const row = h.sqlite
    .prepare("SELECT language_meta FROM daily_readings WHERE id=?")
    .get(first.reading.id);
  const expected = JSON.parse(row.language_meta).sourceCount;
  assert.ok(expected * 7 > 100, "the complete provenance exceeds one D1 statement");
  const count = h.sqlite
    .prepare("SELECT count(*) AS n FROM reading_sources WHERE reading_id=?")
    .get(first.reading.id).n;
  assert.equal(count, expected);
  const inserts = h.requests.filter(({ sql }) => sourceInsert(sql));
  assert.ok(inserts.length > 1);
  assert.ok(inserts.every(({ params }) => params.length <= 100));

  const writes = inserts.length;
  const reopened = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(reopened.reading.id, first.reading.id);
  assert.deepEqual(reopened.provenance, first.provenance);
  assert.equal(h.requests.filter(({ sql }) => sourceInsert(sql)).length, writes);
});

test("a later provenance chunk failure removes only the incomplete new reading", async () => {
  await seedTransitReading(h, { natal: true });
  const previous = await h.app.getToday(h.records(), h.userA, "UTC");
  const previousSourceCount = h.sqlite
    .prepare("SELECT count(*) AS n FROM reading_sources WHERE reading_id=?")
    .get(previous.reading.id).n;
  await enableContext();
  let inserts = 0;
  h.setFault({
    matches(sql, params) {
      if (!sourceInsert(sql)) return false;
      assert.ok(params.length <= 100);
      return ++inserts === 2;
    },
  });
  await assert.rejects(
    h.app.getToday(h.records(), h.userA, "UTC"),
    /Reading sources could not be saved/,
  );
  assert.equal(inserts, 2);
  assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM daily_readings").get().n, 1);
  assert.equal(
    h.sqlite.prepare("SELECT count(*) AS n FROM reading_sources").get().n,
    previousSourceCount,
  );
  assert.equal(h.sqlite.prepare("SELECT id FROM daily_readings").get().id, previous.reading.id);

  h.setFault(null);
  const recovered = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.notEqual(recovered.reading.id, previous.reading.id);
  assert.ok(recovered.provenance.length * 7 > 100);
});
