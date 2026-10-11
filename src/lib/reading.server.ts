import type { Chart } from "./astro/chart";
import type { CycleInstance } from "./astro/cycles";
import {
  aspectFamily,
  DEFAULT_BUNDLE,
  findInterpretation,
  safetyPass,
  type ContentBundle,
} from "./content/default-bundle";
import { exactPhrase } from "./astro/cycles";
import { resolveInterpretationPlan, type DailyInterpretationPlan } from "./content/synthesis";

/**
 * Cycle arc position, in plain language: how many days to the exact pass and
 * how far through the ingress -> egress window today sits.
 */
function arcParagraph(c: CycleInstance, technical: boolean): string {
  const phrase = exactPhrase(c.days_to_exact ?? null);
  const pct =
    c.arc_position === null || c.arc_position === undefined
      ? null
      : Math.round(c.arc_position * 100);
  const where =
    pct === null
      ? "The scanned range does not contain both edges of the calculated window."
      : pct <= 25
        ? "This reading falls near the start of the calculated window."
        : pct <= 60
          ? "This reading falls in the middle part of the calculated window."
          : "This reading falls in the later part of the calculated window.";
  return `Timing: ${phrase}. ${where}${technical ? `${pct !== null ? ` The calculated arc position is ${pct}%.` : ""} Current orb at the reading's calculation time: ${c.orb}\u00b0.` : ""}`;
}
import { assertUse, isPermitted, type AllowedUse } from "./registry";

export interface ReadingContext {
  granted: Set<string>;
  tone: string;
  depth: string;
  localBucket: "morning" | "afternoon" | "evening" | null;
  checkIn: { mood: number | null; energy: number | null } | null;
  /**
   * Tier 3 self-reported wellbeing bands (WEL-01 sleep, WEL-03 stress).
   * Present only when the person has consented to those sources; used for
   * framing and reflection prompts, never for the calculation.
   */
  wellness: { sleep: number | null; stress: number | null } | null;
}

export interface ProvenanceEntry {
  lane: "calculation" | "cycle" | "content" | "context" | "reflection";
  source_id: string;
  label: string;
  detail: Record<string, string | number | boolean | null>;
}

export interface AssembledReading {
  headline: string;
  body: string;
  prompt: string;
  confidence: "low" | "medium" | "high";
  primary_cycle_key: string | null;
  provenance: ProvenanceEntry[];
  release_version: string;
  flagged: string[];
  /** The same eligible contacts feed the template and the language layer. */
  eligibleCycles: CycleInstance[];
  interpretationPlan: DailyInterpretationPlan;
  astroBody: string;
  /** Deterministic caveats and consented context are never sent to the gateway. */
  contextBody: string;
  editorial: {
    interpretation: { key: string; mechanism: string };
    domain: { key: string; label: string; text: string } | null;
    phase: { key: string; text: string };
    timing: string;
  } | null;
}

export function normalizeTone(value: string): "plain" | "warm" | "clinical" {
  return value === "warm" || value === "clinical" ? value : "plain";
}

export function normalizeDepth(value: string): "standard" | "technical" {
  return value === "technical" ? "technical" : "standard";
}

/** Defence at the reading boundary, including stale or externally supplied cycles. */
function eligibleReadingCycles(chart: Chart, cycles: CycleInstance[]): CycleInstance[] {
  return cycles
    .filter((cycle) => {
      if (!Number.isFinite(cycle.importance) || cycle.importance <= 0.02) return false;
      const angle =
        chart.points?.[cycle.natal_point]?.angleDependent ||
        /^(ascendant|descendant|midheaven|imum_coeli|asc|mc|ic)$/i.test(cycle.natal_point);
      if (angle && chart.uncertainty.angleClaimsSuppressed) return false;
      if (!chart.uncertainty.housesReliable && /^house[_ -]?\d+$/i.test(cycle.natal_point))
        return false;
      return true;
    })
    .sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return a.cycle_key.localeCompare(b.cycle_key);
    })
    .slice(0, 3);
}

function record(
  out: ProvenanceEntry[],
  ctx: ReadingContext,
  lane: ProvenanceEntry["lane"],
  sourceId: string,
  use: AllowedUse,
  label: string,
  detail: Record<string, string | number | boolean | null> = {},
): boolean {
  if (!isPermitted(sourceId, use, ctx.granted)) return false;
  assertUse(sourceId, use);
  out.push({ lane, source_id: sourceId, label, detail });
  return true;
}

const TONE_OPENER: Record<string, string> = {
  plain: "",
  warm: "Taking this gently: ",
  clinical: "Observation: ",
};

