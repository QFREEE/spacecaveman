import { useEffect, useRef, useState } from "react";
import { loadWatercolorAtlas, type PaintAtlas } from "./watercolorAtlas";

// Sketch and pigment stay separate: transparent flat-brush marks may cross ink edges.
const petals = [
  {
    outline:
      "M97 44C91 35 87 24 90 16C92 10 101 7 105 4C111 2 117 10 117 19C118 29 111 38 104 44",
    x: 101,
    y: 44,
    angle: -84,
    length: 40,
    width: 23,
    color: "#ee9d7c",
  },
  {
    outline:
      "M107 47C116 34 132 27 145 28C154 28 154 36 151 42C146 52 126 53 108 52",
    x: 108,
    y: 49,
    angle: -21,
    length: 47,
    width: 24,
    color: "#e88398",
  },
  {
    outline:
      "M107 54C119 54 137 60 142 70C147 81 138 84 130 81C119 77 109 65 104 57",
    x: 106,
    y: 56,
    angle: 32,
    length: 42,
    width: 23,
    color: "#e87d6b",
  },
  {
    outline: "M96 56C90 69 73 80 63 79C54 78 57 68 62 63C70 56 84 53 93 52",
    x: 94,
    y: 54,
    angle: 151,
    length: 42,
    width: 22,
    color: "#edae94",
  },
  {
    outline: "M93 47C79 47 61 43 57 34C50 22 60 18 67 21C79 25 89 36 97 44",
    x: 94,
    y: 46,
    angle: -149,
    length: 46,
    width: 24,
    color: "#e8887d",
  },
];
const leaves = [
  {
    outline: "M101 105C89 108 77 104 73 96C84 93 96 97 101 105",
    x: 100,
    y: 103,
    angle: -161,
    length: 29,
    width: 12,
    color: "#739a70",
  },
  {
    outline: "M103 97C108 87 122 84 134 85C131 96 116 102 103 97",
    x: 105,
    y: 96,
    angle: -22,
    length: 31,
    width: 13,
    color: "#a4ab58",
  },
  {
    outline: "M102 87C92 90 82 85 79 78C89 76 98 80 102 87",
    x: 101,
    y: 86,
    angle: -157,
    length: 24,
    width: 11,
    color: "#8da58a",
  },
];
const ink = [
  "M75 112L80 140Q100 147 121 139L126 112",
  "M73 110Q99 104 128 110L127 117Q101 122 73 116Z",
  "M100 109C107 91 100 76 100 57",
  ...leaves.map((leaf) => leaf.outline),
  ...petals.map((petal) => petal.outline),
  "M104 50C105 56 95 56 95 50C95 44 104 44 104 50",
  "M12 141Q28 135 44 140M43 137Q58 130 77 136M123 136Q142 132 151 139M151 141Q169 136 185 142",
];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

type Mark = {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  color: string;
};

function PaintLayer({
  atlas,
  progress,
  fallback,
}: {
  atlas: PaintAtlas | null;
  progress: number[];
  fallback: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [, pot, greenery, flower] = progress;
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    context.setTransform(3, 0, 0, 3, 0, 0);
    context.clearRect(0, 0, 200, 153);
    context.globalCompositeOperation = "multiply";
    function wash(mark: Mark, amount: number) {
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
    [0, 1, 2, 3, 4].forEach((row) =>
      wash(
        {
          x: row % 2 ? 125 : 74,
          y: 111 + row * 6.8,
          angle: row % 2 ? 180 : 0,
          length: row === 0 ? 54 : 51 - row * 2,
          width: 9,
          color: "#b96f49",
        },
        pot * 5 - row,
      ),
    );
    leaves.forEach((leaf, index) =>
      wash(leaf, greenery * leaves.length - index),
    );
    petals.forEach((petal, index) => wash(petal, flower * 5.5 - index));
    context.save();
    context.beginPath();
    context.arc(100, 50, 4.4, 0, Math.PI * 2);
    context.clip();
    wash(
      { x: 95, y: 50, angle: 0, length: 10, width: 10, color: "#d8ad50" },
      flower * 11 - 10,
    );
    context.restore();
  }, [atlas, pot, greenery, flower, fallback]);
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
}: {
  stats: Record<"rain" | "sun" | "love" | "food", number>;
}) {
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
  return (
    <svg
      viewBox="0 0 200 153"
      aria-hidden="true"
      fill="none"
      className="watercolor-flower"
      data-renderer={
        atlas ? "p5.brush" : paintFailed ? "unavailable" : "loading"
      }
    >
      <PaintLayer
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
        {ink.map((path, index) => {
          const progress = clamp(sketch * ink.length - index);
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
