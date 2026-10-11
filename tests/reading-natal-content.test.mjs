import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { createHmac } from "node:crypto";

let h, bundle, fallback, schema, policy;
before(async () => {
  h = await createRecordsHarness();
  ({ DEFAULT_BUNDLE: fallback } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts"));
  ({ NATAL_CANDIDATE_BUNDLE: bundle } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  ));
  schema = await h.vite.ssrLoadModule("/src/lib/content/schema.ts");
});
after(async () => h?.close());

const rule = () => ({
  key: "reviewed-1",
  role: "emotional_reflex",
  anchorNatalPoints: ["sun"],
  selectors: [{ kind: "sign", body: "moon", sign: "Capricorn" }],
  mechanism:
    "Preparation can offer a way to meet pressure. An unfinished reply may distinguish useful preparation from waiting for everything to settle.",
});
test("legacy_release_never_inherits_natal_lenses", () => {
  assert.deepEqual(schema.normalizeContentBundle({ cycles: [] }, "legacy", bundle).natalLenses, []);
});
test("empty_active_natal_catalogue_is_authoritative", () => {
  assert.deepEqual(
    schema.normalizeContentBundle(
      { cycles: [], schemaVersion: 3, natalLenses: [] },
      "empty",
      bundle,
    ).natalLenses,
    [],
  );
});
test("schema3_rejects_invalid_natal_rules", () => {
  const valid = { cycles: [], schemaVersion: 3, natalLenses: [rule()] };
  assert.doesNotThrow(() => schema.validateContentGraph(valid));
  const changes = [
    { role: "initiative" },
    { anchorNatalPoints: ["sun", "sun"] },
    { selectors: [{ kind: "sign", body: "node", sign: "Capricorn" }] },
    { selectors: [{ kind: "sign", body: "moon", sign: "*" }] },
    {
      selectors: [
        ...rule().selectors,
        { kind: "aspect", a: "moon", b: "ascendant", aspect: "trine", maxOrb: 3 },
      ],
    },
    {
      selectors: [
        ...rule().selectors,
        { kind: "aspect", a: "moon", b: "saturn", aspect: "trine", maxOrb: 3.001 },
      ],
    },
    { selectors: [...rule().selectors, { kind: "house", body: "sun", house: 6 }] },
    { mechanism: "Your nervous system is wired for duty." },
    { mechanism: "You always prepare before acting." },
    { mechanism: "Your Moon in Capricorn occupies house 6." },
    { mechanism: "One. Two. Three. Four." },
  ];
  for (const change of changes)
    assert.throws(() =>
      schema.validateContentGraph({ ...valid, natalLenses: [{ ...rule(), ...change }] }),
    );
  assert.throws(() => schema.validateContentGraph({ ...valid, schemaVersion: 2 }));
  assert.throws(() =>
    schema.validateContentGraph({
      ...valid,
      natalLenses: [rule(), { ...rule(), key: "duplicate-selector" }],
    }),
  );
});
test("seed_catalogue_has_individual_copy_and_complete_coverage", () => {
  assert.equal(bundle.version, "builtin-0.6.0");
  assert.equal(bundle.schemaVersion, 3);
  assert.equal(bundle.natalLenses.filter((r) => r.selectors.length === 1).length, 60);
  assert.equal(bundle.natalLenses.filter((r) => r.selectors.length === 2).length, 2);
  assert.equal(new Set(bundle.natalLenses.map((r) => r.mechanism)).size, 62);
  schema.validateContentGraph(bundle);
});
test("deployed_fallback_never_carries_the_natal_catalogue", async () => {
  await h.reset();
  // The fallback stays the validated prior graph, so a deploy cannot activate lenses.
  assert.equal(fallback.version, "builtin-0.5.0");
  assert.equal(fallback.schemaVersion, 2);
  assert.equal(fallback.natalLenses, undefined);
  schema.validateContentGraph(fallback);
  const served = await h.app.activeBundle(h.records());
  assert.equal(served.version, "builtin-0.5.0");
  assert.ok(!served.natalLenses?.length);
  // The candidate differs from the fallback only by identity, schema and catalogue.
  const { natalLenses, version, schemaVersion, ...candidateCopy } = bundle;
  const { version: fallbackVersion, schemaVersion: fallbackSchema, ...fallbackCopy } = fallback;
  assert.deepEqual(candidateCopy, fallbackCopy);
  const { transitCopyIdentity } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  );
  const published = schema.normalizeContentBundle(structuredClone(bundle), "0.6.0", fallback);
  assert.deepEqual(transitCopyIdentity(published), transitCopyIdentity(fallback));
  const edited = structuredClone(bundle);
  edited.cycles[0].mechanism = `${edited.cycles[0].mechanism} Edited.`;
  assert.notDeepEqual(transitCopyIdentity(edited), transitCopyIdentity(fallback));
});
test("natal_wording_policy_is_bounded", async () => {
  policy = await h.vite.ssrLoadModule("/src/lib/content/natal-lens-policy.ts");
  assert.equal(policy.natalLensWordingProblem("Your nervous system needs structure."), "clinical");
  assert.equal(policy.natalLensWordingProblem("You always take responsibility."), "certainty");
  assert.equal(
    policy.natalLensWordingProblem(
      "If you recognize this response, preparation may offer a useful distinction.",
    ),
    null,
  );
});
test("cycle_draft_preserves_reviewed_natal_catalogue", async () => {
  await h.reset();
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  // Drafting starts from the active release, so the catalogue must be published first.
  await h
    .records()
    .from("content_releases")
    .insert({ version: bundle.version, checksum: "candidate", bundle, is_active: true });
  h.setGateway(() =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              entries: [
                {
                  key: "hard:saturn:*",
                  mechanism: "A responsibility can have a manageable scope.",
                  question: "Which part has a clear scope?",
                },
              ],
            }),
          },
        },
      ],
    }),
  );
  await h.app.draftRelease(h.records(), h.userA);
  const draft = JSON.parse(h.sqlite.prepare("SELECT bundle FROM content_drafts").get().bundle);
  assert.deepEqual(draft.natalLenses, bundle.natalLenses);
  assert.equal(draft.schemaVersion, 3);
});
test("invalid_natal_ingest_activation_and_rollback_leave_active_pointer_intact", async () => {
  await h.reset();
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
  await h
    .records()
    .from("content_releases")
    .insert({ version: "1.0.0", checksum: "prior", bundle: { cycles: [] }, is_active: true });
  const invalid = { ...bundle, version: "2.0.0", natalLenses: [{ ...rule(), role: "initiative" }] };
  const { data } = await h
    .records()
    .from("content_releases")
    .insert({ version: "2.0.0", checksum: "bad", bundle: invalid, is_active: false })
    .select("id")
    .single();
  await assert.rejects(h.app.activateRelease(h.records(), h.userA, data.id), /natal.*role/);
  const oldSecret = process.env.PATTERN_INGEST_SECRET;
  process.env.PATTERN_INGEST_SECRET = "natal-local-test-secret";
  try {
    for (const [path, payload] of [
      ["content-releases.ts", { version: "3.0.0", bundle: invalid }],
      ["content-releases.rollback.ts", { version: "2.0.0" }],
    ]) {
      const route = await h.vite.ssrLoadModule(`/src/routes/api/public/${path}`);
      const raw = JSON.stringify(payload);
      const response = await route.Route.options.server.handlers.POST({
        request: new Request("http://test/content", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-pattern-signature": createHmac("sha256", process.env.PATTERN_INGEST_SECRET)
              .update(raw)
              .digest("hex"),
          },
          body: raw,
        }),
      });
      assert.equal(response.status, 422);
    }
    assert.equal(
      h.sqlite.prepare("SELECT version FROM content_releases WHERE is_active=1").get().version,
      "1.0.0",
    );
  } finally {
    if (oldSecret === undefined) delete process.env.PATTERN_INGEST_SECRET;
    else process.env.PATTERN_INGEST_SECRET = oldSecret;
  }
});

