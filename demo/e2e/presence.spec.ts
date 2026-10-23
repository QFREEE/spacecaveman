import { test, expect } from "./fixtures";

test("answer reveals once, remains accessible, and motion opt-outs show it immediately", async ({
  page,
}) => {
  await page.route("**/api/presence/public", (route) =>
    route.fulfill({
      json: { status: "unknown", observed_at: null, expires_at: null },
    }),
  );
  await page.goto("/");
  const answer = page.locator("#nyc").getByRole("status");
  await expect(answer).toHaveText("No update yet.");
  await expect(answer).toHaveAttribute("aria-atomic", "true");
  await expect(page.locator("#nyc")).not.toContainText("Loading");
  const reveal = await answer.evaluate((node) => {
    const animation = node.getAnimations()[0];
    if (!animation) throw new Error("Missing answer reveal");
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
  await page
    .locator(".space-shell")
    .evaluate((node) => node.classList.remove("motion-off"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(answer).toHaveCSS("animation-name", "none");
  await expect(answer).toHaveCSS("opacity", "1");
  await expect(answer).toHaveCSS("transform", "none");
});

test("homepage shows latest presence, expires locally, and refreshes the report", async ({
  page,
}) => {
  const now = Date.now();
  await page.clock.install({ time: new Date(now) });
  await page.clock.pauseAt(new Date(now));
  let report = {
    status: "not_in_nyc",
    observed_at: new Date(now).toISOString(),
    expires_at: new Date(now + 2000).toISOString(),
  };
  await page.route("**/api/presence/public", (route) =>
    route.fulfill({ json: report }),
  );
  await page.goto("/");
  const presence = page.getByRole("region", { name: "Live NYC status" });
  await expect(presence.getByRole("status")).toHaveText(
    "Nope! Chilling in the woods",
  );
  await expect(presence).toContainText("Just updated");
  await expect(presence.locator("time, [datetime]")).toHaveCount(0);
  await expect(presence).not.toContainText(report.observed_at);
  await page.screenshot({
    path: `outputs/presence-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.clock.fastForward(2100);
  await expect(presence.getByRole("status")).toHaveText("No update yet.");
  report = {
    status: "in_nyc",
    observed_at: new Date(now + 60_000).toISOString(),
    expires_at: new Date(now + 120_000).toISOString(),
  };
  await page.clock.fastForward(60_000);
  await expect(presence.getByRole("status")).toHaveText("Yep!");
  await expect(presence).toContainText("Just updated");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "实时纽约状态" }).getByRole("status"),
  ).toHaveText("在，我在纽约！");
  await expect(
    page.getByRole("region", { name: "实时纽约状态" }),
  ).toContainText("刚刚更新");
});

test("update age stays approximate and advances when refreshing fails", async ({
  page,
}) => {
  const now = new Date("2026-10-22T12:00:00Z");
  await page.clock.install({ time: now });
  let unavailable = false;
  await page.route("**/api/presence/public", (route) =>
    unavailable
      ? route.fulfill({ status: 503, json: { error: "Unavailable" } })
      : route.fulfill({
          json: {
            status: "in_nyc",
            observed_at: now.toISOString(),
            expires_at: new Date(now.getTime() + 6 * 60 * 60_000).toISOString(),
          },
        }),
  );
  await page.goto("/");
  const presence = page.locator(".presence-strip");
  await expect(presence).toContainText("Just updated");
  unavailable = true;
  const windows = [
    [4, "Just updated", "刚刚更新"],
    [5, "A few minutes ago", "几分钟前更新"],
    [14, "A few minutes ago", "几分钟前更新"],
    [15, "Within the last half hour", "半小时内更新"],
    [29, "Within the last half hour", "半小时内更新"],
    [30, "Within the last hour", "一小时内更新"],
    [59, "Within the last hour", "一小时内更新"],
    [60, "About an hour ago", "约一小时前更新"],
    [119, "About an hour ago", "约一小时前更新"],
    [120, "About 2 hours ago", "约两小时前更新"],
    [179, "About 2 hours ago", "约两小时前更新"],
    [180, "About 3 hours ago", "约三小时前更新"],
    [239, "About 3 hours ago", "约三小时前更新"],
    [240, "Several hours ago", "几小时前更新"],
  ] as const;
  let previousMinutes = 0;
  for (const [minutes, english, chinese] of windows) {
    await page.clock.fastForward((minutes - previousMinutes) * 60_000);
    await expect(presence.locator(".presence-detail > span")).toHaveText(
      english,
    );
    await expect(presence).toContainText("Could not refresh");
    await expect(presence.getByRole("status")).toHaveText("Yep!");
    await page.getByRole("button", { name: "中文", exact: true }).click();
    await expect(presence.locator(".presence-detail > span")).toHaveText(
      chinese,
    );
    await page.getByRole("button", { name: "English", exact: true }).click();
    previousMinutes = minutes;
  }
  await expect(presence.locator("time, [datetime]")).toHaveCount(0);
  await expect(presence).not.toContainText("12:00");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await page.clock.fastForward(120 * 60_000 + 1);
  await expect(presence.getByRole("status")).toHaveText("还没有更新。");
});

test("homepage shows unknown when the presence API is unavailable", async ({
  page,
}) => {
  await page.route("**/api/presence/public", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/");
  const presence = page.getByRole("region", { name: "Live NYC status" });
  await expect(presence.getByRole("status")).toHaveText("No update yet.");
  await expect(presence).toContainText("Could not refresh");
});
