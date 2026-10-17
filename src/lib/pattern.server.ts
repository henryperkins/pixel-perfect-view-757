import {
  cachedTimingCalculation,
  clearTimingCalculations,
} from "./astro/transit-timing-cache.server";
import { resolveTransitForReading, transitEpisodePolicy } from "./astro/transit-episodes.server";
import { invalidateDailyWritingFrames } from "./content/daily-writing-invalidation";
import { composeDailyWritingTemplate } from "./content/daily-writing-template";
import {
  readSavedDailyWriting,
  validateSavedDailyWriting,
  dailyEditorialDigest,
  type SavedDailyWriting,
  type SavedWritingState,
} from "./content/daily-writing-storage.server";
import { DAILY_WRITING_PLAN_VERSION } from "./content/daily-writing";
import { DAILY_REFLECTION_VERSION } from "./content/daily-reflection";
import {
  DAILY_WRITING_QUALITY_VERSION,
  type RecentDailyWritingHistory,
} from "./ai/daily-writing-quality";
import {
  DAILY_VOICE_EXAMPLES_VERSION,
  EDITORIAL_DAILY_PROMPT_VERSION,
  EDITORIAL_DAILY_VALIDATOR_VERSION,
  EDITORIAL_DAILY_VOICE_VERSION,
} from "./ai/daily-voice";
import { CONCRETE_DAILY_PROMPT_VERSION, CONCRETE_DAILY_VALIDATOR_VERSION } from "./ai/diagnostics";
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
import { execBatch } from "./d1.server";
import {
  contextUseAllowed,
  isLifeDomain,
  type LifeDomain,
  type LocalReadingContext,
} from "./context-policy";
import {
  CONTEXT_STORAGE_VERSION,
  civilContextFresh,
  recordContextFresh,
  finiteContextExpiry,
  legacyContextUnavailable,
  savedLocalContext,
  savedSourceAllowed,
} from "./retention.server";

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
import { loadTransitAnchors, ensureTransitAnchors } from "./astro/transit-anchors.server";
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
import {
  loadMemberContextRollout,
  memberContextRolloutIdentity,
} from "./ai/member-context-rollout.server";
import { memberContextMode, prepareMemberContextReading } from "./ai/member-context-reading";
import { assertReviewedContextSources } from "./ai/daily-context-writing";
import type { ReadingProseInput } from "./ai/language.server";
import {
  PRIMARY_COMPOSITION_VERSION,
  PRIMARY_REFLECTION_VERSION,
} from "./content/primary-composition";
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
  domain_pref: LifeDomain | null;
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
  snapshot_id?: string;
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
  context_version?: string | null;
  local_context_ct?: string | null;
  local_context_sources?: JsonValue;
  local_context_expires_at?: string | null;
  mixed_context_expires_at?: string | null;
  retention_state?: string | null;
  created_at?: string;
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
  updated_at?: string | null;
  revision: number;
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
  if (!data) return null;
  const feedback = savedReadingFeedback(data);
  return recordContextFresh(data.created_at, 730, new Date()) ? feedback : null;
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
  checksum_algorithm: string | null;
  publication_state: import("./content/release-lifecycle.server").PublicationState | null;
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
  const key = await unwrapDek(wrapped);
  db.bindOwnerKey(userId, wrapped);
  return key;
}

