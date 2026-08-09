import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

import {
  computeChart,
  extractFeatures,
  formatPosition,
  type Chart,
  type TimeAccuracy,
} from "./astro/chart";
import { computeCycles } from "./astro/cycles";
import { toJulianDay } from "./astro/ephemeris";
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

export type DB = SupabaseClient<Database>;

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
    .from("profiles")
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
    .from("profiles")
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
    .from("source_consents")
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
    .from("birth_profiles")
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
    .from("chart_snapshots")
    .upsert(
      {
        user_id: userId,
        birth_profile_id: bp.id,
        fingerprint: fp,
        engine: `${chart.engine}@${chart.engineVersion}`,
        contract_version: chart.contractVersion,
        positions: chart.points as never,
        houses: { system: chart.houseSystem, cusps: chart.houses } as never,
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
    .from("chart_snapshots")
    .select("id, fingerprint, engine, contract_version, positions, houses, aspects, uncertainty")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SnapshotRow | null) ?? null;
}

function snapshotToChart(row: SnapshotRow): Chart {
  const houses = row.houses as { system: string; cusps: number[] };
  const [engine, engineVersion] = row.engine.split("@");
  const points = row.positions as Chart["points"];
  return {
    engine: engine ?? "unknown",
    engineVersion: engineVersion ?? "0",
    contractVersion: row.contract_version,
    houseSystem: houses?.system ?? "whole-sign",
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
    .from("content_releases")
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

  const { data: existing } = await db
    .from("daily_readings")
    .select("id, reading_date, headline, body_ct, prompt, confidence, primary_cycle_key, release_version")
    .eq("user_id", userId)
    .eq("idempotency_key", idem)
    .maybeSingle();

  if (existing) {
    const { data: srcs } = await db
      .from("reading_sources")
      .select("lane, source_id, label, detail")
      .eq("reading_id", existing.id);
    const { data: cyc } = await db
      .from("cycle_instances")
      .select("cycle_key, transit_body, natal_point, aspect, orb, phase, domain, importance, ingress_at, exact_at, egress_at")
      .eq("user_id", userId)
      .eq("computed_for", day)
      .order("importance", { ascending: false });
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
      provenance: srcs ?? [],
      cycles: cyc ?? [],
      uncertainty: snapRow.uncertainty as Chart["uncertainty"],
    };
  }

  const chart = snapshotToChart(snapRow);
  const referenceNoon = new Date(`${day}T12:00:00Z`);
  const cycles = computeCycles(chart, referenceNoon);

  const { data: checkInRow } = await db
    .from("check_ins")
    .select("mood, energy")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();

  const ctx: ReadingContext = {
    granted,
    tone: profile.tone_pref,
    depth: profile.depth_pref,
    localBucket: granted.has("AMB-02") ? timeBucket(now, tz) : null,
    checkIn: checkInRow ? { mood: checkInRow.mood, energy: checkInRow.energy } : null,
  };

  const assembled = assembleReading(chart, cycles, ctx, bundle);

  const { data: inserted, error } = await db
    .from("daily_readings")
    .insert({
      user_id: userId,
      reading_date: day,
      snapshot_id: snapRow.id,
      release_version: assembled.release_version,
      headline: assembled.headline,
      body_ct: await encryptField(dek, assembled.body),
      prompt: assembled.prompt,
      confidence: assembled.confidence,
      primary_cycle_key: assembled.primary_cycle_key,
      idempotency_key: idem,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (assembled.provenance.length) {
    await db.from("reading_sources").insert(
      assembled.provenance.map((p) => ({
        user_id: userId,
        reading_id: inserted.id,
        lane: p.lane,
        source_id: p.source_id,
        label: p.label,
        detail: p.detail as never,
      })),
    );
  }

  const topCycles = cycles.slice(0, 12);
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
      headline: assembled.headline,
      body: assembled.body,
      prompt: assembled.prompt,
      confidence: assembled.confidence,
      primary_cycle_key: assembled.primary_cycle_key,
      release_version: assembled.release_version,
    },
    provenance: assembled.provenance,
    cycles: topCycles,
    uncertainty: chart.uncertainty,
  };
}

// ---------------------------------------------------------------------------
// pattern view, journal, export
// ---------------------------------------------------------------------------

export async function getPattern(db: DB, userId: string) {
  const snapRow = await loadSnapshot(db, userId);
  if (!snapRow) return { needsOnboarding: true as const };
  const chart = snapshotToChart(snapRow);
  const { data: features } = await db
    .from("natal_features")
    .select("feature_key, family, title, strength, payload")
    .eq("snapshot_id", snapRow.id)
    .order("strength", { ascending: false });

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
    placements,
    aspects: chart.aspects.slice(0, 20),
    features: features ?? [],
  };
}

export async function saveCheckIn(
  db: DB,
  userId: string,
  day: string,
  mood: number | null,
  energy: number | null,
  note: string | null,
) {
  const dek = await getDek(db, userId);
  const { error } = await db.from("check_ins").upsert(
    {
      user_id: userId,
      day,
      mood,
      energy,
      note_ct: note ? await encryptField(dek, note) : null,
    },
    { onConflict: "user_id,day" },
  );
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function listJournal(db: DB, userId: string) {
  const dek = await getDek(db, userId);
  const { data: checkIns } = await db
    .from("check_ins")
    .select("id, day, mood, energy, note_ct")
    .eq("user_id", userId)
    .order("day", { ascending: false })
    .limit(60);
  const { data: events } = await db
    .from("life_events")
    .select("id, occurred_on, domain, label_ct")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .limit(60);
  const { data: feedback } = await db
    .from("reading_feedback")
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
        note: c.note_ct ? await decryptField(dek, c.note_ct) : null,
      })),
    ),
    events: await Promise.all(
      (events ?? []).map(async (e) => ({
        id: e.id,
        occurred_on: e.occurred_on,
        domain: e.domain,
        label: await decryptField(dek, e.label_ct),
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
) {
  const dek = await getDek(db, userId);
  const { error } = await db.from("life_events").insert({
    user_id: userId,
    occurred_on: occurredOn,
    domain,
    label_ct: await encryptField(dek, label),
  });
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
    .from("birth_profiles")
    .select("payload_ct, time_accuracy, timezone, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: readings } = await db
    .from("daily_readings")
    .select("reading_date, headline, body_ct, prompt, confidence, release_version")
    .eq("user_id", userId)
    .order("reading_date", { ascending: false })
    .limit(400);
  const { data: audit } = await db
    .from("audit_events")
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
    cycles: cycles.slice(0, 40),
  };
}

// ---------------------------------------------------------------------------
// content releases (editorial provenance, read-only)
// ---------------------------------------------------------------------------

export async function listReleases(db: DB) {
  const { data, error } = await db
    .from("content_releases")
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
  const { data, error } = await db.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
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
    .from("content_releases")
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
