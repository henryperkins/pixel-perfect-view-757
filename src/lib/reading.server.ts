import type { Chart } from "./astro/chart";
import type { CycleInstance } from "./astro/cycles";
import {
  DEFAULT_BUNDLE,
  findInterpretation,
  safetyPass,
  type ContentBundle,
} from "./content/default-bundle";
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
    paragraphs.push(bundle.phases[primary.phase] ?? "");

    record(provenance, ctx, "cycle", "AST-08", "timing", primary.label, {
      orb: primary.orb,
      phase: primary.phase,
      ingress_at: primary.ingress_at,
      exact_at: primary.exact_at,
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
      `Also in range: ${supporting.map((s) => `${s.label} (orb ${s.orb}\u00b0, ${s.phase})`).join("; ")}.`,
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
