import { createFileRoute } from "@tanstack/react-router";
import { AccountLink } from "@/components/pattern/AccountLink";
export const Route = createFileRoute("/confirm-email")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirm email — Pattern" },
      { name: "robots", content: "noindex" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: () => <AccountLink />,
});
