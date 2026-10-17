/** Non-secret serving policy lives outside immutable published content. */
import { createHash } from "node:crypto";
import { z } from "zod";
import type { DBClient } from "../d1.server";
import type { LanguageProvider } from "./diagnostics";
import {
  CONTEXT_DAILY_PROMPT_VERSION,
  CONTEXT_DAILY_VALIDATOR_VERSION,
  CONTEXT_DAILY_VOICE_VERSION,
  CONTEXT_DAILY_BRIEF_VERSION,
  CONTEXT_DAILY_MATERIAL_VERSION,
} from "./daily-context-writing";
import {
  MEMBER_CONTEXT_READING_VERSION,
  MEMBER_CONTEXT_FALLBACK_VERSION,
} from "./member-context-reading";
import adapterBytes from "./member-context-reading.ts?raw";
import materialBytes from "./context-writing-material.json?raw";
import fallbackBytes from "./member-context-readings.json?raw";
import writerBytes from "./language.server.ts?raw";
import briefBytes from "./daily-context-writing.ts?raw";
import claimsBytes from "./daily-context-claims.ts?raw";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const MEMBER_CONTEXT_ROLLOUT_VERSION = "daily-member-context-rollout-1" as const;
export function memberContextPolicyIdentity() {
  return {
    adapterVersion: MEMBER_CONTEXT_READING_VERSION,
    adapterHash: hash(adapterBytes),
    fallbackVersion: MEMBER_CONTEXT_FALLBACK_VERSION,
    fallbackHash: hash(fallbackBytes),
    materialVersion: CONTEXT_DAILY_MATERIAL_VERSION,
    materialHash: hash(materialBytes),
    promptVersion: CONTEXT_DAILY_PROMPT_VERSION,
    validatorVersion: CONTEXT_DAILY_VALIDATOR_VERSION,
    voiceVersion: CONTEXT_DAILY_VOICE_VERSION,
    briefVersion: CONTEXT_DAILY_BRIEF_VERSION,
    writerHash: hash(writerBytes),
    briefHash: hash(briefBytes),
    claimsHash: hash(claimsBytes),
  };
}
const mode = z.enum([
  "contact-only",
  "natal-only",
  "transit-only",
  "natal-and-transit",
  "synthesis-natal-and-transit",
]);
const schema = z
  .object({
    version: z.literal(MEMBER_CONTEXT_ROLLOUT_VERSION),
    releaseVersion: z.literal("0.9.0"),
    provider: z.literal("gemini-enterprise"),
    render: z.enum(["authored", "model"]),
    modes: z
      .array(mode)
      .min(1)
      .max(5)
      .refine((modes) => new Set(modes).size === modes.length),
    policy: z.record(z.string(), z.string()),
    reviewId: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export interface MemberContextRollout {
  releaseId: string;
  raw: string;
  config: z.infer<typeof schema>;
}

/** Missing migration, read failure, stale source, provider or review all keep this route off. */
export async function loadMemberContextRollout(
  db: DBClient,
  releaseVersion: string,
  provider: LanguageProvider,
): Promise<MemberContextRollout | null> {
  if (releaseVersion !== "0.9.0" || provider !== "gemini-enterprise") return null;
  try {
    const rows = await db.exec<{ id: string; version: string; writer_rollout: string | null }>(
      "SELECT id,version,writer_rollout FROM content_releases WHERE is_active=1 AND version=?",
      [releaseVersion],
    );
    if (rows.length !== 1 || !rows[0]?.writer_rollout) return null;
    const row = rows[0];
    const parsed = schema.safeParse(JSON.parse(row.writer_rollout!));
    if (!parsed.success) return null;
    const expected = memberContextPolicyIdentity();
    const actual = parsed.data.policy;
    if (
      Object.keys(expected).length !== Object.keys(actual).length ||
      Object.entries(expected).some(([key, value]) => actual[key] !== value)
    )
      return null;
    return { releaseId: row.id, raw: row.writer_rollout!, config: parsed.data };
  } catch {
    return null;
  }
}

/** A changed rendering policy creates a new immutable row; disabling restores the old branch. */
export function memberContextRolloutIdentity(rollout: MemberContextRollout | null) {
  return rollout ? structuredClone(rollout.config) : null;
}
