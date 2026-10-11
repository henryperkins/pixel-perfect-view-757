import { safetyPass } from "./default-bundle";
import type { ContentBundle, Interpretation } from "./default-bundle";

export type ThemeTag =
  | "structure"
  | "expansion"
  | "initiative"
  | "expression"
  | "connection"
  | "autonomy"
  | "rest"
  | "uncertainty";

export const VALID_THEME_TAGS: readonly ThemeTag[] = [
  "structure",
  "expansion",
  "initiative",
  "expression",
  "connection",
  "autonomy",
  "rest",
  "uncertainty",
] as const;

export type PairRelationship = "tension" | "reinforcement" | "independent";

export interface SynthesisSelector {
  interpretationKey: string;
  theme: ThemeTag;
}

export type SynthesisRule = {
  key: string;
  primary: SynthesisSelector;
  supporting: SynthesisSelector;
} & (
  | { relationship: "tension" | "reinforcement"; mechanism: string }
  | { relationship: "independent"; mechanism: null }
);

interface RawContentBundle {
  version?: string;
  schemaVersion?: number;
  cycles?: unknown[];
  synthesisRules?: unknown[];
  natal?: Record<string, string>;
  phases?: Record<string, string>;
  domains?: Record<string, unknown>;
}

export function validateContentGraph(raw: unknown): void {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Content bundle must be a non-null object");
  }

  const bundle = raw as RawContentBundle;
  if (bundle.cycles !== undefined && !Array.isArray(bundle.cycles)) {
    throw new Error("Interpretation catalogue must be an array");
  }

  if (bundle.schemaVersion !== undefined && bundle.schemaVersion !== 2) {
    throw new Error(`Unsupported schemaVersion: ${bundle.schemaVersion}`);
  }

  const hasFraming = [bundle.natal, bundle.phases, bundle.domains].some(
    (field) =>
      field && typeof field === "object" && !Array.isArray(field) && Object.keys(field).length > 0,
  );
  if (!Array.isArray(bundle.cycles) && !hasFraming) {
    throw new Error("Content bundle has an empty graph");
  }

  const hasRules = Array.isArray(bundle.synthesisRules);
  const cycles = Array.isArray(bundle.cycles) ? (bundle.cycles as Interpretation[]) : [];

  const hasAnnotatedThemes = cycles.some(
    (c) => c && Array.isArray(c.themes) && c.themes.length > 0,
  );

  if ((hasRules || hasAnnotatedThemes) && bundle.schemaVersion !== 2) {
    throw new Error("Theme annotations and synthesisRules require schemaVersion 2");
  }

  if (cycles.length > 2000) {
    throw new Error("Exceeded maximum of 2,000 interpretations");
  }

  const cycleMap = new Map<string, Interpretation>();
  const seenCycleKeys = new Set<string>();

  for (const c of cycles) {
    if (!c || typeof c !== "object") {
      throw new Error("Interpretation must be an object");
    }

    if (typeof c.key !== "string" || !c.key || c.key.length > 100) {
      throw new Error(`Interpretation key must be a string between 1 and 100 characters: ${c.key}`);
    }

    if (seenCycleKeys.has(c.key)) {
      throw new Error(`Duplicate interpretation key: ${c.key}`);
    }
    seenCycleKeys.add(c.key);

    if (typeof c.mechanism !== "string" || !c.mechanism || c.mechanism.length > 1000) {
      throw new Error(`Mechanism must be a string between 1 and 1000 characters for ${c.key}`);
    }
    const mechSafety = safetyPass(c.mechanism);
    if (mechSafety.flagged.length > 0) {
      throw new Error(
        `Interpretation ${c.key} mechanism failed safety pass: ${mechSafety.flagged.join(", ")}`,
      );
    }

    if (typeof c.question !== "string" || !c.question || c.question.length > 300) {
      throw new Error(`Question must be a string between 1 and 300 characters for ${c.key}`);
    }
    const qSafety = safetyPass(c.question);
    if (qSafety.flagged.length > 0) {
      throw new Error(
        `Interpretation ${c.key} question failed safety pass: ${qSafety.flagged.join(", ")}`,
      );
    }

    if (c.themes !== undefined) {
      if (!Array.isArray(c.themes)) {
        throw new Error(`Themes must be an array on interpretation ${c.key}`);
      }
      if (c.themes.length > 3) {
        throw new Error(`Exceeded maximum of 3 themes on interpretation ${c.key}`);
      }
      const seenThemes = new Set<string>();
      for (const t of c.themes) {
        if (!VALID_THEME_TAGS.includes(t)) {
          throw new Error(`Invalid theme tag "${t}" on interpretation ${c.key}`);
        }
        if (seenThemes.has(t)) {
          throw new Error(`Duplicate theme tag "${t}" on interpretation ${c.key}`);
        }
        seenThemes.add(t);
      }
    }

    cycleMap.set(c.key, c);
  }

  if (bundle.synthesisRules !== undefined) {
    if (!Array.isArray(bundle.synthesisRules)) {
      throw new Error("synthesisRules must be an array");
    }
    if (bundle.synthesisRules.length > 2000) {
      throw new Error("Exceeded maximum of 2,000 synthesis rules");
    }

    const seenRuleKeys = new Set<string>();
    const seenOrderedPairs = new Set<string>();

    for (const rule of bundle.synthesisRules as (Omit<
      SynthesisRule,
      "relationship" | "mechanism"
    > & { relationship: unknown; mechanism: unknown })[]) {
      if (!rule || typeof rule !== "object") {
        throw new Error("Synthesis rule must be an object");
      }

      if (typeof rule.key !== "string" || !rule.key || rule.key.length > 100) {
        throw new Error(
          `Synthesis rule key must be a string between 1 and 100 characters: ${rule.key}`,
        );
      }

      if (seenRuleKeys.has(rule.key)) {
        throw new Error(`Duplicate synthesis rule key: ${rule.key}`);
      }
      seenRuleKeys.add(rule.key);

      if (
        rule.relationship !== "tension" &&
        rule.relationship !== "reinforcement" &&
        rule.relationship !== "independent"
      ) {
        throw new Error(`Invalid synthesis relationship: ${rule.relationship}`);
      }

      if (rule.relationship === "independent") {
        if (rule.mechanism !== null) {
          throw new Error(`Independent synthesis rule ${rule.key} must have null mechanism`);
        }
      } else {
        if (typeof rule.mechanism !== "string" || !rule.mechanism || rule.mechanism.length > 1000) {
          throw new Error(
            `Positive synthesis rule ${rule.key} must have mechanism between 1 and 1000 characters`,
          );
        }
        const rSafety = safetyPass(rule.mechanism);
        if (rSafety.flagged.length > 0) {
          throw new Error(
            `Synthesis rule ${rule.key} mechanism failed safety pass: ${rSafety.flagged.join(", ")}`,
          );
        }
      }

      for (const role of ["primary", "supporting"] as const) {
        const selector = rule[role];
        if (!selector || typeof selector !== "object") {
          throw new Error(`Rule ${rule.key} missing valid ${role} selector`);
        }
        if (typeof selector.interpretationKey !== "string" || !selector.interpretationKey) {
          throw new Error(`Rule ${rule.key} ${role} selector missing interpretationKey`);
        }
        if (selector.interpretationKey.includes("*")) {
          throw new Error(
            `Rule ${rule.key} ${role} selector contains disallowed wildcard: ${selector.interpretationKey}`,
          );
        }

        if (!VALID_THEME_TAGS.includes(selector.theme)) {
          throw new Error(
            `Rule ${rule.key} ${role} selector has invalid theme tag: ${selector.theme}`,
          );
        }

        const parent = cycleMap.get(selector.interpretationKey);
        if (!parent) {
          throw new Error(
            `Missing parent interpretation for rule ${rule.key}: ${selector.interpretationKey}`,
          );
        }
        if (
          !/^(conjunction|opposition|square|trine|sextile|quincunx):[a-z_]+:[a-z_]+$/.test(
            selector.interpretationKey,
          )
        ) {
          throw new Error(`Rule ${rule.key} ${role} selector must reference an exact-aspect entry`);
        }
        const parentThemes = Array.isArray(parent.themes) ? parent.themes : [];
        if (!parentThemes.includes(selector.theme)) {
          throw new Error(
            `Rule ${rule.key} ${role} selector theme "${selector.theme}" not present on parent interpretation ${selector.interpretationKey}`,
          );
        }
      }

      const pairKey = `${rule.primary.interpretationKey}->${rule.supporting.interpretationKey}`;
      if (seenOrderedPairs.has(pairKey)) {
        throw new Error(`Duplicate synthesis rule ordered pair: ${pairKey}`);
      }
      seenOrderedPairs.add(pairKey);
    }
  }
}

