import type { fetchPattern } from "@/lib/pattern.functions";

export type PatternData = Extract<
  Awaited<ReturnType<typeof fetchPattern>>,
  { needsOnboarding: false }
>;
export type PatternFeature = PatternData["features"][number];

export const CHAPTER_FAMILIES: Record<string, string> = {
  luminary: "Sun & Moon",
  angle: "Rising",
  aspect: "Connections",
  configuration: "Clusters",
  distribution: "Elements",
};

const BODY_NAME: Record<string, string> = {
  node: "North Node",
  north_node: "North Node",
  true_node: "North Node",
  mean_node: "North Node",
  south_node: "South Node",
  ascendant: "Ascendant",
  midheaven: "Midheaven",
  chiron: "Chiron",
};

export function bodyName(key: string): string {
  return BODY_NAME[key] ?? key.replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function chapterParagraphId(key: string, paragraph: number) {
  return `chapter-${key}-paragraph-${paragraph}`;
}

/** Relative labels describe the calculated ranking, without inventing a score. */
export function strengthLabel(feature: PatternFeature, rank: number, total: number): string {
  if (feature.family === "distribution") {
    const elements = (feature.payload as { elements?: Record<string, number> } | null)?.elements;
    if (elements) {
      const values = Object.values(elements).filter(
        (value) => Number.isFinite(value) && value >= 0,
      );
      const count = values.reduce((sum, value) => sum + value, 0);
      if (count > 0) return `${Math.max(...values)} of ${count} bodies share this element`;
    }
  }
  if (rank === 0) return "Strongest in your chart";
  if (rank < 3) return `Top 3 in your chart · #${rank + 1}`;
  if (rank < Math.ceil(total / 2)) return "Clearly present";
  return "In the background";
}
