import {
  isDraftExpired,
  parseMemberDraft,
  restrictDraftWellness,
  type DraftStore,
  type MemberDraft,
  type WellnessPermission,
} from "./member-drafts";

const NAME = "pattern-member-drafts";
type Owner = {
  ownerId: string;
  generation: string;
  key: CryptoKey | null;
  policyRevision: number;
  permission: WellnessPermission;
};
type Stored = Pick<
  MemberDraft,
  | "ownerId"
  | "draftId"
  | "schemaVersion"
  | "kind"
  | "entityKey"
  | "generation"
  | "revision"
  | "updatedAt"
  | "expiresAt"
> & { iv: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer; deleted?: false };
type Tombstone = { ownerId: string; draftId: string; deleted: true };
function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(new Error("Local draft storage is unavailable."));
  });
}
function completed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(new Error("Local draft storage could not be updated."));
  });
}
function metadata(
  draft: Pick<
    MemberDraft,
    | "ownerId"
    | "draftId"
    | "schemaVersion"
    | "kind"
    | "entityKey"
    | "generation"
    | "revision"
    | "updatedAt"
    | "expiresAt"
  >,
) {
  const {
    ownerId,
    draftId,
    schemaVersion,
    kind,
    entityKey,
    generation,
    revision,
    updatedAt,
    expiresAt,
  } = draft;
  return {
    ownerId,
    draftId,
    schemaVersion,
    kind,
    entityKey,
    generation,
    revision,
    updatedAt,
    expiresAt,
  };
}
function aad(row: ReturnType<typeof metadata>) {
  return new TextEncoder().encode(
    JSON.stringify([
      row.schemaVersion,
      row.ownerId,
      row.draftId,
      row.kind,
      row.entityKey,
      row.generation,
      row.revision,
      row.updatedAt,
      row.expiresAt,
    ]),
  );
}
export async function openMemberDraftStore(): Promise<DraftStore> {
  if (!globalThis.indexedDB || !globalThis.crypto?.subtle)
    throw new Error("Local draft storage is unavailable.");
  const opening = indexedDB.open(NAME, 1);
  opening.onupgradeneeded = () => {
    const db = opening.result;
    db.createObjectStore("owners", { keyPath: "ownerId" });
    db.createObjectStore("drafts", { keyPath: ["ownerId", "draftId"] }).createIndex(
      "owner",
      "ownerId",
    );
  };
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = opening.onblocked = () =>
      reject(new Error("Local draft storage is unavailable."));
  });
  db.onversionchange = () => db.close();
  async function owner(ownerId: string) {
    return (await request(db.transaction("owners").objectStore("owners").get(ownerId))) as
      Owner | undefined;
  }
  const warnings = new Map<string, string>();
  async function put(
    draft: MemberDraft,
    expectedRevision: number | null,
    privacyRewrite = false,
  ): Promise<{ status: "stored" | "conflict" | "invalidated" }> {
    if (!parseMemberDraft(draft)) throw new Error("Invalid local draft.");
    const account = await owner(draft.ownerId);
    if (!account?.key || account.generation !== draft.generation) return { status: "invalidated" };
    const safe = restrictDraftWellness(draft, account.permission);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad(safe) },
      account.key,
      new TextEncoder().encode(
        JSON.stringify({
          values: safe.values,
          baseline: safe.baseline,
          submission: safe.submission,
        }),
      ),
    );
    const tx = db.transaction(["owners", "drafts"], "readwrite"),
      done = completed(tx);
    const latest = (await request(tx.objectStore("owners").get(draft.ownerId))) as
      Owner | undefined;
    const drafts = tx.objectStore("drafts"),
      current = (await request(drafts.get([draft.ownerId, draft.draftId]))) as
        Stored | Tombstone | undefined;
    if (latest?.generation !== account.generation || !latest.key || current?.deleted) {
      await done;
      return { status: "invalidated" };
    }
    if (latest.policyRevision !== account.policyRevision) {
      await done;
      return put(draft, expectedRevision, privacyRewrite);
    }
    if (
      (current?.revision ?? null) !== expectedRevision ||
      (current && !privacyRewrite && draft.revision <= current.revision)
    ) {
      await done;
      return { status: "conflict" };
    }
    drafts.put({ ...metadata(safe), iv, ciphertext });
    await done;
    return { status: "stored" };
  }
  const store: DraftStore = {
    recoveryWarning: (ownerId) => warnings.get(ownerId) ?? null,
    async activateOwner(ownerId) {
      if (!ownerId) throw new Error("An authenticated account is required for local drafts.");
      const existing = await owner(ownerId);
      if (existing?.key) return existing.generation;
      const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
        "encrypt",
        "decrypt",
      ]);
      const tx = db.transaction("owners", "readwrite"),
        done = completed(tx),
        owners = tx.objectStore("owners");
      const latest = (await request(owners.get(ownerId))) as Owner | undefined;
      if (latest?.key) {
        await done;
        return latest.generation;
      }
      const next: Owner = {
        ownerId,
        generation: crypto.randomUUID(),
        key,
        policyRevision: 0,
        permission: { sleep: true, stress: true },
      };
      owners.put(next);
      await done;
      return next.generation;
    },
    async list(ownerId) {
      warnings.delete(ownerId);
      const account = await owner(ownerId);
      if (!account?.key) return [];
      const rows = (await request(
        db.transaction("drafts").objectStore("drafts").index("owner").getAll(ownerId),
      )) as (Stored | Tombstone)[];
      const values: MemberDraft[] = [];
      for (const row of rows) {
        if (row.deleted) continue;
        if (row.generation !== account.generation || isDraftExpired(row)) {
          await store.discard(ownerId, row.draftId);
          continue;
        }
        try {
          const plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: row.iv, additionalData: aad(row) },
            account.key,
            row.ciphertext,
          );
          const draft = parseMemberDraft({
            ...metadata(row),
            ...JSON.parse(new TextDecoder().decode(plain)),
          });
          if (!draft) throw new Error("Invalid draft");
          values.push(restrictDraftWellness(draft, account.permission));
        } catch {
          // Leave the encrypted record untouched; isolate it from healthy recovery.
          warnings.set(
            ownerId,
            "One device draft could not be recovered. Other drafts are available; the unreadable copy has not been removed.",
          );
        }
      }
      // A purge during decryption must not disclose the old account's content.
      const latest = await owner(ownerId);
      if (latest?.generation !== account.generation || !latest.key) return [];
      return values
        .map((d) => restrictDraftWellness(d, latest.permission))
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },
    put,
    async discard(ownerId, draftId) {
      const tx = db.transaction("drafts", "readwrite"),
        done = completed(tx);
      tx.objectStore("drafts").put({ ownerId, draftId, deleted: true });
      await done;
    },
    async purgeOwner(ownerId) {
      const tx = db.transaction(["owners", "drafts"], "readwrite"),
        done = completed(tx);
      tx.objectStore("owners").put({
        ownerId,
        generation: crypto.randomUUID(),
        key: null,
        policyRevision: 0,
        permission: { sleep: false, stress: false },
      } satisfies Owner);
      const drafts = tx.objectStore("drafts");
      const keys = await request(drafts.index("owner").getAllKeys(ownerId));
      keys.forEach((key) => drafts.delete(key));
      await done;
    },
    async setWellnessPermission(ownerId, permission) {
      const tx = db.transaction("owners", "readwrite"),
        done = completed(tx),
        owners = tx.objectStore("owners");
      const current = (await request(owners.get(ownerId))) as Owner | undefined;
      if (current)
        owners.put({ ...current, permission, policyRevision: current.policyRevision + 1 });
      await done;
      // Re-encrypt stripped copies, not just filtered reads. Fenced put also filters late writers.
      // Privacy rewrites do not acknowledge or advance another tab's content revision.
      // A conflicting edit is read again and stripped using the latest persisted policy.
      let retry: boolean;
      do {
        retry = false;
        for (const draft of await store.list(ownerId)) {
          if ((await put(draft, draft.revision, true)).status === "conflict") retry = true;
        }
      } while (retry);
    },
    close() {
      db.close();
    },
  };
  return store;
}
