import { execBatch, records, type DBClient } from "./d1.server";
import { SOURCE_MAP, SOURCES, isPermitted } from "./registry";
import { decryptJson, unwrapDek } from "./crypto.server";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const DAY = 86_400_000;
export const CONTEXT_STORAGE_VERSION = "local-context-storage-1";
export function civilContextExpiry(day: string, days: number) {
  return new Date(Date.parse(day + "T00:00:00Z") + (days + 1) * DAY).toISOString();
}
/** Retain the complete cutoff civil day, matching the existing check-in policy. */
export function civilContextFresh(day: string, days: number, now: Date) {
  const start = Date.parse(day + "T00:00:00Z");
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(start) &&
    // A member in UTC+14 can already be on the next civil day.
    start <= now.getTime() + 14 * 60 * 60 * 1000 &&
    now.getTime() < start + (days + 1) * DAY
  );
}
export function recordContextFresh(createdAt: string, days: number, now: Date) {
  const instant = Date.parse(createdAt);
  return (
    Number.isFinite(instant) && instant <= now.getTime() && now.getTime() < instant + days * DAY
  );
}
export function finiteContextExpiry(sourceIds: string[], day: string, now: Date) {
  const dates = sourceIds
    .map((id) => {
      const days = SOURCE_MAP[id]?.retention_days;
      if (days === null || days === undefined) return null;
      return id === "USR-04" || id.startsWith("WEL-")
        ? civilContextExpiry(day, days)
        : new Date(now.getTime() + days * DAY).toISOString();
    })
    .filter((date): date is string => date !== null)
    .sort();
  return dates[0] ?? null;
}
export function reusableContext(sourceIds: string[], granted: Set<string>) {
  return sourceIds.every((id) => {
    const source = SOURCE_MAP[id];
    return Boolean(source && source.allowed_uses.some((use) => isPermitted(id, use, granted)));
  });
}
export function savedSourceAllowed(
  row: ContextRow,
  sourceId: string,
  granted: Set<string>,
  now: Date,
) {
  const source = SOURCE_MAP[sourceId];
  if (!source || source.retention_days === null) return true;
  if (!reusableContext([sourceId], granted)) return false;
  if (
    row.context_version === CONTEXT_STORAGE_VERSION &&
    Array.isArray(row.local_context_sources) &&
    row.local_context_sources.includes(sourceId)
  ) {
    return Boolean(
      row.local_context_ct &&
      (!row.local_context_expires_at || now.getTime() < Date.parse(row.local_context_expires_at)),
    );
  }
  return sourceId === "USR-04" || sourceId.startsWith("WEL-")
    ? civilContextFresh(row.reading_date, source.retention_days, now)
    : recordContextFresh(
        row.created_at ?? row.reading_date + "T00:00:00Z",
        source.retention_days,
        now,
      );
}
type ContextRow = {
  context_version?: string | null;
  local_context_ct?: string | null;
  local_context_sources?: unknown;
  local_context_expires_at?: string | null;
  mixed_context_expires_at?: string | null;
  retention_state?: string | null;
  reading_date: string;
  created_at?: string;
  language_meta?: unknown;
};
/** Recover a legacy clock policy from saved ciphertext, without calculating its story again. */
export async function legacyClockExpiry(row: ContextRow, dek: CryptoKey | null) {
  if (row.context_version === CONTEXT_STORAGE_VERSION) return null;
  let meta = row.language_meta;
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      return null;
    }
  }
  const ciphertext =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? (meta as Record<string, unknown>)["transit_story_ct"]
      : null;
  if (typeof ciphertext !== "string") return null;
  try {
    if (!dek) throw new Error("Key unavailable");
    const saved = await decryptJson<{
      plan?: { status?: string; evidence?: { timezone?: string } };
    }>(dek, ciphertext);
    if (saved.plan?.status === "omitted" || saved.plan?.evidence?.timezone === "UTC") return null;
    // An unreadable legacy clock is conservatively bounded by the device policy too.
  } catch {
    /* Do not retain an unknowable device-clock copy indefinitely. */
  }
  const at = Date.parse(row.created_at ?? row.reading_date + "T00:00:00Z");
  return new Date(Number.isFinite(at) ? at + 90 * DAY : 0).toISOString();
}
export function legacyContextUnavailable(
  row: ContextRow,
  sourceIds: string[],
  granted: Set<string>,
  now: Date,
) {
  if (row.retention_state === "expired") return true;
  if (
    row.mixed_context_expires_at &&
    (!granted.has("DEV-01") || Date.parse(row.mixed_context_expires_at) <= now.getTime())
  )
    return true;
  if (row.context_version === CONTEXT_STORAGE_VERSION) return false;
  return sourceIds
    .filter((id) => SOURCE_MAP[id]?.retention_days != null)
    .some((id) => {
      const days = SOURCE_MAP[id]!.retention_days!;
      const fresh =
        id === "USR-04" || id.startsWith("WEL-")
          ? civilContextFresh(row.reading_date, days, now)
          : recordContextFresh(row.created_at ?? row.reading_date + "T00:00:00Z", days, now);
      return !fresh || !reusableContext([id], granted);
    });
}
export async function savedLocalContext(
  row: ContextRow,
  dek: CryptoKey,
  granted: Set<string>,
  now: Date,
) {
  if (row.context_version !== CONTEXT_STORAGE_VERSION || !row.local_context_ct) return null;
  const ids = row.local_context_sources;
  if (
    !Array.isArray(ids) ||
    ids.some((id) => typeof id !== "string") ||
    !reusableContext(ids, granted)
  )
    return null;
  if (row.local_context_expires_at && !(now.getTime() < Date.parse(row.local_context_expires_at)))
    return null;
  try {
    const value = await decryptJson<{ body?: unknown; prompt?: unknown }>(
      dek,
      row.local_context_ct,
    );
    if (typeof value.body !== "string" || typeof value.prompt !== "string")
      throw new Error("Invalid context");
    return { body: value.body, prompt: value.prompt };
  } catch {
    throw new Error("Saved local context could not be loaded. Please retry.");
  }
}

