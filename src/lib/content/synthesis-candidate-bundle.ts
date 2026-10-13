import type { ContentBundle, Interpretation } from "./default-bundle";
import type { SynthesisRule, ThemeTag } from "./schema";
import { TRANSIT_CANDIDATE_BUNDLE } from "./transit-candidate-bundle";

// Authored annotations describe the actual passages. They are never inferred
// from planetary labels in a member request.
const familyThemes: Record<string, ThemeTag[]> = {
  "hard:saturn:sun": ["structure", "autonomy"],
  "soft:saturn:sun": ["structure"],
  "hard:saturn:moon": ["structure", "rest"],
  "soft:saturn:moon": ["structure", "rest"],
  "hard:jupiter:sun": ["expansion", "autonomy"],
  "soft:jupiter:sun": ["expansion", "autonomy"],
  "hard:mars:sun": ["initiative", "autonomy"],
  "soft:mars:sun": ["initiative"],
  "hard:mars:mars": ["initiative"],
  "hard:uranus:sun": ["autonomy"],
  "hard:pluto:sun": ["structure", "autonomy"],
  "hard:neptune:sun": ["uncertainty", "expression"],
  "hard:venus:venus": ["connection"],
  "soft:venus:venus": ["connection"],
  "hard:mercury:mercury": ["expression"],
  "soft:mercury:mercury": ["expression"],
  "hard:moon:moon": ["rest", "connection"],
  "hard:sun:sun": ["autonomy"],
};

// Remove definite personal-state claims before the source catalogue is frozen
// for scene authoring. Existing published versions retain their original text.
const conditionalRevisions: Record<string, { mechanism: string; question: string }> = {
  "hard:venus:venus": {
    mechanism:
      "A familiar choice can offer a way to compare a repeated choice with what still feels appealing. This interpretation gives attention to your own preference alongside a choice that could be reconsidered. A song, kept object or invitation can provide an ordinary comparison.",
    question: "Which familiar choice would you compare with your preference?",
  },
  "hard:saturn:sun": {
    mechanism:
      "An established role can feel heavier when the responsibilities attached to it become visible. Saturn's hard contact with the Sun offers a way to examine the fit between a description you use for yourself and the effort of living up to it. An old introduction or a task accepted by default is an ordinary place to notice that fit.",
    question: "Which part of a role would you choose again?",
  },
  "opposition:venus:venus": {
    mechanism:
      "Comparing personal preferences with others' tastes or expectations can make a contrast easier to describe. This interpretation gives attention to a preference of your own alongside a taste or expectation held by someone else.",
    question: "Which preference would you compare with a different taste or expectation?",
  },
  "square:saturn:sun": {
    mechanism:
      "An established role can feel demanding when its obligations need deliberate effort. This interpretation gives attention to the fit between expectations, available capacity and the boundaries of a responsibility.",
    question: "Which responsibility would you give a clearer boundary?",
  },
  "trine:jupiter:mars": {
    mechanism:
      "Enthusiasm and practical initiative can reinforce one another when an aim is well chosen. This interpretation offers a way to compare the appeal of taking on a larger piece of work with the effort it would involve.",
    question: "Which aim would give your initiative a clear direction?",
  },
  "trine:saturn:sun": {
    mechanism:
      "Small, dependable actions can give a commitment an ordinary pace. This interpretation gives attention to the effort worth repeating and the direction that repetition would sustain.",
    question: "Which commitment would you choose to sustain at an ordinary pace?",
  },
  "trine:mars:sun": {
    mechanism:
      "Direct effort can give a clear intention a practical form. This interpretation offers a way to compare circling an immediate task with choosing one part to engage with.",
    question: "Which part of a task could express a clear intention?",
  },
  "conjunction:mercury:mercury": {
    mechanism:
      "Curiosity about a topic can bring phrasing, questions or ideas into view. This interpretation offers a way to compare what is meant with the words used to articulate it.",
    question: "Which point would you like to articulate more clearly?",
  },
  "hard:saturn:moon": {
    mechanism:
      "A small obligation can take up more room than its size suggests. Saturn's hard contact with the Moon frames the tension between something you feel responsible for and the amount of uninterrupted space you would prefer. The everyday scene might be a calendar left too full, or a quiet moment spent mentally keeping track of the next task.",
    question: "Where would you prefer more uninterrupted space around an obligation?",
  },
  "soft:jupiter:sun": {
    mechanism:
      "An existing plan can look roomier without becoming a different plan. A supportive Jupiter contact with the Sun frames that sense of permission to explore one more option or describe an ambition more openly. The interesting detail is where curiosity fits alongside what is already underway.",
    question: "Which option would you consider alongside what is already underway?",
  },
  "hard:mars:sun": {
    mechanism:
      "The wish to act can run ahead of the time a task actually needs. Mars's hard contact with the Sun frames friction around pace and ownership: a draft revised before it has settled, or a reply composed before the point is clear. The scene is about how effort meets resistance.",
    question: "Which task would benefit from a clearer point or a different pace?",
  },
  "hard:moon:moon": {
    mechanism:
      "An ordinary moment can offer a comparison with a familiar rhythm. Company, quiet or unplanned space can give that comparison a small, recognizable setting.",
    question: "Which ordinary moment would you compare with your familiar rhythm?",
  },
  "hard:jupiter:sun": {
    mechanism:
      "One possibility can gather several more before you have decided what the first one involves. Jupiter's hard contact with the Sun frames the difference between a larger idea of yourself and the space available to carry it. A project gaining extra branches or a simple plan turning into a long list are everyday versions of that tension.",
    question: "Which option would you compare with the space available to carry it?",
  },
  "hard:mars:mars": {
    mechanism:
      "A working push can have a moment when effort is being started, continued or set aside. This interpretation offers a way to notice how deliberately a task begins or ends.",
    question: "Which effort would you choose to begin deliberately?",
  },
  "hard:uranus:sun": {
    mechanism:
      "An arrangement can feel less useful when it no longer fits a current preference. This interpretation offers a way to compare an established routine with the choice you would make now.",
    question: "Which arrangement would you choose again today?",
  },
  "hard:pluto:sun": {
    mechanism:
      "A long-standing arrangement can make the limits of a negotiation easier to notice. This interpretation gives attention to the part of a commitment that feels worth keeping distinct.",
    question: "Which part of a commitment needs a clearer limit?",
  },
  "hard:neptune:sun": {
    mechanism:
      "An unclear description can leave the basis of a plan open to interpretation. This reading offers a way to distinguish what has been stated from what still needs to be described.",
    question: "Which expectation needs a clearer description?",
  },
  "hard:sun:sun": {
    mechanism:
      "An annual point in a calendar can offer a reference for considering one ordinary priority. This interpretation gives attention to what you would choose to carry forward.",
    question: "Which priority would you choose to carry forward?",
  },
  "hard:*:*": {
    mechanism:
      "Friction around an ordinary choice can make the demands on it easier to describe. This general interpretation gives attention to the effort and resistance involved in the choice.",
    question: "Which ordinary choice would benefit from a clearer account of its demands?",
  },
  "soft:*:*": {
    mechanism:
      "An ordinary action can feel straightforward when its aim is easy to describe. This general interpretation gives attention to the fit between an action and its purpose.",
    question: "Which ordinary action has a clear aim?",
  },
};

