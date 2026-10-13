import type { ContentBundle } from "./default-bundle";
import { synthesisCatalogueMatrix, type SynthesisMatrixRow } from "./synthesis-coverage";
import {
  SYNTHESIS_ADDITIONAL_PAIRS,
  SYNTHESIS_EXACT_ADDITIONS,
  SYNTHESIS_RULE_ORIGINS,
} from "./synthesis-candidate-bundle";

/** Authored focus summaries, to be reviewed against the complete source text. */
export const SYNTHESIS_SOURCE_FOCUS: Record<string, string> = {
  "square:saturn:sun": "role obligations, effort and clearer capacity boundaries",
  "trine:jupiter:mars": "a well-chosen aim connecting enthusiasm with practical initiative",
  "trine:saturn:sun": "small dependable actions sustaining a commitment at an even pace",
  "trine:mars:sun": "direct effort that aligns with an intention",
  "opposition:venus:venus": "recognizing preferences in contrast with other tastes or expectations",
  "conjunction:mercury:mercury": "curiosity about phrasing, questions and articulating meaning",
  "square:saturn:moon": "the room a small obligation takes from uninterrupted space",
  "trine:jupiter:sun": "exploring one more option alongside an existing plan",
  "square:mars:sun": "the wish to act getting ahead of a task or a reply’s clear point",
  "conjunction:moon:moon":
    "an ordinary comparison with a familiar rhythm through company, quiet or unplanned space",
  "hard:saturn:sun": "the fit between an established role and a task accepted by default",
  "soft:saturn:sun": "ordinary consistency through a project, promise or reliable routine",
  "hard:saturn:moon": "responsibility occupying attention and preferred uninterrupted room",
  "soft:saturn:moon": "comfort in a small predictable arrangement or familiar sequence",
  "hard:jupiter:sun": "the difference between a growing possibility and the space to carry it",
  "soft:jupiter:sun": "curiosity about another option alongside what is already underway",
  "hard:mars:sun": "friction between the wish to act and the pace or point a task needs",
  "soft:mars:sun": "engaging directly with one clear piece of a task",
  "hard:mars:mars": "deliberately beginning, continuing or setting aside a working effort",
  "hard:uranus:sun": "comparing an established arrangement with a current choice",
  "hard:pluto:sun": "a distinct limit within a long-standing commitment or negotiation",
  "hard:neptune:sun": "distinguishing a stated description from an unclear expectation",
  "hard:venus:venus": "the difference between a familiar choice and what remains appealing",
  "soft:venus:venus": "recognizing a small preference in an ordinary choice",
  "hard:mercury:mercury": "the gap between knowing a point and deciding how to word it",
  "soft:mercury:mercury": "giving an idea a workable outline, sentence or example",
  "hard:moon:moon": "comparing one ordinary moment with company, quiet or unplanned space",
  "hard:sun:sun": "an annual calendar reference for an ordinary priority to carry forward",
};

