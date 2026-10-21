import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("all modules load locally, with no page errors or unexpected requests", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  await page.reload();
  await page.getByRole("button", { name: "中文", exact: true }).click();
  for (const name of [
    "个人档",
    "我的日志",
    "有空见个面",
    "我的相册",
    "音乐盒",
    "留言板",
    "小站足迹",
  ]) {
    await expect(
      page.getByRole("heading", { name: new RegExp(name) }),
    ).toBeVisible();
  }
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  expect(errors).toEqual([]);
  expect(
    requests.filter(
      (url) =>
        !url.startsWith(`${baseURL}/`) &&
        !url.startsWith(`${baseURL?.replace(/^http/, "ws")}/`),
    ),
  ).toEqual([]);
  expect(requests.some((url) => url.includes("/api/"))).toBe(false);
});

test("navigation and diary expansion work", async ({ page }) => {
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "日志", exact: true })
    .click();
  await expect(page).toHaveURL(/#diary$/);
  const read = page.getByRole("button", { name: "阅读全文" }).first();
  await read.click();
  await expect(page.getByText("傍晚去了河边", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "收起日志" }).click();
  await expect(
    page.getByText("傍晚去了河边", { exact: false }),
  ).not.toBeVisible();
});

test("availability filters, dates, empty state, and recovery", async ({
  page,
}) => {
  await page.getByRole("button", { name: "已确定", exact: true }).click();
  await expect(
    page.getByText("河边散步，顺便喝汽水", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("旧书店淘书", { exact: true })).toHaveCount(0);
  await page.getByLabel("筛选日期").selectOption("08.26");
  await expect(
    page.getByText("这一天没有符合筛选的安排。换个筛选看看吧。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "还在想", exact: true }).click();
  await expect(page.getByText("旧书店淘书", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "全部", exact: true }).click();
  await page.getByLabel("筛选日期").selectOption("all");
  await expect(page.locator(".visit")).toHaveCount(2);
});

test("album opens, closes with keyboard and button, and restores focus", async ({
  page,
}) => {
  const open = page.getByRole("button", { name: "打开相册：去看海吧" });
  await open.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.click();
  await page.getByRole("button", { name: "关闭相册" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(open).toBeFocused();
});

test("guestbook validates, renders literal text, stays local and resets", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") writes.push(request.url());
  });
  await page.getByRole("button", { name: "发表留言" }).click();
  await expect(page.getByRole("status")).toContainText("请填写昵称和留言内容");
  await page.getByLabel("你的昵称").fill("测试来客");
  const text = "<img src=x onerror=alert(1)> 晴天真好";
  await page.getByLabel("留言内容").fill(text);
  await page.getByRole("button", { name: "发表留言" }).click();
  await expect(page.getByRole("status")).toContainText("留言已添加到本页");
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(page.locator('.messages img[src="x"]')).toHaveCount(0);
  expect(writes).toEqual([]);
  await page.reload();
  await expect(page.getByText(text, { exact: true })).toHaveCount(0);
});

test("real audio is paused initially and supports play, pause, seek, volume and stop", async ({
  page,
}) => {
  const audio = page.locator("audio");
  expect(
    await audio.evaluate(
      (element: HTMLAudioElement) => element.paused && !element.autoplay,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "播放音乐" }).click();
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.currentTime),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "暂停音乐" }).click();
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.paused),
  ).toBe(true);
  await page.getByLabel("播放进度").fill("10");
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.currentTime),
    )
    .toBeCloseTo(10, 0);
  await page.getByLabel("音量", { exact: true }).fill("0.2");
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.volume),
  ).toBeCloseTo(0.2);
  await page.getByLabel("播放进度").fill("23.8");
  await page.getByRole("button", { name: "播放音乐" }).click();
  await expect(page.getByText("播放完毕", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "停止", exact: true }).click();
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.currentTime),
  ).toBe(0);
});

test("audio failure is visible and does not pretend to play", async ({
  page,
}) => {
  await page.route("**/summer.wav", (route) => route.abort());
  await page.reload();
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.getByText("音乐暂时无法载入")).toBeVisible();
  await expect(page.getByRole("button", { name: "播放音乐" })).toBeDisabled();
});

test("phone layouts and dialogs fit 320, 390, 430 and landscape widths", async ({
  page,
}) => {
  for (const width of [320, 390, 430, 720]) {
    await page.setViewportSize({ width, height: width === 720 ? 390 : 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "打开相册：路过的小风景" }).click();
    const box = await page
      .getByRole("button", { name: "关闭相册" })
      .boundingBox();
    expect(
      box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width,
    ).toBeTruthy();
    await page.getByRole("button", { name: "关闭相册" }).click();
    await page.getByLabel("留言内容").fill("很长的演示留言".repeat(40));
    await page.getByLabel("你的昵称").fill("窄屏测试");
    await page.getByRole("button", { name: "发表留言" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("enlarged text and a keyboard-sized viewport keep the form usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 360 });
  await page.addStyleTag({
    content:
      "p, h2, h3, a, button, label, input, textarea, dt, dd, time { font-size: 200% !important; overflow-wrap: anywhere; }",
  });
  await page.getByLabel("你的昵称").fill("放大文字");
  await page.getByLabel("留言内容").fill("放大后也能留言");
  await page.getByRole("button", { name: "发表留言" }).click();
  await expect(page.getByText("放大后也能留言", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("primary controls accept touch on phones and pointer on desktop", async ({
  page,
  isMobile,
}) => {
  const album = page.getByRole("button", { name: "打开相册：去看海吧" });
  if (isMobile) await album.tap();
  else await album.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const close = page.getByRole("button", { name: "关闭相册" });
  if (isMobile) await close.tap();
  else await close.click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const filter = page.getByRole("button", { name: "已确定", exact: true });
  if (isMobile) await filter.tap();
  else await filter.click();
  await expect(filter).toHaveAttribute("aria-pressed", "true");
});
