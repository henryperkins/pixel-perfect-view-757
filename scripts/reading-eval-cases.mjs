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

const SUN_OPENING =
  "An established responsibility can call for clearer boundaries when its expectations outpace capacity.";
const MOON_OPENING =
  "A small obligation can take up more room than its size suggests. The contact frames responsibility against the uninterrupted space a day leaves.";
function natalDraft(mechanism, opening = SUN_OPENING) {
  return {
    paragraphs: [
      { text: opening, facts: ["C1", "I1"] },
      { text: mechanism, facts: ["N1", "C1", "I1"] },
    ],
  };
}
const CAPRICORN_MOON =
  "A self-contained response to pressure can start with sorting what is manageable before sharing it. An unfinished reply can offer a place to notice the difference between useful preparation and waiting to have everything settled.";
const GEMINI_SUN =
  "Following more than one line of curiosity can help a direction take shape. If several notes compete for attention, exploring possibilities and committing to an explanation may be different stages.";
Object.assign(BASELINE_RESPONSES, {
  "natal-duty-reflex": natalDraft(CAPRICORN_MOON, MOON_OPENING),
  "natal-freedom-reflex": natalDraft(
    "Room to choose the route can matter as much as finishing the task. If an ordinary obligation feels narrow, the useful distinction may be between the commitment itself and how much choice it leaves in carrying it out.",
    MOON_OPENING,
  ),
  "natal-service-aspect": natalDraft(
    "Dependable structure can offer support when a response needs time to take shape. An ordinary commitment may distinguish accepting useful support from taking on every obligation to keep the arrangement steady.",
    MOON_OPENING,
  ),
  "natal-exact-house": natalDraft(
    "A manageable routine can offer a way to meet pressure without settling everything at once. An unfinished list may distinguish one useful task from making the entire routine a condition for taking a pause.",
    MOON_OPENING,
  ),
  "natal-own-target": natalDraft(GEMINI_SUN),
  "natal-moon-fallback": natalDraft(CAPRICORN_MOON),
  "natal-sign-boundary": sunDraft(),
  "natal-unknown-time": sunDraft(),
  "natal-mixed-source": natalDraft(CAPRICORN_MOON, MOON_OPENING),
  "natal-degraded-positions": sunDraft(),
  "natal-legacy-snapshot": sunDraft(),
  "natal-synthesis-integration": {
    paragraphs: [
      { text: SUN_OPENING, facts: ["C1", "I1"] },
      {
        text: "Giving a plan more scope can increase the structure needed to carry it. Following more than one line of curiosity can help that direction take shape, with exploring possibilities and committing to an explanation treated as different stages.",
        facts: ["S1", "C1", "I1", "C2", "I2", "N1"],
      },
    ],
  },
});
