// Real mobile routes with synthetic services. Never loads .env or contacts member/model services.
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { renderErrorPage } from "/home/ubuntu/pixel-perfect-view-757/src/lib/error-page.ts";
const root = "/home/ubuntu/pixel-perfect-view-757";
const services = resolve(root, "tests/helpers/mobile-ui/services.ts");
const server = await createServer({
  root,
  configFile: false,
  envFile: false,
  optimizeDeps: { entries: [resolve(root, "tests/helpers/mobile-ui/main.tsx")] },
  cacheDir: "/home/ubuntu/pixel-perfect-view-757/output/playwright/mobile-ux-local-fixes-20261020/20261020T234742Z/vite-cache",
  plugins: [
    react(),
    tailwind(),
    {
      name: "mobile-member-fixture",
      configureServer(s) {
        s.middlewares.use((req, res, next) => {
          if (!req.headers.accept?.includes("text/html")) return next();
          if (req.url === "/__audit/server-error") {
            res.setHeader("Content-Type", "text/html");
            res.end(renderErrorPage());
            return;
          }
          s.transformIndexHtml(
            req.url,
            '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pattern mobile fixture</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap"></head><body><div id="root"></div><script type="module" src="/tests/helpers/mobile-ui/main.tsx"></script></body></html>',
          ).then((html) => {
            res.setHeader("Content-Type", "text/html");
            res.end(html);
          });
        });
      },
    },
  ],
  resolve: {
    alias: [
      "@/lib/auth.shared",
      "@/lib/pattern.functions",
      "@/lib/account-security.functions",
      "@/lib/billing.functions",
      "@/lib/assistant.functions",
      "@tanstack/react-start",
    ]
      .map((find) => ({ find, replacement: services }))
      .concat([{ find: "@", replacement: resolve(root, "src") }]),
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PATTERN_MOBILE_UI_PORT ?? 4208),
    strictPort: true,
    hmr: false,
    fs: { allow: [root, resolve(root, "node_modules")] },
  },
});
await server.listen();
server.printUrls();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await server.close();
    process.exit(0);
  });
