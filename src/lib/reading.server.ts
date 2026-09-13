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

/**
 * Cycle arc position, in plain language: how many days to the exact pass and
 * how far through the ingress -> egress window today sits.
 */
function arcParagraph(c: CycleInstance): string {
  const phrase = exactPhrase(c.days_to_exact ?? null);
  const pct =
    c.arc_position === null || c.arc_position === undefined
      ? null
      : Math.round(c.arc_position * 100);
  const where =
    pct === null
      ? "The full length of this window extends past the range that was scanned, so treat its edges as open."
      : pct <= 25
        ? `You are about ${pct}% of the way through this window \u2014 near the start, where it is still mostly potential.`
        : pct <= 60
          ? `You are about ${pct}% of the way through this window \u2014 the middle, where it is most legible.`
          : `You are about ${pct}% of the way through this window \u2014 the back half, where it is winding down.`;
  return `Timing: ${phrase}. ${where}`;
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

  const ranked = cycles.filter((c) => c.importance > 0.02);
  const primary = ranked[0] ?? null;
  const supporting = ranked.slice(1, 3);

  const paragraphs: string[] = [];
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
    paragraphs.push(TONE_OPENER[ctx.tone] ?? "");
    paragraphs.push(interp.mechanism);

    // Domain-specific framing: the same aspect reads differently depending on
    // which part of the chart it lands on, so the prose changes with domain.
    const dom = bundle.domains?.[primary.domain];
    if (dom) {
      paragraphs.push(aspectFamily(primary.aspect) === "soft" ? dom.soft : dom.hard);
      prompt = `${prompt} ${dom.prompt}`;
      record(provenance, ctx, "content", "AST-05", "provenance", `Domain framing ${primary.domain}`, {
        domain: primary.domain,
        label: dom.label,
        family: aspectFamily(primary.aspect),
      });
    }

    paragraphs.push(bundle.phases[primary.phase] ?? "");

    // Where in the arc we are, in days rather than jargon.
    paragraphs.push(arcParagraph(primary));

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

    confidence =
      primary.importance > 0.35 ? "high" : primary.importance > 0.12 ? "medium" : "low";
  }

  if (supporting.length) {
    paragraphs.push(
      `Also in range: ${supporting
        .map(
          (s) =>
            `${s.label} (orb ${s.orb}\u00b0, ${s.phase}, ${exactPhrase(s.days_to_exact ?? null)}, ${bundle.domains?.[s.domain]?.label ?? s.domain})`,
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
    paragraphs.push(
      "Your birth time is recorded as uncertain, so anything that depends on the Ascendant or house placements has been left out of this reading rather than guessed at.",
    );
  } else if (!chart.uncertainty.housesReliable) {
    paragraphs.push(
      `Your birth time carries about \u00b1${chart.uncertainty.minutes} minutes of uncertainty, which is roughly ${chart.uncertainty.ascendantSpreadDeg}\u00b0 of Ascendant spread. Angle-based claims below are weighted down accordingly.`,
    );
  }

  if (ctx.localBucket && isPermitted("AMB-02", "framing", ctx.granted)) {
    record(provenance, ctx, "context", "AMB-02", "framing", "Local time of day", {
      bucket: ctx.localBucket,
    });
  }

  if (ctx.checkIn && isPermitted("USR-04", "framing", ctx.granted)) {
    const { mood, energy } = ctx.checkIn;
    paragraphs.push(
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
    const sleepOk =
      sleep !== null && isPermitted("WEL-01", "framing", ctx.granted);
    const stressOk =
      stress !== null && isPermitted("WEL-03", "framing", ctx.granted);

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
      paragraphs.push(
        `You reported ${bands.join(" and ")} today. That sits beside the reading as context you chose to record \u2014 it is not a diagnosis, it does not change a single degree of the calculation, and it is deleted after 180 days.`,
      );
    }

    // Reflection prompt is allowed to adapt to a band (WEL reflection_prompt).
    if (
      stressOk &&
      stress >= 4 &&
      isPermitted("WEL-03", "reflection_prompt", ctx.granted)
    ) {
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
    } else if (
      sleepOk &&
      sleep <= 2 &&
      isPermitted("WEL-01", "reflection_prompt", ctx.granted)
    ) {
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
      tone: ctx.tone,
    });
  }

  const raw = paragraphs.filter(Boolean).join("\n\n");
  const safe = safetyPass(raw);
  const safePrompt = safetyPass(prompt);

  return {
    headline,
    body: safe.text,
    prompt: safePrompt.text,
    confidence,
    primary_cycle_key: primary?.cycle_key ?? null,
    provenance,
    release_version: bundle.version,
    flagged: [...safe.flagged, ...safePrompt.flagged],
  };
}
