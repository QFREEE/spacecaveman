import { test, expect } from "./fixtures";

test("rapid confirmed care earns a translated thank-you without numeric counts", async ({
  page,
  flowerPlant,
}, testInfo) => {
  // Keep time frozen: an animation must never impose a delay before the next care.
  await page.clock.install();
  await page.goto("/");
  const flower = page.locator("#flower");
  const buttons = ["Water", "Sun", "Prune", "Feed"];
  for (let i = 0; i < 9; i++) {
    await flower
      .getByRole("button", { name: buttons[i % 4], exact: true })
      .click();
  }
  await expect(
    flower.getByRole("button", { name: "Refresh plant" }),
  ).toBeEnabled();
  await expect(flower.getByRole("status")).not.toContainText("Thank you");
  flowerPlant.stats.rain = 50;
  await flower.getByRole("button", { name: "Water", exact: true }).click();
  await expect(flower.getByRole("status")).toHaveText("Already full.");
  await expect(flower.locator(".plant-meters")).not.toHaveAttribute(
    "data-recognition",
    "thanks",
  );
  await flower.getByRole("button", { name: "Sun", exact: true }).click();
  await expect(flower.getByRole("status")).toHaveText(
    "Thank you for giving our flower so much care!",
  );
  await expect(flower.locator(".plant-meters")).toHaveAttribute(
    "data-recognition",
    "thanks",
  );
  await expect(flower).not.toContainText(/\d/);
  await flower.screenshot({
    path: `outputs/flower-thanks-${testInfo.project.name}.png`,
  });
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(flower.getByRole("status")).toHaveText(
    "谢谢你这么用心地照料我们的花！",
  );
  flowerPlant.generation++;
  flowerPlant.stats = { rain: 0, sun: 0, love: 0, food: 0 };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(flower.getByRole("meter").first()).toHaveAttribute("value", "0");
  await expect(flower.locator(".plant-notice")).toBeEmpty();
  await expect(flower.locator(".plant-meters")).not.toHaveAttribute(
    "data-recognition",
  );
});

test("finishing every bar shows the last growth stage without a bloom message", async ({
  page,
  flowerPlant,
}, testInfo) => {
  flowerPlant.stats = { rain: 49, sun: 49, love: 49, food: 49 };
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const flower = page.locator("#flower");
  for (const name of ["Water", "Sun", "Prune", "Feed"]) {
    await flower.getByRole("button", { name, exact: true }).click();
  }
  await expect(
    flower.getByRole("button", { name: "Refresh plant" }),
  ).toBeEnabled();
  await expect(flower.locator(".flower-stage")).toHaveAttribute(
    "data-stage",
    "8",
  );
  await expect(flower.getByRole("status")).toHaveText(
    "You’re helping our flower grow.",
  );
  await expect(flower).not.toContainText("Our flower is in full bloom!");
  await expect(flower.locator(".care-effect")).toHaveCount(0);
  await flower.screenshot({
    path: `outputs/flower-final-stage-${testInfo.project.name}.png`,
  });
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(flower.getByRole("status")).toHaveText(
    "你正陪着我们的花慢慢长大。",
  );
  await expect(page.locator(".treasure-flag")).toHaveCount(0);
});

test("continuous clicks fill a bar immediately while saves are queued", async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/flower?care=rain", async (route) => {
    await pending;
    await route.fallback();
  });
  await page.clock.install();
  await page.goto("/");
  const water = page
    .locator("#flower")
    .getByRole("button", { name: "Water", exact: true });
  await expect(water).toBeEnabled();
  await water.evaluate((button: HTMLButtonElement) => {
    for (let i = 0; i < 10; i++) button.click();
  });
  await expect(water).toBeEnabled();
  const rain = page.getByRole("meter", { name: "Rain", exact: true });
  await expect(rain).toHaveAttribute("value", "50");
  await expect(rain).toHaveAttribute("aria-busy", "true");
  await expect(page.locator("#flower .plant-notice")).not.toContainText(
    "Thank you",
  );
  release();
  await expect(rain).toHaveAttribute("aria-busy", "false");
  await expect(rain).toHaveAttribute("value", "50");
  await expect(page.locator("#flower .plant-notice")).toHaveText(
    "Thank you for giving our flower so much care!",
  );
});

