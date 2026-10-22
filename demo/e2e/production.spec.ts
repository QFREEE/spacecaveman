import { test, expect } from "./fixtures";

test("storage failures show unavailable states, disable unsaved care and allow recovery", async ({
  page,
}) => {
  await page.route("**/api/flower*", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.route("**/api/visitors", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/");
  await expect(page.locator("#flower")).toContainText(
    "The flower is temporarily unavailable.",
  );
  await expect(
    page.getByRole("button", { name: "Water", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("#visitors")).toContainText(
    "Visit count is temporarily unavailable.",
  );
  await expect(page.locator(".counter")).toHaveText("------");
  await page.route("**/api/flower*", (route) =>
    route.fulfill({
      json: {
        stats: { rain: 2, sun: 1, love: 0, food: 0 },
        log: ["rain"],
        generation: 1,
        bloomed_at: null,
      },
    }),
  );
  await page.route("**/api/visitors", (route) =>
    route.fulfill({ json: { views: 73 } }),
  );
  await page
    .getByRole("button", { name: "Refresh plant", exact: true })
    .click();
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "2");
  await expect(
    page.getByRole("button", { name: "Water", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".counter")).toHaveText("000073");
});

test("failed care never invents progress and shared cooldown returns authoritative state", async ({
  page,
}) => {
  await page.goto("/");
  const water = page.getByRole("button", { name: "Water", exact: true });
  await expect(water).toBeEnabled();
  await page.route("**/api/flower?care=rain", (route) =>
    route.fulfill({
      status: 429,
      json: {
        stats: { rain: 1, sun: 0, love: 0, food: 0 },
        log: ["rain"],
        generation: 1,
        bloomed_at: null,
        error: "cooldown",
      },
    }),
  );
  await water.click();
  await expect(page.locator("#flower")).toContainText("Wait two seconds.");
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(water).toBeEnabled();
  await page.route("**/api/flower?care=rain", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await water.click();
  await expect(page.locator("#flower")).toContainText("Could not confirm.");
  await expect(
    page.getByRole("meter", { name: "Rain", exact: true }),
  ).toHaveAttribute("value", "1");
  await expect(water).toBeDisabled();
});
