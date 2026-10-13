import { createHash } from "node:crypto";
import type { ContentBundle } from "./default-bundle";
import type { AssembledReading, ReadingContext } from "../reading.server";
import type { Chart } from "../astro/chart";
import type { CycleInstance } from "../astro/cycles";
import { canonicalContentJson } from "./draft-comparison";
import { aspectFamily } from "./default-bundle";
import { ASPECTS } from "../astro/chart";

type Decision = "pending" | "impossible" | "independent" | "tension" | "reinforcement";
export interface SynthesisMatrixRow {
  primaryKey: string;
  supportingKey: string;
  primarySourceHash: string;
  supportingSourceHash: string;
  selectorEligible: boolean;
  status: Decision;
  reason: string;
  reviewed: boolean;
  ruleKey: string | null;
  ruleSourceHash: string | null;
}
const sourceHash = (value: unknown) =>
  createHash("sha256")
    .update(canonicalContentJson(JSON.parse(JSON.stringify(value))))
    .digest("hex");
const exact = (key: string) =>
  /^(conjunction|sextile|square|trine|opposition|quincunx):[^:*]+:[^:*]+$/.test(key);
const sameContact = (a: string, b: string) =>
  a.split(":").slice(1).join(":") === b.split(":").slice(1).join(":");

/** Editorial inventory, not an estimate of how many members will receive synthesis. */
export function synthesisCatalogueMatrix(bundle: ContentBundle) {
  const sources = bundle.cycles.filter((source) => !source.key.includes("*"));
  const shadowed = new Set(
    sources
      .filter((source) => {
        const [family, body, point] = source.key.split(":");
        return (
          ["hard", "soft"].includes(family!) &&
          ASPECTS.filter((aspect) => aspectFamily(aspect.key) === family).every((aspect) =>
            sources.some((item) => item.key === `${aspect.key}:${body}:${point}`),
          )
        );
      })
      .map((source) => source.key),
  );
  const rows: SynthesisMatrixRow[] = [];
  for (const primary of sources)
    for (const supporting of sources) {
      if (primary.key === supporting.key) continue;
      const same = sameContact(primary.key, supporting.key);
      const unreachable = shadowed.has(primary.key) || shadowed.has(supporting.key);
      const impossible = same || unreachable;
      const rule = bundle.synthesisRules?.find(
        (rule) =>
          rule.primary.interpretationKey === primary.key &&
          rule.supporting.interpretationKey === supporting.key,
      );
      const selectorEligible = exact(primary.key) && exact(supporting.key);
      rows.push({
        primaryKey: primary.key,
        supportingKey: supporting.key,
        primarySourceHash: sourceHash(primary),
        supportingSourceHash: sourceHash(supporting),
        selectorEligible,
        status: impossible ? "impossible" : (rule?.relationship ?? "pending"),
        reason: same
          ? "The calculation emits one contact for the same transit body and natal point; these two source resolutions cannot coexist."
          : unreachable
            ? "Exact-aspect precedence covers every calculated aspect for a family source in this candidate; that family resolution cannot be selected. This is a resolver constraint, not semantic independence."
            : rule
              ? "Existing directed rule; its final writing review remains separate."
              : selectorEligible
                ? "No source-bound directed editorial decision is recorded."
                : "Family copy is not eligible for an exact-aspect synthesis selector; editorial classification or a reviewed exact source is still required.",
        reviewed: false,
        ruleKey: rule?.key ?? null,
        ruleSourceHash: rule ? sourceHash(rule) : null,
      });
    }
  return {
    bundleVersion: bundle.version,
    bundleHash: sourceHash(bundle),
    sourceCount: sources.length,
    ruleBindings: (bundle.synthesisRules ?? []).map((rule) => ({
      key: rule.key,
      primaryKey: rule.primary.interpretationKey,
      supportingKey: rule.supporting.interpretationKey,
      relationship: rule.relationship,
      sourceHash: sourceHash(rule),
    })),
    rows,
  };
}

