import { mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "pattern-transit-runtime-"));
try {
  const build = spawnSync(
    "bun",
    [
      "build",
      join(here, "workerd-probe.mjs"),
      join(here, "workerd-fixture.mjs"),
      "--outdir",
      temp,
      "--target",
      "browser",
    ],
    { stdio: "inherit" },
  );
  if (build.error) throw build.error;
  if (build.status !== 0) throw Error("Probe build failed");
  copyFileSync(join(here, "workerd.capnp"), join(temp, "workerd.capnp"));
  const run = spawnSync(process.argv[2] || "workerd", ["test", join(temp, "workerd.capnp")], {
    stdio: "inherit",
  });
  if (run.error) throw run.error;
  process.exitCode = run.status ?? 1;
} finally {
  rmSync(temp, { recursive: true, force: true });
}
