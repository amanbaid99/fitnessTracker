import { cn } from "@/lib/utils";
import {
  resolveExercise,
  type MovementPattern,
  type MuscleGroup,
} from "@/lib/exerciseLibrary";

/**
 * Animated placeholder illustration for an exercise.
 *
 * Everything is inline SVG driven by the `ft-anim-*` keyframes in
 * globals.css — no image assets to ship or load, and the whole set stays
 * consistent because each movement pattern reuses the same stick figure.
 * Motion is disabled automatically under `prefers-reduced-motion`.
 */

interface Palette {
  from: string;
  to: string;
  ink: string;
  accent: string;
}

const PALETTES: Record<MuscleGroup, Palette> = {
  chest: { from: "#eef0ff", to: "#dde2ff", ink: "#4338ca", accent: "#6366f1" },
  back: { from: "#e7f4ff", to: "#d2ebff", ink: "#0369a1", accent: "#0ea5e9" },
  legs: { from: "#e7f8ef", to: "#d1f2e1", ink: "#15803d", accent: "#16a34a" },
  shoulders: { from: "#fff4e3", to: "#ffe7c2", ink: "#b45309", accent: "#f59e0b" },
  arms: { from: "#ffeaf0", to: "#ffd8e3", ink: "#be123c", accent: "#f43f5e" },
  core: { from: "#f4ecff", to: "#e7dbff", ink: "#6d28d9", accent: "#8b5cf6" },
  cardio: { from: "#ffefe6", to: "#ffdccb", ink: "#c2410c", accent: "#f97316" },
  mobility: { from: "#e4f7f6", to: "#ccefed", ink: "#0f766e", accent: "#14b8a6" },
  "full-body": { from: "#eff1f6", to: "#e0e5ee", ink: "#334155", accent: "#64748b" },
};

const SIZES = {
  sm: "size-11",
  md: "size-[60px]",
  lg: "size-[84px]",
} as const;

interface SceneProps {
  ink: string;
  accent: string;
}

function Ground({ accent }: { accent: string }) {
  return (
    <line
      x1="10"
      y1="55"
      x2="54"
      y2="55"
      stroke={accent}
      strokeOpacity="0.35"
      strokeWidth="2"
      strokeLinecap="round"
    />
  );
}

function Barbell({ y, accent, ink }: { y: number; accent: string; ink: string }) {
  return (
    <>
      <line x1="15" y1={y} x2="49" y2={y} stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy={y} r="4.5" fill={accent} />
      <circle cx="48" cy={y} r="4.5" fill={accent} />
    </>
  );
}

function LyingBody({ ink, accent }: SceneProps) {
  return (
    <>
      <rect x="12" y="41" width="40" height="5" rx="2.5" fill={accent} opacity="0.3" />
      <line x1="19" y1="46" x2="19" y2="54" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <line x1="45" y1="46" x2="45" y2="54" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="36" r="4" stroke={ink} strokeWidth="2.5" fill="none" />
      <line x1="22" y1="38" x2="40" y2="38" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <line x1="40" y1="38" x2="50" y2="46" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function StandingBody({ ink }: SceneProps) {
  return (
    <>
      <circle cx="32" cy="17" r="4.5" stroke={ink} strokeWidth="2.5" fill="none" />
      <line x1="32" y1="22" x2="32" y2="38" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="38" x2="26" y2="54" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="38" x2="38" y2="54" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function HorizontalPressScene(p: SceneProps) {
  return (
    <>
      <LyingBody {...p} />
      <g className="ft-anim-press">
        <Barbell y={24} {...p} />
        <line x1="26" y1="36" x2="26" y2="26" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
        <line x1="38" y1="36" x2="38" y2="26" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
      </g>
    </>
  );
}

function FlyScene(p: SceneProps) {
  return (
    <>
      <LyingBody {...p} />
      <g className="ft-anim-fly-left">
        <line x1="32" y1="34" x2="18" y2="26" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="25" r="3.5" fill={p.accent} />
      </g>
      <g className="ft-anim-fly-right">
        <line x1="32" y1="34" x2="46" y2="26" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="48" cy="25" r="3.5" fill={p.accent} />
      </g>
    </>
  );
}

function VerticalPressScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <StandingBody {...p} />
      <g className="ft-anim-lift">
        <Barbell y={11} {...p} />
        <line x1="26" y1="26" x2="26" y2="13" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
        <line x1="38" y1="26" x2="38" y2="13" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
      </g>
    </>
  );
}

function PulldownScene(p: SceneProps) {
  return (
    <>
      <line x1="12" y1="10" x2="52" y2="10" stroke={p.accent} strokeWidth="3" strokeLinecap="round" />
      <g className="ft-anim-lift">
        <line x1="24" y1="10" x2="27" y2="22" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="10" x2="37" y2="22" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="26" r="4.5" stroke={p.ink} strokeWidth="2.5" fill="none" />
        <line x1="32" y1="31" x2="32" y2="43" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="43" x2="27" y2="54" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="43" x2="37" y2="54" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </>
  );
}

function RowScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <circle cx="20" cy="22" r="4" stroke={p.ink} strokeWidth="2.5" fill="none" />
      <line x1="23" y1="25" x2="39" y2="33" stroke={p.ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="39" y1="33" x2="36" y2="53" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="39" y1="33" x2="43" y2="53" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <g className="ft-anim-press">
        <line x1="30" y1="29" x2="30" y2="40" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="42" x2="38" y2="42" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="22" cy="42" r="4" fill={p.accent} />
        <circle cx="38" cy="42" r="4" fill={p.accent} />
      </g>
    </>
  );
}

function SquatScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <g className="ft-anim-dip">
        <Barbell y={22} {...p} />
        <circle cx="32" cy="15" r="4.5" stroke={p.ink} strokeWidth="2.5" fill="none" />
        <line x1="32" y1="22" x2="32" y2="36" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <polyline
          points="32,36 26,44 29,53"
          fill="none"
          stroke={p.ink}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="32,36 38,44 35,53"
          fill="none"
          stroke={p.ink}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  );
}

function HingeScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <line x1="32" y1="34" x2="27" y2="54" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="34" x2="37" y2="54" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <g className="ft-anim-hinge">
        <circle cx="32" cy="14" r="4.5" stroke={p.ink} strokeWidth="2.5" fill="none" />
        <line x1="32" y1="19" x2="32" y2="34" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="25" x2="32" y2="40" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
        <Barbell y={42} {...p} />
      </g>
    </>
  );
}

function LungeScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <g className="ft-anim-dip">
        <circle cx="32" cy="16" r="4.5" stroke={p.ink} strokeWidth="2.5" fill="none" />
        <line x1="32" y1="21" x2="32" y2="36" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <polyline
          points="32,36 41,44 41,53"
          fill="none"
          stroke={p.ink}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="32,36 24,46 20,53"
          fill="none"
          stroke={p.ink}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="18" y="30" width="9" height="4" rx="2" fill={p.accent} />
        <rect x="37" y="30" width="9" height="4" rx="2" fill={p.accent} />
      </g>
    </>
  );
}

function CalfScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <rect x="18" y="49" width="28" height="5" rx="2.5" fill={p.accent} opacity="0.3" />
      <g className="ft-anim-hop">
        <StandingBody {...p} />
        <rect x="20" y="28" width="8" height="4" rx="2" fill={p.accent} />
        <rect x="36" y="28" width="8" height="4" rx="2" fill={p.accent} />
      </g>
    </>
  );
}

function LateralRaiseScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <StandingBody {...p} />
      <g className="ft-anim-raise-left">
        <line x1="30" y1="26" x2="21" y2="39" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="16" y="38" width="9" height="4" rx="2" fill={p.accent} />
      </g>
      <g className="ft-anim-raise-right">
        <line x1="34" y1="26" x2="43" y2="39" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="39" y="38" width="9" height="4" rx="2" fill={p.accent} />
      </g>
    </>
  );
}

function CurlScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <StandingBody {...p} />
      <line x1="27" y1="25" x2="24" y2="33" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="37" y1="25" x2="40" y2="33" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <g className="ft-anim-curl-left">
        <line x1="24" y1="33" x2="22" y2="44" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="17" y="43" width="9" height="4" rx="2" fill={p.accent} />
      </g>
      <g className="ft-anim-curl-right">
        <line x1="40" y1="33" x2="42" y2="44" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="38" y="43" width="9" height="4" rx="2" fill={p.accent} />
      </g>
    </>
  );
}

function TricepsScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <rect x="44" y="10" width="12" height="32" rx="3" fill={p.accent} opacity="0.25" />
      <circle cx="50" cy="12" r="3" stroke={p.ink} strokeWidth="2" fill="none" />
      <line x1="50" y1="15" x2="50" y2="20" stroke={p.ink} strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="17" r="4.5" stroke={p.ink} strokeWidth="2.5" fill="none" />
      <line x1="26" y1="22" x2="26" y2="38" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="38" x2="21" y2="54" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26" y1="38" x2="31" y2="54" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <g className="ft-anim-press">
        <line x1="50" y1="20" x2="38" y2="26" stroke={p.accent} strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="26" x2="38" y2="26" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="34" y="24" width="10" height="4" rx="2" fill={p.accent} />
      </g>
    </>
  );
}

function CoreScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <g className="ft-anim-hop">
        <circle cx="47" cy="30" r="4" stroke={p.ink} strokeWidth="2.5" fill="none" />
        <line x1="43" y1="33" x2="18" y2="43" stroke={p.ink} strokeWidth="3" strokeLinecap="round" />
        <line x1="42" y1="34" x2="41" y2="47" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="41" y1="47" x2="47" y2="49" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18" y1="43" x2="14" y2="50" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </>
  );
}

function CardioScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <circle cx="32" cy="15" r="4.5" stroke={p.ink} strokeWidth="2.5" fill="none" />
      <line x1="32" y1="20" x2="32" y2="38" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      <g className="ft-anim-stride-front">
        <line x1="32" y1="38" x2="24" y2="52" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g className="ft-anim-stride-back">
        <line x1="32" y1="38" x2="40" y2="52" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g className="ft-anim-stride-back">
        <line x1="32" y1="25" x2="23" y2="32" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g className="ft-anim-stride-front">
        <line x1="32" y1="25" x2="41" y2="32" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </>
  );
}

function CarryScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <g className="ft-anim-drift">
        <StandingBody {...p} />
        <line x1="26" y1="25" x2="23" y2="36" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="38" y1="25" x2="41" y2="36" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="17" y="36" width="12" height="5" rx="2.5" fill={p.accent} />
        <rect x="35" y="36" width="12" height="5" rx="2.5" fill={p.accent} />
      </g>
    </>
  );
}

function MobilityScene(p: SceneProps) {
  return (
    <>
      <Ground accent={p.accent} />
      <g className="ft-anim-sway">
        <circle cx="32" cy="20" r="4.5" stroke={p.ink} strokeWidth="2.5" fill="none" />
        <line x1="32" y1="25" x2="32" y2="40" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="40" x2="27" y2="54" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="40" x2="37" y2="54" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M32 27 C24 24 22 16 26 11"
          fill="none"
          stroke={p.ink}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M32 27 C40 24 42 16 38 11"
          fill="none"
          stroke={p.ink}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </>
  );
}

const SCENES: Record<MovementPattern, (p: SceneProps) => React.ReactElement> = {
  "horizontal-press": HorizontalPressScene,
  "vertical-press": VerticalPressScene,
  fly: FlyScene,
  triceps: TricepsScene,
  curl: CurlScene,
  row: RowScene,
  pulldown: PulldownScene,
  squat: SquatScene,
  hinge: HingeScene,
  lunge: LungeScene,
  calf: CalfScene,
  "lateral-raise": LateralRaiseScene,
  core: CoreScene,
  cardio: CardioScene,
  carry: CarryScene,
  mobility: MobilityScene,
};

interface ExerciseArtProps {
  name: string;
  exerciseId?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function ExerciseArt({
  name,
  exerciseId,
  size = "md",
  className,
}: ExerciseArtProps) {
  const { pattern, group } = resolveExercise(name, exerciseId);
  const palette = PALETTES[group];
  const Scene = SCENES[pattern];
  const gradientId = `ft-art-${group}`;

  return (
    <div
      className={cn(
        "ft-art shrink-0 overflow-hidden rounded-xl",
        SIZES[size],
        className,
      )}
      style={{ background: `linear-gradient(140deg, ${palette.from}, ${palette.to})` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="size-full">
        <defs>
          <radialGradient id={gradientId}>
            <stop offset="0%" stopColor={palette.accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          className="ft-anim-breathe"
          cx="32"
          cy="32"
          r="26"
          fill={`url(#${gradientId})`}
        />
        <Scene ink={palette.ink} accent={palette.accent} />
      </svg>
    </div>
  );
}

/** Small coloured dot + label pair, handy next to an exercise name. */
export function MuscleGroupDot({ group }: { group: MuscleGroup }) {
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ backgroundColor: PALETTES[group].accent }}
    />
  );
}
