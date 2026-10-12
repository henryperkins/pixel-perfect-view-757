import type { ContentBundle } from "./default-bundle";
import { NATAL_CANDIDATE_BUNDLE } from "./natal-candidate-bundle";
import { TRANSIT_CHAPTERS } from "./transit-story-catalogue";

/** Inactive candidate. The built-in fallback never activates natal or transit catalogues. */
export const TRANSIT_CANDIDATE_BUNDLE: ContentBundle = {
  ...NATAL_CANDIDATE_BUNDLE,
  version: "builtin-0.7.0",
  schemaVersion: 4,
  transitChapters: TRANSIT_CHAPTERS,
  phases: {
    approaching:
      "If a demand catches your attention, you can notice your response before deciding how to act.",
    exact: "If a demand feels immediate, start with the choice you can describe clearly.",
    separating: "If any felt pressure has eased, notice which response may still be useful.",
  },
};
