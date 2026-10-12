import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, comparison;
before(async () => {
  h = await createRecordsHarness();
  comparison = await h.vite.ssrLoadModule("/src/lib/content/draft-comparison.ts");
});
after(async () => {
  await h?.close();
});
beforeEach(async () => {
  await h.reset();
  await h.records().from("user_roles").insert({ user_id: h.userA, role: "admin" });
});
const base = () => ({
  version: "1.0.0",
  cycles: [
    {
      key: "hard:saturn:sun",
      mechanism: "The deadline makes the tradeoff visible.",
      question: "Which commitment can wait?",
      themes: [],
    },
  ],
  natal: { sun_placement: "A steady way of choosing." },
});
async function seedDraft({ legacy = false } = {}) {
  const bundle = { ...base(), version: "pending" };
  bundle.cycles[0].mechanism = "A changed deadline makes the tradeoff visible.";
  const frozen = base();
  const hash = await comparison.contentChecksum(frozen);
  const row = {
    user_id: h.userA,
    base_version: frozen.version,
    bundle,
    status: "draft",
    ...(legacy ? {} : { base_bundle: frozen, base_hash: hash }),
  };
  const { data, error } = await h
    .records()
    .from("content_drafts")
    .insert(row)
    .select("id")
    .single();
  assert.equal(error, null);
  return data.id;
}

test("canonical checksum is stable across object key order and includes every semantic field", async () => {
  const a = {
    version: "1.0.0",
    cycles: [{ key: "a", question: "One?", mechanism: "Two." }],
    futureFrames: [{ key: "x", opening: "A concrete moment." }],
  };
  const b = {
    futureFrames: [{ opening: "A concrete moment.", key: "x" }],
    cycles: [{ mechanism: "Two.", question: "One?", key: "a" }],
    version: "1.0.0",
  };
  assert.equal(await comparison.contentChecksum(a), await comparison.contentChecksum(b));
  b.futureFrames[0].opening = "A different moment.";
  assert.notEqual(await comparison.contentChecksum(a), await comparison.contentChecksum(b));
  assert.throws(() => comparison.canonicalContentJson({ value: NaN }), /finite|JSON/i);
});

test("comparison retains complete prose, questions, synthesis, natal, transit and future frame values", () => {
  const before = {
    version: "1.0.0",
    cycles: [{ key: "a", mechanism: "Before.", question: "Before?", themes: ["structure"] }],
    synthesisRules: [{ key: "pair", mechanism: "Pair before.", primary: { theme: "structure" } }],
    natalLenses: [{ key: "lens", mechanism: "Lens before." }],
    transitChapters: [{ key: "story", mechanism: "Story before.", question: "Story?" }],
    writingFrames: [{ key: "frame", opening: "Opening.", action: "Wait." }],
  };
  const after = structuredClone(before);
  after.version = "pending";
  after.cycles[0].question = "After?";
  after.synthesisRules[0].primary.theme = "expansion";
  after.natalLenses[0].mechanism = "Lens after.";
  after.transitChapters[0].question = "Another story?";
  after.writingFrames[0].action = "Ask.";
  const result = comparison.compareContentBundles(before, after);
  assert.equal(result.counts.changed, 5);
  assert.equal(result.counts.unchanged, 0);
  const cycles = result.entries.find((e) => e.section === "cycles");
  assert.deepEqual(cycles.changedFields, ["question"]);
  assert.equal(cycles.base.mechanism, "Before.");
  assert.deepEqual(cycles.candidate.themes, ["structure"]);
  assert.deepEqual(result.entries.find((e) => e.section === "synthesisRules").changedFields, [
    "primary.theme",
  ]);
  assert.equal(
    result.entries.find((e) => e.section === "writingFrames").candidate.opening,
    "Opening.",
  );
});

test("comparison identifies added, removed and unchanged entries without dropping context", () => {
  const result = comparison.compareContentBundles(
    {
      cycles: [
        { key: "gone", mechanism: "Removed." },
        { key: "same", mechanism: "Context." },
      ],
      phases: { building: "Building before." },
    },
    {
      cycles: [
        { key: "new", mechanism: "Added." },
        { key: "same", mechanism: "Context." },
      ],
      phases: { building: "Building before." },
    },
  );
  assert.deepEqual(result.counts, { added: 1, removed: 1, changed: 0, unchanged: 2 });
  assert.equal(result.entries.find((e) => e.key === "same").candidate.mechanism, "Context.");
  assert.throws(
    () => comparison.compareContentBundles({ cycles: [{ key: "same" }, { key: "same" }] }, {}),
    /duplicate/i,
  );
});

test("a draft comparison keeps its frozen baseline after the active release changes", async () => {
  const id = await seedDraft();
  await h
    .records()
    .from("content_releases")
    .insert({
      version: "2.0.0",
      checksum: "legacy-hmac",
      bundle: { ...base(), version: "2.0.0" },
      is_active: true,
    });
  const result = await h.app.getDraftComparison(h.records(), h.userA, id);
  assert.equal(result.baseVersion, "1.0.0");
  assert.equal(result.baseAvailable, true);
  assert.equal(result.reviewed, false);
  assert.equal(
    result.entries.find((e) => e.section === "cycles").base.mechanism,
    base().cycles[0].mechanism,
  );
});

