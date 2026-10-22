import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("care advances four independent attributes and all growth stages, unlocks a usable ornament, then resets", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const flower = page.locator("#flower");
  const writes: string[] = [];
  page.on("request", (req) => {
    if (!["GET", "HEAD"].includes(req.method())) writes.push(req.url());
  });
  for (let level = 1; level <= 3; level++) {
    for (const [action, stat] of [
      ["Water", "Rain"],
      ["Sun", "Sunlight"],
      ["Prune", "Love"],
      ["Feed", "Nutrition"],
    ]) {
      const control = flower.getByRole("button", { name: action, exact: true });
      if (isMobile) await control.tap();
      else await control.click();
      await expect(
        flower.getByRole("meter", { name: stat, exact: true }),
      ).toHaveAttribute("value", String(level));
      // Overall growth waits for the least cared-for attribute.
      await expect(flower.locator(".flower-stage")).toHaveAttribute(
        "data-stage",
        String(action === "Feed" ? level : level - 1),
      );
    }
  }
  await expect(flower.getByRole("status")).toHaveText(
    "In bloom! You earned a Moon flag.",
  );
  await page.getByLabel("Moon flag · bloom reward").check();
  await expect(page.locator(".treasure-flag")).toBeVisible();
  await page.getByLabel("Moon flag · bloom reward").uncheck();
  await expect(page.locator(".treasure-flag")).toHaveCount(0);
  await flower.getByRole("button", { name: "Water", exact: true }).click();
  await expect(
    flower.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "3");
  await flower
    .getByRole("button", { name: "Properties / log", exact: true })
    .click();
  await expect(flower.locator(".plant-properties li")).toHaveCount(12);
  await flower.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(flower.locator(".flower-stage")).toHaveAttribute(
    "data-stage",
    "0",
  );
  await expect(flower.getByText("No care recorded yet.")).toBeVisible();
  expect(writes).toEqual([]);
  await page.reload();
  await expect(page.getByLabel("Moon flag · bloom reward")).toHaveCount(0);
  await expect(
    flower.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "0");
});

test("watering gives visible feedback without stage growth, rejects burst clicks and reports full attributes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const flower = page.locator("#flower");
  const water = flower.getByRole("button", { name: "Water", exact: true });
  // A burst in one event turn must not count as multiple care actions.
  await water.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
    button.click();
  });
  await expect(water).toBeDisabled();
  await expect(
    flower.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(flower.locator(".wet-soil")).toBeVisible();
  await expect(flower.locator(".flower-stage")).toHaveAttribute(
    "data-stage",
    "0",
  );
  await expect(flower.getByRole("status")).toContainText("Soil watered");
  await expect(water).toBeEnabled();
  for (let i = 0; i < 2; i++) {
    await water.click();
    await expect(water).toBeEnabled();
  }
  await water.click();
  await expect(flower.getByRole("status")).toHaveText(
    "This attribute is full. Try another kind of care.",
  );
  await flower.getByRole("button", { name: "Sun", exact: true }).click();
  await flower.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(water).toBeEnabled();
  await expect(flower.locator(".care-effect")).toHaveCount(0);
});

test("language preserves care and properties; keyboard and reduced motion work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const flower = page.locator("#flower");
  const water = flower.getByRole("button", { name: "Water", exact: true });
  await water.focus();
  await page.keyboard.press("Enter");
  await expect(
    flower.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(flower.locator(".care-effect")).toHaveCount(0);
  await expect(page.locator(".caveman-traveler")).toHaveCSS(
    "animation-name",
    "none",
  );
  await flower
    .getByRole("button", { name: "Properties / log", exact: true })
    .click();
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    flower.getByRole("meter", { name: "雨露", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(flower.getByRole("status")).toContainText("泥土湿润");
  await expect(
    flower.getByRole("button", { name: "属性 / 记录" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    flower.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(flower.getByRole("status")).toContainText("Soil watered");
});

test("pause stops and resumes all ambient motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  for (const selector of [
    ".caveman-traveler",
    ".walk-leg",
    ".hanging-planet",
  ]) {
    await expect(page.locator(selector).first()).toHaveCSS(
      "animation-play-state",
      "paused",
    );
  }
  await page
    .getByRole("button", { name: "Resume animation", exact: true })
    .click();
  await expect(page.locator(".caveman-traveler")).toHaveCSS(
    "animation-play-state",
    "running",
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
      await page.locator("#flower .plant-tools button").first().click();
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
