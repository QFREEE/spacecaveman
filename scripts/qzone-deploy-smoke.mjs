import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const base = (process.argv[2] ?? "http://127.0.0.1:8799").replace(/\/$/, "");
const origin = new URL(base).origin;
const local = new URL(base).hostname === "127.0.0.1";
const label = local ? "package" : "deployed";
await mkdir("outputs/qzone-qa", { recursive: true });
const browser = await chromium.launch();
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
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
    if (request.method() !== "GET") writes.push(request.url());
  });
  const response = await page.goto(base);
  assert.equal(response.status(), 200);
  assert.match(response.headers()["cache-control"], /no-transform/);
  assert.match(
    response.headers()["content-security-policy"],
    /script-src 'self'/,
  );
  assert.equal(
    (await response.text()).includes("static.cloudflareinsights.com/beacon"),
    false,
  );
  await expect(
    page.getByRole("heading", { name: "Yuntong’s space", exact: true }),
  ).toBeVisible();
  assert.deepEqual(
    await page
      .locator("main .module")
      .evaluateAll((items) => items.map((item) => item.id)),
    ["nyc", "flower", "visitors"],
  );
  await expect(page.locator(".counter")).toHaveText(/\d{6,}/);
  await expect(
    page.getByRole("button", { name: "Water", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("region", { name: "Live NYC status" }),
  ).toBeVisible();
  await expect(page.locator(".presence-answer")).not.toHaveText("Loading…");
  assert.ok(
    ["in_nyc", "not_in_nyc", "unknown"].includes(
      await page.locator(".presence-answer").getAttribute("data-status"),
    ),
  );
  assert.doesNotMatch(
    await page.locator("body").innerText(),
    /DEMO|sample data|local flower demo/,
  );
  assert.equal(
    await page.locator("audio, #dressup, #guestbook, #albums, #meetup").count(),
    0,
  );
  const initialCount = Number(await page.locator(".counter").textContent());

  // Care belongs only to this browser context; no server request is made.
  const before = Number(
    await page
      .getByRole("meter", { name: "Rain", exact: true })
      .getAttribute("value"),
  );
  const completed = await page
    .locator("#flower meter")
    .evaluateAll(
      (meters) =>
        meters.filter((meter) => Number(meter.getAttribute("value")) === 50)
          .length,
    );
  const steps = [6, 4, 3, 5][completed] ?? 6;
  await page.getByRole("button", { name: "Water", exact: true }).click();
  const saved = {
    stats: {
      rain: Math.min(
        50,
        Math.round(((Math.round((before * steps) / 50) + 1) * 50) / steps),
      ),
    },
  };
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", String(saved.stats.rain));
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    page.getByRole("meter", { name: "雨露", exact: true }),
  ).toHaveAttribute("value", String(saved.stats.rain));
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Pause animation|Resume animation/ }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".counter")).toHaveText(/\d{6,}/);
  assert.ok(
    Number(await page.locator(".counter").textContent()) > initialCount,
  );
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", String(saved.stats.rain));
  const second = await context.newPage();
  await second.goto(base);
  await expect(
    second.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", String(saved.stats.rain));
  await second.close();
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of ["中文", "English"]) {
      await page.getByRole("button", { name: language, exact: true }).click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
    }
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: `outputs/qzone-qa/${label}-${width}.png`,
        fullPage: true,
      });
  }
  const views = await context.request.get(`${base}/api/visitors`);
  assert.equal(views.status(), 200);
  assert.ok(Number.isSafeInteger((await views.json()).views));
  const visits = await context.request.get(`${base}/api/visits`);
  assert.deepEqual((await visits.json()).visits, []);
  const legacy = await context.request.get(`${base}/visits`);
  assert.equal(legacy.status(), 200);
  assert.doesNotMatch(await legacy.text(), /Demo|sample visits/);
  const presence = await context.request.get(`${base}/presence`);
  assert.equal(presence.status(), 200);
  const protectedPresence = await context.request.get(`${base}/api/presence`);
  assert.ok([401, 503].includes(protectedPresence.status()));
  assert.ok(writes.every((url) => /\/api\/visitors$/.test(url)));
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    JSON.stringify({
      base,
      counter: "live D1 page views",
      flower:
        "browser-local, persisted across reload and a same-browser second page",
      careStatus: "browser-local",
      languages: "en/zh",
      phoneWidths: [320, 390, 430],
      securityHeaders: "preserved",
      privatePresence: protectedPresence.status(),
      errors,
    }),
  );
} finally {
  await browser.close();
}
