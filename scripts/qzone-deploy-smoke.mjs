import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = (process.argv[2] ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const origin = new URL(base).origin;
const label = new URL(base).hostname === "127.0.0.1" ? "package" : "deployed";
await mkdir("outputs/qzone-qa", { recursive: true });
const browser = await chromium.launch({
  args: ["--autoplay-policy=user-gesture-required"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  const external = [];
  const writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
    if (request.method() !== "GET") writes.push(request.url());
  });
  const response = await page.goto(base);
  assert.equal(response.status(), 200);
  assert.match(response.headers()["cache-control"], /no-transform/);
  assert.equal(
    (await response.text()).includes("static.cloudflareinsights.com/beacon"),
    false,
  );
  assert.match(
    response.headers()["content-security-policy"],
    /script-src 'self'/,
  );
  await page
    .getByRole("heading", { name: "Space Caveman", exact: true })
    .waitFor();
  assert.deepEqual(
    await page
      .locator("main .module")
      .evaluateAll((items) => items.map((item) => item.id)),
    ["nyc", "flower", "visitors"],
  );
  assert.equal(
    await page.locator(".presence-answer").getAttribute("data-status"),
    "unknown",
  );
  await page.getByText("No public update yet.", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Sample visit count: 1286").textContent(),
    "001286",
  );
  await page
    .getByText("Decorative counter · sample data", { exact: true })
    .waitFor();
  assert.equal(
    await page.locator("audio, #dressup, #guestbook, #albums, #meetup").count(),
    0,
  );
  assert.equal(
    await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links.every((link) => document.getElementById(link.hash.slice(1))),
      ),
    true,
  );
  await page.getByRole("button", { name: "Water", exact: true }).click();
  await page.getByRole("button", { name: "中文", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
  assert.equal(
    await page
      .getByRole("meter", { name: "雨露", exact: true })
      .getAttribute("value"),
    "1",
  );
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  for (let round = 0; round < 3; round++) {
    for (const action of ["Water", "Sun", "Prune", "Feed"]) {
      await page.getByRole("button", { name: action, exact: true }).click();
    }
  }
  await page
    .getByText("In bloom! You earned a Moon flag.", { exact: true })
    .waitFor();
  const flag = page.getByLabel("Moon flag · bloom reward", { exact: true });
  assert.equal(await flag.isChecked(), true);
  await flag.uncheck();
  assert.equal(await flag.isChecked(), false);
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Resume animation", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.deepEqual(writes, []);
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of ["中文", "English"]) {
      await page.getByRole("button", { name: language, exact: true }).tap();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
    }
  }
  await page.goto(base);
  await page.screenshot({
    path: `outputs/qzone-qa/${label}-phone.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: `outputs/qzone-qa/${label}-desktop.png` });
  const visits = await context.request.get(`${base}/api/visits`);
  assert.equal(visits.status(), 200);
  assert.equal((await visits.json()).demo, true);
  const legacy = await context.request.get(`${base}/visits`);
  assert.equal(legacy.status(), 200);
  assert.match(await legacy.text(), /Let's meet in the city/);
  const presence = await context.request.get(`${base}/presence`);
  assert.equal(presence.status(), 200);
  const protectedPresence = await context.request.get(`${base}/api/presence`);
  assert.ok([401, 503].includes(protectedPresence.status()));
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    JSON.stringify({
      base,
      homepage: 200,
      modules: ["nyc", "flower", "visitors"],
      nycStatus: "unknown",
      counter: "sample",
      languages: "en/zh",
      interactions: "passed",
      phoneWidths: [320, 390, 430],
      securityHeaders: "preserved",
      visits: visits.status(),
      presencePage: presence.status(),
      protectedPresence: protectedPresence.status(),
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
