import { execFileSync } from "node:child_process";
/** Dirty runtime inputs cannot be attributed to the previous committed SHA. */
export function readBuildSourceSha(cwd = process.cwd()) {
  try {
    const paths = [
      "src",
      "scripts",
      "edge",
      "services",
      "d1",
      "vite.config.ts",
      "tsconfig.json",
      "package.json",
      "bun.lock",
    ];
    const dirty = execFileSync(
      "git",
      ["status", "--porcelain", "--untracked-files=normal", "--", ...paths],
      { cwd, encoding: "utf8" },
    );
    if (dirty.trim()) return null;
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();
    return /^[a-f0-9]{40}$/.test(sha) ? sha : null;
  } catch {
    return null;
  }
}
