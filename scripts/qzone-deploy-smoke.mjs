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
  assert.match(
    response.headers()["content-security-policy"],
    /script-src 'self'/,
  );
  await page
    .getByRole("heading", { name: "Blue Sky Corner", exact: true })
    .waitFor();
  assert.equal(await page.locator("main section").count(), 7);
  await page
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode())),
    );
  const audio = page.locator("audio");
  assert.equal(
    await audio.evaluate((element) => element.paused && !element.autoplay),
    true,
  );
  await page.getByRole("button", { name: "中文", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page
    .getByRole("button", { name: "Open album: Let's see the sea", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close album", exact: true }).click();
  await page.getByRole("button", { name: "Confirmed", exact: true }).click();
  assert.equal(await page.locator(".visit").count(), 1);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await page
    .getByRole("button", { name: "Pause music", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  await page.getByLabel("Your name").fill("Deployment check");
  await page.getByLabel("Your message").fill("Local-only test message.");
  await page.getByRole("button", { name: "Post message", exact: true }).click();
  await page.getByText("Local-only test message.", { exact: true }).waitFor();
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
      modules: 7,
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
