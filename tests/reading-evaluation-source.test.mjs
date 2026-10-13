import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, comparison, resolveContentComparisonSource;
const canonicalAlgorithm = "sha256-canonical-json-v1";
const bundleAlgorithm = "sha256-json-stringify-v1";
const bundleHash = (bundle) => createHash("sha256").update(JSON.stringify(bundle)).digest("hex");
const base = () => ({
  version: "1.0.0",
  cycles: [
    {
      key: "hard:saturn:sun",
      mechanism: "A deadline can make a tradeoff visible.",
      question: "Which commitment, if any, can wait?",
      themes: [],
    },
  ],
  natal: { sun_placement: "A steady way of choosing." },
  phases: {},
  domains: {},
});
const candidate = () => {
  const bundle = base();
  bundle.version = "pending";
  bundle.cycles[0].mechanism = "A changed deadline can make a tradeoff visible.";
  return bundle;
};

before(async () => {
  h = await createRecordsHarness();
  comparison = await h.vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
  ({ resolveContentComparisonSource } = await h.vite.ssrLoadModule(
    "/src/lib/content/evaluation-source.server.ts",
  ));
});
after(async () => h?.close());
beforeEach(async () => {
  await h.reset();
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
});
afterEach(() => {
  assert.equal(h.gatewayRequests.length, 0);
  assert.equal(h.geminiEnterpriseRequests.length, 0);
  assert.equal(h.evaluationStarts.length, 0);
  assert.equal(h.releasePublications.length, 0);
});

async function seedDraft(overrides = {}) {
  const baseline = base();
  const { data, error } = await h
    .records()
    .from("content_drafts")
    .insert({
      user_id: h.userB,
      status: "draft",
      base_version: baseline.version,
      base_bundle: baseline,
      base_hash: await comparison.contentChecksum(baseline),
      bundle: candidate(),
      ...overrides,
    })
    .select("id")
    .single();
  assert.equal(error, null);
  return { kind: "draft", draftId: data.id };
}
async function seedRelease(bundle, overrides = {}) {
  const { data, error } = await h
    .records()
    .from("content_releases")
    .insert({
      version: bundle.version,
      bundle,
      checksum: await comparison.contentChecksum(bundle),
      checksum_algorithm: canonicalAlgorithm,
      is_active: false,
      ...overrides,
    })
    .select("id")
    .single();
  assert.equal(error, null);
  return data.id;
}
async function seedPair({ baseline = {}, target = {}, content = candidate() } = {}) {
  const baselineReleaseId = await seedRelease(base(), { is_active: true, ...baseline });
  const releaseId = await seedRelease({ ...content, version: "1.1.0" }, target);
  return { kind: "release", releaseId, baselineReleaseId };
}
function sourceRows() {
  return ["content_drafts", "content_releases", "evaluation_runs", "evaluation_results"].map(
    (table) => h.sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all(),
  );
}
async function resolve(source, userId = h.userA, db = h.records()) {
  const before = sourceRows();
  try {
    return await resolveContentComparisonSource(db, userId, source);
  } finally {
    assert.deepEqual(sourceRows(), before, "source resolution must not write content or runs");
  }
}

test("draft preparation uses the complete frozen pair before approval and supports shared admin review", async () => {
  const source = await seedDraft();
  await seedRelease({ ...base(), version: "9.0.0" }, { is_active: true });
  const pair = await resolve(source);
  assert.deepEqual(pair.source, source);
  assert.deepEqual(pair.baseline, base());
  assert.deepEqual(pair.candidate, candidate());
  assert.deepEqual(pair.changedKeys, ["hard:saturn:sun"]);
  for (const arm of ["baseline", "candidate"]) {
    assert.equal(pair.identities[arm].version, pair[arm].version);
    assert.equal(pair.identities[arm].canonicalHash, await comparison.contentChecksum(pair[arm]));
    assert.equal(pair.identities[arm].checksumAlgorithm, canonicalAlgorithm);
    assert.equal(pair.identities[arm].bundleHash, bundleHash(pair[arm]));
    assert.equal(pair.identities[arm].bundleHashAlgorithm, bundleAlgorithm);
  }
  await h.records().batch(pair.guards);
  assert.ok(pair.guards.some((guard) => /user_roles/.test(guard.sql)));
  assert.ok(pair.guards.some((guard) => /content_drafts/.test(guard.sql)));
});

test("members cannot read either draft or release source details", async () => {
  const draft = await seedDraft();
  const release = await seedPair();
  for (const source of [draft, release]) {
    h.requests.length = 0;
    await assert.rejects(() => resolve(source, h.userB), /admin/i);
    assert.equal(
      h.requests.some(({ sql }) => /FROM "content_(drafts|releases)"/i.test(sql)),
      false,
    );
  }
});

