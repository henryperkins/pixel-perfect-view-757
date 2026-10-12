import {
  cachedTimingCalculation,
  clearTimingCalculations,
} from "./astro/transit-timing-cache.server";
import { resolveTransitForReading, transitEpisodePolicy } from "./astro/transit-episodes.server";
import { type DailyTransitCalculation } from "./astro/transit-episodes";
import { DAILY_TRANSIT_STORY_VERSION } from "./content/transit-story";
import {
  canonicalStoryValue,
  storyDigest,
  templateStoryParagraphs,
  validateSavedTransitStory,
  calculationFromStory,
  type SavedTransitStory,
  type StoryPolicyBinding,
} from "./content/transit-story-storage.server";
import { consumedNatalTemplate } from "./content/natal-template";
import type { DBClient } from "./d1.server";

import {
  computeChart,
  extractFeatures,
  formatPosition,
  type BirthInput,
  type Chart,
  type TimeAccuracy,
} from "./astro/chart";
import { computeCycles } from "./astro/cycles";
import { ENGINE_ID, ENGINE_VERSION, signOf, toJulianDay } from "./astro/ephemeris";
import { resolvePositions } from "./astro/swiss.server";
import { assessTransitAnchors, type TransitAnchorManifest } from "./astro/transit-anchors";
import { loadTransitAnchors } from "./astro/transit-anchors.server";
export { loadTransitAnchors };
import { resolveNatalWindowSamples } from "./astro/natal-reliability.server";
import {
  validateNatalReliability,
  NATAL_RELIABILITY_VERSION,
  assessNatalReliability,
  unavailableNatalReliability,
  usableNatalService,
  type NatalReliabilityManifest,
} from "./astro/natal-reliability";

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
import { DEFAULT_BUNDLE, type ContentBundle, type Interpretation } from "./content/default-bundle";
import {
  READING_EVALUATION_BUNDLE_SOURCES,
  type ReadingEvaluationBundleSource,
} from "./ai/reading-evaluation.shared";
import {
  validateContentGraph,
  normalizeContentBundle,
  natalCatalogueCoverage,
  type SynthesisRule,
  type NatalLensRule,
} from "./content/schema";
import {
  assembleReading,
  normalizeDepth,
  normalizeTone,
  type ReadingContext,
} from "./reading.server";
import { assertUse, isPermitted, LAUNCH_SOURCES, PROHIBITED_SOURCES, SOURCE_MAP } from "./registry";
import { checkInInputSchema } from "./check-in";
import { daysToLocalDate, localDayString, localNoon, validTimeZone, zonedToUtc } from "./local-day";
import { summarizeReadingQuality, type QualityReading, type QualityFeedback } from "./ai/quality";
import {
  diagnosticLabel,
  LANGUAGE_PROVIDERS,
  type DailyGatewayCode,
  type LanguageProvider,
} from "./ai/diagnostics";
import {
  DAILY_READING_PLAN_VERSION,
  DAILY_PROMPT_VERSION,
  DAILY_VALIDATOR_VERSION,
  LANGUAGE_MODEL,
} from "./ai/diagnostics";
import { readSavedFactAtoms, type FactAtom } from "./ai/facts";
import { NATAL_LENS_PLAN_VERSION } from "./content/natal-lens";
import { validateSavedNatalLens, type SavedNatalLens } from "./content/natal-lens-storage";
import {
  dailyPlanIdentity,
  readDailyPlanIdentity,
  type DailyPlanIdentity,
} from "./content/synthesis";

export { localDayString, zonedToUtc } from "./local-day";

export type DB = DBClient;

// Row shapes for the records plane. SQLite has no generated types, so the
// selects below name what they read.
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

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
export interface ReadingFeedback {
  readingId: string;
  resonance: -1 | 0 | 1;
  labels: string[];
  /** First saved time; subsequent choices update the same reading's row. */
  savedAt: string;
}

function savedReadingFeedback(row: FeedbackRow): ReadingFeedback {
  if (
    ![-1, 0, 1].includes(row.resonance) ||
    !Array.isArray(row.labels) ||
    row.labels.some((label) => typeof label !== "string") ||
    typeof row.created_at !== "string" ||
    !Number.isFinite(Date.parse(row.created_at))
  )
    throw new Error("Your saved rating could not be read. Please retry.");
  // The explicit comparisons narrow the database number without a write cast.
  const resonance = row.resonance === -1 ? -1 : row.resonance === 0 ? 0 : 1;
  return {
    readingId: row.reading_id,
    resonance,
    labels: row.labels,
    savedAt: row.created_at,
  };
}

