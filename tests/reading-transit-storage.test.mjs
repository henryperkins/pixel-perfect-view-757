import assert from "node:assert/strict";
import { before, after, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { seedTransitReading } from "./helpers/transit-fixtures.mjs";
let h;
before(async () => (h = await createRecordsHarness()));
beforeEach(() => h.reset());
after(async () => h?.close());
test("fallback_with_qualified_anchors_never_activates_candidate_or_scans", async () => {
  await seedTransitReading(h);
  await h.records().from("content_releases").delete();
  const today = await h.app.getToday(h.records(), h.userA, "UTC");
  await h.app.getCyclesFor(h.records(), h.userA, new Date().toISOString().slice(0, 10), "UTC");
  assert.equal(today.reading.release_version, "builtin-0.5.0");
  assert.equal(today.language.natalLens, null);
  assert.equal(today.language.transitStory.plan.status, "omitted");
  assert.equal(today.language.transitStory.plan.reason, "no_catalogue");
  assert.equal(h.episodeRequests.length, 0);
  assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM content_releases").get().n, 0);
});
test("arc_scan_and_dates_are_encrypted_and_cache_makes_no_requests", async () => {
  const { dek } = await seedTransitReading(h),
    first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(first.storyCalculation.status, "qualified");
  assert.equal(h.episodeRequests.length, 1);
  const row = h.sqlite.prepare("SELECT * FROM daily_readings").get(),
    meta = JSON.parse(row.language_meta);
  assert.equal(typeof meta.transit_story_ct, "string");
  for (const privateText of [
    "analytic-private",
    "native-private",
    "component-private",
    "unwrappedLongitude",
    first.language.transitStory.plan.chronologySentence,
  ])
    assert.ok(!row.language_meta.includes(privateText), privateText);
  const second = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(second.reading.id, first.reading.id);
  assert.deepEqual(second.storyCalculation, first.storyCalculation);
  assert.deepEqual(second.language.facts, first.language.facts);
  assert.equal(h.episodeRequests.length, 1);
  assert.equal(h.gatewayRequests.length, 0);
  const saved = await h.cryptoModule.decryptJson(dek, meta.transit_story_ct);
  assert.equal(saved.facts.length, 2);
  assert.equal(saved.plan.passTotal, 3);
  assert.deepEqual(saved.usedParagraphs, { A1: [1], P2: [1] });
});
test("natal template saves exact chapter copy in paragraph two and rejects false or duplicate linkage", async () => {
  const { dek } = await seedTransitReading(h, { natal: true });
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(first.language.mode, "template");
  assert.ok(first.language.natalLens);
  assert.deepEqual(first.language.transitStory.usedParagraphs, { A1: [1], P2: [2] });
  const row = h.sqlite.prepare("SELECT * FROM daily_readings WHERE id=?").get(first.reading.id);
  const meta = JSON.parse(row.language_meta);
  const paragraphs = await h.cryptoModule.decryptJson(dek, meta.paragraphs_ct);
  const story = await h.cryptoModule.decryptJson(dek, meta.transit_story_ct);
  assert.ok(paragraphs[1].includes(story.plan.copy.mechanism));
  h.reopen();
  const reopened = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(reopened.reading.id, first.reading.id);
  assert.deepEqual(reopened.language, first.language);
  const exported = await h.app.exportEverything(h.records(), h.userA);
  assert.deepEqual(
    exported.readings.find((r) => r.id === first.reading.id).language,
    first.language,
  );
  for (const corruption of [
    "wrong-index",
    "missing",
    "duplicate",
    "moved",
    "duplicate-chronology",
  ]) {
    const badStory = structuredClone(story);
    const badParagraphs = [...paragraphs];
    if (corruption === "wrong-index") badStory.usedParagraphs.P2 = [1];
    if (corruption === "missing")
      badParagraphs[1] = badParagraphs[1].replace(story.plan.copy.mechanism, "");
    if (corruption === "duplicate") badParagraphs[1] += ` ${story.plan.copy.mechanism}`;
    if (corruption === "moved") {
      badParagraphs[1] = badParagraphs[1].replace(story.plan.copy.mechanism, "");
      badParagraphs.push(story.plan.copy.mechanism);
      badStory.usedParagraphs.P2 = [badParagraphs.length];
    }
    if (corruption === "duplicate-chronology")
      badParagraphs[0] += ` ${story.plan.chronologySentence}`;
    await assert.rejects(
      h.app.readingLanguage(
        {
          ...row,
          language_meta: {
            ...meta,
            astroParagraphCount: badParagraphs.length,
            paragraphs_ct: await h.cryptoModule.encryptJson(dek, badParagraphs),
            transit_story_ct: await h.cryptoModule.encryptJson(dek, badStory),
          },
        },
        dek,
      ),
      /could not be loaded/,
      corruption,
    );
  }
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.episodeRequests.length, 1);
});
test("model reading citing natal and story facts reopens and exports", async () => {
  await seedTransitReading(h, { natal: true });
  h.setGateway((request) => {
    const content = request.messages[1].content;
    const line = (id) => content.match(new RegExp(`^${id}: (.*)$`, "m"))[1];
    const paragraphs = [
      {
        text: "An established role can feel demanding when its obligations require more deliberate effort than usual. If an unfinished project is one of those obligations, a direction can become clearer through commitments that are manageable over time. That project may distinguish building something durable from treating every obligation as a measure of worth.",
        facts: ["C1", "I1", "N1"],
      },
      {
        text: `${line("A1")} ${line("P2").replace(/^Published transit chapter: /, "")}`,
        facts: ["C1", "I1", "A1", "P2"],
      },
    ];
    return Response.json({ choices: [{ message: { content: JSON.stringify({ paragraphs }) } }] });
  });
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(first.language.mode, "model", first.language.reason);
  assert.ok(first.language.natalLens);
  assert.deepEqual(first.language.transitStory.usedParagraphs, { A1: [2], P2: [2] });
  h.reopen();
  const reopened = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(reopened.reading.id, first.reading.id);
  assert.deepEqual(reopened.language, first.language);
  const exported = await h.app.exportEverything(h.records(), h.userA);
  assert.deepEqual(
    exported.readings.find((r) => r.id === first.reading.id).language,
    first.language,
  );
  assert.equal(h.gatewayRequests.length, 1);
});
test("source_unavailable_is_immutable_but_policy_change_creates_new_identity", async () => {
  await seedTransitReading(h);
  h.setEpisode(() => new Response(null, { status: 503 }));
  const first = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(first.storyCalculation.reason, "service_unavailable");
  await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(h.episodeRequests.length, 1);
  process.env.SWISS_TRANSIT_EPISODE_SOURCE_ID = "reviewed-next-version";
  const next = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.notEqual(next.reading.id, first.reading.id);
  assert.equal(h.episodeRequests.length, 2);
});
test("corrupt_story_envelope_fails_read_and_cross_account_key_cannot_open", async () => {
  await seedTransitReading(h);
  await h.app.getToday(h.records(), h.userA, "UTC");
  const row = h.sqlite.prepare("SELECT * FROM daily_readings").get();
  row.language_meta = JSON.parse(row.language_meta);
  await assert.rejects(
    h.app.readingLanguage(row, await h.app.getDek(h.records(), h.userB)),
    /could not be loaded/,
  );
  row.language_meta.transit_story_ct = "broken";
  h.sqlite
    .prepare("UPDATE daily_readings SET language_meta=? WHERE id=?")
    .run(JSON.stringify(row.language_meta), row.id);
  await assert.rejects(h.app.getToday(h.records(), h.userA, "UTC"), /could not be loaded/);
  assert.equal(h.episodeRequests.length, 1);
});

