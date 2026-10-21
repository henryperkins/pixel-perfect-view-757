import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

const projectRoot =
  process.env.PATTERN_TEST_PROJECT_ROOT ?? fileURLToPath(new URL("../", import.meta.url));
const projectRequire = createRequire(join(projectRoot, "package.json"));
const { createServer } = await import(pathToFileURL(projectRequire.resolve("vite")).href);
let vite, Landing;

before(async () => {
  vite = await createServer({
    root: projectRoot,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    resolve: { alias: { "@": join(projectRoot, "src") } },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  ({ Landing } = await vite.ssrLoadModule("/src/components/pattern/Landing.tsx"));
});
after(async () => await vite?.close());

async function renderLanding() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => createElement(Landing) }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return renderToString(createElement(RouterProvider, { router }));
}

test("the landing foundations list carries its three principles", async () => {
  const html = await renderLanding();
  const lists = [...html.matchAll(/<ul class="landing-foundations[^"]*">([\s\S]*?)<\/ul>/g)];
  assert.equal(lists.length, 1, "exactly one ul.landing-foundations");
  const items = [...lists[0][1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  assert.deepEqual(
    items.map((item) => item.replace(/<[^>]+>/g, "")),
    [
      "Unknown birth time is fine. Unreliable house and angle descriptions are left out.",
      "Optional context stays optional. It can shape a suggestion, never change the chart.",
      "Birth details, notes and readings are stored encrypted.",
    ],
  );
  // Each principle opens with a run-in lead; hairline rules replace typed bullets.
  assert.deepEqual(
    items.map((item) => item.match(/^<b>([^<]+)<\/b>/)?.[1]),
    [
      "Unknown birth time is fine.",
      "Optional context stays optional.",
      "Birth details, notes and readings",
    ],
  );
});

test("the foundations list follows the hero it sits beneath", async () => {
  const html = await renderLanding();
  const hero = html.indexOf('class="landing-scene"');
  const list = html.indexOf('class="landing-foundations');
  assert.ok(hero >= 0 && list > hero, "ul.landing-foundations renders after the celestial hero");
});
