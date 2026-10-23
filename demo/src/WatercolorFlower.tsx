import { useEffect, useRef, useState } from "react";
import { loadWatercolorAtlas, type PaintAtlas } from "./watercolorAtlas";

import {
  getPlantDesign,
  type PlantDesign,
  type BrushMark,
} from "./plantDesigns";
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function PaintLayer({
  atlas,
  progress,
  fallback,
  design,
}: {
  atlas: PaintAtlas | null;
  progress: number[];
  fallback: boolean;
  design: PlantDesign;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [, pot, greenery, flower] = progress;
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    context.setTransform(3, 0, 0, 3, 0, 0);
    context.clearRect(0, 0, 200, 153);
    context.globalCompositeOperation = "multiply";
    function wash(mark: BrushMark, amount: number) {
      if (amount <= 0) return;
      context!.save();
      context!.translate(mark.x, mark.y);
      context!.rotate((mark.angle * Math.PI) / 180);
      context!.beginPath();
      context!.rect(
        -0.12 * mark.length,
        -0.8 * mark.width,
        clamp(amount) * 1.4 * mark.length,
        1.6 * mark.width,
      );
      context!.clip();
      if (atlas)
        context!.drawImage(
          atlas[mark.color],
          -0.12 * mark.length,
          -0.8 * mark.width,
          1.4 * mark.length,
          1.6 * mark.width,
        );
      else if (fallback) {
        context!.globalAlpha = 0.55;
        context!.fillStyle = mark.color;
        context!.fillRect(0, -0.45 * mark.width, mark.length, 0.9 * mark.width);
      }
      context!.restore();
    }
    design.pot.forEach((mark, index) =>
      wash(mark, pot * design.pot.length - index),
    );
    design.leaves.forEach((mark, index) =>
      wash(mark, greenery * design.leaves.length - index),
    );
    const bloomUnits = design.flowers.length + (design.center ? 0.5 : 0);
    const anchor = design.center ?? { x: 100, y: 50 };
    design.flowers.forEach((petal, index) => {
      const amount = flower * bloomUnits - index;
      if (petal.cross === false) {
        wash(petal, amount);
        return;
      }
      const lean = index % 2 === 0 ? 16 : -18;
      // Offset broad strokes cross near the roots; a lighter angled pass
      // weaves through the first wash instead of filling the ink silhouette.
      wash(
        {
          ...petal,
          x: petal.x + (anchor.x - petal.x) * 0.3,
          y: petal.y + (anchor.y - petal.y) * 0.2,
          angle: petal.angle - lean * 0.3,
          width: petal.width + 2,
        },
        amount,
      );
      context.save();
      context.globalAlpha = 0.38;
      wash(
        {
          ...petal,
          x: petal.x + (index % 2 === 0 ? 2 : -2),
          y: petal.y + 1.5,
          angle: petal.angle + lean,
          length: petal.length * 0.88,
          width: petal.width * 0.65,
        },
        amount * 1.7 - 0.7,
      );
      context.restore();
    });
    if (design.center) {
      const center = design.center;
      context.save();
      context.beginPath();
      context.arc(center.x, center.y, center.radius, 0, Math.PI * 2);
      context.clip();
      if (design.id === "sunflower") {
        context.save();
        context.globalAlpha =
          0.62 * clamp((flower * bloomUnits - design.flowers.length) * 2);
        context.fillStyle = center.color;
        context.fill();
        context.restore();
      }
      wash(
        {
          x: center.x - center.radius,
          y: center.y,
          angle: 0,
          length: center.radius * 2,
          width: center.radius * 2,
          color: center.color,
        },
        (flower * bloomUnits - design.flowers.length) * 2,
      );
      context.restore();
    }
  }, [atlas, pot, greenery, flower, fallback, design]);
  return (
    <foreignObject x="0" y="0" width="200" height="153">
      <canvas
        data-watercolor="p5.brush"
        ref={canvas}
        width="600"
        height="459"
        style={{ width: 200, height: 153, display: "block" }}
      />
    </foreignObject>
  );
}

export function WatercolorFlower({
  stats,
  plantId = "cosmos",
  paletteId = "original",
}: {
  stats: Record<"rain" | "sun" | "love" | "food", number>;
  plantId?: string;
  paletteId?: string;
}) {
  const design = getPlantDesign(plantId, paletteId);
  const [atlas, setAtlas] = useState<PaintAtlas | null>(null);
  const [paintFailed, setPaintFailed] = useState(false);
  useEffect(() => {
    let current = true;
    loadWatercolorAtlas()
      .then((image) => {
        if (current) setAtlas(image);
      })
      .catch(() => {
        if (current) setPaintFailed(true);
      });
    return () => {
      current = false;
    };
  }, []);
  // Bar identities do not choose layers: the leading bar draws first.
  const [sketch, pot, greenery, flower] = Object.values(stats)
    .map((value) => clamp(value / 50))
    .sort((a, b) => b - a);
  const growth = clamp((sketch - 0.16) / 0.84);
  const growingInk = design.ink.slice(2);
  return (
    <svg
      viewBox="0 0 200 153"
      aria-hidden="true"
      fill="none"
      className="watercolor-flower"
      data-plant={plantId}
      data-species={design.id}
      data-palette={paletteId}
      data-growth={sketch === 0 ? "seed" : growth === 0 ? "sprout" : "growing"}
      data-renderer={
        atlas ? "p5.brush" : paintFailed ? "unavailable" : "loading"
      }
    >
      <PaintLayer
        design={design}
        atlas={atlas}
        fallback={paintFailed}
        progress={[sketch, pot, greenery, flower]}
      />
      <g data-paint="pot" data-progress={pot} />
      <g data-paint="leaves" data-progress={greenery} />
      <g data-paint="petals" data-progress={flower} />
      <g
        data-paint="sketch"
        data-progress={sketch}
        stroke="var(--skin-text-strong)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g data-paint="initial-pot">
          {design.ink.slice(0, 2).map((path, index) => (
            <path key={index} d={path} />
          ))}
        </g>
        {sketch === 0 ? (
          <g data-paint="seed">
            <path d="M96 110Q91 104 97 100Q105 101 104 107Q102 111 96 110Z" />
            <path d="M97 108Q98 104 101 102M84 112l3-1m24 0 4 1" />
          </g>
        ) : null}
        {growth === 0 ? (
          <g data-paint="sprout">
            {[
              "M100 110Q98 101 101 92",
              "M100 102Q90 101 89 94Q98 93 100 102",
              "M100 98Q102 89 110 89Q110 97 100 98",
            ].map((path, index) => (
              <path
                key={index}
                className="flower-ink-stroke"
                d={path}
                pathLength="1"
                strokeDasharray="1 1"
                strokeDashoffset={sketch > 0 ? 0 : 1}
                opacity={sketch > 0 ? 1 : 0}
              />
            ))}
          </g>
        ) : null}
        {growingInk.map((path, index) => {
          const progress = clamp(growth * growingInk.length - index);
          return (
            <path
              key={index}
              className="flower-ink-stroke"
              d={path}
              pathLength="1"
              strokeDasharray="1 1"
              strokeDashoffset={1 - progress}
              opacity={progress > 0 ? 1 : 0}
            />
          );
        })}
      </g>
    </svg>
  );
}
