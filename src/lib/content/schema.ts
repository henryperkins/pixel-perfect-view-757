import { safetyPass } from "./default-bundle";
import type { ContentBundle, Interpretation } from "./default-bundle";
import { BODIES, SIGNS } from "../astro/ephemeris";
import { ASPECTS } from "../astro/chart";
import { natalLensWordingProblem, natalMechanismHasTechnicalClaim } from "./natal-lens-policy";

import { NATAL_PERSONAL_BODIES, NATAL_BODY_ROLE, type NatalLensRule } from "./natal-lens-types";
export * from "./natal-lens-types";

export function natalCatalogueCoverage(rules: NatalLensRule[] = []) {
  const valid = rules.filter(
    (r) => r && Array.isArray(r.selectors) && r.selectors[0]?.kind === "sign",
  );
  return {
    base: valid.filter((r) => r.selectors.length === 1).length,
    compound: valid.filter((r) => r.selectors.length === 2).length,
    bodySigns: new Set(
      valid
        .filter((r) => r.selectors.length === 1)
        .map((r) => `${r.selectors[0].body}:${r.selectors[0].sign}`),
    ).size,
  };
}

function validateNatalCatalogue(value: unknown, schemaVersion: number | undefined) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > 2000)
    throw new Error("Invalid natalLenses catalogue bounds");
  if (value.length && schemaVersion !== 3 && schemaVersion !== 4)
    throw new Error("natalLenses require schemaVersion 3");
  const keys = new Set<string>(),
    selectors = new Set<string>();
  for (const rule of value as NatalLensRule[]) {
    if (
      !rule ||
      typeof rule !== "object" ||
      typeof rule.key !== "string" ||
      !rule.key.trim() ||
      rule.key.length > 100 ||
      keys.has(rule.key)
    )
      throw new Error("Invalid or duplicate natal lens key");
    keys.add(rule.key);
    if (
      !Array.isArray(rule.anchorNatalPoints) ||
      rule.anchorNatalPoints.length < 1 ||
      rule.anchorNatalPoints.length > 5 ||
      new Set(rule.anchorNatalPoints).size !== rule.anchorNatalPoints.length ||
      rule.anchorNatalPoints.some((b) => !NATAL_PERSONAL_BODIES.includes(b))
    )
      throw new Error("Invalid natal lens anchors");
    if (!Array.isArray(rule.selectors) || rule.selectors.length < 1 || rule.selectors.length > 2)
      throw new Error("Invalid natal lens selectors");
    const [sign, extra] = rule.selectors;
    if (
      !sign ||
      sign.kind !== "sign" ||
      !NATAL_PERSONAL_BODIES.includes(sign.body) ||
      !SIGNS.includes(sign.sign) ||
      rule.role !== NATAL_BODY_ROLE[sign.body] ||
      Object.keys(sign).some((k) => !["kind", "body", "sign"].includes(k))
    )
      throw new Error("Invalid natal sign selector or role");
    let canonicalExtra = "";
    if (extra?.kind === "aspect") {
      if (
        extra.a !== sign.body ||
        extra.a === extra.b ||
        !BODIES.includes(extra.b) ||
        extra.b === ("node" as string) ||
        !ASPECTS.some((a) => a.key === extra.aspect) ||
        !Number.isFinite(extra.maxOrb) ||
        extra.maxOrb <= 0 ||
        extra.maxOrb > 3 ||
        Object.keys(extra).some((k) => !["kind", "a", "b", "aspect", "maxOrb"].includes(k))
      )
        throw new Error("Invalid natal aspect selector");
      canonicalExtra = `aspect:${[extra.a, extra.b].sort().join(":")}:${extra.aspect}:${extra.maxOrb}`;
    } else if (extra?.kind === "house") {
      if (
        extra.body !== sign.body ||
        !Number.isInteger(extra.house) ||
        extra.house < 1 ||
        extra.house > 12 ||
        Object.keys(extra).some((k) => !["kind", "body", "house"].includes(k))
      )
        throw new Error("Invalid natal house selector");
      canonicalExtra = `house:${extra.body}:${extra.house}`;
    } else if (rule.selectors.length === 2) throw new Error("Invalid natal compound selector");
    const canonical = `${sign.body}:${sign.sign}|${canonicalExtra}|${[...rule.anchorNatalPoints].sort().join(":")}`;
    if (selectors.has(canonical)) throw new Error("Duplicate canonical natal selectors/anchors");
    selectors.add(canonical);
    const text = rule.mechanism;
    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 700 ||
      !/[.!?]$/.test(text.trim()) ||
      (text.match(/[.!?](?:\s|$)/g)?.length ?? 0) > 3 ||
      safetyPass(text).flagged.length ||
      natalLensWordingProblem(text) ||
      natalMechanismHasTechnicalClaim(text)
    )
      throw new Error("Invalid or unsafe natal mechanism");
  }
}

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
  natalLenses?: unknown[];
  transitChapters?: unknown[];
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

  if (
    bundle.schemaVersion !== undefined &&
    bundle.schemaVersion !== 2 &&
    bundle.schemaVersion !== 3 &&
    bundle.schemaVersion !== 4
  ) {
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

  if (
    (hasRules || hasAnnotatedThemes) &&
    bundle.schemaVersion !== 2 &&
    bundle.schemaVersion !== 3 &&
    bundle.schemaVersion !== 4
  ) {
    throw new Error("Theme annotations and synthesisRules require schemaVersion 2");
  }

  validateNatalCatalogue(bundle.natalLenses, bundle.schemaVersion);
  validateTransitCatalogue(bundle.transitChapters, bundle.schemaVersion);
  if (bundle.phases !== undefined) {
    if (!bundle.phases || typeof bundle.phases !== "object" || Array.isArray(bundle.phases))
      throw new Error("Phase copy must be an object");
    for (const [phase, text] of Object.entries(bundle.phases)) {
      if (typeof text !== "string" || safetyPass(text).flagged.length)
        throw new Error(`Phase ${phase} copy failed safety pass`);
    }
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
  const schemaVersion: 2 | 3 | 4 | undefined =
    rawObj.schemaVersion === 4
      ? 4
      : rawObj.schemaVersion === 3
        ? 3
        : rawObj.schemaVersion === 2 || synthesisRules.length > 0 || hasAnnotatedThemes
          ? 2
          : undefined;

  const bundle: ContentBundle = {
    version,
    cycles,
    natal,
    phases,
    domains,
    synthesisRules,
    transitChapters: Array.isArray(rawObj.transitChapters)
      ? (structuredClone(rawObj.transitChapters) as NonNullable<ContentBundle["transitChapters"]>)
      : [],
    natalLenses: Array.isArray(rawObj.natalLenses)
      ? (structuredClone(rawObj.natalLenses) as NatalLensRule[])
      : [],
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

export function validateTransitCatalogue(value: unknown, schemaVersion: number | undefined) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > 5 || (value.length > 0 && schemaVersion !== 4))
    throw new Error("Invalid transit chapter catalogue");
  const keys = new Set<string>(),
    chapters = new Set<string>();
  for (const c of value) {
    if (
      !c ||
      typeof c !== "object" ||
      Object.keys(c).some((k) => !["key", "chapter", "mechanism"].includes(k)) ||
      typeof c.key !== "string" ||
      !c.key.trim() ||
      c.key.length > 100 ||
      keys.has(c.key) ||
      !["single", "opening", "return", "closing", "between"].includes(c.chapter) ||
      chapters.has(c.chapter)
    )
      throw new Error("Invalid transit chapter identity");
    keys.add(c.key);
    chapters.add(c.chapter);
    const t = c.mechanism;
    if (
      typeof t !== "string" ||
      !t.trim() ||
      t.length > 240 ||
      !/[.!?]$/.test(t) ||
      (t.match(/[.!?](?:\s|$)/g)?.length ?? 0) > 2 ||
      !/\b(?:if|can|may|could)\b/i.test(t) ||
      safetyPass(t).flagged.length ||
      natalLensWordingProblem(t) ||
      natalMechanismHasTechnicalClaim(t) ||
      /\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|january|february|march|april|june|july|august|september|october|november|december|yesterday|today|tomorrow|trauma|diagnosis|healed|guarantees?|destined|resolution)\b|\byou (?:experienced|suffered|lost|were betrayed)\b|\b(?:last|next) (?:May|month|year|week)\b/i.test(
        t,
      )
    )
      throw new Error("Unsafe transit chapter copy");
  }
}
