import { test, expect } from "./fixtures";

test.use({ timezoneId: "Asia/Tokyo" });

test("New York clock and calendar roll over together regardless of visitor timezone", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T04:59:30Z") });
  await page.goto("/");
  const widget = page.locator(".space-time");
  await expect(widget.locator(".sr-only")).toHaveText(
    /New York:.*December 31, 2025.*11:59/,
  );
  expect(await widget.ariaSnapshot()).toContain("New York: Wednesday");
  await expect(widget.locator(".calendar-day")).toHaveText("31");
  await expect(widget.locator(".clock-minute")).toHaveAttribute(
    "transform",
    "rotate(354 40 40)",
  );
  await page.clock.runFor(30000);
  await expect(widget.locator(".calendar-month")).toHaveText("Jan");
  await expect(widget.locator(".calendar-day")).toHaveText("1");
  await expect(widget.locator(".clock-hour")).toHaveAttribute(
    "transform",
    "rotate(0 40 40)",
  );
  await expect(widget.locator(".sr-only")).toHaveText(/January 1, 2026.*12:00/);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(widget.locator(".sr-only")).toHaveText(/纽约时间/);
  await expect(widget.locator(".calendar-month")).toHaveText("1月");
  await expect(widget.locator(".calendar-weekday")).toHaveText("周四");
});

test("clock follows New York daylight saving and refreshes after tab focus", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-03-08T06:59:30Z") });
  await page.goto("/");
  const widget = page.locator(".space-time");
  await expect(widget.locator(".sr-only")).toHaveText(/1:59/);
  await page.clock.runFor(30000);
  await expect(widget.locator(".sr-only")).toHaveText(/3:00/);
  await expect(widget.locator(".clock-hour")).toHaveAttribute(
    "transform",
    "rotate(90 40 40)",
  );
  await page.clock.setSystemTime(new Date("2026-03-08T12:15:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(widget.locator(".sr-only")).toHaveText(/8:15/);
});

test("instruments fit the header in both languages without extra motion", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-10-22T14:10:00Z") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hanging-planet")).toHaveCount(0);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const language of ["English", "中文"]) {
      await page.getByRole("button", { name: language, exact: true }).click();
      const widget = await page.locator(".space-time").boundingBox();
      const heading = await page.locator("h1").boundingBox();
      const header = await page.locator(".masthead").boundingBox();
      expect(widget!.x).toBeGreaterThanOrEqual(header!.x);
      expect(widget!.x + widget!.width).toBeLessThanOrEqual(
        header!.x + header!.width,
      );
      expect(widget!.y + widget!.height).toBeLessThanOrEqual(
        header!.y + header!.height,
      );
      expect(
        widget!.y >= heading!.y + heading!.height ||
          widget!.x >= heading!.x + heading!.width,
      ).toBe(true);
      await expect(page.locator(".clock-minute")).toHaveCSS(
        "animation-name",
        "none",
      );
      if (testInfo.project.name === "desktop") {
        await page.screenshot({
          path: `outputs/space-time-${width}-${language}.png`,
          fullPage: true,
        });
      }
    }
  }
});
