import { test, expect } from "./fixtures";
const storageKey = "spacecaveman:plant:v1";
const actions = ["Water", "Sun", "Prune", "Feed"];
const layers = ["sketch", "pot", "leaves", "petals"];

test("local care is instant, capped, persistent, and makes no flower requests", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/flower")) requests.push(request.url());
  });
  await page.route("**/api/flower*", (route) => route.abort());
  await page.goto("/");
  const flower = page.locator("#flower");
  await flower
    .getByRole("button", { name: "Water", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      for (let i = 0; i < 12; i++) button.click();
    });
  await expect(flower.getByRole("meter").first()).toHaveAttribute(
    "value",
    "50",
  );
  await expect(flower.getByRole("status")).toHaveCount(0);
  await expect(flower).not.toContainText(/Already full|In full color|\d/);
  await page.reload();
  await expect(flower.getByRole("meter").first()).toHaveAttribute(
    "value",
    "50",
  );
  await expect(flower.getByRole("button", { name: "New plant" })).toBeEnabled();
  expect(requests).toEqual([]);
});

test("every plant has its own complete drawing and New plant shuffles without repeats and resets", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const flower = page.locator("#flower");
  await expect(flower.locator(".plant-name")).toHaveCount(0);
  const silhouettes = new Set<string>();
  const ids = ["cosmos", "tulip", "sunflower", "poppy", "lavender", "calla"];
  const seen = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    const id = (await flower
      .locator(".watercolor-flower")
      .getAttribute("data-plant"))!;
    expect(ids).toContain(id);
    expect(seen.has(id)).toBe(false);
    seen.add(id);
    await flower.locator(".care-actions button").evaluateAll((buttons) =>
      buttons.forEach((button, index) => {
        for (let i = 0; i < [8, 6, 3, 6][index]; i++)
          (button as HTMLButtonElement).click();
      }),
    );
    for (const meter of await flower.getByRole("meter").all())
      await expect(meter).toHaveAttribute("value", "50");
    await expect(flower.locator(".watercolor-flower")).toHaveAttribute(
      "data-renderer",
      "p5.brush",
      { timeout: 20000 },
    );
    await expect(page.locator("[data-p5-painter]")).toHaveCount(0);
    for (const layer of layers)
      await expect(flower.locator(`[data-paint="${layer}"]`)).toHaveAttribute(
        "data-progress",
        "1",
      );
    await expect(flower.locator(".plant-label")).toHaveCount(0);
    silhouettes.add(
      await flower
        .locator(".flower-ink-stroke")
        .evaluateAll((paths) =>
          paths.map((path) => path.getAttribute("d")).join(" "),
        ),
    );
    const pixels = await flower
      .locator("canvas[data-watercolor]")
      .evaluate((canvas: HTMLCanvasElement) => {
        const values = canvas
          .getContext("2d")!
          .getImageData(0, 0, canvas.width, canvas.height).data;
        let pigment = 0;
        for (let i = 3; i < values.length; i += 4) if (values[i] > 0) pigment++;
        return pigment;
      });
    expect(pixels).toBeGreaterThan(500);
    await flower.screenshot({
      path: `outputs/plant-${id}-${testInfo.project.name}.png`,
    });
    await flower.getByRole("button", { name: "New plant" }).click();
    for (const meter of await flower.getByRole("meter").all())
      await expect(meter).toHaveAttribute("value", "0");
    await expect(flower.locator(".plant-notice")).toHaveCount(0);
  }
  expect(silhouettes.size).toBe(6);
  const selected = await flower
    .locator(".watercolor-flower")
    .getAttribute("data-plant");
  await page.reload();
  await expect(flower.locator(".watercolor-flower")).toHaveAttribute(
    "data-plant",
    selected!,
  );
  await expect(flower.getByRole("meter").first()).toHaveAttribute("value", "0");
});

