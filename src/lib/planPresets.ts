import { getExerciseById } from "@/lib/exerciseLibrary";
import type { PlanDay, PlanExercise } from "@/lib/planTemplates";

/**
 * Ready-made programs a member can start with straight away, without waiting
 * on a coach. Each one is a real split people actually run, built from the
 * exercise catalog so every movement gets its illustration and alternates.
 */

export type PresetId = "ppl" | "upper-lower" | "bro-split" | "home";

export interface PlanPreset {
  id: PresetId;
  name: string;
  tagline: string;
  /** Who it suits — shown on the choice card. */
  bestFor: string;
  daysPerWeek: number;
  recommended?: boolean;
  days: PlanDay[];
}

/** Builds an exercise from a catalog id, falling back to the id as a name. */
function pe(
  id: string,
  sets: number,
  reps: string,
  rest: string,
  rpe = "7",
  alternateIds: string[] = [],
): PlanExercise {
  const catalog = getExerciseById(id);
  return {
    name: catalog?.name ?? id,
    sets,
    reps,
    rest,
    tempo: "2-0-2",
    rpe,
    exerciseId: catalog?.id,
    alternates: alternateIds.map((alternateId) => {
      const alternate = getExerciseById(alternateId);
      return {
        name: alternate?.name ?? alternateId,
        exerciseId: alternate?.id,
        sets,
        reps,
      };
    }),
  };
}

