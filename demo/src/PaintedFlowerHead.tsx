import { useId, type ReactNode } from "react";

// A single broad mark with uneven ends and dry bristle gaps.
const brushStroke =
  "M59 61C80 52 106 27 139 15l4 5-6 4 9-1 2 5-6 3h7l1 5C122 46 95 71 70 80l-5-4 7-4-9 2-3-4 6-4h-7Z";

export function PaintedFlowerHead({
  path,
  children,
}: {
  path: string;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <g>
      <defs>
        <clipPath id={`${id}-shape`}>
          <path d={path} />
        </clipPath>
        <linearGradient id={`${id}-pigment`} x1="0" y1="1" x2="1" y2="0">
          <stop
            offset="0"
            stopColor="var(--skin-flower-paint)"
            stopOpacity=".45"
          />
          <stop offset=".45" stopColor="var(--skin-flower-paint)" />
          <stop
            offset="1"
            stopColor="var(--skin-flower-paint)"
            stopOpacity=".65"
          />
        </linearGradient>
        <filter id={`${id}-edge`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".11 .32"
            numOctaves="2"
            seed="12"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="1.4"
            xChannelSelector="R"
            yChannelSelector="G"
            result="roughPaint"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".5 .18"
            numOctaves="2"
            seed="4"
            result="paper"
          />
          <feColorMatrix
            in="paper"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .7 .7 .7 0 -.25"
            result="dryPigment"
          />
          <feComposite in="roughPaint" in2="dryPigment" operator="in" />
        </filter>
        <mask
          id={`${id}-bristles`}
          maskUnits="userSpaceOnUse"
          x="50"
          y="5"
          width="110"
          height="85"
        >
          <path d={brushStroke} fill="white" stroke="none" />
          <g fill="none" stroke="black" strokeWidth=".65" strokeOpacity=".4">
            <path d="M64 65q32-13 78-44M67 71q35-16 78-43M71 76q28-12 76-41" />
          </g>
        </mask>
      </defs>
      <path d={path} stroke="none" />
      <g
        clipPath={`url(#${id}-shape)`}
        stroke="none"
        className="flower-paint-reveal"
      >
        <g className="flower-paint">
          <path
            d={brushStroke}
            fill={`url(#${id}-pigment)`}
            mask={`url(#${id}-bristles)`}
            filter={`url(#${id}-edge)`}
          />
        </g>
      </g>
      <path d={path} fill="none" />
      {children}
    </g>
  );
}
