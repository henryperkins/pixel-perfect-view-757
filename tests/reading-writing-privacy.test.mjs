import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h;
before(async () => {
  h = await createRecordsHarness();
});
beforeEach(async () => {
  await h.reset();
});
after(async () => {
  await h?.close();
});

const day = () => new Date().toISOString().slice(0, 10);
const MODEL_PARAGRAPHS = [
  {
    text: "Saturn conjunction natal Sun is the named contact. A familiar role may feel ready for a closer look.",
    facts: ["C1", "I1"],
  },
  {
    text: "You might notice which commitments still fit the way you want to live.",
    facts: ["C1", "I1"],
  },
];
const modelResponse = (paragraphs = MODEL_PARAGRAPHS) =>
  Response.json({
    choices: [{ message: { content: JSON.stringify({ paragraphs }) } }],
  });
const modelBody = () => MODEL_PARAGRAPHS.map((paragraph) => paragraph.text).join("\n\n");
const editorialReferences = (today) =>
  today.provenance.filter((entry) => entry.lane === "content" && entry.source_id === "AST-05");

async function prepare() {
  const db = h.records();
  const ephem = h.ephemerisModule;
  const saturn = ephem.positionOf("saturn", ephem.toJulianDay(new Date(`${day()}T12:00:00Z`)));
  await h.seedChart(db, h.userA, {
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
  h.setGateway(() => modelResponse());
  return db;
}

test("a concise two-paragraph daily reading needs only its cited cycle and interpretation", async () => {
  const db = await prepare();
  const today = await h.app.getToday(db, h.userA, "UTC");
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(today.language.mode, "model", today.language.reason);
  assert.equal(today.reading.body, modelBody());
  assert.deepEqual(today.language.citations, [
    { paragraph: 1, facts: ["C1", "I1"] },
    { paragraph: 2, facts: ["C1", "I1"] },
  ]);
  for (const id of ["I1", "D1", "P1", "T1"])
    assert.ok(
      today.language.facts.some((fact) => fact.id === id),
      `${id} was available to cite`,
    );
  const references = editorialReferences(today);
  assert.equal(
    references.length,
    1,
    "Uncited domain, phase and timing copy is not consumed provenance",
  );
  assert.match(references[0].label, /I1$/);
  assert.deepEqual(references[0].detail, {
    statement: today.language.facts.find((fact) => fact.id === "I1").statement,
    paragraphs: "1, 2",
    bundle: today.reading.release_version,
  });
  assert.ok(
    today.provenance.some((entry) => entry.lane === "calculation" && entry.source_id === "AST-05"),
  );
  assert.equal(today.provenance.filter((entry) => entry.source_id === "LLM-01").length, 1);
  assert.equal(
    h.sqlite
      .prepare("select count(*) as count from reading_sources where reading_id = ?")
      .get(today.reading.id).count,
    today.provenance.length,
    "Generated provenance is persisted before it is returned",
  );

  h.reopen();
  const cached = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(cached.reading.id, today.reading.id);
  assert.equal(cached.reading.body, modelBody());
  assert.deepEqual(cached.language.facts, today.language.facts);
  assert.deepEqual(cached.language.citations, today.language.citations);
  assert.deepEqual(cached.provenance, today.provenance);
  assert.equal(
    h.gatewayRequests.length,
    1,
    "Reading the persisted result must not call the model again",
  );
});

test("consented check-in, wellness and reflection are added locally without changing provider inputs", async () => {
  const db = await prepare();
  await h.app.updatePrefs(db, h.userA, "PRIVATE_NAME_SENTINEL", "warm", "technical");
  await h.app.addLifeEvent(
    db,
    h.userA,
    day(),
    "identity",
    "PRIVATE_JOURNAL_LABEL",
    "PRIVATE_JOURNAL_BODY",
  );
  const before = await h.app.getToday(db, h.userA, "UTC");
  assert.equal(before.language.mode, "model", before.language.reason);
  assert.equal(before.reading.body, modelBody());

  for (const source of ["USR-04", "WEL-01", "WEL-03", "AMB-02"])
    await h.app.setConsent(db, h.userA, source, true);
  await h.app.saveCheckIn(db, h.userA, day(), 2, 4, "PRIVATE_NOTE_SENTINEL", 1, 5);
  const after = await h.app.getToday(db, h.userA, "UTC");
  assert.equal(after.language.mode, "model", after.language.reason);
  assert.notEqual(
    after.reading.id,
    before.reading.id,
    "Local context receives its own persisted reading",
  );
  assert.equal(h.gatewayRequests.length, 2);
  assert.deepEqual(
    h.gatewayRequests[1],
    h.gatewayRequests[0],
    "Consent and wellbeing never change the model payload",
  );
  assert.ok(after.reading.body.startsWith(`${modelBody()}\n\n`));
  assert.match(after.reading.body, /mood 2\/5 and energy 4\/5/);
  assert.match(after.reading.body, /sleep 1\/5 and stress 5\/5/);
  assert.match(after.reading.body, /Your local time of day is/);
  assert.ok(after.reading.prompt.startsWith(before.reading.prompt));
  assert.match(after.reading.prompt, /pressure running high/);
  assert.equal(after.wellness.note, "PRIVATE_NOTE_SENTINEL");
  assert.doesNotMatch(after.reading.body, /PRIVATE_/);
  for (const source of ["USR-04", "WEL-01", "WEL-03", "AMB-02"])
    assert.ok(
      after.provenance.some((entry) => entry.source_id === source),
      `${source} is local provenance`,
    );
  assert.ok(
    after.provenance.some(
      (entry) => entry.label === "Prompt adapted to stress band" && entry.detail.band === 5,
    ),
  );
  assert.doesNotMatch(
    JSON.stringify(h.gatewayRequests),
    /PRIVATE_|Private birth place sentinel|1990-01-01|12\.34567|76\.54321|mood 2\/5|energy 4\/5|sleep 1\/5|stress 5\/5|Your local time of day|pressure running high/,
  );
  assert.deepEqual(after.language.facts, before.language.facts);
  assert.deepEqual(editorialReferences(after), editorialReferences(before));
});

test("active published interpretations override changed fallback copy throughout generation and provenance", async () => {
  const db = await prepare();
  const { DEFAULT_BUNDLE } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  const original = structuredClone(DEFAULT_BUNDLE);
  const activeMechanism = "The amber notebook theme invites a closer look at a familiar role.";
  const activeDomain = "The active editorial domain leaves room to reconsider a familiar role.";
  const activePhase = "The active editorial phase leaves room for your own observation.";
  const activeQuestion = "Where does the amber notebook theme fit your own view?";
  const activeDomainQuestion = "Which familiar role deserves another look?";
  const fallbackCopy = "FALLBACK_GLOSS_MUST_NOT_LEAK";
  const releaseVersion = "active-writing-db-version";
  const published = structuredClone(original);
  published.version = "payload-version-must-not-win";
  published.cycles = published.cycles.map((entry) => ({
    ...entry,
    mechanism: activeMechanism,
    question: activeQuestion,
  }));
  published.domains = Object.fromEntries(
    Object.entries(published.domains).map(([key, value]) => [
      key,
      {
        ...value,
        hard: activeDomain,
        soft: activeDomain,
        prompt: activeDomainQuestion,
      },
    ]),
  );
  published.phases = Object.fromEntries(
    Object.keys(published.phases).map((key) => [key, activePhase]),
  );
  const released = await db.from("content_releases").insert({
    version: releaseVersion,
    checksum: "synthetic-active-writing-checksum",
    bundle: published,
    is_active: true,
  });
  assert.equal(released.error, null);

  try {
    // Mutate the real module instance only after independently cloning the published release.
    DEFAULT_BUNDLE.version = "changed-fallback-version";
    DEFAULT_BUNDLE.cycles = original.cycles.map((entry) => ({
      ...entry,
      mechanism: fallbackCopy,
      question: fallbackCopy,
    }));
    DEFAULT_BUNDLE.domains = Object.fromEntries(
      Object.entries(original.domains).map(([key, value]) => [
        key,
        {
          ...value,
          hard: fallbackCopy,
          soft: fallbackCopy,
          prompt: fallbackCopy,
        },
      ]),
    );
    DEFAULT_BUNDLE.phases = Object.fromEntries(
      Object.keys(original.phases).map((key) => [key, fallbackCopy]),
    );
    h.setGateway(() =>
      modelResponse([
        {
          text: `Saturn conjunction natal Sun is the named contact. ${activeMechanism}`,
          facts: ["C1", "I1"],
        },
        {
          text: "The amber notebook theme can help you notice what you keep taking on.",
          facts: ["C1", "I1"],
        },
      ]),
    );
    const today = await h.app.getToday(db, h.userA, "UTC");
    assert.equal(h.gatewayRequests.length, 1);
    for (const text of [activeMechanism, activeDomain, activePhase])
      assert.ok(
        JSON.stringify(h.gatewayRequests).includes(text),
        "The model receives effective published copy",
      );
    assert.equal(JSON.stringify(h.gatewayRequests).includes(fallbackCopy), false);
    assert.equal(today.language.mode, "model", today.language.reason);
    assert.equal(
      today.reading.release_version,
      releaseVersion,
      "The database release version is authoritative",
    );
    assert.ok(today.reading.body.includes(activeMechanism));
    assert.ok(today.reading.prompt.includes(activeQuestion));
    assert.ok(today.reading.prompt.includes(activeDomainQuestion));
    assert.equal(JSON.stringify(today).includes(fallbackCopy), false);
    const references = editorialReferences(today);
    assert.equal(references.length, 1);
    assert.ok(references[0].detail.statement.includes(activeMechanism));
    assert.equal(references[0].detail.bundle, releaseVersion);
  } finally {
    Object.assign(DEFAULT_BUNDLE, original);
  }
});

test("failed provenance storage rejects the incomplete reading and permits a clean explicit retry", async () => {
  const db = await prepare();
  h.setFault({ matches: (sql) => /insert into "reading_sources"/i.test(sql) });
  await assert.rejects(h.app.getToday(db, h.userA, "UTC"), /Reading sources could not be saved/);
  assert.equal(h.gatewayRequests.length, 1, "A failing save is not automatically retried");
  assert.equal(h.sqlite.prepare("select count(*) as count from daily_readings").get().count, 0);
  assert.equal(h.sqlite.prepare("select count(*) as count from reading_sources").get().count, 0);
  const cleanup = h.requests.find(({ sql }) => /delete from "daily_readings"/i.test(sql));
  assert.ok(cleanup, "The newly inserted incomplete reading is removed");
  assert.match(cleanup.sql, /"id" is \?/);
  assert.match(cleanup.sql, /"user_id" is \?/);
  assert.ok(cleanup.params.includes(h.userA), "Cleanup remains scoped to the current account");

  h.setFault(null);
  const retry = await h.app.getToday(db, h.userA, "UTC");
  assert.equal(retry.language.mode, "model", retry.language.reason);
  assert.equal(retry.reading.body, modelBody());
  assert.equal(h.gatewayRequests.length, 2);
  assert.equal(h.sqlite.prepare("select count(*) as count from daily_readings").get().count, 1);
  assert.equal(
    h.sqlite.prepare("select count(*) as count from reading_sources").get().count,
    retry.provenance.length,
  );
  h.reopen();
  const cached = await h.app.getToday(h.records(), h.userA, "UTC");
  assert.equal(cached.reading.id, retry.reading.id);
  assert.deepEqual(cached.provenance, retry.provenance);
  assert.equal(h.gatewayRequests.length, 2);
});

test("failure to remove an incomplete reading is surfaced rather than reporting a successful save", async () => {
  const db = await prepare();
  h.setFault({
    matches: (sql) => /insert into "reading_sources"|delete from "daily_readings"/i.test(sql),
  });
  await assert.rejects(h.app.getToday(db, h.userA, "UTC"), /cleanup|remov|discard|incomplete/i);
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(h.sqlite.prepare("select count(*) as count from daily_readings").get().count, 1);
  assert.equal(h.sqlite.prepare("select count(*) as count from reading_sources").get().count, 0);
  assert.ok(
    h.requests.some(({ sql }) => /delete from "daily_readings"/i.test(sql)),
    "Cleanup was attempted",
  );
  h.setFault(null);
  await assert.rejects(
    h.app.getToday(db, h.userA, "UTC"),
    /Reading source trail is incomplete/,
    "A surviving incomplete row must never be served as a complete reading",
  );
  assert.equal(
    h.gatewayRequests.length,
    1,
    "An incomplete cache read does not silently regenerate",
  );
});
