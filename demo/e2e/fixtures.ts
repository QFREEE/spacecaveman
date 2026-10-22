import { test as base, expect } from "@playwright/test";

// One server-side plant per test; route state survives reloads like D1.
type Plant = {
  stats: Record<"rain" | "sun" | "love" | "food", number>;
  log: string[];
  generation: number;
  bloomed_at: string | null;
};
export const test = base.extend<{ flowerPlant: Plant }>({
  flowerPlant: async ({}, use) => {
    await use({
      stats: { rain: 0, sun: 0, love: 0, food: 0 },
      log: [] as string[],
      generation: 1,
      bloomed_at: null as string | null,
    });
  },
  page: async ({ page, flowerPlant: plant }, use) => {
    let views = 0;
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
        if (plant.stats[key] === 50)
          return route.fulfill({
            status: 409,
            json: { ...plant, error: "full" },
          });
        plant.stats[key] = Math.min(50, plant.stats[key] + 5);
        plant.log = [key, ...plant.log].slice(0, 12);
        if (Object.values(plant.stats).every((value) => value === 50))
          plant.bloomed_at = new Date().toISOString();
      }
      return route.fulfill({ json: plant });
    });
    await use(page);
  },
});
export { expect };