/** Complete proposals, not automatic approval and not human editorial sign-off. */
export function synthesisSourceFocus(key: string) {
  return (
    SYNTHESIS_SOURCE_FOCUS[key] ??
    SYNTHESIS_SOURCE_FOCUS[
      SYNTHESIS_EXACT_ADDITIONS.find((item) => item.key === key)?.source ?? ""
    ] ??
    null
  );
}
const DIRECTED_REASONS: Record<string, [string, string]> = {
  "square:saturn:sun|trine:jupiter:sun": [
    "Role capacity and responsibility boundaries are the primary concern; another option supplies a possible addition whose demands can be compared with that capacity.",
    "Exploring another option is primary; the role passage supplies responsibility boundaries against which its additional demands can be considered.",
  ],
  "trine:saturn:sun|trine:jupiter:sun": [
    "Sustaining a commitment at an ordinary pace supplies a reference for considering one more option alongside an existing plan.",
    "An additional option remains primary; dependable repeated effort supplies a possible place for it within a commitment worth sustaining.",
  ],
  "trine:jupiter:mars|trine:jupiter:sun": [
    "Initiative toward a well-chosen aim supplies a purpose through which another option could be explored.",
    "Exploring an option supplies the primary possibility; initiative toward a well-chosen aim can give that exploration a practical focus.",
  ],
  "square:saturn:moon|conjunction:moon:moon": [
    "An obligation occupying preferred uninterrupted space gives the primary demand; a comparison with an ordinary rhythm supplies a possible quiet moment in which to consider it.",
    "An ordinary rhythm comparison is primary; if an obligation occupies that moment, its demand on uninterrupted space supplies a concrete focus.",
  ],
  "square:saturn:sun|square:saturn:moon": [
    "A responsibility's demands on capacity are primary; the other responsibility passage adds the uninterrupted space a small obligation may occupy.",
    "The space occupied by a small obligation is primary; if it belongs to the established role, that role's capacity boundary supplies a second view of its demands.",
  ],
  "trine:jupiter:mars|square:mars:sun": [
    "The well-chosen aim gives the primary reason for initiative; a task's workable pace supplies a possible competing demand, with the shared task explicitly conditional.",
    "A task's pace is primary; if the same effort serves a well-chosen aim, the appeal of beginning can be considered alongside the time the task needs.",
  ],
  "conjunction:mercury:mercury|square:mars:sun": [
    "Articulating the point is primary; the pace passage explicitly supplies a reply composed before its point is clear.",
    "Acting before a reply's point is clear is primary; curiosity about phrasing supplies a way to consider meaning alongside pace.",
  ],
  "trine:saturn:sun|square:saturn:moon": [
    "An effort worth repeating in a commitment is primary; an obligation occupying preferred uninterrupted space supplies a possible limit on its sustainable pace.",
    "An obligation's demand on uninterrupted space is primary; a dependable commitment supplies an arrangement within which that demand could be considered.",
  ],
  "trine:jupiter:sun|square:saturn:moon": [
    "Exploring another option is primary; if an obligation occupies attention, its demand on uninterrupted space supplies a possible constraint on that option.",
    "Room around an obligation is primary; the additional-option passage supplies a possibility whose demands can be considered before expanding the plan.",
  ],
  "trine:mars:sun|conjunction:mercury:mercury": [
    "Direct effort expressing an intention is primary; articulating the meaning supplies a possible clear account of that same intention.",
    "Articulating an idea is primary; direct effort can be considered as an action that expresses its purpose, without asserting an external outcome.",
  ],
  "trine:mars:sun|trine:jupiter:sun": [
    "Engaging with one part of a task is primary; an additional option supplies a possibility that could be described through a practical action.",
    "Exploring an option is primary; direct effort supplies a way to consider the action it would involve.",
  ],
  "square:saturn:sun|square:mars:sun": [
    "Capacity and responsibility boundaries are primary; a proposed response's workable pace supplies a possible competing demand on that capacity.",
    "The wish to act ahead of a task's pace is primary; responsibility boundaries supply a way to consider the capacity that action would require.",
  ],
};
export function proposeSynthesisDecisions(bundle: ContentBundle): SynthesisMatrixRow[] {
  const matrix = synthesisCatalogueMatrix(bundle);
  return matrix.rows.map((row) => {
    if (row.status === "impossible") return { ...row, reviewed: false };
    const primary = synthesisSourceFocus(row.primaryKey),
      supporting = synthesisSourceFocus(row.supportingKey);
    if (!primary || !supporting)
      throw Error("Every concrete source needs an authored focus summary before pair review.");
    const origin = row.ruleKey ? SYNTHESIS_RULE_ORIGINS[row.ruleKey] : null;
    const pair = SYNTHESIS_ADDITIONAL_PAIRS.find(
      (pair) =>
        (pair.a === row.primaryKey && pair.b === row.supportingKey) ||
        (pair.b === row.primaryKey && pair.a === row.supportingKey) ||
        origin === `${pair.a}_${pair.relationship}_${pair.b}` ||
        origin === `${pair.b}_${pair.relationship}_${pair.a}`,
    );
    if (row.status === "tension" || row.status === "reinforcement")
      return {
        ...row,
        reason: `Primary: ${primary}. Supporting: ${supporting}. ${pair ? DIRECTED_REASONS[`${pair.a}|${pair.b}`]![origin === `${pair.b}_${pair.relationship}_${pair.a}` || row.primaryKey === pair.b ? 1 : 0] : row.primaryKey === "square:saturn:sun" ? "Role boundaries supply the primary capacity constraint; initiative toward a larger piece of work supplies the possible additional scope." : row.primaryKey === "trine:jupiter:mars" ? "Initiative toward a larger piece of work is primary; an established role supplies capacity boundaries for that scope." : row.primaryKey === "trine:saturn:sun" ? "Repeated effort in a commitment is primary; direct action supplies a possible practical expression of that same commitment." : "Direct action is primary; a commitment worth sustaining supplies a possible dependable pace for that effort."}`,
        reviewed: false,
      };
    return {
      ...row,
      status: row.status === "independent" ? "independent" : "pending",
      reason: `Primary ${row.primaryKey}: ${primary}. Supporting ${row.supportingKey}: ${supporting}. ${row.status === "independent" ? "The preference comparison does not identify the unspecified communication topic as a social disagreement; the communication passage does not identify its topic as a preference. Each focus remains separate." : "No source-based editorial decision is approved for this direction. The editor must review both full passages rather than infer a relationship from their labels."}`,
      reviewed: false,
    };
  });
}