type PairCopy = {
  a: string;
  b: string;
  relationship: "tension" | "reinforcement";
  aTheme: ThemeTag;
  bTheme: ThemeTag;
  forward: string;
  reverse: string;
  reason: string;
};
export const SYNTHESIS_ADDITIONAL_PAIRS: PairCopy[] = [
  {
    a: "square:saturn:sun",
    b: "trine:jupiter:sun",
    relationship: "tension",
    aTheme: "structure",
    bTheme: "expansion",
    forward:
      "A role can ask for clearer boundaries while an existing plan offers another possibility. The question is how much room an additional option would need within the responsibility already being considered.",
    reverse:
      "Exploring another option can make the limits of an existing role easier to describe. An appealing possibility and the capacity needed to carry it can be considered together without assuming the plan must grow.",
    reason:
      "Role capacity and clearer boundaries from the first source meet the second source’s additional option within an existing plan.",
  },
  {
    a: "trine:saturn:sun",
    b: "trine:jupiter:sun",
    relationship: "reinforcement",
    aTheme: "structure",
    bTheme: "expansion",
    forward:
      "A dependable commitment can give an additional option a place to be considered. Keeping the existing plan in view can connect steady effort with a modest extension of its scope.",
    reverse:
      "Another option can be explored alongside the commitments worth sustaining. A stable arrangement offers a reference point for deciding whether the plan has room to become a little larger.",
    reason:
      "The first source supports sustained ordinary effort; the second explicitly situates exploration alongside an existing plan.",
  },
  {
    a: "trine:jupiter:mars",
    b: "trine:jupiter:sun",
    relationship: "reinforcement",
    aTheme: "initiative",
    bTheme: "expansion",
    forward:
      "A well-chosen aim can give enthusiasm a practical direction while an existing plan offers another option. Connecting one possibility with a clear purpose can keep the larger scope understandable.",
    reverse:
      "An additional option can be considered through the aim it would serve. Enthusiasm and practical initiative can give exploration a focus without turning every possibility into a commitment.",
    reason:
      "Both sources concern choosing an aim or option for expansion; neither establishes that a real opportunity has occurred.",
  },
  {
    a: "square:saturn:moon",
    b: "conjunction:moon:moon",
    relationship: "tension",
    aTheme: "rest",
    bTheme: "rest",
    forward:
      "A small obligation can occupy the room around a quiet moment. Comparing that demand with a familiar rhythm can make the amount of uninterrupted space involved easier to notice.",
    reverse:
      "An ordinary moment can be compared with the rhythm that feels familiar. If a small obligation is claiming attention, its demand on that moment gives the comparison a concrete focus.",
    reason:
      "The first passage explicitly contrasts obligation with uninterrupted space; the second supplies a comparison with familiar company/quiet rhythms.",
  },
  {
    a: "square:saturn:sun",
    b: "square:saturn:moon",
    relationship: "reinforcement",
    aTheme: "structure",
    bTheme: "structure",
    forward:
      "The effort attached to a role can also bring the room around a small obligation into view. Both meanings concern the boundaries of responsibility, including the capacity it needs and the uninterrupted space it may occupy.",
    reverse:
      "An obligation can be considered through the space it occupies. If it belongs to the role being considered, looking at both demands together can make the boundary of responsibility more specific.",
    reason:
      "Both mechanisms explicitly examine responsibility and its demands; the second adds uninterrupted space rather than an unrelated event.",
  },
  {
    a: "trine:jupiter:mars",
    b: "square:mars:sun",
    relationship: "tension",
    aTheme: "initiative",
    bTheme: "initiative",
    forward:
      "A well-chosen aim can encourage initiative; if the wish to act runs ahead of the task's workable pace, the two meanings offer a comparison between starting and allowing the task enough time.",
    reverse:
      "The wish to act can run ahead of a task's pace. If that effort also serves a well-chosen aim, enthusiasm can be considered alongside the time the task needs.",
    reason:
      "The first source supports a well-chosen practical aim; the second explicitly contrasts the wish to act with the time a task needs.",
  },
  {
    a: "conjunction:mercury:mercury",
    b: "square:mars:sun",
    relationship: "tension",
    aTheme: "expression",
    bTheme: "initiative",
    forward:
      "Interest in phrasing can clarify the point of a response before it is made. If the wish to act is moving faster than that point can be described, meaning and pace can be considered together.",
    reverse:
      "A quick response can get ahead of the point it needs to make. Curiosity about the wording offers a way to distinguish the impulse to act from a clear account of what is meant.",
    reason:
      "The Mercury source concerns articulating meaning; the Mars source explicitly names a reply composed before its point is clear.",
  },
  {
    a: "trine:saturn:sun",
    b: "square:saturn:moon",
    relationship: "tension",
    aTheme: "structure",
    bTheme: "rest",
    forward:
      "A commitment can be worth sustaining while a small obligation occupies space the person would prefer uninterrupted. The fit concerns whether the steady arrangement leaves space around the demands it carries.",
    reverse:
      "A small obligation can claim attention within an arrangement that otherwise feels dependable. Keeping the commitment and the room around it in view can make its sustainable pace easier to describe.",
    reason:
      "Sustaining a commitment and preferring uninterrupted space are separate demands explicitly present in the two parent passages.",
  },
  {
    a: "trine:jupiter:sun",
    b: "square:saturn:moon",
    relationship: "tension",
    aTheme: "expansion",
    bTheme: "rest",
    forward:
      "An additional option can look appealing alongside an existing plan. If a small obligation already occupies attention, considering the room around it can help describe what that option would require.",
    reverse:
      "The room around a small obligation can be considered before a plan takes in another option. Curiosity remains part of the picture, alongside the uninterrupted space that makes the arrangement comfortable.",
    reason:
      "The Jupiter passage explores an additional option; the Saturn/Moon passage names obligations occupying preferred uninterrupted space. The comparison concerns the room the additional option would require.",
  },
  {
    a: "trine:mars:sun",
    b: "conjunction:mercury:mercury",
    relationship: "reinforcement",
    aTheme: "initiative",
    bTheme: "expression",
    forward:
      "A clear account of an intention can give direct effort a focus. Engaging with one action and finding the words for its purpose can reinforce the same deliberate response.",
    reverse:
      "Interest in articulating an idea can be paired with one action that expresses its purpose. Direct effort offers a practical form for the point being described.",
    reason:
      "Action aligned with intention and articulating what is meant support the same deliberate response; no external outcome is promised.",
  },
  {
    a: "trine:mars:sun",
    b: "trine:jupiter:sun",
    relationship: "reinforcement",
    aTheme: "initiative",
    bTheme: "expansion",
    forward:
      "Direct effort can give one additional option a manageable form. Considering a possibility through a clear next action can connect curiosity with what would actually be done.",
    reverse:
      "An option can be explored by describing one action it would involve. The fit between intention and direct effort gives that possibility a practical focus.",
    reason:
      "The first passage links intention with a direct task; the second supports exploring one option within an existing plan.",
  },
  {
    a: "square:saturn:sun",
    b: "square:mars:sun",
    relationship: "tension",
    aTheme: "structure",
    bTheme: "initiative",
    forward:
      "The wish to act can run ahead of the capacity a responsibility asks for. Comparing the pace of a proposed response with the boundaries of the role can make both demands clearer.",
    reverse:
      "An immediate response can be considered alongside the responsibility it would add to. The difference between wanting to act and having the capacity to carry that action gives the friction a specific focus.",
    reason:
      "Both sources explicitly compare effort with its limits: capacity and role boundaries in one, pace and task requirements in the other.",
  },
];

