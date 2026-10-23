import { test, expect } from "./fixtures";

test("language changes translate metadata, feedback and accessibility without resetting state", async ({
  page,
}) => {
  await page.route("**/api/presence/public", (route) =>
    route.fulfill({
      json: {
        status: "in_nyc",
        observed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Water", exact: true }).click();
  const flower = page.locator("#flower");
  await expect(flower.getByRole("status")).toHaveCount(0);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page).toHaveTitle("Yuntong’s space");
  await expect(page.locator("h1")).toHaveText("Yuntong’s space");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Yuntong’s space：纽约状态、花藤和访问次数。",
  );
  await expect(
    page.getByRole("button", { name: "中文", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "English", exact: true }),
  ).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("region", { name: "实时纽约状态" }).getByRole("status"),
  ).toHaveText("在，我在纽约！");
  await expect(flower.getByRole("status")).toHaveCount(0);
  await expect(
    page.getByRole("meter", { name: "雨露", exact: true }),
  ).toHaveAttribute("value", "6");
  await expect(page.locator(".counter")).toHaveText("000001");
  await expect(
    page.getByRole("button", { name: "详情", exact: true }),
  ).toHaveCount(0);
  expect(await page.locator("main").innerText()).not.toMatch(
    /Watered|Care log|Total page views|flower\./,
  );
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Yuntong’s space: NYC status, a flower and page views.",
  );
  await expect(flower.getByRole("status")).toHaveCount(0);
  expect(
    (await page.locator("body").innerText()).replace("中文", ""),
  ).not.toMatch(/[\u4e00-\u9fff]/);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "6");
});

test("unavailable messages and retry controls switch languages together", async ({
  page,
}) => {
  await page.route("**/api/visitors", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.route("**/api/presence/public", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/");
  await expect(
    page.locator("#flower").getByRole("button", { name: "Water", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("#visitors")).toContainText(
    "Visit count is temporarily unavailable.",
  );
  await expect(page.locator("#nyc")).toContainText("Could not refresh");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    page.locator("#flower").getByRole("button", { name: "浇花", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("#visitors")).toContainText("访问计数暂时不可用。");
  await expect(page.locator("#nyc")).toContainText("暂时无法刷新");
  await expect(
    page.getByRole("button", { name: "重试", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "新植物", exact: true }),
  ).toBeVisible();
});
