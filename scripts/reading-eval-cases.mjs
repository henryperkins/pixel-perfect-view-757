/** Canonical synthetic plans are shared with the on-demand server evaluator. */
export {
  READING_EVAL_CASES,
  READING_EVAL_FIXTURE_VERSION,
} from "../src/lib/ai/reading-evaluation.fixtures.mjs";

/** Handwritten validator fixtures; they are deliberately not model outputs or style exemplars. */
function draft(relation, gloss, domain) {
  return {
    paragraphs: [
      { text: `${relation} is the selected contact. ${gloss}`, facts: ["C1", "I1"] },
      {
        text: `The supplied framing concerns ${domain}. It offers an area for reflection rather than a promised event.`,
        facts: ["C1", "D1"],
      },
      {
        text: "The supplied phase places this contact within its calculated window. Its timing describes a contact rather than an outcome.",
        facts: ["C1", "P1", "T1"],
      },
    ],
  };
}

const sunDraft = () =>
  draft(
    "Saturn square natal Sun",
    "The published mechanism concerns a role being tested for fit.",
    "identity and direction",
  );
export const BASELINE_RESPONSES = {
  "saturn-square-sun": sunDraft(),
  "saturn-square-moon-warm": draft(
    "Saturn square natal Moon",
    "The published mechanism describes a quieter emotional register.",
    "inner life and rest",
  ),
  "jupiter-trine-sun-technical": draft(
    "Jupiter trine natal Sun",
    "The published mechanism describes lower resistance to the same effort.",
    "identity and direction",
  ),
  "mercury-conjunction-clinical": draft(
    "Mercury conjunction natal Mercury",
    "The published mechanism concerns information load and the urge to explain.",
    "work and output",
  ),
  "venus-opposition-venus": draft(
    "Venus opposition natal Venus",
    "The published mechanism concerns taste and preference.",
    "relationships and affection",
  ),
  "unknown-birth-time": sunDraft(),
  "approximate-birth-time": draft(
    "Mars square natal Sun",
    "The published mechanism concerns friction and restlessness.",
    "work and output",
  ),
  "moon-dst-boundary": draft(
    "Moon conjunction natal Moon",
    "The published mechanism describes an ordinary monthly baseline.",
    "inner life and rest",
  ),
  "multiple-cycles": sunDraft(),
  "quiet-threshold": null,
};