const finite = SOURCES.filter((source) => source.retention_days !== null);
const ids = finite.map((source) => source.id);
const quoted = ids.map((id) => "'" + id + "'").join(",");
const legacyDue = finite
  .map((source) => {
    const date =
      source.id === "USR-04" || source.id.startsWith("WEL-")
        ? `julianday(d.reading_date)+${source.retention_days! + 1}`
        : `julianday(d.created_at)+${source.retention_days}`;
    return `(s.source_id='${source.id}' AND (${date}<=julianday(?) OR ${date} IS NULL))`;
  })
  .join(" OR ");
const mixedDue = `((d.mixed_context_expires_at IS NOT NULL AND julianday(d.mixed_context_expires_at)<=julianday(?)) OR
  (d.context_version IS NULL AND EXISTS(SELECT 1 FROM reading_sources s WHERE s.reading_id=d.id AND s.user_id=d.user_id AND (${legacyDue}))))`;

export async function purgeExpiredContext(
  { now, cursor, limit }: { now: Date; cursor: string | null; limit: number },
  db: DBClient = records(),
) {
  if (
    !Number.isFinite(now.getTime()) ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    (cursor !== null && (typeof cursor !== "string" || cursor.length > 200))
  )
    throw new Error("Invalid retention batch.");
  const owners = await db.exec<{ id: string }>(
    "SELECT id FROM users WHERE id>? ORDER BY id LIMIT ?",
    [cursor ?? "", limit + 1],
  );
  const counts: Record<string, number> = { owners: Math.min(owners.length, limit) };
  const fixed = now.toISOString();
  if (owners.length) {
    // One atomic set-based page; json_each keeps each statement below D1's parameter limit.
    const userId = JSON.stringify(owners.slice(0, limit).map((owner) => owner.id));
    const legacyMarkers: { sql: string; params: (string | number | null)[] }[] = [];
    const profiles = await db.exec<{ id: string; wrapped_dek: string | null }>(
      "SELECT id,wrapped_dek FROM profiles WHERE id IN (SELECT value FROM json_each(?))",
      [userId],
    );
    const keys = new Map<string, CryptoKey | null>();
    for (const profile of profiles)
      keys.set(
        profile.id,
        profile.wrapped_dek ? await unwrapDek(profile.wrapped_dek).catch(() => null) : null,
      );
    let legacyCursor = "";
    for (;;) {
      const { data, error } = await db
        .from<ContextRow & { id: string; user_id: string }>("daily_readings")
        .select(
          "id,user_id,reading_date,created_at,context_version,language_meta,mixed_context_expires_at",
        )
        .raw("user_id IN (SELECT value FROM json_each(?))", [userId])
        .eq("context_version", null)
        .raw("id>?", [legacyCursor])
        .order("id", { ascending: true })
        .limit(25);
      if (error) throw new Error("Legacy retention metadata could not be read.");
      for (const row of data ?? []) {
        const expiry = await legacyClockExpiry(row, keys.get(row.user_id) ?? null);
        if (expiry)
          legacyMarkers.push({
            sql: "UPDATE daily_readings SET mixed_context_expires_at=? WHERE id=? AND user_id=? AND context_version IS NULL AND (mixed_context_expires_at IS NULL OR julianday(mixed_context_expires_at)>julianday(?))",
            params: [expiry, row.id, row.user_id, expiry],
          });
      }
      if (!data?.length || data.length < 25) break;
      legacyCursor = data.at(-1)!.id;
    }
    const expiredLocal =
      "user_id=? AND local_context_ct IS NOT NULL AND local_context_expires_at IS NOT NULL AND julianday(local_context_expires_at)<=julianday(?)";
    const mixedParams = [userId, fixed, ...finite.map(() => fixed)];
    const signalAge = finite
      .map(
        (source) =>
          `(source_id='${source.id}' AND (julianday(captured_at)+${source.retention_days}<=julianday(?) OR julianday(captured_at) IS NULL))`,
      )
      .join(" OR ");
    const changes = [
      {
        name: "wellness",
        sql: "UPDATE check_ins SET sleep=NULL,stress=NULL WHERE user_id=? AND (julianday(day)+181<=julianday(?) OR julianday(day) IS NULL) AND (sleep IS NOT NULL OR stress IS NOT NULL)",
        params: [userId, fixed],
      },
      {
        name: "check_in",
        sql: "UPDATE check_ins SET mood=NULL,energy=NULL,note_ct=NULL WHERE user_id=? AND (julianday(day)+731<=julianday(?) OR julianday(day) IS NULL) AND (mood IS NOT NULL OR energy IS NOT NULL OR note_ct IS NOT NULL)",
        params: [userId, fixed],
      },
      {
        name: "journal",
        sql: "DELETE FROM life_events WHERE user_id=? AND (julianday(created_at)+1825<=julianday(?) OR julianday(created_at) IS NULL)",
        params: [userId, fixed],
      },
      {
        name: "feedback",
        sql: "DELETE FROM reading_feedback WHERE user_id=? AND (julianday(created_at)+730<=julianday(?) OR julianday(created_at) IS NULL)",
        params: [userId, fixed],
      },
      {
        name: "signals",
        sql: `DELETE FROM context_signals WHERE user_id=? AND (julianday(expires_at)<=julianday(?) OR julianday(expires_at) IS NULL OR source_id NOT IN (${SOURCES.map((s) => "'" + s.id + "'").join(",")}) OR ${signalAge})`,
        params: [userId, fixed, ...finite.map(() => fixed)],
      },
      {
        name: "context_sources",
        sql: `DELETE FROM reading_sources WHERE user_id=? AND source_id IN (${quoted}) AND reading_id IN (SELECT id FROM daily_readings WHERE ${expiredLocal})`,
        params: [userId, userId, fixed],
      },
      {
        name: "source_counts",
        sql: `UPDATE daily_readings SET language_meta=json_set(CASE WHEN json_valid(language_meta) THEN language_meta ELSE '{}' END,'$.sourceCount',(SELECT COUNT(*) FROM reading_sources s WHERE s.reading_id=daily_readings.id AND s.user_id=daily_readings.user_id)) WHERE ${expiredLocal}`,
        params: [userId, fixed],
      },
      {
        name: "local_copies",
        sql: `UPDATE daily_readings SET local_context_ct=NULL,local_context_sources='[]',local_context_expires_at=NULL WHERE ${expiredLocal}`,
        params: [userId, fixed],
      },
      {
        name: "legacy_sources",
        sql: `DELETE FROM reading_sources WHERE user_id=? AND reading_id IN (SELECT d.id FROM daily_readings d WHERE d.user_id=? AND ${mixedDue} AND COALESCE(d.retention_state,'available')<>'expired')`,
        params: [userId, ...mixedParams],
      },
      {
        name: "mixed_bodies",
        sql: `UPDATE daily_readings AS d SET body_ct='',headline='Saved reading unavailable',prompt=NULL,language_meta='{}',language_model=NULL,local_context_ct=NULL,local_context_sources='[]',local_context_expires_at=NULL,retention_state='expired' WHERE d.user_id=? AND ${mixedDue} AND COALESCE(d.retention_state,'available')<>'expired'`,
        params: mixedParams,
      },
    ];
    // Capture the due IDs before deleting their sources, using a transaction-local table-free marker.
    const marker = {
      sql: `UPDATE daily_readings AS d SET mixed_context_expires_at=? WHERE d.user_id=? AND ${mixedDue} AND COALESCE(d.retention_state,'available')<>'expired'`,
      params: [fixed, ...mixedParams],
    };
    const statements = [marker, ...changes.map(({ sql, params }) => ({ sql, params }))].map(
      (statement) => ({
        ...statement,
        sql: statement.sql.replace(
          /\b(d\.)?user_id=\?/g,
          (_, prefix) => (prefix ?? "") + "user_id IN (SELECT value FROM json_each(?))",
        ),
      }),
    );
    const batch = await execBatch([...legacyMarkers, ...statements]);
    counts["legacy_clocks"] = batch
      .slice(0, legacyMarkers.length)
      .reduce((n, result) => n + Number(result.meta?.["changes"] ?? 0), 0);
    changes.forEach((change, index) => {
      counts[change.name] =
        (counts[change.name] ?? 0) +
        Number(batch[legacyMarkers.length + index + 1]?.meta?.["changes"] ?? 0);
    });
  }
  return { nextCursor: owners.length > limit ? owners[limit - 1]!.id : null, counts };
}