test("authority revoked while preparing a pair prevents returned source details", async () => {
  const source = await seedDraft();
  const db = h.records();
  let checks = 0;
  const wrapped = {
    ...db,
    from(table) {
      if (table === "user_roles" && ++checks === 2)
        h.sqlite.prepare("DELETE FROM user_roles WHERE user_id=?").run(h.userA);
      return db.from(table);
    },
  };
  await assert.rejects(() => resolve(source, h.userA, wrapped), /admin/i);
  assert.equal(checks, 2);
});

test("missing, discarded, and published drafts cannot be evaluated", async () => {
  await assert.rejects(() => resolve({ kind: "draft", draftId: "missing" }), /open|draft/i);
  for (const status of ["discarded", "published"]) {
    const source = await seedDraft({ status });
    await assert.rejects(() => resolve(source), /open|draft/i);
  }
});

test("a missing or incomplete frozen baseline requires explicit rebase without reading the active release", async () => {
  for (const overrides of [
    { base_bundle: null, base_hash: null },
    { base_bundle: null },
    { base_hash: null },
  ]) {
    const source = await seedDraft(overrides);
    h.requests.length = 0;
    await assert.rejects(() => resolve(source), /baseline|rebase/i);
    assert.equal(
      h.requests.some(({ sql }) => /content_releases/i.test(sql)),
      false,
    );
  }
});

test("a corrupt baseline graph fails even when its stored canonical hash is valid", async () => {
  const broken = base();
  broken.cycles[0].question = "";
  const source = await seedDraft({
    base_bundle: broken,
    base_hash: await comparison.contentChecksum(broken),
  });
  await assert.rejects(() => resolve(source), /question/i);
});

test("incomplete source bundles and malformed ancillary copy are rejected without filling current defaults", async () => {
  for (const edit of [
    (bundle) => delete bundle.phases,
    (bundle) => {
      bundle.natal.sun_placement = 10;
    },
    (bundle) => {
      bundle.domains.work = { label: "Work", hard: "A task." };
    },
  ]) {
    const broken = candidate();
    edit(broken);
    const source = await seedDraft({ bundle: broken });
    await assert.rejects(() => resolve(source), /complete|natal|domain/i);
  }
});

test("stale draft baseline hashes and mismatched versions fail integrity checks", async () => {
  for (const overrides of [
    { base_hash: "0".repeat(64) },
    { base_version: "2.0.0" },
    { bundle: { ...candidate(), cycles: [{ key: "broken" }] } },
  ]) {
    const source = await seedDraft(overrides);
    await assert.rejects(() => resolve(source), /integrity|mechanism/i);
  }
});

test("version-only differences cannot become a comparison", async () => {
  const draft = await seedDraft({ bundle: { ...base(), version: "pending" } });
  const release = await seedPair({ content: base() });
  for (const source of [draft, release])
    await assert.rejects(() => resolve(source), /identical|change/i);
});

test("source selectors reject raw content, prompts, unknown fields, and empty IDs", async () => {
  const source = await seedDraft();
  for (const invalid of [
    { ...source, bundle: candidate() },
    { ...source, prompt: "Use this instead" },
    { ...source, caseIds: ["case"] },
    { kind: "draft", draftId: "" },
    { kind: "release", releaseId: "one" },
    { kind: "other", draftId: source.draftId },
  ])
    await assert.rejects(() => resolve(invalid), /source|selector|ID/i);
});

test("draft transaction guards reject edits, rebase, discard, and role revocation before run creation", async () => {
  for (const mutation of [
    (id) =>
      h.sqlite
        .prepare("UPDATE content_drafts SET bundle=? WHERE id=?")
        .run(JSON.stringify(base()), id),
    (id) =>
      h.sqlite.prepare("UPDATE content_drafts SET base_hash=? WHERE id=?").run("0".repeat(64), id),
    (id) => h.sqlite.prepare("UPDATE content_drafts SET status='discarded' WHERE id=?").run(id),
    () => h.sqlite.prepare("DELETE FROM user_roles WHERE user_id=?").run(h.userA),
  ]) {
    const source = await seedDraft();
    const pair = await resolve(source);
    mutation(source.draftId);
    await assert.rejects(() => h.records().batch(pair.guards));
  }
});

test("explicit release IDs resolve inactive candidate and preserve canonical source identity", async () => {
  const source = await seedPair();
  const pair = await resolve(source);
  assert.equal(pair.baseline.version, "1.0.0");
  assert.equal(pair.candidate.version, "1.1.0");
  assert.equal(
    pair.identities.candidate.storedChecksum,
    await comparison.contentChecksum(pair.candidate),
  );
  assert.equal(pair.identities.candidate.storedChecksumAlgorithm, canonicalAlgorithm);
  await h.records().batch(pair.guards);
});

