// SPDX-License-Identifier: AGPL-3.0-or-later
import { createServer as httpServer } from "node:http";
import { fork } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createEngine } from "./engine.mjs";

const MAX_BODY = 8192,
  MAX_OUTPUT = 128 * 1024;
const digest = (s) => createHash("sha256").update(s).digest();
const archiveDefault = fileURLToPath(new URL("../dist/source.tar.gz", import.meta.url));
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0,
      body = "",
      failed = false;
    const cleanup = () => {
      clearTimeout(timer);
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
      req.off("aborted", onError);
    };
    const fail = (message) => {
      if (!failed) {
        failed = true;
        cleanup();
        req.pause();
        reject(new Error(message));
      }
    };
    const timer = setTimeout(() => fail("request_timeout"), 1500);
    function onData(chunk) {
      size += chunk.length;
      if (size > MAX_BODY) fail("body_limit");
      else if (!failed) body += chunk.toString("utf8");
    }
    function onEnd() {
      cleanup();
      if (!failed) {
        try {
          resolve(JSON.parse(body));
        } catch {
          fail("invalid_request");
        }
      }
    }
    function onError() {
      fail("invalid_request");
    }
    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
    req.on("aborted", onError);
  });
}
export function createServer({
  key = process.env.SWISS_API_KEY,
  workerPath = new URL("./worker.mjs", import.meta.url),
  deadlineMs = 4500,
  maxConcurrency = 2,
  sourceArchive = archiveDefault,
} = {}) {
  if (typeof key !== "string" || key.length < 32 || key.length > 256)
    throw new Error("authentication_required");
  const engine = createEngine(),
    expected = digest(key),
    children = new Set();
  let active = 0;
  const server = httpServer(async (req, res) => {
    const reply = (status, value) => {
      if (res.destroyed || res.writableEnded) return;
      const unfinishedUpload = !req.complete;
      if (unfinishedUpload) req.pause();
      res.writeHead(status, {
        "content-type": "application/json",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        ...(unfinishedUpload ? { connection: "close" } : {}),
      });
      res.end(JSON.stringify(value), () => {
        if (unfinishedUpload) req.destroy();
      });
    };
    const path = req.url?.split("?")[0];
    if (req.method === "GET" && path === "/health")
      return reply(200, {
        ok: true,
        engine: engine.source,
        sourceId: engine.sourceId,
        release: process.env.RELEASE_GIT_SHA || null,
        license: "AGPL-3.0-or-later",
        source: "/source",
        sourceAvailable: existsSync(sourceArchive),
      });
    if (req.method === "GET" && path === "/v1/engine")
      return reply(200, { ...engine.metadata, release: process.env.RELEASE_GIT_SHA || null });
    if (req.method === "GET" && path === "/source")
      return reply(200, {
        license: "AGPL-3.0-or-later",
        archive: "/source.tar.gz",
        release: process.env.RELEASE_GIT_SHA || null,
        build:
          "Extract archive, then read swiss-ephemeris/README.md. Includes service source, native dependency sources, pinned ephemeris files and build inputs.",
      });
    if (req.method === "GET" && path === "/source.tar.gz") {
      if (!existsSync(sourceArchive)) return reply(503, { error: "source_unavailable" });
      res.writeHead(200, {
        "content-type": "application/gzip",
        "content-length": statSync(sourceArchive).size,
        "content-disposition": 'attachment; filename="pattern-swiss-source.tar.gz"',
        "cache-control": "public, max-age=300",
        "x-content-type-options": "nosniff",
      });
      const stream = createReadStream(sourceArchive);
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
      return;
    }
    if (req.method !== "POST" || !["/v1/chart", "/v1/transit-episodes"].includes(path))
      return reply(404, { error: "not_found" });
    const authorization = req.headers.authorization?.replace(/^Bearer /, "");
    const apiKey = req.headers["x-api-key"];
    if (
      (authorization && apiKey && authorization !== apiKey) ||
      typeof (apiKey || authorization) !== "string" ||
      !timingSafeEqual(digest(apiKey || authorization), expected)
    )
      return reply(401, { error: "unauthorized" });
    if (req.headers["content-type"]?.split(";")[0] !== "application/json")
      return reply(415, { error: "json_required" });
    if (Number(req.headers["content-length"] || 0) > MAX_BODY)
      return reply(413, { error: "body_limit" });
    if (active >= maxConcurrency) return reply(503, { error: "busy" });
    active++;
    let child, deadline;
    const terminate = () => {
      if (child && !child.killed) child.kill("SIGKILL");
    };
    res.on("close", terminate);
    try {
      const input = await readBody(req);
      if (res.destroyed) return;
      const result = await new Promise((resolve, reject) => {
        // Separate processes also isolate Swiss's native global state.
        child = fork(workerPath, [], {
          stdio: ["ignore", "ignore", "ignore", "ipc"],
          execArgv: [],
          env: {
            NODE_ENV: "production",
            ...(process.env.SE_EPHE_PATH ? { SE_EPHE_PATH: process.env.SE_EPHE_PATH } : {}),
          },
        });
        children.add(child);
        deadline = setTimeout(
          () => {
            terminate();
            reject(new Error("time_limit"));
          },
          Math.min(4500, deadlineMs),
        );
        child.once("error", () => reject(new Error("worker_failure")));
        child.once("exit", () => {
          children.delete(child);
          reject(new Error("worker_failure"));
        });
        child.once("message", (message) => resolve(message));
        child.send({ path, input });
      });
      if (result.error) throw new Error(result.error);
      const body = JSON.stringify(result.data);
      if (Buffer.byteLength(body) > MAX_OUTPUT) throw new Error("output_limit");
      reply(200, result.data);
    } catch (error) {
      const allowed = [
        "invalid_request",
        "unqualified_source",
        "source_range",
        "ambiguous_station_contact",
        "evaluation_limit",
        "time_limit",
        "output_limit",
        "body_limit",
        "request_timeout",
        "worker_failure",
        "houses_unavailable",
      ];
      const code = allowed.includes(error.message) ? error.message : "calculation_unavailable";
      const status =
        code === "invalid_request"
          ? 400
          : code === "body_limit"
            ? 413
            : ["time_limit", "request_timeout"].includes(code)
              ? 504
              : code === "unqualified_source"
                ? 409
                : code === "source_range" || code === "ambiguous_station_contact"
                  ? 422
                  : 503;
      reply(status, { error: code });
    } finally {
      clearTimeout(deadline);
      terminate();
      active--;
      res.off("close", terminate);
    }
  });
  server.requestTimeout = 6000;
  server.headersTimeout = 5000;
  server.timeout = 6000;
  server.on("close", () => {
    for (const child of children) child.kill("SIGKILL");
  });
  return server;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (
    process.env.NODE_ENV === "production" &&
    (!existsSync(archiveDefault) || !/^\w{40}$/.test(process.env.RELEASE_GIT_SHA || ""))
  )
    throw new Error("production_source_required");
  const server = createServer();
  server.listen(Number(process.env.PORT || 8080), "0.0.0.0", () =>
    console.log("Swiss calculation service ready."),
  );
  const stop = () => {
    server.closeAllConnections();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
