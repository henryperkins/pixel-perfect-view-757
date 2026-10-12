/**
 * Default interpretation bundle.
 *
 * This is the fallback content release used when no editorial release has been
 * ingested. Copy is deliberately observational: it describes a mechanism and a
 * question, never a prediction, an instruction, or a claim about health,
 * money, or other people.
 *
 * The fallback carries no natal lens catalogue: deploying code must never
 * activate natal lenses. The reviewed catalogue ships as the separate candidate
 * in `natal-candidate-bundle.ts` and goes live only through an explicitly
 * published and activated release.
 */

import type { TransitChapterCopy } from "./transit-story-catalogue";
import type { SynthesisRule, ThemeTag } from "./schema";
import type { NatalLensRule } from "./schema";

export interface Interpretation {
  /** matches `${aspect}:${transitBody}:${natalPoint}`, `${aspectFamily}:${transitBody}:${natalPoint}`, or a wildcard */
  key: string;
  mechanism: string;
  question: string;
  themes?: ThemeTag[];
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
  schemaVersion?: 2 | 3 | 4;
  transitChapters?: TransitChapterCopy[];
  cycles: Interpretation[];
  natal: Record<string, string>;
  phases: Record<string, string>;
  domains: Record<string, DomainInterpretation>;
  synthesisRules?: SynthesisRule[];
  natalLenses?: NatalLensRule[];
}

const HARD = "hard";
const SOFT = "soft";

export function aspectFamily(aspect: string): string {
  return aspect === "trine" || aspect === "sextile" ? SOFT : HARD;
}

