import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("English is the default, including fixtures, labels, metadata and errors", async ({
  page,
}) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Blue Sky Corner · Summer, take your time");
  await expect(
    page.getByRole("button", { name: "English", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const name of [
    "Profile",
    "My diary",
    "Let's meet",
    "Photo albums",
    "Music box",
    "Guestbook",
    "Visitors",
  ]) {
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "Jamie LinOnline", exact: true }),
  ).toBeVisible();
  expect(
    (await page.locator("body").innerText()).replace("中文", ""),
  ).not.toMatch(/[\u4e00-\u9fff]/);
  const labels = await page
    .locator("[aria-label], img[alt], [placeholder]")
    .evaluateAll((elements) =>
      elements
        .flatMap((element) =>
          ["aria-label", "alt", "placeholder"].map(
            (attribute) => element.getAttribute(attribute) ?? "",
          ),
        )
        .filter((label) => !label.includes("Language /")),
    );
  expect(labels.join(" ")).not.toMatch(/[\u4e00-\u9fff]/);
  await page.getByRole("button", { name: "Post message", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Please enter a name and a message.",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("English interactions work and language switches preserve local content and state", async ({
  page,
}) => {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Diary", exact: true })
    .click();
  await expect(page).toHaveURL(/#diary$/);
  await page.getByRole("button", { name: "Read more" }).first().click();
  await expect(
    page.getByText("In the evening I went down to the river", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmed", exact: true }).click();
  await page.getByLabel("Filter by date").selectOption("08.26");
  await expect(
    page.getByText(
      "No plans match this date and filter. Try another combination.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open album: Let's see the sea", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Let's see the sea",
  );
  await page.getByRole("button", { name: "Close album", exact: true }).click();
  await page.getByLabel("Your name").fill("Language visitor");
  await page.getByLabel("Your message").fill("Keep my words exactly: 晴空小站");
  await page.getByRole("button", { name: "Post message", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Message added to this page.",
  );
  await page.getByLabel("Your message").fill("Unsubmitted draft");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(
    page.getByRole("heading", { name: "晴空小站", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "收起日志" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "已确定", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("留言内容")).toHaveValue("Unsubmitted draft");
  await expect(
    page.getByText("Keep my words exactly: 晴空小站", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByLabel("Your message")).toHaveValue(
    "Unsubmitted draft",
  );
  await expect(
    page.getByText("Keep my words exactly: 晴空小站", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Read less" })).toBeVisible();
});

test("English audio controls and failure copy are functional", async ({
  page,
}) => {
  const audio = page.locator("audio");
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.paused),
  ).toBe(true);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.currentTime),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.getByRole("button", { name: "暂停音乐" })).toBeVisible();
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.paused),
  ).toBe(false);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  await page.getByLabel("Playback position").fill("10");
  await page.getByLabel("Volume", { exact: true }).fill("0.2");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.route("**/summer.wav", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByText("Unable to load this track", { exact: true }),
  ).toBeVisible();
});

test("both languages and their switch fit narrow phones and desktop", async ({
  page,
}) => {
  for (const width of [320, 390, 430, 800, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of ["English", "中文"]) {
      await page.getByRole("button", { name: language, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const controls = await page
        .getByRole("group", { name: "Language / 语言" })
        .boundingBox();
      expect(
        controls && controls.x >= 0 && controls.x + controls.width <= width,
      ).toBeTruthy();
    }
  }
});
