import { test, expect } from "./fixtures";
test("unavailable server storage affects visitors but local care remains available", async ({
  page,
}) => {
  await page.route("**/api/visitors", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.route("**/api/flower*", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#visitors")).toContainText(
    "Visit count is temporarily unavailable.",
  );
  await page.getByRole("button", { name: "Water", exact: true }).click();
  await expect(page.getByRole("meter").first()).toHaveAttribute("value", "8");
  await page.route("**/api/visitors", (route) =>
    route.fulfill({ json: { views: 73 } }),
  );
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".counter")).toHaveText("000073");
});
