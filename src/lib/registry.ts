/**
 * Data-source registry (executable policy).
 *
 * Derived from pattern_like_astrology_app_data_source_registry_v0.2.
 * Every input the reading engine may touch has to exist here, carry a
 * permission tier, a sensitivity level and an explicit allowed-use list.
 * Anything in PROHIBITED_SOURCES can never be collected or referenced.
 */

export type Sensitivity = "public" | "ordinary" | "personal" | "sensitive" | "highly_sensitive";

export type AllowedUse =
  | "calculation"
  | "timing"
  | "framing"
  | "personalisation"
  | "reflection_prompt"
  | "external_language"
  | "provenance";

export type Tier = 0 | 1 | 2 | 3;

export interface SourceDef {
  id: string;
  label: string;
  description: string;
  tier: Tier;
  sensitivity: Sensitivity;
  allowed_uses: AllowedUse[];
  /** launch-phase sources are the only ones the MVP may enable */
  phase: "launch" | "later";
  retention_days: number | null;
}

export interface TierDef {
  tier: Tier;
  name: string;
  summary: string;
  required: boolean;
}

export const TIERS: TierDef[] = [
  {
    tier: 0,
    name: "Calculation minimum",
    summary:
      "The irreducible inputs needed to place the sky. Without these there is no chart and no reading.",
    required: true,
  },
  {
    tier: 1,
    name: "Reflective",
    summary:
      "What you tell the app about yourself on purpose: preferences, check-ins, marked moments.",
    required: false,
  },
  {
    tier: 2,
    name: "Situational",
    summary:
      "Coarse ambient context — local time of day, season, device locale. Never continuous tracking.",
    required: false,
  },
  {
    tier: 3,
    name: "Sensitive wellness",
    summary:
      "Self-reported wellbeing signals. Off by default, purged aggressively, never used to diagnose.",
    required: false,
  },
];

