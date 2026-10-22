import { test, expect } from "./fixtures";

test("rapid confirmed care earns a translated thank-you without numeric counts", async ({
  page,
  flowerPlant,
}, testInfo) => {
  // Keep time frozen: an animation must never impose a delay before the next care.
  await page.clock.install();
  await page.goto("/");
  const flower = page.locator("#flower");
  const buttons = ["Water", "Sun", "Prune", "Feed"];
  for (let i = 0; i < 9; i++) {
    await flower
      .getByRole("button", { name: buttons[i % 4], exact: true })
      .click();
  }
  await expect(flower.getByRole("status")).not.toContainText("Thank you");
  flowerPlant.stats.rain = 50;
  await flower.getByRole("button", { name: "Water", exact: true }).click();
  await expect(flower.getByRole("status")).toHaveText("Already full.");
  await expect(flower.locator(".plant-meters")).not.toHaveAttribute(
    "data-recognition",
    "thanks",
  );
  await flower.getByRole("button", { name: "Sun", exact: true }).click();
  await expect(flower.getByRole("status")).toHaveText(
    "Thank you for giving our flower so much care!",
  );
  await expect(flower.locator(".plant-meters")).toHaveAttribute(
    "data-recognition",
    "thanks",
  );
  await expect(flower).not.toContainText(/\d/);
  await flower.screenshot({
    path: `outputs/flower-thanks-${testInfo.project.name}.png`,
  });
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(flower.getByRole("status")).toHaveText(
    "谢谢你这么用心地照料我们的花！",
  );
  flowerPlant.generation++;
  flowerPlant.stats = { rain: 0, sun: 0, love: 0, food: 0 };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(flower.getByRole("meter").first()).toHaveAttribute("value", "0");
  await expect(flower.locator(".plant-notice")).toBeEmpty();
  await expect(flower.locator(".plant-meters")).not.toHaveAttribute(
    "data-recognition",
  );
});

test("finishing every bar shows bloom gratitude with reduced motion", async ({
  page,
  flowerPlant,
}, testInfo) => {
  flowerPlant.stats = { rain: 49, sun: 49, love: 49, food: 49 };
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const flower = page.locator("#flower");
  for (const name of ["Water", "Sun", "Prune", "Feed"]) {
    await flower.getByRole("button", { name, exact: true }).click();
  }
  await expect(flower.getByRole("status")).toHaveText(
    "Our flower is in full bloom! Thank you for helping it grow.",
  );
  await expect(flower.locator(".plant-meters")).toHaveAttribute(
    "data-recognition",
    "bloom",
  );
  await expect(flower.locator(".care-effect")).toHaveCount(0);
  await flower.screenshot({
    path: `outputs/flower-bloom-thanks-${testInfo.project.name}.png`,
  });
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(flower.getByRole("status")).toHaveText(
    "我们的花盛开啦！谢谢你陪它长大。",
  );
  await expect(page.locator(".treasure-flag")).toHaveCount(0);
});

test("care is protected only while its request is pending", async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/flower?care=rain", async (route) => {
    await pending;
    await route.fallback();
  });
  await page.clock.install();
  await page.goto("/");
  const water = page
    .locator("#flower")
    .getByRole("button", { name: "Water", exact: true });
  await water.click();
  await expect(water).toBeDisabled();
  release();
  await expect(water).toBeEnabled();
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "1");
});