export const DEFAULT_BUNDLE: ContentBundle = {
  version: "builtin-0.5.0",
  schemaVersion: 2,
  phases: {
    approaching: "The contact is in its approaching phase within the calculated window.",
    exact: "The contact is close to exact within the calculated window.",
    separating: "The contact is in its separating phase within the calculated window.",
  },
  natal: {
    sun_placement:
      "Your solar placement describes the thing you keep returning to when there is nothing external forcing your hand.",
    moon_placement:
      "Your lunar placement describes the conditions under which you settle, and the ones under which you do not.",
    ascendant_placement:
      "The rising sign describes the first impression you make and the mode you default to under mild pressure.",
  },
  domains: {
    work: {
      label: "work and output",
      hard: "Pace, scope, and the part of a task that feels like yours are separate pieces of working on something. An unfinished list or a draft with competing aims can be a place to notice friction between those pieces.",
      soft: "A task can feel manageable when its purpose and next small piece are easy to describe. A clear outline or a commitment with a clear scope can illustrate that kind of alignment.",
      prompt: "What piece of work would you defend if someone asked you to drop it this week?",
    },
    relationships: {
      label: "relationships and affection",
      hard: "Closeness, personal preference, and what you choose to express do not always line up neatly. A reply left unfinished or a plan you feel uncertain about can be a scene for that tension.",
      soft: "Affection or preference can be straightforward to name in an ordinary moment. A familiar conversation or a few words of appreciation can serve as an example.",
      prompt: "Who have you been meaning to say something to, and what has been stopping you?",
    },
    "inner-life": {
      label: "inner life and rest",
      hard: "An unclaimed hour can still be mentally full of unfinished tasks. A full calendar or an obligation that follows you into a quiet moment can offer a scene for tension around the amount of private space you prefer.",
      soft: "Private time can have a comfortable shape of its own. A familiar corner, an unclaimed hour, or a routine with fewer demands can serve as ordinary examples of that ease.",
      prompt: "What would genuine rest look like today, as opposed to distraction?",
    },
    identity: {
      label: "identity and direction",
      hard: "A title rarely describes everything that holds your attention. An interest you seldom mention, or a responsibility that occupies more of your week than your title suggests, can make that gap concrete.",
      soft: "A description of yourself can feel useful when it fits what you actually return to. A familiar project or an interest you can name plainly can offer a scene for that fit.",
      prompt: "Which description of yourself is out of date?",
    },
    structure: {
      label: "structure and commitments",
      hard: "This window lands on the structural part of your chart — contracts, obligations, long arrangements. Pressure here is usually about something carrying more weight than it was built for.",
      soft: "This window lands on the structural part of your chart, so it tends to favour tidying arrangements: what you formalise now generally holds.",
      prompt: "Which commitment would you renew on purpose, rather than by default?",
    },
  },
  cycles: [
    {
      key: "square:saturn:sun",
      mechanism:
        "An established role can feel demanding when its obligations require more deliberate effort than usual. Saturn's square to the Sun highlights where expectations outpace available capacity, showing where a routine or responsibility needs clearer boundaries.",
      question: "What responsibility is currently asking for clearer boundaries?",
      themes: ["structure", "autonomy"],
    },
    {
      key: "trine:jupiter:mars",
      mechanism:
        "Enthusiasm and practical initiative reinforce one another when an aim is well chosen. Jupiter's trine to Mars frames moments when effort encounters little friction, making it natural to take on a larger piece of work or pursue an emerging opening.",
      question: "Where does your initiative have room to expand?",
      themes: ["expansion", "initiative"],
    },
    {
      key: "trine:saturn:sun",
      mechanism:
        "Durable progress comes from small, dependable actions repeated without drama. Saturn's trine to the Sun frames the quiet satisfaction of upholding a commitment at an even pace, where patience stabilizes long-term direction.",
      question: "Which commitment feels worth sustaining at a steady pace?",
      themes: ["structure"],
    },
    {
      key: "trine:mars:sun",
      mechanism:
        "Energy flows easily when action lines up with what matters to you. Mars's trine to the Sun frames direct engagement with an immediate task, reducing hesitation and allowing effort to produce tangible results.",
      question: "Where can you apply direct effort without second-guessing yourself?",
      themes: ["initiative"],
    },
    {
      key: "opposition:venus:venus",
      mechanism:
        "Recognizing personal preferences can involve noticing a contrast with what others want or expect. Venus's opposition to natal Venus brings differences in taste and social ease into view, clarifying what you genuinely value in company and quiet.",
      question: "What preference becomes clearer when you compare your pace with others?",
      themes: ["connection"],
    },
    {
      key: "conjunction:mercury:mercury",
      mechanism:
        "A cycle of thought and communication resets with fresh curiosity. Mercury's conjunction with natal Mercury sharpens interest in new phrasing, questions, or ideas, bringing mental focus back to how you articulate what you mean.",
      question: "What topic or question is currently holding your attention?",
      themes: ["expression"],
    },
    {
      key: "hard:saturn:sun",
      mechanism:
        "An established role can feel heavier when the responsibilities attached to it become visible. Saturn's hard contact with the Sun offers a way to examine the fit between a description you use for yourself and the effort of living up to it. An old introduction or a task accepted by default is an ordinary place to notice that fit.",
      question: "What are you still doing out of habit rather than choice?",
    },
    {
      key: "soft:saturn:sun",
      mechanism:
        "Consistency can have a quiet shape: returning to a project, keeping a modest promise, or making one part of a routine reliable. A supportive Saturn contact with the Sun frames the connection between that repeated effort and a role you want to keep. The emphasis is on what can be sustained at an ordinary pace.",
      question: "What would be worth making durable this month?",
    },
    {
      key: "hard:saturn:moon",
      mechanism:
        "A small obligation can take up more room than its size suggests. Saturn's hard contact with the Moon frames the tension between something you feel responsible for and the amount of uninterrupted space you would prefer. The everyday scene might be a calendar left too full, or a quiet moment spent mentally keeping track of the next task.",
      question: "What kind of quiet are you actually needing?",
    },
    {
      key: "soft:saturn:moon",
      mechanism:
        "A familiar routine can be a reference point when the day has many moving parts. A supportive Saturn contact with the Moon frames the comfort of a small arrangement that is predictable: a usual place, a familiar sequence, or enough room between commitments. This is a way to notice which forms of structure feel easy to inhabit.",
      question: "Which small arrangement feels comfortable to return to?",
    },
    {
      key: "hard:jupiter:sun",
      mechanism:
        "One possibility can gather several more before you have decided what the first one involves. Jupiter's hard contact with the Sun frames the difference between a larger idea of yourself and the space available to carry it. A project gaining extra branches or a simple plan turning into a long list are everyday versions of that tension.",
      question: "Which of your current options is genuinely larger, and which just feels larger?",
    },
    {
      key: "soft:jupiter:sun",
      mechanism:
        "An existing plan can look roomier without becoming a different plan. A supportive Jupiter contact with the Sun frames that sense of permission to explore one more option or describe an ambition more openly. The interesting detail is where curiosity fits alongside what is already underway.",
      question: "Where is the resistance unusually low right now?",
    },
    {
      key: "hard:mars:sun",
      mechanism:
        "The wish to act can run ahead of the time a task actually needs. Mars's hard contact with the Sun frames friction around pace and ownership: a draft revised before it has settled, or a reply composed before the point is clear. The scene is about how effort meets resistance.",
      question: "Where is the friction actually pointing?",
    },
    {
      key: "soft:mars:sun",
      mechanism:
        "Direct effort has a simple shape when intention and action line up. A supportive Mars contact with the Sun frames the difference between circling a task and engaging with one clear part of it. An unfinished paragraph or a practical errand can provide a small, ordinary scene for that focus.",
      question: "Where does your effort have a clear place to go?",
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
        "A familiar choice can reveal a preference you have been overlooking. Venus's hard contact with natal Venus frames the gap between what you keep choosing and what still feels appealing. It might be visible in a song you skip, an object you keep without enjoying, or an invitation you are unsure you want to accept.",
      question: "What do you actually like, independent of what is expected?",
    },
    {
      key: "soft:venus:venus",
      mechanism:
        "Taste can become clearer in small choices that require little explanation. A supportive Venus contact with natal Venus frames the pleasure of recognising what appeals to you: a colour, a piece of music, or a way of spending an unclaimed hour.",
      question: "What small preference is easy for you to recognise?",
    },
    {
      key: "hard:mercury:mercury",
      mechanism:
        "Several unfinished explanations can compete for the same small piece of attention. Mercury's hard contact with natal Mercury frames the gap between knowing what you mean and deciding how to say it. A half-written message or a note revised several times offers a concrete scene for that friction.",
      question: "What is worth saying carefully rather than quickly?",
    },
    {
      key: "soft:mercury:mercury",
      mechanism:
        "A thought can have a workable shape before it has a polished one. A supportive Mercury contact with natal Mercury frames the connection between an idea and the words, outline, or example that make it understandable. A rough note becoming a clear sentence is one possible scene.",
      question: "Which idea is taking a clearer shape for you?",
    },
    {
      key: "hard:moon:moon",
      mechanism:
        "A brief Moon contact with natal Moon offers a frame for comparing an ordinary moment with your familiar rhythm. The scene might be the difference between choosing company and choosing a quiet hour, or between a familiar plan and the wish for some unplanned space. A single moment is enough for that comparison; it need not become a story about the whole day.",
      question: "How does today compare to your usual baseline?",
    },
    {
      key: "hard:sun:sun",
      mechanism: "Solar contacts to your own Sun mark the annual cycle turning over.",
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
  synthesisRules: [
    {
      key: "square:saturn:sun_tension_trine:jupiter:mars",
      primary: { interpretationKey: "square:saturn:sun", theme: "structure" },
      supporting: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
      relationship: "tension",
      mechanism:
        "Giving a plan more scope can increase the structure needed to carry it. A task whose ambitions are growing beyond its agreed limits offers one place to notice that tension.",
    },
    {
      key: "trine:jupiter:mars_tension_square:saturn:sun",
      primary: { interpretationKey: "trine:jupiter:mars", theme: "expansion" },
      supporting: { interpretationKey: "square:saturn:sun", theme: "structure" },
      relationship: "tension",
      mechanism:
        "Expanding the reach of a project tests the framework supporting it. Taking on a promising new direction while existing commitments are still demanding attention can highlight where capacity needs to catch up with ambition.",
    },
    {
      key: "trine:saturn:sun_reinforcement_trine:mars:sun",
      primary: { interpretationKey: "trine:saturn:sun", theme: "structure" },
      supporting: { interpretationKey: "trine:mars:sun", theme: "initiative" },
      relationship: "reinforcement",
      mechanism:
        "Steady persistence pairs naturally with targeted action. Focusing on a durable priority makes it easier to direct effort toward concrete, incremental steps without wasting momentum.",
    },
    {
      key: "trine:mars:sun_reinforcement_trine:saturn:sun",
      primary: { interpretationKey: "trine:mars:sun", theme: "initiative" },
      supporting: { interpretationKey: "trine:saturn:sun", theme: "structure" },
      relationship: "reinforcement",
      mechanism:
        "Active initiative finds firmer footing when backed by consistent habits. Putting energy into a defined routine or clear responsibility helps immediate progress hold its ground over time.",
    },
    {
      key: "opposition:venus:venus_independent_conjunction:mercury:mercury",
      primary: { interpretationKey: "opposition:venus:venus", theme: "connection" },
      supporting: { interpretationKey: "conjunction:mercury:mercury", theme: "expression" },
      relationship: "independent",
      mechanism: null,
    },
    {
      key: "conjunction:mercury:mercury_independent_opposition:venus:venus",
      primary: { interpretationKey: "conjunction:mercury:mercury", theme: "expression" },
      supporting: { interpretationKey: "opposition:venus:venus", theme: "connection" },
      relationship: "independent",
      mechanism: null,
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
    `${aspect}:${transitBody}:${natalPoint}`,
    `${aspect}:${transitBody}:*`,
    `${aspect}:*:${natalPoint}`,
    `${aspect}:*:*`,
    `${fam}:${transitBody}:${natalPoint}`,
    `${fam}:${transitBody}:*`,
    `${fam}:*:${natalPoint}`,
    `${fam}:*:*`,
  ];
  const cycles = bundle && Array.isArray(bundle.cycles) ? bundle.cycles : [];
  for (const key of candidates) {
    const hit = cycles.find((c) => c.key === key);
    if (hit) return hit;
  }
  return {
    key: "fallback",
    mechanism: "A contact is in range but no interpretation is published for it yet.",
    question: "What do you notice today that you would not have predicted yesterday?",
    themes: [],
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
  // Medical claims only — everyday "how you treat people" is fine.
  /\bdiagnos(?:e|es|ed|ing|is)\b/i,
  /\b(?:cure|treat)(?:s|ed|ing)? (?:your |the |an? )?(?:illness|disease|condition|depression|anxiety|symptoms?)\b/i,
  /\bmedication\b/i,
  // Financial advice only — "invest your energy" is fine.
  /\binvest(?:s|ed|ing)? (?:your )?(?:money|savings|in (?:stocks|shares|crypto|property|real estate))\b/i,
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
      out = out.replace(re, "[removed: this reading does not make claims of that kind]");
    }
  }
  return { text: out, flagged };
}