const originalNewRules: SynthesisRule[] = SYNTHESIS_ADDITIONAL_PAIRS.flatMap((pair) => [
  {
    key: pair.a + "_" + pair.relationship + "_" + pair.b,
    primary: { interpretationKey: pair.a, theme: pair.aTheme },
    supporting: { interpretationKey: pair.b, theme: pair.bTheme },
    relationship: pair.relationship,
    mechanism: pair.forward,
  },
  {
    key: pair.b + "_" + pair.relationship + "_" + pair.a,
    primary: { interpretationKey: pair.b, theme: pair.bTheme },
    supporting: { interpretationKey: pair.a, theme: pair.aTheme },
    relationship: pair.relationship,
    mechanism: pair.reverse,
  },
]);

const revisedSources: Interpretation[] = TRANSIT_CANDIDATE_BUNDLE.cycles.map((source) => ({
  ...structuredClone(source),
  ...conditionalRevisions[source.key],
  ...(familyThemes[source.key] ? { themes: [...familyThemes[source.key]!] } : {}),
}));
export const SYNTHESIS_EXACT_ADDITIONS = Object.entries(familyThemes).flatMap(
  ([source, themes]) => {
    const [family, body, point] = source.split(":");
    const aspects =
      family === "soft"
        ? ["sextile", "trine"]
        : ["conjunction", "square", "opposition", "quincunx"];
    return aspects
      .map((aspect) => ({ key: `${aspect}:${body}:${point}`, source, themes }))
      .filter(({ key }) => !revisedSources.some((item) => item.key === key));
  },
);
const addedSources = SYNTHESIS_EXACT_ADDITIONS.map(({ key, source, themes }) => ({
  ...structuredClone(revisedSources.find((item) => item.key === source)!),
  key,
  themes: [...themes],
}));
const allSources = [...revisedSources, ...addedSources];
// A relationship may reuse its separately authored directions only when BOTH
// parent passages and questions are byte-identical. Same-body/theme is insufficient.
export const SYNTHESIS_RULE_ORIGINS: Record<string, string> = {};
const newRules: SynthesisRule[] = [];
for (const rule of originalNewRules) {
  const parent = allSources.find((item) => item.key === rule.primary.interpretationKey)!;
  const supporting = allSources.find((item) => item.key === rule.supporting.interpretationKey)!;
  const aliases = (source: Interpretation) =>
    allSources.filter(
      (item) =>
        !/^(hard|soft):/.test(item.key) &&
        !item.key.includes("*") &&
        item.mechanism === source.mechanism &&
        item.question === source.question,
    );
  for (const a of aliases(parent))
    for (const b of aliases(supporting)) {
      if (a.key.split(":").slice(1).join(":") === b.key.split(":").slice(1).join(":")) continue;
      const key = `${a.key}_${rule.relationship}_${b.key}`;
      if (newRules.some((item) => item.key === key)) continue;
      newRules.push({
        ...structuredClone(rule),
        key,
        primary: { ...rule.primary, interpretationKey: a.key },
        supporting: { ...rule.supporting, interpretationKey: b.key },
      });
      SYNTHESIS_RULE_ORIGINS[key] = rule.key;
    }
}

/** Inactive editorial proposal. Member releases and the historical candidate stay unchanged. */
export const SYNTHESIS_CANDIDATE_BUNDLE: ContentBundle = {
  ...structuredClone(TRANSIT_CANDIDATE_BUNDLE),
  version: "builtin-0.8.0-synthesis-r3",
  schemaVersion: 4,
  cycles: allSources,
  synthesisRules: [...structuredClone(TRANSIT_CANDIDATE_BUNDLE.synthesisRules ?? []), ...newRules],
};
