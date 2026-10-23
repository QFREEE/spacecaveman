import { test, expect } from "./fixtures";

test("presence waits for its request while local care is immediately usable", async ({
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
  await page.goto("/");
  const nyc = page.locator("#nyc");
  const flower = page.locator("#flower");
  await expect(nyc.getByRole("status")).toHaveText("Checking if I’m in NYC…");
  await expect(nyc.locator("[data-scene]")).toHaveCount(0);
  await expect(flower.locator(".plant-notice")).toHaveCount(0);
  await expect(flower.locator(".watercolor-flower")).toBeVisible();
  await expect(flower.getByRole("meter")).toHaveCount(4);
  await expect(flower).not.toContainText("Level 1");
  await expect(
    flower.getByRole("button", { name: "Water", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: `outputs/widget-loading-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(nyc.getByRole("status")).toHaveText("正在确认我在不在纽约…");
  await expect(flower.locator(".plant-notice")).toHaveCount(0);
  release();
  await expect(nyc.locator("[data-scene]")).toHaveAttribute(
    "data-scene",
    "not_in_nyc",
  );
  await expect(flower.locator(".flower-stage")).toHaveAttribute(
    "data-stage",
    "0",
  );
  await expect(flower.getByRole("meter")).toHaveCount(4);
  await expect(flower.locator(".flower-stage svg")).toBeVisible();
});

test("presence timeout does not block local plant care", async ({ page }) => {
  await page.clock.install();
  await page.route("**/api/presence/public", () => {});
  await page.goto("/");
  await page.clock.fastForward(10001);
  await expect(page.locator("#nyc").getByRole("status")).toHaveText(
    "No update yet.",
  );
  await page.getByRole("button", { name: "Water", exact: true }).click();
  await expect(page.getByRole("meter").first()).toHaveAttribute("value", "8");
  await expect(page.getByRole("button", { name: "New plant" })).toBeEnabled();
});
