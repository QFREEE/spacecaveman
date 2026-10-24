import { test, expect } from "./fixtures";

test("public borough is localized and disappears when the observation expires", async ({
  page,
}) => {
  const now = new Date("2026-10-24T12:00:00Z");
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await page.route("**/api/presence/public", (route) =>
    route.fulfill({
      json: {
        status: "in_nyc",
        borough: "queens",
        observed_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 10_000).toISOString(),
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".presence-borough")).toHaveText("Queens");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator(".presence-borough")).toHaveText("皇后区");
  await page.clock.fastForward(10_001);
  await expect(page.locator(".presence-borough")).toHaveCount(0);
  await expect(page.locator("#nyc").getByRole("status")).toHaveText(
    "还没有更新。",
  );
});
