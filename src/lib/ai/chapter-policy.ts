export const FEATURE_ESSAY_VERSION = "essay-6";

/** Reject titles and instructions even when the model puts them in the question field. */
export function chapterReflection(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (
    text.length <= 400 &&
    /^(what|when|where|which|who|how|why|do|does|did|are|is|have|has|can|could|would)\b/i.test(
      text,
    ) &&
    text.endsWith("?") &&
    (text.match(/\?/g) ?? []).length === 1 &&
    /\b(you|your|yourself)\b/i.test(text)
  )
    return text;
  return "Where in your everyday life do you recognise this pattern, and when does your experience differ?";
}
