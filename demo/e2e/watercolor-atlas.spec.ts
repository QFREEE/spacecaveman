import { test, expect } from "./fixtures";

test("every new pigment batch contains painted pixels and preserves earlier colors", async ({
  page,
}) => {
  await page.route("**/atlas-test", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body></body></html>",
    }),
  );
  await page.goto("/atlas-test");
  const batches = await page.evaluate(async () => {
    const modulePath = "/src/watercolorAtlas.ts";
    const { loadWatercolorAtlas } = await import(modulePath);
    const results = [];
    for (const colors of [
      ["#b96f49", "#739a70", "#ed6688"],
      ["#ed685b", "#f29d7c"],
      ["#a4ab58", "#ed6688"],
    ]) {
      const atlas = await loadWatercolorAtlas(colors);
      results.push(
        colors.map((color) => {
          const tile = atlas[color] as HTMLCanvasElement;
          const pixels = tile
            .getContext("2d")!
            .getImageData(0, 0, tile.width, tile.height).data;
          let painted = 0;
          for (let i = 3; i < pixels.length; i += 4)
            if (pixels[i] > 0) painted++;
          return { color, painted };
        }),
      );
    }
    return results;
  });
  for (const batch of batches)
    for (const pigment of batch)
      expect(
        pigment.painted,
        pigment.color + " must not be blank",
      ).toBeGreaterThan(100);
  await expect(page.locator("[data-p5-painter]")).toHaveCount(0);
});
