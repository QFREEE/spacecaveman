import { test, expect } from "./fixtures";

test("NYC answer reveals automatically and motion opt-outs show it immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const answer = page.locator("#nyc").getByRole("status");
  await expect(answer).toHaveText("No update yet.");
  await expect(answer).toHaveAttribute("aria-atomic", "true");
  const reveal = await answer.evaluate((node) => {
    const animation = node.getAnimations()[0];
    if (!animation) throw new Error("Missing NYC reveal");
    animation.pause();
    animation.currentTime = 0;
    const start = Number(getComputedStyle(node).opacity);
    animation.currentTime = 600;
    const middle = Number(getComputedStyle(node).opacity);
    animation.currentTime = 1200;
    const end = Number(getComputedStyle(node).opacity);
    animation.finish();
    return {
      duration: animation.effect?.getTiming().duration,
      start,
      middle,
      end,
    };
  });
  expect(reveal.duration).toBe(1200);
  expect(reveal.start).toBe(0.25);
  expect(reveal.middle).toBeGreaterThan(reveal.start);
  expect(reveal.middle).toBeLessThan(reveal.end);
  expect(reveal.end).toBe(1);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(answer).toHaveText("还没有更新。");
  await expect(answer).toHaveCSS("opacity", "1");
  await page
    .locator(".space-shell")
    .evaluate((node) => node.classList.add("motion-off"));
  await expect(answer).toHaveCSS("animation-name", "none");
  await expect(answer).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(answer).toHaveCSS("animation-name", "none");
  await expect(answer).toHaveCSS("opacity", "1");
  await expect(answer).toHaveCSS("transform", "none");
});

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
          observed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
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
      await page
        .locator(".space-shell")
        .evaluate((node) => node.classList.add("motion-off"));
      await page
        .locator(".space-shell")
        .evaluate((node) => node.classList.remove("motion-off"));
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
