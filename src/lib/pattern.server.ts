import type { DBClient } from "./d1.server";


import {
  computeChart,
  extractFeatures,
  formatPosition,
  type Chart,
  type TimeAccuracy,
} from "./astro/chart";
import { computeCycles } from "./astro/cycles";
import {
  ENGINE_ID,
  ENGINE_VERSION,
  signOf,
  toJulianDay,
} from "./astro/ephemeris";
import { resolvePositions } from "./astro/swiss.server";

import {
  createWrappedDek,
  decryptField,
  decryptJson,
  encryptField,
  encryptJson,
  fingerprint,
  keyedFingerprint,
  unwrapDek,
} from "./crypto.server";
import { DEFAULT_BUNDLE, type ContentBundle } from "./content/default-bundle";
import { assembleReading, normalizeDepth, normalizeTone, type ReadingContext } from "./reading.server";
import { assertUse, isPermitted, LAUNCH_SOURCES, PROHIBITED_SOURCES, SOURCE_MAP } from "./registry";
import { checkInInputSchema } from "./check-in";
import { daysToLocalDate, localDayString, localNoon, validTimeZone, zonedToUtc } from "./local-day";
import { summarizeReadingQuality, type QualityReading, type QualityFeedback } from "./ai/quality";

export { localDayString, zonedToUtc } from "./local-day";

export type DB = DBClient;

// Row shapes for the records plane. SQLite has no generated types, so the
// selects below name what they read.
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface ProfileRow {
  id: string;
  display_name: string | null;
  tone_pref: string | null;
  depth_pref: string | null;
  onboarded_at: string | null;
}
interface CheckInBands {
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  stress: number | null;
}
interface ExistingReadingRow {
  id: string;
  reading_date: string;
  headline: string;
  body_ct: string;
  prompt: string | null;
  confidence: string;
  primary_cycle_key: string | null;
  release_version: string | null;
  language_mode: string | null;
  language_model: string | null;
  language_meta: JsonValue;
}

interface ConsentRow {
  source_id: string;
  granted: boolean;
  tier: number;
  granted_at: string | null;
  revoked_at: string | null;
}
interface FeatureRow {
  feature_key: string;
  family: string;
  title: string;
  strength: number;
  payload: JsonValue;
}
interface LifeEventRow {
  id: string;
  occurred_on: string;
  domain: string;
  label_ct: string;
  body_ct?: string | null;
  cycle_key?: string | null;
  feature_key?: string | null;
  created_at?: string;
}

interface FeedbackRow {
  reading_id: string;
  resonance: number;
  labels: string[];
  created_at: string;
}
interface ReadingRow {
  reading_date: string;
  headline: string;
  body_ct: string;
  prompt: string | null;
  confidence: string;
  release_version: string | null;
}
interface AuditRow {
  kind: string;
  detail: JsonValue;
  created_at: string;
}
interface CycleRow {
  cycle_key: string;
  transit_body: string;
  natal_point: string;
  aspect: string;
  orb: number;
  phase: string;
  domain: string;
  importance: number;
  ingress_at: string | null;
  exact_at: string | null;
  egress_at: string | null;
  /** Derived, present on freshly computed cycles; absent on stored fallbacks. */
  days_to_exact?: number | null;
  arc_position?: number | null;
}
interface ProvenanceRow {
  lane: string;
  source_id: string;
  label: string;
  detail: JsonValue;
}
interface ReleaseRow {
  id: string;
  version: string;
  checksum: string;
  created_at: string;
  is_active: boolean;
  bundle: Record<string, unknown> | null;
}


export interface BirthDetails {
  birthDate: string; // YYYY-MM-DD, local civil
  birthTime: string; // HH:MM, local civil
  placeLabel: string;
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// timezone helpers
// ---------------------------------------------------------------------------

function timeBucket(instant: Date, timeZone: string): "morning" | "afternoon" | "evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, hour: "2-digit" })
      .format(instant)
      .replace("24", "0"),
  );
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// ---------------------------------------------------------------------------
// keys and profile
// ---------------------------------------------------------------------------

export async function getDek(db: DB, userId: string) {
  const { data, error } = await db
    .from<{ wrapped_dek: string | null }>("profiles")
    .select("wrapped_dek")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  let wrapped = data?.wrapped_dek ?? null;
  if (!wrapped) {
    // Concurrent first reads must use the same key. Never replace a key that
    // another request has already installed and used to encrypt a note.
    const [profile] = await db.exec<{ wrapped_dek: string }>(
      `insert into profiles (id, wrapped_dek) values (?, ?)
       on conflict(id) do update set
         wrapped_dek = coalesce(profiles.wrapped_dek, excluded.wrapped_dek)
       returning wrapped_dek`,
      [userId, await createWrappedDek()],
    );
    if (!profile?.wrapped_dek) throw new Error("Could not initialize the account encryption key.");
    wrapped = profile.wrapped_dek;
  }
  return unwrapDek(wrapped);
}

export async function loadProfile(db: DB, userId: string) {
  const { data } = await db
    .from<ProfileRow>("profiles")
    .select("id, display_name, tone_pref, depth_pref, onboarded_at")
    .eq("id", userId)
    .maybeSingle();
  if (data) return data;
  await db.from("profiles").upsert({ id: userId }, { onConflict: "id" });
  return {
    id: userId,
    display_name: null,
    tone_pref: "plain",
    depth_pref: "standard",
    onboarded_at: null,
  };
}

