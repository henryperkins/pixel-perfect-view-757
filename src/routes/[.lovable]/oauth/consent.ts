import { createFileRoute } from "@tanstack/react-router";

/** Compatibility with the identity provider's already-published authorization UI URL. */
export const Route = createFileRoute("/.lovable/oauth/consent")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const id = new URL(request.url).searchParams.get("authorization_id");
        const target = new URL("/oauth/consent", request.url);
        if (id && /^[a-zA-Z0-9_-]{1,200}$/.test(id))
          target.searchParams.set("authorization_id", id);
        return new Response(null, {
          status: 302,
          headers: { Location: target.toString(), "Cache-Control": "no-store" },
        });
      },
    },
  },
});