async function loadReadingFeedback(db: DB, userId: string, readingId: string) {
  const { data, error } = await db
    .from<FeedbackRow>("reading_feedback")
    .select("reading_id, resonance, labels, created_at")
    .eq("user_id", userId)
    .eq("reading_id", readingId)
    .maybeSingle();
  if (error) throw new Error("Your saved rating could not be loaded. Please retry.");
  return data ? savedReadingFeedback(data) : null;
}
interface ReadingRow extends ExistingReadingRow {
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

export async function setConsent(db: DB, userId: string, sourceId: string, granted: boolean) {
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

/** Birth instant, chart fingerprint and calculation input for saved birth details. */
async function birthCalculation(details: BirthDetails, accuracy: TimeAccuracy, timezone: string) {
  const effectiveTime = accuracy === "unknown" ? "12:00" : details.birthTime;
  const utc = zonedToUtc(details.birthDate, effectiveTime, timezone);
  const fp = await fingerprint([
    utc.toISOString(),
    details.latitude.toFixed(4),
    details.longitude.toFixed(4),
    accuracy,
  ]);
  const input: BirthInput = {
    utcISO: utc.toISOString(),
    latitude: details.latitude,
    longitude: details.longitude,
    timezone,
    accuracy,
  };
  return { utc, fp, input };
}

/** One central Swiss request plus the birth-window screen; nothing is persisted. */
async function calculateChart(input: BirthInput, fp: string) {
  const ephem = await resolvePositions({
    jd: toJulianDay(new Date(input.utcISO)),
    utcISO: input.utcISO,
    latitude: input.latitude,
    longitude: input.longitude,
  });
  const chart = computeChart(input, ephem);
  // The same bounded service samples support both assessments; never resample
  // birth data separately for transit anchors.
  const samples = await resolveNatalWindowSamples(input, ephem);
  const natalReliability =
    input.accuracy === "unknown"
      ? unavailableNatalReliability(fp, input.accuracy, "unknown_time")
      : !usableNatalService(ephem)
        ? unavailableNatalReliability(fp, input.accuracy, "service_unavailable")
        : assessNatalReliability(samples, fp, input.accuracy);
  const transitAnchors = assessTransitAnchors(samples, fp, input.accuracy);
  return { chart, natalReliability, transitAnchors };
}

/** Upserts the snapshot for one fingerprint and replaces its derived natal features. */
async function storeChartSnapshot(
  db: DB,
  userId: string,
  dek: CryptoKey,
  birthProfileId: string,
  fp: string,
  chart: Chart,
  natalReliability: NatalReliabilityManifest,
  transitAnchors: TransitAnchorManifest,
) {
  const { data: snap, error: snapErr } = await db
    .from<{ id: string }>("chart_snapshots")
    .upsert(
      {
        user_id: userId,
        birth_profile_id: birthProfileId,
        fingerprint: fp,
        engine: `${chart.engine}@${chart.engineVersion}`,
        contract_version: chart.contractVersion,
        positions: chart.points,
        houses: {
          transitAnchors_ct: await encryptJson(dek, transitAnchors),
          natalReliability_ct: await encryptJson(dek, natalReliability),
          // Attempt time for re-screen backoff; never part of a reading's identity.
          natalReliabilityCheckedAt: new Date().toISOString(),
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
  return snap.id;
}

export async function saveBirth(
  db: DB,
  userId: string,
  details: BirthDetails,
  accuracy: TimeAccuracy,
  timezone: string,
) {
  const dek = await getDek(db, userId);
  const { utc, fp, input: birthInput } = await birthCalculation(details, accuracy, timezone);

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

  const { chart, natalReliability, transitAnchors } = await calculateChart(birthInput, fp);
  const snapshotId = await storeChartSnapshot(
    db,
    userId,
    dek,
    bp.id,
    fp,
    chart,
    natalReliability,
    transitAnchors,
  );

  await db.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", userId);
  await db.from("audit_events").insert({
    user_id: userId,
    kind: "birth_profile.saved",
    detail: { fingerprint: fp, accuracy },
  });

  return { snapshotId, fingerprint: fp };
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

/** Absent (legacy) or stale-version assessments return null; a broken present one fails. */
export async function loadNatalReliability(
  snapshot: SnapshotRow,
  dek: CryptoKey,
): Promise<NatalReliabilityManifest | null> {
  const houses = snapshot.houses as Record<string, unknown> | null;
  if (!houses || !Object.hasOwn(houses, "natalReliability_ct")) return null;
  try {
    if (typeof houses["natalReliability_ct"] !== "string") throw new Error("Invalid envelope");
    const value = await decryptJson<unknown>(dek, houses["natalReliability_ct"]);
    // Another reliability version is stale rather than corrupt: it supplies no lens
    // and becomes eligible for a re-screen.
    const version =
      value && typeof value === "object" ? (value as Record<string, unknown>)["version"] : null;
    if (
      typeof version === "string" &&
      /^natal-reliability-\d+$/.test(version) &&
      version !== NATAL_RELIABILITY_VERSION
    )
      return null;
    return validateNatalReliability(
      value,
      snapshot.fingerprint,
      (snapshot.uncertainty as Chart["uncertainty"]).accuracy,
    );
  } catch {
    throw new Error("Natal source assessment could not be loaded. Please retry.");
  }
}

/** One re-screen attempt per snapshot per window while the service keeps failing. */
export const NATAL_RESCREEN_BACKOFF_MS = 6 * 60 * 60 * 1000;

/**
 * Whether Today may re-run the saved birth calculation: a legacy, stale-version or
 * retryably failed assessment, a configured Swiss service, a known birth time, and
 * no attempt within the backoff window. Never true for an unknown time.
 */
export function natalRescreenDue(
  snapshot: SnapshotRow,
  manifest: NatalReliabilityManifest | null,
  now: Date,
): boolean {
  if (!process.env["SWISS_EPHEMERIS_URL"]) return false;
  const uncertainty = snapshot.uncertainty as Partial<Chart["uncertainty"]> | null;
  if (!uncertainty?.accuracy || uncertainty.accuracy === "unknown") return false;
  if (
    manifest &&
    !(
      manifest.status === "unavailable" &&
      (manifest.reason === "service_unavailable" || manifest.reason === "invalid_sample")
    )
  )
    return false;
  const houses = snapshot.houses as Record<string, unknown> | null;
  const checkedAt = Date.parse(String(houses?.["natalReliabilityCheckedAt"] ?? ""));
  return (
    !Number.isFinite(checkedAt) ||
    checkedAt > now.getTime() ||
    now.getTime() - checkedAt >= NATAL_RESCREEN_BACKOFF_MS
  );
}

/**
 * Re-runs the saved birth calculation (one central Swiss request plus the two
 * boundary samples). Stores the result only when it improves the snapshot: a
 * screened assessment, or a chart that is no longer degraded. Otherwise records the
 * attempt for backoff. Returns whether the stored snapshot changed.
 */
export async function rescreenNatalSnapshot(
  db: DB,
  userId: string,
  snapshot: SnapshotRow,
  dek: CryptoKey,
): Promise<boolean> {
  const { data: profile, error } = await db
    .from<{
      id: string;
      payload_ct: string;
      time_accuracy: string;
      timezone: string;
      fingerprint: string;
    }>("birth_profiles")
    .select("id, payload_ct, time_accuracy, timezone, fingerprint")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile || profile.fingerprint !== snapshot.fingerprint) return false;
  const details = await decryptJson<BirthDetails>(dek, profile.payload_ct);
  const { fp, input } = await birthCalculation(
    details,
    profile.time_accuracy as TimeAccuracy,
    profile.timezone,
  );
  const houses = snapshot.houses as Record<string, unknown> | null;
  if (fp === snapshot.fingerprint) {
    const { chart, natalReliability, transitAnchors } = await calculateChart(input, fp);
    if (
      natalReliability.status === "screened" ||
      (snapshotToChart(snapshot).degraded && !chart.degraded)
    ) {
      await storeChartSnapshot(
        db,
        userId,
        dek,
        profile.id,
        fp,
        chart,
        natalReliability,
        transitAnchors,
      );
      await db.from("audit_events").insert({
        user_id: userId,
        kind: "chart.rescreened",
        detail: { status: natalReliability.status },
      });
      return true;
    }
  }
  const { error: markError } = await db
    .from("chart_snapshots")
    .update({ houses: { ...houses, natalReliabilityCheckedAt: new Date().toISOString() } })
    .eq("id", snapshot.id)
    .eq("user_id", userId);
  if (markError) throw new Error(markError.message);
  return false;
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
export function ephemerisState(chart: Chart, story: DailyTransitCalculation | null = null) {
  return {
    engine: `${chart.engine}@${chart.engineVersion}`,
    precision: chart.precision,
    degraded: chart.degraded,
    degradedReason: chart.degradedReason,
    transitEngine: `${ENGINE_ID}@${ENGINE_VERSION}`,
    eventTiming:
      story?.status === "qualified"
        ? {
            sourceId: story.evidence.scan.sourceId,
            engine: `${story.evidence.scan.source.engine}@${story.evidence.scan.source.engineVersion}`,
            solverVersion: story.evidence.scan.solverVersion,
          }
        : null,
  };
}

export function snapshotToChart(row: SnapshotRow): Chart {
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
    houses?.ephemeris?.precision ?? (engine === "swiss-ephemeris" ? "high" : "approximate");
  return {
    engine: engine ?? "unknown",
    engineVersion: engineVersion ?? "0",
    contractVersion: row.contract_version,
    houseSystem: houses?.system ?? "whole-sign",
    precision,
    degraded: houses?.ephemeris?.degraded ?? precision !== "high",
    degradedReason:
      houses?.ephemeris?.degradedReason ??
      (precision === "high" ? null : "This chart was computed with the in-app approximate engine."),
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

export async function activeBundle(
  db: DB,
  options?: { requireSuccessfulRead: boolean },
): Promise<ContentBundle> {
  const read = () =>
    db
      .from<{ version: string; bundle: JsonValue }>("content_releases")
      .select("version, bundle")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  // One immediate retry absorbs a transient records-plane failure. A failed read never
  // falls back to built-in copy: that would cache Today under the wrong release and
  // base new drafts on the wrong catalogue.
  let { data, error } = await read();
  if (error) ({ data, error } = await read());
  if (error) {
    throw new Error(
      options?.requireSuccessfulRead
        ? "The active interpretation release could not be read. Evaluation stopped."
        : "The active interpretation release could not be read. Please retry.",
    );
  }
  if (!data) return DEFAULT_BUNDLE;
  validateContentGraph(data.bundle);
  return normalizeContentBundle(data.bundle, data.version, DEFAULT_BUNDLE);
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
  facts: FactAtom[];
  interpretationPlan: DailyPlanIdentity | null;
  natalLens?: SavedNatalLens | null;
  transitStory?: SavedTransitStory | null;
}

/** Revives the stored language-layer metadata for a cached reading. */
export async function readingLanguage(
  row: {
    language_mode: string | null;
    language_model: string | null;
    language_meta: JsonValue;
    release_version: string | null;
    primary_cycle_key: string | null;
  },
  dek: CryptoKey,
): Promise<ReadingLanguage> {
  const meta = (row.language_meta ?? {}) as Record<string, unknown>;
  let facts = readSavedFactAtoms(meta["facts"]);
  if (Object.hasOwn(meta, "facts_ct")) {
    try {
      if (typeof meta["facts_ct"] !== "string" || facts.length)
        throw new Error("Invalid private fact boundary");
      facts = readSavedFactAtoms(await decryptJson<unknown>(dek, meta["facts_ct"]));
    } catch {
      throw new Error("Saved reading evidence could not be loaded. Please retry.");
    }
  }
  const citations = Array.isArray(meta["citations"])
    ? (meta["citations"] as ReadingLanguage["citations"])
    : [];
  let natalLens: SavedNatalLens | null = null;
  let natalTemplateParagraph: string | null = null;
  const hasEnvelope = Object.hasOwn(meta, "natal_lens_ct");
  const natalIdentity = meta["natalLensPlan"] as Record<string, unknown> | undefined;
  if (
    hasEnvelope ||
    citations.some((c) => Array.isArray(c?.facts) && c.facts.includes("N1")) ||
    facts.some((f) => f.id === "N1") ||
    (Array.isArray(meta["factOrder"]) && meta["factOrder"].includes("N1")) ||
    natalIdentity?.["status"] === "selected"
  ) {
    try {
      if (
        typeof meta["natal_lens_ct"] !== "string" ||
        facts.some((f) => f.id === "N1") ||
        typeof meta["paragraphs_ct"] !== "string"
      )
        throw new Error("Missing private envelope");
      const paragraphs = await decryptJson<unknown>(dek, meta["paragraphs_ct"]);
      const count = meta["astroParagraphCount"];
      if (
        !Array.isArray(paragraphs) ||
        !paragraphs.every((p) => typeof p === "string") ||
        typeof count !== "number" ||
        count > paragraphs.length
      )
        throw new Error("Missing saved paragraph bounds");
      natalLens = validateSavedNatalLens(
        await decryptJson<unknown>(dek, meta["natal_lens_ct"]),
        facts,
        {
          releaseVersion: row.release_version,
          primaryCycleKey: row.primary_cycle_key,
          mode: row.language_mode === "model" ? "model" : "template",
          citations,
          astroParagraphCount: count,
        },
      );
      if (
        natalIdentity?.["version"] !== NATAL_LENS_PLAN_VERSION ||
        natalIdentity?.["reliabilityVersion"] !== NATAL_RELIABILITY_VERSION ||
        natalIdentity?.["status"] !== "selected"
      )
        throw new Error("Invalid saved natal status");
      if (row.language_mode !== "model") natalTemplateParagraph = paragraphs[0]!;
      facts = [...facts, natalLens.fact];
    } catch {
      throw new Error("Saved natal reading evidence could not be loaded. Please retry.");
    }
  }
  let transitStory: SavedTransitStory | null = null;
  if (
    Object.hasOwn(meta, "transitStoryStatus") ||
    Object.hasOwn(meta, "transit_story_ct") ||
    facts.some((f) => f.id === "A1" || f.id === "P2") ||
    citations.some((c) => c.facts?.some((id) => id === "A1" || id === "P2")) ||
    (Array.isArray(meta["factOrder"]) && meta["factOrder"].some((id) => id === "A1" || id === "P2"))
  ) {
    try {
      if (
        typeof meta["transit_story_ct"] !== "string" ||
        facts.some((f) => f.id === "A1" || f.id === "P2")
      )
        throw new Error("Missing private story envelope");
      const savedStory = await decryptJson<SavedTransitStory>(dek, meta["transit_story_ct"]);
      // An omission has no paragraph evidence. Preserve legacy paragraph recovery,
      // while a selected story and any present corrupt envelope still fail closed.
      const hasParagraphs = Object.hasOwn(meta, "paragraphs_ct");
      if (
        (hasParagraphs || savedStory?.plan?.status === "selected") &&
        typeof meta["paragraphs_ct"] !== "string"
      )
        throw new Error("Missing saved paragraphs");
      const paragraphs = hasParagraphs
        ? await decryptJson<string[]>(dek, meta["paragraphs_ct"] as string)
        : [];
      if (
        !Array.isArray(paragraphs) ||
        !paragraphs.every((p) => typeof p === "string") ||
        (savedStory?.plan?.status === "selected" && typeof meta["astroParagraphCount"] !== "number")
      )
        throw new Error("Invalid paragraphs");
      transitStory = await validateSavedTransitStory(savedStory, facts, {
        releaseVersion: row.release_version,
        primaryCycleKey: row.primary_cycle_key,
        mode: row.language_mode ?? "template",
        paragraphs: paragraphs.slice(
          0,
          typeof meta["astroParagraphCount"] === "number" ? meta["astroParagraphCount"] : 0,
        ),
        citations,
        binding: meta["transitStoryPolicy"] as StoryPolicyBinding,
      });
      facts = [...facts, ...transitStory.facts];
    } catch {
      throw new Error("Saved transit story evidence could not be loaded. Please retry.");
    }
  }
  if (natalLens && row.language_mode !== "model") {
    const primary = facts.find((fact) => fact.id === "I1");
    const prefix = `Published interpretation ${primary?.sourceKey}: `;
    const interpretation = primary?.statement.startsWith(prefix)
      ? primary.statement.slice(prefix.length)
      : null;
    if (
      !consumedNatalTemplate(
        natalTemplateParagraph ?? "",
        interpretation,
        natalLens.plan.lens!.mechanism,
        transitStory?.plan.status === "selected" ? transitStory.plan.chronologySentence : null,
      )
    )
      throw new Error("Saved natal reading evidence could not be loaded. Please retry.");
  }
  if (natalLens || transitStory?.plan.status === "selected") {
    const order = meta["factOrder"];
    if (
      !Array.isArray(order) ||
      order.length !== facts.length ||
      new Set(order).size !== order.length ||
      order.some((id) => typeof id !== "string" || !facts.some((f) => f.id === id))
    )
      throw new Error("Saved reading evidence could not be loaded. Please retry.");
    facts = order.map((id) => facts.find((f) => f.id === id)!);
  }
  return {
    mode: row.language_mode === "model" ? "model" : "template",
    model: row.language_model ?? null,
    citations,
    dropped: typeof meta["dropped"] === "number" ? (meta["dropped"] as number) : 0,
    reason: typeof meta["reason"] === "string" ? (meta["reason"] as string) : null,
    facts,
    interpretationPlan: readDailyPlanIdentity(meta["interpretationPlan"], facts),
    natalLens,
    transitStory,
  };
}

async function savedReadingParagraphs(dek: CryptoKey, row: ExistingReadingRow, body: string) {
  const meta = row.language_meta;
  const encrypted =
    meta && typeof meta === "object" && !Array.isArray(meta) ? meta["paragraphs_ct"] : undefined;
  if (encrypted !== undefined && encrypted !== null) {
    try {
      if (typeof encrypted !== "string") throw new Error("Invalid paragraph envelope");
      const paragraphs = await decryptJson<unknown>(dek, encrypted);
      if (
        !Array.isArray(paragraphs) ||
        !paragraphs.every((paragraph) => typeof paragraph === "string") ||
        paragraphs.join("\n\n") !== body
      )
        throw new Error("Paragraph boundaries do not match the saved reading");
      return { paragraphs, paragraphLinksAvailable: true };
    } catch {
      throw new Error("Reading paragraph sources could not be loaded. Please retry.");
    }
  }
  // Older model text is flattened: blank lines cannot recover its original
  // cited paragraph numbers. Keep it readable without inventing source links.
  return {
    paragraphs: body.split("\n\n"),
    paragraphLinksAvailable: row.language_mode !== "model",
  };
}

function cyclesForLocalDay(chart: Chart, day: string, timeZone: string) {
  return computeCycles(chart, localNoon(day, timeZone)).map((cycle) => ({
    ...cycle,
    days_to_exact: daysToLocalDate(cycle.exact_at, day, timeZone),
  }));
}

export async function getToday(db: DB, userId: string, timeZone: string) {
  let loaded = await loadSnapshot(db, userId);
  if (!loaded) return { needsOnboarding: true as const };

  const dek = await getDek(db, userId);
  const profile = await loadProfile(db, userId);
  const now = new Date();
  const bundle = await activeBundle(db);
  let natalReliability = await loadNatalReliability(loaded, dek);
  // Only an active natal catalogue justifies Swiss traffic here: a legacy, stale or
  // retryably failed screen is re-run before the reading's identity is computed, so
  // the day's first reading already uses the upgraded assessment.
  if (bundle.natalLenses?.length && natalRescreenDue(loaded, natalReliability, now)) {
    try {
      if (await rescreenNatalSnapshot(db, userId, loaded, dek)) {
        const refreshed = (await loadSnapshot(db, userId)) ?? loaded;
        const refreshedReliability = await loadNatalReliability(refreshed, dek);
        loaded = refreshed;
        natalReliability = refreshedReliability;
      }
    } catch (error) {
      // The saved assessment stays authoritative; today's reading still loads.
      console.error("[today] natal re-screen failed", error);
    }
  }
  const snapRow = loaded;
  const transitAnchors = await loadTransitAnchors(snapRow, dek);
  const episodePolicy = transitEpisodePolicy();
  const storyPolicy: StoryPolicyBinding = {
    enabled: episodePolicy.enabled,
    sourceId: episodePolicy.sourceId,
    endpointIdentity: await keyedFingerprint("transit-endpoint", episodePolicy.endpoint),
    anchorIdentity: await keyedFingerprint(
      "transit-anchor-state",
      canonicalStoryValue(transitAnchors),
    ),
  };
  const granted = await grantedSet(db, userId);
  const tz = isPermitted("DEV-01", "timing", granted) ? validTimeZone(timeZone) : "UTC";
  const day = localDayString(now, tz);

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
    checkIn:
      isPermitted("USR-04", "framing", granted) &&
      (checkInRow?.mood != null || checkInRow?.energy != null)
        ? { mood: checkInRow?.mood ?? null, energy: checkInRow?.energy ?? null }
        : null,
    wellness: wellnessAllowed ? { sleep: wellnessState.sleep, stress: wellnessState.stress } : null,
  };
  // Never reuse pre-fix model prose. Context changes get a new immutable row,
  // while old reading IDs and their feedback remain intact. The keyed digest
  // prevents enumerating low-entropy wellbeing bands from a database dump.
  const snapshotHouses = { ...(snapRow.houses as Record<string, unknown>) };
  delete snapshotHouses["natalReliability_ct"];
  delete snapshotHouses["natalReliabilityCheckedAt"];
  delete snapshotHouses["transitAnchors_ct"];
  const contextKey = await keyedFingerprint(userId, {
    version: "daily-privacy-2",
    planVersion: DAILY_READING_PLAN_VERSION,
    natalPlanVersion: NATAL_LENS_PLAN_VERSION,
    storyPlanVersion: DAILY_TRANSIT_STORY_VERSION,
    storySolverVersion: "transit-episode-1",
    storyAnchorVersion: "transit-anchor-1",
    storyPolicy,
    transitAnchors: canonicalStoryValue(transitAnchors),
    promptVersion: DAILY_PROMPT_VERSION,
    validatorVersion: DAILY_VALIDATOR_VERSION,
    model: LANGUAGE_MODEL,
    snapshot: { ...snapRow, houses: snapshotHouses },
    natalReliabilityVersion: NATAL_RELIABILITY_VERSION,
    natalReliability,
    // Published versions are immutable copy identities; archived rows use saved text.
    effectiveCopy: bundle.version,
    timezone: tz,
    tone: ctx.tone,
    depth: ctx.depth,
    localBucket: ctx.localBucket,
    checkIn: ctx.checkIn,
    wellness: ctx.wellness,
    grants: ["USR-01", "USR-02", "USR-04", "WEL-01", "WEL-03", "AMB-02", "DEV-01"].filter((id) =>
      granted.has(id),
    ),
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
    const expectedSources = (existing.language_meta as Record<string, unknown> | null)?.[
      "sourceCount"
    ];
    if (typeof expectedSources === "number" && (srcs ?? []).length !== expectedSources)
      throw new Error("Reading source trail is incomplete. Please try again later.");
    // Recompute against the same snapshot and effective local noon. An empty
    // result is a quiet day; do not resurrect cycles stored for an older chart.
    const cachedChart = snapshotToChart(snapRow);
    const liveCycles = cyclesForLocalDay(cachedChart, day, tz).slice(0, 12);
    const body = await decryptField(dek, existing.body_ct);
    const paragraphState = await savedReadingParagraphs(dek, existing, body);
    const language = await readingLanguage(existing, dek);
    const storyCalculation = language.transitStory
      ? calculationFromStory(language.transitStory)
      : null;

    return {
      needsOnboarding: false as const,
      day,
      timezone: tz,
      reading: {
        id: existing.id,
        headline: existing.headline,
        body,
        ...paragraphState,
        prompt: existing.prompt,
        confidence: existing.confidence,
        primary_cycle_key: existing.primary_cycle_key,
        release_version: existing.release_version,
      },
      language,
      storyCalculation,
      feedback: await loadReadingFeedback(db, userId, existing.id),
      provenance: srcs ?? [],
      cycles: liveCycles,
      uncertainty: snapRow.uncertainty as Chart["uncertainty"],
      ephemeris: ephemerisState(snapshotToChart(snapRow), storyCalculation),
      wellness: wellnessState,
    };
  }

  const chart = snapshotToChart(snapRow);
  const cycles = cyclesForLocalDay(chart, day, tz);

  const initial = assembleReading(chart, cycles, ctx, bundle, natalReliability);
  const episodeCalculation = await resolveTransitForReading(initial, transitAnchors, day, tz);
  const assembled = assembleReading(
    chart,
    cycles,
    ctx,
    bundle,
    natalReliability,
    episodeCalculation,
  );
  const storyCalculation = assembled.storyCalculation;
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
  const paragraphs = [
    ...(prose.body ? prose.paragraphs : []),
    ...(assembled.contextBody ? assembled.contextBody.split("\n\n") : []),
  ];
  const suppliedFacts = readSavedFactAtoms(facts);
  const interpretationPlan = dailyPlanIdentity(assembled.interpretationPlan);
  const natalFact = suppliedFacts.find((f) => f.id === "N1");
  const usedNatalParagraphs = natalFact
    ? prose.meta.mode === "model"
      ? prose.meta.citations.filter((c) => c.facts.includes("N1")).map((c) => c.paragraph)
      : [1]
    : [];
  const natalLens: SavedNatalLens | null = natalFact
    ? {
        version: 1,
        plan: assembled.natalLensPlan,
        fact: natalFact,
        usedParagraphs: usedNatalParagraphs,
      }
    : null;

  const storyFacts = suppliedFacts.filter((f) => f.id === "A1" || f.id === "P2");
  const templateStoryUsage = templateStoryParagraphs(assembled.transitStoryPlan, prose.paragraphs);
  const transitStory: SavedTransitStory = {
    version: 1,
    plan: assembled.transitStoryPlan,
    facts: storyFacts,
    usedParagraphs: {
      A1: storyFacts.length
        ? prose.meta.mode === "model"
          ? prose.meta.citations.filter((c) => c.facts.includes("A1")).map((c) => c.paragraph)
          : templateStoryUsage.A1
        : [],
      P2: storyFacts.length
        ? prose.meta.mode === "model"
          ? prose.meta.citations.filter((c) => c.facts.includes("P2")).map((c) => c.paragraph)
          : templateStoryUsage.P2
        : [],
    },
    timingOverlay:
      assembled.transitStoryPlan.status === "selected"
        ? assembled.transitStoryPlan.evidence.timingOverlay
        : null,
    resultDigest: await storyDigest(assembled.transitStoryPlan, storyPolicy),
  };
  await validateSavedTransitStory(
    transitStory,
    suppliedFacts.filter((f) => f.id !== "A1" && f.id !== "P2"),
    {
      releaseVersion: assembled.release_version,
      primaryCycleKey: assembled.primary_cycle_key,
      mode: prose.meta.mode,
      paragraphs: prose.paragraphs,
      citations: prose.meta.citations,
      binding: storyPolicy,
    },
  );
  const provenance = assembled.provenance.filter(
    (entry) => prose.meta.mode !== "model" || entry.lane !== "content",
  );
  if (prose.meta.mode === "template") {
    for (const entry of provenance.filter((entry) => entry.lane === "content")) {
      const fact = facts.find(
        (f) =>
          (f.sourceKey &&
            entry.label === `${f.id === "S1" ? "Synthesis" : "Interpretation"} ${f.sourceKey}`) ||
          (f.id === "D1" && entry.label === `Domain framing ${assembled.editorial?.domain?.key}`),
      );
      if (fact)
        Object.assign(entry.detail, {
          factId: fact.id,
          ...(fact.kind ? { kind: fact.kind } : {}),
          ...(fact.sourceKey ? { sourceKey: fact.sourceKey } : {}),
          ...(fact.releaseVersion ? { releaseVersion: fact.releaseVersion } : {}),
          ...(fact.dependsOn ? { dependsOn: fact.dependsOn.join(", ") } : {}),
        });
    }
    for (const fact of facts.filter((f) => /^(P1|T1)$/.test(f.id))) {
      provenance.push({
        lane: "content",
        source_id: "AST-05",
        label: `Published template reference · ${fact.id}`,
        detail: {
          factId: fact.id,
          statement: fact.statement,
          bundle: bundle.version,
        },
      });
    }
  }
  if (prose.meta.mode === "model") {
    for (const fact of facts) {
      const paragraphs = prose.meta.citations
        .filter((citation) => citation.facts.includes(fact.id))
        .map((citation) => citation.paragraph);
      if (!paragraphs.length || !/^(I[123]|[DPT]1|S1)$/.test(fact.id)) continue;
      provenance.push({
        lane: "content",
        source_id: "AST-05",
        label: `Published reference cited by language layer · ${fact.id}`,
        detail: {
          statement: fact.statement,
          paragraphs: paragraphs.join(", "),
          bundle: bundle.version,
          factId: fact.id,
          ...(fact.kind ? { kind: fact.kind } : {}),
          ...(fact.sourceKey ? { sourceKey: fact.sourceKey } : {}),
          ...(fact.releaseVersion ? { releaseVersion: fact.releaseVersion } : {}),
          ...(fact.dependsOn ? { dependsOn: fact.dependsOn.join(", ") } : {}),
          ...(fact.id === "S1" ? { relationship: interpretationPlan.synthesis!.relationship } : {}),
        },
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
        cited: prose.meta.citations.map((c) => `${c.paragraph}:${c.facts.join("+")}`).join(" "),
      },
    });
  }
  if (natalLens) {
    validateSavedNatalLens(
      natalLens,
      suppliedFacts.filter((f) => f.id !== "N1"),
      {
        releaseVersion: assembled.release_version,
        primaryCycleKey: assembled.primary_cycle_key,
        mode: prose.meta.mode,
        citations: prose.meta.citations,
        astroParagraphCount: prose.paragraphs.length,
      },
    );
    const origins = new Set([
      "AST-20",
      ...natalLens.plan.lens!.evidence.map((e) =>
        e.kind === "aspect" ? "AST-08" : e.kind === "house" ? "AST-07" : "AST-05",
      ),
    ]);
    for (const source of origins) {
      assertUse(source, "external_language");
      assertUse(source, "provenance");
      provenance.push({
        lane: "content",
        source_id: source,
        label: "Published natal lens reference · N1",
        detail: { factId: "N1", paragraphs: usedNatalParagraphs.join(", ") },
      });
    }
  }

  if (storyFacts.length) {
    for (const entry of provenance) {
      if (
        entry.label === assembled.eligibleCycles[0]?.label ||
        ["C1", "P1", "T1"].includes(String(entry.detail["factId"]))
      )
        entry.detail = {
          factId:
            entry.label === assembled.eligibleCycles[0]?.label
              ? "C1"
              : String(entry.detail["factId"]),
        };
    }
    for (const factId of ["A1", "P2"])
      provenance.push({
        lane: "content",
        source_id: factId === "A1" ? "AST-08" : "AST-05",
        label: `Private calculated story reference · ${factId}`,
        detail: { factId },
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
      language_meta: {
        ...prose.meta,
        facts: storyFacts.length ? [] : suppliedFacts.filter((f) => f.id !== "N1"),
        ...(storyFacts.length
          ? {
              facts_ct: await encryptJson(
                dek,
                suppliedFacts.filter((f) => !["N1", "A1", "P2"].includes(f.id)),
              ),
            }
          : {}),
        transit_story_ct: await encryptJson(dek, transitStory),
        transitStoryPolicy: storyPolicy,
        transitStoryStatus: {
          version: DAILY_TRANSIT_STORY_VERSION,
          status: assembled.transitStoryPlan.status,
          ...(assembled.transitStoryPlan.status === "omitted"
            ? { reason: assembled.transitStoryPlan.reason }
            : {}),
        },
        factOrder: suppliedFacts.map((f) => f.id),
        astroParagraphCount: prose.paragraphs.length,
        natalLensPlan: {
          version: assembled.natalLensPlan.version,
          reliabilityVersion: assembled.natalLensPlan.reliabilityVersion,
          status: assembled.natalLensPlan.status,
        },
        ...(natalLens ? { natal_lens_ct: await encryptJson(dek, natalLens) } : {}),
        interpretationPlan,
        sourceCount: provenance.length,
        // Assistants (MCP) may only receive reading text that used no Tier 3 wellness bands.
        assistantShare: {
          version: 1,
          wellnessUsed:
            provenance.some((p) => p.source_id.startsWith("WEL-")) ||
            /\b(sleep|stress)\b/i.test(`${body}\n${prose.prompt ?? ""}`),
        },
        paragraphs_ct: await encryptJson(dek, paragraphs),
      },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (provenance.length) {
    const { error: sourceError } = await db.from("reading_sources").insert(
      provenance.map((p) => ({
        user_id: userId,
        reading_id: inserted.id,
        lane: p.lane,
        source_id: p.source_id,
        label: p.label,
        detail: p.detail,
      })),
    );
    if (sourceError) {
      // Do not cache a newly generated reading whose source trail was not saved.
      // Only this attempt's row is removed; older readings and feedback survive.
      const { error: cleanupError } = await db
        .from("daily_readings")
        .delete()
        .eq("id", inserted.id)
        .eq("user_id", userId);
      if (cleanupError)
        throw new Error(
          "Reading sources could not be saved, and the incomplete reading could not be removed.",
        );
      throw new Error("Reading sources could not be saved. Please retry.");
    }
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
      paragraphs,
      paragraphLinksAvailable: true,
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
      interpretationPlan,
      natalLens,
      transitStory,
    },
    storyCalculation,
    feedback: await loadReadingFeedback(db, userId, inserted.id),
    provenance,
    cycles: topCycles,
    uncertainty: chart.uncertainty,
    ephemeris: ephemerisState(chart, storyCalculation),
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
  const details = await decryptJson<BirthDetails & { utcISO?: string }>(dek, data.payload_ct);
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
  const needsUpgrade = !storedSystem || storedSystem === "whole-sign" || !storedHouses?.sources;
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
  const [{ data: features }, birth, narrativeContext] = await Promise.all([
    db
      .from<FeatureRow>("natal_features")
      .select("feature_key, family, title, strength, payload")
      .eq("snapshot_id", snapRow.id)
      .order("strength", { ascending: false }),
    loadBirthRecord(db, userId),
    featureNarrativeContext(db, userId, snapRow, chart),
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
    narrativeCacheKey: narrativeContext.cacheKey,
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
  const { error } = await db.from("life_events").delete().eq("user_id", userId).eq("id", id);
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
  if (
    ![-1, 0, 1].includes(resonance) ||
    !Array.isArray(labels) ||
    labels.length > 6 ||
    labels.some((label) => typeof label !== "string")
  )
    throw new Error("Choose Yes, Mixed, or No before saving your rating.");
  const { data: reading, error: readingError } = await db
    .from<{ id: string }>("daily_readings")
    .select("id")
    .eq("user_id", userId)
    .eq("id", readingId)
    .maybeSingle();
  if (readingError) throw new Error("The reading could not be checked. Please retry your rating.");
  if (!reading) throw new Error("Reading not found for your account.");
  const { data: saved, error } = await db
    .from<FeedbackRow>("reading_feedback")
    .upsert(
      { user_id: userId, reading_id: readingId, resonance, labels },
      { onConflict: "user_id,reading_id" },
    )
    .select("reading_id, resonance, labels, created_at")
    .single();
  if (error || !saved) throw new Error("Your rating could not be saved. Please retry.");
  return { ok: true as const, feedback: savedReadingFeedback(saved) };
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
    .from<{ payload_ct: string; time_accuracy: string; timezone: string; created_at: string }>(
      "birth_profiles",
    )
    .select("payload_ct, time_accuracy, timezone, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: readings, error: readingsError } = await db
    .from<ReadingRow>("daily_readings")
    .select(
      "id, reading_date, headline, body_ct, prompt, confidence, release_version, primary_cycle_key, language_mode, language_model, language_meta",
    )
    .eq("user_id", userId)
    .order("reading_date", { ascending: false });
  if (readingsError) throw new Error("Saved readings could not be exported. Please retry.");
  const { data: audit } = await db
    .from<AuditRow>("audit_events")
    .select("kind, detail, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  // A row whose saved text or evidence cannot be read is exported with an explicit
  // marker instead of blocking every other row; nothing is reconstructed for it.
  const exportedReadings = await Promise.all(
    (readings ?? []).map(async (r) => {
      const unreadable: ("body" | "paragraphs" | "language")[] = [];
      const body = await decryptField(dek, r.body_ct).catch(() => {
        unreadable.push("body");
        return null;
      });
      const paragraphState =
        body === null
          ? null
          : await savedReadingParagraphs(dek, r, body).catch(() => {
              unreadable.push("paragraphs");
              return null;
            });
      const language = await readingLanguage(r, dek).catch(() => {
        unreadable.push("language");
        return null;
      });
      return {
        reading_date: r.reading_date,
        headline: r.headline,
        body,
        prompt: r.prompt,
        confidence: r.confidence,
        release_version: r.release_version,
        id: r.id,
        primary_cycle_key: r.primary_cycle_key,
        language,
        ...(paragraphState ?? {}),
        ...(unreadable.length ? { unreadable } : {}),
      };
    }),
  );

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
    transitAnchors: await (async () => {
      const { data, error } = await db
        .from<SnapshotRow>("chart_snapshots")
        .select("id,fingerprint,houses,uncertainty")
        .eq("user_id", userId);
      if (error) throw new Error("Chart evidence could not be exported. Please retry.");
      return Promise.all(
        (data ?? []).map(async (snapshot) => ({
          snapshotId: snapshot.id,
          manifest: await loadTransitAnchors(snapshot, dek),
        })),
      );
    })(),
    readings: exportedReadings,
    unreadableReadings: exportedReadings.filter((r) => "unreadable" in r).length,
    journal,
    audit: audit ?? [],
  };
}

export async function eraseEverything(db: DB, userId: string) {
  clearTimingCalculations(userId);
  for (const table of [
    "reading_feedback",
    "reading_sources",
    "daily_readings",
    "cycle_instances",
    "natal_features",
    // Chapter essays keep plaintext feature keys (for example a natal aspect or a
    // stellium sign) that would outlive the encryption key.
    "feature_narratives",
    "chart_snapshots",
    "context_signals",
    "check_ins",
    "life_events",
    "source_consents",
    "birth_profiles",
  ] as const) {
    const { error } = await db.from(table).delete().eq("user_id", userId);
    if (error) throw new Error("Personal data could not be fully deleted. Please retry.");
  }
  // The audit trail keeps that a birth profile was saved, but not its birth-derived
  // fingerprint, which an unkeyed hash of the birth time and place would otherwise keep.
  const { error: auditError } = await db
    .from("audit_events")
    .update({ detail: {} })
    .eq("user_id", userId)
    .eq("kind", "birth_profile.saved");
  if (auditError) throw new Error("Personal data could not be fully deleted. Please retry.");
  const { error } = await db
    .from("profiles")
    .update({ wrapped_dek: null, onboarded_at: null })
    .eq("id", userId);
  if (error) throw new Error("The account encryption key could not be deleted. Please retry.");
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
  const bundle = await activeBundle(db),
    dek = await getDek(db, userId),
    anchor = await loadTransitAnchors(snapRow, dek);
  const initial = assembleReading(
    chart,
    cycles,
    { granted, tone: "plain", depth: "standard", localBucket: null, checkIn: null, wellness: null },
    bundle,
  );
  const episodePolicy = transitEpisodePolicy();
  const selectionKey = await keyedFingerprint(
    "transit-timing-selection",
    canonicalStoryValue({
      userId,
      snapshotId: snapRow.id,
      fingerprint: snapRow.fingerprint,
      referenceDay,
      timezone,
      anchor,
      primary: initial.eligibleCycles[0] ?? null,
      release: bundle.version,
      chapters: bundle.transitChapters,
      storyVersion: DAILY_TRANSIT_STORY_VERSION,
      episodePolicy,
    }),
  );
  const episodeCalculation = await cachedTimingCalculation(userId, selectionKey, () =>
    resolveTransitForReading(initial, anchor, referenceDay, timezone),
  );
  const selected = assembleReading(
    chart,
    cycles,
    { granted, tone: "plain", depth: "standard", localBucket: null, checkIn: null, wellness: null },
    bundle,
    null,
    episodeCalculation,
  );
  const storyCalculation = selected.storyCalculation;
  return {
    needsOnboarding: false as const,
    day: referenceDay,
    timezone,
    referenceAt,
    engine: `${chart.engine}@${chart.engineVersion}`,
    contractVersion: chart.contractVersion,
    computedAt: new Date().toISOString(),
    uncertainty: chart.uncertainty,
    ephemeris: ephemerisState(chart, storyCalculation),
    storyCalculation,
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
    const cyclesCount = Array.isArray(bundle["cycles"])
      ? (bundle["cycles"] as unknown[]).length
      : 0;
    const rulesCount = Array.isArray(bundle["synthesisRules"])
      ? (bundle["synthesisRules"] as unknown[]).length
      : 0;
    const natal = bundle["natal"];
    const natalCount = natal && typeof natal === "object" ? Object.keys(natal).length : 0;
    const phases = bundle["phases"];
    const domains = bundle["domains"];
    const entries =
      cyclesCount +
      rulesCount +
      natalCount +
      (phases && typeof phases === "object" ? Object.keys(phases).length : 0) +
      (domains && typeof domains === "object" ? Object.keys(domains).length : 0);
    return {
      id: r.id,
      version: r.version,
      checksum: r.checksum,
      created_at: r.created_at,
      is_active: r.is_active,
      families: keys.length,
      entries,
      cycles: cyclesCount,
      synthesisRules: rulesCount,
      schemaVersion:
        bundle["schemaVersion"] === 4
          ? 4
          : bundle["schemaVersion"] === 3
            ? 3
            : bundle["schemaVersion"] === 2
              ? 2
              : 1,
      transitChapters: Array.isArray(bundle["transitChapters"])
        ? bundle["transitChapters"].length
        : 0,
      natalLensCoverage: natalCatalogueCoverage(
        Array.isArray(bundle["natalLenses"]) ? (bundle["natalLenses"] as NatalLensRule[]) : [],
      ),
      natal: natalCount,
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

/** Read-only fixed synthetic evaluation: no user chart, context or reading records. */
export async function runReadingEvaluationCase(
  db: DB,
  userId: string,
  caseId: string,
  bundleSource: ReadingEvaluationBundleSource = "active",
  provider: LanguageProvider = "lovable",
) {
  if (!(await isAdmin(db, userId))) {
    throw new Error("Only admins can run a synthetic reading evaluation.");
  }
  return evaluateFixedCase(db, caseId, bundleSource, provider);
}

/** One fixed synthetic case; callers have already established admin authority. */
export async function evaluateFixedCase(
  db: DB,
  caseId: string,
  bundleSource: ReadingEvaluationBundleSource,
  provider: LanguageProvider,
) {
  if (!(READING_EVALUATION_BUNDLE_SOURCES as readonly unknown[]).includes(bundleSource))
    throw new Error("Unknown synthetic evaluation bundle.");
  if (!(LANGUAGE_PROVIDERS as readonly unknown[]).includes(provider))
    throw new Error("Unknown language provider.");
  const evaluation = await import("./ai/reading-evaluation.server");
  // Evaluation-only copy choice. Shipped baseline/candidates need no records read; nothing
  // here publishes, activates or caches content, so production copy is unaffected.
  const bundle =
    bundleSource === "builtin"
      ? DEFAULT_BUNDLE
      : bundleSource === "natal-candidate"
        ? (await import("./content/natal-candidate-bundle")).NATAL_CANDIDATE_BUNDLE
        : bundleSource === "transit-candidate"
          ? (await import("./content/transit-candidate-bundle")).TRANSIT_CANDIDATE_BUNDLE
          : await activeBundle(db, { requireSuccessfulRead: true });
  const result = await evaluation.runSyntheticEvaluationCase(caseId, bundle, provider);
  return { ...result, metadata: { ...result.metadata, bundleSource } };
}

/** Which admin language providers have a server key; never returns key material. */
export async function listLanguageProviders(db: DB, userId: string) {
  if (!(await isAdmin(db, userId))) {
    throw new Error("Only admins can view language providers.");
  }
  const { languageProviderStatus } = await import("./ai/language.server");
  return { providers: languageProviderStatus() };
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
    .from<{
      id: string;
      version: string;
      checksum: string;
      bundle: Record<string, unknown> | null;
    }>("content_releases")
    .select("id, version, checksum, bundle")
    .eq("id", releaseId)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (!target) throw new Error("That release no longer exists.");

  validateContentGraph(target.bundle);

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

interface NarrativeFact {
  id: string;
  statement: string;
}

/** Share the exact effective tone and essay policy between page and chapter caches. */
export async function featureNarrativeContext(db: DB, userId: string, snap: SnapshotRow, chart: Chart) {
  const [profile, granted, { FEATURE_ESSAY_VERSION }] = await Promise.all([
    loadProfile(db, userId),
    grantedSet(db, userId),
    import("./ai/language.server"),
  ]);
  const tone = isPermitted("USR-01", "external_language", granted)
    ? normalizeTone(profile.tone_pref ?? "plain")
    : "plain";
  const essayKey = `${FEATURE_ESSAY_VERSION}|${chart.houseSystem}|${chart.engineVersion}|${chart.jd}|${tone}`;
  const cacheKey = await fingerprint(["natal-chapter", userId, snap.id, essayKey]);
  return { tone, essayKey, cacheKey };
}

const NARRATIVE_ENVELOPE = "pattern-natal-evidence-1";

/** Older encrypted essays remain readable, without inventing their original inputs. */
export function unpackNarrative(plaintext: string): {
  narrative: string;
  paragraphs: string[];
  facts: NarrativeFact[];
  evidenceAvailable: boolean;
} {
  let value: unknown;
  try {
    value = JSON.parse(plaintext);
  } catch {
    return {
      narrative: plaintext,
      paragraphs: plaintext.split("\n\n"),
      facts: [],
      evidenceAvailable: false,
    };
  }
  if (
    value &&
    typeof value === "object" &&
    "format" in value &&
    value.format === NARRATIVE_ENVELOPE
  ) {
    if (
      !("narrative" in value) ||
      typeof value.narrative !== "string" ||
      !("paragraphs" in value) ||
      !Array.isArray(value.paragraphs) ||
      !value.paragraphs.every((paragraph) => typeof paragraph === "string") ||
      value.paragraphs.join("\n\n") !== value.narrative ||
      !("facts" in value) ||
      !Array.isArray(value.facts) ||
      !value.facts.every(
        (fact) =>
          fact &&
          typeof fact === "object" &&
          typeof fact.id === "string" &&
          typeof fact.statement === "string",
      )
    )
      throw new Error("This saved chapter could not be loaded. Please try again.");
    return {
      narrative: value.narrative,
      paragraphs: value.paragraphs,
      facts: value.facts,
      evidenceAvailable: true,
    };
  }
  return {
    narrative: plaintext,
    paragraphs: plaintext.split("\n\n"),
    facts: [],
    evidenceAvailable: false,
  };
}

/** Map the gateway's closed labels to recovery guidance, never expose raw errors. */
function unavailableNarrative(reason: string | null) {
  const transientCodes: DailyGatewayCode[] = [
    "timeout",
    "http",
    "rate_limit",
    "network",
    "bad_json",
    "empty_response",
  ];
  if (transientCodes.some((code) => diagnosticLabel(code) === reason)) {
    return {
      available: false as const,
      retryable: true,
      reason:
        reason === diagnosticLabel("timeout")
          ? "This chapter took too long to prepare. You can try again."
          : "The writing service could not finish this chapter. You can try again.",
    };
  }
  return {
    available: false as const,
    retryable: false,
    reason:
      reason === "generated narrative failed fact verification"
        ? "No verified reading could be written from this structure's calculated values."
        : "Chapter writing is currently unavailable. The calculated values are still available.",
  };
}

/**
 * Narrative for one natal chapter, cached per chart snapshot. Generated from
 * the structure's own payload only, verified claim-by-claim, and stored
 * encrypted like every other piece of written output.
 */
export async function getFeatureNarrative(db: DB, userId: string, featureKey: string) {
  const snapRow = await loadSnapshot(db, userId);
  if (!snapRow)
    return { available: false as const, retryable: false, reason: "No chart calculated yet." };

  const dek = await getDek(db, userId);

  const { generateFeatureNarrative } = await import("./ai/language.server");

  const chartForKey = snapshotToChart(snapRow);
  // Chapters are tied to the exact chart they were written from: a recalculated
  // chart (new house system, engine version) invalidates every saved essay.
  const { tone, essayKey, cacheKey } = await featureNarrativeContext(
    db,
    userId,
    snapRow,
    chartForKey,
  );

  const { data: cached, error: cacheError } = await db
    .from<NarrativeRow>("feature_narratives")
    .select("feature_key, mode, model, narrative_ct, citations, essay_version")
    .eq("user_id", userId)
    .eq("snapshot_id", snapRow.id)
    .eq("feature_key", featureKey)
    .maybeSingle();
  if (cacheError) throw new Error("This chapter could not be loaded. Please try again.");

  // A chapter written under an older essay brief is discarded rather than
  // served: the reader should always get the current depth of writing.
  if (cached && cached.essay_version !== essayKey) {
    const { error } = await db
      .from("feature_narratives")
      .delete()
      .eq("user_id", userId)
      .eq("snapshot_id", snapRow.id)
      .eq("feature_key", featureKey);
    if (error) throw new Error("This chapter could not be refreshed. Please try again.");
  } else if (cached) {
    return {
      available: true as const,
      featureKey,
      cacheKey,
      ...unpackNarrative(await decryptField(dek, cached.narrative_ct)),
      mode: cached.mode === "model" ? ("model" as const) : ("template" as const),
      model: cached.model,
      citations: (Array.isArray(cached.citations) ? cached.citations : []) as {
        paragraph: number;
        facts: string[];
      }[],
      reason: null as string | null,
    };
  }

  const { data: feature, error: featureError } = await db
    .from<FeatureRow>("natal_features")
    .select("feature_key, family, title, strength, payload")
    .eq("snapshot_id", snapRow.id)
    .eq("feature_key", featureKey)
    .maybeSingle();
  if (featureError)
    throw new Error("This chapter's calculated values could not be loaded. Please try again.");
  if (!feature) {
    return {
      available: false as const,
      retryable: false,
      reason: "That structure is not in this chart.",
    };
  }

  const chart = snapshotToChart(snapRow);
  const { featureFacts } = await import("./ai/facts");
  for (const source of ["AST-05", "AST-07", "AST-08", "AST-20"])
    assertUse(source, "external_language");

  const { data: others, error: relatedError } = await db
    .from<FeatureRow>("natal_features")
    .select("feature_key, family, title, strength, payload")
    .eq("snapshot_id", snapRow.id)
    .order("strength", { ascending: false })
    .limit(4);
  if (relatedError)
    throw new Error("This chapter's related structures could not be loaded. Please try again.");
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
    return unavailableNarrative(written.meta.reason);
  }

  const { error: saveError } = await db.from("feature_narratives").insert({
    user_id: userId,
    snapshot_id: snapRow.id,
    feature_key: featureKey,
    mode: written.meta.mode,
    model: written.meta.model,
    narrative_ct: await encryptJson(dek, {
      format: NARRATIVE_ENVELOPE,
      narrative: written.narrative,
      paragraphs: written.paragraphs,
      facts,
    }),
    citations: written.meta.citations,
    essay_version: essayKey,
  });
  if (saveError) throw new Error("This chapter could not be saved. Please try again.");

  return {
    available: true as const,
    featureKey,
    cacheKey,
    narrative: written.narrative,
    paragraphs: written.paragraphs,
    facts,
    evidenceAvailable: true,
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
  ...[
    "saturn",
    "jupiter",
    "mars",
    "venus",
    "mercury",
    "sun",
    "moon",
    "uranus",
    "neptune",
    "pluto",
  ].flatMap((body) =>
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
    const bundle = (d.bundle ?? {}) as Partial<ContentBundle>;
    const cycles = Array.isArray(bundle["cycles"]) ? bundle["cycles"] : [];
    const synthesisRules = Array.isArray(bundle["synthesisRules"]) ? bundle["synthesisRules"] : [];
    const themeCount = cycles.reduce(
      (acc, c) => acc + (Array.isArray(c.themes) ? c.themes.length : 0),
      0,
    );
    const notes = (d.notes ?? {}) as Record<string, unknown>;
    const reviewReq = notes["synthesisReviewRequired"];
    const affected = notes["affectedKeys"];
    return {
      id: d.id,
      base_version: d.base_version,
      model: d.model,
      created_at: d.created_at,
      notes: d.notes,
      entries: cycles,
      synthesisRules,
      transitChapters: Array.isArray(bundle["transitChapters"])
        ? bundle["transitChapters"].length
        : 0,
      natalLensCoverage: natalCatalogueCoverage(bundle.natalLenses),
      themeCount,
      ruleCount: synthesisRules.length,
      schemaVersion: bundle.schemaVersion ?? 1,
      affectedKeys: Array.isArray(affected) ? (affected as string[]) : [],
      removedRules: Array.isArray(reviewReq) ? (reviewReq as string[]) : [],
    };
  });
}

/**
 * Drafts a full interpretation release with the language layer. Nothing is
 * published: the draft is stored for review, and publishing it creates an
 * ordinary content release that the existing rollback controls can activate.
 */
export async function draftRelease(db: DB, userId: string, provider: LanguageProvider = "lovable") {
  if (!(await isAdmin(db, userId))) {
    throw new Error("Only admins can draft a release.");
  }
  if (!(LANGUAGE_PROVIDERS as readonly unknown[]).includes(provider))
    throw new Error("Unknown language provider.");

  const base = await activeBundle(db);
  const { generateBundleEntries } = await import("./ai/language.server");
  // Only the reusable family slots are redrafted. Reviewed exact-aspect entries
  // and the synthesis rules that depend on them stay with editorial review.
  const drafted = await generateBundleEntries(DRAFT_SLOTS, provider);

  // A repeated or unpublishable entry is dropped on its own rather than
  // discarding every other entry in the draft.
  const draftedMap = new Map<string, Interpretation>();
  for (const entry of drafted.entries) {
    if (draftedMap.has(entry.key)) continue;
    try {
      validateContentGraph({ cycles: [entry] });
    } catch {
      continue;
    }
    draftedMap.set(entry.key, entry);
  }
  const dropped = drafted.dropped + drafted.entries.length - draftedMap.size;

  if (draftedMap.size === 0) {
    throw new Error("The language layer returned no usable entries; nothing was drafted.");
  }

  const changedKeys = new Set(draftedMap.keys());

  const mergedCycles: Interpretation[] = base.cycles.map((baseCycle) => {
    const replacement = draftedMap.get(baseCycle.key);
    if (replacement) {
      return {
        key: baseCycle.key,
        mechanism: replacement.mechanism,
        question: replacement.question,
        themes: [], // Cleared theme approval on changed text
      };
    }
    return {
      key: baseCycle.key,
      mechanism: baseCycle.mechanism,
      question: baseCycle.question,
      themes: baseCycle.themes ? [...baseCycle.themes] : [],
    };
  });

  const existingCycleKeys = new Set(base.cycles.map((c) => c.key));
  for (const draftedEntry of draftedMap.values()) {
    if (!existingCycleKeys.has(draftedEntry.key)) {
      mergedCycles.push({
        key: draftedEntry.key,
        mechanism: draftedEntry.mechanism,
        question: draftedEntry.question,
        themes: [],
      });
    }
  }

  const baseRules = base.synthesisRules ?? [];
  const removedRuleKeys: string[] = [];
  const survivingRules: SynthesisRule[] = [];

  for (const rule of baseRules) {
    if (
      changedKeys.has(rule.primary.interpretationKey) ||
      changedKeys.has(rule.supporting.interpretationKey)
    ) {
      removedRuleKeys.push(rule.key);
    } else {
      survivingRules.push(rule);
    }
  }

  const bundle: ContentBundle = {
    version: "pending",
    schemaVersion: base.schemaVersion === 4 ? 4 : base.schemaVersion === 3 ? 3 : 2,
    phases: base.phases,
    natal: base.natal,
    domains: base.domains,
    cycles: mergedCycles,
    synthesisRules: survivingRules,
    natalLenses: structuredClone(base.natalLenses ?? []),
    transitChapters: structuredClone(base.transitChapters ?? []),
  };

  validateContentGraph(bundle);

  const themeCount = mergedCycles.reduce((acc, c) => acc + (c.themes?.length ?? 0), 0);

  const { data: inserted, error } = await db
    .from<{ id: string }>("content_drafts")
    .insert({
      user_id: userId,
      base_version: base.version,
      model: drafted.model,
      bundle: bundle,
      notes: {
        requested: DRAFT_SLOTS.length,
        returned: draftedMap.size,
        dropped,
        flagged: drafted.flagged.length,
        affectedKeys: Array.from(changedKeys),
        synthesisReviewRequired: removedRuleKeys,
        themeCount,
        ruleCount: survivingRules.length,
      },
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await db.from("audit_events").insert({
    user_id: userId,
    kind: "content_draft_generated",
    detail: { model: drafted.model, entries: draftedMap.size },
  });

  return {
    id: inserted.id,
    entries: draftedMap.size,
    dropped,
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

  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  const version = `ai-${stamp}`;
  const bundle = { ...((draft.bundle ?? {}) as Record<string, unknown>), version };
  validateContentGraph(bundle);
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
    .select(
      "id, user_id, reading_date, created_at, strftime('%Y-%m-%dT%H:%M:%fZ', created_at) as generated_at, julianday(created_at) as generated_sort, release_version, language_mode, language_model, language_meta",
    )
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
    (consents ?? [])
      .filter((row) =>
        isPermitted("USR-15", "quality_measurement", new Set(row.granted ? ["USR-15"] : [])),
      )
      .map((row) => row.user_id),
  );
  let feedback: QualityFeedback[] = [];
  if (optedInUsers.size) {
    // Ownership is checked again by the summary. Only numeric scores are read.
    const result = await db
      .from<QualityFeedback>("reading_feedback")
      .select("reading_id, user_id, resonance")
      .in(
        "reading_id",
        rows.filter((row) => optedInUsers.has(row.user_id)).map((row) => row.id),
      )
      .in("user_id", [...optedInUsers]);
    if (result.error) throw new Error(result.error.message);
    feedback = result.data ?? [];
  }
  return summarizeReadingQuality(rows, userId, feedback, optedInUsers, (data ?? []).length > 300);
}