export function assembleReading(
  chart: Chart,
  cycles: CycleInstance[],
  ctx: ReadingContext,
  bundle: ContentBundle = DEFAULT_BUNDLE,
): AssembledReading {
  const provenance: ProvenanceEntry[] = [];

  record(provenance, ctx, "calculation", "AST-05", "calculation", "Planetary ephemeris", {
    engine: chart.engine,
    version: chart.engineVersion,
  });
  record(provenance, ctx, "calculation", "AST-07", "calculation", "Angles and houses", {
    system: chart.houseSystem,
  });
  record(provenance, ctx, "calculation", "AST-20", "framing", "Birth-time uncertainty", {
    accuracy: chart.uncertainty.accuracy,
    ascendantSpreadDeg: chart.uncertainty.ascendantSpreadDeg,
  });

  const ranked = eligibleReadingCycles(chart, cycles);
  const interpretationPlan = resolveInterpretationPlan(bundle, ranked);
  const primary = ranked[0] ?? null;
  const supporting = ranked.slice(1, 3);

  const paragraphs: string[] = [];
  const contextParagraphs: string[] = [];
  const tone = isPermitted("USR-01", "framing", ctx.granted) ? normalizeTone(ctx.tone) : "plain";
  const technical =
    isPermitted("USR-02", "framing", ctx.granted) && normalizeDepth(ctx.depth) === "technical";
  let editorial: AssembledReading["editorial"] = null;
  let headline = "A quiet day in the pattern";
  let prompt =
    "Nothing is close enough to name today. What would you notice if nothing were pointing at it?";
  let confidence: AssembledReading["confidence"] = "low";

  if (primary) {
    const interp = findInterpretation(
      bundle,
      primary.aspect,
      primary.transit_body,
      primary.natal_point,
    );
    headline = primary.label;
    prompt = interp.question;
    paragraphs.push(`${TONE_OPENER[tone]}${interp.mechanism}`);

    if (interpretationPlan.synthesis) {
      paragraphs.push(interpretationPlan.synthesis.mechanism);
      record(
        provenance,
        ctx,
        "content",
        "AST-05",
        "provenance",
        `Synthesis ${interpretationPlan.synthesis.ruleKey}`,
        {
          rule: interpretationPlan.synthesis.ruleKey,
          relationship: interpretationPlan.synthesis.relationship,
          bundle: bundle.version,
        },
      );
      const c2Interp = interpretationPlan.interpretations.find((item) => item.index === 2);
      if (c2Interp) {
        record(
          provenance,
          ctx,
          "content",
          "AST-05",
          "provenance",
          `Interpretation ${c2Interp.interpretationKey}`,
          {
            bundle: bundle.version,
          },
        );
      }
    }

    // Domain-specific framing: the same aspect reads differently depending on
    // which part of the chart it lands on, so the prose changes with domain.
    const dom = bundle.domains?.[primary.domain];
    const domainText = dom ? (aspectFamily(primary.aspect) === "soft" ? dom.soft : dom.hard) : null;
    if (dom && domainText) {
      paragraphs.push(domainText);
      prompt = `${prompt} ${dom.prompt}`;
      record(
        provenance,
        ctx,
        "content",
        "AST-05",
        "provenance",
        `Domain framing ${primary.domain}`,
        {
          domain: primary.domain,
          label: dom.label,
          family: aspectFamily(primary.aspect),
        },
      );
    }

    const phaseText = bundle.phases[primary.phase] ?? "";
    paragraphs.push(phaseText);

    // Where in the arc we are, in days rather than jargon.
    const timing = arcParagraph(primary, technical);
    paragraphs.push(timing);
    editorial = {
      interpretation: { key: interp.key, mechanism: interp.mechanism },
      domain:
        dom && domainText ? { key: primary.domain, label: dom.label, text: domainText } : null,
      phase: { key: primary.phase, text: phaseText },
      timing,
    };

    record(provenance, ctx, "cycle", "AST-08", "timing", primary.label, {
      orb: primary.orb,
      phase: primary.phase,
      ingress_at: primary.ingress_at,
      exact_at: primary.exact_at,
      days_to_exact: primary.days_to_exact ?? null,
      arc_position: primary.arc_position ?? null,
      domain: primary.domain,
      egress_at: primary.egress_at,
      importance: primary.importance,
    });
    record(provenance, ctx, "content", "AST-05", "provenance", `Interpretation ${interp.key}`, {
      bundle: bundle.version,
    });

    confidence = primary.importance > 0.35 ? "high" : primary.importance > 0.12 ? "medium" : "low";
  } else {
    paragraphs.push(
      "No cycle is strong enough to name in this reading today. This is a quiet day in the pattern, with no chart signal singled out.",
    );
  }

  if (supporting.length) {
    paragraphs.push(
      `Also in range: ${supporting
        .map((s) =>
          technical
            ? `${s.label} (orb ${s.orb}\u00b0, ${s.phase}, ${exactPhrase(s.days_to_exact ?? null)}, ${bundle.domains?.[s.domain]?.label ?? s.domain})`
            : `${s.label} (${exactPhrase(s.days_to_exact ?? null)})`,
        )
        .join("; ")}.`,
    );
    for (const s of supporting) {
      record(provenance, ctx, "cycle", "AST-08", "timing", s.label, {
        orb: s.orb,
        phase: s.phase,
      });
    }
  }

  if (chart.uncertainty.angleClaimsSuppressed) {
    contextParagraphs.push(
      "Your birth time is recorded as uncertain, so anything that depends on the Ascendant or house placements has been left out of this reading rather than guessed at.",
    );
  } else if (!chart.uncertainty.housesReliable) {
    contextParagraphs.push(
      `Your birth time carries about \u00b1${chart.uncertainty.minutes} minutes of uncertainty, which is roughly ${chart.uncertainty.ascendantSpreadDeg}\u00b0 of Ascendant spread. Angle-based claims below are weighted down accordingly.`,
    );
  }

  if (ctx.localBucket && isPermitted("AMB-02", "framing", ctx.granted)) {
    contextParagraphs.push(
      `Your local time of day is ${ctx.localBucket}. This is framing for when you read, and does not change the calculation.`,
    );
    record(provenance, ctx, "context", "AMB-02", "framing", "Local time of day", {
      bucket: ctx.localBucket,
    });
  }

  if (ctx.checkIn && isPermitted("USR-04", "framing", ctx.granted)) {
    const { mood, energy } = ctx.checkIn;
    contextParagraphs.push(
      `You logged mood ${mood ?? "\u2013"}/5 and energy ${energy ?? "\u2013"}/5 today. That is placed next to the reading, not folded into it \u2014 the calculation does not change based on how you feel.`,
    );
    record(provenance, ctx, "reflection", "USR-04", "framing", "Your daily check-in", {
      mood,
      energy,
    });
  }

  // Tier 3 — sensitive wellness. Framing and prompt only, per WEL-01/WEL-03
  // allowed_uses. Never diagnostic, never fed into the calculation or ranking.
  if (ctx.wellness) {
    const { sleep, stress } = ctx.wellness;
    const bands: string[] = [];
    const sleepOk = sleep !== null && isPermitted("WEL-01", "framing", ctx.granted);
    const stressOk = stress !== null && isPermitted("WEL-03", "framing", ctx.granted);

    if (sleepOk) {
      bands.push(`sleep ${sleep}/5`);
      record(provenance, ctx, "reflection", "WEL-01", "framing", "Sleep quality (self-reported)", {
        band: sleep,
      });
    }
    if (stressOk) {
      bands.push(`stress ${stress}/5`);
      record(provenance, ctx, "reflection", "WEL-03", "framing", "Stress load (self-reported)", {
        band: stress,
      });
    }

    if (bands.length) {
      contextParagraphs.push(
        `You reported ${bands.join(" and ")} today. This is context you chose to record for reflection; it leaves the chart calculation unchanged and is deleted after 180 days.`,
      );
    }

    // Reflection prompt is allowed to adapt to a band (WEL reflection_prompt).
    if (stressOk && stress >= 4 && isPermitted("WEL-03", "reflection_prompt", ctx.granted)) {
      prompt = `${prompt} And with pressure running high today, which part of that is actually yours to carry right now?`;
      record(
        provenance,
        ctx,
        "reflection",
        "WEL-03",
        "reflection_prompt",
        "Prompt adapted to stress band",
        { band: stress },
      );
    } else if (sleepOk && sleep <= 2 && isPermitted("WEL-01", "reflection_prompt", ctx.granted)) {
      prompt = `${prompt} On thin sleep, notice how much of what you read today is the sky and how much is tiredness.`;
      record(
        provenance,
        ctx,
        "reflection",
        "WEL-01",
        "reflection_prompt",
        "Prompt adapted to sleep band",
        { band: sleep },
      );
    }
  }

  if (isPermitted("USR-01", "framing", ctx.granted)) {
    record(provenance, ctx, "reflection", "USR-01", "framing", "Tone preference", {
      tone,
    });
  }

  const astro = safetyPass(paragraphs.filter(Boolean).join("\n\n"));
  const context = safetyPass(contextParagraphs.filter(Boolean).join("\n\n"));
  const safePrompt = safetyPass(prompt);

  return {
    headline,
    body: [astro.text, context.text].filter(Boolean).join("\n\n"),
    prompt: safePrompt.text,
    confidence,
    primary_cycle_key: primary?.cycle_key ?? null,
    provenance,
    release_version: bundle.version,
    flagged: [...astro.flagged, ...context.flagged, ...safePrompt.flagged],
    eligibleCycles: ranked,
    interpretationPlan,
    astroBody: astro.text,
    contextBody: context.text,
    editorial,
  };
}
