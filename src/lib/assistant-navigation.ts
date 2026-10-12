/** Allow only the two internal destinations involved in connecting an assistant. */
export function assistantReturnTo(value: unknown): string {
  if (value === "/assistants") return value;
  if (typeof value !== "string" || !value.startsWith("/oauth/consent?")) return "/assistants";
  const url = new URL(value, "https://pattern.invalid");
  const id = url.searchParams.get("authorization_id");
  return url.pathname === "/oauth/consent" && id && /^[a-zA-Z0-9_-]{1,200}$/.test(id)
    ? `/oauth/consent?authorization_id=${encodeURIComponent(id)}`
    : "/assistants";
}
