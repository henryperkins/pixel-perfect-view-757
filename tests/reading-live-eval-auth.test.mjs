import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { BASELINE_RESPONSES, READING_EVAL_CASES } from "../scripts/reading-eval-cases.mjs";

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
async function makeAdmin() {
  const result = await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  assert.equal(result.error, null);
}
function snapshot() {
  const tables = h.sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all();
  return Object.fromEntries(
    tables.map(({ name }) => {
      assert.match(name, /^[a-z_]+$/);
      return [name, h.sqlite.prepare(`SELECT * FROM ${name} ORDER BY id`).all()];
    }),
  );
}
function response(draft) {
  return Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] });
}

test("non-admin and role-query failures cannot read copy or call the model", async () => {
  h.requests.length = 0;
  await assert.rejects(
    h.app.runReadingEvaluationCase(h.records(), h.userA, "saturn-square-sun"),
    /Only admins/,
  );
  assert.equal(h.gatewayRequests.length, 0);
  assert.ok(
    h.requests.every(({ sql }) => /select .* from user_roles/i.test(sql.replaceAll('"', ""))),
  );
  await makeAdmin();
  h.setFault({ matches: (sql) => /from user_roles/i.test(sql.replaceAll('"', "")) });
  h.requests.length = 0;
  await assert.rejects(
    h.app.runReadingEvaluationCase(h.records(), h.userA, "saturn-square-sun"),
    /Only admins/,
  );
  assert.equal(h.gatewayRequests.length, 0);
  assert.ok(
    h.requests.every(({ sql }) => /select .* from user_roles/i.test(sql.replaceAll('"', ""))),
  );
});

test("unknown fixed IDs never become model prompts or writes", async () => {
  await makeAdmin();
  h.setGateway(() => {
    throw new Error("An unknown case must not reach the model");
  });
  const previous = snapshot();
  await assert.rejects(
    h.app.runReadingEvaluationCase(h.records(), h.userA, "arbitrary-private-prompt"),
  );
  assert.equal(h.gatewayRequests.length, 0);
  assert.deepEqual(snapshot(), previous);
});

test("active release read errors stop before model spending", async () => {
  await makeAdmin();
  h.setGateway(() => {
    throw new Error("Copy read failures must not reach the model");
  });
  h.setFault({ matches: (sql) => /from content_releases/i.test(sql.replaceAll('"', "")) });
  await assert.rejects(
    h.app.runReadingEvaluationCase(h.records(), h.userA, "saturn-square-sun"),
    /release could not be read/,
  );
  assert.equal(h.gatewayRequests.length, 0);
});

test("synthetic evaluation reads only roles and active copy, leaving every database table unchanged", async () => {
  await makeAdmin();
  await h.seedChart(h.records(), h.userA);
  const saved = await h.records().from("check_ins").insert({
    user_id: h.userA,
    day: "2026-10-11",
    mood: 4,
    energy: 1,
    sleep: 2,
    stress: 3,
    note_ct: "PRIVATE_CHECK_IN_SENTINEL",
  });
  assert.equal(saved.error, null);
  const journal = await h.records().from("life_events").insert({
    user_id: h.userA,
    occurred_on: "2026-10-11",
    label_ct: "PRIVATE_JOURNAL_SENTINEL",
    body_ct: "PRIVATE_ENTRY_SENTINEL",
  });
  assert.equal(journal.error, null);
  const previous = snapshot();
  h.requests.length = 0;
  let expected;
  h.setGateway(() => response(expected));
  const results = [];
  for (const fixed of READING_EVAL_CASES) {
    expected = BASELINE_RESPONSES[fixed.id];
    results.push(await h.app.runReadingEvaluationCase(h.records(), h.userA, fixed.id));
  }
  assert.equal(h.gatewayRequests.length, READING_EVAL_CASES.length - 1);
  assert.ok(
    h.requests.every(({ sql }) =>
      /^select .* from (?:user_roles|content_releases)\b/i.test(sql.replaceAll('"', "")),
    ),
  );
  assert.deepEqual(snapshot(), previous);
  for (const serialized of [JSON.stringify(results), JSON.stringify(h.gatewayRequests)]) {
    assert.doesNotMatch(
      serialized,
      /PRIVATE_|Private birth place|local-reading-user|example\.invalid|local-test-key/,
    );
  }
});

test("evaluation uses and identifies the effective published copy", async () => {
  await makeAdmin();
  const { DEFAULT_BUNDLE } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  const bundle = structuredClone(DEFAULT_BUNDLE);
  bundle.version = "active-evaluation-test";
  for (const interpretation of bundle.cycles) interpretation.mechanism += " ACTIVE_COPY_SENTINEL";
  const released = await h
    .records()
    .from("content_releases")
    .insert({ version: bundle.version, checksum: "fixture-checksum", bundle, is_active: true });
  assert.equal(released.error, null);
  h.setGateway(() => response(BASELINE_RESPONSES["saturn-square-sun"]));
  const result = await h.app.runReadingEvaluationCase(h.records(), h.userA, "saturn-square-sun");
  assert.match(JSON.stringify(result), /active-evaluation-test/);
  assert.match(JSON.stringify(h.gatewayRequests), /ACTIVE_COPY_SENTINEL/);
  assert.match(JSON.stringify(result), /ACTIVE_COPY_SENTINEL/);
});

test("provider failures never expose raw bodies or exception messages in synthetic reports", async () => {
  await makeAdmin();
  for (const [handler, code] of [
    [() => new Response("RAW_PROVIDER_ERROR_SENTINEL", { status: 402 }), "credit"],
    [
      () => {
        throw new Error("RAW_PROVIDER_EXCEPTION_SENTINEL");
      },
      "network",
    ],
    [
      () => Response.json({ choices: [{ message: { content: "RAW_INVALID_JSON_SENTINEL" } }] }),
      "bad_json",
    ],
  ]) {
    h.setGateway(handler);
    const result = await h.app.runReadingEvaluationCase(h.records(), h.userA, "saturn-square-sun");
    assert.equal(result.case.diagnostics.code, code);
    assert.equal(result.case.candidate, null);
    assert.doesNotMatch(JSON.stringify(result), /RAW_PROVIDER|RAW_INVALID/);
  }
});
