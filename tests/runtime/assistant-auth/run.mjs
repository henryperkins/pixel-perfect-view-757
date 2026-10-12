import { mkdtempSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { generateKeyPair, exportJWK, SignJWT } from "jose";

const here = dirname(fileURLToPath(import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "pattern-assistant-runtime-"));
try {
  const keys = await generateKeyPair("ES256");
  const jwk = { ...(await exportJWK(keys.publicKey)), kid: "runtime", alg: "ES256", use: "sig" };
  const token = await new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "ES256", kid: "runtime" })
    .setIssuer("https://assistant-fixture.supabase.co/auth/v1")
    .setSubject("runtime-member")
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(keys.privateKey);
  writeFileSync(join(temp, "test-data.mjs"), `export default ${JSON.stringify({ jwk, token })};`);
  const build = spawnSync(
    "bun",
    [
      "build",
      join(here, "probe.mjs"),
      join(here, "fixture.mjs"),
      "--outdir",
      temp,
      "--target",
      "browser",
      "--external",
      "test-data",
      "--external",
      "crypto",
      "--external",
      "node:*",
      "--external",
      "@tanstack/*",
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
