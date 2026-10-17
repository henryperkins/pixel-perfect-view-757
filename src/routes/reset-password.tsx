import { createFileRoute } from "@tanstack/react-router";
import { AccountLink } from "@/components/pattern/AccountLink";
export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Pattern" },
      {
        name: "description",
        content: "Securely reset your Pattern password and revoke old sessions.",
      },
      { property: "og:title", content: "Reset password — Pattern" },
      {
        property: "og:description",
        content: "Securely reset your Pattern password and revoke old sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: () => <AccountLink reset />,
});
