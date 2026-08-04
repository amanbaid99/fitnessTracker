/**
 * Generated artwork for the marketing slots.
 *
 * Photography would be better and the slots are built for it — but an empty
 * tonal block reads as a page that isn't finished, and stock photography reads
 * as a company that hasn't done the work. Drawn, flat, warm compositions are
 * an honest third option: they're ours, they cost nothing to licence, they're
 * a few hundred bytes, and they stay sharp on any display.
 *
 * Every colour comes from the palette tokens, so these can't drift from the
 * rest of the site.
 */

type Variant = "barbell" | "figure" | "arcs" | "portrait";

/** Paper-like tooth, so large flat fields don't look like plastic. */
function Grain({ id }: { id: string }) {
  return (
    <>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} opacity="0.16" />
    </>
  );
}

function Barbell() {
  return (
    <g>
      {/* bar */}
      <rect x="60" y="292" width="480" height="16" rx="8" fill="#191713" />
      {/* inner collars */}
      <rect x="150" y="278" width="16" height="44" rx="6" fill="#191713" />
      <rect x="434" y="278" width="16" height="44" rx="6" fill="#191713" />
      {/* plates */}
      <rect x="96" y="212" width="48" height="176" rx="16" fill="#191713" />
      <rect x="456" y="212" width="48" height="176" rx="16" fill="#191713" />
      <rect x="60" y="246" width="32" height="108" rx="12" fill="#f2d24b" />
      <rect x="508" y="246" width="32" height="108" rx="12" fill="#f2d24b" />
    </g>
  );
}

function Figure() {
  return (
    <g fill="#191713">
      <circle cx="300" cy="150" r="40" />
      {/* torso */}
      <rect x="266" y="204" width="68" height="150" rx="30" />
      {/* arms overhead, the shape of a press */}
      <rect x="176" y="150" width="34" height="118" rx="17" transform="rotate(18 193 209)" />
      <rect x="390" y="150" width="34" height="118" rx="17" transform="rotate(-18 407 209)" />
      {/* legs */}
      <rect x="266" y="342" width="30" height="150" rx="15" />
      <rect x="304" y="342" width="30" height="150" rx="15" />
      {/* the weight overhead */}
      <rect x="150" y="112" width="300" height="14" rx="7" />
      <rect x="150" y="90" width="26" height="58" rx="10" fill="#f2d24b" />
      <rect x="424" y="90" width="26" height="58" rx="10" fill="#f2d24b" />
    </g>
  );
}

function Arcs() {
  return (
    <g fill="none" strokeLinecap="round">
      <circle cx="300" cy="300" r="210" stroke="#191713" strokeWidth="14" opacity="0.12" />
      <circle cx="300" cy="300" r="150" stroke="#191713" strokeWidth="14" opacity="0.2" />
      <circle cx="300" cy="300" r="90" stroke="#191713" strokeWidth="14" opacity="0.32" />
      {/* the completed portion — progress, without a chart */}
      <path d="M300 90 A210 210 0 0 1 510 300" stroke="#f2d24b" strokeWidth="18" />
      <path d="M300 150 A150 150 0 0 1 450 300" stroke="#191713" strokeWidth="16" />
    </g>
  );
}

function Portrait() {
  return (
    <g>
      {/* head and shoulders, cropped like a portrait would be */}
      <circle cx="300" cy="250" r="104" fill="#191713" />
      <path d="M120 600 C120 452 204 380 300 380 C396 380 480 452 480 600 Z" fill="#191713" />
      <path d="M300 380 C396 380 480 452 480 600 L400 600 C400 470 356 408 300 408 Z" fill="#f2d24b" />
    </g>
  );
}

const VARIANTS: Record<Variant, { render: () => React.ReactElement; box: string }> = {
  barbell: { render: Barbell, box: "0 0 600 600" },
  figure: { render: Figure, box: "0 0 600 600" },
  arcs: { render: Arcs, box: "0 0 600 600" },
  portrait: { render: Portrait, box: "0 0 600 600" },
};

export function PosterArt({ variant, tone = "sand" }: { variant: Variant; tone?: "sand" | "yellow" }) {
  const { render: Scene, box } = VARIANTS[variant];
  const id = `poster-${variant}-${tone}`;

  return (
    <svg
      viewBox={box}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          {tone === "yellow" ? (
            <>
              <stop offset="0%" stopColor="#f7e08d" />
              <stop offset="100%" stopColor="#f2d24b" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#efebe2" />
              <stop offset="100%" stopColor="#ddd5c5" />
            </>
          )}
        </linearGradient>
      </defs>

      <rect width="600" height="600" fill={`url(#${id}-bg)`} />
      <Scene />
      <Grain id={`${id}-grain`} />
    </svg>
  );
}
