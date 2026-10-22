import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { test } from "node:test";
import { mcpPlugin } from "../scripts/mcp-vite-plugin.mjs";

async function fixture(task) {
  const root = await mkdtemp(join(tmpdir(), "pattern-mcp-path-"));
  try {
    await mkdir(join(root, "src/lib/mcp"), { recursive: true });
    await writeFile(join(root, "src/lib/mcp/index.ts"), "export default {};\n");
    await task(root);
  } finally {
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
    assert.ok(basename(root).startsWith("pattern-mcp-path-"));
    await rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

test("Vite slash-normalized roots emit both MCP routes without mutating the shared config", async () => {
  await fixture(async (root) => {
    const config = { root: root.split(sep).join("/"), mode: "production" };
    const plugin = mcpPlugin();
    await plugin.configResolved.call({}, config);
    assert.equal(config.root, root.split(sep).join("/"));
    assert.equal(plugin.name, "@lovable.dev/mcp-js");
    assert.equal(plugin.api.mcpEntry, resolve(root, "src/lib/mcp/index.ts"));
    assert.equal(plugin.api.urlPath, "/mcp");
    const main = await readFile(join(root, "src/routes/mcp.ts"), "utf8");
    const metadata = await readFile(
      join(root, "src/routes/[.well-known]/oauth-protected-resource.ts"),
      "utf8",
    );
    assert.match(main, /createTanStackMcpHandler/);
    assert.match(metadata, /createTanStackOAuthProtectedResourceMetadataHandler/);
    assert.match(main, /metadataPath: "\/\.well-known\/oauth-protected-resource"/);
    await rm(join(root, "src/routes/mcp.ts"));
    await plugin.buildStart.call({});
    assert.equal(await readFile(join(root, "src/routes/mcp.ts"), "utf8"), main);
  });
});

test("native-root adaptation retains custom routes and upstream path-containment checks", async () => {
  await fixture(async (root) => {
    const plugin = mcpPlugin({ path: "/api/public/mcp", metadataPath: "/api/public/oauth" });
    await plugin.configResolved.call({}, { root: root.split(sep).join("/") });
    assert.match(
      await readFile(join(root, "src/routes/api/public/mcp.ts"), "utf8"),
      /resourcePath: "\/api\/public\/mcp"/,
    );
    assert.match(
      await readFile(join(root, "src/routes/api/public/oauth.ts"), "utf8"),
      /createTanStackOAuthProtectedResourceMetadataHandler/,
    );
    assert.throws(() => mcpPlugin({ routesDir: "../outside" }), /must resolve under/);
    assert.throws(() => mcpPlugin({ routeFileName: "../outside.ts" }), /must resolve under/);
    assert.throws(() => mcpPlugin({ metadataPath: "/../outside" }), /must not contain/);
  });
});
