import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

/** A test-only runtime with no outbound service or environment credentials. */
export async function runOfflineWorker(source, binary = process.env.PATTERN_TEST_WORKERD) {
  const directory = await mkdtemp(join(tmpdir(), "pattern-offline-worker-"));
  try {
    const result = await build({
      stdin: { contents: source, resolveDir: process.cwd(), loader: "ts" },
      bundle: true,
      write: false,
      format: "esm",
      platform: "node",
      target: "es2022",
      external: ["node:*"],
      logLevel: "silent",
    });
    await writeFile(join(directory, "main.js"), result.outputFiles[0].contents);
    await writeFile(
      join(directory, "config.capnp"),
      `using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (services = [
  (name = "main", worker = (modules = [(name = "main.js", esModule = embed "main.js")], compatibilityDate = "2026-10-06", globalOutbound = "deny")),
  (name = "deny", network = (allow = []))
]);`,
    );
    return execFileSync(binary, ["test", join(directory, "config.capnp")], {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: 60_000,
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