export async function loadProfile(db: DB, userId: string) {
  const { data, error } = await db
    .from<ProfileRow>("profiles")
    .select("id, display_name, tone_pref, depth_pref, domain_pref, onboarded_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error("Your preferences could not be loaded. Please retry.");
  if (data) return data;
  const created = await db.from("profiles").upsert({ id: userId }, { onConflict: "id" });
  if (created.error) throw new Error("Your preferences could not be initialized. Please retry.");
  return {
    id: userId,
    display_name: null,
    tone_pref: "plain",
    depth_pref: "standard",
    domain_pref: null,
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
  if (granted && (def.available === false || def.phase !== "launch")) {
    throw new Error("This context source is not available yet.");
  }

  const now = new Date().toISOString();
  await execBatch([
    {
      sql: "INSERT INTO source_consents(id,user_id,source_id,tier,granted,granted_at,revoked_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,source_id) DO UPDATE SET id=excluded.id,tier=excluded.tier,granted=excluded.granted,granted_at=excluded.granted_at,revoked_at=excluded.revoked_at,updated_at=excluded.updated_at",
      params: [
        crypto.randomUUID(),
        userId,
        sourceId,
        def.tier,
        granted ? 1 : 0,
        granted ? now : null,
        granted ? null : now,
        now,
        now,
      ],
    },
    {
      sql: "INSERT INTO audit_events(id,user_id,kind,detail,created_at) VALUES (?,?,?,?,?)",
      params: [
        crypto.randomUUID(),
        userId,
        granted ? "consent.granted" : "consent.revoked",
        JSON.stringify({ source_id: sourceId, tier: def.tier }),
        now,
      ],
    },
    ...(!granted
      ? [
          {
            sql: "DELETE FROM context_signals WHERE user_id=? AND (source_id=? OR (?='DEV-02' AND source_id='AMB-05'))",
            params: [userId, sourceId, sourceId],
          },
          {
            sql: "DELETE FROM reading_sources AS s WHERE s.user_id=? AND EXISTS(SELECT 1 FROM daily_readings d WHERE d.id=s.reading_id AND d.user_id=s.user_id AND d.context_version=? AND EXISTS(SELECT 1 FROM json_each(d.local_context_sources) WHERE value=?) AND s.source_id IN (SELECT value FROM json_each(d.local_context_sources)))",
            params: [userId, CONTEXT_STORAGE_VERSION, sourceId],
          },
          {
            sql: "UPDATE daily_readings SET language_meta=json_set(CASE WHEN json_valid(language_meta) THEN language_meta ELSE '{}' END,'$.sourceCount',(SELECT COUNT(*) FROM reading_sources s WHERE s.reading_id=daily_readings.id AND s.user_id=daily_readings.user_id)),local_context_ct=NULL,local_context_sources='[]',local_context_expires_at=NULL WHERE user_id=? AND context_version=? AND EXISTS(SELECT 1 FROM json_each(local_context_sources) WHERE value=?)",
            params: [userId, CONTEXT_STORAGE_VERSION, sourceId],
          },
          {
            sql: "UPDATE daily_readings SET language_meta=json_set(json_remove(language_meta,'$.daily_writing_ct','$.dailyWritingRetention'),'$.dailyWritingStatus','unavailable','$.daily_writing_unavailable',json('{\"version\":1,\"reason\":\"revoked\"}')) WHERE user_id=? AND json_valid(language_meta) AND EXISTS(SELECT 1 FROM json_each(language_meta,'$.dailyWritingRetention.sourceIds') WHERE value=?)",
            params: [userId, sourceId],
          },
        ]
      : []),
  ]);
  return { source_id: sourceId, granted };
}

// ---------------------------------------------------------------------------
// birth profile + chart
// ---------------------------------------------------------------------------

/** Birth instant, chart fingerprint and calculation input for saved birth details. */
export async function birthCalculation(
  details: BirthDetails,
  accuracy: TimeAccuracy,
  timezone: string,
) {
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
export async function calculateChart(input: BirthInput, fp: string) {
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

export interface ChartPrecisionSummary {
  engine: string;
  precision: Chart["precision"];
  houseSystem: string;
  timeAccuracy: TimeAccuracy;
  housesSupported: boolean;
  anglesSupported: boolean;
}
export interface BirthChangeSummary {
  changedFields: ("date" | "time" | "accuracy" | "place")[];
  previous: ChartPrecisionSummary | null;
  current: ChartPrecisionSummary;
  unchanged: boolean;
}
function chartPrecisionSummary(chart: Chart): ChartPrecisionSummary {
  return {
    engine: `${chart.engine}@${chart.engineVersion}`,
    precision: chart.precision,
    houseSystem: chart.houseSystem,
    timeAccuracy: chart.uncertainty.accuracy,
    housesSupported: chart.uncertainty.housesReliable,
    anglesSupported: !chart.uncertainty.angleClaimsSuppressed,
  };
}
interface SavedBirthRow {
  id: string;
  payload_ct: string;
  time_accuracy: string;
  timezone: string;
  fingerprint: string;
}
async function birthRevision(
  userId: string,
  row: Pick<SavedBirthRow, "payload_ct" | "time_accuracy" | "timezone">,
) {
  return keyedFingerprint(userId, {
    scope: "birth-edit-1",
    ciphertext: row.payload_ct,
    accuracy: row.time_accuracy,
    timezone: row.timezone,
  });
}

/** Prepare encrypted chart and features before any birth pointer is changed. */
async function chartSnapshotWrites(
  db: DB,
  userId: string,
  dek: CryptoKey,
  birthProfileId: string,
  fp: string,
  chart: Chart,
  natalReliability: NatalReliabilityManifest,
  transitAnchors: TransitAnchorManifest,
) {
  const { data: existing, error } = await db
    .from<{ id: string }>("chart_snapshots")
    .select("id")
    .eq("user_id", userId)
    .eq("fingerprint", fp)
    .maybeSingle();
  if (error) throw new Error("The chart snapshot could not be read. Please retry.");
  const snapshotId = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const houses = {
    transitAnchors_ct: await encryptJson(dek, transitAnchors),
    natalReliability_ct: await encryptJson(dek, natalReliability),
    natalReliabilityCheckedAt: now,
    system: chart.houseSystem,
    cusps: chart.houses,
    sources: chart.sources,
    ephemeris: {
      precision: chart.precision,
      degraded: chart.degraded,
      degradedReason: chart.degradedReason,
    },
  };
  const statements: { sql: string; params: (string | number | null)[] }[] = [
    {
      sql: "INSERT INTO chart_snapshots(id,user_id,birth_profile_id,fingerprint,engine,contract_version,positions,houses,aspects,uncertainty,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,fingerprint) DO UPDATE SET birth_profile_id=excluded.birth_profile_id,engine=excluded.engine,contract_version=excluded.contract_version,positions=excluded.positions,houses=excluded.houses,aspects=excluded.aspects,uncertainty=excluded.uncertainty",
      params: [
        snapshotId,
        userId,
        birthProfileId,
        fp,
        `${chart.engine}@${chart.engineVersion}`,
        chart.contractVersion,
        JSON.stringify(chart.points),
        JSON.stringify(houses),
        JSON.stringify(chart.aspects),
        JSON.stringify(chart.uncertainty),
        now,
      ],
    },
    {
      sql: "DELETE FROM natal_features WHERE snapshot_id=? AND user_id=?",
      params: [snapshotId, userId],
    },
  ];
  for (const feature of extractFeatures(chart))
    statements.push({
      sql: "INSERT INTO natal_features(id,user_id,snapshot_id,feature_key,family,title,strength,payload,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
      params: [
        crypto.randomUUID(),
        userId,
        snapshotId,
        feature.feature_key,
        feature.family,
        feature.title,
        feature.strength,
        JSON.stringify(feature.payload),
        now,
      ],
    });
  return { snapshotId, statements };
}

/** Re-screen writes are fenced against a birth edit and commit with their features. */
async function storeChartSnapshot(
  db: DB,
  userId: string,
  dek: CryptoKey,
  birthProfileId: string,
  fp: string,
  chart: Chart,
  natalReliability: NatalReliabilityManifest,
  transitAnchors: TransitAnchorManifest,
  expectedBirthCiphertext: string,
) {
  const prepared = await chartSnapshotWrites(
    db,
    userId,
    dek,
    birthProfileId,
    fp,
    chart,
    natalReliability,
    transitAnchors,
  );
  await db.batch([
    {
      sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM birth_profiles WHERE id=? AND user_id=? AND fingerprint=? AND payload_ct=?) THEN 1 ELSE json('birth-record-changed') END",
      params: [birthProfileId, userId, fp, expectedBirthCiphertext],
    },
    ...prepared.statements,
  ]);
  return prepared.snapshotId;
}

export async function saveBirth(
  db: DB,
  userId: string,
  details: BirthDetails,
  accuracy: TimeAccuracy,
  timezone: string,
  expectedRevision?: string | null,
) {
  const dek = await getDek(db, userId);
  const { data: previous, error } = await db
    .from<SavedBirthRow>("birth_profiles")
    .select("id,payload_ct,time_accuracy,timezone,fingerprint")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Your birth record could not be loaded. Please retry.");
  const conflict = "Your birth record changed in another tab. Reload it before saving.";
  if (
    expectedRevision !== undefined &&
    expectedRevision !== (previous ? await birthRevision(userId, previous) : null)
  )
    throw new Error(conflict);
  const priorDetails = previous ? await decryptJson<BirthDetails>(dek, previous.payload_ct) : null;
  const priorSnapshot = previous
    ? await db
        .from<SnapshotRow>("chart_snapshots")
        .select("*")
        .eq("user_id", userId)
        .eq("fingerprint", previous.fingerprint)
        .maybeSingle()
    : null;
  if (priorSnapshot?.error)
    throw new Error("Your previous chart could not be loaded. Please retry.");
  const changedFields: BirthChangeSummary["changedFields"] = [];
  if (!priorDetails || priorDetails.birthDate !== details.birthDate) changedFields.push("date");
  if (!priorDetails || priorDetails.birthTime !== details.birthTime) changedFields.push("time");
  if (!previous || previous.time_accuracy !== accuracy) changedFields.push("accuracy");
  if (
    !priorDetails ||
    priorDetails.placeLabel !== details.placeLabel ||
    priorDetails.latitude !== details.latitude ||
    priorDetails.longitude !== details.longitude ||
    previous?.timezone !== timezone
  )
    changedFields.push("place");
  const { utc, fp, input: birthInput } = await birthCalculation(details, accuracy, timezone);
  const { chart, natalReliability, transitAnchors } = await calculateChart(birthInput, fp);
  const payload_ct = await encryptJson(dek, { ...details, utcISO: utc.toISOString() });
  const profileId = previous?.id ?? crypto.randomUUID();
  const prepared = await chartSnapshotWrites(
    db,
    userId,
    dek,
    profileId,
    fp,
    chart,
    natalReliability,
    transitAnchors,
  );
  const now = new Date().toISOString();
  const guard = previous
    ? {
        sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM birth_profiles WHERE id=? AND user_id=? AND payload_ct=? AND fingerprint=? AND time_accuracy=? AND timezone=?) THEN 1 ELSE json('birth-record-changed') END",
        params: [
          previous.id,
          userId,
          previous.payload_ct,
          previous.fingerprint,
          previous.time_accuracy,
          previous.timezone,
        ],
      }
    : {
        sql: "SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM birth_profiles WHERE user_id=?) THEN 1 ELSE json('birth-record-changed') END",
        params: [userId],
      };
  try {
    await db.batch([
      guard,
      {
        sql: "INSERT INTO birth_profiles(id,user_id,payload_ct,time_accuracy,timezone,fingerprint,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET payload_ct=excluded.payload_ct,time_accuracy=excluded.time_accuracy,timezone=excluded.timezone,fingerprint=excluded.fingerprint,updated_at=excluded.updated_at",
        params: [profileId, userId, payload_ct, accuracy, timezone, fp, now, now],
      },
      ...prepared.statements,
      {
        sql: "UPDATE profiles SET onboarded_at=?,updated_at=? WHERE id=?",
        params: [now, now, userId],
      },
      {
        sql: "INSERT INTO audit_events(id,user_id,kind,detail,created_at) VALUES(?,?,?,?,?)",
        params: [
          crypto.randomUUID(),
          userId,
          "birth_profile.saved",
          JSON.stringify({ fingerprint: fp, accuracy, changedFields }),
          now,
        ],
      },
    ]);
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("birth-record-changed"))
      throw new Error(conflict);
    const { data: current, error: readError } = await db
      .from<SavedBirthRow>("birth_profiles")
      .select("id,payload_ct,time_accuracy,timezone,fingerprint")
      .eq("user_id", userId)
      .maybeSingle();
    if (
      !readError &&
      (previous
        ? !current ||
          current.payload_ct !== previous.payload_ct ||
          current.time_accuracy !== previous.time_accuracy ||
          current.timezone !== previous.timezone
        : current !== null)
    )
      throw new Error(conflict);
    throw new Error("Birth details could not be saved. Your previous chart is kept. Please retry.");
  }
  clearTimingCalculations(userId);
  return {
    snapshotId: prepared.snapshotId,
    fingerprint: fp,
    revision: await birthRevision(userId, { payload_ct, time_accuracy: accuracy, timezone }),
    changeSummary: {
      changedFields,
      previous: priorSnapshot?.data
        ? chartPrecisionSummary(snapshotToChart(priorSnapshot.data))
        : null,
      current: chartPrecisionSummary(chart),
      unchanged: changedFields.length === 0,
    } satisfies BirthChangeSummary,
  };
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
  let failedAnchors: TransitAnchorManifest | null = null;
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
        profile.payload_ct,
      );
      await db.from("audit_events").insert({
        user_id: userId,
        kind: "chart.rescreened",
        detail: { status: natalReliability.status },
      });
      return true;
    }
    failedAnchors = transitAnchors;
  }
  const attemptedAt = new Date().toISOString();
  const guard =
    "id=? AND user_id=? AND fingerprint=? AND EXISTS(SELECT 1 FROM birth_profiles WHERE id=? AND user_id=? AND fingerprint=? AND payload_ct=?)";
  const guardParams = [
    snapshot.id,
    userId,
    snapshot.fingerprint,
    profile.id,
    userId,
    profile.fingerprint,
    profile.payload_ct,
  ];
  const statements: { sql: string; params: (string | number | null)[] }[] = [
    {
      sql: `UPDATE chart_snapshots SET houses=json_set(houses,'$.natalReliabilityCheckedAt',?) WHERE ${guard}`,
      params: [attemptedAt, ...guardParams],
    },
  ];
  const previousAnchors = failedAnchors ? await loadTransitAnchors(snapshot, dek) : null;
  if (
    failedAnchors &&
    (!previousAnchors ||
      (previousAnchors.status === "unavailable" && houses?.["transitAnchorRecovery"]))
  ) {
    statements.push({
      sql: `UPDATE chart_snapshots SET houses=json_set(houses,'$.transitAnchors_ct',?,'$.transitAnchorRecovery',json(?)) WHERE ${guard} AND json_extract(houses,'$.transitAnchors_ct') IS ? AND json_extract(houses,'$.transitAnchorRecovery.token') IS ?`,
      params: [
        await encryptJson(dek, failedAnchors),
        JSON.stringify({
          token: crypto.randomUUID(),
          attemptedAt,
          leaseUntil: attemptedAt,
          status: failedAnchors.status === "screened" ? "complete" : "unavailable",
        }),
        ...guardParams,
        typeof houses?.["transitAnchors_ct"] === "string" ? houses["transitAnchors_ct"] : null,
        typeof (houses?.["transitAnchorRecovery"] as { token?: unknown } | undefined)?.token ===
        "string"
          ? (houses!["transitAnchorRecovery"] as { token: string }).token
          : null,
      ],
    });
  }
  await db.batch(statements);
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
    mood: civilContextFresh(day, 730, new Date()) ? data.mood : null,
    energy: civilContextFresh(day, 730, new Date()) ? data.energy : null,
    sleep: civilContextFresh(day, 180, new Date()) ? data.sleep : null,
    stress: civilContextFresh(day, 180, new Date()) ? data.stress : null,
    note:
      civilContextFresh(day, 730, new Date()) && data.note_ct
        ? await decryptField(await getDek(db, userId), data.note_ct)
        : null,
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
  dailyWriting?: SavedWritingState;
}

