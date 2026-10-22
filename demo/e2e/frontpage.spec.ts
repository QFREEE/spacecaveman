import { test, expect } from "@playwright/test";

test("front page contains exactly NYC, flower and sample visitor count, without errors or API requests", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Space Caveman · My little Qzone");
  expect(
    await page
      .locator("main .module")
      .evaluateAll((items) => items.map((item) => item.id)),
  ).toEqual(["nyc", "flower", "visitors"]);
  await expect(
    page.getByRole("heading", { name: "Am I in NYC?", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#nyc .presence-answer")).toContainText("Unknown");
  await expect(
    page.locator("#nyc").getByText("No public update yet."),
  ).toBeVisible();
  await expect(page.getByLabel("Sample visit count: 1286")).toHaveText(
    "001286",
  );
  await expect(
    page.getByText("Decorative counter · sample data"),
  ).toBeVisible();
  await expect(
    page.locator(
      "#profile, #diary, #meetup, #albums, #music, #dressup, #guestbook",
    ),
  ).toHaveCount(0);
  expect(
    (await page.locator("body").innerText()).replace("中文", ""),
  ).not.toMatch(/[\u4e00-\u9fff]/);
  expect(
    await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links.every((link) =>
          document.getElementById((link as HTMLAnchorElement).hash.slice(1)),
        ),
      ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(
    requests.filter(
      (url) =>
        !url.startsWith(`${baseURL}/`) &&
        !url.startsWith(`${baseURL?.replace(/^http/, "ws")}/`),
    ),
  ).toEqual([]);
  expect(
    requests.some(
      (url) => url.includes("/api/") || url.includes("presence-trial"),
    ),
  ).toBe(false);
});

test("navigation and keyboard follow the three-module reading order on phones and desktop", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 390, 430, 720, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const language of ["English", "中文"]) {
      await page.getByRole("button", { name: language, exact: true }).click();
      const nav = page.getByRole("navigation");
      const label = language === "English" ? "Visitors" : "小站足迹";
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(/#visitors$/);
      await nav.getByRole("link", { name: label, exact: true }).focus();
      await page.keyboard.press("Tab");
      await expect(page.locator(".care-actions button").first()).toBeFocused();
      await page.locator(".plant-tools button").last().focus();
      await page.keyboard.press("Tab");
      await expect(page.locator('footer a[href="#home"]')).toBeFocused();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width <= 720) {
        const boxes = await page.locator("main .module").evaluateAll((items) =>
          items.map((item) => {
            const r = item.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom };
          }),
        );
        for (let i = 1; i < boxes.length; i++)
          expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
      }
    }
  }
});

test("public NYC status remains unknown and flower care survives language changes", async ({
  page,
}) => {
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Water", exact: true }).click();
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.getByRole("heading", { name: /我在纽约吗/ })).toBeVisible();
  await expect(page.locator(".presence-answer")).toHaveAttribute(
    "data-status",
    "unknown",
  );
  await expect(page.locator(".presence-answer")).toContainText("未知");
  await expect(
    page.getByRole("meter", { name: "雨露", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(page.getByText("装饰计数器 · 样本数据")).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "1");
  await page.reload();
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "0");
  await expect(page.locator(".presence-answer")).toContainText("Unknown");
});

test("enlarged text and flower properties fit a short phone viewport", async ({
  page,
}) => {
  await page.goto("/");
  await page.setViewportSize({ width: 320, height: 360 });
  await page.addStyleTag({
    content:
      "p, h2, a, button, label { font-size: 200% !important; overflow-wrap: anywhere; }",
  });
  await page
    .getByRole("button", { name: "Properties / log", exact: true })
    .click();
  await expect(
    page.getByText("Growth follows the lowest of the four values."),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
