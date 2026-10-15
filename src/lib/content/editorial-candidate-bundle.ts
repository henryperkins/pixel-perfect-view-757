import data from "./editorial-candidate-data.json";
import type { ContentBundle, Interpretation } from "./default-bundle";
import type { SynthesisRule } from "./schema";

/**
 * Inactive six-case editorial pilot. The embedded baseline is the exact saved
 * 0.7.1 bundle, not the broader writing/synthesis candidate. This module is
 * used by offline preparation and the bounded synthetic server pilot only.
 * Member activation and full natal/transit-context qualification remain separate.
 */
const baseline = structuredClone(data.baseline.value) as unknown as ContentBundle;
const changedInterpretations = new Map(
  (data.sourceChanges.interpretations as Interpretation[]).map((entry) => [entry.key, entry]),
);
const changedRules = new Map(
  (data.sourceChanges.synthesisRules as SynthesisRule[]).map((entry) => [entry.key, entry]),
);

export const EDITORIAL_CANDIDATE_BUNDLE: ContentBundle = {
  ...baseline,
  version: data.candidateVersion,
  schemaVersion: 6,
  cycles: [
    ...baseline.cycles.map((source) =>
      structuredClone(changedInterpretations.get(source.key) ?? source),
    ),
    ...(structuredClone(data.sourceChanges.additions) as Interpretation[]),
  ],
  synthesisRules: (baseline.synthesisRules ?? []).map((source) =>
    structuredClone(changedRules.get(source.key) ?? source),
  ),
  dailyEditorial: structuredClone(data.dailyEditorial) as NonNullable<
    ContentBundle["dailyEditorial"]
  >,
};

export const EDITORIAL_CANDIDATE_BASELINE = {
  version: baseline.version,
  schemaVersion: baseline.schemaVersion,
  sha256: data.baseline.sha256,
  sourcePath: data.baseline.sourcePath,
  selector: data.baseline.selector,
} as const;