/** Revives the stored language-layer metadata for a cached reading. */
export async function readingLanguage(
  row: {
    id?: string;
    snapshot_id?: string;
    reading_date?: string;
    language_mode: string | null;
    language_model: string | null;
    language_meta: JsonValue;
    release_version: string | null;
    primary_cycle_key: string | null;
    headline?: string;
  },
  dek: CryptoKey,
  privacy: { granted: Set<string>; now: Date } = { granted: new Set(), now: new Date() },
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
          sourceTemplate:
            meta["dailyWritingStatus"] === "saved" || !!meta["daily_writing_unavailable"],
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
    const sourceTemplate =
      meta["dailyWritingStatus"] === "saved" || !!meta["daily_writing_unavailable"];
    const sourceParagraphs =
      sourceTemplate && typeof meta["paragraphs_ct"] === "string"
        ? await decryptJson<string[]>(dek, meta["paragraphs_ct"])
        : [];
    if (
      sourceTemplate
        ? !sourceParagraphs
            .slice(0, Number(meta["astroParagraphCount"]))
            .join(" ")
            .includes(natalLens.plan.lens!.mechanism)
        : !consumedNatalTemplate(
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
  const savedParagraphs =
    (Object.hasOwn(meta, "daily_writing_ct") || meta["dailyWritingStatus"] === "saved") &&
    typeof meta["paragraphs_ct"] === "string"
      ? await decryptJson<string[]>(dek, meta["paragraphs_ct"])
      : [];
  const dailyWriting = await readSavedDailyWriting(
    row,
    dek,
    facts,
    savedParagraphs,
    citations,
    privacy.granted,
    privacy.now,
  );
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
    ...(dailyWriting ? { dailyWriting } : {}),
  };
}

export async function savedReadingParagraphs(
  dek: CryptoKey,
  row: ExistingReadingRow,
  body: string,
) {
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

/** Hold the birth revision through async calculation/model work; never serve the prior chart after an edit. */
async function captureBirthForRead(db: DB, userId: string, snapshot: SnapshotRow) {
  const rows = await db.exec<{ payload_ct: string; time_accuracy: string; timezone: string }>(
    "SELECT b.payload_ct,b.time_accuracy,b.timezone FROM birth_profiles b JOIN chart_snapshots s ON s.user_id=b.user_id AND s.fingerprint=b.fingerprint WHERE b.user_id=? AND b.fingerprint=? AND s.id=? AND s.engine=?",
    [userId, snapshot.fingerprint, snapshot.id, snapshot.engine],
  );
  const row = rows[0];
  const changed = () =>
    new Error(
      "Your birth record changed while preparing this chart. Reload to use the saved details.",
    );
  if (!row) throw changed();
  const predicate =
    "EXISTS(SELECT 1 FROM birth_profiles WHERE user_id=? AND fingerprint=? AND payload_ct=? AND time_accuracy=? AND timezone=?)";
  const params = [userId, snapshot.fingerprint, row.payload_ct, row.time_accuracy, row.timezone];
  return {
    predicate,
    params,
    assertCurrent: async () => {
      const result = await db.exec<{ current: number }>(
        `SELECT CASE WHEN ${predicate} THEN 1 ELSE 0 END AS current`,
        params,
      );
      if (result[0]?.current !== 1) throw changed();
    },
  };
}

async function getTodayReading(
  db: DB,
  userId: string,
  timeZone: string,
  capturePolicy: (check: () => Promise<void>) => void,
) {
  let loaded = await loadSnapshot(db, userId);
  if (!loaded) return { needsOnboarding: true as const };
  const birthState = await captureBirthForRead(db, userId, loaded);

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
      await rescreenNatalSnapshot(db, userId, loaded, dek);
      const refreshed = (await loadSnapshot(db, userId)) ?? loaded;
      const refreshedReliability = await loadNatalReliability(refreshed, dek);
      loaded = refreshed;
      natalReliability = refreshedReliability;
    } catch (error) {
      // The saved assessment stays authoritative; today's reading still loads.
      console.error("[today] natal re-screen failed", error);
    }
  }
  await birthState.assertCurrent();
  const snapRow = loaded;
  const transitAnchors = (await ensureTransitAnchors(db, userId, snapRow, dek, now)).manifest;
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
    ...(bundle.dailyEditorial ? { day } : {}),
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
  const { memberLanguageProvider } = await import("./ai/language.server");
  let memberRollout =
    ctx.tone === "warm" && ctx.depth === "standard"
      ? await loadMemberContextRollout(db, bundle.version, memberLanguageProvider())
      : null;
  // Avoid invalidating unrelated contacts. This pure preview uses no provider or
  // transit-service request; actual chapter/geometry validation still runs later.
  if (memberRollout) {
    const previewChart = snapshotToChart(snapRow);
    const preview = assembleReading(
      previewChart,
      cyclesForLocalDay(previewChart, day, tz),
      ctx,
      bundle,
      natalReliability,
    );
    try {
      if (preview.eligibleCycles[0]?.cycle_key !== "saturn_square_sun") memberRollout = null;
      else {
        const { readingFacts } = await import("./ai/facts");
        assertReviewedContextSources(readingFacts(previewChart, preview, tz));
      }
    } catch {
      memberRollout = null;
    }
  }
  const optionalSources = LAUNCH_SOURCES.filter((source) => source.tier > 0).map(
    (source) => source.id,
  );
  const consentChecks = optionalSources.map(
    () => "EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id=? AND granted=1)=?",
  );
  const params = optionalSources.flatMap((id) => [userId, id, granted.has(id) ? 1 : 0]);
  const rolloutGuard = memberRollout
    ? " AND EXISTS(SELECT 1 FROM content_releases WHERE id=? AND is_active=1 AND version=? AND writer_rollout=?)"
    : "";
  db.bindWritePolicy({
    sql: `SELECT CASE WHEN ${consentChecks.join(" AND ")} AND EXISTS(SELECT 1 FROM profiles WHERE id=? AND
      (CASE WHEN EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='USR-01' AND granted=1) AND tone_pref IN ('plain','warm','clinical') THEN tone_pref ELSE 'plain' END)=? AND
      (CASE WHEN EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='USR-02' AND granted=1) AND depth_pref='technical' THEN depth_pref ELSE 'standard' END)=?) AND ${birthState.predicate}${rolloutGuard} THEN 1 ELSE json('privacy-settings-changed') END`,
    params: [
      ...params,
      userId,
      userId,
      ctx.tone,
      userId,
      ctx.depth,
      ...birthState.params,
      ...(memberRollout ? [memberRollout.releaseId, bundle.version, memberRollout.raw] : []),
    ],
  });
  const assertPolicy = async () => {
    await birthState.assertCurrent();
    try {
      await db.assertBoundPolicy();
    } catch {
      throw new Error(
        "Your privacy settings changed while preparing this reading. Reload to use the current settings.",
      );
    }
  };
  capturePolicy(assertPolicy);
  // Never reuse pre-fix model prose. Context changes get a new immutable row,
  // while old reading IDs and their feedback remain intact. The keyed digest
  // prevents enumerating low-entropy wellbeing bands from a database dump.
  const snapshotHouses = { ...(snapRow.houses as Record<string, unknown>) };
  delete snapshotHouses["natalReliability_ct"];
  delete snapshotHouses["natalReliabilityCheckedAt"];
  delete snapshotHouses["transitAnchors_ct"];
  delete snapshotHouses["transitAnchorRecovery"];
  const contextKey = await keyedFingerprint(userId, {
    version: "daily-privacy-3",
    contextStorageVersion: CONTEXT_STORAGE_VERSION,
    planVersion: DAILY_READING_PLAN_VERSION,
    natalPlanVersion: NATAL_LENS_PLAN_VERSION,
    storyPlanVersion: DAILY_TRANSIT_STORY_VERSION,
    storySolverVersion: "transit-episode-1",
    storyAnchorVersion: "transit-anchor-1",
    storyPolicy,
    transitAnchors: canonicalStoryValue(transitAnchors),
    promptVersion: DAILY_PROMPT_VERSION,
    validatorVersion: DAILY_VALIDATOR_VERSION,
    ...(bundle.schemaVersion === 4
      ? {
          compositionVersion: PRIMARY_COMPOSITION_VERSION,
          reflectionVersion: PRIMARY_REFLECTION_VERSION,
        }
      : {}),
    ...(bundle.schemaVersion === 5
      ? {
          promptVersion: CONCRETE_DAILY_PROMPT_VERSION,
          validatorVersion: CONCRETE_DAILY_VALIDATOR_VERSION,
          writingPolicy: {
            plan: DAILY_WRITING_PLAN_VERSION,
            quality: DAILY_WRITING_QUALITY_VERSION,
            reflection: DAILY_REFLECTION_VERSION,
            examples: DAILY_VOICE_EXAMPLES_VERSION,
            frames: bundle.dailyWritingFrames ?? [],
            sources: bundle.cycles,
            synthesis: bundle.synthesisRules ?? [],
          },
        }
      : {}),
    ...(bundle.schemaVersion === 6 &&
    bundle.dailyEditorial &&
    ctx.tone === "warm" &&
    ctx.depth === "standard"
      ? {
          editorialPolicy: {
            prompt: EDITORIAL_DAILY_PROMPT_VERSION,
            validator: EDITORIAL_DAILY_VALIDATOR_VERSION,
            voice: EDITORIAL_DAILY_VOICE_VERSION,
            catalogue: bundle.dailyEditorial,
          },
        }
      : {}),
    model: LANGUAGE_MODEL,
    ...(memberRollout ? { memberContextWriter: memberContextRolloutIdentity(memberRollout) } : {}),
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
  const idem = `daily-privacy-3:${snapRow.fingerprint}:${day}:${bundle.version}:${contextKey}`;

  const { data: existing, error: cacheError } = await db
    .from<ExistingReadingRow>("daily_readings")
    .select(
      "id, snapshot_id, reading_date, headline, body_ct, prompt, confidence, primary_cycle_key, release_version, language_mode, language_model, language_meta, context_version, local_context_ct, local_context_sources, local_context_expires_at, mixed_context_expires_at, retention_state, created_at",
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
    if (
      legacyContextUnavailable(
        existing,
        (srcs ?? []).map((source) => source.source_id),
        granted,
        now,
      )
    ) {
      throw new Error(
        "This saved reading is unavailable because its private context expired or was revoked.",
      );
    }
    const astroBody = await decryptField(dek, existing.body_ct);
    const astroParagraphs = await savedReadingParagraphs(dek, existing, astroBody);
    const local = await savedLocalContext(existing, dek, granted, now);
    const body = [astroBody, local?.body].filter(Boolean).join("\n\n");
    const paragraphState = {
      ...astroParagraphs,
      paragraphs: [...astroParagraphs.paragraphs, ...(local?.body ? local.body.split("\n\n") : [])],
    };
    const language = await readingLanguage(existing, dek, { granted, now });
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
        prompt:
          language.dailyWriting?.status === "saved"
            ? language.dailyWriting.evidence.reflection.question
            : language.dailyWriting?.status === "unavailable"
              ? null
              : (local?.prompt ?? existing.prompt),
        confidence: existing.confidence,
        primary_cycle_key: existing.primary_cycle_key,
        release_version: existing.release_version,
      },
      language,
      storyCalculation,
      feedback: await loadReadingFeedback(db, userId, existing.id),
      provenance: (srcs ?? []).filter((source) =>
        savedSourceAllowed(existing, source.source_id, granted, now),
      ),
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
  let facts = readingFacts(
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
  const recentWriting =
    assembled.writingTemplate || memberRollout
      ? await loadRecentDailyWritingBodies(db, userId, snapRow.id, day, tz, dek, granted, now)
      : null;
  const ordinaryInput: ReadingProseInput = {
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
    ...(assembled.writingTemplate
      ? {
          writing: {
            plan: assembled.writingPlan,
            template: assembled.writingTemplate,
            minimalTemplate: composeDailyWritingTemplate(
              assembled.writingPlan,
              assembled.natalLensPlan,
              assembled.transitStoryPlan,
              true,
            ),
            recent: recentWriting!.bodies,
          },
        }
      : {}),
  };
  const runtimeMode = memberContextMode(ordinaryInput);
  const memberContext =
    memberRollout && runtimeMode && memberRollout.config.modes.includes(runtimeMode)
      ? prepareMemberContextReading(ordinaryInput)
      : null;
  const selectedInput = memberContext ?? ordinaryInput;
  facts = selectedInput.facts;
  const selectedWritingPlan = selectedInput.writing?.plan ?? assembled.writingPlan;
  const selectedReflection = memberContext
    ? {
        version: DAILY_REFLECTION_VERSION,
        question: selectedInput.fallback.prompt,
        themeFactId: selectedWritingPlan.theme?.factId ?? null,
        frameKey: null,
        variant: "context" as const,
        localSource: null,
      }
    : assembled.reflectionPlan;
  await assertPolicy();
  const prose = await generateReadingProse(
    selectedInput,
    memberRollout
      ? {
          contextModes: memberRollout.config.modes,
          contextRenderMode: memberRollout.config.render,
        }
      : {},
  );
  await assertPolicy();
  const body = [prose.body, assembled.contextBody].filter(Boolean).join("\n\n");
  const durableContext = assembled.contextParts.filter((part) =>
    part.sourceIds.every((id) => SOURCE_MAP[id]?.retention_days === null),
  );
  const expiringContext = assembled.contextParts.filter((part) =>
    part.sourceIds.some((id) => SOURCE_MAP[id]?.retention_days !== null),
  );
  const durableBody = [prose.body, ...durableContext.map((part) => part.text)]
    .filter(Boolean)
    .join("\n\n");
  const localSources = [...new Set(expiringContext.flatMap((part) => part.sourceIds))];
  const localBody = expiringContext.map((part) => part.text).join("\n\n");
  const localExpiry = finiteContextExpiry(localSources, day, now);
  const paragraphs = [
    ...(prose.body ? prose.paragraphs : []),
    ...(assembled.contextBody ? assembled.contextBody.split("\n\n") : []),
  ];
  const suppliedFacts = readSavedFactAtoms(facts);
  const interpretationPlan = dailyPlanIdentity(assembled.interpretationPlan);
  const natalFact = suppliedFacts.find((f) => f.id === "N1");
  const usedNatalParagraphs = natalFact
    ? prose.meta.mode === "model" || prose.meta.writing
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
        ? prose.meta.mode === "model" || memberContext
          ? prose.meta.citations.filter((c) => c.facts.includes("A1")).map((c) => c.paragraph)
          : templateStoryUsage.A1
        : [],
      P2: storyFacts.length
        ? prose.meta.mode === "model" || memberContext
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
    (entry) => (prose.meta.mode !== "model" && !memberContext) || entry.lane !== "content",
  );
  if (prose.meta.mode === "template" && !memberContext) {
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
  if (prose.meta.mode === "model" || memberContext) {
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
    if (prose.meta.mode === "model")
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
        sourceTemplate: !!prose.meta.writing,
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
  const readingId = crypto.randomUUID();
  const dailyWriting: SavedDailyWriting | null =
    prose.meta.writing && selectedReflection && recentWriting
      ? {
          version: 1,
          readingId,
          snapshotId: snapRow.id,
          releaseVersion: assembled.release_version,
          primaryCycleKey: assembled.primary_cycle_key,
          plan: selectedWritingPlan,
          ...prose.meta.writing,
          reflection: selectedReflection,
          legacySourceQuestion:
            selectedReflection.variant === "legacy" || selectedReflection.variant === "context"
              ? selectedReflection.question
              : null,
          effectiveTimezone: tz,
          astroParagraphCount: prose.paragraphs.length,
          historyAvailability: recentWriting.availability,
        }
      : null;
  if (dailyWriting)
    validateSavedDailyWriting(
      dailyWriting,
      {
        id: readingId,
        snapshot_id: snapRow.id,
        release_version: assembled.release_version,
        primary_cycle_key: assembled.primary_cycle_key,
        headline: prose.headline,
        language_mode: prose.meta.mode,
        language_meta: {
          astroParagraphCount: prose.paragraphs.length,
          ...(dailyWriting.plan.editorial
            ? { dailyEditorialDigest: dailyEditorialDigest(dailyWriting.plan.editorial) }
            : {}),
        },
      },
      suppliedFacts,
      prose.paragraphs,
      prose.meta.citations,
    );
  const { data: inserted, error } = await db
    .from<{ id: string }>("daily_readings")
    .insert({
      id: readingId,
      user_id: userId,
      reading_date: day,
      snapshot_id: snapRow.id,
      release_version: assembled.release_version,
      headline: prose.headline,
      body_ct: await encryptField(dek, durableBody),
      prompt: dailyWriting ? null : assembled.astroPrompt,
      context_version: CONTEXT_STORAGE_VERSION,
      local_context_ct: localSources.length
        ? await encryptJson(dek, { body: localBody, prompt: dailyWriting ? "" : prose.prompt })
        : null,
      local_context_sources: localSources,
      local_context_expires_at: localExpiry,
      // A non-UTC device clock is embedded in qualified archived timing evidence.
      // Keep its affected archived body unavailable after that clock's policy expires.
      mixed_context_expires_at:
        granted.has("DEV-01") && tz !== "UTC" ? finiteContextExpiry(["DEV-01"], day, now) : null,
      retention_state: "available",
      confidence: assembled.confidence,
      primary_cycle_key: assembled.primary_cycle_key,
      idempotency_key: idem,
      language_mode: prose.meta.mode,
      language_model: prose.meta.model,
      language_meta: {
        ...prose.meta,
        ...(memberContext && memberRollout
          ? {
              memberContextWriter: {
                ...memberContextRolloutIdentity(memberRollout),
                mode: runtimeMode,
              },
            }
          : {}),
        ...(dailyWriting
          ? {
              daily_writing_ct: await encryptJson(dek, dailyWriting),
              dailyWritingStatus: "saved",
              ...(dailyWriting.plan.editorial
                ? { dailyEditorialDigest: dailyEditorialDigest(dailyWriting.plan.editorial) }
                : {}),
              ...(dailyWriting.reflection.localSource
                ? {
                    dailyWritingRetention: {
                      sourceIds: [dailyWriting.reflection.localSource],
                      expiresAt: finiteContextExpiry(
                        [dailyWriting.reflection.localSource],
                        day,
                        now,
                      ),
                    },
                  }
                : {}),
            }
          : {}),
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
        // Only a versioned, chart-only copy is eligible for assistant sharing.
        // Never copy assembled.contextBody or a reading framed by check-in bands.
        assistantShare: {
          version: 2,
          reading_ct:
            ctx.checkIn ||
            ctx.wellness?.sleep != null ||
            ctx.wellness?.stress != null ||
            provenance.some((p) => p.source_id.startsWith("WEL-") || p.source_id === "USR-04") ||
            /\b(sleep|stress|mood|energy)\b/i.test(
              `${prose.headline}\n${prose.body}\n${prose.prompt ?? ""}`,
            )
              ? null
              : await encryptJson(dek, {
                  headline: prose.headline,
                  body: prose.body,
                  prompt: prose.prompt ?? null,
                }),
        },
        paragraphs_ct: await encryptJson(dek, [
          ...prose.paragraphs,
          ...durableContext.map((part) => part.text),
        ]),
      },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (provenance.length) {
    // Six supplied columns plus the generated ID: 14 rows use 98 of D1's
    // 100 bound parameters. Keep the full evidence trail, including natal origins.
    const rowsPerInsert = 14;
    let sourceError: { message: string } | null = null;
    for (let start = 0; start < provenance.length; start += rowsPerInsert) {
      const result = await db.from("reading_sources").insert(
        provenance.slice(start, start + rowsPerInsert).map((p) => ({
          user_id: userId,
          reading_id: inserted.id,
          lane: p.lane,
          source_id: p.source_id,
          label: p.label,
          detail: p.detail,
        })),
      );
      if (result.error) {
        sourceError = result.error;
        break;
      }
    }
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
      ...(dailyWriting
        ? { dailyWriting: { status: "saved" as const, evidence: dailyWriting } }
        : {}),
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

/** Optional comparison history: twelve saved rows at most, never provider input or cache identity. */
export async function loadRecentDailyWritingBodies(
  db: DB,
  userId: string,
  snapshotId: string,
  day: string,
  timezone: string,
  dek: CryptoKey,
  granted = new Set<string>(),
  now = new Date(),
): Promise<RecentDailyWritingHistory> {
  const reference = new Date(day + "T12:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !Number.isFinite(+reference) ||
    reference.toISOString().slice(0, 10) !== day
  )
    throw Error("Invalid comparison civil day.");
  const bodies: RecentDailyWritingHistory["bodies"] = [];
  const omissions = new Map<
    RecentDailyWritingHistory["availability"]["omissions"][number]["reason"],
    number
  >();
  const omit = (reason: RecentDailyWritingHistory["availability"]["omissions"][number]["reason"]) =>
    omissions.set(reason, (omissions.get(reason) ?? 0) + 1);
  let inspected = 0;
  for (let offset = 1; offset <= 3; offset++) {
    const date = new Date(reference);
    date.setUTCDate(date.getUTCDate() - offset);
    const previousDay = date.toISOString().slice(0, 10);
    const { data, error } = await db
      .from<ExistingReadingRow>("daily_readings")
      .select(
        "id,snapshot_id,reading_date,headline,release_version,primary_cycle_key,language_mode,language_model,language_meta,body_ct,context_version,local_context_ct,local_context_sources,local_context_expires_at,mixed_context_expires_at,retention_state,created_at",
      )
      .eq("user_id", userId)
      .eq("snapshot_id", snapshotId)
      .eq("reading_date", previousDay)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(4);
    if (error) {
      omit("invalid");
      continue;
    }
    let retained = false;
    for (const row of data ?? []) {
      inspected++;
      const meta = row.language_meta as Record<string, unknown> | null;
      if (!meta || !Object.hasOwn(meta, "daily_writing_ct")) {
        omit("legacy");
        continue;
      }
      try {
        if (
          legacyContextUnavailable(row, [], granted, now) ||
          typeof meta["paragraphs_ct"] !== "string"
        )
          throw Error("Unavailable comparison.");
        const saved = await readingLanguage(row, dek, { granted, now });
        if (saved.dailyWriting?.status !== "saved") throw Error("Unavailable writing comparison.");
        const evidence = saved.dailyWriting.evidence;
        if (evidence.effectiveTimezone !== timezone) {
          omit("timezone");
          continue;
        }
        const body = await decryptField(dek, row.body_ct);
        const { paragraphs } = await savedReadingParagraphs(dek, row, body);
        bodies.push({
          day: previousDay,
          paragraphs: paragraphs.slice(0, evidence.astroParagraphCount),
          requiredLiteralSentences:
            saved.transitStory?.plan.status === "selected"
              ? [saved.transitStory.plan.chronologySentence]
              : [],
        });
        retained = true;
        break;
      } catch {
        omit("invalid");
      }
    }
    if (!retained && data?.length === 4) omit("candidate_limit");
  }
  return {
    bodies,
    availability: {
      status: bodies.length === 3 ? "available" : bodies.length ? "partial" : "unavailable",
      inspected,
      retainedDays: bodies.length,
      omissions: [...omissions].map(([reason, count]) => ({ reason, count })),
    },
  };
}

/** Optional reuse is loaded after the immutable astronomical reading, never into its provider inputs. */
export async function getToday(db: DB, userId: string, timeZone: string) {
  let assertPolicy: () => Promise<void> = async () => {};
  const reading = await getTodayReading(db, userId, timeZone, (check) => {
    assertPolicy = check;
  });
  if (reading.needsOnboarding) return reading;
  const granted = await grantedSet(db, userId);
  const profile = await loadProfile(db, userId);
  const now = new Date();
  const markedMoments = contextUseAllowed("USR-07", "framing", granted, now, now);
  const preferredDomain =
    contextUseAllowed("USR-14", "framing", granted, null, now) && isLifeDomain(profile.domain_pref)
      ? profile.domain_pref
      : null;
  let previousResonance: LocalReadingContext["previousResonance"] = null;
  const sourceKey = reading.language.facts.find((fact) => fact.id === "I1")?.sourceKey ?? null;
  if (sourceKey && contextUseAllowed("USR-11", "personalisation", granted, now, now)) {
    const cutoff = new Date(now.getTime() - 730 * 86_400_000).toISOString();
    const [prior] = await db.exec<{ resonance: number; reading_date: string; created_at: string }>(
      "SELECT f.resonance,d.reading_date,f.created_at FROM reading_feedback f JOIN daily_readings d ON d.id=f.reading_id AND d.user_id=f.user_id JOIN reading_sources s ON s.reading_id=d.id AND s.user_id=f.user_id WHERE f.user_id=? AND d.id<>? AND julianday(f.created_at)>julianday(?) AND json_extract(s.detail,'$.factId')='I1' AND json_extract(s.detail,'$.sourceKey')=? ORDER BY julianday(f.created_at) DESC LIMIT 1",
      [userId, reading.reading.id, cutoff, sourceKey],
    );
    if (
      prior &&
      (prior.resonance === -1 || prior.resonance === 0 || prior.resonance === 1) &&
      contextUseAllowed("USR-11", "personalisation", granted, prior.created_at, now)
    ) {
      previousResonance = { score: prior.resonance, day: prior.reading_date };
    }
  }
  const { solarForToday } = await import("./solar-location.server");
  const solar = await solarForToday(db, userId);
  const localContext: LocalReadingContext = {
    version: "local-context-1",
    identity: await keyedFingerprint(userId, {
      version: "local-context-1",
      markedMoments,
      preferredDomain,
      previousResonance,
      solar,
    }),
    markedMoments,
    preferredDomain,
    previousResonance,
    solar,
  };
  await assertPolicy();
  return { ...reading, localContext };
}

/** An optional reading surface, distinct from the owner's always-available Journal. */
export async function listReadingJournal(
  db: DB,
  userId: string,
  day: string | undefined,
  cycleKeys: string[],
  featureKeys: string[] = [],
) {
  const now = new Date(),
    granted = await grantedSet(db, userId);
  if (!contextUseAllowed("USR-07", "framing", granted, now, now))
    return { enabled: false, entries: [] };
  if (
    (day !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(day)) ||
    cycleKeys.length > 20 ||
    featureKeys.length > 20 ||
    [...cycleKeys, ...featureKeys].some(
      (key) => typeof key !== "string" || !key || key.length > 120,
    )
  ) {
    throw new Error("Invalid journal context request.");
  }
  const cutoff = new Date(now.getTime() - 1825 * 86_400_000).toISOString();
  const clauses: string[] = [],
    params: string[] = [];
  if (day) {
    clauses.push("occurred_on=?");
    params.push(day);
  }
  if (cycleKeys.length) {
    clauses.push("cycle_key IN (" + cycleKeys.map(() => "?").join(",") + ")");
    params.push(...cycleKeys);
  }
  if (featureKeys.length) {
    clauses.push("feature_key IN (" + featureKeys.map(() => "?").join(",") + ")");
    params.push(...featureKeys);
  }
  if (!clauses.length) return { enabled: true, entries: [] };
  const { data, error } = await db
    .from<LifeEventRow>("life_events")
    .select("id,occurred_on,domain,label_ct,body_ct,cycle_key,feature_key,created_at")
    .eq("user_id", userId)
    .raw("(" + clauses.join(" OR ") + ")", params)
    .raw("julianday(created_at)>julianday(?)", [cutoff])
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error("Your entries could not be loaded. Please retry.");
  if (!data?.length) return { enabled: true, entries: [] };
  const dek = await getDek(db, userId);
  const entries = await Promise.all(
    data.map(async (entry) => ({
      id: entry.id,
      occurred_on: entry.occurred_on,
      domain: entry.domain,
      label: await decryptField(dek, entry.label_ct),
      body: entry.body_ct ? await decryptField(dek, entry.body_ct) : null,
      cycle_key: entry.cycle_key ?? null,
      feature_key: entry.feature_key ?? null,
    })),
  );
  const current = await grantedSet(db, userId);
  if (!contextUseAllowed("USR-07", "framing", current, new Date(), new Date()))
    return { enabled: false, entries: [] };
  return { enabled: true, entries };
}

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
    revision: await birthRevision(userId, data),
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
  const ordinaryRetained = civilContextFresh(day, 730, new Date());
  const sleepValue = withinRetention && granted.has("WEL-01") ? sleep : null;
  const stressValue = withinRetention && granted.has("WEL-03") ? stress : null;

  const savedAt = new Date().toISOString();
  const [row] = await db.exec<CheckInRow>(
    `insert into "check_ins" (id,user_id,day,mood,energy,sleep,stress,note_ct,updated_at,created_at)
     values (?,?,?,?,?,
       CASE WHEN EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='WEL-01' AND granted=1) THEN ? ELSE NULL END,
       CASE WHEN EXISTS(SELECT 1 FROM source_consents WHERE user_id=? AND source_id='WEL-03' AND granted=1) THEN ? ELSE NULL END,
       ?,?,?)
     on conflict("user_id", "day") do update set mood=excluded.mood,energy=excluded.energy,
       sleep=excluded.sleep,stress=excluded.stress,note_ct=excluded.note_ct,updated_at=excluded.updated_at
     RETURNING mood,energy,sleep,stress,note_ct,updated_at`,
    [
      crypto.randomUUID(),
      userId,
      day,
      ordinaryRetained ? mood : null,
      ordinaryRetained ? energy : null,
      userId,
      sleepValue,
      userId,
      stressValue,
      ordinaryRetained && note ? await encryptField(dek, note) : null,
      savedAt,
      savedAt,
    ],
  );
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
    .raw("julianday(day)+731>julianday(?)", [new Date().toISOString()])
    .order("day", { ascending: false })
    .limit(60);
  if (checkInsError) throw new Error(checkInsError.message);
  const { data: events, error: eventsError } = await db
    .from<LifeEventRow>("life_events")
    .select(
      "id, occurred_on, domain, label_ct, body_ct, cycle_key, feature_key, created_at, updated_at, revision",
    )
    .eq("user_id", userId)
    .raw("julianday(created_at)+1825>julianday(?)", [new Date().toISOString()])
    .order("occurred_on", { ascending: false })
    .limit(60);
  if (eventsError) throw new Error(eventsError.message);
  const { data: feedback, error: feedbackError } = await db
    .from<FeedbackRow>("reading_feedback")
    .select("reading_id, resonance, labels, created_at")
    .eq("user_id", userId)
    .raw("julianday(created_at)>julianday(?)", [
      new Date(Date.now() - 730 * 86400000).toISOString(),
    ])
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
        sleep: civilContextFresh(c.day, 180, new Date()) ? c.sleep : null,
        stress: civilContextFresh(c.day, 180, new Date()) ? c.stress : null,
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
        updated_at: e.updated_at ?? null,
        revision: e.revision,
      })),
    ),
    feedback: feedback ?? [],
  };
}

function validateJournalOperation(clientMutationId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      clientMutationId,
    )
  ) {
    throw new Error("Invalid journal operation.");
  }
}

