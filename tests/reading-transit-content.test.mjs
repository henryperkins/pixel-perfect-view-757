import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
let h, b, s;
before(async () => {
  h = await createRecordsHarness();
  b = (await h.vite.ssrLoadModule("/src/lib/content/transit-candidate-bundle.ts"))
    .TRANSIT_CANDIDATE_BUNDLE;
  s = await h.vite.ssrLoadModule("/src/lib/content/schema.ts");
});
after(async () => h?.close());
test("inactive_transit_candidate_preserves_the_shipped_fallback_and_natal_candidate", async () => {
  const { DEFAULT_BUNDLE } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  const { NATAL_CANDIDATE_BUNDLE } = await h.vite.ssrLoadModule(
    "/src/lib/content/natal-candidate-bundle.ts",
  );
  const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  assert.equal(
    hash(DEFAULT_BUNDLE),
    "f68cc97e749d78d6a2332b9d87fb9fc4ce367d61d437ffa19f8485a2778330c1",
  );
  assert.equal(
    hash(NATAL_CANDIDATE_BUNDLE),
    "b073d625c23b5bede66eba25e37bd3f3397263710dd63ab67d8af06b6e216500",
  );
  assert.equal(DEFAULT_BUNDLE.natalLenses, undefined);
  assert.equal(DEFAULT_BUNDLE.transitChapters, undefined);
  assert.equal(NATAL_CANDIDATE_BUNDLE.transitChapters, undefined);
  assert.deepEqual(b.natalLenses, NATAL_CANDIDATE_BUNDLE.natalLenses);
  assert.equal(b.version, "builtin-0.7.1");
  assert.equal(b.schemaVersion, 4);
  s.validateContentGraph(b);
});
test("legacy_content_does_not_inherit_chapters_and_empty_is_authoritative", () => {
  for (const raw of [{ cycles: [] }, { cycles: [], schemaVersion: 4, transitChapters: [] }])
    assert.deepEqual(s.normalizeContentBundle(raw, "legacy", b).transitChapters, []);
});
test("chapter_copy_is_not_a_personal_history", () => {
  assert.equal(b.transitChapters.length, 5);
  s.validateContentGraph(b);
  for (const mechanism of [
    "You experienced a rupture last May.",
    "The final pass guarantees closure.",
    "Your trauma is healed.",
    "If this is your third return, it ends today.",
    "Your Moon is in Aries.",
  ])
    assert.throws(() =>
      s.validateContentGraph({
        ...b,
        transitChapters: [{ key: "bad", chapter: "return", mechanism }],
      }),
    );
  assert.throws(() => s.validateContentGraph({ ...b, schemaVersion: 3 }));
});
test("phase_copy_is_conditional_and_release_owned", () => {
  for (const text of Object.values(b.phases)) assert.match(text, /\b(?:if|can|may)\b/i);
  const active = { ...b, phases: { exact: "Existing reviewed phase." } };
  assert.equal(
    s.normalizeContentBundle(active, "active", b).phases.exact,
    "Existing reviewed phase.",
  );
});
test("cycle_draft_preserves_chapter_catalogue", async () => {
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
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
  await h.records().from("content_releases").insert({
    version: b.version,
    checksum: "synthetic-transit-candidate",
    bundle: b,
    is_active: true,
  });
  await h.app.draftRelease(h.records(), h.userA);
  const draft = JSON.parse(h.sqlite.prepare("SELECT bundle FROM content_drafts").get().bundle);
  assert.deepEqual(draft.transitChapters, b.transitChapters);
  assert.equal(draft.schemaVersion, 4);
});
