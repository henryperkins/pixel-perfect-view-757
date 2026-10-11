import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness, successfulReadingResponse } from "./helpers/records-harness.mjs";

// These checks run application SQL and encryption in disposable SQLite. The
// gateway is unconfigured and the harness rejects all external network calls.
let h;
const fixedNow = new Date("2026-10-11T12:00:00.000Z");

before(async () => {
  h = await createRecordsHarness();
});
after(async () => h?.close());
beforeEach(async (context) => {
  await h.reset();
  context.mock.timers.enable({ apis: ["Date"], now: fixedNow });
});

const client = () => h.records();
const today = (user = h.userA) => h.app.getToday(client(), user, "UTC");
const save = (readingId, resonance, labels = [], user = h.userA) =>
  h.app.submitFeedback(client(), user, readingId, resonance, labels);
const rawFeedback = (readingId, user = h.userA) =>
  h.sqlite
    .prepare("SELECT * FROM reading_feedback WHERE user_id=? AND reading_id=?")
    .get(user, readingId);

test("Today returns the latest saved choice after an actual database reopen", async () => {
  await h.seedChart(client(), h.userA);
  const fresh = await today();
  assert.equal(fresh.needsOnboarding, false);
  assert.equal(fresh.feedback, null, "a fresh reading has an explicit unrated state");

  const first = await save(fresh.reading.id, -1, ["first local choice"]);
  assert.deepEqual(first, {
    ok: true,
    feedback: {
      readingId: fresh.reading.id,
      resonance: -1,
      labels: ["first local choice"],
      savedAt: fixedNow.toISOString(),
    },
  });
  const original = rawFeedback(fresh.reading.id);
  assert.equal((await today()).feedback.resonance, -1);

  const neutral = await save(fresh.reading.id, 0);
  assert.equal(neutral.feedback.resonance, 0, "neutral must remain distinct from no rating");
  const latest = await save(fresh.reading.id, 1, ["latest local choice"]);
  const changed = rawFeedback(fresh.reading.id);
  assert.equal(changed.id, original.id);
  assert.equal(changed.created_at, original.created_at);
  assert.equal(
    h.sqlite.prepare("SELECT count(*) AS n FROM reading_feedback").get().n,
    1,
    "changing the choice replaces the owned reading's one row",
  );
  await h.reopen();
  const reloaded = await today();
  assert.equal(reloaded.reading.id, fresh.reading.id);
  assert.deepEqual(reloaded.feedback, latest.feedback);
  assert.deepEqual(Object.keys(reloaded.feedback).sort(), [
    "labels",
    "readingId",
    "resonance",
    "savedAt",
  ]);
  assert.ok(h.requests.some(({ sql }) => /reading_feedback.*returning/.test(sql)));
});

test("ratings stay bound to the current reading and account", async () => {
  await h.seedChart(client(), h.userA);
  await h.seedChart(client(), h.userB);
  const a = await today();
  const b = await today(h.userB);
  await save(a.reading.id, 1, ["owned A"]);
  await save(b.reading.id, -1, ["owned B"], h.userB);
  assert.equal((await today()).feedback.resonance, 1);
  assert.equal((await today(h.userB)).feedback.resonance, -1);

  await assert.rejects(save(b.reading.id, 0), /Reading not found for your account/);
  assert.equal(rawFeedback(b.reading.id, h.userA), undefined);
  assert.equal(rawFeedback(b.reading.id, h.userB).resonance, -1);

  await h.app.setConsent(client(), h.userA, "USR-01", true);
  await h.app.updatePrefs(client(), h.userA, null, "warm", "standard");
  const changed = await today();
  assert.notEqual(changed.reading.id, a.reading.id);
  assert.equal(changed.feedback, null, "a rating does not follow changed reading context");
  assert.equal(rawFeedback(a.reading.id).resonance, 1, "the prior reading retains its feedback");
  const saved = await save(changed.reading.id, 0);
  assert.deepEqual((await today()).feedback, saved.feedback);
});

test("failed rating reads never masquerade as an unrated reading and use safe messages", async () => {
  await h.seedChart(client(), h.userA);
  const generated = await today();
  await save(generated.reading.id, 1);
  h.setFault({ matches: (sql) => sql.startsWith("select") && sql.includes('"reading_feedback"') });
  await assert.rejects(today(), {
    message: "Your saved rating could not be loaded. Please retry.",
  });
  h.setFault(null);
  assert.equal((await today()).feedback.resonance, 1);

  // The same contract applies immediately after a new reading is generated.
  await h.app.setConsent(client(), h.userA, "USR-01", true);
  await h.app.updatePrefs(client(), h.userA, null, "warm", "standard");
  h.setFault({ matches: (sql) => sql.startsWith("select") && sql.includes('"reading_feedback"') });
  await assert.rejects(today(), {
    message: "Your saved rating could not be loaded. Please retry.",
  });
  h.setFault(null);
  assert.equal((await today()).feedback, null);
});

