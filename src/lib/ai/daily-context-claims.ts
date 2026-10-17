import type { FactAtom } from "./facts";

const tokens = (text: string): string[] =>
  text
    .toLowerCase()
    .replaceAll("’", "'")
    .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
const normalized = (text: string): string => ` ${tokens(text).join(" ")} `;
const modal = /^(?:can|may|could|might)$/;
const intervening =
  "(?:(?:[a-z]+ly|also|still|just|even|often|sometimes|always|already|soon|not|never|can|may|could|might) ){0,4}";
const sourceText = (fact: FactAtom): string => fact.statement.replace(/^Published.*?: /, "");

function presentForms(verb: string): string[] {
  if (verb === "be") return ["be", "am", "is", "are"];
  if (verb === "have") return ["have", "has"];
  if (verb === "do") return ["do", "does"];
  return [
    verb,
    /[^aeiou]y$/.test(verb)
      ? `${verb.slice(0, -1)}ies`
      : /(?:s|sh|ch|x|z|o)$/.test(verb)
        ? `${verb}es`
        : `${verb}s`,
  ];
}

/**
 * Candidate-only extension of the shared near-verbatim guard. A source subject
 * (up to four words), modal verb and two following words must survive locally.
 * Up to four intervening adverbs are tolerated; a modal before another subject
 * or in another clause cannot license this claim. Changed subjects, negation
 * and arbitrary paraphrases still require source review, not lexical proof.
 */
function dropsLocalModality(sentences: string[], sources: FactAtom[]): boolean {
  const candidates = sentences.map(normalized);
  for (const source of sources) {
    const words = tokens(sourceText(source));
    for (let index = 0; index < words.length; index += 1) {
      if (!modal.test(words[index]!)) continue;
      const verb = words[index + 1];
      if (!verb || /^(?:not|never)$/.test(verb)) continue;
      const subject = words.slice(Math.max(0, index - 4), index);
      const tail = words.slice(index + 2, index + 4);
      if (subject.length < 2 || tail.length < 2) continue;
      const claim = new RegExp(
        ` ${subject.join(" ")} (${intervening})(?:${presentForms(verb).join("|")}) ${intervening}${tail.join(" ")} `,
        "g",
      );
      for (const candidate of candidates) {
        for (const match of candidate.matchAll(claim)) {
          if (!tokens(match[1]!).some((word) => modal.test(word))) return true;
        }
      }
    }
  }
  return false;
}

const incidental = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "as",
  "can",
  "may",
  "could",
  "might",
  "is",
  "are",
  "be",
  "it",
  "its",
  "your",
  "you",
  "that",
  "this",
]);
const contentWords = (text: string) => tokens(text).filter((word) => !incidental.has(word));

/** Same-clause source vocabulary limits an ease/speed license to its own claim. */
function sharedSourcePhrase(clause: string, source: string): boolean {
  const draft = ` ${contentWords(clause).join(" ")} `;
  const words = contentWords(source);
  return words.slice(0, -1).some((word, index) => draft.includes(` ${word} ${words[index + 1]} `));
}

/** Require the whole short clause lead, not an anchor embedded in another subject. */
function sharesAmplifiedAnchor(prefix: string, source: string, property: RegExp): boolean {
  const local = contentWords(prefix).filter(
    (word) => !/^(?:[a-z]+ly|also|still|just|even|often|sometimes|always|already|soon)$/.test(word),
  );
  if (!local.length) return false;
  for (const part of source.split(/[.;,:]|\b(?:and|but|yet|so)\b/i)) {
    const match = property.exec(part);
    if (!match) continue;
    const anchors = contentWords(part.slice(0, match.index)).slice(-2);
    if (` ${anchors.join(" ")} `.includes(` ${local.join(" ")} `)) return true;
  }
  return false;
}

/**
 * Two observed additions only: quickly asserts speed; easily asserts ease.
 * A hypothetical or a modal does not supply either property. Ease may be
 * supported by its own cited source's little-friction meaning (such as I2),
 * with a shared local source phrase and a complete short pre-adverb clause lead
 * matching the source's amplified anchor. A destination or citation is not enough.
 * Comma-isolated paraphrases may conservatively reject; this is not a parser.
 * This deliberately does not claim to recognize all semantic strengthening.
 */
function addsLocalAmplification(sentences: string[], sources: FactAtom[]): boolean {
  for (const sentence of sentences) {
    for (const clause of sentence.split(/[,;:]|\b(?:and|but|yet|so|as)\b/i)) {
      for (const match of clause.matchAll(/\b(quickly|easily)\b/gi)) {
        const speed = match[1]!.toLowerCase() === "quickly";
        const supported = sources.some((source) => {
          const text = sourceText(source);
          const meaning = speed ? /\bquickly\b/i : /\b(?:eas(?:e|ier|ily)|little friction)\b/i;
          return (
            meaning.test(text) &&
            sharedSourcePhrase(clause, text) &&
            sharesAmplifiedAnchor(clause.slice(0, match.index), text, meaning)
          );
        });
        if (!supported) return true;
      }
    }
  }
  return false;
}

/**
 * Contradictions found in the third pilot, bound to its immutable published
 * sources and the local subject/predicate. An authorized scene image is not
 * evidence of a new effect. These checks cover the observed predicates, not
 * arbitrary causal paraphrases or missing meaning; those still need review.
 */
function observedSceneProblem(sentences: string[], sources: FactAtom[]): string | null {
  const has = (id: string, key: string) =>
    sources.some(
      (source) => source.id === id && source.sourceKey === key && source.releaseVersion === "0.9.0",
    );
  const removal = has("I1", "square:saturn:sun");
  const natal = has("N1", "nl-sun-03");
  const initiative = has("I2", "trine:jupiter:mars");
  for (const sentence of sentences) {
    for (const clause of sentence.split(/[.!?,;:]|\b(?:and|but|yet|so|though)\b/i)) {
      if (
        removal &&
        /\b(?:extra check|another version)\b[^.!?,;:]{0,80}\b(?:can|may|could|might)\s+simply\s+be\s+(?:left out|omitted|removed)\b/i.test(
          clause,
        )
      )
        return "draft adds ease to the supplied optional removal";
      if (
        natal &&
        /\b(?:notes?|tab)\b[^.!?,;:]{0,140}\bblurs?\s+where\s+(?:your|the)\s+attention\s+belongs\b/i.test(
          clause,
        )
      )
        return "draft makes the supplied natal scene cause an unsupported attention effect";
      if (
        initiative &&
        /\b(?:practical\s+)?initiative\s+(?:(?:can|may|could|might)\s+)?(?:makes?|causes?)\b[^.!?,;:]{0,140}\b(?:look|seem|feel)\s+appealing\b/i.test(
          clause,
        )
      )
        return "draft makes initiative cause unsupported appeal";
    }
  }
  return null;
}

/** Source IDs never establish semantic support on their own. */
export function dailyContextClaimProblem(sentences: string[], cited: FactAtom[]): string | null {
  const sources = cited.filter((fact) => /^(?:I[1-3]|[SN]1|P2)$/.test(fact.id));
  if (dropsLocalModality(sentences, sources))
    return "draft drops the local possibility qualifier from a supplied context claim";
  if (addsLocalAmplification(sentences, sources))
    return "draft adds speed or ease absent from its local context source";
  return observedSceneProblem(sentences, sources);
}
