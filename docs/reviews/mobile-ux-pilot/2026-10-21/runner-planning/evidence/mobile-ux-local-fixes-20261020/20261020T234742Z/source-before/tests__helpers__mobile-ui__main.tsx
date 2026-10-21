import { MemberDraftProvider } from "@/components/pattern/MemberDraftProvider";
import React from "react";
import { createRoot } from "react-dom/client";
import { createRootRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Route as Index } from "@/routes/index.tsx";
import { Route as Member } from "@/routes/_authenticated/route.tsx";
import "@/styles.css";
import { Route as R0 } from "@/routes/auth.tsx";
import { Route as R1 } from "@/routes/_authenticated/onboarding.tsx";
import { Route as R2 } from "@/routes/_authenticated/journal.tsx";
import { Route as R3 } from "@/routes/_authenticated/pattern.tsx";
import { Route as R4 } from "@/routes/_authenticated/timing.tsx";
import { Route as R5 } from "@/routes/_authenticated/privacy.tsx";
import { Route as R6 } from "@/routes/_authenticated/plans.tsx";
import { Route as R7 } from "@/routes/_authenticated/birth.tsx";
import { Route as R8 } from "@/routes/_authenticated/time-travel.tsx";
import { Route as R9 } from "@/routes/transit-chart-calculator.tsx";
import { Route as R10 } from "@/routes/reset-password.tsx";
import { Route as AppRoot } from "@/routes/__root.tsx";
const queryClient = new QueryClient();
const root = createRootRoute({
  notFoundComponent: AppRoot.options.notFoundComponent,
  errorComponent: AppRoot.options.errorComponent,
  component: () => (
    <QueryClientProvider client={queryClient}>
      <MemberDraftProvider>
        <Outlet />
        <Toaster />
      </MemberDraftProvider>
    </QueryClientProvider>
  ),
});
const member = Member.update({ id: "/_authenticated", getParentRoute: () => root });
const index = Index.update({ id: "/", path: "/", getParentRoute: () => root });
const r0 = R0.update({ id: "/auth", path: "/auth", getParentRoute: () => root });
const r1 = R1.update({ id: "/onboarding", path: "/onboarding", getParentRoute: () => member });
const r2 = R2.update({ id: "/journal", path: "/journal", getParentRoute: () => member });
const r3 = R3.update({ id: "/pattern", path: "/pattern", getParentRoute: () => member });
const r4 = R4.update({ id: "/timing", path: "/timing", getParentRoute: () => member });
const r5 = R5.update({ id: "/privacy", path: "/privacy", getParentRoute: () => member });
const r6 = R6.update({ id: "/plans", path: "/plans", getParentRoute: () => member });
const r7 = R7.update({ id: "/birth", path: "/birth", getParentRoute: () => member });
const r8 = R8.update({ id: "/time-travel", path: "/time-travel", getParentRoute: () => member });
const r9 = R9.update({
  id: "/transit-chart-calculator",
  path: "/transit-chart-calculator",
  getParentRoute: () => root,
});
const r10 = R10.update({
  id: "/reset-password",
  path: "/reset-password",
  getParentRoute: () => root,
});
const router = createRouter({
  routeTree: root.addChildren([
    index,
    r0,
    r9,
    r10,
    member.addChildren([r1, r2, r3, r4, r5, r6, r7, r8]),
  ]),
  scrollRestoration: true,
});
Object.assign(window, { auditRouter: router, auditQueryClient: queryClient });
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
