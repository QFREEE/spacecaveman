import type { MessageKey } from "./i18n/en";
import { getAllPlantPalettes } from "./plantPalettes";

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
      ...(id === "sunflower" ? sunflowerSeedInk : []),
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
  const a = (angle * Math.PI) / 180;
  const x = cx + Math.cos(a) * root,
    y = cy + Math.sin(a) * root;
  // Fixed variation gives each stroke a bent tip and unequal shoulders.
  // It stays the same across care, refreshes, and every color of this plant.
  const gesture = Math.sin(cx * 0.37 + cy * 0.23 + angle * 0.19);
  const turn = Math.cos(cx * 0.21 - cy * 0.31 + angle * 0.13);
  const span = length * (1 + gesture * 0.065);
  const curl = width * turn * 0.28;
  return {
    x,
    y,
    angle,
    length: span,
    width,
    color,
    outline: contour(x, y, angle, [
      ["M", 0, -0.7],
      [
        "C",
        span * 0.23,
        -width * 0.12,
        span * (0.4 + gesture * 0.06),
        -width * (0.67 + turn * 0.09),
        span * 0.73,
        -width * 0.4 + curl * 0.35,
      ],
      [
        "C",
        span * 0.91,
        -width * 0.5 + curl,
        span * 1.08,
        -width * 0.1 + curl,
        span,
        width * 0.08 + curl,
      ],
      [
        "C",
        span * 0.9,
        width * 0.32 + curl,
        span * 0.68,
        width * (0.6 - gesture * 0.12),
        span * 0.43,
        width * 0.35,
      ],
      ["C", span * 0.23, width * 0.22, span * 0.12, -width * 0.02, 0, 0.7],
    ]),
  };
}
const tulipLeaves = [
  leaf(100, 105, -142, 34, 12),
  leaf(101, 99, -48, 36, 12, "#8da58a"),
];
const tulipFlowers: BrushMark[] = [
  {
    outline:
      "M100 66C83 65 72 52 76 35Q75 30 79 28C84 35 92 34 96 46Q101 55 100 66",
    x: 98,
    y: 64,
    angle: -115,
    length: 36,
    width: 21,
    color: "#ee736a",
  },
  {
    outline:
      "M100 66C91 56 91 44 95 34C97 29 96 23 102 20C111 28 113 39 108 49Q107 59 100 66",
    x: 100,
    y: 64,
    angle: -90,
    length: 43,
    width: 20,
    color: "#ed6688",
  },
  {
    outline:
      "M100 66C116 64 127 51 123 39Q121 34 124 30C116 29 111 37 108 44C102 49 104 58 100 66",
    x: 103,
    y: 63,
    angle: -65,
    length: 35,
    width: 22,
    color: "#f18b65",
  },
];
// A broad seed disk and short, pointed rays distinguish this from the daisy.
const sunflowerPetals = Array.from({ length: 17 }, (_, i) => {
  const angle = -97 + (i * 360) / 17 + Math.sin(i * 2.1) * 2.8;
  const radians = (angle * Math.PI) / 180;
  const x = 100 + Math.cos(radians) * 16;
  const y = 44 + Math.sin(radians) * 16;
  const length = 15.5 + Math.sin(i * 1.7) * 2.5;
  const width = 11 + Math.cos(i * 2.3);
  const bend = Math.sin(i * 1.9) * 2;
  return {
    x,
    y,
    angle,
    length,
    width,
    color: "#edb83e",
    outline: contour(x, y, angle, [
      ["M", 0, -2.1],
      [
        "C",
        length * 0.3,
        -width * 0.62,
        length * 0.88,
        -width * 0.45,
        length,
        bend,
      ],
      [
        "C",
        length * 0.9,
        width * 0.3 + bend,
        length * 0.51,
        width * 0.66,
        length * 0.25,
        width * 0.39,
      ],
      ["Q", length * 0.08, width * 0.25, 0, 2.1],
    ]),
  };
});
// Loose crossing curves suggest the seed pattern without individual dots.
const sunflowerSeedInk = [-38, 49].flatMap((angle) =>
  [-10.5, -3.5, 3.5, 10.5].map((offset, index) => {
    const halfChord = Math.sqrt(16.2 ** 2 - offset ** 2);
    const bow = index % 2 ? 1.1 : 1.6;
    return contour(100, 44, angle, [
      ["M", -halfChord, offset],
      [
        "C",
        -halfChord * 0.35,
        offset + bow,
        halfChord * 0.38,
        offset + bow,
        halfChord,
        offset,
      ],
    ]);
  }),
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
      const y =
          cy + tier * 5 + (side > 0 ? 1.5 : -0.5) + Math.sin(tier + cx) * 0.7,
        x = cx + (tier * tilt) / 25 + Math.sin(tier * 1.9) * 0.7,
        angle = (side < 0 ? -151 : -29) + Math.sin(tier * 2.1 + cx + side) * 12;
      const mark = petal(
        x,
        y,
        angle,
        7 + tier * 0.3 + Math.sin(cx + tier + side) * 1.2,
        4.8 + Math.cos(tier + side) * 0.6,
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

// Alternate pigments within a plant so adjacent washes retain subtle variation.
function shades(marks: BrushMark[], colors: readonly string[]): BrushMark[] {
  return marks.map((mark, index) => ({
    ...mark,
    color: colors[index % colors.length],
  }));
}

const roseFlowers: BrushMark[] = [
  {
    outline:
      "M100 67C81 65 70 49 76 33C79 24 88 27 94 32C100 23 111 24 119 32C135 34 129 55 117 62Q110 69 100 67",
    x: 79,
    y: 48,
    angle: -8,
    length: 46,
    width: 35,
    color: "#d83f78",
    cross: false,
  },
  {
    outline:
      "M79 39Q91 33 99 45Q98 57 110 62M122 34Q113 39 113 49Q106 61 91 58",
    x: 84,
    y: 41,
    angle: 25,
    length: 33,
    width: 21,
    color: "#f383a7",
    cross: false,
  },
  {
    outline: "M89 34Q102 29 113 38Q118 50 106 54Q96 53 93 44Q88 40 89 34",
    x: 92,
    y: 34,
    angle: 51,
    length: 24,
    width: 18,
    color: "#b83263",
    cross: false,
  },
  {
    outline: "M96 38Q103 33 109 40Q111 47 104 47Q99 45 101 40",
    x: 98,
    y: 39,
    angle: 15,
    length: 11,
    width: 9,
    color: "#f383a7",
    cross: false,
  },
];
const daisyFlowers = Array.from({ length: 13 }, (_, i) =>
  petal(
    101,
    44,
    -94 + (i * 360) / 13 + Math.sin(i * 2.4) * 4,
    24 + Math.sin(i * 1.8) * 3,
    7 + Math.cos(i * 1.3) * 0.8,
    i % 2 ? "#d6d9ef" : "#b7c7df",
    7,
  ),
);
const irisFlowers: BrushMark[] = [
  petal(100, 48, -126, 29, 18, "#9867d7", 1),
  petal(100, 48, -90, 36, 17, "#b79ae9", 0),
  petal(100, 48, -51, 31, 19, "#9867d7", 1),
  {
    outline:
      "M99 48C85 42 71 45 67 54Q61 63 70 67C78 73 82 63 88 62Q94 57 99 48",
    x: 97,
    y: 49,
    angle: 152,
    length: 33,
    width: 19,
    color: "#6554bd",
  },
  {
    outline:
      "M102 48C117 43 133 45 134 55C139 62 131 69 123 65Q114 66 112 58Q107 53 102 48",
    x: 104,
    y: 49,
    angle: 29,
    length: 32,
    width: 19,
    color: "#6554bd",
  },
  {
    outline:
      "M100 48C88 58 92 66 91 71Q92 81 103 77C114 79 114 66 108 60Q108 54 100 48",
    x: 100,
    y: 51,
    angle: 88,
    length: 27,
    width: 16,
    color: "#9867d7",
  },
  {
    outline: "M100 51L102 63",
    x: 100,
    y: 51,
    angle: 80,
    length: 12,
    width: 4,
    color: "#edb83e",
    cross: false,
  },
];
const daffodilFlowers: BrushMark[] = [
  ...Array.from({ length: 6 }, (_, i) =>
    petal(
      100,
      44,
      [-94, -28, 34, 91, 153, 208][i],
      [28, 30, 26, 29, 25, 30][i],
      [18, 20, 19, 21, 18, 20][i],
      i % 2 ? "#f5cf53" : "#edb83e",
      3,
    ),
  ),
  {
    outline:
      "M91 39Q99 34 109 39C108 45 113 46 114 51Q101 61 86 51C89 47 88 43 91 39Z",
    x: 91,
    y: 38,
    angle: 48,
    length: 20,
    width: 17,
    color: "#f39a35",
    cross: false,
  },
  {
    outline:
      "M86 51Q88 44 92 48Q96 43 100 47Q105 43 108 48Q113 45 114 51Q101 61 86 51",
    x: 88,
    y: 51,
    angle: 0,
    length: 24,
    width: 10,
    color: "#e97b39",
    cross: false,
  },
];
const hydrangeaFlowers = [
  [85, 28],
  [103, 24],
  [120, 31],
  [73, 43],
  [92, 43],
  [111, 43],
  [128, 47],
  [83, 59],
  [102, 61],
  [119, 62],
].flatMap(([x, y], cluster) =>
  [-135, -45, 45, 135].map((angle, index) => ({
    ...petal(
      x,
      y,
      angle + Math.sin(cluster * 1.7) * 17 + Math.sin(index + cluster) * 6,
      8 + Math.sin(cluster * 2.3 + index) * 1.1,
      7.5 + Math.cos(cluster + index * 1.6) * 1.2,
      ["#638bd8", "#61b7c7", "#9b8bd9"][(cluster + index) % 3],
      0.5,
    ),
    cross: false,
  })),
);
const valleyBells = [
  [109, 29],
  [121, 40],
  [125, 53],
  [121, 66],
  [112, 77],
];
const valleyFlowers: BrushMark[] = valleyBells.map(([x, y], i) => ({
  outline: `M${x - 5} ${y}Q${x} ${y - 5} ${x + 5} ${y}Q${x + 5} ${y + 7} ${x + 8} ${y + 10}Q${x + 4} ${y + 14} ${x + 1} ${y + 10}Q${x - 3} ${y + 14} ${x - 8} ${y + 10}Q${x - 5} ${y + 6} ${x - 5} ${y}Z`,
  x,
  y,
  angle: 90,
  length: 12,
  width: 13,
  color: i % 2 ? "#c3dfcf" : "#b9d9df",
  cross: false,
}));

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
    shades(tulipLeaves, ["#438b76", "#76ac80"]),
    shades(tulipFlowers, ["#e85885", "#bd3f70", "#f383a7"]),
  ),
  design(
    "sunflower",
    "flower.plant.sunflower",
    [
      "M98 110C100 92 99 74 98 61",
      "M101 110C103 93 102 75 101 61",
      "M99 104Q86 91 72 78M88 93Q80 94 77 90M88 93Q89 85 85 82",
      "M102 89Q115 78 129 65M113 79Q113 72 118 69M113 79Q121 80 125 75",
    ],
    [
      leaf(99, 104, -135, 39, 23, "#809346"),
      leaf(102, 89, -42, 37, 22, "#a4ab58"),
    ],
    shades(sunflowerPetals, ["#edb83e", "#f5cf53"]),
    { x: 100, y: 44, radius: 16.5, color: "#b87318" },
  ),
  design(
    "poppy",
    "flower.plant.poppy",
    ["M100 110C88 92 110 78 100 49"],
    [
      leaf(98, 102, -158, 27, 10, "#568d89"),
      leaf(99, 88, -36, 27, 11, "#7bab9e"),
    ],
    shades(poppyFlowers, ["#e65c59", "#f18b65", "#d94b43", "#ee736a"]),
    { x: 101, y: 45, radius: 4.6, color: "#9a7657" },
  ),
  design(
    "lavender",
    "flower.plant.lavender",
    lavenderStems,
    shades(
      [
        leaf(99, 103, -149, 27, 6),
        leaf(101, 101, -38, 30, 6, "#8da58a"),
        leaf(91, 88, -137, 22, 5),
        leaf(112, 87, -42, 22, 5, "#8da58a"),
      ],
      ["#719b98", "#9bb5a8"],
    ),
    lavenderFlowers,
  ),
  design(
    "calla",
    "flower.plant.calla",
    ["M100 110Q106 84 103 65"],
    [
      leaf(99, 108, -136, 44, 18, "#438b76"),
      leaf(101, 105, -55, 42, 17, "#739a70"),
    ],
    lilyFlowers,
  ),
  design(
    "rose",
    "flower.plant.rose",
    ["M100 111Q98 89 102 65M100 91l-5-4M100 79l5-3"],
    [
      leaf(100, 101, -151, 30, 16, "#337e68"),
      leaf(100, 86, -31, 28, 15, "#5ba080"),
    ],
    roseFlowers,
  ),
  design(
    "daisy",
    "flower.plant.daisy",
    ["M100 110Q106 80 101 51"],
    [
      leaf(102, 101, -150, 27, 8, "#76ac80"),
      leaf(103, 87, -32, 26, 8, "#9cb966"),
    ],
    daisyFlowers,
    { x: 101, y: 44, radius: 7, color: "#edb83e" },
  ),
  design(
    "iris",
    "flower.plant.iris",
    ["M100 111Q101 91 100 49"],
    [
      leaf(97, 110, -106, 49, 9, "#568d89"),
      leaf(103, 111, -72, 51, 10, "#719b98"),
    ],
    irisFlowers,
  ),
  design(
    "daffodil",
    "flower.plant.daffodil",
    ["M100 110Q96 79 100 56"],
    [
      leaf(96, 110, -115, 43, 8, "#809346"),
      leaf(104, 110, -67, 50, 9, "#9cb966"),
    ],
    daffodilFlowers,
  ),
  design(
    "hydrangea",
    "flower.plant.hydrangea",
    ["M100 110Q98 88 102 65M100 86l-14-9M100 86l16-10"],
    [
      leaf(99, 98, -150, 36, 22, "#337e68"),
      leaf(101, 87, -25, 34, 21, "#438b76"),
    ],
    hydrangeaFlowers,
  ),
  design(
    "lily-of-the-valley",
    "flower.plant.valley",
    [
      "M99 111C92 85 91 64 92 42Q92 18 109 24",
      ...valleyBells.map(
        ([x, y]) => `M93 ${y + 6}Q${x - 4} ${y - 9} ${x} ${y}`,
      ),
    ],
    [
      leaf(98, 111, -117, 58, 23, "#5ba080"),
      leaf(103, 110, -62, 49, 21, "#7bab9e"),
    ],
    valleyFlowers,
  ),
];
// Reference 35 keeps its historical storage key, but now depicts a bluebell.
const bluebellBells = [
  [107, 31],
  [117, 44],
  [122, 59],
  [121, 75],
  [115, 90],
];
const bluebellDesign = design(
  "bluebell",
  "flower.plant.bluebell",
  [
    "M98 111C92 89 91 62 95 41Q98 24 107 28",
    ...bluebellBells.map(
      ([x, y], i) => `M${94 + i * 0.3} ${y + 2}Q${x - 1} ${y - 9} ${x} ${y}`,
    ),
  ],
  [
    leaf(97, 111, -106, 59, 8),
    leaf(101, 111, -76, 64, 9),
    leaf(104, 111, -57, 45, 7),
  ],
  bluebellBells.map(([x, y], i) => ({
    x,
    y,
    angle: 83 + i * 3,
    length: 15,
    width: 9,
    color: i % 2 ? "#5264cc" : "#3448ac",
    outline: contour(x, y, 83 + i * 3, [
      ["M", 0, -2.4],
      ["C", 4, -3.7, 10, -2.6, 14, -4.8],
      ["Q", 17, -6.7, 15, -3.2],
      ["Q", 13, -1, 16, 0],
      ["Q", 13, 1.5, 15, 4],
      ["Q", 12, 3.2, 10, 2.9],
      ["C", 6, 3.6, 2, 3.2, 0, 2.4],
      ["Q", -1.5, 0, 0, -2.4],
    ]),
  })),
);
// Stable objects avoid repainting when care or unrelated UI state has not changed.
const paletteDesigns = new Map<string, PlantDesign>();
for (const plant of plantDesigns) {
  for (const palette of getAllPlantPalettes(plant.id)) {
    const source =
      plant.id === "lily-of-the-valley" && palette.id === "ivory"
        ? bluebellDesign
        : plant;
    paletteDesigns.set(plant.id + ":" + palette.id, {
      ...source,
      leaves: source.leaves.map((mark, i) => ({
        ...mark,
        color: palette.leaves[i % palette.leaves.length],
      })),
      flowers: source.flowers.map((mark, i) => ({
        ...mark,
        color:
          palette.accents?.[i] ?? palette.flowers[i % palette.flowers.length],
      })),
      center: source.center
        ? { ...source.center, color: palette.center ?? source.center.color }
        : undefined,
    });
  }
}
export function getPlantDesign(
  id: string,
  paletteId = "original",
): PlantDesign {
  return (
    paletteDesigns.get(id + ":" + paletteId) ??
    plantDesigns.find((plant) => plant.id === id) ??
    plantDesigns[0]
  );
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
for (const plant of [...plantDesigns, ...paletteDesigns.values()]) {
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
