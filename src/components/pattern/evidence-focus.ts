/** Move focus to a citation target and keep it clear of the sticky header. */
export function focusEvidenceTarget(id: string) {
  const target = document.getElementById(id);
  target?.focus({ preventScroll: true });
  target?.scrollIntoView({ block: "start", behavior: "instant" });
}
