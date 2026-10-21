import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("accepted lunar design stays the default and restores without visual drift", async ({
  page,
}) => {
  const shell = page.locator(".space-shell");
  await expect(shell).toHaveAttribute("data-theme", "lunar");
  await expect(shell).toHaveCSS("background-color", "rgb(25, 25, 25)");
  await expect(page.locator(".masthead")).toHaveCSS(
    "background-color",
    "rgb(23, 23, 23)",
  );
  await expect(page.locator("#profile")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  const profileBefore = await page.locator("#profile").screenshot();
  const headerBefore = await page.locator(".masthead").screenshot();
  await page.getByRole("button", { name: "Blue hour", exact: true }).click();
  await expect(shell).toHaveAttribute("data-theme", "blue-hour");
  await expect(shell).toHaveCSS("background-color", "rgb(220, 234, 244)");
  await page
    .getByRole("button", { name: "Restore default skin", exact: true })
    .click();
  await expect(shell).toHaveAttribute("data-theme", "lunar");
  expect(await page.locator("#profile").screenshot()).toEqual(profileBefore);
  expect(await page.locator(".masthead").screenshot()).toEqual(headerBefore);
});

test("switching themes preserves flower, guestbook, filters, language, ornaments and actual audio", async ({
  page,
  isMobile,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });
  await page
    .locator("#flower")
    .getByRole("button", { name: "Water", exact: true })
    .click();
  await page.getByLabel("Your name").fill("Moon visitor");
  await page.getByLabel("Your message").fill("Keep this local message.");
  await page.getByRole("button", { name: "Post message", exact: true }).click();
  await page.getByLabel("Your message").fill("Keep my draft too.");
  await page.getByRole("button", { name: "Confirmed", exact: true }).click();
  await page.getByRole("button", { name: "Read more" }).first().click();
  await page.getByRole("button", { name: "Paper", exact: true }).click();
  await page.getByLabel("Saturn pendant").uncheck();
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  const audio = page.locator("audio");
  await expect
    .poll(() => audio.evaluate((el: HTMLAudioElement) => el.currentTime))
    .toBeGreaterThan(0);
  const timeBefore = await audio.evaluate(
    (el: HTMLAudioElement) => el.currentTime,
  );
  const choose = page.getByRole("button", { name: "Blue hour", exact: true });
  if (isMobile) await choose.tap();
  else await choose.click();
  await expect(page.locator(".space-shell")).toHaveAttribute(
    "data-theme",
    "blue-hour",
  );
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(
    page.getByText("Keep this local message.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue(
    "Keep my draft too.",
  );
  await expect(
    page.getByRole("button", { name: "Confirmed", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Read less" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Paper", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Saturn pendant")).not.toBeChecked();
  await expect
    .poll(() => audio.evaluate((el: HTMLAudioElement) => el.currentTime))
    .toBeGreaterThan(timeBefore);
  expect(await audio.evaluate((el: HTMLAudioElement) => el.paused)).toBe(false);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "月光蓝", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("meter", { name: "雨露", exact: true }),
  ).toHaveAttribute("value", "1");
  await page.getByRole("button", { name: "恢复默认装扮", exact: true }).click();
  await expect(page.locator(".space-shell")).toHaveAttribute(
    "data-theme",
    "lunar",
  );
  await expect(page.getByLabel("土星挂件")).toBeChecked();
  await expect(
    page.getByRole("meter", { name: "雨露", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(page.getByLabel("留言内容")).toHaveValue("Keep my draft too.");
  expect(writes).toEqual([]);
  await page.reload();
  await expect(page.locator(".space-shell")).toHaveAttribute(
    "data-theme",
    "lunar",
  );
});

test("each skin fits phone widths in both languages and retains reduced-motion behavior", async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const language of ["English", "中文"]) {
      await page.getByRole("button", { name: language, exact: true }).click();
      for (const name of language === "English"
        ? ["Lunar ink", "Blue hour"]
        : ["月球黑白", "月光蓝"]) {
        const button = page.getByRole("button", { name, exact: true });
        await button.click();
        await expect(button).toHaveAttribute("aria-pressed", "true");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await expect(page.locator(".caveman-traveler")).toHaveCSS(
          "animation-name",
          "none",
        );
        const box = await button.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
  if (testInfo.project.name === "desktop") {
    await page.getByRole("button", { name: "English", exact: true }).click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page
        .getByRole("button", { name: "Blue hour", exact: true })
        .click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `outputs/theme-preview/blue-hour-${width}.png`,
      });
    }
  }
});