async function ownedLifeEvent(db: DB, userId: string, id: string) {
  const { data: row, error } = await db
    .from<LifeEventRow>("life_events")
    .select(
      "id, occurred_on, domain, label_ct, body_ct, cycle_key, feature_key, created_at, updated_at, revision",
    )
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Your entry could not be checked. Please retry.");
  if (!row) return null;
  const dek = await getDek(db, userId);
  return {
    id: row.id,
    occurred_on: row.occurred_on,
    domain: row.domain,
    label: await decryptField(dek, row.label_ct),
    body: row.body_ct ? await decryptField(dek, row.body_ct) : null,
    cycle_key: row.cycle_key ?? null,
    feature_key: row.feature_key ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    revision: row.revision,
  };
}

export async function resolveLifeEventSubmission(db: DB, userId: string, clientMutationId: string) {
  validateJournalOperation(clientMutationId);
  const id = await fingerprint(["journal-create-v1", userId, clientMutationId]);
  const entry = await ownedLifeEvent(db, userId, id);
  return entry ? { state: "saved" as const, entry } : { state: "missing" as const };
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
  clientMutationId?: string,
) {
  if (clientMutationId !== undefined) validateJournalOperation(clientMutationId);
  const id = clientMutationId
    ? await fingerprint(["journal-create-v1", userId, clientMutationId])
    : crypto.randomUUID();
  const dek = await getDek(db, userId);
  const createdAt = new Date().toISOString();
  const inserted = await db.exec<{ id: string }>(
    "INSERT INTO life_events(id,user_id,occurred_on,domain,label_ct,body_ct,cycle_key,feature_key,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id",
    [
      id,
      userId,
      occurredOn,
      domain,
      await encryptField(dek, label),
      body ? await encryptField(dek, body) : null,
      cycleKey,
      featureKey,
      createdAt,
    ],
  );
  const entry = await ownedLifeEvent(db, userId, id);
  if (!entry) throw new Error("Your entry could not be confirmed. Check the save before retrying.");
  return { ok: true, id, entry, replayed: inserted.length === 0 };
}