test("ranked partial progress and any first completed action choose the same drawing order", async ({
  page,
}) => {
  await page.goto("/");
  const flower = page.locator("#flower");
  for (const first of actions) {
    await flower
      .getByRole("button", { name: first, exact: true })
      .evaluate((button: HTMLButtonElement) => {
        for (let i = 0; i < 8; i++) button.click();
      });
    for (const [i, layer] of layers.entries())
      await expect(flower.locator(`[data-paint="${layer}"]`)).toHaveAttribute(
        "data-progress",
        i === 0 ? "1" : "0",
      );
    await flower.getByRole("button", { name: "New plant" }).click();
  }
  for (const stats of [
    { rain: 5, sun: 40, love: 20, food: 30 },
    { rain: 30, sun: 20, love: 40, food: 5 },
  ]) {
    await page.evaluate(
      ({ key, stats }) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            plantId: "cosmos",
            stats,
            careCount: 19,
          }),
        ),
      { key: storageKey, stats },
    );
    await page.reload();
    for (const [i, layer] of layers.entries())
      await expect(flower.locator(`[data-paint="${layer}"]`)).toHaveAttribute(
        "data-progress",
        String([0.8, 0.6, 0.4, 0.1][i]),
      );
  }
});

test("care survives language changes and midnight until New plant is pressed", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-22T23:59:00-04:00") });
  await page.goto("/");
  const flower = page.locator("#flower");
  await flower.getByRole("button", { name: "Feed", exact: true }).click();
  await expect(flower.locator(".effect-food svg")).toBeVisible();
  await page.clock.fastForward(120000);
  await expect(flower.getByRole("meter").last()).toHaveAttribute("value", "6");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    flower.getByRole("button", { name: "新植物", exact: true }),
  ).toBeVisible();
  await flower.getByRole("button", { name: "新植物", exact: true }).click();
  await expect(flower.locator(".care-effect")).toHaveCount(0);
  await expect(flower.getByRole("meter").last()).toHaveAttribute("value", "0");
  const selected = await flower
    .locator(".watercolor-flower")
    .getAttribute("data-plant");
  await page.reload();
  await expect(flower.locator(".watercolor-flower")).toHaveAttribute(
    "data-plant",
    selected!,
  );
});

test("invalid or blocked browser storage keeps local care usable", async ({
  page,
}) => {
  await page.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        '{"version":1,"plantId":"cosmos","stats":{"rain":999},"careCount":-1}',
      ),
    storageKey,
  );
  await page.goto("/");
  await expect(page.getByRole("meter").first()).toHaveAttribute("value", "0");
  await page.getByRole("button", { name: "Water", exact: true }).click();
  await expect(page.getByRole("meter").first()).toHaveAttribute("value", "6");
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  await page.reload();
  await page.getByRole("button", { name: "Water", exact: true }).click();
  await expect(page.getByRole("meter").first()).toHaveAttribute("value", "6");
  await page.getByRole("button", { name: "New plant" }).click();
  await expect(page.getByRole("meter").first()).toHaveAttribute("value", "0");
});

test("a separate browser has its own plant and progress", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Water", exact: true }).click();
  const other = await browser.newContext();
  try {
    const otherPage = await other.newPage();
    await otherPage.goto(baseURL!);
    await expect(otherPage.getByRole("meter").first()).toHaveAttribute(
      "value",
      "0",
    );
  } finally {
    await other.close();
  }
});

test("shuffled rounds survive reload, avoid boundary repeats and preserve legacy care", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");
  const plant = page.locator(".watercolor-flower");
  const next = page.getByRole("button", { name: "New plant", exact: true });
  const order: string[] = [];
  let previous: string | null = null;
  for (let round = 0; round < 3; round++) {
    const seen = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const id = (await plant.getAttribute("data-plant"))!;
      expect(id).not.toBe(previous);
      expect(seen.has(id)).toBe(false);
      seen.add(id);
      if (round === 0) order.push(id);
      const saved = await page.evaluate(
        (key) => localStorage.getItem(key),
        storageKey,
      );
      await page.reload();
      await expect(plant).toHaveAttribute("data-plant", id);
      expect(
        await page.evaluate((key) => localStorage.getItem(key), storageKey),
      ).toBe(saved);
      previous = id;
      await next.click();
    }
    expect(seen.size).toBe(6);
  }
  expect(order).not.toEqual([
    "cosmos",
    "tulip",
    "sunflower",
    "poppy",
    "lavender",
    "calla",
  ]);
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          plantId: "tulip",
          stats: { rain: 25, sun: 0, love: 0, food: 0 },
          careCount: 4,
        }),
      ),
    storageKey,
  );
  await page.reload();
  await expect(plant).toHaveAttribute("data-plant", "tulip");
  await expect(page.getByRole("meter").first()).toHaveAttribute("value", "25");
  await next.click();
  expect(await plant.getAttribute("data-plant")).not.toBe("tulip");
});
