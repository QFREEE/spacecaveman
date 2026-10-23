// p5.brush paints the atlas once. SVG only places and reveals its real brush marks.
export const paintColors = [
  "#b96f49",
  "#739a70",
  "#a4ab58",
  "#8da58a",
  "#ee9d7c",
  "#e88398",
  "#e87d6b",
  "#edae94",
  "#e8887d",
  "#d8ad50",
];
export const cellWidth = 128;
export const cellHeight = 80;
export const atlasWidth = cellWidth * 4;
export const atlasHeight = cellHeight * 3;
export type PaintAtlas = Record<string, HTMLCanvasElement>;
let atlas: Promise<PaintAtlas> | undefined;

export function loadWatercolorAtlas(): Promise<PaintAtlas> {
  return (atlas ??= createAtlas());
}

async function createAtlas(): Promise<PaintAtlas> {
  const { default: P5 } = await import("p5");
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
            paintColors.forEach((color, index) => {
              const x = (index % 4) * cellWidth - atlasWidth / 2;
              const y = Math.floor(index / 4) * cellHeight - atlasHeight / 2;
              brush.fill(color, 115);
              // Broad, blunt-ended flat-brush geometry, with space for bleed.
              brush.beginShape(0.08);
              [
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
              ].forEach(([dx, dy]) => brush.vertex(x + dx, y + dy));
              brush.endShape(true);
            });
            // The library flushes watercolor buffers in its postdraw hook.
            requestAnimationFrame(() => {
              try {
                const canvas = host.querySelector("canvas");
                if (!canvas) throw new Error("Missing watercolor canvas");
                const textures: PaintAtlas = {};
                paintColors.forEach((color, index) => {
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
