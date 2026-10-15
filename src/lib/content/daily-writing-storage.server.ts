import { z } from "zod";
import { createHash } from "node:crypto";
import { decryptJson } from "../crypto.server";
import { validateDailyWritingFrames } from "./schema";
import {
  assertDailyWritingBrief,
  completeDailySentences,
  toDailyWritingBrief,
  DAILY_WRITING_PLAN_VERSION,
  type DailyWritingPlan,
} from "./daily-writing";
import {
  dailyQuestionProblem,
  resolveDailyReflection,
  DAILY_REFLECTION_VERSION,
  type DailyReflectionPlan,
} from "./daily-reflection";
import {
  DAILY_WRITING_ISSUE_CODES,
  DAILY_WRITING_QUALITY_VERSION,
  type DailyWritingQualityReport,
  type DailyWritingRenderMode,
  type RecentDailyWritingHistory,
} from "../ai/daily-writing-quality";
import type { FactAtom } from "../ai/facts";
import { isPermitted } from "../registry";
import { civilContextExpiry } from "../retention.server";
import { validateDailyEditorialCatalogue, type DailyEditorialSelection } from "./daily-editorial";
import type { ContentBundle } from "./default-bundle";

const canonicalEditorial = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalEditorial)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => [key, canonicalEditorial(item)]),
        )
      : value;
/** Public source-copy identity, not a digest of member/private context. */
export const dailyEditorialDigest = (selection: DailyEditorialSelection): string =>
  createHash("sha256")
    .update(JSON.stringify(canonicalEditorial(selection)))
    .digest("hex");

