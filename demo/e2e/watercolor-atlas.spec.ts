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

test("leaf washes retain uneven translucency in every pigment batch", async ({
  page,
}) => {
  await page.route("**/atlas-test", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body></body></html>",
    }),
  );
  await page.goto("/atlas-test");
  const washes = await page.evaluate(async () => {
    const modulePath = "/src/watercolorAtlas.ts";
    const { loadWatercolorAtlas } = await import(modulePath);
    const results = [];
    for (const color of ["#739a70", "#a4ab58"]) {
      const atlas = await loadWatercolorAtlas([color]);
      const pixels = atlas[color]
        .getContext("2d")
        .getImageData(0, 0, 128, 80).data;
      const opacity = [];
      for (let y = 25; y < 55; y++)
        for (let x = 25; x < 100; x++)
          opacity.push(pixels[(y * 128 + x) * 4 + 3]);
      results.push({
        color,
        min: Math.min(...opacity),
        max: Math.max(...opacity),
        levels: new Set(opacity).size,
      });
    }
    return results;
  });
  for (const wash of washes) {
    expect(wash.max, wash.color + " must remain translucent").toBeLessThan(240);
    expect(
      wash.max - wash.min,
      wash.color + " must vary within a stroke",
    ).toBeGreaterThan(30);
    expect(wash.levels).toBeGreaterThan(20);
  }
});