test("failed saves restore confirmed bars and discard the remaining queue", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let writes = 0;
  await page.route("**/api/flower?care=rain", async (route) => {
    writes++;
    await gate;
    await route.fulfill({ status: 503, json: { error: "Unavailable" } });
  });
  await page.goto("/");
  const water = page.getByRole("button", { name: "Water", exact: true });
  await expect(water).toBeEnabled();
  await water.evaluate((button: HTMLButtonElement) => {
    for (let i = 0; i < 3; i++) button.click();
  });
  const rain = page.getByRole("meter", { name: "Rain", exact: true });
  await expect(rain).toHaveAttribute("value", "15");
  release();
  await expect(page.locator("#flower .plant-notice")).toHaveText(
    "Could not confirm. Refresh and try again.",
  );
  await expect(rain).toHaveAttribute("value", "0");
  expect(writes).toBe(1);
  await expect(page.locator(".plant-meters")).not.toHaveAttribute(
    "data-recognition",
  );
  await page.getByRole("button", { name: "Refresh plant" }).click();
  await expect(water).toBeEnabled();
});

test("queued care from yesterday does not spill into a new daily plant", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let writes = 0;
  await page.route("**/api/flower?care=rain", async (route) => {
    writes++;
    await gate;
    await route.fulfill({
      json: {
        stats: { rain: 5, sun: 0, love: 0, food: 0 },
        log: ["rain"],
        generation: 2,
        bloomed_at: null,
      },
    });
  });
  await page.goto("/");
  const water = page.getByRole("button", { name: "Water", exact: true });
  await expect(water).toBeEnabled();
  await water.evaluate((button: HTMLButtonElement) => {
    for (let i = 0; i < 3; i++) button.click();
  });
  release();
  await expect(page.locator("#flower .plant-notice")).toHaveText(
    "A fresh flower for a new day. Try caring again.",
  );
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "5");
  expect(writes).toBe(1);
});

test("four care bars progressively complete separate drawing layers", async ({
  page,
  flowerPlant,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const flower = page.locator("#flower");
  const labels = new Set<string>();
  for (let stage = 0; stage <= 8; stage++) {
    let total = stage * 25;
    for (const id of ["rain", "sun", "love", "food"] as const) {
      flowerPlant.stats[id] = Math.min(50, total);
      total = Math.max(0, total - 50);
    }
    await flower.getByRole("button", { name: "Refresh plant" }).click();
    await expect(flower.locator(".flower-stage")).toHaveAttribute(
      "data-stage",
      String(stage),
    );
    labels.add(await flower.locator(".plant-label").innerText());
    const progress = Object.values(flowerPlant.stats).sort((a, b) => b - a);
    for (const [index, layer] of [
      "sketch",
      "pot",
      "leaves",
      "petals",
    ].entries()) {
      await expect(flower.locator(`[data-paint="${layer}"]`)).toHaveAttribute(
        "data-progress",
        String(progress[index] / 50),
      );
    }
    await flower.screenshot({
      path: `outputs/flower-stage-${stage}-${testInfo.project.name}.png`,
    });
  }
  expect(labels.size).toBe(5);
  await expect(flower.locator(".plant-notice")).toBeEmpty();
});

test("any bar can finish first and progress rank always chooses drawing order", async ({
  page,
  flowerPlant,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const flower = page.locator("#flower");
  const layers = ["sketch", "pot", "leaves", "petals"];
  const actions = ["rain", "sun", "love", "food"] as const;
  for (let first = 0; first < 4; first++) {
    flowerPlant.stats = { rain: 0, sun: 0, love: 0, food: 0 };
    for (let finished = 0; finished < 4; finished++) {
      flowerPlant.stats[actions[(first + finished) % 4]] = 50;
      await flower.getByRole("button", { name: "Refresh plant" }).click();
      for (const [index, layer] of layers.entries()) {
        await expect(flower.locator(`[data-paint="${layer}"]`)).toHaveAttribute(
          "data-progress",
          index <= finished ? "1" : "0",
        );
      }
    }
  }
  // Reassigning which bar is ahead preserves the same partial painting.
  for (const stats of [
    { rain: 5, sun: 40, love: 20, food: 30 },
    { rain: 30, sun: 20, love: 40, food: 5 },
    { rain: 20, sun: 30, love: 5, food: 40 },
  ]) {
    flowerPlant.stats = stats;
    await flower.getByRole("button", { name: "Refresh plant" }).click();
    for (const [index, layer] of layers.entries()) {
      await expect(flower.locator(`[data-paint="${layer}"]`)).toHaveAttribute(
        "data-progress",
        String([0.8, 0.6, 0.4, 0.1][index]),
      );
    }
  }
  await expect(flower.locator(".flower-ink-stroke").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
});
