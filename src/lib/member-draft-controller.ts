import {
  acknowledgeMemberDraft,
  createMemberDraft,
  editMemberDraft,
  isDraftExpired,
  restrictDraftWellness,
  sameDraftValues,
  withDraftSubmission,
  type DraftBaseline,
  type DraftKind,
  type DraftStore,
  type DraftSubmission,
  type DraftValuesMap,
  type MemberDraft,
  type WellnessPermission,
} from "./member-drafts.ts";
export type DraftInput<K extends DraftKind> = {
  kind: K;
  entityKey: string;
  values: DraftValuesMap[K];
  baseline: DraftBaseline<K>;
};
export type DraftDurability = "pending" | "stored" | "error";
const scope = (owner: string, kind: DraftKind, entity: string) =>
  JSON.stringify([owner, kind, entity]);
/** The root owns this coordinator; route unmount does not own or discard a draft. */
export class MemberDraftController {
  ownerId: string | null = null;
  generation = "";
  error: string | null = null;
  private version = 0;
  private epoch = 0;
  private listeners = new Set<() => void>();
  private active = new Map<string, MemberDraft>();
  private recovered: MemberDraft[] = [];
  private persisted = new Map<string, number>();
  private states = new Map<string, DraftDurability>();
  private queues = new Map<string, Promise<void>>();
  private invalidated = new Set<string>();
  private ready: Promise<void> = Promise.resolve();
  private store: DraftStore | null = null;
  private permission: WellnessPermission = { sleep: true, stress: true };
  private openStore: () => Promise<DraftStore>;
  constructor(openStore: () => Promise<DraftStore>) {
    this.openStore = openStore;
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.version;
  private emit() {
    this.version++;
    this.listeners.forEach((listener) => listener());
  }
  get<K extends DraftKind>(
    owner: string | null,
    kind: K,
    entityKey: string,
  ): MemberDraft<K> | null {
    if (!owner || owner !== this.ownerId) return null;
    return (this.active.get(scope(owner, kind, entityKey)) as MemberDraft<K> | undefined) ?? null;
  }
  candidates(owner: string | null, kind: DraftKind) {
    return owner === this.ownerId
      ? [
          ...new Map(
            [...this.recovered, ...this.active.values()].map((d) => [d.draftId, d]),
          ).values(),
        ].filter((d) => d.kind === kind && !isDraftExpired(d))
      : [];
  }
  durability(id: string) {
    return this.states.get(id) ?? "pending";
  }
  hasUndurable() {
    return [...this.active.values()].some((d) => this.durability(d.draftId) !== "stored");
  }
  async setOwner(ownerId: string | null) {
    if (ownerId === this.ownerId) return this.ready;
    const epoch = ++this.epoch;
    this.ownerId = ownerId;
    this.generation = "";
    this.active.clear();
    this.recovered = [];
    this.persisted.clear();
    this.states.clear();
    this.error = null;
    this.permission = { sleep: true, stress: true };
    this.emit();
    if (!ownerId) return;
    this.ready = (async () => {
      try {
        this.store ??= await this.openStore();
        const generation = await this.store.activateOwner(ownerId);
        const drafts = await this.store.list(ownerId);
        if (epoch !== this.epoch) return;
        this.generation = generation;
        this.recovered = drafts.map((d) => restrictDraftWellness(d, this.permission));
        this.error = this.store.recoveryWarning?.(ownerId) ?? null;
        drafts.forEach((d) => this.persisted.set(d.draftId, d.revision));
      } catch {
        if (epoch === this.epoch)
          this.error =
            "Local draft recovery is unavailable. Save or copy your text before leaving.";
      }
      if (epoch === this.epoch) this.emit();
    })();
    await this.ready;
  }
  async revalidateOwner(owner: string | null) {
    if (owner !== this.ownerId) {
      await this.setOwner(owner);
      return true;
    }
    await this.ready;
    if (!owner || !this.store || !this.generation) return false;
    const epoch = this.epoch;
    const generation = await this.store.activateOwner(owner);
    if (epoch !== this.epoch || generation === this.generation) return false;
    await this.setOwner(null);
    await this.setOwner(owner);
    return true;
  }
  update<K extends DraftKind>(owner: string, input: DraftInput<K>): MemberDraft<K> {
    if (owner !== this.ownerId) throw new Error("Verify your account before editing this draft.");
    const old = this.get(owner, input.kind, input.entityKey);
    const draft = restrictDraftWellness(
      old
        ? editMemberDraft(old, input.values)
        : createMemberDraft({ ownerId: owner, generation: this.generation || "pending", ...input }),
      this.permission,
    );
    this.active.set(scope(owner, input.kind, input.entityKey), draft);
    this.states.set(draft.draftId, "pending");
    this.emit();
    this.schedule(draft.draftId);
    return draft;
  }
  private schedule(id: string) {
    if (this.queues.has(id)) return;
    const epoch = this.epoch;
    const run = async () => {
      await this.ready;
      while (epoch === this.epoch && !this.invalidated.has(id)) {
        const draft = [...this.active.values()].find((d) => d.draftId === id);
        if (!draft) return;
        if (!this.store || !this.generation) {
          this.states.set(id, "error");
          this.emit();
          return;
        }
        draft.generation = this.generation;
        const revision = draft.revision;
        try {
          const result = await this.store.put(
            structuredClone(draft),
            this.persisted.get(id) ?? null,
          );
          if (epoch !== this.epoch || this.invalidated.has(id)) return;
          if (result.status === "invalidated") {
            this.active.delete(scope(draft.ownerId, draft.kind, draft.entityKey));
            this.recovered = this.recovered.filter((d) => d.draftId !== id);
            this.error = "This draft was cleared in another tab.";
            this.emit();
            return;
          }
          if (result.status === "conflict") {
            const current = this.get(draft.ownerId, draft.kind, draft.entityKey);
            if (!current) return;
            this.recovered = await this.store.list(draft.ownerId);
            if (epoch !== this.epoch) return;
            const fork = { ...current, draftId: crypto.randomUUID(), revision: 0 };
            this.active.set(scope(draft.ownerId, draft.kind, draft.entityKey), fork);
            this.states.set(fork.draftId, "pending");
            this.emit();
            this.schedule(fork.draftId);
            return;
          }
          this.persisted.set(id, revision);
          const latest = this.get(draft.ownerId, draft.kind, draft.entityKey);
          if (!latest || latest.draftId !== id) return;
          if (latest.revision === revision) {
            this.states.set(id, "stored");
            this.emit();
            return;
          }
        } catch {
          if (epoch === this.epoch) {
            this.states.set(id, "error");
            this.emit();
          }
          return;
        }
      }
    };
    const promise = run().finally(() => {
      if (this.queues.get(id) === promise) this.queues.delete(id);
      if (
        epoch === this.epoch &&
        !this.invalidated.has(id) &&
        this.states.get(id) === "pending" &&
        [...this.active.values()].some((d) => d.draftId === id)
      )
        this.schedule(id);
    });
    this.queues.set(id, promise);
  }
  async flush(id?: string) {
    // A conflict may fork into a new queue while the previous write finishes.
    if (id) {
      while (this.queues.has(id)) await this.queues.get(id);
    } else {
      while (this.queues.size) await Promise.all([...this.queues.values()]);
    }
  }
  async submit<K extends DraftKind>(
    owner: string,
    input: DraftInput<K>,
    operationId: string = crypto.randomUUID(),
  ): Promise<DraftSubmission<K>> {
    let draft = this.get(owner, input.kind, input.entityKey) ?? this.update(owner, input);
    if (draft.submission) return draft.submission;
    draft = withDraftSubmission({ ...draft, revision: draft.revision + 1 }, operationId);
    this.active.set(scope(owner, input.kind, input.entityKey), draft);
    this.states.set(draft.draftId, "pending");
    this.emit();
    this.schedule(draft.draftId);
    // CAS can fork the attempt into a new id; wait for that queue too.
    await this.flush();
    if (owner !== this.ownerId) throw new Error("Your account changed before this save.");
    return draft.submission!;
  }
  acknowledge<K extends DraftKind>(
    owner: string,
    kind: K,
    entity: string,
    submitted: DraftSubmission<K>,
    canonical: DraftValuesMap[K],
    version: string | null,
  ) {
    const current = this.get(owner, kind, entity);
    if (!current) return;
    const next = acknowledgeMemberDraft(current, submitted, canonical, version);
    if (!next) {
      void this.discard(owner, current.draftId);
      return;
    }
    this.active.set(scope(owner, kind, entity), next);
    this.states.set(next.draftId, "pending");
    this.emit();
    this.schedule(next.draftId);
  }
  rebase<K extends DraftKind>(
    owner: string,
    kind: K,
    entity: string,
    values: DraftValuesMap[K],
    baseline: DraftBaseline<K>,
  ) {
    const current = this.get(owner, kind, entity);
    if (!current) return;
    if (
      sameDraftValues(current.values, values) &&
      sameDraftValues(current.baseline.values, baseline.values) &&
      current.baseline.version === baseline.version
    )
      return;
    const next = { ...editMemberDraft(current, values), baseline };
    this.active.set(scope(owner, kind, entity), next);
    this.states.set(next.draftId, "pending");
    this.emit();
    this.schedule(next.draftId);
  }
  resume(owner: string, id: string) {
    if (owner !== this.ownerId) return;
    const draft = this.recovered.find((d) => d.draftId === id);
    if (!draft) return;
    const key = scope(owner, draft.kind, draft.entityKey),
      previous = this.active.get(key);
    if (previous && previous.draftId !== id) this.recovered.push(previous);
    this.active.set(key, restrictDraftWellness(structuredClone(draft), this.permission));
    this.recovered = this.recovered.filter((d) => d.draftId !== id);
    this.states.set(id, "stored");
    this.emit();
  }
  async discard(owner: string, id: string) {
    if (owner !== this.ownerId) return;
    this.invalidated.add(id);
    for (const [key, d] of this.active) if (d.draftId === id) this.active.delete(key);
    this.recovered = this.recovered.filter((d) => d.draftId !== id);
    this.states.delete(id);
    this.emit();
    try {
      await this.ready;
      await this.store?.discard(owner, id);
    } catch {
      this.error =
        "The local draft could not be removed from this device. Try clearing device drafts again.";
      this.emit();
    }
  }
  async discardEntity(owner: string, kind: DraftKind, entityKey: string) {
    if (owner !== this.ownerId) return;
    const matches = [...this.active.values(), ...this.recovered].filter(
      (d) => d.kind === kind && d.entityKey === entityKey,
    );
    await Promise.all(
      [...new Set(matches.map((d) => d.draftId))].map((id) => this.discard(owner, id)),
    );
  }
  async purgeAccountDrafts(owner = this.ownerId) {
    if (!owner) return;
    ++this.epoch;
    this.ownerId = null;
    this.active.clear();
    this.recovered = [];
    this.persisted.clear();
    this.states.clear();
    this.generation = "";
    this.emit();
    try {
      await this.ready;
      this.store ??= await this.openStore();
      await this.store.purgeOwner(owner);
    } catch {
      this.error =
        "Local drafts could not be cleared. Clear this site’s data in your browser settings.";
      this.emit();
      throw new Error(this.error);
    }
  }
  async setWellnessPermission(permission: WellnessPermission) {
    if (permission.sleep === this.permission.sleep && permission.stress === this.permission.stress)
      return;
    this.permission = permission;
    const owner = this.ownerId;
    if (!owner) return;
    for (const [key, d] of this.active) this.active.set(key, restrictDraftWellness(d, permission));
    this.recovered = this.recovered.map((d) => restrictDraftWellness(d, permission));
    this.emit();
    try {
      await this.ready;
      await this.store?.setWellnessPermission(owner, permission);
      if (owner !== this.ownerId) return;
      // Only our own successful writes may advance persisted content revisions.
      this.error = this.store?.recoveryWarning?.(owner) ?? null;
      this.emit();
    } catch {
      this.error =
        "Device draft privacy changes could not be saved. Clear device drafts before leaving.";
      this.emit();
    }
  }
}