test("review approval binds exact hashes; edit and explicit rebase invalidate it", async () => {
  const id = await seedDraft();
  let result = await h.app.getDraftComparison(h.records(), h.userA, id);
  await assert.rejects(
    () =>
      h.app.approveDraftReview(h.records(), h.userA, {
        draftId: id,
        candidateHash: "0".repeat(64),
        baseHash: result.baseHash,
      }),
    /changed|review/i,
  );
  await h.app.approveDraftReview(h.records(), h.userA, {
    draftId: id,
    candidateHash: result.candidateHash,
    baseHash: result.baseHash,
  });
  assert.equal((await h.app.getDraftComparison(h.records(), h.userA, id)).reviewed, true);
  const candidate = { ...base(), version: "pending" };
  candidate.cycles[0].question = "What changes now?";
  await h.app.editContentDraft(h.records(), h.userA, {
    draftId: id,
    bundle: candidate,
    expectedCandidateHash: result.candidateHash,
  });
  result = await h.app.getDraftComparison(h.records(), h.userA, id);
  assert.equal(result.reviewed, false);
  assert.equal(
    result.entries.find((e) => e.section === "cycles").candidate.question,
    "What changes now?",
  );
  await assert.rejects(
    () =>
      h.app.editContentDraft(h.records(), h.userA, {
        draftId: id,
        bundle: candidate,
        expectedCandidateHash: "0".repeat(64),
      }),
    /changed/i,
  );
  await h.app.approveDraftReview(h.records(), h.userA, {
    draftId: id,
    candidateHash: result.candidateHash,
    baseHash: result.baseHash,
  });
  await h.app.rebaseContentDraft(h.records(), h.userA, {
    draftId: id,
    expectedCandidateHash: result.candidateHash,
  });
  assert.equal((await h.app.getDraftComparison(h.records(), h.userA, id)).reviewed, false);
});

test("a legacy draft has no invented baseline and must explicitly rebase before review", async () => {
  const id = await seedDraft({ legacy: true });
  const result = await h.app.getDraftComparison(h.records(), h.userA, id);
  assert.equal(result.baseAvailable, false);
  assert.equal(result.baseHash, null);
  assert.match(result.reason, /original comparison unavailable/i);
  await assert.rejects(
    () =>
      h.app.approveDraftReview(h.records(), h.userA, {
        draftId: id,
        candidateHash: result.candidateHash,
        baseHash: "0".repeat(64),
      }),
    /baseline|rebase/i,
  );
  await h.app.rebaseContentDraft(h.records(), h.userA, {
    draftId: id,
    expectedCandidateHash: result.candidateHash,
  });
  assert.equal((await h.app.getDraftComparison(h.records(), h.userA, id)).baseAvailable, true);
});

test("comparison, editing, approval and rebase require current administrator authority", async () => {
  const id = await seedDraft();
  await assert.rejects(() => h.app.getDraftComparison(h.records(), h.userB, id), /admin/i);
  await assert.rejects(
    () =>
      h.app.approveDraftReview(h.records(), h.userB, {
        draftId: id,
        candidateHash: "0".repeat(64),
        baseHash: "0".repeat(64),
      }),
    /admin/i,
  );
  await assert.rejects(
    () =>
      h.app.rebaseContentDraft(h.records(), h.userB, {
        draftId: id,
        expectedCandidateHash: "0".repeat(64),
      }),
    /admin/i,
  );
});

test("comparison exposes section absence, container changes and semantic array order", () => {
  const absent = comparison.compareContentBundles(
    { cycles: [], natal: { sun_placement: "Copy." } },
    { natal: { sun_placement: "Copy." } },
  );
  assert.equal(absent.counts.removed, 1);
  assert.ok(absent.entries.some((e) => e.key === "cycles" && e.kind === "section"));
  const order = comparison.compareContentBundles(
    {
      cycles: [
        { key: "a", mechanism: "A." },
        { key: "b", mechanism: "B." },
      ],
    },
    {
      cycles: [
        { key: "b", mechanism: "B." },
        { key: "a", mechanism: "A." },
      ],
    },
  );
  assert.equal(order.counts.changed, 1);
  assert.ok(order.entries.some((e) => e.kind === "section" && e.changedFields.includes("order")));
  const mixed = comparison.compareContentBundles(
    {
      writingFrames: [
        { key: "a", opening: "A." },
        { key: "b", opening: "B." },
      ],
    },
    {
      writingFrames: [
        { key: "b", opening: "B." },
        { key: "a", opening: "A." },
        { key: "c", opening: "C." },
      ],
    },
  );
  assert.equal(mixed.counts.added, 1);
  assert.equal(mixed.counts.changed, 1);
  assert.deepEqual(mixed.entries.find((e) => e.kind === "section").candidate, ["b", "a", "c"]);
});

test("discard cannot overwrite a consumed reviewed draft", async () => {
  const id = await seedDraft();
  h.sqlite
    .prepare("UPDATE content_drafts SET status='published',published_version='2.0.0' WHERE id=?")
    .run(id);
  await assert.rejects(
    () => h.app.discardDraft(h.records(), h.userA, id),
    /closed|open|published/i,
  );
  assert.equal(
    h.sqlite.prepare("SELECT status FROM content_drafts WHERE id=?").get(id).status,
    "published",
  );
});
