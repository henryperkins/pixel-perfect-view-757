import { createFileRoute } from "@tanstack/react-router";
import { AccountLink } from "@/components/pattern/AccountLink";
export const Route = createFileRoute("/confirm-email")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirm email — Pattern" },
      {name:"description",content:"Confirm ownership of your Pattern account email."},{property:"og:title",content:"Confirm email — Pattern"},{property:"og:description",content:"Confirm ownership of your Pattern account email."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"},
      { name: "robots", content: "noindex" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: () => <AccountLink />,
});
