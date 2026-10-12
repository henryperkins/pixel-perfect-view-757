// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), "pattern-swiss-source-"));
try {
  const dest = join(tmp, "swiss-ephemeris");
  mkdirSync(dest);
  // Explicit allowlist: never archive .env, logs, credentials or the app tree.
  for (const name of [
    "src",
    "scripts",
    "tests",
    "package.json",
    "package-lock.json",
    "ephemeris.lock.json",
    "LICENSE",
    "NOTICE",
    "README.md",
    "Dockerfile",
    "fly.toml",
    "node_modules",
    "data",
  ])
    cpSync(join(root, name), join(dest, name), { recursive: true });
  const files = [];
  function walk(folder, prefix = "") {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const rel = join(prefix, entry.name),
        path = join(folder, entry.name);
      if (entry.isDirectory()) walk(path, rel);
      else if (entry.isFile())
        files.push({
          path: rel,
          sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
        });
    }
  }
  walk(dest);
  writeFileSync(
    join(dest, "SOURCE-MANIFEST.json"),
    JSON.stringify(
      {
        release: process.env.RELEASE_GIT_SHA || null,
        files: files.sort((a, b) => a.path.localeCompare(b.path)),
      },
      null,
      2,
    ) + "\n",
  );
  const out = resolve(root, "dist");
  mkdirSync(out, { recursive: true });
  execFileSync("tar", [
    "--sort=name",
    "--mtime=@0",
    "--owner=0",
    "--group=0",
    "--numeric-owner",
    "-czf",
    join(out, "source.tar.gz"),
    "-C",
    tmp,
    "swiss-ephemeris",
  ]);
  console.log("Self-contained source archive created.");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