export async function updateLifeEvent(
  db: DB,
  userId: string,
  input: { id: string; label: string; body: string | null; expectedRevision: number },
) {
  if (typeof input.label !== "string" || !input.label.trim() || input.label.trim().length > 400) {
    throw new Error("Use a title of 1–400 characters.");
  }
  if (input.body !== null && (typeof input.body !== "string" || input.body.length > 4000)) {
    throw new Error("The entry must be at most 4,000 characters.");
  }
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) {
    throw new Error("Invalid entry revision.");
  }
  if (typeof input.id !== "string" || !input.id) throw new Error("Entry not found.");
  const { data: owned, error: readError } = await db
    .from<LifeEventRow>("life_events")
    .select("id, revision")
    .eq("user_id", userId)
    .eq("id", input.id)
    .maybeSingle();
  if (readError) throw new Error("Your entry could not be checked. Please retry.");
  if (!owned) throw new Error("Entry not found for your account.");
  if (owned.revision !== input.expectedRevision) {
    throw new Error(
      "This entry changed in another tab. Compare the latest entry before saving your draft.",
    );
  }
  const dek = await getDek(db, userId);
  const updatedAt = new Date().toISOString();
  const { data: updated, error: writeError } = await db
    .from<LifeEventRow>("life_events")
    .update({
      label_ct: await encryptField(dek, input.label.trim()),
      body_ct: input.body?.trim() ? await encryptField(dek, input.body.trim()) : null,
      updated_at: updatedAt,
      revision: input.expectedRevision + 1,
    })
    .eq("user_id", userId)
    .eq("id", input.id)
    .eq("revision", input.expectedRevision)
    .select("id, revision, updated_at")
    .maybeSingle();
  if (writeError)
    throw new Error("Your entry could not be saved. Your draft is kept; please retry.");
  if (!updated) {
    throw new Error(
      "This entry changed in another tab. Compare the latest entry before saving your draft.",
    );
  }
  return { id: updated.id, revision: updated.revision, updatedAt: updated.updated_at! };
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
  const { exportAccountData } = await import("./account-data.server");
  return exportAccountData(userId, db);
}

