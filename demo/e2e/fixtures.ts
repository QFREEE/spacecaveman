import { test as base, expect } from "@playwright/test";

// One server-side plant per test; route state survives reloads like D1.
export const test = base.extend({
  page: async ({ page }, use) => {
    let views = 0;
    const plant = {
      stats: { rain: 0, sun: 0, love: 0, food: 0 },
      log: [] as string[],
      generation: 1,
      bloomed_at: null as string | null,
    };
    await page.route("**/api/visitors", (route) => {
      if (route.request().method() === "POST") views++;
      return route.fulfill({ json: { views } });
    });
    await page.route("**/api/flower*", (route) => {
      const action = new URL(route.request().url()).searchParams.get("care");
      if (
        route.request().method() === "POST" &&
        action &&
        action in plant.stats
      ) {
        const key = action as keyof typeof plant.stats;
        if (plant.stats[key] === 3)
          return route.fulfill({
            status: 409,
            json: { ...plant, error: "full" },
          });
        plant.stats[key]++;
        plant.log = [key, ...plant.log].slice(0, 12);
        if (Object.values(plant.stats).every((value) => value === 3))
          plant.bloomed_at = new Date().toISOString();
      }
      return route.fulfill({ json: plant });
    });
    await page.route("**/api/presence/public", (route) =>
      route.fulfill({
        json: { status: "unknown", observed_at: null, expires_at: null },
      }),
    );
    await use(page);
  },
});
export { expect };
