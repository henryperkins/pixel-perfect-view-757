import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

// Exercise actual server queries, encryption and language verification against
// a temporary SQLite records plane. The gateway is local synthetic data only.
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

const featureKey = "sun_in_aries";
const db = () => h.records();
const chapter = (user = h.userA) => h.app.getFeatureNarrative(db(), user, featureKey);
const pattern = (user = h.userA) => h.app.getPattern(db(), user);

function successfulResponse() {
  return Response.json({
    choices: [
      {
        message: {
          content: JSON.stringify({
            paragraphs: [
              {
                text: "You recognise the supplied structure as a reflective pattern. Its calculated position provides the reference for this chapter. Your own experience can differ from this framing.",
                facts: ["N1", "N2", "R1"],
              },
            ],
            reflection_question: "Where do you recognise this pattern in your everyday life?",
          }),
        },
      },
    ],
  });
}

async function prepare(user = h.userA) {
  const fixture = await h.seedChart(db(), user);
  // This fixture already represents the current per-item source contract;
  // getPattern must not trigger its unrelated legacy Swiss upgrade.
  h.sqlite
    .prepare(
      "UPDATE chart_snapshots SET houses=json_set(houses, '$.sources', json('{}')) WHERE id=?",
    )
    .run(fixture.snapshotId);
  const inserted = await db()
    .from("natal_features")
    .insert([
      {
        user_id: user,
        snapshot_id: fixture.snapshotId,
        feature_key: featureKey,
        family: "placement",
        title: "Sun in Aries",
        strength: 1,
        payload: { sign: "Aries", house: 1, degree: 12 },
      },
      {
        user_id: user,
        snapshot_id: fixture.snapshotId,
        feature_key: "moon_in_taurus",
        family: "placement",
        title: "Moon in Taurus",
        strength: 0.6,
        payload: { sign: "Taurus", house: 2, degree: 3 },
      },
    ]);
  assert.equal(inserted.error, null);
  h.setGateway(successfulResponse);
  return fixture;
}

test("chapter cache identity follows the effective consented tone, not private unused preferences", async () => {
  await prepare();
  const plain = await pattern();
  assert.ok(plain.narrativeCacheKey);
  assert.equal((await pattern()).narrativeCacheKey, plain.narrativeCacheKey);
  await h.app.updatePrefs(db(), h.userA, "Private name sentinel", "warm", "technical");
  assert.equal((await pattern()).narrativeCacheKey, plain.narrativeCacheKey);
  await h.app.setConsent(db(), h.userA, "USR-01", true);
  const warm = await pattern();
  assert.notEqual(warm.narrativeCacheKey, plain.narrativeCacheKey);
  const generated = await chapter();
  assert.equal(generated.cacheKey, warm.narrativeCacheKey);
  assert.match(h.gatewayRequests[0].messages[1].content, /Tone preference: warm\./);
  await h.app.updatePrefs(db(), h.userA, null, "measured", "standard");
  assert.equal(
    (await pattern()).narrativeCacheKey,
    plain.narrativeCacheKey,
    "unknown tones normalize to plain",
  );
  await h.app.updatePrefs(db(), h.userA, null, "warm", "standard");
  await h.app.setConsent(db(), h.userA, "USR-01", false);
  assert.equal(
    (await pattern()).narrativeCacheKey,
    plain.narrativeCacheKey,
    "revocation returns to ordinary wording",
  );
});

test("chart replacement changes identity for the same feature, and accounts stay separate", async () => {
  const fixture = await prepare();
  const first = await pattern();
  await prepare(h.userB);
  assert.notEqual((await pattern(h.userB)).narrativeCacheKey, first.narrativeCacheKey);
  const row = h.sqlite.prepare("SELECT * FROM chart_snapshots WHERE id=?").get(fixture.snapshotId);
  const { id: previousId, ...rest } = row;
  const replacementId = randomUUID();
  const replacement = await db()
    .from("chart_snapshots")
    .insert({
      ...rest,
      id: replacementId,
      fingerprint: "changed-birth-record-fixture",
    });
  assert.equal(replacement.error, null);
  h.sqlite
    .prepare("UPDATE birth_profiles SET fingerprint=? WHERE user_id=?")
    .run("changed-birth-record-fixture", h.userA);
  const next = await pattern();
  assert.notEqual(next.narrativeCacheKey, first.narrativeCacheKey);
  assert.equal((await pattern()).narrativeCacheKey, next.narrativeCacheKey);
});

