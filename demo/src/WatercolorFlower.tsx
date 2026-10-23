import { useId } from "react";

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
    outline: "M98 106C82 109 65 103 60 91C72 93 87 94 98 106",
    x: 97,
    y: 104,
    angle: -160,
    length: 39,
    width: 13,
    color: "#739a70",
  },
  {
    outline: "M104 99C114 85 129 85 147 83C142 96 122 104 104 99",
    x: 105,
    y: 98,
    angle: -22,
    length: 44,
    width: 15,
    color: "#a4ab58",
  },
  {
    outline: "M100 88C88 91 75 85 72 78C84 76 96 81 100 88",
    x: 99,
    y: 87,
    angle: -157,
    length: 30,
    width: 11,
    color: "#8da58a",
  },
];
const ink = [
  "M75 112L80 140Q100 147 121 139L126 112",
  "M73 110Q99 104 128 110L127 117Q101 122 73 116Z",
  "M100 109C107 91 100 76 100 57",
  "M101 102L95 102M103 99Q108 87 114 83M102 91L97 86",
  ...leaves.map((leaf) => leaf.outline),
  ...petals.map((petal) => petal.outline),
  "M104 50C105 56 95 56 95 50C95 44 104 44 104 50",
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
        <path d={flatWash} fill={color} opacity=".44" />
        <path
          d="M.02-.32Q.32-.44 .59-.32T.98-.33L.96-.2Q.6-.29 .3-.22L.03-.19Z"
          fill={color}
          opacity=".09"
        />
        <path
          d="M.12 .28Q.5 .36 .96 .24L.98 .39Q.55 .49 .1 .4Z"
          fill={color}
          opacity=".12"
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
            cy="50"
            r="4.4"
            fill="#d8ad50"
            opacity={clamp(flower * 11 - 10) * 0.6}
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
