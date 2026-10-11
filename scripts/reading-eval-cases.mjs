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

// Handwritten, source-reviewed validator examples. These are not generated candidates.
Object.assign(BASELINE_RESPONSES, {
  "synthesis-tension": {
    paragraphs: [
      {
        text: "Giving a plan more scope can increase the structure needed to carry it. A task growing beyond its agreed limits offers one place to notice that tension.",
        facts: ["S1", "C1", "I1", "C2", "I2"],
      },
      {
        text: "Clearer boundaries can make a demanding responsibility easier to carry.",
        facts: ["I1"],
      },
    ],
  },
  "synthesis-reinforcement": {
    paragraphs: [
      {
        text: "Small, dependable actions can sustain a commitment at an even pace.",
        facts: ["C1", "I1"],
      },
      {
        text: "Steady persistence pairs naturally with targeted action. A durable priority offers a focus for concrete, incremental steps.",
        facts: ["S1", "C1", "I1", "C2", "I2"],
      },
    ],
  },
  "synthesis-independent": {
    paragraphs: [
      {
        text: "Differences in taste can bring a preference into clearer view. Comparing what you value in company and quiet offers a place to notice that contrast.",
        facts: ["C1", "I1"],
      },
      {
        text: "Separately, fresh curiosity can sharpen interest in the phrasing of a question or idea.",
        facts: ["I2"],
      },
    ],
  },
  "synthesis-reversed": {
    paragraphs: [
      {
        text: "Expanding the reach of a project tests the framework supporting it. A promising direction alongside existing commitments offers one place to notice where capacity needs to catch up with ambition.",
        facts: ["S1", "C1", "I1", "C2", "I2"],
      },
      {
        text: "A well-chosen aim can give enthusiasm and practical initiative a shared focus.",
        facts: ["I1"],
      },
    ],
  },
  "synthesis-suppressed-support": {
    paragraphs: [
      {
        text: "An established role can ask for more deliberate effort when its expectations outpace capacity.",
        facts: ["C1", "I1"],
      },
      {
        text: "Separately, a contrast with another preference can clarify what you value in company and quiet.",
        facts: ["I2"],
      },
    ],
  },
  "synthesis-unmatched": {
    paragraphs: [
      {
        text: "An established responsibility can call for clearer boundaries when its expectations outpace capacity.",
        facts: ["C1", "I1"],
      },
      {
        text: "Separately, an immediate task can offer a place to apply direct effort.",
        facts: ["I2"],
      },
    ],
  },
});

export const SYNTHESIS_VALIDATOR_EXAMPLES = [
  {
    label: "Handwritten missing-parent rejection",
    caseId: "synthesis-tension",
    validatorCode: "dependencies",
    manualGrounding: "reject",
    draft: {
      paragraphs: [
        {
          ...BASELINE_RESPONSES["synthesis-tension"].paragraphs[0],
          facts: ["S1", "C1", "I1", "I2"],
        },
        BASELINE_RESPONSES["synthesis-tension"].paragraphs[1],
      ],
    },
  },
  {
    label: "Handwritten unsupported-numeric rejection",
    caseId: "synthesis-tension",
    validatorCode: "orb",
    manualGrounding: "reject",
    draft: {
      paragraphs: [
        BASELINE_RESPONSES["synthesis-tension"].paragraphs[0],
        { text: "The current orb is 99 degrees.", facts: ["C1", "I1"] },
      ],
    },
  },
  {
    label: "Handwritten invented-relationship example requiring human rejection",
    caseId: "synthesis-independent",
    validatorCode: "accepted",
    manualGrounding: "reject",
    draft: {
      paragraphs: [
        BASELINE_RESPONSES["synthesis-independent"].paragraphs[0],
        {
          text: "Together these contacts show that a conversation has already changed your preferences.",
          facts: ["C1", "I1", "C2", "I2"],
        },
      ],
    },
  },
];
