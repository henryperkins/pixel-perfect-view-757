import type { CycleInstance } from "../astro/cycles";
import { exactPhrase } from "../astro/cycles";
import type { DailyTransitStoryPlan } from "./transit-story";

/**
 * These are source-bound compositions, not additional interpretations or selector
 * rules. Both complete source strings must match before authored prose is used.
 * Keep the literal bindings independent of the live catalogue: a copy edit must
 * invalidate a composition even if its interpretation/rule key stays unchanged.
 */
const OBLIGATION_SOURCE =
  "A small obligation can take up more room than its size suggests. Saturn's hard contact with the Moon frames the tension between something you feel responsible for and the amount of uninterrupted space you would prefer. The everyday scene might be a calendar left too full, or a quiet moment spent mentally keeping track of the next task.";
const ROLE_SOURCE =
  "An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.";
const PREPARATION_SOURCE =
  "A self-contained response to pressure can start with sorting what is manageable before sharing it. An unfinished reply can offer a place to notice the difference between useful preparation and waiting to have everything settled.";

interface Composition {
  interpretation: string;
  lens: string;
  opening: string;
}

const COMPOSITIONS: readonly Composition[] = [
  {
    interpretation: OBLIGATION_SOURCE,
    lens: PREPARATION_SOURCE,
    opening:
      "A quiet moment might be spent mentally keeping track of an unfinished reply, a small obligation that can take up more room than its size suggests. For that reply, useful preparation may be different from waiting to have everything settled. A self-contained response to the pressure can start with sorting what is manageable before sharing it.",
  },
  {
    interpretation: OBLIGATION_SOURCE,
    lens: "Wanting room to move can be part of a response to pressure. If an ordinary obligation feels narrow, the useful distinction may be between the commitment itself and how much choice it leaves in carrying it out.",
    opening:
      "A small obligation can take up more room than its size suggests; a calendar left too full is one possible setting. If that obligation feels narrow, the useful distinction may be between the commitment itself and how much choice it leaves in carrying it out. Wanting room to move can be part of the response to that pressure.",
  },
  {
    interpretation: OBLIGATION_SOURCE,
    lens: "Dependable structure can offer support when a response needs time to take shape. An ordinary commitment may distinguish accepting useful support from taking on every obligation to keep the arrangement steady.",
    opening:
      "An ordinary commitment can take up more room than its size suggests, as when a quiet moment is spent mentally keeping track of it. In that commitment, accepting useful support may be different from taking on every obligation to keep the arrangement steady. Dependable structure can offer support when a response needs time to take shape.",
  },
  {
    interpretation: OBLIGATION_SOURCE,
    lens: "A manageable routine can offer a way to meet pressure without settling everything at once. An unfinished list may distinguish one useful task from making the entire routine a condition for taking a pause.",
    opening:
      "If a quiet moment is spent mentally keeping track of an unfinished list, one useful task may be different from making the entire routine a condition for taking a pause. A small obligation can take up more room than its size suggests. A manageable routine can offer a way to meet that pressure without settling everything at once.",
  },
  {
    interpretation: ROLE_SOURCE,
    lens: "Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    opening:
      "An established role can feel demanding when its obligations require more deliberate effort than usual. If several possible projects within that role compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages. Following more than one line of curiosity can help a direction take shape.",
  },
  {
    interpretation: ROLE_SOURCE,
    lens: PREPARATION_SOURCE,
    opening:
      "An established role can feel demanding when its obligations require more deliberate effort than usual. If an unfinished reply is one of those obligations, useful preparation may be different from waiting to have everything settled. A self-contained response to that pressure can start with sorting what is manageable before sharing it.",
  },
];

interface Relationship {
  secondary: string;
  synthesis: string;
  /** The second parent's own published sentence naming its contact. */
  lead: string;
}

/**
 * S1 relates two published interpretations, so it follows both parents rather
 * than standing alone. A bound I2/S1 pair may introduce the second parent with its
 * contact sentence; unfamiliar or edited copy keeps every I2 sentence.
 */
