import { execBatch, records, type DBClient } from "./d1.server";
import { requireCurrentPassword } from "./auth.server";
import { decryptField, decryptJson, unwrapDek } from "./crypto.server";
import { clearTimingCalculations } from "./astro/transit-timing-cache.server";
import {
  readingLanguage,
  savedReadingParagraphs,
  loadTransitAnchors,
  grantedSet,
  type JsonValue,
} from "./pattern.server";
import {
  civilContextFresh,
  legacyContextUnavailable,
  savedLocalContext,
  savedSourceAllowed,
  legacyClockExpiry,
} from "./retention.server";
import { SOURCE_MAP } from "./registry";

const OWNER_TABLES = [
  "source_consents",
  "birth_profiles",
  "chart_snapshots",
  "natal_features",
  "cycle_instances",
  "context_signals",
  "daily_readings",
  "reading_sources",
  "reading_feedback",
  "check_ins",
  "life_events",
  "audit_events",
  "feature_narratives",
  "content_drafts",
  "evaluation_runs",
  "identity_links",
  "assistant_grants",
  "user_roles",
] as const;
type OwnerTable = (typeof OWNER_TABLES)[number];
type Row = Record<string, JsonValue>;

async function requireOwner(db: DBClient, userId: string) {
  const { data, error } = await db
    .from<{ id: string }>("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("Your account is unavailable. Sign in again.");
}

export async function resetPersonalization(userId: string, db: DBClient = records()) {
  await requireOwner(db, userId);
  try {
    await execBatch([
      { sql: "DELETE FROM source_consents WHERE user_id=? AND tier<>0", params: [userId] },
      { sql: "DELETE FROM context_signals WHERE user_id=?", params: [userId] },
      { sql: "DELETE FROM feature_narratives WHERE user_id=?", params: [userId] },
      {
        sql: "UPDATE profiles SET tone_pref='plain',depth_pref='standard',domain_pref=NULL,updated_at=? WHERE id=?",
        params: [new Date().toISOString(), userId],
      },
    ]);
  } catch {
    throw new Error("Personalization could not be reset. Please retry.");
  }
  clearTimingCalculations(userId);
  return { ok: true as const };
}

/** Local assistant access is revoked in the same transaction, before owner removal. */
export async function deleteAccount(userId: string, password: string, db: DBClient = records()) {
  const hash = await requireCurrentPassword(userId, password, db);
  try {
    const results = await execBatch([
      {
        sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM users WHERE id=? AND password_hash=?) THEN 1 ELSE json('account-changed') END",
        params: [userId, hash],
      },
      { sql: "DELETE FROM identity_links WHERE user_id=?", params: [userId] },
      {
        sql: "DELETE FROM users WHERE id=? AND password_hash=? RETURNING id",
        params: [userId, hash],
      },
    ]);
    if (results[2]!.results.length !== 1) throw new Error("Account changed");
  } catch {
    throw new Error("Your account could not be deleted. Please retry.");
  }
  clearTimingCalculations(userId);
  return { ok: true as const };
}

/** Keyset pagination; UI list limits never constrain an account export. */
async function allOwned(db: DBClient, table: string, userId: string) {
  const result: Row[] = [];
  let cursor = "";
  for (;;) {
    const query = db.from<Row>(table).select("*").eq("user_id", userId).raw("id>?", [cursor]);
    const now = new Date().toISOString();
    if (table === "life_events") query.raw("julianday(created_at)+1825>julianday(?)", [now]);
    if (table === "reading_feedback") query.raw("julianday(created_at)+730>julianday(?)", [now]);
    if (table === "check_ins") query.raw("julianday(day)+731>julianday(?)", [now]);
    if (table === "context_signals") query.raw("julianday(expires_at)>julianday(?)", [now]);
    const { data, error } = await query.order("id", { ascending: true }).limit(250);
    if (error) throw new Error("Saved account data could not be exported. Please retry.");
    result.push(...(data ?? []));
    if (!data?.length || data.length < 250) return result;
    cursor = String(data.at(-1)!["id"]);
  }
}

