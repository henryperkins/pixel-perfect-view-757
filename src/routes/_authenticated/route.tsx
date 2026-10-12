import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { currentSession } from "@/lib/auth.shared";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { session } = await currentSession();
    if (!session)
      throw redirect({
        to: "/auth",
        search: location.pathname === "/assistants" ? { next: "/assistants" } : {},
      });
    return { user: session };
  },
  component: () => <Outlet />,
});
