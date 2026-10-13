import type { ContentBundle } from "./default-bundle";
import { canonicalContentJson } from "./draft-comparison";

/** Source changes require fresh scene review; untouched bindings remain byte-identical. */
export function invalidateDailyWritingFrames(previous: ContentBundle, next: ContentBundle) {
  const changed = new Set(
    (previous.cycles ?? [])
      .filter((source) => {
        const after = (next.cycles ?? []).find((item) => item.key === source.key);
        return (
          !after ||
          canonicalContentJson(JSON.parse(JSON.stringify(source))) !==
            canonicalContentJson(JSON.parse(JSON.stringify(after)))
        );
      })
      .map((source) => source.key),
  );
  const affectedRules = new Set(
    (previous.synthesisRules ?? [])
      .filter((rule) => {
        const after = next.synthesisRules?.find((item) => item.key === rule.key);
        return (
          changed.has(rule.primary.interpretationKey) ||
          changed.has(rule.supporting.interpretationKey) ||
          !after ||
          canonicalContentJson(rule) !== canonicalContentJson(after)
        );
      })
      .map((rule) => rule.key),
  );
  const removed: string[] = [];
  const frames = (next.dailyWritingFrames ?? []).filter((frame) => {
    const affected =
      frame.source.kind === "interpretation"
        ? changed.has(frame.source.key)
        : affectedRules.has(frame.source.key);
    if (affected) removed.push(frame.key);
    return !affected;
  });
  return {
    bundle: { ...next, dailyWritingFrames: structuredClone(frames) },
    removedFrameKeys: removed,
  };
}