const stepInput = z
  .object({
    now: z.string().datetime(),
    cursor: z.string().max(200).nullable(),
    limit: z.number().int().min(1).max(100),
  })
  .strict();
export async function handleRetentionStep(request: Request, db: DBClient = records()) {
  const secret = process.env["PATTERN_WORKFLOW_SECRET"];
  if (!secret) return new Response("Not configured", { status: 503 });
  const timestamp = request.headers.get("x-pattern-timestamp") ?? "";
  const signature = request.headers.get("x-pattern-signature") ?? "";
  if (!/^\d{10}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp) * 1000) > 300_000)
    return new Response("Invalid signature", { status: 401 });
  if (Number(request.headers.get("content-length")) > 4096)
    return new Response("Request too large", { status: 413 });
  const raw = await request.text();
  if (raw.length > 4096) return new Response("Request too large", { status: 413 });
  const expected = createHmac("sha256", secret)
    .update(timestamp + "\n" + raw)
    .digest("hex");
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return new Response("Invalid signature", { status: 401 });
  let input: z.infer<typeof stepInput>;
  try {
    input = stepInput.parse(JSON.parse(raw));
    if (Date.parse(input.now) > Date.now() + 300_000) throw new Error("Future cutoff");
  } catch {
    return new Response("Invalid retention batch", { status: 400 });
  }
  try {
    return Response.json(await purgeExpiredContext({ ...input, now: new Date(input.now) }, db));
  } catch {
    return Response.json({ error: "Retention batch failed" }, { status: 503 });
  }
}
