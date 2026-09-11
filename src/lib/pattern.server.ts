import type { DBClient } from "./d1.server";


import {
  computeChart,
  extractFeatures,
  formatPosition,
  type Chart,
  type TimeAccuracy,
} from "./astro/chart";
import { computeCycles } from "./astro/cycles";
import { ENGINE_ID, ENGINE_VERSION, toJulianDay } from "./astro/ephemeris";
import { resolvePositions } from "./astro/swiss.server";

import {
  createWrappedDek,
  decryptField,
  decryptJson,
  encryptField,
  encryptJson,
  fingerprint,
  unwrapDek,
} from "./crypto.server";
import { DEFAULT_BUNDLE, type ContentBundle } from "./content/default-bundle";
import { assembleReading, type ReadingContext } from "./reading.server";
import { LAUNCH_SOURCES, PROHIBITED_SOURCES, SOURCE_MAP } from "./registry";

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

function offsetMinutes(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(instant).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const asUTC = Date.UTC(
    Number(parts["year"]),
    Number(parts["month"]) - 1,
    Number(parts["day"]),
    Number(parts["hour"] === "24" ? "0" : parts["hour"]),
    Number(parts["minute"]),
    Number(parts["second"]),
  );
  return (asUTC - instant.getTime()) / 60000;
}

/** Civil local time in `timeZone` -> UTC instant (AST-04: historical offsets). */
export function zonedToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const naive = Date.UTC(y!, (m ?? 1) - 1, d!, hh ?? 12, mm ?? 0, 0);
  let guess = new Date(naive);
  for (let i = 0; i < 3; i++) {
    const off = offsetMinutes(guess, timeZone);
    guess = new Date(naive - off * 60000);
  }
  return guess;
}

export function localDayString(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

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
    wrapped = await createWrappedDek();
    const { error: upErr } = await db
      .from("profiles")
      .upsert({ id: userId, wrapped_dek: wrapped }, { onConflict: "id" });
    if (upErr) throw new Error(upErr.message);
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
  const { data } = await db
    .from<ConsentRow>("source_consents")
    .select("source_id, granted, tier, granted_at, revoked_at")
    .eq("user_id", userId);
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
        positions: chart.points as never,
        houses: {
          system: chart.houseSystem,
          cusps: chart.houses,
          ephemeris: {
            precision: chart.precision,
            degraded: chart.degraded,
            degradedReason: chart.degradedReason,
          },
        } as never,

        aspects: chart.aspects as never,
        uncertainty: chart.uncertainty as never,
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
        payload: f.payload as never,
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
  const { data } = await db
    .from<SnapshotRow>("chart_snapshots")
    .select("id, fingerprint, engine, contract_version, positions, houses, aspects, uncertainty")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SnapshotRow | null) ?? null;
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

/** check_ins row shape including the tier 3 wellbeing bands. */
interface CheckInBands {
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  stress: number | null;
}

/** The same shape plus the instant the row was last written. */
interface CheckInRow extends CheckInBands {
  updated_at: string | null;
}

/** Days a tier 3 band may live before it is nulled out (registry WEL retention). */
export const WELLNESS_RETENTION_DAYS = 180;

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
    facts: [],
  };
}




