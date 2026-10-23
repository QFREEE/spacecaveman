import { test, expect } from "./fixtures";

test("a new plant has a pot and seed, then grows with care and survives reload", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const flower = page.locator("#flower");
  const drawing = flower.locator(".watercolor-flower");
  await expect(drawing).toHaveAttribute("data-growth", "seed");
  await expect(flower.locator('[data-paint="initial-pot"] path')).toHaveCount(
    2,
  );
  await expect(flower.locator('[data-paint="seed"]')).toBeVisible();
  await flower.screenshot({
    path: `outputs/seed-preview/${testInfo.project.name}-seed.png`,
  });
  await flower.getByRole("button", { name: "Water", exact: true }).click();
  await expect(drawing).toHaveAttribute("data-growth", "sprout");
  await expect(flower.locator('[data-paint="seed"]')).toHaveCount(0);
  await expect(flower.locator('[data-paint="sprout"] path').first()).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await page.reload();
  await expect(drawing).toHaveAttribute("data-growth", "sprout");
  await flower.screenshot({
    path: `outputs/seed-preview/${testInfo.project.name}-sprout.png`,
  });
  await flower.getByRole("button", { name: "Water", exact: true }).click();
  await expect(drawing).toHaveAttribute("data-growth", "growing");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(flower.locator(".flower-ink-stroke").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await flower.locator(".plant-tools button").click();
  await expect(drawing).toHaveAttribute("data-growth", "seed");
  await expect(flower.locator('[data-paint="seed"]')).toBeVisible();
});