test("legacy release checksums stay explicitly unlabelled beside separately computed identities", async () => {
  const source = await seedPair({
    baseline: { checksum: "old-signature", checksum_algorithm: null },
    target: { checksum: "legacy-candidate", checksum_algorithm: null },
  });
  const pair = await resolve(source);
  assert.equal(pair.identities.baseline.storedChecksum, "old-signature");
  assert.equal(pair.identities.candidate.storedChecksum, "legacy-candidate");
  for (const arm of ["baseline", "candidate"]) {
    assert.equal(pair.identities[arm].storedChecksumAlgorithm, "legacy-unlabelled");
    assert.equal(pair.identities[arm].checksumAlgorithm, canonicalAlgorithm);
    assert.equal(pair.identities[arm].canonicalHash, await comparison.contentChecksum(pair[arm]));
    assert.equal(pair.identities[arm].bundleHash, bundleHash(pair[arm]));
  }
});

test("canonical identities ignore object key order while evaluation bundle hashes retain it", async () => {
  const original = candidate();
  const reordered = Object.fromEntries(Object.entries(original).reverse());
  const first = await resolve(await seedDraft({ bundle: original }));
  const second = await resolve(await seedDraft({ bundle: reordered }));
  assert.equal(first.identities.candidate.canonicalHash, second.identities.candidate.canonicalHash);
  assert.notEqual(first.identities.candidate.bundleHash, second.identities.candidate.bundleHash);
  assert.deepEqual(Object.keys(second.candidate), Object.keys(reordered));
});

test("labelled canonical checksums are validated on both arms and unknown labels fail closed", async () => {
  for (const arm of ["baseline", "target"]) {
    for (const override of [
      { checksum: "0".repeat(64) },
      { checksum_algorithm: "sha256-something-else" },
    ]) {
      await h.reset();
      await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
      const source = await seedPair({ [arm]: override });
      await assert.rejects(() => resolve(source), /checksum|integrity/i);
    }
  }
});

test("missing, active, identical-ID, invalid, and mismatched-version release sources are rejected", async () => {
  const source = await seedPair();
  await assert.rejects(
    () => resolve({ ...source, baselineReleaseId: "missing" }),
    /release|missing/i,
  );
  await assert.rejects(() => resolve({ ...source, releaseId: "missing" }), /release|missing/i);
  await assert.rejects(
    () => resolve({ ...source, releaseId: source.baselineReleaseId }),
    /identical|different|inactive/i,
  );
  h.sqlite.prepare("UPDATE content_releases SET is_active=0").run();
  h.sqlite.prepare("UPDATE content_releases SET is_active=1 WHERE id=?").run(source.releaseId);
  await assert.rejects(() => resolve(source), /inactive/i);
  h.sqlite
    .prepare("UPDATE content_releases SET is_active=0,version='9.0.0' WHERE id=?")
    .run(source.releaseId);
  await assert.rejects(() => resolve(source), /version/i);
});

test("release transaction guards protect immutable bytes, checksum labels, and candidate inactivity", async () => {
  for (const mutation of [
    (source) =>
      h.sqlite
        .prepare("UPDATE content_releases SET bundle=? WHERE id=?")
        .run(JSON.stringify(base()), source.releaseId),
    (source) =>
      h.sqlite
        .prepare("UPDATE content_releases SET checksum='changed' WHERE id=?")
        .run(source.baselineReleaseId),
    (source) =>
      h.sqlite
        .prepare("UPDATE content_releases SET checksum_algorithm=NULL WHERE id=?")
        .run(source.releaseId),
    (source) => {
      h.sqlite.prepare("UPDATE content_releases SET is_active=0").run();
      h.sqlite.prepare("UPDATE content_releases SET is_active=1 WHERE id=?").run(source.releaseId);
    },
  ]) {
    await h.reset();
    await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
    const source = await seedPair();
    const pair = await resolve(source);
    mutation(source);
    await assert.rejects(() => h.records().batch(pair.guards));
  }
});

test("an active pointer move alone does not invalidate an explicit baseline snapshot", async () => {
  const source = await seedPair();
  const pair = await resolve(source);
  h.sqlite.prepare("UPDATE content_releases SET is_active=0").run();
  await seedRelease({ ...base(), version: "9.0.0" }, { is_active: true });
  await h.records().batch(pair.guards);
});

test("full source comparison retains ancillary changes and semantic array order", async () => {
  const edited = candidate();
  edited.natal.sun_placement = "A changed way of choosing.";
  edited.futureCopy = { example: "Retained future source." };
  const source = await seedDraft({ bundle: edited });
  const pair = await resolve(source);
  assert.deepEqual(pair.candidate, edited);
  assert.ok(pair.changes.some((entry) => entry.section === "natal" && entry.change === "changed"));
  assert.ok(
    pair.changes.some((entry) => entry.section === "futureCopy" && entry.change === "added"),
  );
});
