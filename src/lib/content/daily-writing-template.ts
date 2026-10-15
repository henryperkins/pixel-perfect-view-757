import { completeDailySentences, type DailyWritingPlan } from "./daily-writing";
import type { DailyWritingParagraph, DailyWritingRenderMode } from "../ai/daily-writing-quality";
import type { DailyNatalLensPlan } from "./natal-lens";
import type { DailyTransitStoryPlan } from "./transit-story";

export interface DailyWritingTemplate {
  paragraphs: DailyWritingParagraph[];
  renderMode: DailyWritingRenderMode;
  reason: "template_editorial_failure" | null;
}

/** Complete selected source sentences, followed by one explicitly possible illustration. */
export function composeDailyWritingTemplate(
  plan: DailyWritingPlan,
  lens: DailyNatalLensPlan,
  story: DailyTransitStoryPlan,
  minimal = false,
): DailyWritingTemplate {
  if (plan.editorial)
    return {
      paragraphs: plan.editorial.entry.fallbackParagraphs.map((text) => ({
        text,
        facts: [...plan.editorial!.requiredFacts],
        scenes: [],
      })),
      renderMode: plan.editorial.mode === "quiet" ? "quiet" : "unframed",
      reason: null,
    };
  if (!plan.theme)
    return {
      paragraphs: [
        {
          text: "No cycle is strong enough to name in this reading today. This is a quiet day in the pattern, with no chart signal singled out.",
          facts: [],
          scenes: [],
        },
      ],
      renderMode: "quiet",
      reason: null,
    };
  const atoms: { text: string; facts: string[] }[] = [];
  for (const source of plan.templateSources)
    for (const text of source.sentences)
      atoms.push({
        text,
        facts: source.factId === "S1" ? ["S1", "C1", "I1", "C2", "I2"] : ["C1", "I1"],
      });
  if (lens.lens)
    for (const text of completeDailySentences(lens.lens.mechanism))
      atoms.push({ text, facts: ["N1", "C1", "I1"] });
  if (story.status === "selected") {
    atoms.push({ text: story.chronologySentence, facts: ["C1", "A1"] });
    for (const text of completeDailySentences(story.copy.mechanism))
      atoms.push({ text, facts: ["C1", "I1", "A1", "P2"] });
  }
  const paragraphs: DailyWritingParagraph[] = [];
  let sentenceCount = 0;
  for (const atom of atoms) {
    if (atom.text.length > 1600 || atom.text.split(/\s+/).length > 200 || !/[.!?]$/.test(atom.text))
      throw Error("Required writing source sentence cannot be rendered within valid limits.");
    const previous = paragraphs.at(-1);
    const joined = previous ? `${previous.text} ${atom.text}` : atom.text;
    if (
      !previous ||
      sentenceCount === 4 ||
      joined.length > 1600 ||
      joined.split(/\s+/).length > 200
    ) {
      paragraphs.push({ text: atom.text, facts: [...atom.facts], scenes: [] });
      sentenceCount = 1;
    } else {
      previous.text = joined;
      previous.facts = [...new Set([...previous.facts, ...atom.facts])];
      sentenceCount++;
    }
  }
  // Existing lens/story coverage requires every source within the first two
  // paragraphs. Refuse an unrenderable graph rather than dropping a condition.
  if (paragraphs.length > 2)
    throw Error("Required writing source graph exceeds its two-paragraph coverage limit.");
  const scene = plan.scenes[0];
  if (!minimal && plan.status === "ready" && scene)
    paragraphs.push({
      text: `${scene.situation} ${scene.focus}`,
      facts: [...plan.theme.requiredFacts],
      scenes: [scene.id],
    });
  if (paragraphs.reduce((sum, p) => sum + p.text.split(/\s+/).length, 0) > 700)
    throw Error("Required writing source graph exceeds the complete body limit.");
  return {
    paragraphs,
    renderMode: minimal ? "minimal" : scene && plan.status === "ready" ? "framed" : "unframed",
    reason: minimal ? "template_editorial_failure" : null,
  };
}
