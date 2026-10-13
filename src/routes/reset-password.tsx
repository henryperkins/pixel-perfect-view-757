import { createFileRoute } from "@tanstack/react-router";
import { AccountLink } from "@/components/pattern/AccountLink";
export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Pattern" },
      { name: "robots", content: "noindex" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: () => <AccountLink reset />,
});
