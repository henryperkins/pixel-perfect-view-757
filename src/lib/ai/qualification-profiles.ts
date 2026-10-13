import type { ContentBundle } from "../content/default-bundle";

/** Closed, evaluation-only variants; never member defaults or executable input. */
export const QUALIFICATION_PROFILES = [
  "writing-base",
  "writing-natal",
  "writing-final",
  "writing-baseline",
] as const;
export type QualificationProfile = (typeof QUALIFICATION_PROFILES)[number];
export const QUALIFICATION_PROFILE_VERSION = "daily-qualification-profile-1";
export function qualificationPolicy(profile: QualificationProfile) {
  if (!(QUALIFICATION_PROFILES as readonly unknown[]).includes(profile))
    throw Error("Unknown qualification profile.");
  return {
    version: QUALIFICATION_PROFILE_VERSION,
    profile,
    writing: profile !== "writing-baseline",
    natal: profile !== "writing-base",
    transit: profile === "writing-final" || profile === "writing-baseline",
  };
}
export function qualificationBundle(bundle: ContentBundle, profile: QualificationProfile) {
  if (bundle.schemaVersion !== 5)
    throw Error("Qualification requires the final schema-5 source catalogue.");
  const policy = qualificationPolicy(profile);
  // The frozen source catalogue is preserved; only the old policy ignores frames.
  return policy.writing
    ? bundle
    : ({ ...bundle, schemaVersion: 4, dailyWritingFrames: [] } as ContentBundle);
}
