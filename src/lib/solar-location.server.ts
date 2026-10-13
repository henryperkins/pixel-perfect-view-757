import { z } from "zod";
import type { DBClient } from "./d1.server";
import { execBatch } from "./d1.server";
import { encryptJson, decryptJson, keyedFingerprint } from "./crypto.server";
import { contextUseAllowed } from "./context-policy";
import { localDayString } from "./local-day";
import { getSolarContext, type SolarContext } from "./astro/solar-context.server";
import { transitEpisodePolicy } from "./astro/transit-episodes.server";
const DAY = 86400000;
export const coarseLocationSchema = z
  .object({
    latitude: z.number().int().min(-90).max(90),
    longitude: z.number().int().min(-180).max(180),
    timeZone: z
      .string()
      .min(1)
      .max(80)
      .refine((zone) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: zone });
          return true;
        } catch {
          return false;
        }
      }),
  })
  .strict();
type Location = z.infer<typeof coarseLocationSchema> & { gridDegrees: 1 };
interface Signal {
  id: string;
  value: { version: string; payload_ct: string };
  captured_at: string;
  expires_at: string;
}
async function state(db: DBClient, userId: string, now: Date) {
  const { getDek, grantedSet } = await import("./pattern.server");
  const granted = await grantedSet(db, userId);
  const [consent] = await db.exec<{ id: string }>(
    "SELECT id FROM source_consents WHERE user_id=? AND source_id='DEV-02' AND granted=1",
    [userId],
  );
  if (!consent) return null;
  const { data, error } = await db
    .from<Signal>("context_signals")
    .select("id,value,captured_at,expires_at")
    .eq("user_id", userId)
    .eq("source_id", "DEV-02")
    .maybeSingle();
  if (error) throw Error("Your current location could not be loaded.");
  if (
    !data ||
    data.value?.version !== "coarse-location-1" ||
    !contextUseAllowed("DEV-02", "calculation", granted, data.captured_at, now) ||
    !(Date.parse(data.expires_at) > now.getTime())
  )
    return null;
  const dek = await getDek(db, userId);
  let location: Location;
  try {
    const raw = await decryptJson<Location>(dek, data.value.payload_ct);
    if (raw.gridDegrees !== 1) throw Error("precision");
    const { gridDegrees, ...input } = raw;
    location = { ...coarseLocationSchema.parse(input), gridDegrees };
  } catch {
    return null;
  }
  const valid = await db.exec<{ ok: number }>(
    "SELECT 1 AS ok WHERE EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='DEV-02' AND granted=1 AND id=?) AND EXISTS(SELECT 1 FROM context_signals WHERE user_id=? AND id=? AND value=? AND julianday(expires_at)>julianday(?))",
    [userId, consent.id, userId, data.id, JSON.stringify(data.value), new Date().toISOString()],
  );
  return valid.length === 1 ? { signal: data, location, dek, granted, grantId: consent.id } : null;
}
export async function loadCoarseLocation(db: DBClient, userId: string): Promise<Location | null> {
  return (await state(db, userId, new Date()))?.location ?? null;
}
export async function saveCoarseLocation(db: DBClient, userId: string, input: unknown) {
  const parsed = coarseLocationSchema.safeParse(input);
  if (!parsed.success)
    throw Error("Choose a valid coarse location using whole degrees and its timezone.");
  const { getDek, grantedSet } = await import("./pattern.server");
  const now = new Date(),
    granted = await grantedSet(db, userId);
  if (!contextUseAllowed("DEV-02", "calculation", granted, now, now))
    throw Error("Turn on Coarse current location permission first.");
  const [consent] = await db.exec<{ id: string }>(
    "SELECT id FROM source_consents WHERE user_id=? AND source_id='DEV-02' AND granted=1",
    [userId],
  );
  if (!consent) throw Error("Current location permission changed. Please refresh.");
  const value = JSON.stringify({
    version: "coarse-location-1",
    payload_ct: await encryptJson(await getDek(db, userId), { ...parsed.data, gridDegrees: 1 }),
  });
  const rows = await execBatch([
    {
      sql: "DELETE FROM context_signals WHERE user_id=? AND source_id IN ('DEV-02','AMB-05') AND EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='DEV-02' AND granted=1 AND id=?)",
      params: [userId, userId, consent.id],
    },
    {
      sql: "INSERT INTO context_signals(id,user_id,source_id,value,confidence,captured_at,expires_at) SELECT ?,?,'DEV-02',?,1,?,? WHERE EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='DEV-02' AND granted=1 AND id=?) RETURNING id",
      params: [
        crypto.randomUUID(),
        userId,
        value,
        now.toISOString(),
        new Date(now.getTime() + 30 * DAY).toISOString(),
        userId,
        consent.id,
      ],
    },
    {
      sql: "UPDATE source_consents SET id=? WHERE user_id=? AND source_id='DEV-02' AND granted=1 AND id=?",
      params: [crypto.randomUUID(), userId, consent.id],
    },
  ]);
  if (rows[1]?.results.length !== 1)
    throw Error("Current location permission changed. Please refresh.");
  return {
    saved: true as const,
    gridDegrees: 1 as const,
    expiresAt: new Date(now.getTime() + 30 * DAY).toISOString(),
  };
}
export async function clearCoarseLocation(db: DBClient, userId: string) {
  await execBatch([
    {
      sql: "DELETE FROM context_signals WHERE user_id=? AND source_id IN ('DEV-02','AMB-05')",
      params: [userId],
    },
    {
      sql: "UPDATE source_consents SET id=? WHERE user_id=? AND source_id='DEV-02'",
      params: [crypto.randomUUID(), userId],
    },
  ]);
  return { cleared: true as const };
}
/** Fresh overlay after the immutable reading: never part of eligibility, prose, or reading history. */
export async function solarForToday(db: DBClient, userId: string): Promise<SolarContext | null> {
  const now = new Date(),
    current = await state(db, userId, now);
  if (!current) return null;
  if (!contextUseAllowed("AMB-05", "framing", current.granted, now, now)) return null;
  const consents = await db.exec<{ source_id: string; id: string }>(
    "SELECT source_id,id FROM source_consents WHERE user_id=? AND source_id IN ('DEV-02','AMB-05') AND granted=1",
    [userId],
  );
  if (consents.length !== 2) return null;
  const stamp = (id: string) => consents.find((c) => c.source_id === id)!.id;
  if (stamp("DEV-02") !== current.grantId) return null;
  const day = localDayString(now, current.location.timeZone),
    policy = transitEpisodePolicy();
  const key = await keyedFingerprint(userId, {
    version: "current-solar-1",
    location: current.signal.value,
    day,
    policy,
  });
  const { data, error } = await db
    .from<Signal>("context_signals")
    .select("id,value,captured_at,expires_at")
    .eq("user_id", userId)
    .eq("source_id", "AMB-05")
    .maybeSingle();
  if (error) throw Error("Daylight context could not be loaded.");
  let solar: SolarContext | undefined;
  if (
    data?.value?.version === "current-solar-1" &&
    Date.parse(data.expires_at) > now.getTime() &&
    contextUseAllowed("AMB-05", "framing", current.granted, data.captured_at, now)
  ) {
    try {
      const saved = await decryptJson<{ key: string; solar: SolarContext }>(
        current.dek,
        data.value.payload_ct,
      );
      if (saved.key === key) solar = saved.solar;
    } catch {
      /* Recalculate a corrupt optional local cache. */
    }
  }
  solar ??= await getSolarContext({ day, ...current.location });
  const valid =
    "EXISTS(SELECT 1 FROM context_signals WHERE user_id=? AND source_id='DEV-02' AND value=? AND julianday(expires_at)>julianday(?)) AND EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='DEV-02' AND granted=1 AND id=?) AND EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='AMB-05' AND granted=1 AND id=?)";
  const guard = [
    userId,
    JSON.stringify(current.signal.value),
    new Date().toISOString(),
    userId,
    stamp("DEV-02"),
    userId,
    stamp("AMB-05"),
  ];
  if (solar.daylight !== "unavailable") {
    const value = JSON.stringify({
      version: "current-solar-1",
      payload_ct: await encryptJson(current.dek, { key, solar }),
    });
    await execBatch([
      {
        sql:
          "INSERT INTO context_signals(id,user_id,source_id,value,confidence,captured_at,expires_at) SELECT ?,?,'AMB-05',?,0.5,?,? WHERE " +
          valid +
          " ON CONFLICT(id) DO UPDATE SET value=excluded.value,captured_at=excluded.captured_at,expires_at=excluded.expires_at",
        params: [
          "current-solar:" + userId,
          userId,
          value,
          now.toISOString(),
          current.signal.expires_at,
          ...guard,
        ],
      },
    ]);
  }
  const ready = await db.exec<{ ok: number }>("SELECT 1 AS ok WHERE " + valid, guard);
  return ready.length === 1 ? solar : null;
}
