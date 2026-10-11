import { DEFAULT_BUNDLE, type ContentBundle } from "./default-bundle";
import { NATAL_LENS_CATALOGUE } from "./natal-lens-catalogue";
import { normalizeContentBundle } from "./schema";

const {
  version: _fallbackVersion,
  schemaVersion: _fallbackSchema,
  ...fallbackCopy
} = DEFAULT_BUNDLE;

/**
 * Inactive local candidate: the validated built-in transit copy plus the reviewed
 * natal lens catalogue. It is never served as the fallback, so a deploy cannot
 * activate natal lenses. Publishing it as a release (the signed editorial endpoint,
 * or an operator-staged inactive row activated by an admin) is the only switch.
 * Key order matches the original `builtin-0.6.0` serialization so its copy
 * checksum is unchanged.
 */
export const NATAL_CANDIDATE_BUNDLE: ContentBundle = {
  version: "builtin-0.6.0",
  schemaVersion: 3,
  natalLenses: NATAL_LENS_CATALOGUE,
  ...fallbackCopy,
};

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, canonical((value as Record<string, unknown>)[key])]),
    );
  return value;
}

/**
 * Transit copy without its release identity or natal catalogue, normalized the way a
 * loaded release is and with sorted keys. Equal values mean two bundles give every
 * transit reading identical published copy, so a natal-disabled baseline and a natal
 * candidate can be compared without an isolated checkout.
 */
export function transitCopyIdentity(bundle: ContentBundle): unknown {
  const normalized = normalizeContentBundle(
    JSON.parse(JSON.stringify(bundle)),
    "transit-copy",
    DEFAULT_BUNDLE,
  );
  return canonical({
    cycles: normalized.cycles,
    natal: normalized.natal,
    phases: normalized.phases,
    domains: normalized.domains,
    synthesisRules: normalized.synthesisRules ?? [],
  });
}