export interface SavedDailyWriting {
  version: 1;
  readingId: string;
  snapshotId: string;
  releaseVersion: string;
  primaryCycleKey: string | null;
  plan: DailyWritingPlan;
  renderMode: DailyWritingRenderMode;
  reason: "template_editorial_failure" | null;
  sceneUse: { id: "SC1" | "SC2"; paragraph: number }[];
  reflection: DailyReflectionPlan;
  legacySourceQuestion: string | null;
  effectiveTimezone: string;
  astroParagraphCount: number;
  candidateQuality: DailyWritingQualityReport;
  finalQuality: DailyWritingQualityReport;
  historyAvailability: RecentDailyWritingHistory["availability"];
}
const report = z
  .object({
    version: z.literal(DAILY_WRITING_QUALITY_VERSION),
    outcome: z.enum(["pass", "warning", "reject", "not_evaluated"]),
    issues: z
      .array(
        z
          .object({
            code: z.enum(DAILY_WRITING_ISSUE_CODES),
            severity: z.enum(["info", "warning", "reject"]),
            paragraph: z.number().int().min(1).max(4).nullable(),
            ruleId: z
              .enum([
                "scene_ids",
                "scene_parents",
                "scene_cues",
                "past_event_clause",
                "stock_phrases",
                "scene_required",
                "no_scene",
                "template_editorial_failure",
                "exact_sentence",
                "demonstration_sentence",
                "six_word_repeat",
                "recent_opening",
                "recent_sentence",
              ])
              .nullable(),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();
const availability = z
  .object({
    status: z.enum(["available", "partial", "unavailable"]),
    inspected: z.number().int().min(0).max(12),
    retainedDays: z.number().int().min(0).max(3),
    omissions: z
      .array(
        z
          .object({
            reason: z.enum(["legacy", "invalid", "timezone", "candidate_limit"]),
            count: z.number().int().min(0).max(12),
          })
          .strict(),
      )
      .max(4),
  })
  .strict();
const key = z.string().min(1).max(100);
const sceneSchema = z
  .object({
    key,
    situation: z.string().min(1).max(180),
    focus: z.string().min(1).max(180),
    cues: z
      .object({
        objects: z.array(z.string().min(1).max(40)).min(1).max(5),
        actions: z.array(z.string().min(1).max(40)).min(1).max(5),
      })
      .strict(),
  })
  .strict();
const frameSchema = z
  .object({
    key,
    source: z.object({ kind: z.enum(["interpretation", "synthesis"]), key }).strict(),
    templateSentenceIndex: z.number().int().min(0),
    scenes: z.array(sceneSchema).min(1).max(2),
    reflection: z
      .object({
        standard: z.string().min(1).max(220),
        highStress: z.string().min(1).max(220).optional(),
        lowSleep: z.string().min(1).max(220).optional(),
      })
      .strict(),
  })
  .strict();
const editorialEntrySchema = z
  .object({
    key,
    writingMaterial: z
      .object({
        meaning: z.string().min(1).max(2000),
        scene: z.string().min(1).max(2000),
        imagery: z.string().min(1).max(2000).nullable(),
        direction: z.string().min(1).max(2000),
        reflection: z.string().min(1).max(2000),
      })
      .strict(),
    constraints: z.array(z.string().min(1).max(1000)).min(1).max(16),
    headline: z.string().min(1).max(140),
    reflection: z.string().min(1).max(220),
    fallbackParagraphs: z.array(z.string().min(1).max(1600)).min(2).max(4),
  })
  .strict();
const editorialSelectionSchema = z.discriminatedUnion("mode", [
  z
    .object({
      version: z.literal("daily-editorial-1"),
      releaseVersion: z.string().min(1).max(80),
      mode: z.literal("contact"),
      requiredFacts: z
        .array(z.enum(["C1", "I1", "C2", "I2", "S1"]))
        .min(2)
        .max(5),
      entry: editorialEntrySchema
        .extend({
          source: z.object({ kind: z.enum(["interpretation", "synthesis"]), key }).strict(),
          cycleKeys: z.array(key).min(1).max(2),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      version: z.literal("daily-editorial-1"),
      releaseVersion: z.string().min(1).max(80),
      mode: z.literal("quiet"),
      requiredFacts: z.array(z.never()).max(0),
      entry: editorialEntrySchema,
    })
    .strict(),
]);
const planSchema = z
  .object({
    version: z.literal(DAILY_WRITING_PLAN_VERSION),
    releaseVersion: z.string().min(1).max(80),
    theme: z
      .object({
        factId: z.enum(["I1", "S1"]),
        sourceKey: key,
        relationship: z.enum(["tension", "reinforcement"]).nullable(),
        requiredFacts: z
          .array(z.enum(["C1", "I1", "S1", "C2", "I2"]))
          .min(2)
          .max(5),
      })
      .strict()
      .nullable(),
    status: z.enum(["ready", "no_frame", "no_primary"]),
    frame: frameSchema.nullable(),
    scenes: z.array(sceneSchema.extend({ id: z.enum(["SC1", "SC2"]) }).strict()).max(2),
    templateSources: z
      .array(
        z
          .object({
            factId: z.enum(["I1", "S1"]),
            sourceKey: key,
            sentences: z.array(z.string().min(1).max(2000)).min(1).max(10),
          })
          .strict(),
      )
      .max(2),
    editorial: editorialSelectionSchema.optional(),
  })
  .strict();
const envelopeSchema = z
  .object({
    version: z.literal(1),
    readingId: z.string().min(1).max(160),
    snapshotId: z.string().min(1).max(160),
    releaseVersion: z.string().min(1).max(80),
    primaryCycleKey: z.string().min(1).max(160).nullable(),
    plan: planSchema,
    renderMode: z.enum(["framed", "unframed", "quiet", "minimal"]),
    reason: z.literal("template_editorial_failure").nullable(),
    sceneUse: z
      .array(
        z
          .object({ id: z.enum(["SC1", "SC2"]), paragraph: z.number().int().min(1).max(4) })
          .strict(),
      )
      .max(2),
    reflection: z
      .object({
        version: z.literal(DAILY_REFLECTION_VERSION),
        question: z.string().min(1).max(220),
        themeFactId: z.enum(["I1", "S1"]).nullable(),
        frameKey: z.string().min(1).max(100).nullable(),
        variant: z.enum([
          "standard",
          "high_stress",
          "low_sleep",
          "legacy",
          "fallback",
          "editorial",
        ]),
        localSource: z.enum(["WEL-03", "WEL-01"]).nullable(),
      })
      .strict(),
    legacySourceQuestion: z.string().min(1).max(220).nullable(),
    effectiveTimezone: z.string().min(1).max(100),
    astroParagraphCount: z.number().int().min(1).max(4),
    candidateQuality: report,
    finalQuality: report,
    historyAvailability: availability,
  })
  .strict();
export interface WritingRowBinding {
  id?: string;
  snapshot_id?: string;
  reading_date?: string;
  release_version: string | null;
  primary_cycle_key: string | null;
  language_meta: unknown;
  headline?: string;
  language_mode?: string | null;
}
export function validateSavedDailyWriting(
  value: unknown,
  row: WritingRowBinding,
  facts: FactAtom[],
  paragraphs: string[],
  citations: { paragraph: number; facts: string[] }[],
): SavedDailyWriting {
  if (JSON.stringify(value).length > 30_000) throw Error("Saved writing envelope bounds exceeded.");
  const saved = envelopeSchema.parse(value) as SavedDailyWriting;
  const meta = row.language_meta as Record<string, unknown>;
  const plan = saved.plan;
  if (
    saved.readingId !== row.id ||
    saved.snapshotId !== row.snapshot_id ||
    saved.releaseVersion !== row.release_version ||
    saved.primaryCycleKey !== row.primary_cycle_key ||
    saved.astroParagraphCount > paragraphs.length ||
    saved.astroParagraphCount !== meta["astroParagraphCount"] ||
    !plan ||
    plan.version !== DAILY_WRITING_PLAN_VERSION ||
    plan.releaseVersion !== saved.releaseVersion ||
    !["ready", "no_frame", "no_primary"].includes(plan.status) ||
    !Array.isArray(plan.scenes) ||
    plan.scenes.length > 2 ||
    !Array.isArray(plan.templateSources) ||
    plan.templateSources.length > 2
  )
    throw Error("Saved writing identity or paragraph bounds do not match its reading.");
  try {
    new Intl.DateTimeFormat("en", { timeZone: saved.effectiveTimezone });
  } catch {
    throw Error("Invalid saved writing timezone.");
  }
  const published = (fact: FactAtom) =>
    fact.statement
      .replace(/^Published (?:tension|reinforcement) synthesis [^\n]+ \(parents: [^)]+\): /, "")
      .replace(/^Published interpretation [^\n]+?: /, "");
  assertDailyWritingBrief(toDailyWritingBrief(plan), plan, facts);
  if (plan.editorial) {
    const selected = plan.editorial;
    if (
      meta["dailyEditorialDigest"] !== dailyEditorialDigest(selected) ||
      row.headline !== selected.entry.headline ||
      !["model", "template"].includes(row.language_mode ?? "")
    )
      throw Error("Saved editorial source digest or headline differs from its reading.");
    const first = facts.find((fact) => fact.id === "I1");
    const second = facts.find((fact) => fact.id === "I2");
    const synthesis = facts.find((fact) => fact.id === "S1");
    const sourceBundle: ContentBundle = {
      version: plan.releaseVersion,
      schemaVersion: 6,
      natal: {},
      phases: {},
      domains: {},
      cycles: facts
        .filter((fact) => /^I[123]$/.test(fact.id))
        .map((fact) => ({
          key: fact.sourceKey!,
          mechanism: published(fact),
          question: selected.entry.reflection,
        })),
      synthesisRules: synthesis
        ? [
            {
              key: synthesis.sourceKey!,
              relationship: plan.theme!.relationship!,
              mechanism: published(synthesis),
              primary: { interpretationKey: first!.sourceKey!, theme: "structure" },
              supporting: { interpretationKey: second!.sourceKey!, theme: "expansion" },
            },
          ]
        : [],
    };
    validateDailyEditorialCatalogue(
      {
        version: selected.version,
        frames: selected.mode === "contact" ? [selected.entry] : [],
        quiet: selected.mode === "quiet" ? [selected.entry] : [],
      },
      sourceBundle,
    );
    if (
      selected.mode === "contact"
        ? paragraphs
            .slice(0, saved.astroParagraphCount)
            .some((_, index) =>
              selected.requiredFacts.some(
                (id) => !citations.find((item) => item.paragraph === index + 1)?.facts.includes(id),
              ),
            )
        : citations.some((item) => item.paragraph <= saved.astroParagraphCount && item.facts.length)
    )
      throw Error("Saved editorial paragraph lost its selected source or parent references.");
    if (
      row.language_mode === "template" &&
      (JSON.stringify(paragraphs.slice(0, saved.astroParagraphCount)) !==
        JSON.stringify(selected.entry.fallbackParagraphs) ||
        (selected.mode === "contact" &&
          selected.entry.fallbackParagraphs.some(
            (_, index) =>
              citations.find((item) => item.paragraph === index + 1)?.facts.join("|") !==
              selected.requiredFacts.join("|"),
          )))
    )
      throw Error("Saved editorial fallback differs from its exact selected source.");
  } else if (meta["dailyEditorialDigest"] !== undefined)
    throw Error("Saved editorial digest has no matching source selection.");
  const theme = plan.theme;
  if (
    (plan.status === "no_primary") !== (theme === null) ||
    (plan.status === "ready") !== (plan.frame !== null) ||
    (theme && theme.factId !== "I1" && theme.factId !== "S1") ||
    (theme && (theme.factId === "I1") !== (theme.relationship === null)) ||
    (theme &&
      theme.requiredFacts.join("|") !== (theme.factId === "S1" ? "S1|C1|I1|C2|I2" : "C1|I1"))
  )
    throw Error("Invalid saved writing theme/status.");
  const sceneCopy = (plan.frame?.scenes ?? []).map((scene, index) => ({
    ...scene,
    id: index === 0 ? "SC1" : "SC2",
  }));
  if (JSON.stringify(sceneCopy) !== JSON.stringify(plan.scenes))
    throw Error("Saved scene declarations differ from their frame.");
  if (plan.frame) {
    const source = facts.find((fact) => fact.id === theme!.factId)!;
    validateDailyWritingFrames({
      schemaVersion: 5,
      cycles: source.id === "I1" ? [{ key: source.sourceKey, mechanism: published(source) }] : [],
      synthesisRules:
        source.id === "S1"
          ? [
              {
                key: source.sourceKey,
                relationship: theme!.relationship,
                mechanism: published(source),
              },
            ]
          : [],
      dailyWritingFrames: [plan.frame],
    });
  }
  if (plan.templateSources.length !== (theme?.factId === "S1" ? 2 : theme ? 1 : 0))
    throw Error("Invalid saved template source inventory.");
  for (const [index, source] of plan.templateSources.entries()) {
    const fact = facts.find((item) => item.id === source.factId);
    if (
      source.factId !== (index === 0 ? "I1" : "S1") ||
      !fact ||
      source.sourceKey !== fact.sourceKey ||
      !Array.isArray(source.sentences) ||
      !source.sentences.length ||
      source.sentences.length > 10 ||
      source.sentences.some(
        (sentence) =>
          typeof sentence !== "string" ||
          !completeDailySentences(published(fact)).includes(sentence),
      )
    )
      throw Error("Saved compact template sentence differs from its published source.");
    if (
      plan.frame?.source.key === source.sourceKey &&
      source.sentences.join(" ") !==
        completeDailySentences(published(fact))[plan.frame.templateSentenceIndex]
    )
      throw Error("Saved central compact sentence differs from its reviewed index.");
  }
  if (
    (plan.status === "ready" && !["framed", "minimal"].includes(saved.renderMode)) ||
    (plan.status === "no_frame" && saved.renderMode !== "unframed") ||
    (plan.status === "no_primary" && saved.renderMode !== "quiet") ||
    (saved.renderMode === "framed" && (!plan.frame || !saved.sceneUse.length)) ||
    (saved.renderMode !== "framed" && saved.sceneUse.length) ||
    (saved.renderMode === "minimal") !== (saved.reason === "template_editorial_failure") ||
    (saved.renderMode === "quiet" && theme) ||
    new Set(saved.sceneUse.map((use) => use.id)).size !== saved.sceneUse.length
  )
    throw Error("Invalid saved scene rendering evidence.");
  for (const use of saved.sceneUse) {
    const citation = citations.find((item) => item.paragraph === use.paragraph);
    if (
      !plan.scenes.some((scene) => scene.id === use.id) ||
      use.paragraph > saved.astroParagraphCount ||
      !citation ||
      theme!.requiredFacts.some((id) => !citation.facts.includes(id))
    )
      throw Error("Saved illustration lacks its source paragraph parents.");
  }
  const reflection = saved.reflection;
  if (
    dailyQuestionProblem(reflection.question) ||
    reflection.themeFactId !== (theme?.factId ?? null) ||
    reflection.frameKey !== (plan.editorial?.entry.key ?? plan.frame?.key ?? null)
  )
    throw Error("Invalid saved source reflection.");
  if (
    (reflection.variant === "editorial") !== !!plan.editorial ||
    (plan.editorial && reflection.question !== plan.editorial.entry.reflection)
  )
    throw Error("Saved editorial reflection differs from its source selection.");
  if (reflection.variant === "legacy") {
    if (
      plan.status !== "no_frame" ||
      theme?.factId !== "I1" ||
      saved.legacySourceQuestion !== reflection.question
    )
      throw Error("Saved legacy question differs from its frozen primary source question.");
  } else if (saved.legacySourceQuestion !== null) throw Error("Unexpected legacy question source.");
  if (
    reflection.variant === "fallback" &&
    (plan.status === "ready" ||
      reflection.question !==
        resolveDailyReflection(plan, null, {
          granted: new Set(),
          tone: "plain",
          depth: "standard",
          localBucket: null,
          checkIn: null,
          wellness: null,
        }).question)
  )
    throw Error("Saved fallback question differs from its compiler output.");
  const variant =
    reflection.variant === "high_stress"
      ? plan.frame?.reflection.highStress
      : reflection.variant === "low_sleep"
        ? plan.frame?.reflection.lowSleep
        : reflection.variant === "standard"
          ? plan.frame?.reflection.standard
          : null;
  if (
    (variant !== null && variant !== reflection.question) ||
    reflection.localSource !==
      (reflection.variant === "high_stress"
        ? "WEL-03"
        : reflection.variant === "low_sleep"
          ? "WEL-01"
          : null)
  )
    throw Error("Saved reflection differs from its selected source variant.");
  if (["reject", "not_evaluated"].includes(saved.finalQuality.outcome))
    throw Error("Saved final writing evidence is not valid.");
  for (const quality of [saved.candidateQuality, saved.finalQuality]) {
    const outcome = quality.issues.some((issue) => issue.severity === "reject")
      ? "reject"
      : quality.issues.some((issue) => issue.severity === "warning")
        ? "warning"
        : "pass";
    if (
      quality.outcome === "not_evaluated"
        ? quality.issues.length !== 0
        : quality.outcome !== outcome
    )
      throw Error("Saved writing quality outcome contradicts its bounded issues.");
    if (
      quality.issues.some(
        (issue) =>
          issue.paragraph !== null &&
          issue.paragraph > (quality === saved.finalQuality ? saved.astroParagraphCount : 4),
      )
    )
      throw Error("Invalid writing quality paragraph.");
  }
  return saved;
}
export type SavedWritingState =
  | { status: "saved"; evidence: SavedDailyWriting }
  | { status: "unavailable"; reason: "expired" | "revoked" };
export async function readSavedDailyWriting(
  row: WritingRowBinding,
  dek: CryptoKey,
  facts: FactAtom[],
  paragraphs: string[],
  citations: { paragraph: number; facts: string[] }[],
  granted: Set<string> = new Set(),
  now = new Date(),
): Promise<SavedWritingState | null> {
  const meta = row.language_meta as Record<string, unknown> | null;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const unavailable = meta["daily_writing_unavailable"] as
    { version?: unknown; reason?: unknown } | undefined;
  if (unavailable) {
    if (
      unavailable.version !== 1 ||
      !["expired", "revoked"].includes(String(unavailable.reason)) ||
      Object.hasOwn(meta, "daily_writing_ct")
    )
      throw Error("Saved writing tombstone is invalid.");
    return { status: "unavailable", reason: unavailable.reason as "expired" | "revoked" };
  }
  const present = Object.hasOwn(meta, "daily_writing_ct");
  if (!present && meta["dailyEditorialDigest"] !== undefined)
    throw Error("Saved editorial source identity is missing its writing evidence.");
  if (!present && meta["dailyWritingStatus"] === undefined) return null;
  const retention = meta["dailyWritingRetention"] as
    { sourceIds?: unknown; expiresAt?: unknown } | undefined;
  if (retention) {
    if (
      !Array.isArray(retention.sourceIds) ||
      retention.sourceIds.length !== 1 ||
      !["WEL-01", "WEL-03"].includes(retention.sourceIds[0]) ||
      typeof retention.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(retention.expiresAt))
    )
      throw Error("Saved writing retention boundary is invalid.");
    if (!row.reading_date || retention.expiresAt !== civilContextExpiry(row.reading_date, 180))
      throw Error("Saved writing expiry differs from its source civil-day policy.");
    if (!isPermitted(retention.sourceIds[0], "reflection_prompt", granted))
      return { status: "unavailable", reason: "revoked" };
    if (now.getTime() >= Date.parse(retention.expiresAt))
      return { status: "unavailable", reason: "expired" };
  }
  try {
    if (typeof meta["daily_writing_ct"] !== "string" || meta["dailyWritingStatus"] !== "saved")
      throw Error("Missing writing envelope.");
    const evidence = validateSavedDailyWriting(
      await decryptJson(dek, meta["daily_writing_ct"]),
      row,
      facts,
      paragraphs,
      citations,
    );
    if (
      evidence.reflection.localSource !== (retention ? (retention.sourceIds as string[])[0] : null)
    )
      throw Error("Private reflection lacks its retention binding.");
    return { status: "saved", evidence };
  } catch {
    throw Error("Saved daily writing evidence could not be loaded. Please retry.");
  }
}