const RELATIONSHIPS: readonly Relationship[] = [
  {
    secondary:
      "Enthusiasm and practical initiative reinforce one another when an aim is well chosen. Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.",
    synthesis:
      "Giving a plan more scope can increase the structure needed to carry it. A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.",
    lead: "Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.",
  },
];

function relationship(secondary: string | null, synthesis: string): string {
  const bound = RELATIONSHIPS.find(
    (item) => item.secondary === secondary && item.synthesis === synthesis,
  );
  return [bound?.lead ?? secondary, synthesis].filter(Boolean).join(" ");
}

/**
 * Archived reads use saved I1/N1, never today's bundle. These openings are an
 * immutable consumption contract: future revisions must retain old variants for
 * readback rather than replacing their acceptance with the newest wording.
 */
export function consumedNatalTemplate(
  paragraph: string,
  interpretation: string | null,
  lens: string,
  chronology: string | null,
): boolean {
  // Legacy and conservative source-copy templates retain N1 verbatim.
  if (paragraph.includes(lens)) return true;
  return COMPOSITIONS.some(
    (item) =>
      item.interpretation === interpretation &&
      item.lens === lens &&
      paragraph === `${item.opening}${chronology ? ` ${chronology}` : ""}`,
  );
}

/**
 * Editorial targets for the bounded authored compositions. Technical detail is
 * optional and fitted to its budget. Unknown/edited source copy can exceed these
 * targets: preserving every source condition takes priority over clipping prose.
 */
export const NATAL_TEMPLATE_WORD_BUDGET = { standard: 170, technical: 240 } as const;

function sentences(copy: string): string[] {
  // Split rather than match substrings: decimal points or unfamiliar punctuation
  // must never discard any part of an edited condition or clause.
  return copy
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

export function composeNatalTemplate(input: {
  interpretation: string;
  lens: string;
  synthesis: string | null;
  /** I2's published copy, which S1 relates to I1. */
  secondary: string | null;
  primary: CycleInstance;
  story: DailyTransitStoryPlan;
  technical: boolean;
}): string[] {
  const { interpretation, lens, synthesis, secondary, primary, story, technical } = input;
  const composed = COMPOSITIONS.find(
    (item) => item.interpretation === interpretation && item.lens === lens,
  );
  const primarySentences = sentences(interpretation);
  // An unfamiliar/edited pair retains current source wording conservatively.
  // This is not a claim that arbitrary catalogue combinations are integrated or
  // writing-qualified. In particular, never apply an old recipe to new meaning.
  const opening = composed?.opening ?? [primarySentences[0], lens].filter(Boolean).join(" ");
  const paragraphs = [opening];
  const joint = synthesis ? relationship(secondary, synthesis) : null;
  // The primary contact sentence precedes the relationship when there is room.
  // A selected story keeps its bounded paragraph, so S1 then follows only I2.
  const support = composed
    ? story.status === "selected"
      ? (joint ?? primarySentences[1])
      : [primarySentences[1], joint].filter(Boolean).join(" ")
    : [primarySentences.slice(1).join(" "), joint].filter(Boolean).join(" ");

  if (story.status === "selected") {
    // N1 stays wholly in paragraph 1 for the saved natal evidence contract.
    // A1 appears exactly once in the first two paragraphs. S1 is its own
    // relationship, never a conclusion supposedly established by N1.
    paragraphs[0] += ` ${story.chronologySentence}`;
    paragraphs.push([support, story.copy.mechanism].filter(Boolean).join(" "));
  } else if (support) {
    paragraphs.push(support);
  }

  if (technical) {
    const detail = [
      `The calculated contact is ${primary.label}.`,
      `Current orb at the reading's calculation time: ${primary.orb}\u00b0.`,
      // A selected story owns chronology; do not repeat its dates or substitute
      // the legacy single-pass estimate for a qualified episode's timing.
      ...(story.status === "selected"
        ? []
        : [`Timing: ${exactPhrase(primary.days_to_exact ?? null)}.`]),
    ].join(" ");
    const wordCount = [...paragraphs, detail].join(" ").trim().split(/\s+/).length;
    if (wordCount <= NATAL_TEMPLATE_WORD_BUDGET.technical) paragraphs.push(detail);
  }
  return paragraphs;
}
