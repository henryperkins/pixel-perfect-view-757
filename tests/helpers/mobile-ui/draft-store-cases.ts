import { MemberDraftController } from "@/lib/member-draft-controller";
import { createMemberDraft, editMemberDraft, withDraftSubmission } from "@/lib/member-drafts";
export async function runDraftStoreCases() {
  const results: { name: string; passed: boolean }[] = [];
  function check(name: string, value: unknown) {
    results.push({ name, passed: Boolean(value) });
    if (!value) throw new Error(name);
  }
  let module: typeof import("@/lib/member-draft-store.client");
  try {
    module = await import("@/lib/member-draft-store.client");
  } catch {
    check("encrypted draft store exists", false);
    return results;
  }
  const store = await module.openMemberDraftStore();
  const ownerId = `test-${crypto.randomUUID()}`;
  const generation = await store.activateOwner(ownerId);
  const values = {
    day: "2026-10-14",
    timezone: "UTC",
    mood: 3,
    energy: 4,
    sleep: 2,
    stress: 1,
    note: "PRIVATE-CHECKPOINT-SENTINEL",
  };
  const d = createMemberDraft({
    ownerId,
    generation,
    kind: "check-in",
    entityKey: values.day,
    values,
    baseline: { values: { ...values, note: "" }, version: null },
  });
  check("first transaction commits", (await store.put(d, null)).status === "stored");
  check("other owner cannot read a draft", (await store.list("another-owner")).length === 0);
  store.close();
  const second = await module.openMemberDraftStore();
  check(
    "reopen restores committed fields",
    (await second.list(ownerId))[0]?.values.note === values.note,
  );
  const current = editMemberDraft(d, { ...values, note: "Newer checkpoint" });
  check("next revision commits", (await second.put(current, 0)).status === "stored");
  check(
    "stale writer cannot overwrite",
    (await second.put(editMemberDraft(d, { ...values, note: "Stale tab" }), 0)).status ===
      "conflict",
  );
  await second.setWellnessPermission(ownerId, { sleep: false, stress: false });
  const restricted = (await second.list(ownerId))[0];
  check(
    "consent strips stored optional fields",
    restricted?.values.sleep === null && restricted.values.stress === null,
  );
  check("consent preserves note", restricted?.values.note === "Newer checkpoint");
  check(
    "privacy rewriting preserves the content revision",
    restricted.revision === current.revision,
  );
  const a = new MemberDraftController(async () => second);
  const b = new MemberDraftController(async () => second);
  await a.setOwner(ownerId);
  a.resume(ownerId, d.draftId);
  await a.setWellnessPermission({ sleep: false, stress: false });
  await b.setOwner(ownerId);
  b.resume(ownerId, d.draftId);
  a.update(ownerId, {
    kind: "check-in",
    entityKey: values.day,
    values: { ...values, note: "A newer text" },
    baseline: d.baseline,
  });
  await a.flush();
  b.update(ownerId, {
    kind: "check-in",
    entityKey: values.day,
    values: { ...values, note: "B independent text" },
    baseline: d.baseline,
  });
  await b.flush();
  const concurrent = await second.list(ownerId);
  check(
    "consent then two-tab editing preserves both versions",
    concurrent.some((d) => d.values.note === "A newer text") &&
      concurrent.some((d) => d.values.note === "B independent text"),
  );
  for (const extra of concurrent)
    if (extra.draftId !== d.draftId) await second.discard(ownerId, extra.draftId);
  await second.discard(ownerId, d.draftId);
  check(
    "discard tombstone rejects late writer",
    (await second.put(current, null)).status === "invalidated",
  );
  const another = createMemberDraft({
    ownerId,
    generation,
    kind: "check-in",
    entityKey: values.day,
    values,
    baseline: { values, version: null },
  });
  await second.purgeOwner(ownerId);
  check(
    "logout fence rejects delayed writer",
    (await second.put(another, null)).status === "invalidated",
  );
  check("purged account has no recoverable content", (await second.list(ownerId)).length === 0);
  const nextGeneration = await second.activateOwner(ownerId);
  check("new login uses a different generation", nextGeneration !== generation);
  const expired = createMemberDraft({
    ownerId,
    generation: nextGeneration,
    kind: "check-in",
    entityKey: values.day,
    values,
    baseline: { values, version: null },
    now: Date.now() - 8 * 86400000,
  });
  await second.put(expired, null);
  check("expired drafts never restore", (await second.list(ownerId)).length === 0);
  await second.purgeOwner(ownerId);
  const faultOwner = `test-${crypto.randomUUID()}`;
  const faultGeneration = await second.activateOwner(faultOwner);
  const make = () =>
    createMemberDraft({
      ownerId: faultOwner,
      generation: faultGeneration,
      kind: "check-in",
      entityKey: values.day,
      values,
      baseline: { values, version: null },
    });
  const good = withDraftSubmission(make(), crypto.randomUUID());
  const bad = make();
  await second.put(good, null);
  await second.put(bad, null);
  const rawDb = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("pattern-member-drafts", 1);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const raw = <T>(name: string, key: IDBValidKey) =>
    new Promise<T>((resolve, reject) => {
      const r = rawDb.transaction(name).objectStore(name).get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  const stored = await raw<{ ciphertext: ArrayBuffer; iv: Uint8Array }>("drafts", [
    faultOwner,
    good.draftId,
  ]);
  const keyOwner = await raw<{ key: CryptoKey }>("owners", faultOwner);
  check("browser key is non-extractable", keyOwner.key.extractable === false);
  check(
    "private sentinel is absent from raw IndexedDB records",
    !JSON.stringify(stored).includes(values.note) &&
      !new TextDecoder().decode(stored.ciphertext).includes(values.note),
  );
  const broken = await raw<{ ciphertext: ArrayBuffer }>("drafts", [faultOwner, bad.draftId]);
  new Uint8Array(broken.ciphertext)[0] ^= 1;
  await new Promise<void>((resolve, reject) => {
    const tx = rawDb.transaction("drafts", "readwrite");
    tx.objectStore("drafts").put(broken);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
  const healthy = await second.list(faultOwner);
  check(
    "one damaged record does not block healthy recovery",
    healthy.length === 1 &&
      healthy[0].draftId === good.draftId &&
      Boolean(second.recoveryWarning?.(faultOwner)),
  );
  check(
    "damaged ciphertext is retained for explicit cleanup",
    Boolean(await raw("drafts", [faultOwner, bad.draftId])),
  );
  await second.setWellnessPermission(faultOwner, { sleep: false, stress: false });
  const safe = (await second.list(faultOwner))[0];
  check(
    "consent strips active payload, baseline and pending submission",
    [
      safe.values,
      safe.baseline.values,
      safe.submission?.values,
      safe.submission?.baseline.values,
    ].every((v) => v?.sleep === null && v?.stress === null),
  );
  for (const action of ["discard", "purge"] as const) {
    const late = make();
    const encrypt = crypto.subtle.encrypt;
    let started!: () => void, release!: () => void;
    const began = new Promise<void>((resolve) => (started = resolve)),
      gate = new Promise<void>((resolve) => (release = resolve));
    crypto.subtle.encrypt = async function (...args: Parameters<SubtleCrypto["encrypt"]>) {
      const result = await encrypt.apply(this, args);
      started();
      await gate;
      return result;
    };
    try {
      const writing = second.put(late, null);
      await began;
      if (action === "discard") await second.discard(faultOwner, late.draftId);
      else await second.purgeOwner(faultOwner);
      release();
      check(
        `${action} during encryption rejects the pending write`,
        (await writing).status === "invalidated",
      );
    } finally {
      release();
      crypto.subtle.encrypt = encrypt;
    }
  }
  rawDb.close();
  second.close();
  return results;
}
