import { test, expect } from "./fixtures";

test("initial requests show loading without a default city or flower", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/presence/public", async (route) => {
    await gate;
    await route.fulfill({
      json: {
        status: "not_in_nyc",
        observed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60000).toISOString(),
      },
    });
  });
  await page.route("**/api/flower*", async (route) => {
    await gate;
    await route.fulfill({
      json: {
        stats: { rain: 34, sun: 34, love: 34, food: 34 },
        log: [],
        generation: 2,
        bloomed_at: null,
      },
    });
  });
  await page.goto("/");
  const nyc = page.locator("#nyc");
  const flower = page.locator("#flower");
  await expect(nyc.getByRole("status")).toHaveText("Checking if I’m in NYC…");
  await expect(nyc.locator("[data-scene]")).toHaveCount(0);
  await expect(flower.getByRole("status")).toHaveText("Loading the flower…");
  await expect(flower.locator(".flower-stage svg")).not.toBeVisible();
  await expect(flower.getByRole("meter")).toHaveCount(0);
  await expect(flower).not.toContainText("Level 1");
  await expect(
    flower.getByRole("button", { name: "Water", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: `outputs/widget-loading-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(nyc.getByRole("status")).toHaveText("正在确认我在不在纽约…");
  await expect(flower.getByRole("status")).toHaveText("正在读取花藤…");
  release();
  await expect(nyc.locator("[data-scene]")).toHaveAttribute(
    "data-scene",
    "not_in_nyc",
  );
  await expect(flower.locator(".flower-stage")).toHaveAttribute(
    "data-stage",
    "5",
  );
  await expect(flower.getByRole("meter")).toHaveCount(4);
  await expect(flower.locator(".flower-stage svg")).toBeVisible();
});

test("initial timeouts end loading and the flower can be retried", async ({
  page,
}) => {
  await page.clock.install();
  await page.route("**/api/presence/public", () => {});
  await page.route("**/api/flower*", () => {});
  await page.goto("/");
  await expect(page.locator("#nyc").getByRole("status")).toHaveText(
    "Checking if I’m in NYC…",
  );
  await page.clock.fastForward(10001);
  await expect(page.locator("#nyc").getByRole("status")).toHaveText(
    "No update yet.",
  );
  const flower = page.locator("#flower");
  await expect(flower.getByRole("status")).toHaveText(
    "The flower is temporarily unavailable.",
  );
  await expect(flower.locator(".flower-stage svg")).toHaveCount(0);
  await expect(flower.getByRole("meter")).toHaveCount(0);
  await page.route("**/api/flower*", (route) =>
    route.fulfill({
      json: {
        stats: { rain: 17, sun: 17, love: 17, food: 17 },
        log: [],
        generation: 1,
        bloomed_at: null,
      },
    }),
  );
  await flower.getByRole("button", { name: "Refresh plant" }).click();
  await expect(flower.locator(".flower-stage")).toHaveAttribute(
    "data-stage",
    "2",
  );
  await expect(
    flower.getByRole("button", { name: "Water", exact: true }),
  ).toBeEnabled();
});
