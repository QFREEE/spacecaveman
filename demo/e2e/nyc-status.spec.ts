import { test, expect } from "./fixtures";

for (const [status, english, chinese] of [
  ["in_nyc", "Yes, I’m in NYC!", "在，我在纽约！"],
  ["not_in_nyc", "No, I am in the woods.", "不在，我在树林里。"],
  ["unknown", "No update yet.", "还没有更新。"],
]) {
  test(`NYC ${status} copy fits in both languages`, async ({ page }) => {
    await page.route("**/api/presence/public", (route) =>
      route.fulfill({
        json: {
          status,
          observed_at: status === "unknown" ? null : new Date().toISOString(),
          expires_at:
            status === "unknown"
              ? null
              : new Date(Date.now() + 60_000).toISOString(),
        },
      }),
    );
    await page.goto("/");
    const answer = page.locator("#nyc").getByRole("status");
    await expect(answer).toHaveText(english);
    await expect(answer).toHaveAttribute("data-status", status);
    const scene = page.locator("#nyc .nyc-skyline");
    await expect(scene).toHaveAttribute("aria-hidden", "true");
    await expect(scene).toHaveAttribute("data-scene", status);
    const actor = scene.locator(".nyc-scene-motion");
    if (status === "unknown") {
      await expect(actor).toHaveCount(0);
    } else {
      await expect(actor).toHaveClass(
        status === "in_nyc" ? /nyc-arriving-train/ : /nyc-woods-person/,
      );
      const timing = await page.locator("#nyc").evaluate((card) => {
        const animations = card.getAnimations({ subtree: true });
        animations.forEach((animation) => animation.pause());
        return animations.map(
          (animation) => animation.effect?.getTiming().duration,
        );
      });
      expect(timing).toEqual([1200, 1200]);
      for (const frame of [0, 600, 1200]) {
        await page.locator("#nyc").evaluate((card, time) => {
          card.getAnimations({ subtree: true }).forEach((animation) => {
            animation.currentTime = time;
          });
        }, frame);
        await page.locator("#nyc").screenshot({
          path: `outputs/nyc-scenes/${test.info().project.name}-${status}-${frame}.png`,
        });
      }
      await page.locator("#nyc").evaluate((card) => {
        card
          .getAnimations({ subtree: true })
          .forEach((animation) => animation.finish());
      });
      await expect(actor).toHaveCSS("animation-name", "none");
      await expect(actor).toHaveCSS("opacity", "1");
      await expect(actor).toHaveCSS("transform", "none");

      await expect(actor).toHaveCSS("animation-name", "none");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload();
      await expect(actor).toHaveCSS("animation-name", "none");
      await expect(actor).toHaveCSS("opacity", "1");
      await expect(actor).toHaveCSS("transform", "none");
    }
    await page.getByRole("button", { name: "中文", exact: true }).click();
    await expect(answer).toHaveText(chinese);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
