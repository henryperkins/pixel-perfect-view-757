import type { ContentBundle } from "./default-bundle";
import type { DailyScene, DailyWritingFrame } from "./daily-writing";
import {
  SYNTHESIS_CANDIDATE_BUNDLE,
  SYNTHESIS_EXACT_ADDITIONS,
  SYNTHESIS_RULE_ORIGINS,
} from "./synthesis-candidate-bundle";

const scene = (
  key: string,
  situation: string,
  focus: string,
  object: string,
  action: string,
): DailyScene => ({ key, situation, focus, cues: { objects: [object], actions: [action] } });
type FrameCopy = {
  scene: DailyScene;
  standard: string;
  highStress: string;
  lowSleep: string;
  index: number;
};
const copy = (
  illustration: DailyScene,
  standard: string,
  highStress: string,
  lowSleep: string,
  index = 0,
): FrameCopy => ({ scene: illustration, standard, highStress, lowSleep, index });
// Each entry is an authored source reading, not planet-to-scene inference.
const INTERPRETATION_FRAMES: Record<string, FrameCopy> = {
  "square:saturn:sun": copy(
    scene(
      "calendar-capacity",
      "If a responsibility would fill the last gap in a calendar, its demands can be compared with the capacity available.",
      "The comparison concerns the boundary of a role and the effort it would require.",
      "calendar",
      "compared",
    ),
    "Which responsibility would you give a clearer boundary?",
    "Which boundary could be described simply?",
    "Which responsibility could have a smaller scope?",
  ),
  "trine:jupiter:mars": copy(
    scene(
      "project-aim",
      "If a project outline includes a larger task, its appeal can be compared with the aim that effort would serve.",
      "The comparison concerns enthusiasm and initiative toward a well-chosen aim.",
      "outline",
      "compared",
    ),
    "Which aim would give your initiative a clear direction?",
    "Which aim could be described simply?",
    "Which piece of effort could have a modest scope?",
  ),
  "trine:saturn:sun": copy(
    scene(
      "repeatable-commitment",
      "If a small task belongs to a commitment worth keeping, returning to it can illustrate a dependable pace.",
      "The comparison concerns an effort worth repeating within that commitment.",
      "task",
      "returning",
    ),
    "Which commitment would you choose to sustain at an ordinary pace?",
    "Which part of that commitment could stay small?",
    "Which repeatable effort could have a modest scope?",
  ),
  "trine:mars:sun": copy(
    scene(
      "paragraph-intention",
      "If a paragraph remains unfinished, choosing one part to work on can give an intention a practical form.",
      "The comparison concerns direct effort and the purpose it would express.",
      "paragraph",
      "choosing",
    ),
    "Which part of a task could express a clear intention?",
    "Which intention could be described simply?",
    "Which part of a task could have a modest scope?",
  ),
  "opposition:venus:venus": copy(
    scene(
      "invitation-preference",
      "If an invitation suggests a choice different from your preference, the contrast can give that preference a clearer outline.",
      "The comparison concerns your own taste alongside another taste or expectation.",
      "invitation",
      "choice",
    ),
    "Which preference would you compare with a different taste or expectation?",
    "Which preference could be described simply?",
    "Which preference would you like to keep in view?",
  ),
  "conjunction:mercury:mercury": copy(
    scene(
      "unfinished-reply",
      "If a reply remains unfinished, its point can need clearer wording.",
      "The comparison concerns what is meant and the words used to articulate it.",
      "reply",
      "wording",
    ),
    "Which point would you like to articulate more clearly?",
    "Which point could be described simply?",
    "Which point would you like to keep in view?",
  ),
  "hard:saturn:sun": copy(
    scene(
      "default-task",
      "If a task accepted by default still belongs to a role, its effort can be compared with the description of that role.",
      "The comparison concerns the fit between a role and the responsibilities attached to it.",
      "task",
      "compared",
    ),
    "Which part of a role would you choose again?",
    "Which responsibility could have a clearer scope?",
    "Which part of a role could stay small?",
  ),
  "soft:saturn:sun": copy(
    scene(
      "reliable-routine",
      "If one project task can be returned to at an ordinary pace, it can illustrate a routine worth keeping reliable.",
      "The comparison concerns repeated effort and a role you would choose to keep.",
      "task",
      "returned",
    ),
    "Which routine would you choose to keep reliable?",
    "Which repeatable effort could stay small?",
    "Which routine could have a modest scope?",
  ),
  "hard:saturn:moon": copy(
    scene(
      "full-calendar",
      "If a small obligation fills a calendar gap, its demand can be compared with the uninterrupted space you would prefer.",
      "The comparison concerns the room an obligation may occupy around a quiet moment.",
      "calendar",
      "compared",
    ),
    "Where would you prefer more uninterrupted space around an obligation?",
    "Which obligation could leave a little more room?",
    "Which obligation could have a smaller scope?",
  ),
  "soft:saturn:moon": copy(
    scene(
      "familiar-sequence",
      "If a familiar sequence gives a quiet moment a predictable shape, that arrangement can be a reference for comfort.",
      "The comparison concerns which small forms of structure feel easy to inhabit.",
      "sequence",
      "gives",
    ),
    "Which small arrangement feels comfortable to return to?",
    "Which familiar arrangement could stay simple?",
    "Which small arrangement would you like to keep in view?",
  ),
  "hard:jupiter:sun": copy(
    scene(
      "branching-list",
      "If one item on a project list gathers several more, the larger possibility can be compared with the space available to carry it.",
      "The comparison concerns the scope of an option and the demands it would add.",
      "list",
      "compared",
    ),
    "Which option would you compare with the space available to carry it?",
    "Which option could have a smaller scope?",
    "Which option would you like to keep in view?",
  ),
  "soft:jupiter:sun": copy(
    scene(
      "plan-option",
      "If another option is added to a plan outline, its appeal can be considered alongside what is already underway.",
      "The comparison concerns curiosity within an existing plan.",
      "outline",
      "considered",
    ),
    "Which option would you consider alongside what is already underway?",
    "Which option could be described simply?",
    "Which option could have a modest scope?",
  ),
  "hard:mars:sun": copy(
    scene(
      "reply-pace",
      "If a reply is composed before its point is clear, its wording can illustrate the difference between wanting to act and allowing the task enough time.",
      "The comparison concerns the point of a response and its workable pace.",
      "reply",
      "wording",
    ),
    "Which task would benefit from a clearer point or a different pace?",
    "Which point could be described simply?",
    "Which part of a task could have a modest scope?",
  ),
  "soft:mars:sun": copy(
    scene(
      "clear-paragraph",
      "If a paragraph remains unfinished, working on one clear part can give an intention a direct expression.",
      "The comparison concerns engaging with a task and the purpose that effort would serve.",
      "paragraph",
      "working",
    ),
    "Which part of a task has a clear purpose?",
    "Which purpose could be described simply?",
    "Which piece of effort could stay small?",
  ),
  "hard:mars:mars": copy(
    scene(
      "deliberate-start",
      "If a task is about to begin, naming its starting point can illustrate a deliberate working effort.",
      "The comparison concerns how an effort is begun, continued or set aside.",
      "task",
      "naming",
    ),
    "Which effort would you choose to begin deliberately?",
    "Which starting point could stay small?",
    "Which effort could have a modest scope?",
  ),
  "hard:uranus:sun": copy(
    scene(
      "routine-choice",
      "If a routine is being reconsidered, its arrangement can be compared with the choice you would make now.",
      "The comparison concerns an established arrangement and a current preference.",
      "routine",
      "compared",
    ),
    "Which arrangement would you choose again today?",
    "Which part of an arrangement could be described simply?",
    "Which arrangement would you like to keep in view?",
  ),
  "hard:pluto:sun": copy(
    scene(
      "commitment-limit",
      "If a commitment is being discussed, naming one limit can give its negotiation a clearer outline.",
      "The comparison concerns the part of an arrangement that feels worth keeping distinct.",
      "commitment",
      "naming",
    ),
    "Which part of a commitment needs a clearer limit?",
    "Which limit could be described simply?",
    "Which part of a commitment would you like to keep distinct?",
  ),
  "hard:neptune:sun": copy(
    scene(
      "unclear-description",
      "If a plan contains an unclear description, its wording can be compared with what has actually been stated.",
      "The comparison concerns a stated expectation and what still needs to be described.",
      "plan",
      "wording",
    ),
    "Which expectation needs a clearer description?",
    "Which expectation could be described simply?",
    "Which stated detail would you like to keep in view?",
  ),
  "hard:venus:venus": copy(
    scene(
      "song-preference",
      "If a familiar song is skipped, that choice can offer a comparison with what still feels appealing.",
      "The comparison concerns a repeated choice and your own preference.",
      "song",
      "choice",
    ),
    "Which familiar choice would you compare with your preference?",
    "Which preference could be described simply?",
    "Which preference would you like to keep in view?",
  ),
  "soft:venus:venus": copy(
    scene(
      "colour-preference",
      "If a colour appeals to you, choosing it can illustrate a small preference that needs little explanation.",
      "The comparison concerns recognizing what is appealing in an ordinary choice.",
      "colour",
      "choosing",
    ),
    "Which small preference is easy for you to recognise?",
    "Which preference could be described simply?",
    "Which preference would you like to keep in view?",
  ),
  "hard:mercury:mercury": copy(
    scene(
      "reply-wording",
      "If a reply remains unfinished, revising its wording can illustrate the gap between knowing a point and deciding how to say it.",
      "The comparison concerns the meaning of a point and the words used for it.",
      "reply",
      "wording",
    ),
    "Which point would you like to word carefully?",
    "Which point could be described simply?",
    "Which point would you like to keep in view?",
  ),
  "soft:mercury:mercury": copy(
    scene(
      "rough-outline",
      "If an outline gives an idea a workable shape, its wording can be considered before it is polished.",
      "The comparison concerns an idea and the words that make it understandable.",
      "outline",
      "wording",
    ),
    "Which idea would you like to give a clearer shape?",
    "Which idea could be described simply?",
    "Which idea would you like to keep in view?",
  ),
  "hard:moon:moon": copy(
    scene(
      "ordinary-quiet",
      "If an unplanned hour offers a quiet moment, it can be compared with a familiar rhythm.",
      "The comparison concerns one ordinary moment through company, quiet or unplanned space.",
      "hour",
      "compared",
    ),
    "Which ordinary moment would you compare with your familiar rhythm?",
    "Which quiet moment would you like to keep in view?",
    "Which ordinary moment could have a simpler shape?",
  ),
  "hard:sun:sun": copy(
    scene(
      "calendar-priority",
      "If an annual date is marked on a calendar, it can offer a reference for considering one priority to carry forward.",
      "The comparison concerns a calendar reference and an ordinary priority.",
      "calendar",
      "considering",
    ),
    "Which priority would you choose to carry forward?",
    "Which priority could have a smaller scope?",
    "Which priority would you like to keep in view?",
  ),
  "hard:*:*": copy(
    scene(
      "competing-list",
      "If two items on a task list compete for attention, their demands can give an ordinary choice a clearer outline.",
      "The comparison concerns the effort and resistance involved in that choice.",
      "list",
      "choice",
    ),
    "Which ordinary choice would benefit from a clearer account of its demands?",
    "Which demand could be described simply?",
    "Which ordinary choice could stay small?",
  ),
  "soft:*:*": copy(
    scene(
      "clear-action",
      "If a task list names one action with a clear aim, that action can illustrate a straightforward fit with its purpose.",
      "The comparison concerns an ordinary action and the aim it would serve.",
      "list",
      "action",
    ),
    "Which ordinary action has a clear aim?",
    "Which aim could be described simply?",
    "Which ordinary action could stay small?",
  ),
};
const a = "square:saturn:sun",
  b = "trine:jupiter:mars",
  c = "trine:saturn:sun",
  d = "trine:mars:sun",
  f = "conjunction:mercury:mercury",
  g = "square:saturn:moon",
  h = "trine:jupiter:sun",
  i = "square:mars:sun",
  j = "conjunction:moon:moon";