/** Legacy personal-data erasure retains the login; the UI uses explicit reset/delete actions. */
export async function eraseEverything(db: DB, userId: string) {
  const tables = [
    "identity_links",
    "reading_feedback",
    "reading_sources",
    "daily_readings",
    "cycle_instances",
    "natal_features",
    "feature_narratives",
    "chart_snapshots",
    "context_signals",
    "check_ins",
    "life_events",
    "source_consents",
    "birth_profiles",
  ];
  try {
    await execBatch([
      ...tables.map((table) => ({
        sql: `delete from "${table}" where user_id=?`,
        params: [userId],
      })),
      { sql: "UPDATE audit_events SET detail='{}' WHERE user_id=?", params: [userId] },
      {
        sql: "UPDATE profiles SET wrapped_dek=NULL,onboarded_at=NULL,tone_pref='plain',depth_pref='standard',domain_pref=NULL WHERE id=?",
        params: [userId],
      },
      {
        sql: "INSERT INTO audit_events(id,user_id,kind,detail) VALUES (?,?,'account.erased','{}')",
        params: [crypto.randomUUID(), userId],
      },
    ]);
  } catch {
    throw new Error("Personal data could not be fully deleted. Please retry.");
  }
  clearTimingCalculations(userId);
  return { ok: true as const };
}

