/**
 * Facts supplied to the language layer. Citation validation checks supplied IDs
 * and coverage; it cannot prove semantic support for arbitrary generated prose.
 * Daily facts contain only the selected astronomical plan and curated copy.
 */
import type { AssembledReading } from "../reading.server";
import { localDayString } from "../local-day";

export interface FactAtom {
  id: string;
  statement: string;
  /** Typed references support bounded daily contradiction checks, not a semantic proof. */
  cycle?: {
    transitBody: string;
    natalPoint: string;
    aspect: string;
    orb: number;
    exactDate: string | null;
  };
}

export interface ChartFactInput {
  engine: string;
  engineVersion: string;
  houseSystem: string;
  precision: string;
  uncertainty: {
    accuracy: string;
    minutes: number;
    ascendantSpreadDeg: number;
    housesReliable: boolean;
    angleClaimsSuppressed: boolean;
  };
}

export interface CycleFactInput {
  cycle_key: string;
  transit_body: string;
  natal_point: string;
  aspect: string;
  orb: number;
  phase: string;
  domain: string;
  importance: number;
  exact_at: string | null;
}

/** The model receives exactly the plan used by the template, without local context. */
export function readingFacts(
  chart: ChartFactInput,
  plan: Pick<AssembledReading, "eligibleCycles" | "editorial">,
  timeZone = "UTC",
): FactAtom[] {
  const facts: FactAtom[] = [];
  plan.eligibleCycles.forEach((c, i) => {
    const exactDate = c.exact_at ? localDayString(new Date(c.exact_at), timeZone) : null;
    const parts = [
      `transiting ${c.transit_body} ${c.aspect} natal ${c.natal_point}`,
      `orb ${c.orb.toFixed(2)} degrees`,
      `phase ${c.phase}`,
      `domain ${c.domain}`,
      exactDate ? `exact on ${exactDate}` : "no exact date inside the window",
    ];
    facts.push({
      id: `C${i + 1}`,
      statement: parts.join(", "),
      cycle: {
        transitBody: c.transit_body,
        natalPoint: c.natal_point,
        aspect: c.aspect,
        orb: c.orb,
        exactDate,
      },
    });
  });

  if (plan.editorial) {
    facts.push({
      id: "I1",
      statement: `Published interpretation ${plan.editorial.interpretation.key}: ${plan.editorial.interpretation.mechanism}`,
    });
    if (plan.editorial.domain)
      facts.push({
        id: "D1",
        statement: `Published framing for ${plan.editorial.domain.label}: ${plan.editorial.domain.text}`,
      });
    if (plan.editorial.phase.text)
      facts.push({ id: "P1", statement: `Published phase wording: ${plan.editorial.phase.text}` });
    facts.push({ id: "T1", statement: plan.editorial.timing });
  }
  facts.push({
    id: "E1",
    statement: `positions computed by ${chart.engine} ${chart.engineVersion} at ${chart.precision} precision${chart.uncertainty.housesReliable ? `, ${chart.houseSystem} houses` : ""}`,
  });
  facts.push({
    id: "U1",
    statement: `recorded birth-time accuracy is "${chart.uncertainty.accuracy}" (about plus or minus ${chart.uncertainty.minutes} minutes)`,
  });
  if (chart.uncertainty.angleClaimsSuppressed) {
    facts.push({
      id: "U2",
      statement:
        "All Ascendant and house-placement claims are suppressed. Their caveat will be appended separately; do not draft those claims or repeat the caveat.",
    });
  } else if (!chart.uncertainty.housesReliable) {
    facts.push({
      id: "U2",
      statement:
        "House-placement claims are suppressed and angle claims are weighted down. Their caveat will be appended separately; do not draft house claims or repeat the caveat.",
    });
  }
  return facts;
}

export interface FeatureFactInput {
  feature_key: string;
  family: string;
  title: string;
  strength: number;
  payload: unknown;
}

/** Put the effective bundle's human meaning before the calculation reference sheet. */
export function dailyFactBlock(facts: FactAtom[]): string {
  const primary = facts.filter((fact) => fact.id === "I1");
  const optional = facts.filter((fact) => /^(D1|P1|T1)$/.test(fact.id));
  const reference = facts.filter((fact) => !/^(I1|D1|P1|T1)$/.test(fact.id));
  return [
    "Curated meaning of the strongest cycle (C1):",
    factBlock(primary),
    "Optional framing for that same cycle; cite only what you use:",
    factBlock(optional),
    "Calculated references and limits; use these to check any technical claims:",
    factBlock(reference),
  ].join("\n");
}

/** Facts for one natal chapter: the structure's own payload, flattened. */
export function featureFacts(
  feature: FeatureFactInput,
  chart: ChartFactInput,
  related: Pick<FeatureFactInput, "family" | "title" | "strength">[] = [],
): FactAtom[] {
  const facts: FactAtom[] = [
    {
      id: "N1",
      statement: `detected natal structure "${feature.title}" of family ${feature.family} (key ${feature.feature_key}), ${emphasisOf(feature.strength)}`,
    },
  ];

  const payload = feature.payload;
  if (payload && typeof payload === "object") {
    let i = 0;
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      i += 1;
      if (i > 12) break;
      const rendered =
        value === null || value === undefined
          ? "not present"
          : typeof value === "object"
            ? JSON.stringify(value).slice(0, 300)
            : String(value);
      facts.push({ id: `N${i + 1}`, statement: `${key}: ${rendered}` });
    }
  }

  related.slice(0, 3).forEach((r, i) => {
    facts.push({
      id: `R${i + 1}`,
      statement: `another detected structure in the same chart: "${r.title}" (family ${r.family}), ${emphasisOf(r.strength)}`,
    });
  });

  facts.push({
    id: "E1",
    statement: `positions computed by ${chart.engine} ${chart.engineVersion} at ${chart.precision} precision, ${chart.houseSystem} houses`,
  });
  if (chart.uncertainty.angleClaimsSuppressed) {
    facts.push({
      id: "U2",
      statement:
        "birth time is too uncertain to use, so nothing may be said about the Ascendant or about house placement",
    });
  }

  return facts;
}

export function factBlock(facts: FactAtom[]): string {
  return facts.map((f) => `${f.id}: ${f.statement}`).join("\n");
}

export function factIds(facts: FactAtom[]): Set<string> {
  return new Set(facts.map((f) => f.id));
}

/** App ranking score -> plain words. The score is an internal ordering, not a measurement, so it never reaches prose as a number. */
function emphasisOf(strength: number): string {
  const s = Number(strength);
  if (s >= 0.8)
    return "ranked among the most prominent structures in this chart (an app ranking, not a measurement; never quote it as a number)";
  if (s >= 0.5)
    return "ranked as moderately prominent in this chart (an app ranking, not a measurement; never quote it as a number)";
  return "ranked as a quieter structure in this chart (an app ranking, not a measurement; never quote it as a number)";
}
