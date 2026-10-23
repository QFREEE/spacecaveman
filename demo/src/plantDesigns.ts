import type { MessageKey } from "./i18n/en";

export type BrushMark = {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  color: string;
  outline?: string;
  cross?: boolean;
};
export type PlantDesign = {
  id: string;
  name: MessageKey;
  ink: string[];
  pot: BrushMark[];
  leaves: BrushMark[];
  flowers: BrushMark[];
  center?: { x: number; y: number; radius: number; color: string };
};
const potInk = [
  "M75 112L80 140Q100 147 121 139L126 112",
  "M73 110Q99 104 128 110L127 117Q101 122 73 116Z",
];
const ground =
  "M12 141Q28 135 44 140M43 137Q58 130 77 136M123 136Q142 132 151 139M151 141Q169 136 185 142";
const pot: BrushMark[] = [0, 1, 2, 3, 4].map((row) => ({
  x: row % 2 ? 125 : 74,
  y: 111 + row * 6.8,
  angle: row % 2 ? 180 : 0,
  length: row === 0 ? 54 : 51 - row * 2,
  width: 17,
  color: "#b96f49",
}));
function design(
  id: string,
  name: MessageKey,
  stems: string[],
  leaves: BrushMark[],
  flowers: BrushMark[],
  center?: PlantDesign["center"],
): PlantDesign {
  const centerInk = center
    ? [
        `M${center.x + center.radius} ${center.y}a${center.radius} ${center.radius} 0 1 0 ${-2 * center.radius} 0a${center.radius} ${center.radius} 0 1 0 ${2 * center.radius} 0`,
      ]
    : [];
  return {
    id,
    name,
    pot,
    leaves,
    flowers,
    center,
    ink: [
      ...potInk,
      ...stems,
      ...leaves.flatMap((m) => (m.outline ? [m.outline] : [])),
      ...flowers.flatMap((m) => (m.outline ? [m.outline] : [])),
      ...centerInk,
      ground,
    ],
  };
}
const petals = [
  {
    outline:
      "M97 44C91 35 87 24 90 16C92 10 101 7 105 4C111 2 117 10 117 19C118 29 111 38 104 44",
    x: 101,
    y: 44,
    angle: -84,
    length: 40,
    width: 23,
    color: "#f18b65",
  },
  {
    outline:
      "M107 47C116 34 132 27 145 28C154 28 154 36 151 42C146 52 126 53 108 52",
    x: 108,
    y: 49,
    angle: -21,
    length: 47,
    width: 24,
    color: "#ed6688",
  },
  {
    outline:
      "M107 54C119 54 137 60 142 70C147 81 138 84 130 81C119 77 109 65 104 57",
    x: 106,
    y: 56,
    angle: 32,
    length: 42,
    width: 23,
    color: "#ed685b",
  },
  {
    outline: "M96 56C90 69 73 80 63 79C54 78 57 68 62 63C70 56 84 53 93 52",
    x: 94,
    y: 54,
    angle: 151,
    length: 42,
    width: 22,
    color: "#f29d7c",
  },
  {
    outline: "M93 47C79 47 61 43 57 34C50 22 60 18 67 21C79 25 89 36 97 44",
    x: 94,
    y: 46,
    angle: -149,
    length: 46,
    width: 24,
    color: "#ee736a",
  },
];
const leaves = [
  {
    outline:
      "M101 105C97 104 96 101 92 100C88 99 88 97 84 97C80 96 77 98 74 99C77 100 77 104 81 105C84 106 84 108 89 108C94 109 98 107 101 105",
    x: 100,
    y: 103,
    angle: -173,
    length: 28,
    width: 12,
    color: "#739a70",
  },
  {
    outline:
      "M103 97C107 97 108 99 112 98C117 98 118 95 122 94C127 92 128 87 131 83C127 84 125 82 121 85C117 87 114 86 111 90C108 92 106 94 103 97",
    x: 105,
    y: 96,
    angle: -29,
    length: 30,
    width: 13,
    color: "#a4ab58",
  },
  {
    outline:
      "M102 87C98 88 96 86 93 87C89 86 89 83 85 82C82 81 82 77 80 75C83 76 86 74 89 76C92 78 94 77 96 81C98 83 99 85 102 87",
    x: 101,
    y: 86,
    angle: -149,
    length: 24,
    width: 11,
    color: "#8da58a",
  },
];
// Local coordinates make adding a contour independent of the renderer.
function contour(
  x: number,
  y: number,
  angle: number,
  commands: [string, ...number[]][],
): string {
  const radians = (angle * Math.PI) / 180;
  return commands
    .map(
      ([verb, ...points]) =>
        verb +
        Array.from({ length: points.length / 2 }, (_, i) => {
          const dx = points[i * 2],
            dy = points[i * 2 + 1];
          return `${(x + dx * Math.cos(radians) - dy * Math.sin(radians)).toFixed(2)} ${(y + dx * Math.sin(radians) + dy * Math.cos(radians)).toFixed(2)}`;
        }).join(" "),
    )
    .join("");
}
function leaf(
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  color = "#739a70",
): BrushMark {
  return {
    x,
    y,
    angle,
    length,
    width,
    color,
    outline: contour(x, y, angle, [
      ["M", 0, 0],
      [
        "C",
        length * 0.2,
        -width * 0.1,
        length * 0.25,
        -width * 0.55,
        length * 0.45,
        -width * 0.45,
      ],
      [
        "C",
        length * 0.65,
        -width * 0.6,
        length * 0.8,
        -width * 0.25,
        length,
        0,
      ],
      [
        "C",
        length * 0.85,
        width * 0.12,
        length * 0.74,
        width * 0.5,
        length * 0.52,
        width * 0.42,
      ],
      ["C", length * 0.32, width * 0.6, length * 0.1, width * 0.2, 0, 0],
    ]),
  };
}
function petal(
  cx: number,
  cy: number,
  angle: number,
  length: number,
  width: number,
  color: string,
  root = 5,
): BrushMark {
  const a = (angle * Math.PI) / 180,
    x = cx + Math.cos(a) * root,
    y = cy + Math.sin(a) * root;
  return {
    x,
    y,
    angle,
    length,
    width,
    color,
    outline: contour(x, y, angle, [
      ["M", 0, -1],
      [
        "C",
        length * 0.3,
        -width * 0.25,
        length * 0.65,
        -width * 0.6,
        length * 0.86,
        -width * 0.4,
      ],
      [
        "C",
        length * 1.08,
        -width * 0.2,
        length * 1.03,
        width * 0.3,
        length * 0.8,
        width * 0.4,
      ],
      ["C", length * 0.5, width * 0.6, length * 0.15, width * 0.2, 0, 1],
    ]),
  };
}
const tulipLeaves = [
  leaf(100, 105, -142, 34, 12),
  leaf(101, 99, -48, 36, 12, "#8da58a"),
];
const tulipFlowers: BrushMark[] = [
  {
    outline: "M100 66C82 64 73 49 76 28C90 32 99 45 100 66",
    x: 98,
    y: 64,
    angle: -115,
    length: 36,
    width: 21,
    color: "#ee736a",
  },
  {
    outline: "M100 66C91 55 88 34 100 19C111 33 113 53 100 66",
    x: 100,
    y: 64,
    angle: -90,
    length: 43,
    width: 20,
    color: "#ed6688",
  },
  {
    outline: "M100 66C112 63 127 47 123 28C111 33 100 48 100 66",
    x: 103,
    y: 63,
    angle: -65,
    length: 35,
    width: 22,
    color: "#f18b65",
  },
];
const sunflowerPetals = Array.from({ length: 11 }, (_, i) =>
  petal(100, 44, -98 + (i * 360) / 11, 22 + (i % 3), 12, "#edb83e", 9),
);
const poppyFlowers: BrushMark[] = [
  {
    outline: "M99 43C86 47 66 37 69 24C63 12 82 10 89 16C97 10 108 25 101 38",
    x: 97,
    y: 39,
    angle: -132,
    length: 34,
    width: 30,
    color: "#e65c59",
  },
  {
    outline:
      "M104 40C102 26 116 13 125 22C139 17 145 34 135 39C131 48 117 49 106 45",
    x: 105,
    y: 41,
    angle: -33,
    length: 33,
    width: 29,
    color: "#ee736a",
  },
  {
    outline:
      "M106 47C120 42 138 52 133 64C138 74 120 80 114 70C104 72 101 57 102 49",
    x: 105,
    y: 48,
    angle: 46,
    length: 31,
    width: 29,
    color: "#e65c59",
  },
  {
    outline: "M97 48C85 42 67 47 70 60C64 70 78 79 85 71C97 78 104 62 99 50",
    x: 97,
    y: 49,
    angle: 139,
    length: 31,
    width: 28,
    color: "#ed6688",
  },
];
const lavenderStems = [
  "M100 110Q98 76 100 24",
  "M99 104Q83 77 74 41",
  "M102 103Q120 78 126 37",
];
const lavenderFlowers: BrushMark[] = [];
for (const [cx, cy, tilt] of [
  [100, 25, 0],
  [74, 42, -15],
  [126, 38, 15],
]) {
  for (let tier = 0; tier < 4; tier++)
    for (const side of [-1, 1]) {
      const y = cy + tier * 5,
        x = cx + (tier * tilt) / 25,
        angle = side < 0 ? -155 : -25;
      const mark = petal(
        x,
        y,
        angle,
        7 + tier * 0.4,
        5,
        tier % 2 ? "#9254b2" : "#6c4099",
        0,
      );
      lavenderFlowers.push({ ...mark, width: 7, cross: false });
    }
}
const lilyFlowers: BrushMark[] = [
  {
    outline:
      "M102 67C93 57 78 47 86 31C92 22 108 15 119 18C114 31 124 41 114 51C110 58 106 63 102 67",
    x: 103,
    y: 62,
    angle: -81,
    length: 43,
    width: 27,
    color: "#f29d7c",
  },
  {
    outline: "M102 67C107 51 106 36 119 18C105 23 99 33 101 44",
    x: 105,
    y: 59,
    angle: -72,
    length: 37,
    width: 14,
    color: "#ee736a",
    cross: false,
  },
  {
    outline: "M104 49L109 29Q110 26 111 29L107 50",
    x: 105,
    y: 49,
    angle: -79,
    length: 22,
    width: 4,
    color: "#edb83e",
    cross: false,
  },
];

