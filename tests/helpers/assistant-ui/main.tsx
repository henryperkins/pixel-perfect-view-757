import React from "react";
import { createRoot } from "react-dom/client";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route as Auth } from "../../../src/routes/auth";
import { Route as AssistantAuth } from "../../../src/routes/assistant-auth";
import { Route as Consent } from "../../../src/routes/oauth/consent";
import { Route as Member } from "../../../src/routes/_authenticated/route";
import { Route as Assistants } from "../../../src/routes/_authenticated/assistants";
import { Route as Privacy } from "../../../src/routes/_authenticated/privacy";
import "../../../src/styles.css";
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const root = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  ),
});
const member = Member.update({ id: "/_authenticated", getParentRoute: () => root } as never);
const assistants = Assistants.update({
  id: "/assistants",
  path: "/assistants",
  getParentRoute: () => member,
} as never);
const privacy = Privacy.update({
  id: "/privacy",
  path: "/privacy",
  getParentRoute: () => member,
} as never);
const callback = createRoute({
  getParentRoute: () => root,
  path: "/fixture-callback",
  component: () => (
    <main>
      <h1>Assistant callback received</h1>
      <p>{new URLSearchParams(location.search).get("decision")}</p>
    </main>
  ),
});
const router = createRouter({
  routeTree: root.addChildren([
    member.addChildren([assistants, privacy]),
    Auth.update({ id: "/auth", path: "/auth", getParentRoute: () => root } as never),
    AssistantAuth.update({
      id: "/assistant-auth",
      path: "/assistant-auth",
      getParentRoute: () => root,
    } as never),
    Consent.update({
      id: "/oauth/consent",
      path: "/oauth/consent",
      getParentRoute: () => root,
    } as never),
    callback,
  ]),
});
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
