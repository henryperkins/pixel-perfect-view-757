import fixture from "../2026-10-12-owned-swiss/jupiter-single-direct.json";

export default {
  async fetch(request) {
    if (request.headers.get("x-api-key") !== "synthetic-runtime-test-key")
      return new Response(null, { status: 401 });
    const input = await request.json();
    if (JSON.stringify(input) !== JSON.stringify(fixture.request))
      return new Response(null, { status: 400 });
    return Response.json(fixture.scan);
  },
};