const SYNTHESIS_FRAMES: Record<string, FrameCopy> = {
  [`${a}|${b}`]: copy(
    scene(
      "calendar-scope",
      "If a larger project would fill a calendar gap, its appeal can be compared with the capacity an existing role asks for.",
      "The comparison concerns additional scope and the boundaries needed to carry it.",
      "calendar",
      "compared",
    ),
    "Which commitment could leave room for a larger plan?",
    "Which part of that commitment could have a smaller scope?",
    "Which boundary would you like to keep in view?",
  ),
  [`${c}|${d}`]: copy(
    scene(
      "routine-action",
      "If one task belongs to a commitment worth sustaining, direct effort on that task can be considered alongside a dependable pace.",
      "The comparison concerns a repeatable commitment and an action that could express its purpose.",
      "task",
      "effort",
    ),
    "Which action could give a commitment a practical form?",
    "Which repeatable action could stay small?",
    "Which part of that commitment could have a modest scope?",
  ),
  [`${a}|${h}`]: copy(
    scene(
      "calendar-option",
      "If another option would fill a calendar gap, its appeal can be compared with the capacity an existing responsibility asks for.",
      "The comparison concerns exploring an option within the boundaries of a role.",
      "calendar",
      "compared",
    ),
    "Which boundary would you consider alongside another option?",
    "Which boundary could be described simply?",
    "Which option could have a modest scope?",
  ),
  [`${c}|${h}`]: copy(
    scene(
      "commitment-option",
      "If an additional option is written into a plan, it can be considered alongside an effort worth repeating.",
      "The comparison concerns exploring an option within a commitment that could be sustained.",
      "plan",
      "considered",
    ),
    "Which option could have a place within a commitment worth keeping?",
    "Which part of that option could stay small?",
    "Which commitment would you like to keep in view?",
  ),
  [`${b}|${h}`]: copy(
    scene(
      "option-aim",
      "If a plan outline includes another option, that possibility can be considered through the aim its effort would serve.",
      "The comparison concerns practical initiative and curiosity within an existing plan.",
      "outline",
      "considered",
    ),
    "Which aim could give another option a practical focus?",
    "Which aim could be described simply?",
    "Which part of the option could have a modest scope?",
  ),
  [`${g}|${j}`]: copy(
    scene(
      "quiet-obligation",
      "If a calendar obligation occupies a quiet hour, its demand can be compared with a familiar rhythm.",
      "The comparison concerns an obligation's room around one ordinary moment.",
      "hour",
      "compared",
    ),
    "Which ordinary moment would you compare with the room an obligation takes?",
    "Which obligation could leave a little more room?",
    "Which ordinary moment could have a simpler shape?",
  ),
  [`${a}|${g}`]: copy(
    scene(
      "role-obligation",
      "If a task belongs to an existing responsibility, a full calendar can illustrate both the capacity it needs and the quiet room it may occupy.",
      "The comparison concerns the demands of a role and the space around an obligation.",
      "calendar",
      "occupy",
    ),
    "Which responsibility would you consider through both its effort and its space?",
    "Which part of that responsibility could stay small?",
    "Which boundary would you like to keep in view?",
  ),
  [`${b}|${i}`]: copy(
    scene(
      "aim-pace",
      "If a proposed task serves a well-chosen aim, its appeal can be compared with the time that task would need.",
      "The comparison concerns enthusiasm to begin and a workable pace for the same task.",
      "task",
      "compared",
    ),
    "Which aim would you consider alongside a task's workable pace?",
    "Which part of that task could stay small?",
    "Which aim would you like to keep in view?",
  ),
  [`${f}|${i}`]: copy(
    scene(
      "reply-point-pace",
      "If a reply is composed before its point is clear, its wording can illustrate the difference between wanting to respond and articulating what is meant.",
      "The comparison concerns the meaning of a response and the pace at which it is made.",
      "reply",
      "wording",
    ),
    "Which point would you consider before choosing a response's pace?",
    "Which point could be described simply?",
    "Which part of the response could have a modest scope?",
  ),
  [`${c}|${g}`]: copy(
    scene(
      "steady-quiet",
      "If a task belongs to a commitment worth sustaining, its calendar space can be compared with the uninterrupted room you would prefer.",
      "The comparison concerns a dependable pace and the space an obligation may occupy.",
      "calendar",
      "compared",
    ),
    "Which commitment would you consider alongside the room it occupies?",
    "Which part of that commitment could stay small?",
    "Which boundary would you like to keep in view?",
  ),
  [`${h}|${g}`]: copy(
    scene(
      "option-quiet",
      "If another option would fill a calendar gap, its appeal can be compared with the uninterrupted room around an existing obligation.",
      "The comparison concerns exploring one more option and the space that obligation may occupy.",
      "calendar",
      "compared",
    ),
    "Which option would you consider alongside the space around an obligation?",
    "Which option could have a smaller scope?",
    "Which boundary would you like to keep in view?",
  ),
  [`${d}|${f}`]: copy(
    scene(
      "intention-wording",
      "If a reply could express an intention, its wording and the action it would involve can be considered together.",
      "The comparison concerns articulating a point and giving that intention a practical form.",
      "reply",
      "wording",
    ),
    "Which intention could have both a clear description and a practical form?",
    "Which intention could be described simply?",
    "Which piece of effort could have a modest scope?",
  ),
  [`${d}|${h}`]: copy(
    scene(
      "option-action",
      "If a plan outline includes another option, describing one action it would involve can give that possibility a practical focus.",
      "The comparison concerns curiosity about an option and direct effort toward its purpose.",
      "outline",
      "describing",
    ),
    "Which action would you consider as a way to explore an option?",
    "Which part of that action could stay small?",
    "Which option would you like to keep in view?",
  ),
  [`${a}|${i}`]: copy(
    scene(
      "response-capacity",
      "If a task would add to an existing responsibility, its proposed pace can be compared with the capacity that role asks for.",
      "The comparison concerns the wish to act and the boundaries of responsibility.",
      "task",
      "compared",
    ),
    "Which response would you consider alongside the capacity it would require?",
    "Which boundary could be described simply?",
    "Which part of the response could have a modest scope?",
  ),
};
const frame = (
  kind: "interpretation" | "synthesis",
  key: string,
  authored: FrameCopy,
): DailyWritingFrame => ({
  key: `dw-${kind === "interpretation" ? "i" : "s"}-${key}`,
  source: { kind, key },
  templateSentenceIndex: authored.index,
  scenes: [structuredClone(authored.scene)],
  reflection: {
    standard: authored.standard,
    highStress: authored.highStress,
    lowSleep: authored.lowSleep,
  },
});
const interpretationFrames = SYNTHESIS_CANDIDATE_BUNDLE.cycles.map((source) => {
  const origin = SYNTHESIS_EXACT_ADDITIONS.find((item) => item.key === source.key)?.source;
  const authored = INTERPRETATION_FRAMES[source.key] ?? INTERPRETATION_FRAMES[origin ?? ""];
  if (!authored) throw Error("Missing authored interpretation frame.");
  return frame("interpretation", source.key, authored);
});
const synthesisFrames = (SYNTHESIS_CANDIDATE_BUNDLE.synthesisRules ?? [])
  .filter((rule) => rule.relationship !== "independent")
  .map((rule) => {
    const origin = SYNTHESIS_RULE_ORIGINS[rule.key] ?? rule.key;
    const [primary, supporting] = origin.split(`_${rule.relationship}_`);
    const authored =
      SYNTHESIS_FRAMES[`${primary}|${supporting}`] ?? SYNTHESIS_FRAMES[`${supporting}|${primary}`];
    if (!authored) throw Error("Missing authored directed synthesis frame.");
    return frame("synthesis", rule.key, authored);
  });

/** Inactive schema-5 proposal. Serving still uses the separately activated content release. */
export const WRITING_CANDIDATE_BUNDLE: ContentBundle = {
  ...structuredClone(SYNTHESIS_CANDIDATE_BUNDLE),
  version: "builtin-0.8.0",
  schemaVersion: 5,
  dailyWritingFrames: [...interpretationFrames, ...synthesisFrames],
};
