import data from "test-data";

let forwarded = 0;
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/diagnostics") return Response.json({ forwarded });
    if (url.hostname !== "assistant-fixture.supabase.co") forwarded++;
    if (url.pathname.endsWith("/.well-known/jwks.json")) return Response.json({ keys: [data.jwk] });
    if (request.headers.get("authorization") !== `Bearer ${data.token}`)
      return new Response(null, { status: 401 });
    const redirect = url.pathname.match(/^\/redirect\/(\d+)/);
    if (redirect)
      return new Response("Do not follow", {
        status: Number(redirect[1]),
        headers: { location: "https://untrusted-fixture.invalid/user" },
      });
    return Response.json({
      id: "runtime-member",
      email: "runtime-member@example.invalid",
      email_confirmed_at: "2026-10-12T00:00:00Z",
    });
  },
};