export async function getToday(db: DB, userId: string, timeZone: string) {
  const snapRow = await loadSnapshot(db, userId);
  if (!snapRow) return { needsOnboarding: true as const };

  const dek = await getDek(db, userId);
  const profile = await loadProfile(db, userId);
  const granted = await grantedSet(db, userId);
  const now = new Date();
  const tz = granted.has("DEV-01") ? timeZone : "UTC";
  const day = localDayString(now, tz);
  const bundle = await activeBundle(db);
  const idem = `${snapRow.fingerprint}:${day}:${bundle.version}`;

  await purgeExpiredWellness(db, userId);

  const { data: checkInRaw } = await db
    .from<CheckInRow>("check_ins")
    .select("mood, energy, sleep, stress, updated_at")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  const checkInRow = checkInRaw as unknown as CheckInRow | null;

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
    savedAt: checkInRow?.updated_at ?? null,
  };

  const { data: existing } = await db
    .from<ExistingReadingRow>("daily_readings")
    .select(
      "id, reading_date, headline, body_ct, prompt, confidence, primary_cycle_key, release_version, language_mode, language_model, language_meta",
    )
    .eq("user_id", userId)
    .eq("idempotency_key", idem)
    .maybeSingle();

  if (existing) {
    const { data: srcs } = await db
      .from<ProvenanceRow>("reading_sources")
      .select("lane, source_id, label, detail")
      .eq("reading_id", existing.id);
    // Phase, orb and importance are recomputed against the natal positions in
    // this snapshot so a reading opened later in the day still reports where
    // each cycle actually stands. Stored rows are only a fallback.
    const cachedChart = snapshotToChart(snapRow);
    const liveCycles = computeCycles(cachedChart, new Date(`${day}T12:00:00Z`)).slice(0, 12);
    let cyc: CycleRow[] | null = liveCycles;
    if (!liveCycles.length) {
      const { data: stored } = await db
        .from<CycleRow>("cycle_instances")
        .select("cycle_key, transit_body, natal_point, aspect, orb, phase, domain, importance, ingress_at, exact_at, egress_at")
        .eq("user_id", userId)
        .eq("computed_for", day)
        .order("importance", { ascending: false });
      cyc = stored ?? null;
    }

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
      cycles: cyc ?? [],
      uncertainty: snapRow.uncertainty as Chart["uncertainty"],
      ephemeris: ephemerisState(snapshotToChart(snapRow)),
      wellness: wellnessState,
    };
  }


  const chart = snapshotToChart(snapRow);
  const referenceNoon = new Date(`${day}T12:00:00Z`);
  const cycles = computeCycles(chart, referenceNoon);

  const ctx: ReadingContext = {
    granted,
    tone: profile.tone_pref ?? "measured",
    depth: profile.depth_pref ?? "standard",
    localBucket: granted.has("AMB-02") ? timeBucket(now, tz) : null,
    checkIn: checkInRow ? { mood: checkInRow.mood, energy: checkInRow.energy } : null,
    wellness: wellnessAllowed
      ? { sleep: wellnessState.sleep, stress: wellnessState.stress }
      : null,
  };



  const assembled = assembleReading(chart, cycles, ctx, bundle);
  const topCycles = cycles.slice(0, 12);

  // Language layer. The reading above is the source of truth; this only
  // rewrites wording from facts already calculated, and falls back to the
  // template copy whenever verification or the gateway fails.
  const { generateReadingProse } = await import("./ai/language.server");
  const { readingFacts } = await import("./ai/facts");
  const facts = readingFacts(
    {
      engine: chart.engine,
      engineVersion: chart.engineVersion,
      houseSystem: chart.houseSystem,
      precision: ephemerisState(chart).precision,
      uncertainty: chart.uncertainty,
    },
    topCycles.slice(0, 5),
    {
      localBucket: ctx.localBucket,
      mood: ctx.checkIn?.mood ?? null,
      energy: ctx.checkIn?.energy ?? null,
      sleep: ctx.wellness?.sleep ?? null,
      stress: ctx.wellness?.stress ?? null,
    },
  );
  const prose = await generateReadingProse({
    facts,
    tone: ctx.tone,
    depth: ctx.depth,
    fallback: {
      headline: assembled.headline,
      body: assembled.body,
      prompt: assembled.prompt,
    },
  });

  const provenance = [...assembled.provenance];
  if (prose.meta.mode === "model") {
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
      body_ct: await encryptField(dek, prose.body),
      prompt: prose.prompt,
      confidence: assembled.confidence,
      primary_cycle_key: assembled.primary_cycle_key,
      idempotency_key: idem,
      language_mode: prose.meta.mode,
      language_model: prose.meta.model,
      language_meta: prose.meta as never,
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
        detail: p.detail as never,
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
      body: prose.body,
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
      facts: facts.map((f) => ({ id: f.id, statement: f.statement })),
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

export async function getPattern(db: DB, userId: string) {
  const snapRow = await loadSnapshot(db, userId);
  if (!snapRow) return { needsOnboarding: true as const };
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
    placements,
    aspects: chart.aspects.slice(0, 20),
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
  const cutoff = new Date(Date.now() - WELLNESS_RETENTION_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);
  await db
    .from("check_ins")
    .update({ sleep: null, stress: null } as never)
    .eq("user_id", userId)
    .lt("day", cutoff)
    .raw("(sleep is not null or stress is not null)");
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
  const dek = await getDek(db, userId);
  const granted = await grantedSet(db, userId);

  // Tier 3 bands are only ever written when the person has consented to that
  // exact source; an unconsented band is dropped, not stored and hidden.
  const sleepValue = granted.has("WEL-01") ? sleep : null;
  const stressValue = granted.has("WEL-03") ? stress : null;

  const { error } = await db.from("check_ins").upsert(
    {
      user_id: userId,
      day,
      mood,
      energy,
      sleep: sleepValue,
      stress: stressValue,
      note_ct: note ? await encryptField(dek, note) : null,
    } as never,
    { onConflict: "user_id,day" },
  );
  if (error) throw new Error(error.message);

  await purgeExpiredWellness(db, userId);
  return {
    ok: true,
    stored: {
      sleep: sleepValue !== null,
      stress: stressValue !== null,
    },
  };
}


export async function listJournal(db: DB, userId: string) {
  const dek = await getDek(db, userId);
  await purgeExpiredWellness(db, userId);
  const { data: checkInsRaw } = await db
    .from<CheckInBands & { id: string; day: string; note_ct: string | null }>("check_ins")
    .select("id, day, mood, energy, sleep, stress, note_ct")
    .eq("user_id", userId)
    .order("day", { ascending: false })
    .limit(60);
  const checkIns = checkInsRaw as unknown as
    | (CheckInBands & { id: string; day: string; note_ct: string | null })[]
    | null;
  const { data: events } = await db
    .from<LifeEventRow>("life_events")
    .select("id, occurred_on, domain, label_ct, body_ct, cycle_key, feature_key, created_at")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .limit(60);
  const { data: feedback } = await db
    .from<FeedbackRow>("reading_feedback")
    .select("reading_id, resonance, labels, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);

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

export async function getCyclesFor(db: DB, userId: string, day: string) {
  const snapRow = await loadSnapshot(db, userId);
  if (!snapRow) return { needsOnboarding: true as const };
  const chart = snapshotToChart(snapRow);
  const cycles = computeCycles(chart, new Date(`${day}T12:00:00Z`));
  return {
    needsOnboarding: false as const,
    day,
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

  const { data: cached } = await db
    .from<NarrativeRow>("feature_narratives")
    .select("feature_key, mode, model, narrative_ct, citations")
    .eq("user_id", userId)
    .eq("snapshot_id", snapRow.id)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (cached) {
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
  const profile = await loadProfile(db, userId);
  const { featureFacts } = await import("./ai/facts");
  const { generateFeatureNarrative } = await import("./ai/language.server");

  const facts = featureFacts(feature, {
    engine: chart.engine,
    engineVersion: chart.engineVersion,
    houseSystem: chart.houseSystem,
    precision: ephemerisState(chart).precision,
    uncertainty: chart.uncertainty,
  });

  const written = await generateFeatureNarrative({
    facts,
    title: feature.title,
    tone: profile.tone_pref ?? "plain",
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
    citations: written.meta.citations as never,
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
      bundle: bundle as never,
      notes: {
        requested: DRAFT_SLOTS.length,
        returned: drafted.entries.length,
        dropped: drafted.dropped,
        flagged: drafted.flagged.length,
      } as never,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await db.from("audit_events").insert({
    user_id: userId,
    kind: "content_draft_generated",
    detail: { model: drafted.model, entries: drafted.entries.length } as never,
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
    bundle: bundle as never,
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
    detail: { version, checksum, model: draft.model } as never,
  });

  return { version, checksum };
}
