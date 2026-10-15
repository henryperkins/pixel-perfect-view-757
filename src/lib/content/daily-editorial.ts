import { findInterpretation, safetyPass, type ContentBundle } from "./default-bundle";
import type { DailyInterpretationPlan } from "./synthesis";
import { dailyQuestionProblem } from "./daily-reflection";
import { dailyWritingReferenceClaim } from "./daily-writing-policy";

export const DAILY_EDITORIAL_VERSION = "daily-editorial-1" as const;
export interface DailyEditorialMaterial {
  meaning: string;
  scene: string;
  imagery: string | null;
  direction: string;
  reflection: string;
}
export interface DailyQuietEditorial {
  key: string;
  writingMaterial: DailyEditorialMaterial;
  constraints: string[];
  headline: string;
  reflection: string;
  fallbackParagraphs: string[];
}
export interface DailyEditorialFrame extends DailyQuietEditorial {
  source: { kind: "interpretation" | "synthesis"; key: string };
  /** Actual cycle identities, primary first. Family copy cannot borrow another aspect's image. */
  cycleKeys: string[];
}
export interface DailyEditorialCatalogue {
  version: typeof DAILY_EDITORIAL_VERSION;
  frames: DailyEditorialFrame[];
  quiet: DailyQuietEditorial[];
}
export type DailyEditorialSelection = {
  version: typeof DAILY_EDITORIAL_VERSION;
  releaseVersion: string;
  requiredFacts: string[];
} & (
  { mode: "contact"; entry: DailyEditorialFrame } | { mode: "quiet"; entry: DailyQuietEditorial }
);
export interface DailyEditorialContext {
  day?: string;
  tone: string;
  depth: string;
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
function fields(value: unknown, allowed: string[], required = allowed) {
  if (
    !object(value) ||
    Object.keys(value).some((key) => !allowed.includes(key)) ||
    required.some((key) => !(key in value))
  )
    throw Error("Invalid editorial object fields.");
}
const text = (value: unknown, limit: number): value is string =>
  typeof value === "string" &&
  !!value.trim() &&
  value === value.trim() &&
  value.length <= limit &&
  !/[\r\n]/.test(value);
const safe = (value: unknown, limit: number): value is string =>
  text(value, limit) && safetyPass(value).flagged.length === 0;
const key = (value: unknown): value is string =>
  text(value, 100) && /^[a-z0-9][a-z0-9:_.*-]*$/i.test(value);
const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });
function completeParagraph(value: string) {
  const sentences = [...sentenceSegmenter.segment(value)]
    .map((item) => item.segment.trim())
    .filter(Boolean);
  return (
    sentences.length >= 1 &&
    sentences.length <= 4 &&
    sentences.every((item) => /[.!]["')\]]*$/.test(item))
  );
}

function sourceForCycle(bundle: ContentBundle, cycleKey: string) {
  const match = /^([a-z]+)_(conjunction|opposition|square|trine|sextile|quincunx)_([a-z]+)$/.exec(
    cycleKey,
  );
  if (!match) throw Error("Invalid editorial cycle identity.");
  return findInterpretation(bundle, match[2]!, match[1]!, match[3]!);
}

/** Bounds and exact bindings only; semantic/editorial approval remains a separate review. */
export function validateDailyEditorialCatalogue(
  value: unknown,
  bundle: ContentBundle,
): asserts value is DailyEditorialCatalogue {
  if (value === undefined) return;
  fields(value, ["version", "frames", "quiet"]);
  const catalogue = value as DailyEditorialCatalogue;
  if (
    bundle.schemaVersion !== 6 ||
    catalogue.version !== DAILY_EDITORIAL_VERSION ||
    !Array.isArray(catalogue.frames) ||
    catalogue.frames.length > 200 ||
    !Array.isArray(catalogue.quiet) ||
    catalogue.quiet.length > 31
  )
    throw Error("Invalid editorial catalogue version or bounds.");
  const keys = new Set<string>(),
    bindings = new Set<string>();
  for (const [quiet, entries] of [
    [false, catalogue.frames],
    [true, catalogue.quiet],
  ] as const) {
    for (const entry of entries) {
      const common = [
        "key",
        "writingMaterial",
        "constraints",
        "headline",
        "reflection",
        "fallbackParagraphs",
      ];
      fields(entry, quiet ? common : [...common, "source", "cycleKeys"]);
      if (!key(entry.key) || keys.has(entry.key))
        throw Error("Invalid or duplicate editorial entry key.");
      keys.add(entry.key);
      fields(entry.writingMaterial, ["meaning", "scene", "imagery", "direction", "reflection"]);
      const material = entry.writingMaterial;
      if (
        ![material.meaning, material.scene, material.direction, material.reflection].every((item) =>
          safe(item, 2000),
        ) ||
        (material.imagery !== null && !safe(material.imagery, 2000)) ||
        (quiet && material.imagery !== null)
      )
        throw Error("Invalid editorial writing material.");
      if (
        !Array.isArray(entry.constraints) ||
        entry.constraints.length < 1 ||
        entry.constraints.length > 16 ||
        entry.constraints.some((item) => !text(item, 1000))
      )
        throw Error("Invalid editorial controls.");
      if (
        !safe(entry.headline, 140) ||
        entry.headline.split(/\s+/).length < 3 ||
        entry.headline.split(/\s+/).length > 9 ||
        dailyQuestionProblem(entry.reflection)
      )
        throw Error("Invalid editorial headline or reflection.");
      if (
        !Array.isArray(entry.fallbackParagraphs) ||
        entry.fallbackParagraphs.length < 2 ||
        entry.fallbackParagraphs.length > 4 ||
        entry.fallbackParagraphs.some(
          (item) =>
            !safe(item, 1600) ||
            item.split(/\s+/).length > 200 ||
            /\?/.test(item) ||
            !completeParagraph(item),
        ) ||
        entry.fallbackParagraphs.join(" ").split(/\s+/).length > 700
      )
        throw Error("Invalid editorial fallback paragraphs.");
      if (quiet) {
        const readerText = [
          entry.headline,
          entry.reflection,
          ...entry.fallbackParagraphs,
          ...Object.values(material).filter((item): item is string => item !== null),
        ].join(" ");
        if (
          dailyWritingReferenceClaim(readerText) ||
          /\b(?:mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|natal|transit|horoscope|zodiac|cosmic)\b/i.test(
            readerText,
          )
        )
          throw Error("Quiet editorial material cannot introduce astrology.");
        continue;
      }
      const frame = entry as DailyEditorialFrame;
      fields(frame.source, ["kind", "key"]);
      if (
        !["interpretation", "synthesis"].includes(frame.source.kind) ||
        !key(frame.source.key) ||
        frame.source.key.includes("*")
      )
        throw Error("Invalid editorial source identity.");
      const rule = bundle.synthesisRules?.find((item) => item.key === frame.source.key);
      const source =
        frame.source.kind === "interpretation"
          ? bundle.cycles.find((item) => item.key === frame.source.key)
          : rule?.relationship !== "independent"
            ? rule
            : undefined;
      if (
        !source ||
        !Array.isArray(frame.cycleKeys) ||
        frame.cycleKeys.length !== (frame.source.kind === "synthesis" ? 2 : 1)
      )
        throw Error("Editorial source or parents are missing.");
      const actual = frame.cycleKeys.map((cycle) => sourceForCycle(bundle, cycle).key);
      const expected =
        frame.source.kind === "interpretation"
          ? [frame.source.key]
          : [rule!.primary.interpretationKey, rule!.supporting.interpretationKey];
      if (actual.join("|") !== expected.join("|"))
        throw Error("Editorial geometry does not select its exact source graph.");
      const binding = `${frame.source.kind}:${frame.source.key}:${frame.cycleKeys.join("|")}`;
      if (bindings.has(binding)) throw Error("Duplicate editorial source binding.");
      bindings.add(binding);
    }
  }
}

/** Only explicit warm/standard candidate content participates; no fallback frame inheritance. */
export function resolveDailyEditorial(
  bundle: ContentBundle,
  interpretation: DailyInterpretationPlan,
  context?: DailyEditorialContext,
): DailyEditorialSelection | null {
  if (!bundle.dailyEditorial) return null;
  if (interpretation.releaseVersion !== bundle.version)
    throw Error("Editorial source release mismatch.");
  if (!context || context.tone !== "warm" || context.depth !== "standard") return null;
  validateDailyEditorialCatalogue(bundle.dailyEditorial, bundle);
  const primary = interpretation.interpretations.find((item) => item.index === 1);
  const common = { version: DAILY_EDITORIAL_VERSION, releaseVersion: bundle.version };
  if (!primary) {
    if (interpretation.synthesis || interpretation.interpretations.length)
      throw Error("Quiet editorial selection contains an interpretation or synthesis.");
    if (!context.day || !bundle.dailyEditorial.quiet.length) return null;
    const timestamp = Date.parse(`${context.day}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(context.day) ||
      !Number.isFinite(timestamp) ||
      new Date(timestamp).toISOString().slice(0, 10) !== context.day
    )
      throw Error("Invalid editorial local day.");
    // An editorial rotation epoch, never an astrological explanation of the day.
    const day = Math.floor((timestamp - Date.UTC(2026, 9, 11)) / 86400000);
    const count = bundle.dailyEditorial.quiet.length;
    const entry = bundle.dailyEditorial.quiet[((day % count) + count) % count]!;
    return { ...common, mode: "quiet", entry: structuredClone(entry), requiredFacts: [] };
  }
  const synthesis = interpretation.synthesis;
  const sourceKey = synthesis?.ruleKey ?? primary.interpretationKey;
  const cycles = [
    primary,
    ...(synthesis ? [interpretation.interpretations.find((item) => item.index === 2)] : []),
  ];
  if (cycles.some((item) => !item)) throw Error("Editorial synthesis parent is missing.");
  const frame = bundle.dailyEditorial.frames.find(
    (item) =>
      item.source.kind === (synthesis ? "synthesis" : "interpretation") &&
      item.source.key === sourceKey &&
      item.cycleKeys.join("|") === cycles.map((item) => item!.cycleKey).join("|"),
  );
  if (!frame) return null;
  for (const item of cycles) {
    const source = sourceForCycle(bundle, item!.cycleKey);
    if (source.key !== item!.interpretationKey || source.mechanism !== item!.mechanism)
      throw Error("Editorial interpretation differs from its source.");
  }
  if (synthesis) {
    const rule = bundle.synthesisRules?.find((item) => item.key === synthesis.ruleKey);
    if (
      !rule ||
      rule.mechanism !== synthesis.mechanism ||
      rule.relationship !== synthesis.relationship ||
      synthesis.releaseVersion !== bundle.version
    )
      throw Error("Editorial synthesis differs from its source.");
  }
  return {
    ...common,
    mode: "contact",
    entry: structuredClone(frame),
    requiredFacts: synthesis ? ["S1", "C1", "I1", "C2", "I2"] : ["C1", "I1"],
  };
}

/** No headline, authored fallback, evidence, private context or provenance enters the model brief. */
export function toDailyEditorialBrief(selection: DailyEditorialSelection) {
  return {
    version: selection.version,
    mode: selection.mode,
    requiredFacts: [...selection.requiredFacts],
    writingMaterial: structuredClone(selection.entry.writingMaterial),
    constraints: [...selection.entry.constraints],
  };
}
