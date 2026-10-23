// Run the tracked pattern-evidence browser cases in bundled Chromium when the
// Playwright CLI's Chrome channel is unavailable.
// Usage: node output/playwright/reading-exploration-f7d1b37/browser-chromium.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH ??
    "/home/ubuntu/.npm/_npx/31e32ef8478fbf80/node_modules/playwright-core",
);
const executablePath =
  process.env.CHROMIUM_PATH ??
  "/home/ubuntu/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome";
const source = readFileSync(resolve("tests/helpers/mobile-ui/pattern-evidence.cases.txt"), "utf8");
const cases = (0, eval)(`(${source.replace(/;\s*$/, "")})`);

const browser = await chromium.launch({ executablePath, headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4198/");
  const result = await cases(page);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
