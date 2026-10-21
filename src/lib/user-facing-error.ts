// Server functions throw messages written for members ("…could not be loaded. Please retry.").
// Browser transport and runtime failures carry the engine's wording instead, which names
// neither the problem in Pattern's terms nor the recovery, so those fall back to page copy.
const TECHNICAL_NAMES = new Set([
  "TypeError",
  "SyntaxError",
  "RangeError",
  "AbortError",
  "TimeoutError",
]);
const TECHNICAL_MESSAGE =
  /failed to fetch|networkerror|load failed|network connection was lost|internet connection appears to be offline|fetch failed|^httperror$|internal server error|invariant failed|unexpected (token|end)|is not (a function|defined|iterable)|cannot read propert|\bundefined\b|\bnull\b|d1_|sqlite/i;

export function userFacingError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.trim();
  if (!message || TECHNICAL_NAMES.has(error.name) || TECHNICAL_MESSAGE.test(message))
    return fallback;
  return message;
}