test("failed ownership checks and writes preserve the saved choice with actionable errors", async () => {
  await h.seedChart(client(), h.userA);
  const generated = await today();
  await save(generated.reading.id, -1, ["preserved local choice"]);
  const previous = rawFeedback(generated.reading.id);

  h.setFault({
    matches: (sql) => sql.startsWith("select id from") && sql.includes('"daily_readings"'),
  });
  await assert.rejects(save(generated.reading.id, 1), {
    message: "The reading could not be checked. Please retry your rating.",
  });
  assert.deepEqual(rawFeedback(generated.reading.id), previous);

  h.setFault({ matches: (sql) => sql.startsWith('insert into "reading_feedback"') });
  await assert.rejects(save(generated.reading.id, 1), {
    message: "Your rating could not be saved. Please retry.",
  });
  assert.deepEqual(rawFeedback(generated.reading.id), previous);
  h.setFault(null);
  const retry = await save(generated.reading.id, 1);
  assert.deepEqual((await today()).feedback, retry.feedback);
});

test("a write without a returned row cannot claim that the rating was saved", async () => {
  await h.seedChart(client(), h.userA);
  const generated = await today();
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      const { sql } = JSON.parse(String(init.body));
      return sql.startsWith('insert into "reading_feedback"')
        ? Response.json({ results: [] })
        : response;
    };
    await assert.rejects(save(generated.reading.id, 1), {
      message: "Your rating could not be saved. Please retry.",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
  // RETURNING failed after SQLite committed, so a reload reveals the canonical
  // row and a retry can safely upsert it instead of duplicating the rating.
  assert.equal((await today()).feedback.resonance, 1);
  await save(generated.reading.id, 1);
  assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM reading_feedback").get().n, 1);
});

test("invalid rating input fails before records queries and malformed stored ratings are explicit", async () => {
  h.requests.length = 0;
  for (const resonance of [2, -2, 0.5, NaN, "1"])
    await assert.rejects(save("local-not-a-live-reading", resonance), /Choose Yes, Mixed, or No/);
  await assert.rejects(save("local-not-a-live-reading", 1, ["x", "x", "x", "x", "x", "x", "x"]));
  assert.equal(h.requests.length, 0);

  await h.seedChart(client(), h.userA);
  const generated = await today();
  await save(generated.reading.id, 1);
  h.sqlite
    .prepare("UPDATE reading_feedback SET resonance=? WHERE reading_id=?")
    .run(2, generated.reading.id);
  await assert.rejects(today(), {
    message: "Your saved rating could not be read. Please retry.",
  });
});

test("restoring a personal saved rating does not opt it into aggregate quality measurement", async () => {
  await h.seedChart(client(), h.userA);
  const generated = await today();
  await save(generated.reading.id, 1, ["private local rating label"]);
  const role = await client().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  assert.equal(role.error, null);
  assert.equal((await today()).feedback.resonance, 1);
  const report = await h.app.readingQuality(client(), h.userA);
  assert.equal(
    report.feedback.reduce((count, cohort) => count + cohort.ratedReadings, 0),
    0,
  );
  assert.ok(!JSON.stringify(report).includes("private local rating label"));
});

async function prepareModelReadingWithInternalBlankLine() {
  const ephem = h.ephemerisModule;
  const saturn = ephem.positionOf("saturn", ephem.toJulianDay(fixedNow));
  const fixture = await h.seedChart(client(), h.userA, {
    positions: {
      sun: {
        key: "sun",
        label: "Sun",
        lon: saturn.lon,
        sign: ephem.signOf(saturn.lon),
        degree: ephem.degreeInSign(saturn.lon),
        house: 1,
        speed: 1,
        retrograde: false,
        angleDependent: false,
      },
    },
  });
  h.setGateway(async (request) => {
    const response = await successfulReadingResponse(request).json();
    const draft = JSON.parse(response.choices[0].message.content);
    draft.paragraphs[0].text = draft.paragraphs[0].text.replace(". The", ".\n\nThe");
    response.choices[0].message.content = JSON.stringify(draft);
    return Response.json(response);
  });
  return fixture;
}

const readingMeta = (readingId) =>
  JSON.parse(
    h.sqlite.prepare("SELECT language_meta FROM daily_readings WHERE id=?").get(readingId)
      .language_meta,
  );
const replaceReadingMeta = (readingId, meta) =>
  h.sqlite
    .prepare("UPDATE daily_readings SET language_meta=? WHERE id=?")
    .run(JSON.stringify(meta), readingId);

test("exact cited paragraph boundaries survive fresh and cached reads without changing body exports", async () => {
  const fixture = await prepareModelReadingWithInternalBlankLine();
  await h.app.setConsent(client(), h.userA, "USR-04", true);
  await h.app.saveCheckIn(client(), h.userA, "2026-10-11", 2, 4, null, null, null);
  const fresh = await today();
  assert.equal(fresh.language.mode, "model", "the real daily validator accepted the local draft");
  assert.equal(fresh.reading.paragraphLinksAvailable, true);
  assert.match(fresh.reading.paragraphs[0], /contact\.\n\nThe published interpretation/);
  assert.match(fresh.reading.paragraphs[1], /^This contact is framed/);
  assert.ok(
    fresh.reading.paragraphs.some((paragraph) => /mood 2\/5 and energy 4\/5/.test(paragraph)),
  );
  assert.equal(fresh.reading.paragraphs.join("\n\n"), fresh.reading.body);
  assert.ok(
    fresh.reading.body.split("\n\n").length > fresh.reading.paragraphs.length,
    "splitting the flattened body would shift the original citation numbers",
  );
  assert.equal(fresh.language.citations[1].paragraph, 2);
  const meta = readingMeta(fresh.reading.id);
  assert.equal(typeof meta.paragraphs_ct, "string");
  assert.ok(!JSON.stringify(meta).includes("mood 2/5 and energy 4/5"));
  assert.ok(!meta.paragraphs_ct.includes(fresh.reading.paragraphs[0]));
  assert.deepEqual(
    await h.cryptoModule.decryptJson(fixture.dek, meta.paragraphs_ct),
    fresh.reading.paragraphs,
  );
  await h.reopen();
  const cached = await today();
  assert.equal(cached.reading.id, fresh.reading.id);
  assert.deepEqual(cached.reading.paragraphs, fresh.reading.paragraphs);
  assert.equal(cached.reading.paragraphLinksAvailable, true);
  const exported = await h.app.exportEverything(client(), h.userA);
  assert.equal(
    exported.readings[0].body,
    fresh.reading.body,
    "body_ct stays a readable field envelope",
  );
  assert.equal(h.gatewayRequests.length, 1, "cache and export do not regenerate prose");
});

test("legacy model readings remain readable but cannot imply recovered citation boundaries", async () => {
  await prepareModelReadingWithInternalBlankLine();
  const fresh = await today();
  const meta = readingMeta(fresh.reading.id);
  delete meta.paragraphs_ct;
  replaceReadingMeta(fresh.reading.id, meta);
  const legacy = await today();
  assert.equal(legacy.reading.body, fresh.reading.body);
  assert.equal(legacy.reading.paragraphLinksAvailable, false);
  assert.deepEqual(legacy.reading.paragraphs, fresh.reading.body.split("\n\n"));
  assert.deepEqual(legacy.language.citations, fresh.language.citations);
  assert.deepEqual(legacy.language.facts, fresh.language.facts);
  assert.equal(h.gatewayRequests.length, 1);
});

test("template and legacy-template paragraph display preserves the existing complete body", async () => {
  await h.seedChart(client(), h.userA);
  const fresh = await today();
  assert.equal(fresh.language.mode, "template");
  assert.equal(fresh.reading.paragraphLinksAvailable, true);
  assert.equal(fresh.reading.paragraphs.join("\n\n"), fresh.reading.body);
  const meta = readingMeta(fresh.reading.id);
  delete meta.paragraphs_ct;
  replaceReadingMeta(fresh.reading.id, meta);
  const legacy = await today();
  assert.equal(legacy.reading.body, fresh.reading.body);
  assert.equal(legacy.reading.paragraphLinksAvailable, true);
  assert.deepEqual(legacy.language.citations, []);
});

test("corrupt, malformed and mismatched paragraph envelopes fail closed with safe errors", async () => {
  const fixture = await prepareModelReadingWithInternalBlankLine();
  const fresh = await today();
  const meta = readingMeta(fresh.reading.id);
  const invalid = [
    "not-valid-ciphertext",
    123,
    await h.cryptoModule.encryptJson(fixture.dek, { paragraphs: fresh.reading.paragraphs }),
    await h.cryptoModule.encryptJson(fixture.dek, [fresh.reading.paragraphs[0], 123]),
    await h.cryptoModule.encryptJson(fixture.dek, ["A different reading body."]),
  ];
  for (const ciphertext of invalid) {
    replaceReadingMeta(fresh.reading.id, { ...meta, paragraphs_ct: ciphertext });
    await assert.rejects(today(), {
      message: "Reading paragraph sources could not be loaded. Please retry.",
    });
  }
  replaceReadingMeta(fresh.reading.id, meta);
  assert.deepEqual((await today()).reading.paragraphs, fresh.reading.paragraphs);
  assert.equal(
    h.gatewayRequests.length,
    1,
    "corruption does not silently generate replacement prose",
  );
});