export function normalizeContentBundle(
  raw: unknown,
  releaseVersion: string,
  defaults: ContentBundle,
): ContentBundle {
  const rawObj = (raw && typeof raw === "object" ? raw : {}) as RawContentBundle;

  const version = releaseVersion || rawObj.version || defaults.version;

  const hasPublishedCycles = Array.isArray(rawObj.cycles);
  const rawCycles = hasPublishedCycles ? rawObj.cycles : defaults.cycles;
  const cycles: Interpretation[] = (rawCycles as Interpretation[]).map((c) => ({
    key: c.key,
    mechanism: c.mechanism,
    question: c.question,
    // Missing-catalogue compatibility never carries new editorial approvals into a release.
    themes: hasPublishedCycles && Array.isArray(c.themes) ? [...c.themes] : [],
  }));

  const synthesisRules: SynthesisRule[] = Array.isArray(rawObj.synthesisRules)
    ? (structuredClone(rawObj.synthesisRules) as SynthesisRule[])
    : [];

  const natal = { ...defaults.natal, ...(rawObj.natal || {}) };
  const phases = { ...defaults.phases, ...(rawObj.phases || {}) };
  const domains = { ...defaults.domains, ...((rawObj.domains as ContentBundle["domains"]) || {}) };

  const hasAnnotatedThemes = cycles.some((c) => c.themes && c.themes.length > 0);
  const schemaVersion: 2 | undefined =
    rawObj.schemaVersion === 2 || synthesisRules.length > 0 || hasAnnotatedThemes ? 2 : undefined;

  const bundle: ContentBundle = {
    version,
    cycles,
    natal,
    phases,
    domains,
    synthesisRules,
  };

  if (schemaVersion !== undefined) {
    bundle.schemaVersion = schemaVersion;
  }

  return bundle;
}

export function samePublishedBundle(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!samePublishedBundle(a[i], b[i])) return false;
    }
    return true;
  }

  const aKeys = Object.keys(a as Record<string, unknown>).filter(
    (k) => (a as Record<string, unknown>)[k] !== undefined,
  );
  const bKeys = Object.keys(b as Record<string, unknown>).filter(
    (k) => (b as Record<string, unknown>)[k] !== undefined,
  );
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (
      !samePublishedBundle((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }
  return true;
}