export async function updatePrefs(
  db: DB,
  userId: string,
  displayName: string | null,
  tone: string,
  depth: string,
  domainPref?: LifeDomain | null,
) {
  if (domainPref !== undefined && domainPref !== null && !isLifeDomain(domainPref)) {
    throw new Error("Choose a supported life area.");
  }
  const { error } = await db.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
      tone_pref: tone,
      depth_pref: depth,
      ...(domainPref !== undefined ? { domain_pref: domainPref } : {}),
    },
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
  const birthState = await captureBirthForRead(db, userId, snapRow);
  const granted = await grantedSet(db, userId);
  const timezone = isPermitted("DEV-01", "timing", granted) ? validTimeZone(timeZone) : "UTC";
  const referenceDay = day ?? localDayString(new Date(), timezone);
  const referenceAt = localNoon(referenceDay, timezone).toISOString();
  const chart = snapshotToChart(snapRow);
  const cycles = cyclesForLocalDay(chart, referenceDay, timezone);
  const bundle = await activeBundle(db),
    dek = await getDek(db, userId),
    anchor = (await ensureTransitAnchors(db, userId, snapRow, dek, new Date())).manifest;
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
  await birthState.assertCurrent();
  const selected = assembleReading(
    chart,
    cycles,
    { granted, tone: "plain", depth: "standard", localBucket: null, checkIn: null, wellness: null },
    bundle,
    null,
    episodeCalculation,
  );
  const storyCalculation = selected.storyCalculation;
  const preferredDomain = contextUseAllowed("USR-14", "framing", granted, null, new Date())
    ? (await loadProfile(db, userId)).domain_pref
    : null;
  await birthState.assertCurrent();
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
    preferredDomain,
  };
}

// ---------------------------------------------------------------------------
// Future timing is a separate native scan; it never generates reading prose.
export async function getUpcomingCycles(
  db: DB,
  userId: string,
  timeZone: string,
  horizonDays: 90 | 365,
  domain: LifeDomain | "all",
  duration: import("./astro/upcoming.server").DurationFilter,
) {
  const snapshot = await loadSnapshot(db, userId);
  if (!snapshot) return { needsOnboarding: true as const };
  const birth = await captureBirthForRead(db, userId, snapshot),
    granted = await grantedSet(db, userId);
  const timezone = isPermitted("DEV-01", "timing", granted) ? validTimeZone(timeZone) : "UTC";
  const day = localDayString(new Date(), timezone),
    from = localNoon(day, timezone).toISOString(),
    to = new Date(Date.parse(from) + horizonDays * 86400000).toISOString();
  const anchors = (
    await ensureTransitAnchors(db, userId, snapshot, await getDek(db, userId), new Date())
  ).manifest;
  const { getUpcomingFromAnchors } = await import("./astro/upcoming.server");
  const key = await keyedFingerprint(userId, {
    version: "future-timing-cache-1",
    snapshotId: snapshot.id,
    fingerprint: snapshot.fingerprint,
    anchors,
    from,
    to,
    domain,
    duration,
    policy: transitEpisodePolicy(),
  });
  const saved = await cachedTimingCalculation(userId, key, async () => ({
    calculation: await getUpcomingFromAnchors(
      anchors,
      from,
      to,
      domain,
      duration,
      birth.assertCurrent,
    ),
    computedAt: new Date().toISOString(),
  }));
  await birth.assertCurrent();
  const current = await grantedSet(db, userId);
  if (isPermitted("DEV-01", "timing", current) !== isPermitted("DEV-01", "timing", granted))
    throw Error("Your calendar permission changed. Please refresh Timing.");
  return { needsOnboarding: false as const, day, timezone, from, to, ...saved };
}
export async function getSkyEvents(
  db: DB,
  userId: string,
  timeZone: string,
  horizonDays: 90 | 365,
) {
  const granted = await grantedSet(db, userId),
    timezone = isPermitted("DEV-01", "timing", granted) ? validTimeZone(timeZone) : "UTC";
  const day = localDayString(new Date(), timezone),
    from = zonedToUtc(day, "00:00", timezone).toISOString(),
    to = new Date(Date.parse(from) + horizonDays * 86400000).toISOString();
  const { getLunations } = await import("./astro/lunations.server");
  const calculation = await getLunations(from, to);
  const current = await grantedSet(db, userId);
  if (isPermitted("DEV-01", "timing", current) !== isPermitted("DEV-01", "timing", granted))
    throw Error("Your calendar permission changed. Please refresh Timing.");
  return { day, timezone, from, to, computedAt: new Date().toISOString(), calculation };
}

// content releases (editorial provenance, read-only)
// ---------------------------------------------------------------------------

