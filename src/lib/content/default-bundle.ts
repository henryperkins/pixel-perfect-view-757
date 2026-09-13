/**
 * Default interpretation bundle.
 *
 * This is the fallback content release used when no editorial release has been
 * ingested. Copy is deliberately observational: it describes a mechanism and a
 * question, never a prediction, an instruction, or a claim about health,
 * money, or other people.
 */

export interface Interpretation {
  /** matches `${aspectFamily}:${transitBody}:${natalPoint}` or a wildcard */
  key: string;
  mechanism: string;
  question: string;
}

export interface DomainInterpretation {
  /** Plain-language name for the life area this cycle touches. */
  label: string;
  /** Where a tense (hard-aspect) version of this cycle usually shows up. */
  hard: string;
  /** Where a supportive (soft-aspect) version usually shows up. */
  soft: string;
  /** A reflection prompt scoped to this life area. */
  prompt: string;
}

export interface ContentBundle {
  version: string;
  cycles: Interpretation[];
  natal: Record<string, string>;
  phases: Record<string, string>;
  domains: Record<string, DomainInterpretation>;
}

const HARD = "hard";
const SOFT = "soft";

export function aspectFamily(aspect: string): string {
  return aspect === "trine" || aspect === "sextile" ? SOFT : HARD;
}

export const DEFAULT_BUNDLE: ContentBundle = {
  version: "builtin-0.2.0",
  phases: {
    approaching:
      "This window is building. The pattern is not fully in place yet, so what you notice now is mostly anticipation.",
    exact:
      "This is the tightest point of the window. If the pattern is going to be legible anywhere, it is here.",
    separating:
      "The window is releasing. Whatever this period surfaced is now settling into its ordinary shape.",
  },
  natal: {
    sun_placement:
      "Your solar placement describes the thing you keep returning to when there is nothing external forcing your hand.",
    moon_placement:
      "Your lunar placement describes the conditions under which you settle, and the ones under which you do not.",
    ascendant_placement:
      "The rising sign describes the first impression you make and the mode you default to under mild pressure.",
  },
  cycles: [
    {
      key: "hard:saturn:sun",
      mechanism:
        "Saturn transits to the Sun tend to coincide with periods where a role you have been holding loosely gets tested for whether it actually fits.",
      question: "What are you still doing out of habit rather than choice?",
    },
    {
      key: "soft:saturn:sun",
      mechanism:
        "Supportive Saturn contacts to the Sun usually read as consolidation: nothing dramatic, but effort applied now tends to stick.",
      question: "What would be worth making durable this month?",
    },
    {
      key: "hard:saturn:moon",
      mechanism:
        "Saturn to the Moon often coincides with a flatter emotional register and a lower tolerance for noise.",
      question: "What kind of quiet are you actually needing?",
    },
    {
      key: "hard:jupiter:sun",
      mechanism:
        "Jupiter contacts to the Sun coincide with an expanded sense of what is possible, which is useful and also easy to overspend.",
      question: "Which of your current options is genuinely larger, and which just feels larger?",
    },
    {
      key: "soft:jupiter:sun",
      mechanism:
        "A supportive Jupiter contact usually reads as ease rather than event: fewer obstacles than the same effort would normally meet.",
      question: "Where is the resistance unusually low right now?",
    },
    {
      key: "hard:mars:sun",
      mechanism:
        "Mars to the Sun tends to shorten the fuse and raise physical restlessness for a few days.",
      question: "Where is the friction actually pointing?",
    },
    {
      key: "hard:mars:mars",
      mechanism:
        "Mars returning to hard contact with itself often marks the start or end of a working push.",
      question: "What did you start the last time you felt this?",
    },
    {
      key: "hard:uranus:sun",
      mechanism:
        "Uranus contacts coincide with a reduced tolerance for arrangements that were already stale.",
      question: "What have you outgrown but not yet said out loud?",
    },
    {
      key: "hard:pluto:sun",
      mechanism:
        "Pluto contacts are slow and structural; they tend to correspond to a change in what you are willing to negotiate over.",
      question: "What is no longer up for debate for you?",
    },
    {
      key: "hard:neptune:sun",
      mechanism:
        "Neptune contacts blur outlines. Certainty is lower than usual, and that is information rather than a fault.",
      question: "What are you currently unsure about that you were sure about a year ago?",
    },
    {
      key: "hard:venus:venus",
      mechanism:
        "Venus to natal Venus is a short window where taste and preference come back into focus.",
      question: "What do you actually like, independent of what is expected?",
    },
    {
      key: "hard:mercury:mercury",
      mechanism:
        "Mercury contacts to itself coincide with a busier information load and a stronger urge to explain yourself.",
      question: "What is worth saying carefully rather than quickly?",
    },
    {
      key: "hard:moon:moon",
      mechanism:
        "The Moon returning to its natal position is a short, ordinary rhythm — a monthly baseline rather than an event.",
      question: "How does today compare to your usual baseline?",
    },
    {
      key: "hard:sun:sun",
      mechanism:
        "Solar contacts to your own Sun mark the annual cycle turning over.",
      question: "What is different from this time last year?",
    },
    // wildcard fallbacks
    {
      key: "hard:*:*",
      mechanism:
        "A hard contact is forming between a moving body and a fixed point in your chart. Hard angles tend to coincide with noticing friction rather than with events.",
      question: "Where are you meeting more resistance than the task deserves?",
    },
    {
      key: "soft:*:*",
      mechanism:
        "A supportive contact is in range. These tend to be unremarkable in the moment and only visible in hindsight as periods of lower friction.",
      question: "What has been easier than expected lately?",
    },
  ],
};

export function findInterpretation(
  bundle: ContentBundle,
  aspect: string,
  transitBody: string,
  natalPoint: string,
): Interpretation {
  const fam = aspectFamily(aspect);
  const candidates = [
    `${fam}:${transitBody}:${natalPoint}`,
    `${fam}:${transitBody}:*`,
    `${fam}:*:${natalPoint}`,
    `${fam}:*:*`,
  ];
  for (const key of candidates) {
    const hit = bundle.cycles.find((c) => c.key === key);
    if (hit) return hit;
  }
  return {
    key: "fallback",
    mechanism: "A contact is in range but no interpretation is published for it yet.",
    question: "What do you notice today that you would not have predicted yesterday?",
  };
}

/**
 * DER-22 safety pass. Strips anything that reads as a prediction, a directive,
 * or a claim in a regulated domain. Runs on every assembled reading, including
 * editorially ingested copy.
 */
const BANNED = [
  /\bwill (?:definitely|certainly|surely)\b/i,
  /\byou (?:must|have to|need to) \b/i,
  /\bguarantee[ds]?\b/i,
  /\b(?:diagnos|cure|treat)(?:e|es|ed|ing|is)?\b/i,
  /\bmedication\b/i,
  /\binvest\b/i,
  /\bpregnan/i,
  /\bdivorce\b/i,
  /\bdeath\b/i,
];

export interface SafetyResult {
  text: string;
  flagged: string[];
}

export function safetyPass(text: string): SafetyResult {
  const flagged: string[] = [];
  let out = text;
  for (const re of BANNED) {
    if (re.test(out)) {
      flagged.push(re.source);
      out = out.replace(
        re,
        "[removed: this reading does not make claims of that kind]",
      );
    }
  }
  return { text: out, flagged };
}