export const SOURCES: SourceDef[] = [
  // ---- Tier 0 — calculation minimum (AST-01..AST-08, AST-20)
  {
    id: "AST-01",
    label: "Birth date",
    description: "Calendar date of birth in the local civil calendar.",
    tier: 0,
    sensitivity: "personal",
    allowed_uses: ["calculation", "provenance"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "AST-02",
    label: "Birth time",
    description: "Clock time of birth, with a declared accuracy band.",
    tier: 0,
    sensitivity: "personal",
    allowed_uses: ["calculation", "provenance"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "AST-03",
    label: "Birth place",
    description: "Latitude and longitude of the birth location.",
    tier: 0,
    sensitivity: "personal",
    allowed_uses: ["calculation", "provenance"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "AST-04",
    label: "Historical timezone offset",
    description: "Offset in force at the birth moment, including wartime rules.",
    tier: 0,
    sensitivity: "ordinary",
    allowed_uses: ["calculation", "provenance"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "AST-05",
    label: "Planetary ephemeris",
    description: "Geocentric positions of Sun through Pluto.",
    tier: 0,
    sensitivity: "public",
    allowed_uses: ["calculation", "timing", "provenance", "external_language"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "AST-06",
    label: "Lunar nodes",
    description: "Mean lunar node positions.",
    tier: 0,
    sensitivity: "public",
    allowed_uses: ["calculation", "timing", "provenance"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "AST-07",
    label: "Angles and houses",
    description: "Ascendant, Midheaven and the declared house division.",
    tier: 0,
    sensitivity: "public",
    allowed_uses: ["calculation", "provenance", "external_language"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "AST-08",
    label: "Aspect geometry",
    description: "Angular separations and orbs between chart points.",
    tier: 0,
    sensitivity: "public",
    allowed_uses: ["calculation", "timing", "provenance", "external_language"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "AST-20",
    label: "Birth-time uncertainty band",
    description:
      "Declared confidence in the birth time, propagated into every angle-dependent claim.",
    tier: 0,
    sensitivity: "ordinary",
    allowed_uses: ["calculation", "framing", "provenance", "external_language"],
    phase: "launch",
    retention_days: null,
  },

  // ---- Tier 1 — reflective (USR-**)
  {
    id: "USR-01",
    label: "Tone preference",
    description: "How direct or gentle the language should be.",
    tier: 1,
    sensitivity: "ordinary",
    allowed_uses: ["framing", "personalisation", "external_language"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "USR-02",
    label: "Depth preference",
    description: "How much technical detail to surface by default.",
    tier: 1,
    sensitivity: "ordinary",
    allowed_uses: ["framing", "personalisation", "external_language"],
    phase: "launch",
    retention_days: null,
  },
  {
    id: "USR-04",
    label: "Daily check-in",
    description: "Self-reported mood and energy for a given day.",
    tier: 1,
    sensitivity: "personal",
    allowed_uses: ["framing", "reflection_prompt", "personalisation"],
    phase: "launch",
    retention_days: 730,
  },
  {
    id: "USR-07",
    label: "Marked moments",
    description: "Events you deliberately record against a date.",
    tier: 1,
    sensitivity: "personal",
    allowed_uses: ["framing", "reflection_prompt", "provenance"],
    phase: "launch",
    retention_days: 1825,
  },
  {
    id: "USR-11",
    label: "Resonance feedback",
    description: "Whether a reading landed, and why.",
    tier: 1,
    sensitivity: "ordinary",
    allowed_uses: ["personalisation", "provenance"],
    phase: "launch",
    retention_days: 730,
  },
  {
    id: "USR-14",
    label: "Life domain focus",
    description: "Which areas of life you want emphasised.",
    tier: 1,
    sensitivity: "personal",
    allowed_uses: ["framing", "personalisation"],
    phase: "launch",
    retention_days: null,
  },

  // ---- Tier 2 — situational (DEV/AMB)
  {
    id: "DEV-01",
    label: "Device locale and timezone",
    description: "Current timezone, used only to pick the right local day.",
    tier: 2,
    sensitivity: "ordinary",
    allowed_uses: ["timing", "framing"],
    phase: "launch",
    retention_days: 90,
  },
  {
    id: "AMB-02",
    label: "Local time of day",
    description: "Morning / afternoon / evening bucket at read time.",
    tier: 2,
    sensitivity: "ordinary",
    allowed_uses: ["framing"],
    phase: "launch",
    retention_days: 30,
  },
  {
    id: "AMB-05",
    label: "Season and daylight",
    description: "Coarse seasonal band derived from date and latitude.",
    tier: 2,
    sensitivity: "public",
    allowed_uses: ["framing"],
    phase: "launch",
    retention_days: 30,
  },

  // ---- Tier 3 — sensitive wellness
  {
    id: "WEL-01",
    label: "Sleep quality (self-reported)",
    description: "A single coarse band you type in yourself. Never device-derived.",
    tier: 3,
    sensitivity: "sensitive",
    allowed_uses: ["framing", "reflection_prompt"],
    phase: "launch",
    retention_days: 180,
  },
  {
    id: "WEL-03",
    label: "Stress load (self-reported)",
    description: "A coarse band describing current pressure.",
    tier: 3,
    sensitivity: "sensitive",
    allowed_uses: ["framing", "reflection_prompt"],
    phase: "launch",
    retention_days: 180,
  },
];

/** NO-01..NO-24 — never collected, never inferred, never accepted. */
export const PROHIBITED_SOURCES: { id: string; label: string }[] = [
  { id: "NO-01", label: "Raw email or message contents" },
  { id: "NO-02", label: "Contact lists and address books" },
  { id: "NO-03", label: "Continuous location history" },
  { id: "NO-04", label: "Biometric streams (heart rate, HRV, sleep staging)" },
  { id: "NO-05", label: "Microphone or camera capture" },
  { id: "NO-06", label: "Keystroke or typing dynamics" },
  { id: "NO-07", label: "Browsing history and web trackers" },
  { id: "NO-08", label: "Purchase and financial transaction records" },
  { id: "NO-09", label: "Health records or clinical diagnoses" },
  { id: "NO-10", label: "Medication and prescription data" },
  { id: "NO-11", label: "Genetic or ancestry data" },
  { id: "NO-12", label: "Reproductive and fertility tracking" },
  { id: "NO-13", label: "Sexual orientation inference" },
  { id: "NO-14", label: "Religious affiliation inference" },
  { id: "NO-15", label: "Political affiliation inference" },
  { id: "NO-16", label: "Immigration or citizenship status" },
  { id: "NO-17", label: "Criminal record data" },
  { id: "NO-18", label: "Credit scores and creditworthiness" },
  { id: "NO-19", label: "Employer surveillance feeds" },
  { id: "NO-20", label: "Third-party data broker profiles" },
  { id: "NO-21", label: "Social graph scraping" },
  { id: "NO-22", label: "Facial recognition or emotion inference" },
  { id: "NO-23", label: "Children's data under the age gate" },
  { id: "NO-24", label: "Cross-app advertising identifiers" },
];

export const SOURCE_MAP: Record<string, SourceDef> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);

export const LAUNCH_SOURCES = SOURCES.filter((s) => s.phase === "launch");

export function sourcesForTier(tier: Tier): SourceDef[] {
  return LAUNCH_SOURCES.filter((s) => s.tier === tier);
}

/** Tier 0 is implied by using the product at all; everything else is opt-in. */
export function defaultGranted(source: SourceDef): boolean {
  return source.tier === 0;
}

export class PolicyViolation extends Error {}

/**
 * Runtime gate. Every read of a source inside the reading engine goes through
 * this, so a use that the registry does not permit fails loudly instead of
 * silently leaking into a reading.
 */
export function assertUse(sourceId: string, use: AllowedUse): SourceDef {
  if (PROHIBITED_SOURCES.some((p) => p.id === sourceId)) {
    throw new PolicyViolation(`Source ${sourceId} is prohibited and can never be used.`);
  }
  const def = SOURCE_MAP[sourceId];
  if (!def) throw new PolicyViolation(`Unknown source ${sourceId}.`);
  if (!def.allowed_uses.includes(use)) {
    throw new PolicyViolation(`Source ${sourceId} does not permit use "${use}".`);
  }
  return def;
}

export function isPermitted(sourceId: string, use: AllowedUse, granted: Set<string>): boolean {
  const def = SOURCE_MAP[sourceId];
  if (!def) return false;
  if (!def.allowed_uses.includes(use)) return false;
  if (def.tier === 0) return true;
  return granted.has(sourceId);
}
