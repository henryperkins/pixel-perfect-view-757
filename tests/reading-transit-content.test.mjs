import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { before, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";
import { transitImperatives } from "./fixtures/transit-imperatives.mjs";
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
test("historical transit commands cannot be published as chapter or phase copy", () => {
  for (const mechanism of transitImperatives) {
    assert.throws(
      () => s.validateContentGraph({ ...b, phases: { exact: mechanism } }),
      /phase.*safety/i,
      mechanism,
    );
    assert.throws(
      () =>
        s.validateContentGraph({
          ...b,
          transitChapters: [{ key: "historical", chapter: "opening", mechanism }],
        }),
      /unsafe transit/i,
      mechanism,
    );
  }
});
test("the bounded imperative check preserves declarative notice and conditional capability", async () => {
  const { safetyPass } = await h.vite.ssrLoadModule("/src/lib/content/default-bundle.ts");
  for (const text of [
    ...transitImperatives,
    "Notice your response before treating it as settled.",
    "A response can be provisional; consider how it might change.",
    "If a demand feels immediate, please start with a clear choice.",
    "If a demand feels immediate, then notice your response.",
    "Notice a response before treating it as settled.",
  ])
    assert.ok(safetyPass(text).flagged.length, text);
  for (const text of [
    ...Object.values(b.phases),
    ...b.transitChapters.map((c) => c.mechanism),
    "You notice which response may still be useful.",
    "What you notice can remain open to consideration.",
    "If you notice a demand, your response can remain provisional.",
    "A notice can describe a commitment.",
    "With more time, notice of a change may arrive.",
    "A choice can start with a clearly described scope.",
    "You may consider how a response could fit an ordinary commitment.",
    "You can pause, notice your response, and describe it.",
    "If a demand catches your attention, you can pause, notice your response, and describe it.",
  ])
    assert.deepEqual(safetyPass(text).flagged, [], text);
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
