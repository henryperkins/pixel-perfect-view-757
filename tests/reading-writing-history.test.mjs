import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedNatalReading } from "./helpers/natal-fixtures.mjs";
let h, candidate;
before(async () => {
  h = await createRecordsHarness();
  ({ WRITING_CANDIDATE_BUNDLE: candidate } = await h.vite.ssrLoadModule(
    "/src/lib/content/writing-candidate-bundle.ts",
  ));
});
beforeEach(async () => h.reset());
after(async () => h?.close());
async function prepare(context, day = "2026-10-08") {
  context.mock.timers.enable({ apis: ["Date"], now: new Date(day + "T12:00:00Z") });
  const seeded = await seedNatalReading(h);
  await h.records().from("content_releases").delete();
  await h.records().from("content_releases").insert({
    version: candidate.version,
    bundle: candidate,
    checksum: "writing-local",
    is_active: true,
  });
  h.setGateway(() => new Response(null, { status: 503 }));
  return seeded;
}
const row = (id) => {
  const r = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(id);
  return { ...r, language_meta: JSON.parse(r.language_meta) };
};
async function clone(source, dek, extras = {}, mutate = null) {
  const id = extras.id ?? randomUUID(),
    meta = structuredClone(source.language_meta),
    evidence = await h.cryptoModule.decryptJson(dek, meta.daily_writing_ct);
  evidence.readingId = id;
  if (mutate) mutate(evidence, meta);
  meta.daily_writing_ct = await h.cryptoModule.encryptJson(dek, evidence);
  const saved = { ...source, ...extras, id, language_meta: meta, idempotency_key: "history-" + id };
  const result = await h.records().from("daily_readings").insert(saved);
  assert.equal(result.error, null, result.error?.message);
  return saved;
}
test("three preceding civil days retain only astronomical paragraphs from the newest valid owner/snapshot/timezone match", async (context) => {
  const { dek, snapshotId } = await prepare(context);
  const originals = [];
  for (const day of ["2026-10-08", "2026-10-09", "2026-10-10"]) {
    context.mock.timers.setTime(Date.parse(day + "T12:00:00Z"));
    originals.push(row((await h.app.getToday(h.records(), h.userA, "UTC")).reading.id));
  }
  const previous = originals.at(-1),
    meta = previous.language_meta,
    paragraphs = await h.cryptoModule.decryptJson(dek, meta.paragraphs_ct);
  paragraphs.push("Private appended context sentinel.");
  meta.paragraphs_ct = await h.cryptoModule.encryptJson(dek, paragraphs);
  await h
    .records()
    .from("daily_readings")
    .update({
      body_ct: await h.cryptoModule.encryptField(dek, paragraphs.join("\n\n")),
      language_meta: meta,
    })
    .eq("id", previous.id);
  await clone(originals[0], dek, { user_id: h.userB, created_at: "2026-10-12T12:00:00Z" });
  const history = await h.app.loadRecentDailyWritingBodies(
    h.records(),
    h.userA,
    snapshotId,
    "2026-10-11",
    "UTC",
    dek,
  );
  assert.equal(history.bodies.length, 3);
  assert.deepEqual(
    history.bodies.map((b) => b.day),
    ["2026-10-10", "2026-10-09", "2026-10-08"],
  );
  assert.ok(!JSON.stringify(history).includes("Private appended context"));
  assert.equal(history.availability.inspected, 3);
  assert.equal(history.availability.status, "available");
  assert.equal(h.gatewayRequests.length, 3);
});
test("twelve is the total row inspection cap; a fifth valid candidate cannot replace four invalid rows for a day", async (context) => {
  const { dek, snapshotId } = await prepare(context);
  const original = row((await h.app.getToday(h.records(), h.userA, "UTC")).reading.id);
  await h
    .records()
    .from("daily_readings")
    .update({ created_at: "2026-10-08T09:00:00Z" })
    .eq("id", original.id);
  for (const day of ["2026-10-08", "2026-10-09", "2026-10-10"]) {
    await clone(original, dek, { reading_date: day, created_at: day + "T10:00:00Z" });
    for (let n = 1; n <= 4; n++) {
      const c = await clone(original, dek, {
        reading_date: day,
        created_at: day + `T1${n}:00:00Z`,
      });
      await h
        .records()
        .from("daily_readings")
        .update({ language_meta: { ...c.language_meta, daily_writing_ct: "corrupt" } })
        .eq("id", c.id);
    }
  }
  const history = await h.app.loadRecentDailyWritingBodies(
    h.records(),
    h.userA,
    snapshotId,
    "2026-10-11",
    "UTC",
    dek,
  );
  assert.deepEqual(history.bodies, []);
  assert.equal(history.availability.inspected, 12);
  assert.ok(
    history.availability.omissions.some((i) => i.reason === "candidate_limit" && i.count === 3),
  );
  assert.equal(h.gatewayRequests.length, 1);
});
test("timezone mismatch, legacy rows and corrupt optional history are bounded omissions while current evidence remains strict", async (context) => {
  const { dek, snapshotId } = await prepare(context);
  const original = row((await h.app.getToday(h.records(), h.userA, "UTC")).reading.id);
  await clone(
    original,
    dek,
    { reading_date: "2026-10-10" },
    (e) => (e.effectiveTimezone = "Pacific/Honolulu"),
  );
  const legacy = await clone(original, dek, { reading_date: "2026-10-09" });
  const m = { ...legacy.language_meta };
  delete m.daily_writing_ct;
  delete m.dailyWritingStatus;
  await h.records().from("daily_readings").update({ language_meta: m }).eq("id", legacy.id);
  const history = await h.app.loadRecentDailyWritingBodies(
    h.records(),
    h.userA,
    snapshotId,
    "2026-10-11",
    "UTC",
    dek,
  );
  assert.deepEqual(
    history.bodies.map((b) => b.day),
    ["2026-10-08"],
  );
  assert.ok(history.availability.omissions.some((i) => i.reason === "timezone"));
  assert.ok(history.availability.omissions.some((i) => i.reason === "legacy"));
  assert.equal(history.availability.status, "partial");
});
test("history range uses civil dates across DST and excludes today, future days and another snapshot before decryption", async (context) => {
  const { dek, snapshotId } = await prepare(context, "2026-11-01");
  const original = row((await h.app.getToday(h.records(), h.userA, "UTC")).reading.id);
  const start = h.requests.length;
  const history = await h.app.loadRecentDailyWritingBodies(
    h.records(),
    h.userA,
    snapshotId,
    "2026-11-01",
    "America/New_York",
    dek,
  );
  assert.equal(history.bodies.length, 0);
  const queries = h.requests.slice(start).filter((r) => /FROM\s+"?daily_readings"?/i.test(r.sql));
  assert.equal(queries.length, 3);
  assert.deepEqual(
    queries.map((q) => q.params.find((v) => /^2026-\d\d-\d\d$/.test(String(v)))),
    ["2026-10-31", "2026-10-30", "2026-10-29"],
  );
  assert.ok(queries.every((q) => q.params.includes(h.userA) && q.params.includes(snapshotId)));
  assert.ok(!queries.some((q) => q.params.includes(original.reading_date)));
});