test("active_catalogue_read_failure_never_inherits_builtin_natal_lenses", async () => {
  await h.reset();
  await h
    .records()
    .from("content_releases")
    .insert({
      version: "legacy-empty",
      checksum: "legacy",
      bundle: { cycles: [], natalLenses: [] },
      is_active: true,
    });
  h.setFault({ matches: (sql) => /select .* from "content_releases"/i.test(sql) });
  await assert.rejects(h.app.activeBundle(h.records()), /could not be read/);
  assert.equal(
    h.sqlite.prepare("SELECT version FROM content_releases WHERE is_active=1").get().version,
    "legacy-empty",
  );
  assert.equal(h.gatewayRequests.length, 0);
  h.setFault(null);
});

test("one_transient_release_read_failure_is_retried_once", async () => {
  await h.reset();
  await h
    .records()
    .from("content_releases")
    .insert({ version: bundle.version, checksum: "candidate", bundle, is_active: true });
  let failures = 0;
  h.setFault({
    matches: (sql) => /select .* from "content_releases"/i.test(sql) && failures++ === 0,
  });
  const served = await h.app.activeBundle(h.records());
  h.setFault(null);
  assert.equal(failures, 2);
  assert.equal(served.version, bundle.version);
  assert.equal(served.natalLenses.length, 62);
});
