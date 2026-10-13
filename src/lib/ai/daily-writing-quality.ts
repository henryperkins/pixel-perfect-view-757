import { completeDailySentences, type DailyWritingPlan } from "../content/daily-writing";
import type { DailyVoiceExample } from "./daily-voice";

export const DAILY_WRITING_QUALITY_VERSION = "daily-writing-quality-1" as const;
export const DAILY_WRITING_ISSUE_CODES = [
  "scene_reference",
  "scene_missing",
  "scene_parent",
  "scene_assertion",
  "scene_unverified",
  "scene_unavailable",
  "sentence_duplicate",
  "phrase_repeat",
  "stock_abstraction",
  "example_copy",
  "recent_opening_repeat",
  "recent_sentence_repeat",
] as const;
export type DailyWritingIssueCode = (typeof DAILY_WRITING_ISSUE_CODES)[number];
export interface DailyWritingIssue {
  code: DailyWritingIssueCode;
  severity: "info" | "warning" | "reject";
  paragraph: number | null;
  ruleId: string | null;
}
export interface DailyWritingQualityReport {
  version: typeof DAILY_WRITING_QUALITY_VERSION;
  outcome: "pass" | "warning" | "reject" | "not_evaluated";
  issues: DailyWritingIssue[];
}
export interface DailyWritingParagraph {
  text: string;
  facts: string[];
  scenes: string[];
}
export type DailyWritingRenderMode = "framed" | "unframed" | "quiet" | "minimal";
export interface RecentDailyBody {
  day: string;
  paragraphs: string[];
  requiredLiteralSentences: string[];
}
export interface RecentDailyWritingHistory {
  bodies: RecentDailyBody[];
  availability: {
    status: "available" | "partial" | "unavailable";
    inspected: number;
    retainedDays: number;
    omissions: { reason: "legacy" | "invalid" | "timezone" | "candidate_limit"; count: number }[];
  };
}
export const writingNotEvaluated = (): DailyWritingQualityReport => ({
  version: DAILY_WRITING_QUALITY_VERSION,
  outcome: "not_evaluated",
  issues: [],
});
/** Telemetry revival is an allowlist; no matched text, scene copy or private variants survive. */
export function readDailyWritingQualityReport(value: unknown): DailyWritingQualityReport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as DailyWritingQualityReport;
  if (
    raw.version !== DAILY_WRITING_QUALITY_VERSION ||
    !["pass", "warning", "reject", "not_evaluated"].includes(raw.outcome) ||
    !Array.isArray(raw.issues) ||
    raw.issues.length > 20 ||
    raw.issues.some(
      (issue) =>
        !issue ||
        !DAILY_WRITING_ISSUE_CODES.includes(issue.code) ||
        !["info", "warning", "reject"].includes(issue.severity) ||
        (issue.paragraph !== null &&
          (!Number.isSafeInteger(issue.paragraph) || issue.paragraph < 1 || issue.paragraph > 4)),
    )
  )
    return null;
  const expected = raw.issues.some((issue) => issue.severity === "reject")
    ? "reject"
    : raw.issues.some((issue) => issue.severity === "warning")
      ? "warning"
      : "pass";
  if (raw.outcome === "not_evaluated" ? raw.issues.length !== 0 : raw.outcome !== expected)
    return null;
  return {
    version: DAILY_WRITING_QUALITY_VERSION,
    outcome: raw.outcome,
    issues: raw.issues.map(({ code, severity, paragraph }) => ({
      code,
      severity,
      paragraph,
      ruleId: null,
    })),
  };
}
export function normalizedDailyText(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const tokens = (text: string) => normalizedDailyText(text).split(" ").filter(Boolean);
const STOCK = [
  "trust the process",
  "embrace the journey",
  "step into your power",
  "align with your authentic self",
  "everything happens for a reason",
  "navigate these energies",
  "lean into this transformation",
];

function assertedPersonalEvent(sentence: string) {
  // A qualification in another comma-delimited clause cannot authorize a past
  // event. This is deliberately a small observable check, not semantic proof.
  return sentence.split(/[,;]|\b(?:but|and then)\b/i).some((clause) => {
    const match =
      /\byou\s+(?:ignored|accepted|missed|avoided|sent|wrote|cancelled|canceled|declined|agreed|finished|forgot|rejected|attended)\b/i.exec(
        clause,
      );
    if (!match || !/\b(?:this morning|yesterday|earlier today)\b/i.test(clause)) return false;
    return !/\b(?:if|when|unless|suppose|perhaps|maybe)\b/i.test(clause.slice(0, match.index));
  });
}

/** Code-only local observations after safety/reference validation. Never rewrites or calls a model. */
export function checkDailyWritingQuality(input: {
  paragraphs: DailyWritingParagraph[];
  plan: DailyWritingPlan;
  renderMode: DailyWritingRenderMode;
  recent: RecentDailyBody[];
  requiredLiteralSentences: string[];
  sourceTexts: string[];
  example: DailyVoiceExample | null;
}): DailyWritingQualityReport {
  if (
    input.sourceTexts.length > 32 ||
    input.sourceTexts.some((text) => typeof text !== "string" || text.length > 2000)
  )
    throw Error("Writing quality source text bounds exceeded.");
  if (input.recent.length > 3) throw Error("Writing quality history bounds exceeded.");
  const issues: DailyWritingIssue[] = [];
  let rejected = false,
    warned = false;
  const issue = (
    code: DailyWritingIssueCode,
    severity: DailyWritingIssue["severity"],
    paragraph: number | null,
    ruleId: string,
  ) => {
    rejected ||= severity === "reject";
    warned ||= severity === "warning";
    if (
      issues.length < 20 &&
      !issues.some(
        (item) => item.code === code && item.paragraph === paragraph && item.ruleId === ruleId,
      )
    )
      issues.push({ code, severity, paragraph, ruleId });
    else if (severity === "reject" && !issues.some((item) => item.severity === "reject"))
      issues[issues.length - 1] = { code, severity, paragraph, ruleId };
  };
  const scenes = new Map(input.plan.scenes.map((scene) => [scene.id as string, scene]));
  const used = new Set<string>();
  const sentences: { text: string; normalized: string; words: string[]; paragraph: number }[] = [];
  for (const [index, paragraph] of input.paragraphs.entries()) {
    const position = index + 1;
    if (
      !Array.isArray(paragraph.scenes) ||
      paragraph.scenes.length > 2 ||
      new Set(paragraph.scenes).size !== paragraph.scenes.length
    )
      issue("scene_reference", "reject", position, "scene_ids");
    for (const id of Array.isArray(paragraph.scenes) ? paragraph.scenes : []) {
      const scene = scenes.get(id);
      if (input.renderMode !== "framed" || !scene || used.has(id)) {
        issue("scene_reference", "reject", position, "scene_ids");
        continue;
      }
      used.add(id);
      if (input.plan.theme?.requiredFacts.some((fact) => !paragraph.facts.includes(fact)))
        issue("scene_parent", "reject", position, "scene_parents");
      const normalized = ` ${normalizedDailyText(paragraph.text)} `;
      const match = (cues: string[]) =>
        cues.some((cue) => normalized.includes(` ${normalizedDailyText(cue)} `));
      if (!match(scene.cues.objects) || !match(scene.cues.actions))
        issue("scene_unverified", "warning", position, "scene_cues");
      if (completeDailySentences(paragraph.text).some(assertedPersonalEvent))
        issue("scene_assertion", "reject", position, "past_event_clause");
    }
    const normalized = ` ${normalizedDailyText(paragraph.text)} `;
    if (STOCK.some((phrase) => normalized.includes(` ${phrase} `)))
      issue("stock_abstraction", "warning", position, "stock_phrases");
    for (const text of completeDailySentences(paragraph.text))
      sentences.push({
        text,
        normalized: normalizedDailyText(text),
        words: tokens(text),
        paragraph: position,
      });
  }
  if (input.renderMode === "framed") {
    if (!used.size) issue("scene_missing", "reject", null, "scene_required");
  } else {
    issue(
      "scene_unavailable",
      input.renderMode === "minimal" ? "warning" : "info",
      null,
      input.renderMode === "minimal" ? "template_editorial_failure" : "no_scene",
    );
  }
  const observed = new Set<string>();
  const sourceSentences = new Set(
    input.sourceTexts.flatMap(completeDailySentences).map(normalizedDailyText),
  );
  const demonstration = new Set(
    (input.example?.paragraphs ?? [])
      .flatMap((p) => completeDailySentences(p.text))
      .filter((text) => tokens(text).length >= 10)
      .map(normalizedDailyText),
  );
  for (const sentence of sentences) {
    if (sentence.words.length >= 8 && observed.has(sentence.normalized))
      issue("sentence_duplicate", "reject", sentence.paragraph, "exact_sentence");
    observed.add(sentence.normalized);
    if (demonstration.has(sentence.normalized) && !sourceSentences.has(sentence.normalized))
      issue("example_copy", "reject", sentence.paragraph, "demonstration_sentence");
  }
  const phrases = new Map<string, { sentence: number; word: number; paragraph: number }[]>();
  for (const [index, sentence] of sentences.entries()) {
    for (let word = 0; word + 6 <= sentence.words.length; word++) {
      const phrase = sentence.words.slice(word, word + 6).join(" ");
      const uses = phrases.get(phrase) ?? [];
      const previous = uses.filter((item) => item.sentence === index).at(-1);
      if (!previous || word >= previous.word + 6)
        uses.push({ sentence: index, word, paragraph: sentence.paragraph });
      phrases.set(phrase, uses);
    }
  }
  for (const uses of phrases.values())
    if (uses.length >= 3 && new Set(uses.map((item) => item.sentence)).size >= 2)
      for (const position of new Set(uses.map((item) => item.paragraph)))
        issue("phrase_repeat", "warning", position, "six_word_repeat");

  const required = new Set(input.requiredLiteralSentences.map(normalizedDailyText));
  const current = sentences.filter((sentence) => !required.has(sentence.normalized));
  for (const recent of input.recent) {
    const oldRequired = new Set(recent.requiredLiteralSentences.map(normalizedDailyText));
    const old = recent.paragraphs
      .flatMap(completeDailySentences)
      .map((text) => ({ normalized: normalizedDailyText(text), words: tokens(text) }))
      .filter((sentence) => !oldRequired.has(sentence.normalized));
    if (
      current[0] &&
      old[0] &&
      current[0].words.length >= 8 &&
      old[0].words.length >= 8 &&
      current[0].words.slice(0, 8).join(" ") === old[0].words.slice(0, 8).join(" ")
    )
      issue("recent_opening_repeat", "warning", current[0].paragraph, "recent_opening");
    const oldSentences = new Set(
      old.filter((sentence) => sentence.words.length >= 12).map((sentence) => sentence.normalized),
    );
    for (const sentence of current)
      if (sentence.words.length >= 12 && oldSentences.has(sentence.normalized))
        issue("recent_sentence_repeat", "warning", sentence.paragraph, "recent_sentence");
  }
  return {
    version: DAILY_WRITING_QUALITY_VERSION,
    outcome: rejected ? "reject" : warned ? "warning" : "pass",
    issues,
  };
}