test("generated and reopened chapters expose the exact original facts alongside their citations", async () => {
  await prepare();
  const first = await chapter();
  assert.equal(first.available, true);
  assert.equal(first.evidenceAvailable, true);
  assert.equal(first.cacheKey, (await pattern()).narrativeCacheKey);
  const sent = h.gatewayRequests[0].messages.find((message) => message.role === "user").content;
  assert.deepEqual(
    sent.match(/^[A-Z]\d+: .*$/gm),
    first.facts.map((fact) => `${fact.id}: ${fact.statement}`),
  );
  assert.ok(
    first.citations.every((citation) =>
      citation.facts.every((id) => first.facts.some((fact) => fact.id === id)),
    ),
  );
  assert.ok(first.facts.every((fact) => Object.keys(fact).sort().join(",") === "id,statement"));
  assert.doesNotMatch(
    JSON.stringify(first.facts),
    /Private birth place|1990-01-01|12\.34567|76\.54321/,
  );
  const stored = h.sqlite.prepare("SELECT * FROM feature_narratives").get();
  assert.doesNotMatch(stored.narrative_ct, /reflective pattern|Sun in Aries|Moon in Taurus/);
  assert.match(first.narrative, /Something to sit with: Where do you recognise/);

  // Original inputs must not be reconstructed from changed source rows.
  h.sqlite
    .prepare("UPDATE natal_features SET title='Changed related structure', payload='{}'")
    .run();
  await h.reopen();
  const cached = await chapter();
  assert.deepEqual(cached, first);
  assert.equal(h.gatewayRequests.length, 1);
  assert.deepEqual(h.sqlite.prepare("SELECT * FROM feature_narratives").get(), stored);
});

test("legacy encrypted essays remain readable without manufactured citation evidence", async () => {
  const fixture = await prepare();
  const generated = await chapter();
  const legacyText =
    "Legacy chapter retained verbatim.\n\nSomething to sit with: Where do you see this pattern?";
  h.sqlite
    .prepare("UPDATE feature_narratives SET narrative_ct=?")
    .run(await h.cryptoModule.encryptField(fixture.dek, legacyText));
  const row = h.sqlite.prepare("SELECT * FROM feature_narratives").get();
  await h.reopen();
  const legacy = await chapter();
  assert.equal(legacy.available, true);
  assert.equal(legacy.narrative, legacyText);
  assert.deepEqual(legacy.paragraphs, legacyText.split("\n\n"));
  assert.equal(legacy.evidenceAvailable, false);
  assert.deepEqual(legacy.facts, []);
  assert.deepEqual(legacy.citations, generated.citations);
  assert.equal(h.gatewayRequests.length, 1);
  assert.deepEqual(h.sqlite.prepare("SELECT * FROM feature_narratives").get(), row);
});

test("embedded blank lines never shift chapter citation boundaries, including after reopening", async () => {
  await prepare();
  const firstText =
    "The first supplied structure is one reference.\n\nIts reflection continues within the same cited passage.";
  const secondText = "A related structure supplies a different reference for this passage.";
  h.setGateway(() =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              paragraphs: [
                { text: firstText, facts: ["N1"] },
                { text: secondText, facts: ["R1"] },
              ],
              reflection_question: "Where do you recognise this pattern in your everyday life?",
            }),
          },
        },
      ],
    }),
  );
  const first = await chapter();
  assert.equal(first.available, true);
  assert.deepEqual(first.paragraphs, [
    firstText,
    secondText,
    "Something to sit with: Where do you recognise this pattern in your everyday life?",
  ]);
  assert.equal(first.narrative, first.paragraphs.join("\n\n"));
  assert.deepEqual(first.citations, [
    { paragraph: 1, facts: ["N1"] },
    { paragraph: 2, facts: ["R1"] },
  ]);
  assert.equal(first.paragraphs[first.citations[1].paragraph - 1], secondText);
  assert.equal(
    first.narrative.split("\n\n").length,
    4,
    "splitting the flattened narrative would lose the verified boundaries",
  );
  await h.reopen();
  assert.deepEqual(await chapter(), first);
  assert.equal(h.gatewayRequests.length, 1);
});