export const plantDesigns: readonly PlantDesign[] = [
  design(
    "cosmos",
    "flower.plant.cosmos",
    ["M100 109C107 91 100 76 100 57"],
    leaves,
    petals,
    { x: 100, y: 50, radius: 4.4, color: "#d8ad50" },
  ),
  design(
    "tulip",
    "flower.plant.tulip",
    ["M100 110Q102 86 100 66"],
    tulipLeaves,
    tulipFlowers,
  ),
  design(
    "sunflower",
    "flower.plant.sunflower",
    ["M100 110Q96 81 100 55"],
    [leaf(99, 99, -155, 32, 19), leaf(99, 85, -29, 33, 20, "#a4ab58")],
    sunflowerPetals,
    { x: 100, y: 44, radius: 9, color: "#9a7657" },
  ),
  design(
    "poppy",
    "flower.plant.poppy",
    ["M100 110C88 92 110 78 100 49"],
    [leaf(98, 102, -158, 27, 10), leaf(99, 88, -36, 27, 11, "#8da58a")],
    poppyFlowers,
    { x: 101, y: 45, radius: 4.6, color: "#9a7657" },
  ),
  design(
    "lavender",
    "flower.plant.lavender",
    lavenderStems,
    [
      leaf(99, 103, -149, 27, 6),
      leaf(101, 101, -38, 30, 6, "#8da58a"),
      leaf(91, 88, -137, 22, 5),
      leaf(112, 87, -42, 22, 5, "#8da58a"),
    ],
    lavenderFlowers,
  ),
  design(
    "calla",
    "flower.plant.calla",
    ["M100 110Q106 84 103 65"],
    [leaf(99, 108, -136, 44, 18), leaf(101, 105, -55, 42, 17, "#8da58a")],
    lilyFlowers,
  ),
];
export function getPlantDesign(id: string): PlantDesign {
  return plantDesigns.find((plant) => plant.id === id) ?? plantDesigns[0];
}
export type PigmentRole = "pot" | "leaf" | "petal" | "center";
// Preserve the original atlas order/seeds, then discover new design colors.
export const pigmentPalette: { color: string; role: PigmentRole }[] = [
  { color: "#b96f49", role: "pot" },
  { color: "#739a70", role: "leaf" },
  { color: "#a4ab58", role: "leaf" },
  { color: "#8da58a", role: "leaf" },
  ...["#f18b65", "#ed6688", "#ed685b", "#f29d7c", "#ee736a"].map((color) => ({
    color,
    role: "petal" as const,
  })),
  { color: "#d8ad50", role: "center" },
];
for (const plant of plantDesigns) {
  for (const [marks, role] of [
    [plant.pot, "pot"],
    [plant.leaves, "leaf"],
    [plant.flowers, "petal"],
  ] as const)
    for (const mark of marks) {
      if (!pigmentPalette.some((p) => p.color === mark.color))
        pigmentPalette.push({ color: mark.color, role });
    }
  if (
    plant.center &&
    !pigmentPalette.some((p) => p.color === plant.center!.color)
  )
    pigmentPalette.push({ color: plant.center.color, role: "center" });
}
