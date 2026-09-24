/**
 * Fact blocks for the language layer.
 *
 * The AI pass never sees birth details, notes, or any raw user text. It sees
 * only the atoms built here: already-calculated positions, aspects, orbs,
 * phases and dates, plus the permitted framing flags. Each atom carries a
 * stable id so generated prose can be checked claim-by-claim against what was
 * actually injected — anything citing an id that is not in this list is
 * discarded rather than shown.
 */

export interface FactAtom {
  id: string;
  statement: string;
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

export interface FramingFactInput {
  localBucket?: string | null;
  sleep?: number | null;
  stress?: number | null;
  mood?: number | null;
  energy?: number | null;
}

/** Facts for a daily reading: cycles first, then calculation caveats. */
export function readingFacts(
  chart: ChartFactInput,
  cycles: CycleFactInput[],
  framing: FramingFactInput = {},
): FactAtom[] {
  const facts: FactAtom[] = [];

  cycles.forEach((c, i) => {
    const parts = [
      `transiting ${c.transit_body} ${c.aspect} natal ${c.natal_point}`,
      `orb ${c.orb.toFixed(2)} degrees`,
      `phase ${c.phase}`,
      `domain ${c.domain}`,
      c.exact_at ? `exact on ${c.exact_at.slice(0, 10)}` : "no exact date inside the window",
    ];
    facts.push({ id: `C${i + 1}`, statement: parts.join(", ") });
  });

  facts.push({
    id: "E1",
    statement: `positions computed by ${chart.engine} ${chart.engineVersion} at ${chart.precision} precision, ${chart.houseSystem} houses`,
  });
  facts.push({
    id: "U1",
    statement: `recorded birth-time accuracy is "${chart.uncertainty.accuracy}" (about plus or minus ${chart.uncertainty.minutes} minutes, roughly ${chart.uncertainty.ascendantSpreadDeg.toFixed(2)} degrees of Ascendant spread)`,
  });
  if (chart.uncertainty.angleClaimsSuppressed) {
    facts.push({
      id: "U2",
      statement:
        "birth time is too uncertain to use, so every claim depending on the Ascendant or on house placement has been left out of the calculation",
    });
  } else if (!chart.uncertainty.housesReliable) {
    facts.push({
      id: "U2",
      statement:
        "house and angle claims are weighted down because of birth-time uncertainty, and are not stated as firm",
    });
  }

  if (framing.localBucket) {
    facts.push({
      id: "F1",
      statement: `the reader's local time of day is ${framing.localBucket} (framing only, consented)`,
    });
  }
  if (framing.mood !== null && framing.mood !== undefined) {
    facts.push({
      id: "F2",
      statement: `the reader self-reported mood ${framing.mood} of 5 today (framing only, never a claim)`,
    });
  }
  if (framing.energy !== null && framing.energy !== undefined) {
    facts.push({
      id: "F3",
      statement: `the reader self-reported energy ${framing.energy} of 5 today (framing only, never a claim)`,
    });
  }
  if (framing.sleep !== null && framing.sleep !== undefined) {
    facts.push({
      id: "F4",
      statement: `the reader self-reported sleep quality ${framing.sleep} of 5 today (framing and reflection prompt only, never diagnostic, never part of the calculation)`,
    });
  }
  if (framing.stress !== null && framing.stress !== undefined) {
    facts.push({
      id: "F5",
      statement: `the reader self-reported stress load ${framing.stress} of 5 today (framing and reflection prompt only, never diagnostic, never part of the calculation)`,
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

/** Facts for one natal chapter: the structure's own payload, flattened. */
export function featureFacts(
  feature: FeatureFactInput,
  chart: ChartFactInput,
  related: Pick<FeatureFactInput, "family" | "title" | "strength">[] = [],
): FactAtom[] {
  const facts: FactAtom[] = [
    {
      id: "N1",
      statement: `detected natal structure "${feature.title}" of family ${feature.family} (key ${feature.feature_key}), strength ${Number(feature.strength).toFixed(2)}`,
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
      statement: `another detected structure in the same chart: "${r.title}" (family ${r.family}), strength ${Number(r.strength).toFixed(2)}`,
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
