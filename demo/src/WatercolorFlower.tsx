import { useId } from "react";

// Sketch and pigment stay separate: transparent flat-brush marks may cross ink edges.
const petals = [
  {
    outline: "M96 36C88 24 85 6 97 5C111 2 113 22 104 36",
    x: 100,
    y: 36,
    angle: -90,
    length: 34,
    width: 15,
    color: "#ee9d7c",
  },
  {
    outline: "M108 38C119 23 139 16 140 27C145 40 124 47 109 44",
    x: 109,
    y: 41,
    angle: -30,
    length: 35,
    width: 16,
    color: "#e88398",
  },
  {
    outline: "M109 47C126 47 140 56 136 66C130 76 114 62 104 51",
    x: 107,
    y: 49,
    angle: 32,
    length: 33,
    width: 17,
    color: "#e87d6b",
  },
  {
    outline: "M95 49C85 65 68 73 64 62C61 52 77 46 91 43",
    x: 93,
    y: 47,
    angle: 151,
    length: 35,
    width: 16,
    color: "#edae94",
  },
  {
    outline: "M91 39C74 39 59 28 65 18C73 10 90 24 97 35",
    x: 93,
    y: 38,
    angle: -145,
    length: 35,
    width: 17,
    color: "#e8887d",
  },
];
const leaves = [
  {
    outline: "M98 105C84 107 70 100 68 90C80 86 94 94 98 105",
    x: 97,
    y: 102,
    angle: -157,
    length: 31,
    width: 12,
    color: "#739a70",
  },
  {
    outline: "M103 91C111 76 128 72 133 77C131 90 115 98 103 95",
    x: 105,
    y: 92,
    angle: -28,
    length: 32,
    width: 13,
    color: "#a4ab58",
  },
  {
    outline: "M99 83C87 85 77 77 76 69C85 65 96 72 99 83",
    x: 98,
    y: 81,
    angle: -151,
    length: 26,
    width: 11,
    color: "#8da58a",
  },
];
const ink = [
  "M75 112L80 140Q100 147 121 139L126 112",
  "M73 110Q99 104 128 110L127 117Q101 122 73 116Z",
  "M100 109Q97 77 101 48",
  "M99 101L94 99M102 94L110 88M99 81L93 77",
  ...leaves.map((leaf) => leaf.outline),
  ...petals.map((petal) => petal.outline),
  "M104 43C104 49 95 49 95 43C95 37 104 37 104 43",
  "M12 141Q28 135 44 140M43 137Q58 130 77 136M123 136Q142 132 151 139M151 141Q169 136 185 142",
];
const flatWash =
  "M0-0.43L.07-.49 .14-.44 .28-.48 .44-.43 .63-.48 .81-.44 .94-.48 1-.37 .96-.22 1.02-.1 .97 .02 1.01 .18 .96 .3 .99 .43 .84 .47 .69 .42 .5 .48 .31 .44 .14 .49 .02 .41 -.02 .26 .02 .08 -.01-.12Z";
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function Wash({
  progress,
  x,
  y,
  angle,
  length,
  width,
  color,
}: {
  progress: number;
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  color: string;
}) {
  const id = useId();
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${length} ${width})`}
    >
      <defs>
        <clipPath id={id}>
          <rect
            className="flower-wash-window"
            x="-.03"
            y="-.6"
            width={progress * 1.1}
            height="1.2"
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path d={flatWash} fill={color} opacity=".62" />
        <path
          d="M.02-.32Q.32-.44 .59-.32T.98-.33L.96-.2Q.6-.29 .3-.22L.03-.19Z"
          fill={color}
          opacity=".14"
        />
        <path
          d="M.12 .28Q.5 .36 .96 .24L.98 .39Q.55 .49 .1 .4Z"
          fill={color}
          opacity=".19"
        />
      </g>
    </g>
  );
}

export function WatercolorFlower({
  stats,
}: {
  stats: Record<"rain" | "sun" | "love" | "food", number>;
}) {
  const id = useId();
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
    >
      <defs>
        <filter
          id={`${id}-paper`}
          x="-12%"
          y="-12%"
          width="124%"
          height="124%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".7"
            numOctaves="3"
            seed="8"
            result="paper"
          />
          <feColorMatrix
            in="paper"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1   .3 .3 .3 0 .2"
            result="grain"
          />
          <feComposite in="SourceGraphic" in2="grain" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}-paper)`} stroke="none">
        <g data-paint="pot" data-progress={pot}>
          {[0, 1, 2, 3, 4].map((row) => (
            <Wash
              key={row}
              progress={clamp(pot * 5 - row)}
              x={row % 2 ? 125 : 74}
              y={111 + row * 6.8}
              angle={row % 2 ? 180 : 0}
              length={row === 0 ? 54 : 51 - row * 2}
              width={9}
              color="#b96f49"
            />
          ))}
        </g>
        <g data-paint="leaves" data-progress={greenery}>
          {leaves.map((leaf, index) => (
            <Wash
              key={index}
              {...leaf}
              progress={clamp(greenery * leaves.length - index)}
            />
          ))}
        </g>
        <g data-paint="petals" data-progress={flower}>
          {petals.map((petal, index) => (
            <Wash
              key={index}
              {...petal}
              progress={clamp(flower * 5.5 - index)}
            />
          ))}
          <circle
            cx="100"
            cy="43"
            r="4.4"
            fill="#d8ad50"
            opacity={clamp(flower * 11 - 10) * 0.78}
          />
        </g>
      </g>
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
