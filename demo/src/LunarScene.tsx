// Original code-drawn artwork; no recovered Qzone/Tencent assets.
export function Caveman({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      fill="var(--skin-surface)"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="47" cy="32" r="29" strokeWidth="1" />
      <path
        d="M31 29q-4-22 19-20l13 10-8-2 4 9-10-5-5 8-6-6z"
        fill="currentColor"
      />
      <path d="M31 29q-3 22 18 22 18-1 13-24M35 47l-8 37 10-4 9 6 9-7 11 5-9-36z" />
      <path d="M34 58l-12 12-10-6m45-8 13 12 14-19M38 60l4 6m10-10 3 8M32 74l5-3m18 4 4 3" />
      <circle cx="43" cy="33" r="1" fill="currentColor" />
      <circle cx="55" cy="32" r="1" fill="currentColor" />
      <path d="M44 42q6 4 10-1M80 54l8-25q-2-10-8-4l-6 23z" />
      <g className="walk-leg leg-a">
        <path d="M38 84l-4 19-13 5q-3 5 4 5h15l5-28" />
      </g>
      <g className="walk-leg leg-b">
        <path d="M52 84l5 19 13 5q3 5-4 5H51l-6-28" />
      </g>
    </svg>
  );
}

export function LunarScene() {
  return (
    <div className="lunar-scene" aria-hidden="true">
      <span className="scene-stars">·　+　　　.　　　　+　　　·</span>
      <svg
        className="moon-ground"
        viewBox="0 0 960 130"
        preserveAspectRatio="none"
        fill="var(--skin-surface)"
        stroke="var(--skin-link)"
        strokeWidth="1.5"
      >
        <path d="M-5 58Q145 5 321 48T645 36T965 39V135H-5Z" />
        <ellipse cx="730" cy="74" rx="43" ry="8" />
        <path d="M696 72q33-13 68 0M55 88q24-8 46 0m360 10q20-9 45 0M182 63l9-4 12 3-7 5z" />
        <path
          d="M350 83l5 1m11 4 5 1m12 3 5 1m13 1 5 1"
          strokeDasharray="2 2"
          strokeWidth="3"
        />
      </svg>
      <div className="caveman-traveler">
        <Caveman />
      </div>
      <span className="moon-caption">THE MOON IS A VERY BIG BACKYARD.</span>
    </div>
  );
}