export async function exportAccountData(userId: string, db: DBClient = records()) {
  await requireOwner(db, userId);
  const { data: account, error: accountError } = await db
    .from<Row>("users")
    .select("id,email,created_at,last_seen_at")
    .eq("id", userId)
    .single();
  const { data: profile, error: profileError } = await db
    .from<Row>("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (accountError || profileError)
    throw new Error("Account details could not be exported. Please retry.");
  const dek =
    typeof profile?.["wrapped_dek"] === "string" ? await unwrapDek(profile["wrapped_dek"]) : null;
  const profileSafe = profile
    ? Object.fromEntries(Object.entries(profile).filter(([key]) => key !== "wrapped_dek"))
    : null;
  const granted = await grantedSet(db, userId),
    now = new Date();
  const consentEpochs = await db.exec<{ source_id: string; id: string }>(
    "SELECT source_id,id FROM source_consents WHERE user_id=? ORDER BY source_id",
    [userId],
  );
  const saved = {} as Record<OwnerTable, Row[]>;
  const counts: Record<string, number> = { users: 1, profiles: profile ? 1 : 0 };
  for (const table of OWNER_TABLES) {
    saved[table] = await allOwned(db, table, userId);
    counts[table] = saved[table].length;
  }
  const sessions = (await allOwned(db, "sessions", userId)).map((row) => ({
    created_at: row["created_at"] ?? null,
    expires_at: row["expires_at"] ?? null,
  }));
  counts["sessions"] = sessions?.length ?? 0;
  const evaluationResults: Row[] = [];
  let cursor = "";
  for (;;) {
    const page = await db.exec<Row>(
      "SELECT r.* FROM evaluation_results r JOIN evaluation_runs e ON e.id=r.run_id WHERE e.user_id=? AND r.id>? ORDER BY r.id LIMIT 250",
      [userId, cursor],
    );
    evaluationResults.push(...page);
    if (page.length < 250) break;
    cursor = String(page.at(-1)!["id"]);
  }
  counts["evaluation_results"] = evaluationResults.length;

  // Decrypt only saved fields, never create a missing key, chart or reading.
  async function decode(value: JsonValue): Promise<JsonValue> {
    if (Array.isArray(value)) return Promise.all(value.map(decode));
    if (!value || typeof value !== "object") return value;
    const out: Row = {},
      unreadable: string[] = [];
    for (const [key, entry] of Object.entries(value)) {
      if (key.endsWith("_ct")) {
        const name = key.slice(0, -3);
        if (entry === null) {
          out[name] = null;
          continue;
        }
        try {
          if (!dek || typeof entry !== "string") throw new Error("Unreadable encryption envelope");
          const text = await decryptField(dek, entry);
          if (["body", "label", "note"].includes(name)) out[name] = text;
          else {
            try {
              out[name] = JSON.parse(text) as JsonValue;
            } catch {
              out[name] = text;
            }
          }
        } catch {
          out[name] = null;
          unreadable.push(name);
        }
      } else out[key] = await decode(entry);
    }
    return { ...out, ...(unreadable.length ? { unreadable } : {}) };
  }
  const readings = await Promise.all(
    saved.daily_readings.map(async (row) => {
      const sources = saved.reading_sources.filter((source) => source["reading_id"] === row["id"]);
      const contextRow = row as unknown as Parameters<typeof legacyContextUnavailable>[0];
      const clockExpiry =
        contextRow.mixed_context_expires_at ?? (await legacyClockExpiry(contextRow, dek));
      if (
        legacyContextUnavailable(
          { ...contextRow, mixed_context_expires_at: clockExpiry },
          sources.map((source) => String(source["source_id"])),
          granted,
          now,
        )
      ) {
        return {
          id: row["id"] ?? null,
          reading_date: row["reading_date"] ?? null,
          release_version: row["release_version"] ?? null,
          available: false,
          reason: "Saved private context expired or was revoked.",
          body: null,
          prompt: null,
          language: null,
        };
      }
      const {
        language_meta: meta,
        local_context_ct: _context,
        local_context_sources: _ids,
        local_context_expires_at: _expiry,
        ...fields
      } = row;
      const decoded = (await decode(fields)) as Row;
      const unreadable = Array.isArray(decoded["unreadable"])
        ? ([...decoded["unreadable"]] as string[])
        : [];
      let language: Awaited<ReturnType<typeof readingLanguage>> | null = null;
      let paragraphState: Awaited<ReturnType<typeof savedReadingParagraphs>> | null = null;
      if (dek) {
        try {
          language = await readingLanguage(
            { ...row, language_meta: meta } as Parameters<typeof readingLanguage>[0],
            dek,
            { granted, now },
          );
        } catch {
          unreadable.push("language");
        }
        if (typeof decoded["body"] === "string") {
          try {
            paragraphState = await savedReadingParagraphs(
              dek,
              row as unknown as Parameters<typeof savedReadingParagraphs>[1],
              decoded["body"],
            );
          } catch {
            unreadable.push("paragraphs");
          }
        }
        const local = await savedLocalContext(contextRow, dek, granted, now);
        if (language?.dailyWriting) {
          decoded["prompt"] =
            language.dailyWriting.status === "saved"
              ? language.dailyWriting.evidence.reflection.question
              : null;
        }
        if (local) {
          decoded["body"] = [decoded["body"], local.body].filter(Boolean).join("\n\n");
          if (!language?.dailyWriting) decoded["prompt"] = local.prompt;
          if (paragraphState)
            paragraphState.paragraphs.push(...(local.body ? local.body.split("\n\n") : []));
        }
      } else unreadable.push("language");
      return {
        ...decoded,
        language,
        ...paragraphState,
        ...(unreadable.length ? { unreadable } : {}),
      };
    }),
  );
  saved.reading_sources = saved.reading_sources.filter((source) => {
    const row = saved.daily_readings.find((reading) => reading["id"] === source["reading_id"]);
    return Boolean(
      row &&
      savedSourceAllowed(
        row as unknown as Parameters<typeof savedSourceAllowed>[0],
        String(source["source_id"]),
        granted,
        now,
      ),
    );
  });
  for (const row of saved.check_ins) {
    if (!civilContextFresh(String(row["day"]), 180, now)) {
      row["sleep"] = null;
      row["stress"] = null;
    }
  }
  saved.context_signals = saved.context_signals.filter((row) => {
    const source = SOURCE_MAP[String(row["source_id"])];
    return (
      source &&
      granted.has(source.id) &&
      (source.retention_days === null ||
        Date.parse(String(row["captured_at"])) + source.retention_days * 86400000 > now.getTime())
    );
  });
  counts["reading_sources"] = saved.reading_sources.length;
  counts["context_signals"] = saved.context_signals.length;
  const data = {} as Record<OwnerTable, Row[]>;
  for (const table of OWNER_TABLES)
    if (table !== "daily_readings") data[table] = (await decode(saved[table])) as Row[];
  const birthRow = data.birth_profiles[0];
  const birth = birthRow
    ? {
        ...(birthRow["payload"] as Row),
        time_accuracy: birthRow["time_accuracy"],
        timezone: birthRow["timezone"],
      }
    : null;
  const transitAnchors = await Promise.all(
    saved.chart_snapshots.map(async (snapshot) => ({
      snapshotId: snapshot["id"],
      manifest: dek
        ? await loadTransitAnchors(snapshot as Parameters<typeof loadTransitAnchors>[0], dek)
        : null,
    })),
  );
  await requireOwner(db, userId);
  const currentConsents = await grantedSet(db, userId);
  const currentConsentEpochs = await db.exec<{ source_id: string; id: string }>(
    "SELECT source_id,id FROM source_consents WHERE user_id=? ORDER BY source_id",
    [userId],
  );
  const { data: currentProfile, error: currentProfileError } = await db
    .from<Row>("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (
    currentProfileError ||
    JSON.stringify(currentConsentEpochs) !== JSON.stringify(consentEpochs) ||
    JSON.stringify([...currentConsents].sort()) !== JSON.stringify([...granted].sort()) ||
    JSON.stringify(currentProfile) !== JSON.stringify(profile)
  ) {
    throw new Error(
      "Your privacy settings changed during export. Export again to use the current settings.",
    );
  }
  return {
    schema_version: "pattern-account-export-1" as const,
    exported_at: new Date().toISOString(),
    account,
    profile: profileSafe,
    consents: data.source_consents,
    birth,
    pattern: { snapshots: data.chart_snapshots, features: data.natal_features },
    transitAnchors,
    readings,
    unreadableReadings: readings.filter((row) => "unreadable" in row).length,
    journal: {
      events: data.life_events,
      checkIns: data.check_ins,
      feedback: data.reading_feedback,
    },
    audit: data.audit_events,
    data: { ...data, sessions: sessions ?? [], evaluation_results: evaluationResults },
    counts,
    omitted: ["password hashes, session identifiers and encryption keys"],
    deletion_scope:
      "Pattern account and local assistant access. Separate Google/assistant sign-in accounts and provider backups are not deleted.",
  };
}

export type AccountExport = Awaited<ReturnType<typeof exportAccountData>>;
