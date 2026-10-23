import { test, expect } from "./fixtures";
const key = "spacecaveman:plant:v1";

test("palette gallery renders natural varieties and grows without overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/plant-preview.html");
  const paintings = page.locator(".watercolor-flower");
  await expect(paintings).toHaveCount(9);
  await expect(page.locator('[data-renderer="p5.brush"]')).toHaveCount(9, {
    timeout: 25000,
  });
  const rosePixels = await page
    .locator('[data-plant="rose"] canvas')
    .evaluateAll((canvases) =>
      canvases.map((canvas) => {
        const pixels = (canvas as HTMLCanvasElement)
          .getContext("2d")!
          .getImageData(0, 0, 600, 459).data;
        let hash = 0;
        for (let i = 0; i < pixels.length; i++)
          hash = (hash * 31 + pixels[i]) | 0;
        return hash;
      }),
    );
  expect(new Set(rosePixels).size).toBe(3);
  await page.screenshot({
    path: "outputs/natural-palettes-" + testInfo.project.name + ".png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Start from seed" }).click();
  await expect(page.locator('[data-growth="seed"]')).toHaveCount(9);
  await page.getByRole("button", { name: "Add a little care" }).click();
  await expect(page.locator('[data-growth="sprout"]')).toHaveCount(9);
  await page.getByRole("button", { name: "Watercolor", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Plants", exact: true })
    .selectOption("all");
  await expect(paintings).toHaveCount(29);
  const bluebell = page.locator('[data-reference="35"]');
  await expect(bluebell.locator("h2")).toHaveText("Deep blue bluebell");
  await expect(bluebell.locator(".watercolor-flower")).toHaveAttribute(
    "data-species",
    "bluebell",
  );
  await expect(page.locator('[data-renderer="p5.brush"]')).toHaveCount(29);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("a new palette stays with the plant through care, reload and language changes", async ({
  page,
}) => {
  await page.goto("/");
  const drawing = page.locator("#flower .watercolor-flower");
  const palette = await drawing.getAttribute("data-palette");
  expect(palette).not.toBe("original");
  await page
    .locator("#flower")
    .getByRole("button", { name: "Water", exact: true })
    .click();
  await expect(drawing).toHaveAttribute("data-palette", palette!);
  await page.reload();
  await expect(drawing).toHaveAttribute("data-palette", palette!);
  await expect(page.locator("#flower meter").first()).toHaveAttribute(
    "value",
    "8",
  );
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(drawing).toHaveAttribute("data-palette", palette!);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(saved.paletteId).toBe(palette);
});

test("old or invalid palette metadata preserves the saved plant and care", async ({
  page,
}) => {
  await page.goto("/");
  for (const paletteId of [undefined, "not-a-palette", "blue"]) {
    await page.evaluate(
      ({ key, paletteId }) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            plantId: "rose",
            paletteId,
            stats: { rain: 25, sun: 0, love: 0, food: 0 },
            careCount: 3,
            remainingIds: ["iris"],
          }),
        ),
      { key, paletteId },
    );
    await page.reload();
    await expect(page.locator("#flower .watercolor-flower")).toHaveAttribute(
      "data-plant",
      "rose",
    );
    await expect(page.locator("#flower .watercolor-flower")).toHaveAttribute(
      "data-palette",
      "original",
    );
    await expect(page.locator("#flower meter").first()).toHaveAttribute(
      "value",
      "25",
    );
    await page.getByRole("button", { name: "New plant", exact: true }).click();
    await expect(page.locator("#flower .watercolor-flower")).toHaveAttribute(
      "data-plant",
      "iris",
    );
    await expect(
      page.locator("#flower .watercolor-flower"),
    ).not.toHaveAttribute("data-palette", "original");
  }
});
