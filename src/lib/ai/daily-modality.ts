import type { FactAtom } from "./facts";

const words = (text: string): string[] =>
  text
    .toLowerCase()
    .replaceAll("’", "'")
    .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
const sentenceKey = (text: string): string => ` ${words(text).join(" ")} `;

function presentForms(verb: string): string[] {
  if (verb === "be") return ["be", "am", "is", "are"];
  if (verb === "have") return ["have", "has"];
  if (verb === "do") return ["do", "does"];
  const singular = /[^aeiou]y$/.test(verb)
    ? `${verb.slice(0, -1)}ies`
    : /(?:s|sh|ch|x|z|o)$/.test(verb)
      ? `${verb}es`
      : `${verb}s`;
  return [verb, singular];
}

/**
 * Bounded near-verbatim reuse only, not a semantic support test. Match an adjacent
 * subject (up to four words), a modal's verb, and two to four following words.
 * A modal elsewhere in the paragraph cannot qualify this particular claim.
 * Paraphrases, changed subjects, negation, and intervening adverbs are outside
 * this guard; blind editorial review still decides support.
 */
export function dropsSourceModality(sentences: string[], cited: FactAtom[]): boolean {
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  const sources = cited
    .filter((fact) => /^(?:I[1-3]|[SND]1|P2)$/.test(fact.id))
    .flatMap((fact) =>
      [...segmenter.segment(fact.statement.replace(/^Published.*?: /, ""))].map((s) =>
        sentenceKey(s.segment),
      ),
    );
  const candidates = sentences.map(sentenceKey).filter((text) => !sources.includes(text));
  for (const source of sources) {
    const tokens = source.trim().split(" ");
    for (let index = 0; index < tokens.length; index += 1) {
      if (!/^(?:can|may|might)$/.test(tokens[index]!)) continue;
      const verb = tokens[index + 1];
      if (!verb || /^(?:not|never)$/.test(verb)) continue;
      const subject = tokens.slice(Math.max(0, index - 4), index);
      const tail = tokens.slice(index + 2, index + 6);
      if (subject.length < 2 || tail.length < 2) continue;
      for (const present of presentForms(verb)) {
        const claim = ` ${[...subject, present, ...tail].join(" ")} `;
        if (candidates.some((text) => text.includes(claim))) return true;
      }
    }
  }
  return false;
}
