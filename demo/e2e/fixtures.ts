import { test as base, expect } from "@playwright/test";
export const test = base.extend({
  page: async ({ page }, use) => {
    let views = 0;
    await page.route("**/api/visitors", (route) => {
      if (route.request().method() === "POST") views++;
      return route.fulfill({ json: { views } });
    });
    await use(page);
  },
});
export { expect };
