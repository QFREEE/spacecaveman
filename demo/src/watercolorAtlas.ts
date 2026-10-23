// p5.brush paints each requested pigment once. SVG places and reveals its brush marks.
import { pigmentPalette } from "./plantDesigns";
export const cellWidth = 128;
export const cellHeight = 80;
export const atlasWidth = cellWidth * 4;
export type PaintAtlas = Record<string, HTMLCanvasElement>;
const cached: PaintAtlas = {};
const requested = new Set<string>();
let pending: Promise<void> | undefined;

// Batch visible flowers in the same render, and serialize p5.brush's global state.
export function loadWatercolorAtlas(colors: string[]): Promise<PaintAtlas> {
  for (const color of colors) if (!cached[color]) requested.add(color);
  if (colors.every((color) => cached[color]))
    return Promise.resolve({ ...cached });
  if (!pending) {
    pending = Promise.resolve()
      .then(async () => {
        const pigments = pigmentPalette.filter(({ color }) =>
          requested.has(color),
        );
        requested.clear();
        Object.assign(cached, await createAtlas(pigments));
      })
      .finally(() => {
        pending = undefined;
      });
  }
  return pending.then(() => loadWatercolorAtlas(colors));
}

async function createAtlas(
  pigments: typeof pigmentPalette,
): Promise<PaintAtlas> {
  const atlasHeight = cellHeight * Math.ceil(pigments.length / 4);
  const { default: P5 } = await import("p5");
  P5.disableFriendlyErrors = true;
  // p5.brush registers its flush hooks against this constructor during import.
  if (!Reflect.get(window, "p5")) Reflect.set(window, "p5", P5);
  const brush = await import("p5.brush");
  return new Promise((resolve, reject) => {
    const host = document.createElement("div");
    host.style.cssText =
      "position:fixed;left:-10000px;top:0;pointer-events:none";
    host.setAttribute("aria-hidden", "true");
    host.dataset.p5Painter = "true";
    document.body.append(host);
    let instance: InstanceType<typeof P5> | undefined;
    const timeout = window.setTimeout(
      () => finish(new Error("Watercolor renderer timed out")),
      15000,
    );
    let settled = false;
    function finish(error?: unknown, result?: PaintAtlas) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      instance?.remove();
      host.remove();
      if (error) reject(error);
      else resolve(result!);
    }
    try {
      instance = new P5((p) => {
        brush.instance(p);
        p.setup = () => {
          try {
            p.pixelDensity(1);
            p.createCanvas(atlasWidth, atlasHeight, p.WEBGL);
            p.setAttributes({
              alpha: true,
              preserveDrawingBuffer: true,
              antialias: true,
            });
            // Each batch owns a new canvas; reset the brush target before drawing.
            brush.load();
            p.noLoop();
          } catch (error) {
            finish(error);
          }
        };
        p.draw = () => {
          if (settled) return;
          try {
            p.clear();
            p.randomSeed(2410);
            p.noiseSeed(2410);
            brush.seed(2410);
            brush.noiseSeed(2410);
            brush.noStroke();
            brush.noHatch();
            brush.noField();
            brush.fillBleed(0.13, "out", 0);
            brush.fillTexture(0.42, 0.55, false);
            pigments.forEach(({ color, role }, index) => {
              const x = (index % 4) * cellWidth - atlasWidth / 2;
              const y = Math.floor(index / 4) * cellHeight - atlasHeight / 2;
              const isPetal = role === "petal";
              // Keep the interior watery while pigment gathers along irregular edges.
              brush.fillTexture(
                isPetal ? 0.65 : 0.42,
                isPetal ? 0.95 : 0.55,
                false,
              );
              brush.fill(color, isPetal ? 205 : 115);
              // Broad, blunt-ended flat-brush geometry, with space for bleed.
              brush.beginShape(0.08);
              (role === "leaf"
                ? [
                    [11, 38],
                    [28, 26],
                    [52, 20],
                    [78, 23],
                    [101, 30],
                    [115, 39],
                    [101, 48],
                    [80, 56],
                    [54, 59],
                    [29, 51],
                    [13, 43],
                  ]
                : [
                    [12, 20],
                    [37, 17],
                    [65, 21],
                    [91, 18],
                    [113, 22],
                    [115, 40],
                    [111, 61],
                    [84, 59],
                    [59, 62],
                    [33, 58],
                    [13, 61],
                    [10, 40],
                  ]
              ).forEach(([dx, dy]) => brush.vertex(x + dx, y + dy));
              brush.endShape(true);
              if (role === "petal") {
                // A reverse glaze deposits pigment at the outward end, not only the root.
                brush.fill(color, 135);
                brush.fillBleed(0.08, "out", Math.PI);
                brush.beginShape(0.1);
                [
                  [86, 23],
                  [99, 19],
                  [113, 22],
                  [115, 40],
                  [111, 61],
                  [99, 59],
                  [84, 57],
                  [90, 40],
                ].forEach(([dx, dy]) => brush.vertex(x + dx, y + dy));
                brush.endShape(true);
                brush.fillBleed(0.13, "out", 0);
              }
            });
            // The library flushes watercolor buffers in its postdraw hook.
            requestAnimationFrame(() => {
              try {
                const canvas = host.querySelector("canvas");
                if (!canvas) throw new Error("Missing watercolor canvas");
                const textures: PaintAtlas = {};
                pigments.forEach(({ color, role }, index) => {
                  const crop = document.createElement("canvas");
                  crop.width = cellWidth;
                  crop.height = cellHeight;
                  const context = crop.getContext("2d");
                  if (!context)
                    throw new Error("Missing texture export context");
                  context.drawImage(
                    canvas,
                    ((index % 4) * cellWidth * canvas.width) / atlasWidth,
                    (Math.floor(index / 4) * cellHeight * canvas.height) /
                      atlasHeight,
                    (cellWidth * canvas.width) / atlasWidth,
                    (cellHeight * canvas.height) / atlasHeight,
                    0,
                    0,
                    cellWidth,
                    cellHeight,
                  );
                  if (role === "petal") {
                    // Opacity varies across each flat brush: clearer belly, denser rims.
                    const wetness = context.createLinearGradient(0, 16, 0, 64);
                    wetness.addColorStop(0, "rgba(0,0,0,1)");
                    wetness.addColorStop(0.2, "rgba(0,0,0,.95)");
                    wetness.addColorStop(0.45, "rgba(0,0,0,.6)");
                    wetness.addColorStop(0.65, "rgba(0,0,0,.72)");
                    wetness.addColorStop(0.9, "rgba(0,0,0,1)");
                    wetness.addColorStop(1, "rgba(0,0,0,1)");
                    context.globalCompositeOperation = "destination-in";
                    context.fillStyle = wetness;
                    context.fillRect(0, 0, cellWidth, cellHeight);
                  }
                  if (role === "leaf") {
                    // The brush shader exports opaque RGB, even for watery pigment.
                    // Restore a broken, translucent wash before layering leaf passes.
                    const pixels = context.getImageData(
                      0,
                      0,
                      cellWidth,
                      cellHeight,
                    );
                    for (let y = 0; y < cellHeight; y++) {
                      for (let x = 0; x < cellWidth; x++) {
                        const offset = (y * cellWidth + x) * 4;
                        const grain =
                          (Math.sin(x * 0.31 + y * 0.19) +
                            Math.sin(x * 0.13 - y * 0.37)) *
                          0.035;
                        const belly = Math.exp(
                          -Math.pow((y - 38 - 3 * Math.sin(x * 0.06)) / 13, 2),
                        );
                        const opacity = 0.84 - 0.34 * belly + grain;
                        // Remove the shader's white paper so transparency does not
                        // bleach the chosen green when composited onto the page.
                        for (let channel = 0; channel < 3; channel++) {
                          pixels.data[offset + channel] =
                            255 -
                            (255 - pixels.data[offset + channel]) / opacity;
                        }
                        pixels.data[offset + 3] *= opacity;
                      }
                    }
                    context.putImageData(pixels, 0, 0);
                  }
                  textures[color] = crop;
                });
                finish(undefined, textures);
              } catch (error) {
                finish(error);
              }
            });
          } catch (error) {
            finish(error);
          }
        };
      }, host);
    } catch (error) {
      finish(error);
    }
  });
}
