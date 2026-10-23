// Capture the chapter evidence surface after programmatic paragraph focus.
// Usage: node output/playwright/reading-exploration-f7d1b37/screenshots.mjs
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
const browser = await chromium.launch({ executablePath, headless: true });
const facts = [
  {
    id: "N1",
    statement:
      'detected natal structure "Sun in Aries" of family luminary (key sun_aries), ranked among the most prominent structures in this chart (an app ranking, not a measurement; never quote it as a number)',
  },
  { id: "N2", statement: "sign: Aries" },
];
const narrative = {
  available: true,
  cacheKey: "fixture",
  narrative:
    "You may feel ready to begin before every detail is settled. Make room for one small step, and notice what it teaches you.\n\nYour response can be both direct and considerate. Leave space for someone else to find their words.",
  paragraphs: [
    "You may feel ready to begin before every detail is settled. Make room for one small step, and notice what it teaches you.",
    "Your response can be both direct and considerate. Leave space for someone else to find their words.",
  ],
  facts,
  citations: [{ paragraph: 1, facts: ["N1", "N2"] }],
  evidenceAvailable: true,
  model: null,
  locked: true,
  accessUntil: "2027-01-01T00:00:00Z",
};
try {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4198/");
    await page.getByRole("textbox", { name: "Reflection note" }).waitFor();
    await page.evaluate((value) => {
      window.mobileAudit.state.overrides.fetchMembership = {
        enabled: true,
        fullAccess: false,
        accessUntil: "2027-01-01T00:00:00Z",
      };
      window.auditQueryClient.setQueryData(["membership", "mobile-audit-member"], {
        enabled: true,
        fullAccess: false,
        accessUntil: "2027-01-01T00:00:00Z",
      });
      window.mobileAudit.state.responses.fetchFeatureNarrative = [value];
    }, narrative);
    await page.evaluate(() => window.auditRouter.navigate({ to: "/pattern" }));
    await page.locator("#chapter-toggle-sun_aries").waitFor();
    await page.locator(".pattern-chapter-evidence summary").click();
    await page.locator(".pattern-evidence-citations a").first().waitFor({ state: "visible" });
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: "Paragraph 1", exact: true }).click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: resolve(
        `output/playwright/reading-exploration-f7d1b37/pattern-evidence-${viewport.width}.png`,
      ),
      fullPage: false,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
