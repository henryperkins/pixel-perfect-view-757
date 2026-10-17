import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, rollout;
before(async () => {
  h = await createRecordsHarness();
  rollout = await h.vite.ssrLoadModule("/src/lib/ai/member-context-rollout.server.ts");
});
after(async () => h?.close());
async function seed(value, version = "0.9.0") {
  const columns = h.sqlite.prepare("PRAGMA table_info(content_releases)").all();
  if (!columns.some((c) => c.name === "writer_rollout"))
    h.sqlite.exec("ALTER TABLE content_releases ADD COLUMN writer_rollout TEXT");
  h.sqlite.prepare("DELETE FROM content_releases").run();
  h.sqlite
    .prepare(
      "INSERT INTO content_releases(id,version,checksum,bundle,is_active,writer_rollout) VALUES(?,?,?,?,1,?)",
    )
    .run("release", version, "checksum", "{}", value == null ? null : JSON.stringify(value));
}
function config() {
  return {
    version: "daily-member-context-rollout-1",
    releaseVersion: "0.9.0",
    provider: "gemini-enterprise",
    render: "model",
    modes: ["contact-only"],
    policy: rollout.memberContextPolicyIdentity(),
    reviewId: "a".repeat(64),
  };
}
test("absent policy leaves the member context writer off", async () => {
  await seed(null);
  assert.equal(
    await rollout.loadMemberContextRollout(h.records(), "0.9.0", "gemini-enterprise"),
    null,
  );
});
test("reviewed policy binds exact runtime identity provider release and eligible modes", async () => {
  const value = config();
  await seed(value);
  const loaded = await rollout.loadMemberContextRollout(h.records(), "0.9.0", "gemini-enterprise");
  assert.deepEqual(loaded.config, value);
  assert.equal(loaded.releaseId, "release");
  assert.equal(typeof loaded.raw, "string");
  assert.equal(await rollout.loadMemberContextRollout(h.records(), "0.9.0", "lovable"), null);
  assert.equal(
    await rollout.loadMemberContextRollout(h.records(), "0.9.1", "gemini-enterprise"),
    null,
  );
});
test("malformed stale duplicate unknown or unreviewed policy fails closed", async () => {
  for (const change of [
    (v) => (v.policy.materialHash = "b".repeat(64)),
    (v) => (v.policy.fallbackHash = "b".repeat(64)),
    (v) => (v.policy.adapterHash = "b".repeat(64)),
    (v) => v.modes.push("quiet"),
    (v) => v.modes.push("contact-only"),
    (v) => (v.modes = []),
    (v) => delete v.reviewId,
    (v) => (v.reviewId = "unknown"),
    (v) => (v.render = "other"),
    (v) => (v.provider = "lovable"),
    (v) => (v.releaseVersion = "0.9.1"),
    (v) => (v.extra = "unreviewed"),
  ]) {
    const value = config();
    change(value);
    await seed(value);
    assert.equal(
      await rollout.loadMemberContextRollout(h.records(), "0.9.0", "gemini-enterprise"),
      null,
      JSON.stringify(value),
    );
  }
});
test("authored and model policies have distinct immutable cache identities and preserve clone isolation", async () => {
  const value = config();
  await seed(value);
  const model = await rollout.loadMemberContextRollout(h.records(), "0.9.0", "gemini-enterprise");
  value.render = "authored";
  await seed(value);
  const authored = await rollout.loadMemberContextRollout(
    h.records(),
    "0.9.0",
    "gemini-enterprise",
  );
  assert.notDeepEqual(
    rollout.memberContextRolloutIdentity(model),
    rollout.memberContextRolloutIdentity(authored),
  );
  const copied = rollout.memberContextRolloutIdentity(authored);
  copied.modes.push("natal-only");
  assert.deepEqual(authored.config.modes, ["contact-only"]);
  assert.equal(rollout.memberContextRolloutIdentity(null), null);
});

test("serving policy binds the shared writer brief and qualifier guard bytes as well as fallback material", () => {
  const policy = rollout.memberContextPolicyIdentity();
  for (const key of ["writerHash", "briefHash", "claimsHash"])
    assert.match(policy[key] ?? "", /^[a-f0-9]{64}$/, key);
});