export async function listReleases(db: DB) {
  const { data, error } = await db
    .from<ReleaseRow>("content_releases")
    .select(
      "id, version, checksum, checksum_algorithm, publication_state, created_at, is_active, bundle",
    )
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
      checksumAlgorithm: r.checksum_algorithm ?? "legacy-unlabelled",
      publication: r.publication_state,
      created_at: r.created_at,
      is_active: r.is_active,
      families: keys.length,
      entries,
      cycles: cyclesCount,
      synthesisRules: rulesCount,
      schemaVersion:
        bundle["schemaVersion"] === 5
          ? 5
          : bundle["schemaVersion"] === 4
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

/** Evaluation-only copy read; run/single-case callers establish admin authority first. */
export async function evaluationBundle(
  db: DB,
  bundleSource: ReadingEvaluationBundleSource,
): Promise<ContentBundle> {
  if (!(READING_EVALUATION_BUNDLE_SOURCES as readonly unknown[]).includes(bundleSource))
    throw new Error("Unknown synthetic evaluation bundle.");
  return bundleSource === "builtin"
    ? DEFAULT_BUNDLE
    : bundleSource === "natal-candidate"
      ? (await import("./content/natal-candidate-bundle")).NATAL_CANDIDATE_BUNDLE
      : bundleSource === "transit-candidate"
        ? (await import("./content/transit-candidate-bundle")).TRANSIT_CANDIDATE_BUNDLE
        : bundleSource === "writing-candidate"
          ? (await import("./content/writing-candidate-bundle")).WRITING_CANDIDATE_BUNDLE
          : await activeBundle(db, { requireSuccessfulRead: true });
}

/** One fixed synthetic case; callers have already established admin authority. */
export async function evaluateFixedCase(
  db: DB,
  caseId: string,
  bundleSource: ReadingEvaluationBundleSource,
  provider: LanguageProvider,
  qualification?: {
    profile?: import("./ai/qualification-profiles").QualificationProfile;
    enterpriseThinking?: import("./ai/admin-transport").EnterpriseThinkingLevel;
    sourceSha: string | null;
    runPlanHash: string;
    caseSetId?: import("./ai/evaluation-case-sets").EvaluationCaseSetId;
    contentComparison?: import("./ai/reading-evaluation.shared").ReadingEvaluationMetadata["contentComparison"];
    boundedQualification?: boolean;
  },
  frozenBundle?: ContentBundle,
) {
  if (!(LANGUAGE_PROVIDERS as readonly unknown[]).includes(provider))
    throw new Error("Unknown language provider.");
  const evaluation = await import("./ai/reading-evaluation.server");
  const bundle = frozenBundle ?? (await evaluationBundle(db, bundleSource));
  const result = await evaluation.runSyntheticEvaluationCase(
    caseId,
    bundle,
    provider,
    qualification?.profile,
    qualification?.enterpriseThinking
      ? { enterpriseThinking: qualification.enterpriseThinking, boundedQualification: true }
      : qualification?.boundedQualification
        ? { boundedQualification: true }
        : {},
    qualification?.caseSetId,
  );
  return {
    ...result,
    metadata: {
      ...result.metadata,
      bundleSource,
      ...(qualification
        ? {
            sourceSha: qualification.sourceSha,
            runPlanHash: qualification.runPlanHash,
            ...(qualification.contentComparison
              ? { contentComparison: qualification.contentComparison }
              : {}),
            requestPolicyVersion: "synthetic-facts-local-context-1",
          }
        : {}),
    },
  };
}

/** Which admin language providers have a server key; never returns key material. */
export async function listLanguageProviders(db: DB, userId: string) {
  if (!(await isAdmin(db, userId))) {
    throw new Error("Only admins can view language providers.");
  }
  const { languageProviderStatus, memberLanguageProvider } = await import("./ai/language.server");
  return { providers: languageProviderStatus(), memberProvider: memberLanguageProvider() };
}

/**
 * Flips the active release pointer from inside the app. RLS only allows this
 * for admins; published readings are never rewritten because each one already
 * records the release version it was assembled from.
 */
export async function activateRelease(
  db: DB,
  userId: string,
  releaseId: string,
  expectedPreviousVersion?: string | null,
) {
  if (!(await isAdmin(db, userId))) throw new Error("Only admins can change the active release.");
  const { data: target, error } = await db
    .from<{ version: string }>("content_releases")
    .select("version")
    .eq("id", releaseId)
    .maybeSingle();
  if (error) throw new Error("That release could not be read. Please retry.");
  if (!target) throw new Error("That release no longer exists.");
  const { setActiveContentRelease } = await import("./content/release-lifecycle.server");
  return setActiveContentRelease(db, {
    version: target.version,
    expectedPreviousVersion,
    actor: { kind: "admin", userId },
    source: "admin",
  });
}

export async function reconcileReleasePublication(db: DB, userId: string, version: string) {
  const { reconcileContentReleasePublication } = await import("./content/release-lifecycle.server");
  return reconcileContentReleasePublication(db, { version, actor: { kind: "admin", userId } });
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
export async function featureNarrativeContext(
  db: DB,
  userId: string,
  snap: SnapshotRow,
  chart: Chart,
) {
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
  const narrative = await loadFeatureNarrative(db, userId, featureKey);
  if (!narrative.available) return narrative;
  const { getMembership } = await import("./billing.server");
  const { chapterPreview } = await import("./billing-policy");
  // Recheck after generation as a chapter can finish after access has expired.
  const access = await getMembership(userId, db);
  return {
    ...(access.fullAccess ? narrative : chapterPreview(narrative)),
    locked: !access.fullAccess,
    accessUntil: access.accessUntil,
  };
}

async function loadFeatureNarrative(db: DB, userId: string, featureKey: string) {
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
  base_bundle: Record<string, unknown> | null;
  base_hash: string | null;
  model: string | null;
  bundle: Record<string, unknown> | null;
  notes: JsonValue;
  status: string;
  created_at: string;
}

export {
  getDraftComparison,
  approveDraftReview,
  editContentDraft,
  rebaseContentDraft,
} from "./content/content-drafts.server";

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
  const { contentChecksum } = await import("./content/draft-comparison");
  const frozenBase = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  const baseHash = await contentChecksum(frozenBase);
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

  const candidateBundle: ContentBundle = {
    version: "pending",
    schemaVersion:
      base.schemaVersion === 5
        ? 5
        : base.schemaVersion === 4
          ? 4
          : base.schemaVersion === 3
            ? 3
            : 2,
    phases: base.phases,
    natal: base.natal,
    domains: base.domains,
    cycles: mergedCycles,
    synthesisRules: survivingRules,
    natalLenses: structuredClone(base.natalLenses ?? []),
    transitChapters: structuredClone(base.transitChapters ?? []),
    dailyWritingFrames: structuredClone(base.dailyWritingFrames ?? []),
  };
  const { bundle, removedFrameKeys } = invalidateDailyWritingFrames(base, candidateBundle);

  validateContentGraph(bundle);

  const themeCount = mergedCycles.reduce((acc, c) => acc + (c.themes?.length ?? 0), 0);

  const { data: inserted, error } = await db
    .from<{ id: string }>("content_drafts")
    .insert({
      user_id: userId,
      base_version: base.version,
      base_bundle: frozenBase,
      base_hash: baseHash,
      model: drafted.model,
      bundle: bundle,
      notes: {
        promptVersion: drafted.promptVersion,
        requested: DRAFT_SLOTS.length,
        returned: draftedMap.size,
        dropped,
        flagged: drafted.flagged.length,
        affectedKeys: Array.from(changedKeys),
        synthesisReviewRequired: removedRuleKeys,
        writingFrameReviewRequired: removedFrameKeys,
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
  const { requireDraftAdmin, draftAdminGuard } = await import("./content/content-drafts.server");
  await requireDraftAdmin(db, userId);
  let result;
  try {
    result = await db.batch([
      draftAdminGuard(userId),
      {
        sql: "UPDATE content_drafts SET status='discarded',review_candidate_hash=NULL,review_base_hash=NULL,reviewed_at=NULL WHERE id=? AND status='draft' RETURNING id",
        params: [draftId],
      },
    ]);
  } catch {
    throw new Error("The draft could not be discarded or administrator authority changed.");
  }
  if (result[1]!.results.length !== 1)
    throw new Error("That draft is already closed or published.");
  return { discarded: true };
}

/** Turns a reviewed draft into a real (inactive) content release. */
export async function publishDraft(
  db: DB,
  userId: string,
  input: { draftId: string; version: string; candidateHash: string; baseHash: string },
) {
  const { loadReviewedDraft } = await import("./content/content-drafts.server");
  const draft = await loadReviewedDraft(db, userId, input.draftId);
  const { stageContentRelease } = await import("./content/release-lifecycle.server");
  return stageContentRelease(db, {
    version: input.version,
    bundle: { ...draft.bundle, version: input.version },
    actor: { kind: "admin", userId },
    source: "admin",
    draftReview: {
      draftId: input.draftId,
      candidateHash: input.candidateHash,
      baseHash: input.baseHash,
    },
  });
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
      .raw("julianday(created_at)+730>julianday(?)", [new Date().toISOString()])
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