test("owner_export_restores_archived_story_without_rescanning_and_erasure_removes_it", async () => {
  const { dek } = await seedTransitReading(h),
    today = await h.app.getToday(h.records(), h.userA, "UTC");
  h.setEpisode(() => {
    throw new Error("Archived evidence must not rescan");
  });
  const exported = await h.app.exportEverything(h.records(), h.userA);
  assert.deepEqual(
    exported.readings.find((r) => r.id === today.reading.id).language.transitStory,
    today.language.transitStory,
  );
  assert.equal(exported.transitAnchors[0].manifest.status, "screened");
  assert.equal(h.episodeRequests.length, 1);
  const other = await h.app.exportEverything(h.records(), h.userB);
  assert.deepEqual(other.transitAnchors, []);
  assert.deepEqual(other.readings, []);
  // Randomized re-encryption of the same anchor must not create a new daily identity.
  const row = h.sqlite.prepare("SELECT * FROM chart_snapshots WHERE user_id=?").get(h.userA),
    houses = JSON.parse(row.houses);
  houses.transitAnchors_ct = await h.cryptoModule.encryptJson(
    dek,
    exported.transitAnchors[0].manifest,
  );
  h.sqlite
    .prepare("UPDATE chart_snapshots SET houses=? WHERE id=?")
    .run(JSON.stringify(houses), row.id);
  const again = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(again.reading.id, today.reading.id);
  assert.equal(h.episodeRequests.length, 1);
  await h.app.eraseEverything(h.records(), h.userA);
  for (const table of ["chart_snapshots", "daily_readings", "reading_sources"])
    assert.equal(
      h.sqlite.prepare(`SELECT count(*) AS n FROM ${table} WHERE user_id=?`).get(h.userA).n,
      0,
    );
});
test("bound_story_digest_and_proof_reject_reencrypted_semantic_corruption", async () => {
  const { dek } = await seedTransitReading(h);
  await h.app.getToday(h.records(), h.userA, "UTC");
  const row = h.sqlite.prepare("SELECT * FROM daily_readings").get(),
    meta = JSON.parse(row.language_meta),
    saved = await h.cryptoModule.decryptJson(dek, meta.transit_story_ct);
  for (const change of [
    (s) => (s.plan.passTotal = 5),
    (s) => s.plan.evidence.scan.samples[1].contacts.pop(),
    (s) => (s.facts[0].arc.passTotal = 5),
    (s) => (s.timingOverlay.qualifiedExactDay = "2099-01-01"),
    (s) => (s.resultDigest = "wrong"),
    (s) => (s.usedParagraphs.A1 = []),
  ]) {
    const bad = structuredClone(saved);
    change(bad);
    await assert.rejects(
      h.app.readingLanguage(
        {
          ...row,
          language_meta: { ...meta, transit_story_ct: await h.cryptoModule.encryptJson(dek, bad) },
        },
        dek,
      ),
      /could not be loaded/,
    );
  }
});
test("timing_selection_reuses_one_scan_and_invalidates_on_day_or_source_change", async () => {
  await seedTransitReading(h);
  const day = new Date().toISOString().slice(0, 10);
  const [first, concurrent] = await Promise.all([
    h.app.getCyclesFor(h.records(), h.userA, day, "UTC"),
    h.app.getCyclesFor(h.records(), h.userA, day, "UTC"),
  ]);
  assert.equal(first.storyCalculation.status, "qualified");
  assert.deepEqual(concurrent.storyCalculation, first.storyCalculation);
  assert.equal(h.episodeRequests.length, 1);
  h.setEpisode(() => new Response(null, { status: 503 }));
  const again = await h.app.getCyclesFor(h.records(), h.userA, day, "UTC");
  assert.deepEqual(again.storyCalculation, first.storyCalculation);
  assert.equal(h.episodeRequests.length, 1);
  const next = new Date(Date.parse(day + "T12:00:00Z") + 86400000).toISOString().slice(0, 10);
  await h.app.getCyclesFor(h.records(), h.userA, next, "UTC");
  assert.equal(h.episodeRequests.length, 2);
  process.env.SWISS_TRANSIT_EPISODE_SOURCE_ID = "changed-qualified-source";
  await h.app.getCyclesFor(h.records(), h.userA, day, "UTC");
  assert.equal(h.episodeRequests.length, 3);
  await h.seedChart(h.records(), h.userB);
  const other = await h.app.getCyclesFor(h.records(), h.userB, day, "UTC");
  assert.equal(other.storyCalculation.status, "omitted");
});