export const PLAN_PRESETS: PlanPreset[] = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    tagline: "The most popular split there is — train each muscle twice a week by running it twice.",
    bestFor: "Most people, beginner through advanced",
    daysPerWeek: 3,
    recommended: true,
    days: [
      {
        id: "day-1",
        title: "Day 1 — Push",
        exercises: [
          pe("barbell-bench-press", 4, "8", "90s", "8", ["dumbbell-bench-press", "machine-chest-press"]),
          pe("overhead-press", 3, "8", "90s", "7", ["dumbbell-shoulder-press"]),
          pe("incline-dumbbell-press", 3, "10", "60s", "7", ["incline-barbell-press"]),
          pe("lateral-raise", 3, "15", "45s", "7"),
          pe("triceps-pushdown", 3, "12", "45s", "8", ["overhead-triceps-extension"]),
        ],
      },
      {
        id: "day-2",
        title: "Day 2 — Pull",
        exercises: [
          pe("pull-up", 4, "8", "90s", "8", ["lat-pulldown", "assisted-pull-up"]),
          pe("barbell-row", 3, "10", "75s", "7", ["dumbbell-row", "seated-row"]),
          pe("seated-row", 3, "12", "60s", "7", ["chest-supported-row"]),
          pe("face-pull", 3, "15", "45s", "6", ["rear-delt-fly"]),
          pe("barbell-curl", 3, "12", "45s", "8", ["dumbbell-curl", "hammer-curl"]),
        ],
      },
      {
        id: "day-3",
        title: "Day 3 — Legs",
        exercises: [
          pe("back-squat", 4, "6", "120s", "8", ["front-squat", "leg-press", "goblet-squat"]),
          pe("romanian-deadlift", 3, "10", "90s", "7", ["leg-curl"]),
          pe("leg-press", 3, "12", "75s", "8", ["hack-squat"]),
          pe("walking-lunge", 3, "12/leg", "60s", "7", ["bulgarian-split-squat", "step-up"]),
          pe("standing-calf-raise", 4, "15", "45s", "7", ["seated-calf-raise"]),
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    tagline: "Four focused sessions a week, split top and bottom. Great balance of volume and recovery.",
    bestFor: "Training four days a week",
    daysPerWeek: 4,
    days: [
      {
        id: "day-1",
        title: "Day 1 — Upper (Strength)",
        exercises: [
          pe("barbell-bench-press", 4, "6", "120s", "8", ["dumbbell-bench-press"]),
          pe("barbell-row", 4, "6", "120s", "8", ["chest-supported-row"]),
          pe("overhead-press", 3, "8", "90s", "7", ["dumbbell-shoulder-press"]),
          pe("lat-pulldown", 3, "10", "60s", "7", ["pull-up"]),
          pe("barbell-curl", 3, "10", "45s", "7", ["dumbbell-curl"]),
        ],
      },
      {
        id: "day-2",
        title: "Day 2 — Lower (Strength)",
        exercises: [
          pe("back-squat", 4, "6", "120s", "8", ["front-squat", "leg-press"]),
          pe("romanian-deadlift", 3, "8", "90s", "7", ["conventional-deadlift"]),
          pe("bulgarian-split-squat", 3, "10/leg", "60s", "7", ["walking-lunge"]),
          pe("standing-calf-raise", 4, "12", "45s", "7"),
          pe("plank", 3, "45s", "30s", "6", ["dead-bug"]),
        ],
      },
      {
        id: "day-3",
        title: "Day 3 — Upper (Volume)",
        exercises: [
          pe("incline-dumbbell-press", 4, "10", "60s", "7", ["incline-barbell-press"]),
          pe("seated-row", 4, "12", "60s", "7", ["dumbbell-row"]),
          pe("lateral-raise", 4, "15", "45s", "7"),
          pe("cable-fly", 3, "12", "45s", "7", ["dumbbell-fly"]),
          pe("triceps-pushdown", 3, "12", "45s", "8", ["bench-dip"]),
        ],
      },
      {
        id: "day-4",
        title: "Day 4 — Lower (Volume)",
        exercises: [
          pe("leg-press", 4, "12", "75s", "7", ["hack-squat", "goblet-squat"]),
          pe("leg-curl", 3, "12", "45s", "7", ["romanian-deadlift"]),
          pe("hip-thrust", 3, "12", "60s", "7", ["glute-bridge"]),
          pe("leg-extension", 3, "15", "45s", "7"),
          pe("seated-calf-raise", 4, "15", "45s", "7"),
        ],
      },
    ],
  },
  {
    id: "bro-split",
    name: "Bro Split",
    tagline: "One muscle group a day, five days a week. Plenty of volume per session.",
    bestFor: "Five gym days and a focus on size",
    daysPerWeek: 5,
    days: [
      {
        id: "day-1",
        title: "Day 1 — Chest",
        exercises: [
          pe("barbell-bench-press", 4, "8", "90s", "8", ["dumbbell-bench-press"]),
          pe("incline-dumbbell-press", 4, "10", "60s", "7"),
          pe("machine-chest-press", 3, "12", "60s", "7"),
          pe("cable-fly", 3, "15", "45s", "7", ["dumbbell-fly"]),
          pe("push-up", 2, "15", "45s", "7"),
        ],
      },
      {
        id: "day-2",
        title: "Day 2 — Back",
        exercises: [
          pe("pull-up", 4, "8", "90s", "8", ["lat-pulldown"]),
          pe("barbell-row", 4, "10", "75s", "7"),
          pe("seated-row", 3, "12", "60s", "7"),
          pe("straight-arm-pulldown", 3, "15", "45s", "7"),
          pe("face-pull", 3, "15", "45s", "6"),
        ],
      },
      {
        id: "day-3",
        title: "Day 3 — Shoulders",
        exercises: [
          pe("overhead-press", 4, "8", "90s", "8", ["dumbbell-shoulder-press"]),
          pe("arnold-press", 3, "10", "60s", "7"),
          pe("lateral-raise", 4, "15", "45s", "7"),
          pe("rear-delt-fly", 3, "15", "45s", "7", ["face-pull"]),
          pe("shrug", 3, "15", "45s", "7"),
        ],
      },
      {
        id: "day-4",
        title: "Day 4 — Legs",
        exercises: [
          pe("back-squat", 4, "8", "120s", "8", ["leg-press"]),
          pe("romanian-deadlift", 3, "10", "90s", "7"),
          pe("leg-press", 3, "12", "75s", "8"),
          pe("leg-curl", 3, "12", "45s", "7"),
          pe("standing-calf-raise", 4, "15", "45s", "7"),
        ],
      },
      {
        id: "day-5",
        title: "Day 5 — Arms",
        exercises: [
          pe("barbell-curl", 4, "10", "45s", "8", ["dumbbell-curl"]),
          pe("close-grip-bench", 4, "10", "60s", "7", ["bench-dip"]),
          pe("hammer-curl", 3, "12", "45s", "7"),
          pe("overhead-triceps-extension", 3, "12", "45s", "7"),
          pe("cable-curl", 3, "15", "30s", "7", ["preacher-curl"]),
        ],
      },
    ],
  },
  {
    id: "home",
    name: "Home Workouts",
    tagline: "No gym, no equipment. Three full-body sessions you can do in a living room.",
    bestFor: "Training at home or while travelling",
    daysPerWeek: 3,
    days: [
      {
        id: "day-1",
        title: "Day 1 — Full Body A",
        exercises: [
          pe("bodyweight-squat", 4, "15", "45s", "7", ["wall-sit"]),
          pe("push-up", 4, "12", "45s", "7", ["incline-push-up"]),
          pe("glute-bridge", 3, "15", "30s", "7", ["hip-thrust"]),
          pe("plank", 3, "45s", "30s", "6"),
          pe("mountain-climbers", 3, "30s", "30s", "7", ["burpee"]),
        ],
      },
      {
        id: "day-2",
        title: "Day 2 — Full Body B",
        exercises: [
          pe("reverse-lunge", 4, "12/leg", "45s", "7", ["step-up"]),
          pe("incline-push-up", 3, "15", "45s", "7", ["push-up"]),
          pe("inverted-row", 3, "10", "60s", "7", ["band-pull-apart"]),
          pe("dead-bug", 3, "10/side", "30s", "6", ["bird-dog"]),
          pe("jump-rope", 3, "60s", "45s", "7", ["burpee"]),
        ],
      },
      {
        id: "day-3",
        title: "Day 3 — Full Body C",
        exercises: [
          pe("bulgarian-split-squat", 3, "10/leg", "60s", "7", ["reverse-lunge"]),
          pe("push-up", 3, "15", "45s", "8"),
          pe("glute-bridge", 3, "20", "30s", "7"),
          pe("side-plank", 3, "30s/side", "30s", "6", ["plank"]),
          pe("burpee", 3, "10", "45s", "8", ["mountain-climbers"]),
        ],
      },
    ],
  },
];

export function getPreset(id: string | null | undefined): PlanPreset | undefined {
  return PLAN_PRESETS.find((preset) => preset.id === id);
}