test("cached evidence cannot be presented against malformed or mismatched paragraph boundaries", async () => {
  const fixture = await prepare();
  await chapter();
  const row = h.sqlite.prepare("SELECT * FROM feature_narratives").get();
  const envelope = await h.cryptoModule.decryptJson(fixture.dek, row.narrative_ct);
  for (const paragraphs of [["A different narrative."], [null], undefined]) {
    h.sqlite
      .prepare("UPDATE feature_narratives SET narrative_ct=? WHERE id=?")
      .run(await h.cryptoModule.encryptJson(fixture.dek, { ...envelope, paragraphs }), row.id);
    await assert.rejects(chapter(), {
      message: "This saved chapter could not be loaded. Please try again.",
    });
  }
  assert.equal(h.gatewayRequests.length, 1);
});

test("temporary gateway failures are safely retryable and are not saved as chapters", async () => {
  await prepare();
  const failures = [
    () => {
      throw new DOMException("private timeout sentinel", "TimeoutError");
    },
    () => {
      throw new Error("private network sentinel");
    },
    () => new Response("private provider sentinel", { status: 429 }),
    () => new Response("private provider sentinel", { status: 503 }),
    () => Response.json({ choices: [] }),
    () => new Response("private malformed JSON sentinel", { status: 200 }),
  ];
  for (const failure of failures) {
    h.setGateway(failure);
    const unavailable = await chapter();
    assert.equal(unavailable.available, false);
    assert.equal(unavailable.retryable, true);
    assert.match(unavailable.reason, /try again/i);
    assert.doesNotMatch(unavailable.reason, /private|sentinel|gateway|503|JSON/);
    assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM feature_narratives").get().n, 0);
  }
  h.setGateway(successfulResponse);
  assert.equal(
    (await chapter()).available,
    true,
    "an explicit later retry can save a successful chapter",
  );
});

test("missing structures, unavailable configuration and unsupported drafts do not offer generation retries", async () => {
  assert.equal((await chapter()).retryable, false, "no chart");
  await prepare();
  const absent = await h.app.getFeatureNarrative(db(), h.userA, "missing-structure");
  assert.equal(absent.available, false);
  assert.equal(absent.retryable, false);
  h.setGateway(null);
  const unconfigured = await chapter();
  assert.equal(unconfigured.available, false);
  assert.equal(unconfigured.retryable, false);
  h.setGateway(() =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              paragraphs: [{ text: "This has no supported fact.", facts: ["NOT_A_FACT"] }],
              reflection_question: "Where do you see this?",
            }),
          },
        },
      ],
    }),
  );
  const unsupported = await chapter();
  assert.equal(unsupported.available, false);
  assert.equal(unsupported.retryable, false);
  assert.match(unsupported.reason, /No verified reading/);
});

test("a failed chapter insert is reported safely instead of claiming the result was saved", async () => {
  await prepare();
  h.setFault({ matches: (sql) => /insert into "feature_narratives"/i.test(sql) });
  await assert.rejects(chapter(), {
    message: "This chapter could not be saved. Please try again.",
  });
  assert.equal(h.gatewayRequests.length, 1);
  assert.equal(h.sqlite.prepare("SELECT count(*) AS n FROM feature_narratives").get().n, 0);
  h.setFault(null);
  assert.equal((await chapter()).available, true);
});

test("failed cache and fact reads never masquerade as absent structures or generate partial evidence", async () => {
  await prepare();
  h.setFault({ matches: (sql) => /from "feature_narratives"/i.test(sql) });
  await assert.rejects(chapter(), {
    message: "This chapter could not be loaded. Please try again.",
  });
  h.setFault({ matches: (sql) => /from "natal_features"/i.test(sql) && /order by/i.test(sql) });
  await assert.rejects(chapter(), {
    message: "This chapter's related structures could not be loaded. Please try again.",
  });
  assert.equal(h.gatewayRequests.length, 0);
});
