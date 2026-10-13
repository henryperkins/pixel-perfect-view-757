import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

test("draft evaluation is an explicit eight-call pilot, separate from authoring and approval", async () => {
  const stubs = fileURLToPath(
    new URL("./helpers/reading-evaluation-ui-stubs.mjs", import.meta.url),
  );
  const vite = await createServer({
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    resolve: {
      alias: [
        { find: /^@tanstack\/react-start$/, replacement: stubs },
        { find: /^@\/lib\/pattern\.functions$/, replacement: stubs },
        { find: /^@\//, replacement: fileURLToPath(new URL("../src/", import.meta.url)) },
      ],
    },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  try {
    const { ContentDraftEvaluation, InactiveReleaseEvaluation } = await vite.ssrLoadModule(
      "/src/components/pattern/ContentDraftEvaluation.tsx",
    );
    const markup = renderToStaticMarkup(
      createElement(ContentDraftEvaluation, {
        draftId: "draft-fixture",
        userId: "admin-fixture",
        baseVersion: "0.7.1",
        authoringModel: "historical-authoring-model",
        memberProvider: "gemini-enterprise",
      }),
    );
    assert.match(markup, /<button[^>]*aria-expanded="false"[^>]*>Evaluate this draft<\/button>/);
    assert.match(markup, /4 of 20 body-specific fallback slots/);
    assert.match(markup, /eight calls/);
    assert.match(markup, /\$5/);
    assert.match(markup, /Evaluation does not approve or activate/);
    assert.doesNotMatch(markup, /Start baseline/);
    const releases = [
      { id: "live-id", version: "0.7.1", is_active: true },
      { id: "candidate-id", version: "0.8.0", is_active: false },
      { id: "prior-id", version: "0.6.0", is_active: false },
    ];
    const releaseMarkup = renderToStaticMarkup(
      createElement(InactiveReleaseEvaluation, {
        release: releases[1],
        releases,
        userId: "admin-fixture",
        memberProvider: "gemini-enterprise",
      }),
    );
    assert.match(releaseMarkup, /Evaluate this release/);
    assert.match(releaseMarkup, /<option value="live-id" selected="">0.7.1/);
    assert.doesNotMatch(releaseMarkup, /<option value="candidate-id"/);
    assert.match(releaseMarkup, /Candidate release ID: candidate-id/);
    assert.match(releaseMarkup, /Baseline release ID: live-id/);
    assert.equal(
      renderToStaticMarkup(
        createElement(InactiveReleaseEvaluation, {
          release: releases[0],
          releases,
          userId: "admin-fixture",
        }),
      ),
      "",
      "An active release cannot be selected as the comparison candidate",
    );
    assert.doesNotMatch(
      renderToStaticMarkup(
        createElement(InactiveReleaseEvaluation, {
          release: releases[1],
          releases: [releases[1]],
          userId: "admin-fixture",
        }),
      ),
      /Evaluate this release/,
      "A comparison cannot use the same release for both arms",
    );
  } finally {
    await vite.close();
  }
});
