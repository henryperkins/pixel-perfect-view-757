import type { ContentBundle } from "./default-bundle";
import { NATAL_CANDIDATE_BUNDLE } from "./natal-candidate-bundle";
import { TRANSIT_CHAPTERS } from "./transit-story-catalogue";

/** Inactive candidate. The built-in fallback never activates natal or transit catalogues. */
export const TRANSIT_CANDIDATE_BUNDLE: ContentBundle = {
  ...NATAL_CANDIDATE_BUNDLE,
  version: "builtin-0.7.1",
  schemaVersion: 4,
  transitChapters: TRANSIT_CHAPTERS,
  phases: {
    approaching:
      "If a demand catches your attention, you can notice your response before deciding how to act.",
    exact: "If a demand feels immediate, one clearly described choice can offer a place to begin.",
    separating: "If any felt pressure has eased, a response may still be useful.",
  },
};
