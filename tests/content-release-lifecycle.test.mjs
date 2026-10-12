import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, lifecycle, hashing;
before(async () => {
  h = await createRecordsHarness();
  lifecycle = await h.vite.ssrLoadModule("/src/lib/content/release-lifecycle.server.ts");
  hashing = await h.vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
});
after(async () => {
  await h?.close();
});
beforeEach(async () => {
  await h.reset();
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
});
const bundle = (text = "Published copy.") => ({ cycles: [], natal: { sun_placement: text } });
const actor = () => ({ kind: "admin", userId: h.userA });
const stage = (version, text) =>
  lifecycle.stageContentRelease(h.records(), {
    version,
    bundle: bundle(text),
    actor: actor(),
    source: "admin",
  });
const activate = (version, expectedPreviousVersion) =>
  lifecycle.setActiveContentRelease(h.records(), {
    version,
    expectedPreviousVersion,
    actor: actor(),
    source: "admin",
  });

test("staging is immutable, canonical and inactive; identical upload is harmless", async () => {
  const first = await stage("1.0.0");
  const replay = await stage("1.0.0");
  assert.equal(first.checksum, replay.checksum);
  assert.equal(first.checksumAlgorithm, "sha256-canonical-json-v1");
  assert.equal(first.checksum, await hashing.contentChecksum(bundle()));
  assert.equal(
    h.sqlite.prepare("SELECT count(*) n FROM content_releases WHERE is_active=1").get().n,
    0,
  );
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM content_releases").get().n, 1);
  await assert.rejects(() => stage("1.0.0", "Different copy."), /conflict|immutable/i);
  await assert.rejects(() => stage("ai-new", "Copy."), /version/i);
  await assert.rejects(
    () =>
      lifecycle.stageContentRelease(h.records(), {
        version: "2.0.0",
        bundle: {},
        actor: actor(),
        source: "admin",
      }),
    /empty/i,
  );
});

test("an activation middle-write failure preserves the previous pointer and both audit stores", async () => {
  await stage("1.0.0");
  await stage("2.0.0");
  await activate("1.0.0", null);
  const before = h.sqlite
    .prepare("SELECT version,is_active,activation_audit FROM content_releases ORDER BY version")
    .all();
  const audit = h.sqlite.prepare("SELECT * FROM audit_events ORDER BY rowid").all();
  h.setFault({ matches: (sql) => /^UPDATE content_releases SET is_active=1/i.test(sql) });
  await assert.rejects(() => activate("2.0.0", "1.0.0"), /activation|pointer|failed/i);
  h.setFault(null);
  assert.deepEqual(
    h.sqlite
      .prepare("SELECT version,is_active,activation_audit FROM content_releases ORDER BY version")
      .all(),
    before,
  );
  assert.deepEqual(h.sqlite.prepare("SELECT * FROM audit_events ORDER BY rowid").all(), audit);
});