export async function loadConsents(db: DB, userId: string) {
  const { data, error } = await db
    .from<ConsentRow>("source_consents")
    .select("source_id, granted, tier, granted_at, revoked_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function grantedSet(db: DB, userId: string): Promise<Set<string>> {
  const rows = await loadConsents(db, userId);
  const set = new Set<string>();
  for (const r of rows) if (r.granted) set.add(r.source_id);
  for (const s of LAUNCH_SOURCES) if (s.tier === 0) set.add(s.id);
  return set;
}

export async function setConsent(
  db: DB,
  userId: string,
  sourceId: string,
  granted: boolean,
) {
  if (PROHIBITED_SOURCES.some((p) => p.id === sourceId)) {
    throw new Error(`Source ${sourceId} is prohibited by the registry.`);
  }
  const def = SOURCE_MAP[sourceId];
  if (!def) throw new Error(`Unknown source ${sourceId}.`);
  if (def.tier === 0) throw new Error("Tier 0 sources cannot be switched off.");

  const now = new Date().toISOString();
  const { error } = await db.from("source_consents").upsert(
    {
      user_id: userId,
      source_id: sourceId,
      tier: def.tier,
      granted,
      granted_at: granted ? now : null,
      revoked_at: granted ? null : now,
    },
    { onConflict: "user_id,source_id" },
  );
  if (error) throw new Error(error.message);

  await db.from("audit_events").insert({
    user_id: userId,
    kind: granted ? "consent.granted" : "consent.revoked",
    detail: { source_id: sourceId, tier: def.tier },
  });

  if (!granted) {
    await db.from("context_signals").delete().eq("user_id", userId).eq("source_id", sourceId);
  }
  return { source_id: sourceId, granted };
}

// ---------------------------------------------------------------------------
// birth profile + chart
// ---------------------------------------------------------------------------

export async function saveBirth(
  db: DB,
  userId: string,
  details: BirthDetails,
  accuracy: TimeAccuracy,
  timezone: string,
) {
  const dek = await getDek(db, userId);
  const effectiveTime = accuracy === "unknown" ? "12:00" : details.birthTime;
  const utc = zonedToUtc(details.birthDate, effectiveTime, timezone);
  const fp = await fingerprint([
    utc.toISOString(),
    details.latitude.toFixed(4),
    details.longitude.toFixed(4),
    accuracy,
  ]);

  const payload_ct = await encryptJson(dek, { ...details, utcISO: utc.toISOString() });

  const { data: bp, error } = await db
    .from<{ id: string }>("birth_profiles")
    .upsert(
      {
        user_id: userId,
        payload_ct,
        time_accuracy: accuracy,
        timezone,
        fingerprint: fp,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const birthInput = {
    utcISO: utc.toISOString(),
    latitude: details.latitude,
    longitude: details.longitude,
    timezone,
    accuracy,
  };
  const ephem = await resolvePositions({
    jd: toJulianDay(utc),
    utcISO: utc.toISOString(),
    latitude: details.latitude,
    longitude: details.longitude,
  });
  const chart = computeChart(birthInput, ephem);


  const { data: snap, error: snapErr } = await db
    .from<{ id: string }>("chart_snapshots")
    .upsert(
      {
        user_id: userId,
        birth_profile_id: bp.id,
        fingerprint: fp,
        engine: `${chart.engine}@${chart.engineVersion}`,
        contract_version: chart.contractVersion,
        positions: chart.points,
        houses: {
          system: chart.houseSystem,
          cusps: chart.houses,
          sources: chart.sources,
          ephemeris: {
            precision: chart.precision,
            degraded: chart.degraded,
            degradedReason: chart.degradedReason,
          },
        },

        aspects: chart.aspects,
        uncertainty: chart.uncertainty,
      },
      { onConflict: "user_id,fingerprint" },
    )
    .select("id")
    .single();
  if (snapErr) throw new Error(snapErr.message);

  await db.from("natal_features").delete().eq("snapshot_id", snap.id);
  const features = extractFeatures(chart);
  if (features.length) {
    await db.from("natal_features").insert(
      features.map((f) => ({
        user_id: userId,
        snapshot_id: snap.id,
        feature_key: f.feature_key,
        family: f.family,
        title: f.title,
        strength: f.strength,
        payload: f.payload,
      })),
    );
  }

  await db
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", userId);
  await db.from("audit_events").insert({
    user_id: userId,
    kind: "birth_profile.saved",
    detail: { fingerprint: fp, accuracy },
  });

  return { snapshotId: snap.id, fingerprint: fp };
}

interface SnapshotRow {
  id: string;
  fingerprint: string;
  engine: string;
  contract_version: string;
  positions: unknown;
  houses: unknown;
  aspects: unknown;
  uncertainty: unknown;
}

export async function loadSnapshot(db: DB, userId: string) {
  const { data: birth, error: birthError } = await db
    .from<{ fingerprint: string }>("birth_profiles")
    .select("fingerprint")
    .eq("user_id", userId)
    .maybeSingle();
  if (birthError) throw new Error(birthError.message);
  if (!birth) return null;
  const { data, error } = await db
    .from<SnapshotRow>("chart_snapshots")
    .select("id, fingerprint, engine, contract_version, positions, houses, aspects, uncertainty")
    .eq("user_id", userId)
    .eq("fingerprint", birth.fingerprint)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Calculation provenance surfaced to the reader (AST-20). */
export function ephemerisState(chart: Chart) {
  return {
    engine: `${chart.engine}@${chart.engineVersion}`,
    precision: chart.precision,
    degraded: chart.degraded,
    degradedReason: chart.degradedReason,
    transitEngine: `${ENGINE_ID}@${ENGINE_VERSION}`,
  };
}

function snapshotToChart(row: SnapshotRow): Chart {
  const houses = row.houses as {
    system: string;
    cusps: number[];
    sources?: Chart["sources"];
    ephemeris?: {
      precision?: "high" | "approximate";
      degraded?: boolean;
      degradedReason?: string | null;
    };
  };
  const [engine, engineVersion] = row.engine.split("@");
  const points = row.positions as Chart["points"];
  const precision =
    houses?.ephemeris?.precision ??
    (engine === "swiss-ephemeris" ? "high" : "approximate");
  return {
    engine: engine ?? "unknown",
    engineVersion: engineVersion ?? "0",
    contractVersion: row.contract_version,
    houseSystem: houses?.system ?? "whole-sign",
    precision,
    degraded: houses?.ephemeris?.degraded ?? precision !== "high",
    degradedReason:
      houses?.ephemeris?.degradedReason ??
      (precision === "high"
        ? null
        : "This chart was computed with the in-app approximate engine."),
    jd: 0,

    points,
    angles: {
      ascendant: points["ascendant"]?.lon ?? 0,
      midheaven: points["midheaven"]?.lon ?? 0,
    },
    houses: houses?.cusps ?? [],
    sources: houses?.sources,
    aspects: row.aspects as Chart["aspects"],
    uncertainty: row.uncertainty as Chart["uncertainty"],
  };
}

export async function activeBundle(db: DB): Promise<ContentBundle> {
  const { data } = await db
    .from<{ version: string; bundle: JsonValue }>("content_releases")
    .select("version, bundle")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return DEFAULT_BUNDLE;
  const bundle = data.bundle as unknown as ContentBundle;
  return { ...DEFAULT_BUNDLE, ...bundle, version: data.version };
}

// ---------------------------------------------------------------------------
// today's reading
// ---------------------------------------------------------------------------

/** The same shape plus the instant the row was last written. */
interface CheckInRow extends CheckInBands {
  note_ct: string | null;
  updated_at: string | null;
}

/** Days a tier 3 band may live before it is nulled out (registry WEL retention). */
export const WELLNESS_RETENTION_DAYS = 180;

function wellnessCutoff() {
  return new Date(Date.now() - WELLNESS_RETENTION_DAYS * 86400000).toISOString().slice(0, 10);
}

/** Hydrate exactly the stored check-in; database errors must not look like an empty day. */
export async function loadCheckIn(db: DB, userId: string, day: string) {
  const { data, error } = await db
    .from<CheckInRow>("check_ins")
    .select("mood, energy, sleep, stress, note_ct, updated_at")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    mood: data.mood,
    energy: data.energy,
    sleep: data.sleep,
    stress: data.stress,
    note: data.note_ct ? await decryptField(await getDek(db, userId), data.note_ct) : null,
    savedAt: data.updated_at,
  };
}

export interface ReadingLanguage {
  mode: "model" | "template";
  model: string | null;
  citations: { paragraph: number; facts: string[] }[];
  dropped: number;
  reason: string | null;
  facts: { id: string; statement: string }[];
}

/** Revives the stored language-layer metadata for a cached reading. */
function readingLanguage(row: {
  language_mode: string | null;
  language_model: string | null;
  language_meta: JsonValue;
}): ReadingLanguage {
  const meta = (row.language_meta ?? {}) as Record<string, unknown>;
  return {
    mode: row.language_mode === "model" ? "model" : "template",
    model: row.language_model ?? null,
    citations: Array.isArray(meta["citations"])
      ? (meta["citations"] as ReadingLanguage["citations"])
      : [],
    dropped: typeof meta["dropped"] === "number" ? (meta["dropped"] as number) : 0,
    reason: typeof meta["reason"] === "string" ? (meta["reason"] as string) : null,
    facts: Array.isArray(meta["facts"])
      ? meta["facts"].filter((fact): fact is ReadingLanguage["facts"][number] => {
          if (!fact || typeof fact !== "object") return false;
          const value = fact as Record<string, unknown>;
          return typeof value["id"] === "string" && typeof value["statement"] === "string";
        })
      : [],
  };
}

function cyclesForLocalDay(chart: Chart, day: string, timeZone: string) {
  return computeCycles(chart, localNoon(day, timeZone)).map((cycle) => ({
    ...cycle,
    days_to_exact: daysToLocalDate(cycle.exact_at, day, timeZone),
  }));
}



export async function getToday(db: DB, userId: string, timeZone: string) {
  const snapRow = await loadSnapshot(db, userId);
  if (!snapRow) return { needsOnboarding: true as const };

  const dek = await getDek(db, userId);
  const profile = await loadProfile(db, userId);
  const granted = await grantedSet(db, userId);
  const now = new Date();
  const tz = isPermitted("DEV-01", "timing", granted) ? validTimeZone(timeZone) : "UTC";
  const day = localDayString(now, tz);
  const bundle = await activeBundle(db);

  await purgeExpiredWellness(db, userId);

  const checkInRow = await loadCheckIn(db, userId, day);

  const sleepEnabled = granted.has("WEL-01");
  const stressEnabled = granted.has("WEL-03");
  const wellnessAllowed = sleepEnabled || stressEnabled;
  const wellnessState = {
    sleepEnabled,
    stressEnabled,
    retentionDays: WELLNESS_RETENTION_DAYS,
    sleep: sleepEnabled ? (checkInRow?.sleep ?? null) : null,
    stress: stressEnabled ? (checkInRow?.stress ?? null) : null,
    mood: checkInRow?.mood ?? null,
    energy: checkInRow?.energy ?? null,
    note: checkInRow?.note ?? null,
    savedAt: checkInRow?.savedAt ?? null,
  };

  const ctx: ReadingContext = {
    granted,
    tone: isPermitted("USR-01", "external_language", granted)
      ? normalizeTone(profile.tone_pref ?? "plain")
      : "plain",
    depth: isPermitted("USR-02", "external_language", granted)
      ? normalizeDepth(profile.depth_pref ?? "standard")
      : "standard",
    localBucket: isPermitted("AMB-02", "framing", granted) ? timeBucket(now, tz) : null,
    checkIn: isPermitted("USR-04", "framing", granted) &&
      (checkInRow?.mood != null || checkInRow?.energy != null)
      ? { mood: checkInRow?.mood ?? null, energy: checkInRow?.energy ?? null }
      : null,
    wellness: wellnessAllowed
      ? { sleep: wellnessState.sleep, stress: wellnessState.stress }
      : null,
  };
  // Never reuse pre-fix model prose. Context changes get a new immutable row,
  // while old reading IDs and their feedback remain intact. The keyed digest
  // prevents enumerating low-entropy wellbeing bands from a database dump.
  const contextKey = await keyedFingerprint(userId, {
    version: "daily-privacy-2",
    snapshot: snapRow,
    timezone: tz,
    tone: ctx.tone,
    depth: ctx.depth,
    localBucket: ctx.localBucket,
    checkIn: ctx.checkIn,
    wellness: ctx.wellness,
    grants: ["USR-01", "USR-02", "USR-04", "WEL-01", "WEL-03", "AMB-02", "DEV-01"]
      .filter((id) => granted.has(id)),
  });
  const idem = `daily-privacy-2:${snapRow.fingerprint}:${day}:${bundle.version}:${contextKey}`;

  const { data: existing, error: cacheError } = await db
    .from<ExistingReadingRow>("daily_readings")
    .select(
      "id, reading_date, headline, body_ct, prompt, confidence, primary_cycle_key, release_version, language_mode, language_model, language_meta",
    )
    .eq("user_id", userId)
    .eq("idempotency_key", idem)
    .maybeSingle();
  if (cacheError) throw new Error(cacheError.message);

  if (existing) {
    const { data: srcs, error: sourceError } = await db
      .from<ProvenanceRow>("reading_sources")
      .select("lane, source_id, label, detail")
      .eq("reading_id", existing.id);
    if (sourceError) throw new Error(sourceError.message);
    // Recompute against the same snapshot and effective local noon. An empty
    // result is a quiet day; do not resurrect cycles stored for an older chart.
    const cachedChart = snapshotToChart(snapRow);
    const liveCycles = cyclesForLocalDay(cachedChart, day, tz).slice(0, 12);

    return {
      needsOnboarding: false as const,
      day,
      timezone: tz,
      reading: {
        id: existing.id,
        headline: existing.headline,
        body: await decryptField(dek, existing.body_ct),
        prompt: existing.prompt,
        confidence: existing.confidence,
        primary_cycle_key: existing.primary_cycle_key,
        release_version: existing.release_version,
      },
      language: readingLanguage(existing),
      provenance: srcs ?? [],
      cycles: liveCycles,
      uncertainty: snapRow.uncertainty as Chart["uncertainty"],
      ephemeris: ephemerisState(snapshotToChart(snapRow)),
      wellness: wellnessState,
    };
  }


  const chart = snapshotToChart(snapRow);
  const cycles = cyclesForLocalDay(chart, day, tz);



  const assembled = assembleReading(chart, cycles, ctx, bundle);
  const topCycles = cycles.slice(0, 12);

  // Only chart facts and published editorial references cross the language
  // boundary. Consented personal context, warnings, and reflection stay local.
  const { generateReadingProse } = await import("./ai/language.server");
  const { readingFacts } = await import("./ai/facts");
  for (const source of ["AST-05", "AST-07", "AST-08", "AST-20"])
    assertUse(source, "external_language");
  const facts = readingFacts(
    {
      engine: chart.engine,
      engineVersion: chart.engineVersion,
      houseSystem: chart.houseSystem,
      precision: ephemerisState(chart).precision,
      uncertainty: chart.uncertainty,
    },
    assembled,
    tz,
  );
  const prose = await generateReadingProse({
    facts,
    hasEligibleCycles: assembled.eligibleCycles.length > 0,
    tone: ctx.tone,
    depth: ctx.depth,
    suppression: {
      angles: chart.uncertainty.angleClaimsSuppressed,
      houses: !chart.uncertainty.housesReliable,
    },
    fallback: {
      headline: assembled.headline,
      body: assembled.astroBody,
      prompt: assembled.prompt,
    },
  });
  const body = [prose.body, assembled.contextBody].filter(Boolean).join("\n\n");
  const suppliedFacts = facts.map(({ id, statement }) => ({ id, statement }));

  const provenance = assembled.provenance.filter(
    (entry) => prose.meta.mode !== "model" || entry.lane !== "content",
  );
  if (prose.meta.mode === "model") {
    for (const fact of facts) {
      const paragraphs = prose.meta.citations
        .filter((citation) => citation.facts.includes(fact.id))
        .map((citation) => citation.paragraph);
      if (!paragraphs.length || !/^[IDPT]1$/.test(fact.id)) continue;
      provenance.push({
        lane: "content",
        source_id: "AST-05",
        label: `Published reference cited by language layer · ${fact.id}`,
        detail: { statement: fact.statement, paragraphs: paragraphs.join(", "), bundle: bundle.version },
      });
    }
    provenance.push({
      lane: "content",
      source_id: "LLM-01",
      label: `Language layer · ${prose.meta.model}`,
      detail: {
        model: prose.meta.model,
        paragraphs: prose.meta.citations.length,
        dropped: prose.meta.dropped,
        cited: prose.meta.citations
          .map((c) => `${c.paragraph}:${c.facts.join("+")}`)
          .join(" "),
      },
    });
  }

  const { data: inserted, error } = await db
    .from<{ id: string }>("daily_readings")
    .insert({
      user_id: userId,
      reading_date: day,
      snapshot_id: snapRow.id,
      release_version: assembled.release_version,
      headline: prose.headline,
      body_ct: await encryptField(dek, body),
      prompt: prose.prompt,
      confidence: assembled.confidence,
      primary_cycle_key: assembled.primary_cycle_key,
      idempotency_key: idem,
      language_mode: prose.meta.mode,
      language_model: prose.meta.model,
      language_meta: { ...prose.meta, facts: suppliedFacts },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (provenance.length) {
    await db.from("reading_sources").insert(
      provenance.map((p) => ({
        user_id: userId,
        reading_id: inserted.id,
        lane: p.lane,
        source_id: p.source_id,
        label: p.label,
        detail: p.detail,
      })),
    );
  }

  if (topCycles.length) {
    await db.from("cycle_instances").upsert(
      topCycles.map((c) => ({
        user_id: userId,
        snapshot_id: snapRow.id,
        cycle_key: c.cycle_key,
        transit_body: c.transit_body,
        natal_point: c.natal_point,
        aspect: c.aspect,
        domain: c.domain,
        phase: c.phase,
        orb: c.orb,
        importance: c.importance,
        ingress_at: c.ingress_at,
        exact_at: c.exact_at,
        egress_at: c.egress_at,
        computed_for: day,
      })),
      { onConflict: "user_id,cycle_key,computed_for" },
    );
  }

  return {
    needsOnboarding: false as const,
    day,
    timezone: tz,
    reading: {
      id: inserted.id,
      headline: prose.headline,
      body,
      prompt: prose.prompt,
      confidence: assembled.confidence,
      primary_cycle_key: assembled.primary_cycle_key,
      release_version: assembled.release_version,
    },
    language: {
      mode: prose.meta.mode,
      model: prose.meta.model,
      citations: prose.meta.citations,
      dropped: prose.meta.dropped,
      reason: prose.meta.reason,
      facts: suppliedFacts,
    },
    provenance,
    cycles: topCycles,
    uncertainty: chart.uncertainty,
    ephemeris: ephemerisState(chart),
    wellness: wellnessState,
  };


}

// ---------------------------------------------------------------------------
// pattern view, journal, export
// ---------------------------------------------------------------------------

/**
 * The reader's own birth record, decrypted. Used by the editable birth page and
 * by the chart snapshot summary on /pattern.
 */
export async function loadBirthRecord(db: DB, userId: string) {
  const { data } = await db
    .from<{
      id: string;
      payload_ct: string;
      time_accuracy: string;
      timezone: string;
      fingerprint: string;
      created_at: string;
      updated_at: string;
    }>("birth_profiles")
    .select("id, payload_ct, time_accuracy, timezone, fingerprint, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const dek = await getDek(db, userId);
  const details = await decryptJson<BirthDetails & { utcISO?: string }>(
    dek,
    data.payload_ct,
  );
  return {
    birthDate: details.birthDate,
    birthTime: details.birthTime,
    placeLabel: details.placeLabel,
    latitude: details.latitude,
    longitude: details.longitude,
    utcISO: details.utcISO ?? null,
    accuracy: data.time_accuracy,
    timezone: data.timezone,
    fingerprint: data.fingerprint,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Plain-language area of life each house covers. Houses are the frame the
 * rising sign sets up, so this is only ever shown when the birth time is
 * precise enough for angle claims (AST-20).
 */
const HOUSE_AREA: string[] = [
  "how you come across and start things",
  "what you own, earn and value",
  "how you talk, learn and get around",
  "home, family and where you come from",
  "creative output, play and attention",
  "daily work, routine and upkeep",
  "close one-to-one relationships",
  "what you share with others and what changes you",
  "beliefs, study and distance",
  "public role, direction and long work",
  "friendships, groups and the future",
  "rest, privacy and what runs underneath",
];

/**
 * The rising sign as the chart's main lens: the sign on the ascendant and the
 * signs that fall across each house because of it. Null when the birth time is
 * too uncertain to place the angles honestly.
 */
function risingLens(chart: Chart, placements: { label: string; house: number | null }[]) {
  if (chart.uncertainty.angleClaimsSuppressed || !chart.uncertainty.housesReliable) {
    return null;
  }
  const asc = chart.angles.ascendant;
  const cusps = Array.isArray(chart.houses) ? chart.houses : [];
  if (cusps.length < 12) return null;

  return {
    sign: signOf(asc),
    position: formatPosition(asc),
    houses: cusps.slice(0, 12).map((cusp, i) => ({
      house: i + 1,
      sign: signOf(cusp),
      area: HOUSE_AREA[i] ?? "",
      bodies: placements.filter((p) => p.house === i + 1).map((p) => p.label),
    })),
  };
}

export async function getPattern(db: DB, userId: string) {
  let snapRow = await loadSnapshot(db, userId);
  if (!snapRow) return { needsOnboarding: true as const };

  // One-time upgrade: older Swiss charts stored in-app houses and aspects.
  // Recalculate so houses, angles and aspects come from the service too.
  // Also recalculate charts saved before per-item sources were recorded, so
  // the rising sign is re-requested from the service for the saved birthplace.
  const storedHouses = snapRow.houses as { system?: string; sources?: unknown } | null;
  const storedSystem = storedHouses?.system;
  const needsUpgrade =
    !storedSystem || storedSystem === "whole-sign" || !storedHouses?.sources;
  if (snapRow.engine.startsWith("swiss-ephemeris") && needsUpgrade) {
    const rec = await loadBirthRecord(db, userId);
    if (rec) {
      try {
        await saveBirth(
          db,
          userId,
          {
            birthDate: rec.birthDate,
            birthTime: rec.birthTime,
            placeLabel: rec.placeLabel,
            latitude: rec.latitude,
            longitude: rec.longitude,
          } as BirthDetails,
          rec.accuracy as TimeAccuracy,
          rec.timezone,
        );
        snapRow = (await loadSnapshot(db, userId)) ?? snapRow;
      } catch (err) {
        console.error("[pattern] chart upgrade failed", err);
      }
    }
  }
  const chart = snapshotToChart(snapRow);
  const [{ data: features }, birth] = await Promise.all([
    db
      .from<FeatureRow>("natal_features")
      .select("feature_key, family, title, strength, payload")
      .eq("snapshot_id", snapRow.id)
      .order("strength", { ascending: false }),
    loadBirthRecord(db, userId),
  ]);

  const placements = Object.values(chart.points).map((p) => ({
    key: p.key,
    label: p.label,
    position: formatPosition(p.lon),
    house: p.house,
    retrograde: p.retrograde,
    angleDependent: p.angleDependent,
  }));

  return {
    needsOnboarding: false as const,
    engine: `${chart.engine}@${chart.engineVersion}`,
    houseSystem: chart.houseSystem,
    contractVersion: chart.contractVersion,
    uncertainty: chart.uncertainty,
    ephemeris: ephemerisState(chart),
    rising: risingLens(chart, placements),
    placements,
    aspects: chart.aspects.slice(0, 20),
    allAspects: chart.aspects,
    sources: chart.sources ?? null,
    houseCusps: chart.houses,
    features: features ?? [],
    snapshot: {
      fingerprint: snapRow.fingerprint,
      engine: snapRow.engine,
      contractVersion: snapRow.contract_version,
      houseCount: Array.isArray(chart.houses) ? chart.houses.length : 0,
      placementCount: placements.length,
      aspectCount: chart.aspects.length,
      birth: birth
        ? {
            birthDate: birth.birthDate,
            birthTime: birth.birthTime,
            placeLabel: birth.placeLabel,
            latitude: birth.latitude,
            longitude: birth.longitude,
            accuracy: birth.accuracy,
            timezone: birth.timezone,
            updated_at: birth.updated_at,
          }
        : null,
    },
  };
}


/**
 * Tier 3 retention (registry WEL-01 / WEL-03, 180 days). The bands are nulled
 * out rather than the check-in row deleted, so mood, energy and the encrypted
 * note survive while the sensitive wellbeing signal does not.
 */
export async function purgeExpiredWellness(db: DB, userId: string) {
  const { error } = await db
    .from("check_ins")
    .update({ sleep: null, stress: null })
    .eq("user_id", userId)
    .lt("day", wellnessCutoff())
    .raw("(sleep is not null or stress is not null)");
  if (error) throw new Error(error.message);
}

export async function saveCheckIn(
  db: DB,
  userId: string,
  day: string,
  mood: number | null,
  energy: number | null,
  note: string | null,
  sleep: number | null = null,
  stress: number | null = null,
) {
  checkInInputSchema.parse({ day, mood, energy, note, sleep, stress });
  const dek = await getDek(db, userId);
  const granted = await grantedSet(db, userId);
  await purgeExpiredWellness(db, userId);

  // Tier 3 bands are only ever written when the person has consented to that
  // exact source; an unconsented band is dropped, not stored and hidden.
  const withinRetention = day >= wellnessCutoff();
  const sleepValue = withinRetention && granted.has("WEL-01") ? sleep : null;
  const stressValue = withinRetention && granted.has("WEL-03") ? stress : null;

  const savedAt = new Date().toISOString();
  const { data: row, error } = await db
    .from<CheckInRow>("check_ins")
    .upsert(
      {
        user_id: userId,
        day,
        mood,
        energy,
        sleep: sleepValue,
        stress: stressValue,
        note_ct: note ? await encryptField(dek, note) : null,
        updated_at: savedAt,
      },
      { onConflict: "user_id,day" },
    )
    .select("mood, energy, sleep, stress, note_ct, updated_at")
    .single();
  if (error) throw new Error(error.message);
  if (!row?.updated_at) throw new Error("Could not confirm the saved check-in.");
  const checkIn = {
    mood: row.mood,
    energy: row.energy,
    sleep: row.sleep,
    stress: row.stress,
    note: row.note_ct ? await decryptField(dek, row.note_ct) : null,
    savedAt: row.updated_at,
  };
  return {
    ok: true,
    day,
    savedAt: checkIn.savedAt,
    stored: {
      mood: checkIn.mood !== null,
      energy: checkIn.energy !== null,
      sleep: checkIn.sleep !== null,
      stress: checkIn.stress !== null,
    },
    checkIn,
  };
}


export async function listJournal(db: DB, userId: string) {
  const dek = await getDek(db, userId);
  await purgeExpiredWellness(db, userId);
  const { data: checkIns, error: checkInsError } = await db
    .from<CheckInBands & { id: string; day: string; note_ct: string | null }>("check_ins")
    .select("id, day, mood, energy, sleep, stress, note_ct")
    .eq("user_id", userId)
    .order("day", { ascending: false })
    .limit(60);
  if (checkInsError) throw new Error(checkInsError.message);
  const { data: events, error: eventsError } = await db
    .from<LifeEventRow>("life_events")
    .select("id, occurred_on, domain, label_ct, body_ct, cycle_key, feature_key, created_at")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .limit(60);
  if (eventsError) throw new Error(eventsError.message);
  const { data: feedback, error: feedbackError } = await db
    .from<FeedbackRow>("reading_feedback")
    .select("reading_id, resonance, labels, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  if (feedbackError) throw new Error(feedbackError.message);

  return {
    checkIns: await Promise.all(
      (checkIns ?? []).map(async (c) => ({
        id: c.id,
        day: c.day,
        mood: c.mood,
        energy: c.energy,
        sleep: c.sleep,
        stress: c.stress,
        note: c.note_ct ? await decryptField(dek, c.note_ct) : null,
      })),
    ),

    events: await Promise.all(
      (events ?? []).map(async (e) => ({
        id: e.id,
        occurred_on: e.occurred_on,
        domain: e.domain,
        label: await decryptField(dek, e.label_ct),
        body: e.body_ct ? await decryptField(dek, e.body_ct) : null,
        cycle_key: e.cycle_key ?? null,
        feature_key: e.feature_key ?? null,
        created_at: e.created_at ?? null,
      })),
    ),
    feedback: feedback ?? [],
  };
}

export async function addLifeEvent(
  db: DB,
  userId: string,
  occurredOn: string,
  domain: string,
  label: string,
  body: string | null = null,
  cycleKey: string | null = null,
  featureKey: string | null = null,
) {
  const dek = await getDek(db, userId);
  const { error } = await db.from("life_events").insert({
    user_id: userId,
    occurred_on: occurredOn,
    domain,
    label_ct: await encryptField(dek, label),
    body_ct: body ? await encryptField(dek, body) : null,
    cycle_key: cycleKey,
    feature_key: featureKey,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteLifeEvent(db: DB, userId: string, id: string) {
  const { error } = await db
    .from("life_events")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}


export async function submitFeedback(
  db: DB,
  userId: string,
  readingId: string,
  resonance: number,
  labels: string[],
) {
  const { data: reading, error: readingError } = await db
    .from<{ id: string }>("daily_readings")
    .select("id")
    .eq("user_id", userId)
    .eq("id", readingId)
    .maybeSingle();
  if (readingError) throw new Error(readingError.message);
  if (!reading) throw new Error("Reading not found for your account.");
  const { error } = await db.from("reading_feedback").upsert(
    { user_id: userId, reading_id: readingId, resonance, labels },
    { onConflict: "user_id,reading_id" },
  );
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function exportEverything(db: DB, userId: string) {
  const dek = await getDek(db, userId);
  const [profile, consents, journal, pattern] = await Promise.all([
    loadProfile(db, userId),
    loadConsents(db, userId),
    listJournal(db, userId),
    getPattern(db, userId),
  ]);
  const { data: birth } = await db
    .from<{ payload_ct: string; time_accuracy: string; timezone: string; created_at: string }>("birth_profiles")
    .select("payload_ct, time_accuracy, timezone, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: readings } = await db
    .from<ReadingRow>("daily_readings")
    .select("reading_date, headline, body_ct, prompt, confidence, release_version")
    .eq("user_id", userId)
    .order("reading_date", { ascending: false })
    .limit(400);
  const { data: audit } = await db
    .from<AuditRow>("audit_events")
    .select("kind, detail, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  return {
    exported_at: new Date().toISOString(),
    profile,
    consents,
    birth: birth
      ? {
          ...(await decryptJson<Record<string, unknown>>(dek, birth.payload_ct)),
          time_accuracy: birth.time_accuracy,
          timezone: birth.timezone,
        }
      : null,
    pattern,
    readings: await Promise.all(
      (readings ?? []).map(async (r) => ({
        reading_date: r.reading_date,
        headline: r.headline,
        body: await decryptField(dek, r.body_ct),
        prompt: r.prompt,
        confidence: r.confidence,
        release_version: r.release_version,
      })),
    ),
    journal,
    audit: audit ?? [],
  };
}

export async function eraseEverything(db: DB, userId: string) {
  for (const table of [
    "reading_feedback",
    "reading_sources",
    "daily_readings",
    "cycle_instances",
    "natal_features",
    "chart_snapshots",
    "context_signals",
    "check_ins",
    "life_events",
    "source_consents",
    "birth_profiles",
  ] as const) {
    await db.from(table).delete().eq("user_id", userId);
  }
  await db
    .from("profiles")
    .update({ wrapped_dek: null, onboarded_at: null })
    .eq("id", userId);
  await db.from("audit_events").insert({
    user_id: userId,
    kind: "account.erased",
    detail: {},
  });
  return { ok: true };
}

export async function updatePrefs(
  db: DB,
  userId: string,
  displayName: string | null,
  tone: string,
  depth: string,
) {
  const { error } = await db
    .from("profiles")
    .upsert(
      { id: userId, display_name: displayName, tone_pref: tone, depth_pref: depth },
      { onConflict: "id" },
    );
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// timing / time travel
// ---------------------------------------------------------------------------

export async function getCyclesFor(db: DB, userId: string, day?: string, timeZone = "UTC") {
  const snapRow = await loadSnapshot(db, userId);
  if (!snapRow) return { needsOnboarding: true as const };
  const granted = await grantedSet(db, userId);
  const timezone = isPermitted("DEV-01", "timing", granted) ? validTimeZone(timeZone) : "UTC";
  const referenceDay = day ?? localDayString(new Date(), timezone);
  const referenceAt = localNoon(referenceDay, timezone).toISOString();
  const chart = snapshotToChart(snapRow);
  const cycles = cyclesForLocalDay(chart, referenceDay, timezone);
  return {
    needsOnboarding: false as const,
    day: referenceDay,
    timezone,
    referenceAt,
    engine: `${chart.engine}@${chart.engineVersion}`,
    contractVersion: chart.contractVersion,
    computedAt: new Date().toISOString(),
    uncertainty: chart.uncertainty,
    ephemeris: ephemerisState(chart),
    cycles: cycles.slice(0, 40),
  };
}

// ---------------------------------------------------------------------------
// content releases (editorial provenance, read-only)
// ---------------------------------------------------------------------------

export async function listReleases(db: DB) {
  const { data, error } = await db
    .from<ReleaseRow>("content_releases")
    .select("id, version, checksum, created_at, is_active, bundle")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => {
    const bundle = (r.bundle ?? {}) as Record<string, unknown>;
    const keys = Object.keys(bundle);
    const count = (prefix: string) =>
      keys.filter((k) => k.startsWith(prefix)).length;
    const entries = Object.entries(bundle).reduce((acc, [, v]) => {
      if (v && typeof v === "object") return acc + Object.keys(v as object).length;
      return acc + 1;
    }, 0);
    return {
      id: r.id,
      version: r.version,
      checksum: r.checksum,
      created_at: r.created_at,
      is_active: r.is_active,
      families: keys.length,
      entries,
      cycles: count("cycles"),
      natal: count("natal"),
      familyKeys: keys.slice(0, 12),
    };
  });
}

export async function isAdmin(db: DB, userId: string): Promise<boolean> {
  const { data, error } = await db
    .from<{ role: string }>("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/**
 * Flips the active release pointer from inside the app. RLS only allows this
 * for admins; published readings are never rewritten because each one already
 * records the release version it was assembled from.
 */
export async function activateRelease(db: DB, userId: string, releaseId: string) {
  if (!(await isAdmin(db, userId))) {
    throw new Error("Only admins can change the active release.");
  }

  const { data: target, error: findErr } = await db
    .from<{ id: string; version: string; checksum: string; bundle: Record<string, unknown> | null }>("content_releases")
    .select("id, version, checksum, bundle")
    .eq("id", releaseId)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (!target) throw new Error("That release no longer exists.");

  const families = Object.keys((target.bundle ?? {}) as Record<string, unknown>);
  if (families.length === 0) {
    throw new Error("That release has an empty content graph and cannot be activated.");
  }

  const { error: deactivateErr } = await db
    .from("content_releases")
    .update({ is_active: false })
    .neq("id", target.id);
  if (deactivateErr) throw new Error(deactivateErr.message);

  const { error: activateErr } = await db
    .from("content_releases")
    .update({ is_active: true })
    .eq("id", target.id);
  if (activateErr) throw new Error(activateErr.message);

  await db.from("audit_events").insert({
    user_id: userId,
    kind: "content_release_rollback",
    detail: { version: target.version, checksum: target.checksum },
  });

  // Mirror the pointer into the edge plane (D1) so artifacts and durable runs
  // resolve the same release the app just activated.
  const { syncReleasePointer } = await import("./workflows.server");
  await syncReleasePointer(target.version, target.checksum);

  return { version: target.version, checksum: target.checksum };
}

// ---------------------------------------------------------------------------
// language layer — natal chapter narratives
// ---------------------------------------------------------------------------

interface NarrativeRow {
  feature_key: string;
  mode: string;
  model: string | null;
  narrative_ct: string;
  citations: JsonValue;
  essay_version: string | null;
}

/**
 * Narrative for one natal chapter, cached per chart snapshot. Generated from
 * the structure's own payload only, verified claim-by-claim, and stored
 * encrypted like every other piece of written output.
 */
export async function getFeatureNarrative(
  db: DB,
  userId: string,
  featureKey: string,
) {
  const snapRow = await loadSnapshot(db, userId);
  if (!snapRow) return { available: false as const, reason: "No chart calculated yet." };

  const dek = await getDek(db, userId);

  const { FEATURE_ESSAY_VERSION, generateFeatureNarrative } = await import(
    "./ai/language.server"
  );

  const chartForKey = snapshotToChart(snapRow);
  const profile = await loadProfile(db, userId);
  const granted = await grantedSet(db, userId);
  const tone = isPermitted("USR-01", "external_language", granted)
    ? normalizeTone(profile.tone_pref ?? "plain")
    : "plain";
  // Chapters are tied to the exact chart they were written from: a recalculated
  // chart (new house system, engine version) invalidates every saved essay.
  const essayKey = `${FEATURE_ESSAY_VERSION}|${chartForKey.houseSystem}|${chartForKey.engineVersion}|${chartForKey.jd}|${tone}`;

  const { data: cached } = await db
    .from<NarrativeRow>("feature_narratives")
    .select("feature_key, mode, model, narrative_ct, citations, essay_version")
    .eq("user_id", userId)
    .eq("snapshot_id", snapRow.id)
    .eq("feature_key", featureKey)
    .maybeSingle();

  // A chapter written under an older essay brief is discarded rather than
  // served: the reader should always get the current depth of writing.
  if (cached && cached.essay_version !== essayKey) {
    await db
      .from("feature_narratives")
      .delete()
      .eq("user_id", userId)
      .eq("snapshot_id", snapRow.id)
      .eq("feature_key", featureKey);
  } else if (cached) {
    return {
      available: true as const,
      featureKey,
      narrative: await decryptField(dek, cached.narrative_ct),
      mode: cached.mode === "model" ? ("model" as const) : ("template" as const),
      model: cached.model,
      citations: (Array.isArray(cached.citations) ? cached.citations : []) as {
        paragraph: number;
        facts: string[];
      }[],
      reason: null as string | null,
    };
  }

  const { data: feature } = await db
    .from<FeatureRow>("natal_features")
    .select("feature_key, family, title, strength, payload")
    .eq("snapshot_id", snapRow.id)
    .eq("feature_key", featureKey)
    .maybeSingle();
  if (!feature) {
    return { available: false as const, reason: "That structure is not in this chart." };
  }

  const chart = snapshotToChart(snapRow);
  const { featureFacts } = await import("./ai/facts");
  for (const source of ["AST-05", "AST-07", "AST-08", "AST-20"])
    assertUse(source, "external_language");

  const { data: others } = await db
    .from<FeatureRow>("natal_features")
    .select("feature_key, family, title, strength, payload")
    .eq("snapshot_id", snapRow.id)
    .order("strength", { ascending: false })
    .limit(4);
  const related = (others ?? []).filter((o) => o.feature_key !== featureKey).slice(0, 3);

  const facts = featureFacts(
    feature,
    {
      engine: chart.engine,
      engineVersion: chart.engineVersion,
      houseSystem: chart.houseSystem,
      precision: ephemerisState(chart).precision,
      uncertainty: chart.uncertainty,
    },
    related,
  );

  const written = await generateFeatureNarrative({
    facts,
    title: feature.title,
    tone,
  });

  if (!written.narrative) {
    return {
      available: false as const,
      reason:
        written.meta.reason ??
        "No narrative could be written from this structure's facts.",
    };
  }

  await db.from("feature_narratives").insert({
    user_id: userId,
    snapshot_id: snapRow.id,
    feature_key: featureKey,
    mode: written.meta.mode,
    model: written.meta.model,
    narrative_ct: await encryptField(dek, written.narrative),
    citations: written.meta.citations,
    essay_version: essayKey,
  });

  return {
    available: true as const,
    featureKey,
    narrative: written.narrative,
    mode: written.meta.mode,
    model: written.meta.model,
    citations: written.meta.citations,
    reason: null as string | null,
  };
}

// ---------------------------------------------------------------------------
// language layer — drafted interpretation releases (admin)
// ---------------------------------------------------------------------------

interface DraftRow {
  id: string;
  base_version: string | null;
  model: string | null;
  bundle: Record<string, unknown> | null;
  notes: JsonValue;
  status: string;
  created_at: string;
}

/** Slots a drafted release must cover: the ones the engine actually looks up. */
const DRAFT_SLOTS: { key: string; family: string; transitBody: string; natalPoint: string }[] = [
  ...["saturn", "jupiter", "mars", "venus", "mercury", "sun", "moon", "uranus", "neptune", "pluto"].flatMap(
    (body) =>
      ["hard", "soft"].map((family) => ({
        key: `${family}:${body}:*`,
        family,
        transitBody: body,
        natalPoint: "any natal point",
      })),
  ),
  { key: "hard:*:*", family: "hard", transitBody: "any body", natalPoint: "any natal point" },
  { key: "soft:*:*", family: "soft", transitBody: "any body", natalPoint: "any natal point" },
];

export async function listDrafts(db: DB, userId: string) {
  if (!(await isAdmin(db, userId))) return [];
  const { data } = await db
    .from<DraftRow>("content_drafts")
    .select("id, base_version, model, bundle, notes, status, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []).map((d) => {
    const bundle = (d.bundle ?? {}) as { cycles?: { key: string; mechanism: string; question: string }[] };
    return {
      id: d.id,
      base_version: d.base_version,
      model: d.model,
      created_at: d.created_at,
      notes: d.notes,
      entries: bundle.cycles ?? [],
    };
  });
}

/**
 * Drafts a full interpretation release with the language layer. Nothing is
 * published: the draft is stored for review, and publishing it creates an
 * ordinary content release that the existing rollback controls can activate.
 */
export async function draftRelease(db: DB, userId: string) {
  if (!(await isAdmin(db, userId))) {
    throw new Error("Only admins can draft a release.");
  }

  const base = await activeBundle(db);
  const { generateBundleEntries } = await import("./ai/language.server");
  const drafted = await generateBundleEntries(DRAFT_SLOTS);

  if (drafted.entries.length === 0) {
    throw new Error("The language layer returned no usable entries; nothing was drafted.");
  }

  const bundle = {
    version: "pending",
    phases: base.phases,
    natal: base.natal,
    cycles: drafted.entries,
  };

  const { data: inserted, error } = await db
    .from<{ id: string }>("content_drafts")
    .insert({
      user_id: userId,
      base_version: base.version,
      model: drafted.model,
      bundle: bundle,
      notes: {
        requested: DRAFT_SLOTS.length,
        returned: drafted.entries.length,
        dropped: drafted.dropped,
        flagged: drafted.flagged.length,
      },
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await db.from("audit_events").insert({
    user_id: userId,
    kind: "content_draft_generated",
    detail: { model: drafted.model, entries: drafted.entries.length },
  });

  return {
    id: inserted.id,
    entries: drafted.entries.length,
    dropped: drafted.dropped,
    model: drafted.model,
  };
}

export async function discardDraft(db: DB, userId: string, draftId: string) {
  if (!(await isAdmin(db, userId))) throw new Error("Only admins can discard a draft.");
  const { error } = await db
    .from("content_drafts")
    .update({ status: "discarded" })
    .eq("id", draftId);
  if (error) throw new Error(error.message);
  return { discarded: true };
}

/** Turns a reviewed draft into a real (inactive) content release. */
export async function publishDraft(db: DB, userId: string, draftId: string) {
  if (!(await isAdmin(db, userId))) throw new Error("Only admins can publish a draft.");

  const { data: draft, error: findErr } = await db
    .from<DraftRow>("content_drafts")
    .select("id, base_version, model, bundle, notes, status, created_at")
    .eq("id", draftId)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (!draft || draft.status !== "draft") throw new Error("That draft is no longer open.");

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const version = `ai-${stamp}`;
  const bundle = { ...((draft.bundle ?? {}) as Record<string, unknown>), version };
  const serialized = JSON.stringify(bundle);
  const { createHash } = await import("crypto");
  const checksum = createHash("sha256").update(serialized).digest("hex");

  const { error: insertErr } = await db.from("content_releases").insert({
    version,
    checksum,
    bundle: bundle,
    is_active: false,
  });
  if (insertErr) throw new Error(insertErr.message);

  const { error: markErr } = await db
    .from("content_drafts")
    .update({ status: "published" })
    .eq("id", draft.id);
  if (markErr) throw new Error(markErr.message);

  await db.from("audit_events").insert({
    user_id: userId,
    kind: "content_draft_published",
    detail: { version, checksum, model: draft.model },
  });

  return { version, checksum };
}

// ---------------------------------------------------------------------------
// reading quality (language-layer telemetry)
// ---------------------------------------------------------------------------

/** Most recent persisted generation outcomes; cache reads are not new attempts. */
export async function readingQuality(db: DB, userId: string) {
  if (!(await isAdmin(db, userId))) return { isAdmin: false as const };

  const { data, error } = await db
    .from<QualityReading>("daily_readings")
    .select("id, user_id, reading_date, created_at, strftime('%Y-%m-%dT%H:%M:%fZ', created_at) as generated_at, julianday(created_at) as generated_sort, release_version, language_mode, language_model, language_meta")
    .order("generated_sort", { ascending: false })
    .order("id", { ascending: false })
    .limit(301);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).slice(0, 300);
  const users = [...new Set(rows.map((row) => row.user_id))];
  const { data: consents, error: consentError } = await db
    .from<{ user_id: string; granted: boolean }>("source_consents")
    .select("user_id, granted")
    .eq("source_id", "USR-15")
    .eq("granted", true)
    .in("user_id", users);
  if (consentError) throw new Error(consentError.message);
  const optedInUsers = new Set(
    (consents ?? []).filter((row) => isPermitted("USR-15", "quality_measurement", new Set(row.granted ? ["USR-15"] : [])))
      .map((row) => row.user_id),
  );
  let feedback: QualityFeedback[] = [];
  if (optedInUsers.size) {
    // Ownership is checked again by the summary. Only numeric scores are read.
    const result = await db
      .from<QualityFeedback>("reading_feedback")
      .select("reading_id, user_id, resonance")
      .in("reading_id", rows.filter((row) => optedInUsers.has(row.user_id)).map((row) => row.id))
      .in("user_id", [...optedInUsers]);
    if (result.error) throw new Error(result.error.message);
    feedback = result.data ?? [];
  }
  return summarizeReadingQuality(rows, userId, feedback, optedInUsers, (data ?? []).length > 300);
}
