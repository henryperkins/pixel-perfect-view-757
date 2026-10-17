import assert from "node:assert/strict";
import { test } from "node:test";
let Controller;
try {
  ({ MemberDraftController: Controller } = await import("../src/lib/member-draft-controller.ts"));
} catch (e) {
  if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
}
function setup(fail = false) {
  assert.equal(typeof Controller, "function", "root-lifetime draft controller is missing");
  const rows = new Map();
  let generation = "one";
  const store = {
    activateOwner: async () => generation,
    list: async (owner) => [...rows.values()].filter((d) => d.ownerId === owner),
    put: async (d, expected) => {
      if (fail) throw Error("quota");
      const old = rows.get(d.draftId);
      if ((old?.revision ?? null) !== expected) return { status: "conflict" };
      rows.set(d.draftId, structuredClone(d));
      return { status: "stored" };
    },
    discard: async (_, id) => rows.delete(id),
    purgeOwner: async () => {
      generation = "two";
      rows.clear();
    },
    setWellnessPermission: async () => {},
    close: () => {},
  };
  return { controller: new Controller(async () => store), rows, store };
}
const input = {
  kind: "journal-new",
  entityKey: "new",
  values: {
    occurredOn: "2026-10-14",
    domain: "general",
    label: "Draft title",
    body: "My note",
    cycleKey: "",
    featureKey: "",
  },
  baseline: {
    values: {
      occurredOn: "2026-10-14",
      domain: "general",
      label: "",
      body: "",
      cycleKey: "",
      featureKey: "",
    },
    version: null,
  },
};
test("root-lifetime edits survive a new route consumer and acknowledge only their revision", async () => {
  const { controller: c, rows } = setup();
  await c.setOwner("a");
  const d = c.update("a", input);
  await c.flush(d.draftId);
  assert.equal(c.durability(d.draftId), "stored");
  assert.equal(c.get("a", "journal-new", "new").values.body, "My note");
  const submission = await c.submit("a", input, "operation-a");
  c.update("a", { ...input, values: { ...input.values, body: "Later text" } });
  c.acknowledge("a", "journal-new", "new", submission, input.values, "saved");
  await c.flush(c.get("a", "journal-new", "new").draftId);
  assert.equal(c.get("a", "journal-new", "new").values.body, "Later text");
  assert.equal([...rows.values()][0].values.body, "Later text");
});
test("owner transition clears active plaintext and never loads another account candidates", async () => {
  const { controller: c } = setup();
  await c.setOwner("a");
  const d = c.update("a", input);
  await c.flush(d.draftId);
  await c.setOwner("b");
  assert.equal(c.get("a", "journal-new", "new"), null);
  assert.equal(c.candidates("b", "journal-new").length, 0);
  await c.setOwner("a");
  assert.equal(c.candidates("a", "journal-new").length, 1);
});
test("storage failure keeps editable memory with an explicit durability error", async () => {
  const { controller: c } = setup(true);
  await c.setOwner("a");
  const d = c.update("a", input);
  await c.flush(d.draftId);
  assert.equal(c.durability(d.draftId), "error");
  assert.equal(c.get("a", "journal-new", "new").values.body, "My note");
});
test("discard invalidates active state without deleting a different draft", async () => {
  const { controller: c, rows } = setup();
  await c.setOwner("a");
  const d = c.update("a", input);
  const other = c.update("a", { ...input, entityKey: "other" });
  await Promise.all([c.flush(d.draftId), c.flush(other.draftId)]);
  await c.discard("a", d.draftId);
  assert.equal(c.get("a", "journal-new", "new"), null);
  assert.equal(rows.size, 1);
});

test("a new edit at write completion is queued before flush finishes", async () => {
  const { controller: c, rows } = setup();
  await c.setOwner("a");
  let changed = false;
  const remove = c.subscribe(() => {
    const draft = c.get("a", "journal-new", "new");
    if (draft && c.durability(draft.draftId) === "stored" && !changed) {
      changed = true;
      c.update("a", { ...input, values: { ...input.values, body: "Last keystroke" } });
    }
  });
  c.update("a", input);
  await c.flush();
  remove();
  assert.equal(changed, true);
  assert.equal([...rows.values()][0].values.body, "Last keystroke");
  assert.equal(c.hasUndurable(), false);
});

test("the next day offers the earlier active check-in as a dated recovery candidate", async () => {
  const { controller: c } = setup();
  await c.setOwner("a");
  const values = {
    day: "2026-10-14",
    timezone: "Pacific/Auckland",
    mood: 3,
    energy: 4,
    sleep: null,
    stress: null,
    note: "Yesterday's unfinished note",
  };
  c.update("a", {
    kind: "check-in",
    entityKey: values.day,
    values,
    baseline: { values: { ...values, note: "" }, version: null },
  });
  await c.flush();
  assert.equal(c.get("a", "check-in", "2026-10-15"), null);
  const [candidate] = c.candidates("a", "check-in");
  assert.equal(candidate.entityKey, "2026-10-14");
  assert.equal(candidate.values.timezone, "Pacific/Auckland");
  assert.equal(candidate.values.note, values.note);
});

test("submission waits for its checkpoint even when a conflict forks the draft", async () => {
  const { controller: c, rows, store } = setup();
  await c.setOwner("a");
  const original = c.update("a", input);
  await c.flush();
  rows.set(original.draftId, {
    ...original,
    revision: 1,
    values: { ...input.values, body: "Other tab's text" },
  });
  let started, release;
  const began = new Promise((resolve) => (started = resolve));
  const gate = new Promise((resolve) => (release = resolve));
  const put = store.put;
  store.put = async (draft, expected) => {
    if (draft.draftId !== original.draftId) {
      started();
      await gate;
    }
    return put(draft, expected);
  };
  let dispatched = false;
  const pending = c.submit("a", input, "original-operation").then((value) => {
    dispatched = true;
    return value;
  });
  await began;
  await new Promise((resolve) => setImmediate(resolve));
  try {
    assert.equal(dispatched, false, "transport must wait for the fork's durable submission");
  } finally {
    release();
    await pending;
  }
  assert.equal(
    [...rows.values()].some(
      (d) => d.draftId !== original.draftId && d.submission?.operationId === "original-operation",
    ),
    true,
  );
});

test("a deferred checkpoint cannot restore optional values after consent is withdrawn and re-enabled", async () => {
  const { controller: c, rows } = setup();
  await c.setOwner("a");
  const pending = {
    kind: "check-in",
    entityKey: "2026-10-17",
    values: {
      day: "2026-10-17",
      timezone: "UTC",
      mood: 3,
      energy: 4,
      sleep: 5,
      stress: 2,
      note: "Queued reflection",
    },
    baseline: {
      values: {
        day: "2026-10-17",
        timezone: "UTC",
        mood: null,
        energy: null,
        sleep: null,
        stress: null,
        note: "",
      },
      version: null,
    },
  };
  c.update("a", pending);
  await c.flush();
  await c.setWellnessPermission({ sleep: false, stress: false });
  await c.setWellnessPermission({ sleep: true, stress: true });
  const submission = await c.submit("a", pending, "queued-check-in");
  assert.equal(submission.values.sleep, null);
  assert.equal(submission.values.stress, null);
  assert.equal([...rows.values()][0].submission.values.sleep, null);
});
