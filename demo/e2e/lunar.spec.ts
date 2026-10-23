import { test, expect } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("continuous care fills four drawing layers and persists without a flag or bloom message", async ({
  page,
  isMobile,
}) => {
  await page.evaluate(() => localStorage.setItem("spacecaveman:bloom", "1"));
  await page.reload();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const flower = page.locator("#flower");
  const pairs = [
    ["Water", "Rain"],
    ["Sun", "Sunlight"],
    ["Prune", "Love"],
    ["Feed", "Nutrition"],
  ];
  for (let round = 0; round < 10; round++) {
    for (let index = 0; index < pairs.length; index++) {
      const [action, stat] = pairs[index];
      const button = flower.getByRole("button", { name: action, exact: true });
      if (isMobile) await button.tap();
      else await button.click();
      await expect(
        flower.getByRole("meter", { name: stat, exact: true }),
      ).toHaveAttribute("value", String((round + 1) * 5));
      await expect(flower.locator(".flower-stage")).toHaveAttribute(
        "data-stage",
        String(Math.floor((round * 4 + index + 1) / 5)),
      );
      await expect(flower).not.toContainText(/\d/);
    }
  }
  await expect(flower.getByRole("status")).toHaveText(
    "Thank you for giving our flower so much care!",
  );
  await expect(flower).not.toContainText("Our flower is in full bloom!");
  await expect(page.locator(".treasure-flag")).toHaveCount(0);
  await expect(flower.getByRole("checkbox")).toHaveCount(0);
  await expect(
    flower.getByRole("button", { name: "Details", exact: true }),
  ).toHaveCount(0);
  await expect(
    flower.getByRole("button", { name: "Refresh plant" }),
  ).toBeEnabled();
  await page.reload();
  for (const [, stat] of pairs) {
    await expect(
      flower.getByRole("meter", { name: stat, exact: true }),
    ).toHaveAttribute("value", "50");
  }
  await expect(flower.locator(".flower-stage")).toHaveAttribute(
    "data-stage",
    "8",
  );
  await expect(flower.locator(".plant-notice")).toBeEmpty();
});

test("continuous watering gives immediate feedback and reports full attributes", async ({
  page,
  flowerPlant,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const flower = page.locator("#flower");
  const water = flower.getByRole("button", { name: "Water", exact: true });
  await expect(water).toBeEnabled();
  // Every click in the same event turn contributes to the queue.
  await water.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
    button.click();
  });
  await expect(
    flower.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "15");
  await expect(flower.locator('[data-paint="sketch"]')).toHaveAttribute(
    "data-progress",
    "0.3",
  );
  await expect(flower.locator(".flower-stage")).toHaveAttribute(
    "data-stage",
    "0",
  );
  await expect(flower.getByRole("status")).toContainText(
    "You’re helping our flower grow.",
  );
  await expect(water).toBeEnabled();
  flowerPlant.stats.rain = 50;
  await water.click();
  await expect(flower.getByRole("status")).not.toContainText("Already full.");
  await flower.getByRole("button", { name: "Sun", exact: true }).click();
  await flower
    .getByRole("button", { name: "Refresh plant", exact: true })
    .click();
  await expect(water).toBeEnabled();
  await expect(flower.locator(".care-effect")).toHaveCount(0);
});

test("language preserves care; keyboard and reduced motion work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const flower = page.locator("#flower");
  const water = flower.getByRole("button", { name: "Water", exact: true });
  await water.focus();
  await page.keyboard.press("Enter");
  await expect(
    flower.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "5");
  await expect(flower.locator(".care-effect")).toHaveCount(0);
  await expect(page.locator(".caveman-traveler")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    flower.getByRole("meter", { name: "雨露", exact: true }),
  ).toHaveAttribute("value", "5");
  await expect(flower.getByRole("status")).toContainText("已浇水。");
  await expect(flower.getByRole("button", { name: "详情" })).toHaveCount(0);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    flower.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "5");
  await expect(flower.getByRole("status")).toContainText("Watered.");
});

test("animation has no pause control and follows the device motion preference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(
    page.getByRole("button", { name: /Pause animation|Resume animation/ }),
  ).toHaveCount(0);
  await expect(page.locator(".caveman-traveler")).toHaveCSS(
    "animation-play-state",
    "running",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".caveman-traveler")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("three modules fit phones in both languages, with practical flower touch targets", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const language of ["English", "中文"]) {
      await page.getByRole("button", { name: language, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width < 721) {
        const flower = await page.locator("#flower").boundingBox();
        const nyc = await page.locator("#nyc").boundingBox();
        const visitors = await page.locator("#visitors").boundingBox();
        expect(nyc!.y + nyc!.height).toBeLessThanOrEqual(flower!.y);
        expect(flower!.y + flower!.height).toBeLessThanOrEqual(visitors!.y);
        for (const button of await page
          .locator(
            ".care-actions button, .skin-toolbar .bevel, .plant-tools button",
          )
          .all()) {
          const box = await button.boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(44);
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        }
      }
    }
  }
  await page.getByRole("button", { name: "English", exact: true }).click();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({
      path: `outputs/lunar-qzone/${testInfo.project.name}-${width}.png`,
      fullPage: true,
    });
    if (testInfo.project.name === "desktop") {
      await page.screenshot({
        path: `outputs/lunar-qzone/preview-${width}.png`,
      });
    }
  }
});
