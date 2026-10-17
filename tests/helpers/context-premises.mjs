/**
 * Premise signatures for the closed 0.9.0 context sources, written from the
 * fourth pilot's repeated wording and its synonyms. Exact-string checks missed
 * that repetition because each field reworded the same premise. These patterns
 * measure how many separate expressions carry a premise; they are a regression
 * instrument for these sources, not a general semantic detector.
 */
export const PREMISES = {
  "I1.effort": /\bmore (?:deliberate )?effort than usual\b|\b(?:asking|asks?|needs?) more effort\b/,
  "I1.capacity":
    /\b(?:fills?|filled|filling|takes?) (?:up )?(?:the|that|this|an?) (?:whole |entire )?(?:afternoon|block)\b|\b(?:same|available) hours\b|\bspoken for\b|\bcapacity\b|\bhours can hold\b|\bwhat fits\b|\bmismatch\b/,
  "I1.boundary":
    /\bclearer (?:limit|boundar(?:y|ies))\b|\bwhat belongs (?:in|inside)\b|\bwhat the task includes\b|\bstays? outside\b|\bstopping point\b|\bwhere (?:you|it|the task) stops?\b|\bstop(?:ping)? before\b|\bboundar(?:y|ies)\b|\bconditional limit\b/,
  "I1.calendar":
    /\bcalendar\b|\blater opening\b|\banother afternoon\b|\bnext empty space\b|\breschedul/,
  "N1.stages":
    /\b(?:different|separate) stages\b|\b(?:exploring|sampling|exploration)\b[^.;]{0,40}\b(?:choosing|choice|commitment)\b/,
  "N1.curiosity":
    /\bcuriosity\b|\bdirection (?:take|takes|taking) shape\b|\bdirection (?:emerge|emerges)\b/,
  "N1.hold":
    /\bnotes? can (?:hold|keep)\b|\bwithout promising\b|\bstay (?:as )?a note\b|\bwait(?:ing)? as (?:a )?notes?\b|\bwithout (?:turning|making) it (?:into )?a (?:second )?commitment\b/,
  "P2.adjustment":
    /\bearlier (?:way|method)\b|\bno longer fits?\b|\bsmaller (?:change|adjustment)\b|\bsomething smaller\b/,
  "I2.reinforce": /\benthusiasm\b|\bpractical (?:start|initiative)\b|\bwell chosen\b/,
  "I2.ease": /\bfeels? (?:easier|natural|easy)\b|\blittle friction\b|\blarger piece of work\b/,
  "S1.structure":
    /\bmore scope\b|\bstructure (?:needed|to carry)\b|\bmore structure\b|\blarger task\b/,
  "S1.notice": /\bagreed limits\b|\bgrow(?:s|ing)? (?:past|beyond)\b|\bone place to notice\b/,
};
export const sourceOfPremise = (premise) => premise.split(".")[0];

const normal = (text) => text.toLowerCase().replaceAll("’", "'").replace(/[-_]/g, " ");
const sentences = (text) =>
  [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(text)]
    .map((item) => item.segment.trim())
    .filter(Boolean);

/** Every separately draftable or instructive string in a provider request, with its location. */
export function requestUnits(system, user) {
  const units = sentences(system).map((text, index) => ({ path: `system[${index}]`, text }));
  for (const [line, text] of user.split("\n").entries()) {
    if (!text.startsWith("{")) {
      for (const [index, sentence] of sentences(text).entries())
        units.push({ path: `user.line${line}[${index}]`, text: sentence });
      continue;
    }
    const walk = (value, path) => {
      if (typeof value === "string") units.push({ path, text: value });
      else if (Array.isArray(value))
        value.forEach((item, index) => walk(item, `${path}[${index}]`));
      else if (value && typeof value === "object")
        for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`);
    };
    walk(JSON.parse(text), "brief");
  }
  return units;
}

/** Premise -> locations of the separate units that express it. */
export function premiseLocations(units) {
  const found = {};
  for (const [premise, pattern] of Object.entries(PREMISES)) {
    const paths = units.filter(({ text }) => pattern.test(normal(text))).map(({ path }) => path);
    if (paths.length) found[premise] = paths;
  }
  return found;
}

/** Premise -> 1-based sentence positions in a body; more than one is a restatement. */
export function bodyPremises(body) {
  return premiseLocations(sentences(body).map((text, index) => ({ path: index + 1, text })));
}
