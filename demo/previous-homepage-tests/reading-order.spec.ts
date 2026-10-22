import { test, expect } from "@playwright/test";

test("DOM, phone visual order, and real Tab navigation agree in both languages", async ({
  page,
}) => {
  await page.goto("/");
  const expectedOrder = [
    "profile",
    "flower",
    "diary",
    "meetup",
    "albums",
    "music",
    "dressup",
    "guestbook",
    "visitors",
  ];
  for (const width of [320, 390, 430, 720, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const language of ["English", "中文"]) {
      await page.getByRole("button", { name: language, exact: true }).click();
      const modules = page.locator("main .module");
      // Screen-reader source order must match the intended phone reading order.
      expect(
        await modules.evaluateAll((items) => items.map((item) => item.id)),
      ).toEqual(expectedOrder);
      expect(
        await modules.evaluateAll((items) =>
          items.every((item) => getComputedStyle(item).order === "0"),
        ),
      ).toBe(true);
      if (width <= 720) {
        const boxes = await modules.evaluateAll((items) =>
          items.map((item) => {
            const box = item.getBoundingClientRect();
            return { top: box.top, bottom: box.bottom };
          }),
        );
        for (let i = 1; i < boxes.length; i++)
          expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
      }
      await page.locator("#albums .album").last().focus();
      await page.keyboard.press("Tab");
      await expect(page.locator("#seek")).toBeFocused();
      await page.locator("#dressup .restore-skin").focus();
      await page.keyboard.press("Tab");
      await expect(page.locator("#guestbook input")).toBeFocused();
      await page.locator('#guestbook button[type="submit"]').focus();
      await page.keyboard.press("Tab");
      await expect(page.locator('footer a[href="#home"]')).toBeFocused();
    }
  }
});
