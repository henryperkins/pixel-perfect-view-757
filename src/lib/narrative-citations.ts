import { z } from "zod";

export type NarrativeCitation = {
  paragraph: number;
  facts: string[];
};

export const narrativeCitationSchema = z.object({
  paragraph: z.number().int().min(1).max(100),
  facts: z.array(z.string().min(1).max(80)).min(1).max(20),
});

/**
 * Structural validation plus optional fact filtering. Entries are stripped of
 * unknown fields rather than rejected, because older rows may carry extra keys.
 */
function normalizeCitations(
  value: unknown,
  keepFact: (id: string) => boolean,
): NarrativeCitation[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<number, string[]>();
  for (const entry of value) {
    const parsed = narrativeCitationSchema.safeParse(entry);
    if (!parsed.success) continue;
    const facts = [...new Set(parsed.data.facts)].filter(keepFact);
    if (!facts.length) continue;
    const existing = merged.get(parsed.data.paragraph);
    if (!existing) {
      merged.set(parsed.data.paragraph, facts);
      continue;
    }
    for (const id of facts) if (!existing.includes(id)) existing.push(id);
  }
  return [...merged.entries()]
    .sort(([a], [b]) => a - b)
    .map(([paragraph, facts]) => ({ paragraph, facts }));
}

/** Server-facing: drops citations that reference facts not saved with the reading. */
export function sanitizeNarrativeCitations(
  value: unknown,
  knownFactIds: Iterable<string>,
): NarrativeCitation[] {
  const known = new Set(knownFactIds);
  return normalizeCitations(value, (id) => known.has(id));
}

/** Shared structural validator: keeps unknown IDs for the client's honest fallback. */
export function readableNarrativeCitations(value: unknown): NarrativeCitation[] {
  return normalizeCitations(value, () => true);
}
