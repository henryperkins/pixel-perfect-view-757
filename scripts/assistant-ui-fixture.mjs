// Serve the real assistant pages with isolated local service fixtures for browser QA.
// No .env file, member database or external identity provider is used.
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const services = resolve(root, "tests/helpers/assistant-ui/services.ts");
const aliases = [
  "@/lib/assistant.functions",
  "@/lib/auth.shared",
  "@/lib/pattern.functions",
  "@/integrations/supabase/client",
  "@/integrations/lovable",
  "@tanstack/react-start",
].map((find) => ({ find, replacement: services }));
const server = await createServer({
  root,
  configFile: false,
  cacheDir: "node_modules/.cache/assistant-browser",
  envFile: false,
  plugins: [
    react(),
    tailwind(),
    {
      name: "assistant-browser-fixture",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.headers.accept?.includes("text/html")) return next();
          void server
            .transformIndexHtml(
              req.url,
              '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pattern assistant browser fixture</title></head><body><div id="root"></div><script type="module" src="/tests/helpers/assistant-ui/main.tsx"></script></body></html>',
            )
            .then((html) => {
              res.setHeader("Content-Type", "text/html");
              res.end(html);
            });
        });
      },
    },
  ],
  resolve: { alias: [...aliases, { find: "@", replacement: resolve(root, "src") }] },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PATTERN_UI_PORT ?? 4187),
    strictPort: true,
  },
});
await server.listen();
server.printUrls();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await server.close();
    process.exit(0);
  });
