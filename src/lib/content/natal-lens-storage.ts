import { z } from "zod";
import { NATAL_LENS_PLAN_VERSION, type DailyNatalLensPlan } from "./natal-lens";
import { NATAL_BODY_ROLE, NATAL_PERSONAL_BODIES } from "./natal-lens-types";
import { assertDailyFactGraph, assertNatalLensFact, type FactAtom } from "../ai/facts";
import {
  validateNatalReliability,
  NATAL_RELIABILITY_VERSION,
  type NatalLensEvidence,
} from "../astro/natal-reliability";
import { safetyPass } from "./default-bundle";

export interface SavedNatalLens {
  version: 1;
  plan: DailyNatalLensPlan;
  fact: FactAtom;
  usedParagraphs: number[];
}
const key = z.string().min(1).max(100);
const envelopeSchema = z
  .object({
    version: z.literal(1),
    plan: z
      .object({
        version: z.literal(NATAL_LENS_PLAN_VERSION),
        reliabilityVersion: z.literal(NATAL_RELIABILITY_VERSION),
        releaseVersion: z.string().min(1).max(80),
        status: z.literal("selected"),
        lens: z
          .object({
            ruleKey: key,
            role: z.enum([
              "emotional_reflex",
              "self_direction",
              "expression",
              "preference",
              "initiative",
            ]),
            mechanism: z.string().min(1).max(700),
            anchorCycleKey: key,
            dependsOn: z.tuple([z.literal("C1"), z.literal("I1")]),
            evidenceId: z.literal("NL1"),
            evidence: z.array(z.unknown()).min(1).max(2),
            screen: z
              .object({
                accuracy: z.enum(["exact", "near", "hour"]),
                sampleOffsetsMinutes: z.tuple([z.number(), z.number(), z.number()]),
                sampleEngines: z.tuple([z.string(), z.string(), z.string()]),
              })
              .strict(),
          })
          .strict(),
      })
      .strict(),
    fact: z
      .object({
        id: z.literal("N1"),
        statement: z.string().max(760),
        kind: z.literal("temperament"),
        dependsOn: z.tuple([z.literal("C1"), z.literal("I1")]),
        sourceKey: key,
        releaseVersion: z.string().min(1).max(80),
        natalEvidenceId: z.literal("NL1"),
      })
      .strict(),
    usedParagraphs: z.array(z.number().int().min(1).max(100)).min(1).max(4),
  })
  .strict();

/** Validates exact archived identity and proofs, without consulting live chart/copy. */
export function validateSavedNatalLens(
  value: unknown,
  publicFacts: FactAtom[],
  saved: {
    releaseVersion: string | null;
    primaryCycleKey: string | null;
    mode: "model" | "template";
    citations: { paragraph: number; facts: string[] }[];
    astroParagraphCount: number;
  },
): SavedNatalLens {
  const parsed = envelopeSchema.parse(value);
  const lens = parsed.plan.lens;
  const manifest = validateNatalReliability(
    {
      version: NATAL_RELIABILITY_VERSION,
      chartFingerprint: "archived-private-proof",
      status: "screened",
      reason: null,
      ...lens.screen,
      evidence: lens.evidence,
    },
    "archived-private-proof",
    lens.screen.accuracy,
  );
  if (manifest.status !== "screened") throw new Error("Invalid saved natal proof");
  // Keep selector order: sign first, optional aspect/house second.
  const evidence = lens.evidence as NatalLensEvidence[];
  const sign = evidence[0],
    extra = evidence[1];
  if (
    sign?.kind !== "sign" ||
    NATAL_BODY_ROLE[sign.body] !== lens.role ||
    extra?.kind === "sign" ||
    (extra?.kind === "house" &&
      (extra.body !== sign.body || extra.longitudes.some((l, i) => l !== sign.longitudes[i]))) ||
    (extra?.kind === "aspect" &&
      (Math.max(...extra.orbs) > 3 ||
        ![extra.a, extra.b].includes(sign.body) ||
        extra.longitudes.some(
          (l, i) => l[extra.a === sign.body ? "a" : "b"] !== sign.longitudes[i],
        )))
  )
    throw new Error("Invalid saved natal selector proofs");
  const cycle = publicFacts.find((f) => f.id === "C1")?.cycle;
  if (
    !cycle ||
    !NATAL_PERSONAL_BODIES.some((b) => b === cycle.natalPoint) ||
    // A non-Moon lens always belongs to the transited body; Moon lenses can be fallbacks.
    (sign.body !== "moon" && sign.body !== cycle.natalPoint) ||
    parsed.plan.releaseVersion !== saved.releaseVersion ||
    lens.anchorCycleKey !== saved.primaryCycleKey ||
    safetyPass(lens.mechanism).flagged.length
  )
    throw new Error("Invalid saved natal identity");
  const envelope = parsed as SavedNatalLens;
  const facts = [...publicFacts, envelope.fact];
  assertDailyFactGraph(facts);
  assertNatalLensFact(facts, envelope.plan);
  const ids = new Set(facts.map((f) => f.id));
  if (
    saved.citations.some(
      (c) =>
        !Number.isInteger(c.paragraph) ||
        c.paragraph < 1 ||
        c.paragraph > saved.astroParagraphCount ||
        !Array.isArray(c.facts) ||
        !c.facts.length ||
        new Set(c.facts).size !== c.facts.length ||
        c.facts.some((id) => !ids.has(id)),
    )
  )
    throw new Error("Invalid saved natal reference graph");
  const used = envelope.usedParagraphs;
  if (
    !Number.isInteger(saved.astroParagraphCount) ||
    saved.astroParagraphCount < 1 ||
    saved.astroParagraphCount > 100 ||
    used.some((p, i) => p > saved.astroParagraphCount || (i > 0 && p <= used[i - 1]!))
  )
    throw new Error("Invalid saved natal paragraph linkage");
  const cited = saved.citations.filter((c) => c.facts.includes("N1"));
  if (saved.mode === "model") {
    if (
      saved.astroParagraphCount < 2 ||
      saved.astroParagraphCount > 4 ||
      saved.citations.length !== saved.astroParagraphCount ||
      !saved.citations.every((c, i) => c.paragraph === i + 1) ||
      !["C1", "I1"].every((id) => saved.citations[0]!.facts.includes(id))
    )
      throw new Error("Incomplete saved natal paragraph references");
    if (
      !cited.length ||
      !cited.some((c) => c.paragraph <= 2) ||
      cited.some((c) => !["C1", "I1"].every((id) => c.facts.includes(id))) ||
      JSON.stringify(cited.map((c) => c.paragraph)) !== JSON.stringify(used)
    )
      throw new Error("Invalid saved natal citations");
  } else if (used.length !== 1 || used[0] !== 1 || saved.citations.length)
    throw new Error("Invalid saved natal template linkage");
  return envelope;
}
