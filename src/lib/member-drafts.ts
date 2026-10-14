import { z } from "zod";

export const DRAFT_LIFETIME_MS = 7 * 86400000;
const band = z.number().int().min(1).max(5).nullable();
const checkIn = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1).max(120),
  mood: band,
  energy: band,
  sleep: band,
  stress: band,
  note: z.string().max(2000),
});
const journalNew = z.object({
  occurredOn: z.string().max(10),
  domain: z.string().max(40),
  label: z.string().max(400),
  body: z.string().max(4000),
  cycleKey: z.string().max(120),
  featureKey: z.string().max(120),
});
const journalEdit = z.object({
  entryId: z.string().min(1).max(120),
  label: z.string().max(400),
  body: z.string().max(4000),
  expectedRevision: z.number().int().nonnegative(),
});
export type DraftValuesMap = {
  "check-in": z.infer<typeof checkIn>;
  "journal-new": z.infer<typeof journalNew>;
  "journal-edit": z.infer<typeof journalEdit>;
};
export type DraftKind = keyof DraftValuesMap;
export type DraftBaseline<K extends DraftKind> = {
  values: DraftValuesMap[K];
  version: string | null;
};
export type DraftSubmission<K extends DraftKind> = {
  operationId: string;
  revision: number;
  values: DraftValuesMap[K];
  baseline: DraftBaseline<K>;
};
export interface MemberDraft<K extends DraftKind = DraftKind> {
  schemaVersion: 1;
  ownerId: string;
  draftId: string;
  kind: K;
  entityKey: string;
  generation: string;
  revision: number;
  updatedAt: number;
  expiresAt: number;
  values: DraftValuesMap[K];
  baseline: DraftBaseline<K>;
  submission: DraftSubmission<K> | null;
}
export type WellnessPermission = { sleep: boolean; stress: boolean };
export interface DraftStore {
  recoveryWarning?(ownerId: string): string | null;
  activateOwner(ownerId: string): Promise<string>;
  list(ownerId: string): Promise<MemberDraft[]>;
  put(
    draft: MemberDraft,
    expectedRevision: number | null,
  ): Promise<{ status: "stored" | "conflict" | "invalidated" }>;
  discard(ownerId: string, draftId: string): Promise<void>;
  purgeOwner(ownerId: string): Promise<void>;
  setWellnessPermission(ownerId: string, permission: WellnessPermission): Promise<void>;
  close(): void;
}
const envelope = z.object({
  schemaVersion: z.literal(1),
  ownerId: z.string().min(1),
  draftId: z.string().min(1),
  kind: z.enum(["check-in", "journal-new", "journal-edit"]),
  entityKey: z.string().min(1),
  generation: z.string().min(1),
  revision: z.number().int().nonnegative(),
  updatedAt: z.number().finite(),
  expiresAt: z.number().finite(),
});
const schemas = { "check-in": checkIn, "journal-new": journalNew, "journal-edit": journalEdit };
export function parseMemberDraft(value: unknown): MemberDraft | null {
  const meta = envelope.safeParse(value);
  if (!meta.success || typeof value !== "object" || !value) return null;
  const candidate = value as MemberDraft;
  const schema = schemas[meta.data.kind];
  const values = schema.safeParse(candidate.values);
  const baseline = z
    .object({ values: schema, version: z.string().nullable() })
    .safeParse(candidate.baseline);
  const submission = z
    .object({
      operationId: z.string().min(1),
      revision: z.number().int().nonnegative(),
      values: schema,
      baseline: z.object({ values: schema, version: z.string().nullable() }),
    })
    .nullable()
    .safeParse(candidate.submission);
  if (!values.success || !baseline.success || !submission.success) return null;
  if (
    meta.data.kind === "check-in" &&
    (values.data as DraftValuesMap["check-in"]).day !== meta.data.entityKey
  )
    return null;
  if (
    meta.data.kind === "journal-edit" &&
    (values.data as DraftValuesMap["journal-edit"]).entryId !== meta.data.entityKey
  )
    return null;
  return {
    ...meta.data,
    values: values.data,
    baseline: baseline.data,
    submission: submission.data,
  } as MemberDraft;
}
export function createMemberDraft<K extends DraftKind>(input: {
  ownerId: string;
  generation: string;
  kind: K;
  entityKey: string;
  values: DraftValuesMap[K];
  baseline: DraftBaseline<K>;
  now?: number;
}): MemberDraft<K> {
  const now = input.now ?? Date.now();
  return {
    schemaVersion: 1,
    ownerId: input.ownerId,
    generation: input.generation,
    kind: input.kind,
    entityKey: input.entityKey,
    draftId: crypto.randomUUID(),
    revision: 0,
    updatedAt: now,
    expiresAt: now + DRAFT_LIFETIME_MS,
    values: structuredClone(input.values),
    baseline: structuredClone(input.baseline),
    submission: null,
  };
}
export function editMemberDraft<K extends DraftKind>(
  draft: MemberDraft<K>,
  values: DraftValuesMap[K],
  now = Date.now(),
): MemberDraft<K> {
  return {
    ...draft,
    values: structuredClone(values),
    revision: draft.revision + 1,
    updatedAt: now,
    expiresAt: now + DRAFT_LIFETIME_MS,
  };
}
export function withDraftSubmission<K extends DraftKind>(
  draft: MemberDraft<K>,
  operationId: string,
): MemberDraft<K> {
  return {
    ...draft,
    submission: {
      operationId,
      revision: draft.revision,
      values: structuredClone(draft.values),
      baseline: structuredClone(draft.baseline),
    },
  };
}
export function isDraftExpired(draft: Pick<MemberDraft, "expiresAt">, now = Date.now()) {
  return draft.expiresAt <= now;
}
export function sameDraftValues(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  return (
    Object.keys(left).length === Object.keys(right).length &&
    Object.keys(left).every((key) => left[key] === right[key])
  );
}
export function acknowledgeMemberDraft<K extends DraftKind>(
  draft: MemberDraft<K>,
  submitted: DraftSubmission<K>,
  canonical: DraftValuesMap[K],
  version: string | null,
): MemberDraft<K> | null {
  const normalized = (value: DraftValuesMap[K]) =>
    Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        ["label", "body", "note"].includes(key) && typeof item === "string" ? item.trim() : item,
      ]),
    );
  const coversSubmission = sameDraftValues(normalized(submitted.values), normalized(canonical));
  if (coversSubmission && sameDraftValues(normalized(draft.values), normalized(submitted.values)))
    return null;
  return {
    ...draft,
    revision: draft.revision + 1,
    baseline: { values: structuredClone(canonical), version },
    submission: null,
  };
}
export function restrictDraftWellness<K extends DraftKind>(
  draft: MemberDraft<K>,
  permission: WellnessPermission,
): MemberDraft<K> {
  if (draft.kind !== "check-in") return draft;
  const restrict = (value: DraftValuesMap[K]) => ({
    ...value,
    sleep: permission.sleep ? (value as DraftValuesMap["check-in"]).sleep : null,
    stress: permission.stress ? (value as DraftValuesMap["check-in"]).stress : null,
  });
  return {
    ...draft,
    values: restrict(draft.values),
    baseline: { ...draft.baseline, values: restrict(draft.baseline.values) },
    submission: draft.submission
      ? {
          ...draft.submission,
          values: restrict(draft.submission.values),
          baseline: {
            ...draft.submission.baseline,
            values: restrict(draft.submission.baseline.values),
          },
        }
      : null,
  };
}
export function draftText(draft: MemberDraft): string {
  if (draft.kind === "check-in") {
    const v = draft.values as DraftValuesMap["check-in"];
    return `${v.day}\nMood: ${v.mood ?? "—"}\nEnergy: ${v.energy ?? "—"}\nSleep: ${v.sleep ?? "—"}\nStress: ${v.stress ?? "—"}\n${v.note}`;
  }
  const v = draft.values as DraftValuesMap["journal-new"];
  return `${v.label}\n${v.body}`;
}