test("concurrent different activations compare the previous pointer and leave exactly one active release", async () => {
  for (const v of ["1.0.0", "2.0.0", "3.0.0"]) await stage(v);
  await activate("1.0.0", null);
  const results = await Promise.allSettled([
    activate("2.0.0", "1.0.0"),
    activate("3.0.0", "1.0.0"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  assert.equal(
    h.sqlite.prepare("SELECT count(*) n FROM content_releases WHERE is_active=1").get().n,
    1,
  );
  assert.equal(
    h.sqlite
      .prepare("SELECT count(*) n FROM audit_events WHERE kind='content_release_activated'")
      .get().n,
    2,
  );
});

test("rollback keeps legacy checksum semantics and never changes saved readings", async () => {
  await h
    .records()
    .from("content_releases")
    .insert({
      version: "ai-existing",
      checksum: "legacy-hmac-value",
      bundle: bundle("Older copy."),
      is_active: true,
      created_at: "2020-01-01T00:00:00Z",
    });
  await stage("2.0.0");
  await activate("2.0.0", "ai-existing");
  const receipt = await activate("ai-existing", "2.0.0");
  assert.equal(receipt.isRollback, true);
  assert.equal(receipt.checksum, "legacy-hmac-value");
  assert.equal(receipt.checksumAlgorithm, "legacy-unlabelled");
  assert.equal(
    h.sqlite
      .prepare("SELECT checksum_algorithm FROM content_releases WHERE version=?")
      .get("ai-existing").checksum_algorithm,
    null,
  );
});

test("mirror failure is a partial publication and reconciliation reuses its operation without model calls", async () => {
  h.setReleasePublicationHandler(() => new Response("Mirror unavailable", { status: 503 }));
  const staged = await stage("1.0.0");
  assert.equal(staged.publication.status, "failed");
  const active = await activate("1.0.0", null);
  assert.equal(active.activeVersion, "1.0.0");
  assert.equal(active.publication.status, "failed");
  const auditCount = h.sqlite.prepare("SELECT count(*) n FROM audit_events").get().n;
  const operationId = active.publication.operationId;
  h.setReleasePublicationHandler(null);
  const fixed = await lifecycle.reconcileContentReleasePublication(h.records(), {
    version: "1.0.0",
    actor: actor(),
  });
  assert.equal(fixed.publication.status, "complete");
  assert.equal(fixed.publication.operationId, operationId);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM audit_events").get().n, auditCount);
  assert.equal(h.gatewayRequests.length + h.geminiEnterpriseRequests.length, 0);
});

test("non-admin staging, activation and reconciliation fail before mutation", async () => {
  const bad = { kind: "admin", userId: h.userB };
  await assert.rejects(
    () =>
      lifecycle.stageContentRelease(h.records(), {
        version: "1.0.0",
        bundle: bundle(),
        actor: bad,
        source: "admin",
      }),
    /admin/i,
  );
  await stage("1.0.0");
  await assert.rejects(
    () =>
      lifecycle.setActiveContentRelease(h.records(), {
        version: "1.0.0",
        expectedPreviousVersion: null,
        actor: bad,
        source: "admin",
      }),
    /admin/i,
  );
  await assert.rejects(
    () =>
      lifecycle.reconcileContentReleasePublication(h.records(), { version: "1.0.0", actor: bad }),
    /admin/i,
  );
  assert.equal(
    h.sqlite.prepare("SELECT count(*) n FROM content_releases WHERE is_active=1").get().n,
    0,
  );
});

test("draft staging requires the exact reviewed candidate and consumes the draft atomically", async () => {
  const base = { ...bundle(), version: "1.0.0" },
    candidate = { ...bundle("Candidate copy."), version: "pending" };
  const baseHash = await hashing.contentChecksum(base),
    candidateHash = await hashing.contentChecksum(candidate);
  const { data, error } = await h
    .records()
    .from("content_drafts")
    .insert({
      user_id: h.userA,
      base_version: base.version,
      base_bundle: base,
      base_hash: baseHash,
      bundle: candidate,
    })
    .select("id")
    .single();
  assert.equal(error, null);
  const input = {
    version: "2.0.0",
    bundle: { ...candidate, version: "2.0.0" },
    actor: actor(),
    source: "admin",
    draftReview: { draftId: data.id, candidateHash, baseHash },
  };
  await assert.rejects(() => lifecycle.stageContentRelease(h.records(), input), /review/i);
  await h.app.approveDraftReview(h.records(), h.userA, {
    draftId: data.id,
    candidateHash,
    baseHash,
  });
  h.setFault({ matches: (sql) => /^UPDATE content_drafts SET status='published'/i.test(sql) });
  await assert.rejects(() => lifecycle.stageContentRelease(h.records(), input));
  h.setFault(null);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM content_releases").get().n, 0);
  assert.equal(
    h.sqlite.prepare("SELECT status FROM content_drafts WHERE id=?").get(data.id).status,
    "draft",
  );
  await lifecycle.stageContentRelease(h.records(), input);
  assert.equal(
    h.sqlite.prepare("SELECT status,published_version FROM content_drafts WHERE id=?").get(data.id)
      .status,
    "published",
  );
  assert.equal(
    h.sqlite.prepare("SELECT published_version FROM content_drafts WHERE id=?").get(data.id)
      .published_version,
    "2.0.0",
  );
});

test("re-upload preserves unlabelled historical checksums without silently relabelling", async () => {
  await h.records().from("content_releases").insert({
    version: "1.0.0",
    checksum: "historical-checksum",
    bundle: bundle(),
    is_active: false,
  });
  const receipt = await stage("1.0.0");
  assert.equal(receipt.checksum, "historical-checksum");
  assert.equal(receipt.checksumAlgorithm, "legacy-unlabelled");
  assert.equal(
    h.sqlite.prepare("SELECT checksum_algorithm FROM content_releases").get().checksum_algorithm,
    null,
  );
});

test("semantically identical reordered legacy uploads obtain a publication state", async () => {
  const original = { natal: { sun_placement: "Legacy copy." }, cycles: [] };
  const replay = { cycles: [], natal: { sun_placement: "Legacy copy." } };
  await h
    .records()
    .from("content_releases")
    .insert({ version: "1.0.0", checksum: "legacy-hmac", bundle: original, is_active: false });
  const receipt = await lifecycle.stageContentRelease(h.records(), {
    version: "1.0.0",
    bundle: replay,
    actor: actor(),
    source: "admin",
  });
  assert.equal(receipt.publication.status, "complete");
  assert.equal(receipt.checksum, "legacy-hmac");
});

test("a delayed delivery cannot announce an older pointer or overwrite the newer publication state", async () => {
  await stage("1.0.0");
  await stage("2.0.0");
  let releaseFirst, entered;
  const pending = new Promise((resolve) => {
    entered = resolve;
  });
  const gate = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  h.setReleasePublicationHandler(async (body) => {
    if (body.active && body.version === "1.0.0") {
      entered();
      await gate;
    }
    return Response.json({
      ok: true,
      ...body,
      artifactKey: "content-releases/" + body.version + "/bundle.json",
      activeVersion: body.active ? body.version : null,
    });
  });
  const first = activate("1.0.0", null);
  await pending;
  await activate("2.0.0", "1.0.0");
  releaseFirst();
  const receipt = await first;
  assert.equal(receipt.activeVersion, "2.0.0");
  assert.equal(receipt.publication.status, "superseded");
  assert.equal(
    h.sqlite.prepare("SELECT version FROM content_releases WHERE is_active=1").get().version,
    "2.0.0",
  );
});

test("rapidly staged releases retain precise creation time and numeric rollback direction", async () => {
  await stage("1.0.0");
  await stage("2.0.0");
  const timestamps = h.sqlite.prepare("SELECT created_at FROM content_releases").all();
  assert.ok(timestamps.every((row) => /T.*Z$/.test(row.created_at)));
  h.sqlite.prepare("UPDATE content_releases SET created_at='2026-10-12T00:00:00.000Z'").run();
  await activate("1.0.0", null);
  await activate("2.0.0", "1.0.0");
  const back = await activate("1.0.0", "2.0.0");
  assert.equal(back.isRollback, true);
  assert.equal(back.publication.operation, "rollback");
});

test("a late failed reconciliation cannot downgrade an already completed operation", async () => {
  h.setReleasePublicationHandler(() => new Response("Unavailable", { status: 503 }));
  await stage("1.0.0");
  await activate("1.0.0", null);
  let releaseFirst, entered;
  const pending = new Promise((resolve) => {
    entered = resolve;
  });
  const gate = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  let count = 0;
  h.setReleasePublicationHandler(async (body) => {
    if (count++ === 0) {
      entered();
      await gate;
      return new Response("Late failure", { status: 503 });
    }
    return Response.json({
      ok: true,
      ...body,
      artifactKey: "content-releases/" + body.version + "/bundle.json",
      activeVersion: body.version,
    });
  });
  const input = { version: "1.0.0", actor: actor() };
  const first = lifecycle.reconcileContentReleasePublication(h.records(), input);
  await pending;
  const second = await lifecycle.reconcileContentReleasePublication(h.records(), input);
  assert.equal(second.publication.status, "complete");
  releaseFirst();
  const late = await first;
  assert.equal(late.publication.status, "complete");
  assert.equal(
    JSON.parse(
      h.sqlite.prepare("SELECT publication_state FROM content_releases").get().publication_state,
    ).status,
    "complete",
  );
});

test("overlapping legacy initialization cannot replace a winning active publication operation", async () => {
  await h
    .records()
    .from("content_releases")
    .insert({ version: "1.0.0", checksum: "legacy-hmac", bundle: bundle(), is_active: false });
  const originalFetch = globalThis.fetch;
  let releaseFirst,
    entered,
    held = false;
  const gate = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const pending = new Promise((resolve) => {
    entered = resolve;
  });
  globalThis.fetch = async (input, init) => {
    if (!held && String(input).endsWith("/d1/batch")) {
      const payload = JSON.parse(init.body);
      if (
        payload.statements.some((s) =>
          /^UPDATE content_releases SET publication_state=.*AND bundle=/i.test(s.sql),
        )
      ) {
        held = true;
        entered();
        await gate;
      }
    }
    return originalFetch(input, init);
  };
  try {
    const delayedStage = stage("1.0.0");
    await pending;
    await stage("1.0.0");
    await activate("1.0.0", null);
    releaseFirst();
    await delayedStage;
    await lifecycle.setActiveContentRelease(h.records(), {
      version: "1.0.0",
      actor: actor(),
      source: "admin",
    });
    assert.equal(
      JSON.parse(
        h.sqlite.prepare("SELECT activation_audit FROM content_releases").get().activation_audit,
      ).length,
      1,
    );
    assert.equal(
      JSON.parse(
        h.sqlite.prepare("SELECT publication_state FROM content_releases").get().publication_state,
      ).active,
      true,
    );
  } finally {
    globalThis.fetch = originalFetch;
    releaseFirst();
  }
});