/** Explicit decisions never fill the reverse orientation or manufacture reviewed independence. */
export function applySynthesisDecisions(
  matrix: ReturnType<typeof synthesisCatalogueMatrix>,
  decisions: SynthesisMatrixRow[],
) {
  const indexed = new Map<string, SynthesisMatrixRow>();
  for (const decision of decisions) {
    const id = JSON.stringify([decision.primaryKey, decision.supportingKey]);
    if (indexed.has(id)) throw Error("Duplicate directed editorial decision.");
    const original = matrix.rows.find(
      (row) =>
        row.primaryKey === decision.primaryKey && row.supportingKey === decision.supportingKey,
    );
    if (
      !original ||
      decision.primarySourceHash !== original.primarySourceHash ||
      decision.supportingSourceHash !== original.supportingSourceHash ||
      decision.ruleSourceHash !== original.ruleSourceHash
    )
      throw Error("Editorial decision source hashes do not match the frozen catalogue.");
    if (
      decision.reviewed !== true ||
      typeof decision.reason !== "string" ||
      !decision.reason.trim() ||
      decision.reason.length > 2000
    )
      throw Error("Every reviewed decision needs a bounded source-based reason.");
    if (
      !["independent", "tension", "reinforcement", "impossible"].includes(decision.status) ||
      (original.status === "impossible") !== (decision.status === "impossible")
    )
      throw Error("Invalid calculation/editorial decision.");
    if (["tension", "reinforcement"].includes(decision.status) && !original.selectorEligible)
      throw Error("Positive synthesis requires reviewed exact-aspect sources.");
    const binding = matrix.ruleBindings.find((rule) => rule.key === decision.ruleKey);
    if (["tension", "reinforcement"].includes(decision.status)) {
      if (
        !binding ||
        binding.primaryKey !== original.primaryKey ||
        binding.supportingKey !== original.supportingKey ||
        binding.relationship !== decision.status
      )
        throw Error("Positive decision must identify its exact active directed source rule.");
    } else if (decision.status === "independent") {
      if (
        (original.ruleKey &&
          (!binding ||
            binding.relationship !== "independent" ||
            binding.primaryKey !== original.primaryKey ||
            binding.supportingKey !== original.supportingKey)) ||
        (!original.ruleKey && decision.ruleKey !== null)
      )
        throw Error("Independent decision contradicts the active directed source rule.");
    } else if (decision.ruleKey !== null) {
      throw Error("An impossible contact cannot have a source rule.");
    }
    indexed.set(id, {
      ...original,
      status: decision.status,
      reason: decision.reason,
      reviewed: true,
      ruleKey: decision.ruleKey,
    });
  }
  return {
    ...matrix,
    rows: matrix.rows.map(
      (row) => indexed.get(JSON.stringify([row.primaryKey, row.supportingKey])) ?? row,
    ),
  };
}

interface SyntheticCase {
  id: string;
  chart: Chart;
  cycles: CycleInstance[];
  config: { tone: string; depth: string; granted: string[]; day: string; timeZone: string };
}
type Assemble = (
  chart: Chart,
  cycles: CycleInstance[],
  context: ReadingContext,
  bundle: ContentBundle,
) => AssembledReading;
export function synthesisAcceptanceCoverage(
  bundle: ContentBundle,
  cases: SyntheticCase[],
  assemble: Assemble,
) {
  const pairs = new Map<
    string,
    {
      primaryKey: string;
      supportingKey: string;
      caseIds: string[];
      positiveCovered: boolean;
      independentCovered: boolean;
      reverseCovered: boolean;
    }
  >();
  const wildcard = new Set<string>(),
    unmatched = new Set<string>();
  const evaluated = cases.map((item) => {
    const reading = assemble(
      item.chart,
      item.cycles,
      {
        granted: new Set(item.config.granted),
        tone: item.config.tone,
        depth: item.config.depth,
        localBucket: null,
        checkIn: null,
        wellness: null,
      },
      bundle,
    );
    const plan = reading.interpretationPlan,
      primary = plan.interpretations.find((i) => i.index === 1),
      supporting = plan.interpretations.find((i) => i.index === 2);
    for (const source of plan.interpretations)
      if (source.interpretationKey.includes("*")) wildcard.add(source.interpretationKey);
    if (primary && supporting) {
      const key = JSON.stringify([primary.interpretationKey, supporting.interpretationKey]);
      const rules = bundle.synthesisRules ?? [],
        forward = rules.find(
          (r) =>
            r.primary.interpretationKey === primary.interpretationKey &&
            r.supporting.interpretationKey === supporting.interpretationKey,
        ),
        reverse = rules.find(
          (r) =>
            r.primary.interpretationKey === supporting.interpretationKey &&
            r.supporting.interpretationKey === primary.interpretationKey,
        );
      const pair = pairs.get(key) ?? {
        primaryKey: primary.interpretationKey,
        supportingKey: supporting.interpretationKey,
        caseIds: [],
        positiveCovered:
          forward?.relationship === "tension" || forward?.relationship === "reinforcement",
        independentCovered: forward?.relationship === "independent",
        reverseCovered: Boolean(reverse),
      };
      pair.caseIds.push(item.id);
      pairs.set(key, pair);
      if (plan.pairStatus === "unmatched") unmatched.add(key);
    }
    return {
      id: item.id,
      eligibleCycleKeys: reading.eligibleCycles.map((c) => c.cycle_key),
      interpretationKeys: plan.interpretations.map((i) => i.interpretationKey),
      pairStatus: plan.pairStatus,
      ruleKey: plan.pairRuleKey,
    };
  });
  return {
    population: "fixed synthetic plans; not member coverage",
    bundleVersion: bundle.version,
    bundleHash: sourceHash(bundle),
    caseCount: cases.length,
    cases: evaluated,
    pairs: [...pairs.values()],
    wildcardSourceKeys: [...wildcard].sort(),
    unmatchedPairs: [...unmatched].map((key) => JSON.parse(key) as [string, string]),
    counts: Object.fromEntries(
      ["selected", "independent", "unmatched", "insufficient"].map((status) => [
        status,
        evaluated.filter((item) => item.pairStatus === status).length,
      ]),
    ),
  };
}
