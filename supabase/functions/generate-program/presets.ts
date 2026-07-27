// GENERATED FILE — do not edit.
// Run `npm run sync:edge` to regenerate from src/lib/planPresets.ts.

export interface Preset {
  id: string;
  name: string;
  daysPerWeek: number;
  days: unknown[];
}

export const PRESETS: Preset[] = [
  {
    "id": "ppl",
    "name": "Push / Pull / Legs",
    "daysPerWeek": 3,
    "days": [
      {
        "id": "day-1",
        "title": "Day 1 — Push",
        "exercises": [
          {
            "name": "Barbell Bench Press",
            "sets": 4,
            "reps": "8",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "barbell-bench-press",
            "alternates": [
              {
                "name": "Dumbbell Bench Press",
                "exerciseId": "dumbbell-bench-press",
                "sets": 4,
                "reps": "8"
              },
              {
                "name": "Machine Chest Press",
                "exerciseId": "machine-chest-press",
                "sets": 4,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Overhead Press",
            "sets": 3,
            "reps": "8",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "overhead-press",
            "alternates": [
              {
                "name": "Dumbbell Shoulder Press",
                "exerciseId": "dumbbell-shoulder-press",
                "sets": 3,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Incline Dumbbell Press",
            "sets": 3,
            "reps": "10",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "incline-dumbbell-press",
            "alternates": [
              {
                "name": "Incline Barbell Press",
                "exerciseId": "incline-barbell-press",
                "sets": 3,
                "reps": "10"
              }
            ]
          },
          {
            "name": "Lateral Raise",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "lateral-raise",
            "alternates": []
          },
          {
            "name": "Triceps Pushdown",
            "sets": 3,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "triceps-pushdown",
            "alternates": [
              {
                "name": "Overhead Triceps Extension",
                "exerciseId": "overhead-triceps-extension",
                "sets": 3,
                "reps": "12"
              }
            ]
          }
        ]
      },
      {
        "id": "day-2",
        "title": "Day 2 — Pull",
        "exercises": [
          {
            "name": "Pull-Up",
            "sets": 4,
            "reps": "8",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "pull-up",
            "alternates": [
              {
                "name": "Lat Pulldown",
                "exerciseId": "lat-pulldown",
                "sets": 4,
                "reps": "8"
              },
              {
                "name": "Assisted Pull-Up",
                "exerciseId": "assisted-pull-up",
                "sets": 4,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Barbell Row",
            "sets": 3,
            "reps": "10",
            "rest": "75s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "barbell-row",
            "alternates": [
              {
                "name": "Dumbbell Row",
                "exerciseId": "dumbbell-row",
                "sets": 3,
                "reps": "10"
              },
              {
                "name": "Seated Cable Row",
                "exerciseId": "seated-row",
                "sets": 3,
                "reps": "10"
              }
            ]
          },
          {
            "name": "Seated Cable Row",
            "sets": 3,
            "reps": "12",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "seated-row",
            "alternates": [
              {
                "name": "Chest Supported Row",
                "exerciseId": "chest-supported-row",
                "sets": 3,
                "reps": "12"
              }
            ]
          },
          {
            "name": "Face Pull",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "6",
            "exerciseId": "face-pull",
            "alternates": [
              {
                "name": "Rear Delt Fly",
                "exerciseId": "rear-delt-fly",
                "sets": 3,
                "reps": "15"
              }
            ]
          },
          {
            "name": "Barbell Curl",
            "sets": 3,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "barbell-curl",
            "alternates": [
              {
                "name": "Dumbbell Curl",
                "exerciseId": "dumbbell-curl",
                "sets": 3,
                "reps": "12"
              },
              {
                "name": "Hammer Curl",
                "exerciseId": "hammer-curl",
                "sets": 3,
                "reps": "12"
              }
            ]
          }
        ]
      },
      {
        "id": "day-3",
        "title": "Day 3 — Legs",
        "exercises": [
          {
            "name": "Back Squat",
            "sets": 4,
            "reps": "6",
            "rest": "120s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "back-squat",
            "alternates": [
              {
                "name": "Front Squat",
                "exerciseId": "front-squat",
                "sets": 4,
                "reps": "6"
              },
              {
                "name": "Leg Press",
                "exerciseId": "leg-press",
                "sets": 4,
                "reps": "6"
              },
              {
                "name": "Goblet Squat",
                "exerciseId": "goblet-squat",
                "sets": 4,
                "reps": "6"
              }
            ]
          },
          {
            "name": "Romanian Deadlift",
            "sets": 3,
            "reps": "10",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "romanian-deadlift",
            "alternates": [
              {
                "name": "Leg Curl",
                "exerciseId": "leg-curl",
                "sets": 3,
                "reps": "10"
              }
            ]
          },
          {
            "name": "Leg Press",
            "sets": 3,
            "reps": "12",
            "rest": "75s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "leg-press",
            "alternates": [
              {
                "name": "Hack Squat",
                "exerciseId": "hack-squat",
                "sets": 3,
                "reps": "12"
              }
            ]
          },
          {
            "name": "Walking Lunge",
            "sets": 3,
            "reps": "12/leg",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "walking-lunge",
            "alternates": [
              {
                "name": "Bulgarian Split Squat",
                "exerciseId": "bulgarian-split-squat",
                "sets": 3,
                "reps": "12/leg"
              },
              {
                "name": "Step-Up",
                "exerciseId": "step-up",
                "sets": 3,
                "reps": "12/leg"
              }
            ]
          },
          {
            "name": "Standing Calf Raise",
            "sets": 4,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "standing-calf-raise",
            "alternates": [
              {
                "name": "Seated Calf Raise",
                "exerciseId": "seated-calf-raise",
                "sets": 4,
                "reps": "15"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "upper-lower",
    "name": "Upper / Lower",
    "daysPerWeek": 4,
    "days": [
      {
        "id": "day-1",
        "title": "Day 1 — Upper (Strength)",
        "exercises": [
          {
            "name": "Barbell Bench Press",
            "sets": 4,
            "reps": "6",
            "rest": "120s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "barbell-bench-press",
            "alternates": [
              {
                "name": "Dumbbell Bench Press",
                "exerciseId": "dumbbell-bench-press",
                "sets": 4,
                "reps": "6"
              }
            ]
          },
          {
            "name": "Barbell Row",
            "sets": 4,
            "reps": "6",
            "rest": "120s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "barbell-row",
            "alternates": [
              {
                "name": "Chest Supported Row",
                "exerciseId": "chest-supported-row",
                "sets": 4,
                "reps": "6"
              }
            ]
          },
          {
            "name": "Overhead Press",
            "sets": 3,
            "reps": "8",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "overhead-press",
            "alternates": [
              {
                "name": "Dumbbell Shoulder Press",
                "exerciseId": "dumbbell-shoulder-press",
                "sets": 3,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Lat Pulldown",
            "sets": 3,
            "reps": "10",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "lat-pulldown",
            "alternates": [
              {
                "name": "Pull-Up",
                "exerciseId": "pull-up",
                "sets": 3,
                "reps": "10"
              }
            ]
          },
          {
            "name": "Barbell Curl",
            "sets": 3,
            "reps": "10",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "barbell-curl",
            "alternates": [
              {
                "name": "Dumbbell Curl",
                "exerciseId": "dumbbell-curl",
                "sets": 3,
                "reps": "10"
              }
            ]
          }
        ]
      },
      {
        "id": "day-2",
        "title": "Day 2 — Lower (Strength)",
        "exercises": [
          {
            "name": "Back Squat",
            "sets": 4,
            "reps": "6",
            "rest": "120s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "back-squat",
            "alternates": [
              {
                "name": "Front Squat",
                "exerciseId": "front-squat",
                "sets": 4,
                "reps": "6"
              },
              {
                "name": "Leg Press",
                "exerciseId": "leg-press",
                "sets": 4,
                "reps": "6"
              }
            ]
          },
          {
            "name": "Romanian Deadlift",
            "sets": 3,
            "reps": "8",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "romanian-deadlift",
            "alternates": [
              {
                "name": "Conventional Deadlift",
                "exerciseId": "conventional-deadlift",
                "sets": 3,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Bulgarian Split Squat",
            "sets": 3,
            "reps": "10/leg",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "bulgarian-split-squat",
            "alternates": [
              {
                "name": "Walking Lunge",
                "exerciseId": "walking-lunge",
                "sets": 3,
                "reps": "10/leg"
              }
            ]
          },
          {
            "name": "Standing Calf Raise",
            "sets": 4,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "standing-calf-raise",
            "alternates": []
          },
          {
            "name": "Plank",
            "sets": 3,
            "reps": "45s",
            "rest": "30s",
            "tempo": "2-0-2",
            "rpe": "6",
            "exerciseId": "plank",
            "alternates": [
              {
                "name": "Dead Bug",
                "exerciseId": "dead-bug",
                "sets": 3,
                "reps": "45s"
              }
            ]
          }
        ]
      },
      {
        "id": "day-3",
        "title": "Day 3 — Upper (Volume)",
        "exercises": [
          {
            "name": "Incline Dumbbell Press",
            "sets": 4,
            "reps": "10",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "incline-dumbbell-press",
            "alternates": [
              {
                "name": "Incline Barbell Press",
                "exerciseId": "incline-barbell-press",
                "sets": 4,
                "reps": "10"
              }
            ]
          },
          {
            "name": "Seated Cable Row",
            "sets": 4,
            "reps": "12",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "seated-row",
            "alternates": [
              {
                "name": "Dumbbell Row",
                "exerciseId": "dumbbell-row",
                "sets": 4,
                "reps": "12"
              }
            ]
          },
          {
            "name": "Lateral Raise",
            "sets": 4,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "lateral-raise",
            "alternates": []
          },
          {
            "name": "Cable Fly",
            "sets": 3,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "cable-fly",
            "alternates": [
              {
                "name": "Dumbbell Fly",
                "exerciseId": "dumbbell-fly",
                "sets": 3,
                "reps": "12"
              }
            ]
          },
          {
            "name": "Triceps Pushdown",
            "sets": 3,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "triceps-pushdown",
            "alternates": [
              {
                "name": "Bench Dip",
                "exerciseId": "bench-dip",
                "sets": 3,
                "reps": "12"
              }
            ]
          }
        ]
      },
      {
        "id": "day-4",
        "title": "Day 4 — Lower (Volume)",
        "exercises": [
          {
            "name": "Leg Press",
            "sets": 4,
            "reps": "12",
            "rest": "75s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "leg-press",
            "alternates": [
              {
                "name": "Hack Squat",
                "exerciseId": "hack-squat",
                "sets": 4,
                "reps": "12"
              },
              {
                "name": "Goblet Squat",
                "exerciseId": "goblet-squat",
                "sets": 4,
                "reps": "12"
              }
            ]
          },
          {
            "name": "Leg Curl",
            "sets": 3,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "leg-curl",
            "alternates": [
              {
                "name": "Romanian Deadlift",
                "exerciseId": "romanian-deadlift",
                "sets": 3,
                "reps": "12"
              }
            ]
          },
          {
            "name": "Hip Thrust",
            "sets": 3,
            "reps": "12",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "hip-thrust",
            "alternates": [
              {
                "name": "Glute Bridge",
                "exerciseId": "glute-bridge",
                "sets": 3,
                "reps": "12"
              }
            ]
          },
          {
            "name": "Leg Extension",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "leg-extension",
            "alternates": []
          },
          {
            "name": "Seated Calf Raise",
            "sets": 4,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "seated-calf-raise",
            "alternates": []
          }
        ]
      }
    ]
  },
  {
    "id": "bro-split",
    "name": "Bro Split",
    "daysPerWeek": 5,
    "days": [
      {
        "id": "day-1",
        "title": "Day 1 — Chest",
        "exercises": [
          {
            "name": "Barbell Bench Press",
            "sets": 4,
            "reps": "8",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "barbell-bench-press",
            "alternates": [
              {
                "name": "Dumbbell Bench Press",
                "exerciseId": "dumbbell-bench-press",
                "sets": 4,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Incline Dumbbell Press",
            "sets": 4,
            "reps": "10",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "incline-dumbbell-press",
            "alternates": []
          },
          {
            "name": "Machine Chest Press",
            "sets": 3,
            "reps": "12",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "machine-chest-press",
            "alternates": []
          },
          {
            "name": "Cable Fly",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "cable-fly",
            "alternates": [
              {
                "name": "Dumbbell Fly",
                "exerciseId": "dumbbell-fly",
                "sets": 3,
                "reps": "15"
              }
            ]
          },
          {
            "name": "Push-Up",
            "sets": 2,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "push-up",
            "alternates": []
          }
        ]
      },
      {
        "id": "day-2",
        "title": "Day 2 — Back",
        "exercises": [
          {
            "name": "Pull-Up",
            "sets": 4,
            "reps": "8",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "pull-up",
            "alternates": [
              {
                "name": "Lat Pulldown",
                "exerciseId": "lat-pulldown",
                "sets": 4,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Barbell Row",
            "sets": 4,
            "reps": "10",
            "rest": "75s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "barbell-row",
            "alternates": []
          },
          {
            "name": "Seated Cable Row",
            "sets": 3,
            "reps": "12",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "seated-row",
            "alternates": []
          },
          {
            "name": "Straight-Arm Pulldown",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "straight-arm-pulldown",
            "alternates": []
          },
          {
            "name": "Face Pull",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "6",
            "exerciseId": "face-pull",
            "alternates": []
          }
        ]
      },
      {
        "id": "day-3",
        "title": "Day 3 — Shoulders",
        "exercises": [
          {
            "name": "Overhead Press",
            "sets": 4,
            "reps": "8",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "overhead-press",
            "alternates": [
              {
                "name": "Dumbbell Shoulder Press",
                "exerciseId": "dumbbell-shoulder-press",
                "sets": 4,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Arnold Press",
            "sets": 3,
            "reps": "10",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "arnold-press",
            "alternates": []
          },
          {
            "name": "Lateral Raise",
            "sets": 4,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "lateral-raise",
            "alternates": []
          },
          {
            "name": "Rear Delt Fly",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "rear-delt-fly",
            "alternates": [
              {
                "name": "Face Pull",
                "exerciseId": "face-pull",
                "sets": 3,
                "reps": "15"
              }
            ]
          },
          {
            "name": "Barbell Shrug",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "shrug",
            "alternates": []
          }
        ]
      },
      {
        "id": "day-4",
        "title": "Day 4 — Legs",
        "exercises": [
          {
            "name": "Back Squat",
            "sets": 4,
            "reps": "8",
            "rest": "120s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "back-squat",
            "alternates": [
              {
                "name": "Leg Press",
                "exerciseId": "leg-press",
                "sets": 4,
                "reps": "8"
              }
            ]
          },
          {
            "name": "Romanian Deadlift",
            "sets": 3,
            "reps": "10",
            "rest": "90s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "romanian-deadlift",
            "alternates": []
          },
          {
            "name": "Leg Press",
            "sets": 3,
            "reps": "12",
            "rest": "75s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "leg-press",
            "alternates": []
          },
          {
            "name": "Leg Curl",
            "sets": 3,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "leg-curl",
            "alternates": []
          },
          {
            "name": "Standing Calf Raise",
            "sets": 4,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "standing-calf-raise",
            "alternates": []
          }
        ]
      },
      {
        "id": "day-5",
        "title": "Day 5 — Arms",
        "exercises": [
          {
            "name": "Barbell Curl",
            "sets": 4,
            "reps": "10",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "barbell-curl",
            "alternates": [
              {
                "name": "Dumbbell Curl",
                "exerciseId": "dumbbell-curl",
                "sets": 4,
                "reps": "10"
              }
            ]
          },
          {
            "name": "Close-Grip Bench Press",
            "sets": 4,
            "reps": "10",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "close-grip-bench",
            "alternates": [
              {
                "name": "Bench Dip",
                "exerciseId": "bench-dip",
                "sets": 4,
                "reps": "10"
              }
            ]
          },
          {
            "name": "Hammer Curl",
            "sets": 3,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "hammer-curl",
            "alternates": []
          },
          {
            "name": "Overhead Triceps Extension",
            "sets": 3,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "overhead-triceps-extension",
            "alternates": []
          },
          {
            "name": "Cable Curl",
            "sets": 3,
            "reps": "15",
            "rest": "30s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "cable-curl",
            "alternates": [
              {
                "name": "Preacher Curl",
                "exerciseId": "preacher-curl",
                "sets": 3,
                "reps": "15"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "home",
    "name": "Home Workouts",
    "daysPerWeek": 3,
    "days": [
      {
        "id": "day-1",
        "title": "Day 1 — Full Body A",
        "exercises": [
          {
            "name": "Bodyweight Squat",
            "sets": 4,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "bodyweight-squat",
            "alternates": [
              {
                "name": "Wall Sit",
                "exerciseId": "wall-sit",
                "sets": 4,
                "reps": "15"
              }
            ]
          },
          {
            "name": "Push-Up",
            "sets": 4,
            "reps": "12",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "push-up",
            "alternates": [
              {
                "name": "Incline Push-Up",
                "exerciseId": "incline-push-up",
                "sets": 4,
                "reps": "12"
              }
            ]
          },
          {
            "name": "Glute Bridge",
            "sets": 3,
            "reps": "15",
            "rest": "30s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "glute-bridge",
            "alternates": [
              {
                "name": "Hip Thrust",
                "exerciseId": "hip-thrust",
                "sets": 3,
                "reps": "15"
              }
            ]
          },
          {
            "name": "Plank",
            "sets": 3,
            "reps": "45s",
            "rest": "30s",
            "tempo": "2-0-2",
            "rpe": "6",
            "exerciseId": "plank",
            "alternates": []
          },
          {
            "name": "Mountain Climbers",
            "sets": 3,
            "reps": "30s",
            "rest": "30s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "mountain-climbers",
            "alternates": [
              {
                "name": "Burpee",
                "exerciseId": "burpee",
                "sets": 3,
                "reps": "30s"
              }
            ]
          }
        ]
      },
      {
        "id": "day-2",
        "title": "Day 2 — Full Body B",
        "exercises": [
          {
            "name": "Reverse Lunge",
            "sets": 4,
            "reps": "12/leg",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "reverse-lunge",
            "alternates": [
              {
                "name": "Step-Up",
                "exerciseId": "step-up",
                "sets": 4,
                "reps": "12/leg"
              }
            ]
          },
          {
            "name": "Incline Push-Up",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "incline-push-up",
            "alternates": [
              {
                "name": "Push-Up",
                "exerciseId": "push-up",
                "sets": 3,
                "reps": "15"
              }
            ]
          },
          {
            "name": "Inverted Row",
            "sets": 3,
            "reps": "10",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "inverted-row",
            "alternates": [
              {
                "name": "Band Pull-Apart",
                "exerciseId": "band-pull-apart",
                "sets": 3,
                "reps": "10"
              }
            ]
          },
          {
            "name": "Dead Bug",
            "sets": 3,
            "reps": "10/side",
            "rest": "30s",
            "tempo": "2-0-2",
            "rpe": "6",
            "exerciseId": "dead-bug",
            "alternates": [
              {
                "name": "Bird Dog",
                "exerciseId": "bird-dog",
                "sets": 3,
                "reps": "10/side"
              }
            ]
          },
          {
            "name": "Jump Rope",
            "sets": 3,
            "reps": "60s",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "jump-rope",
            "alternates": [
              {
                "name": "Burpee",
                "exerciseId": "burpee",
                "sets": 3,
                "reps": "60s"
              }
            ]
          }
        ]
      },
      {
        "id": "day-3",
        "title": "Day 3 — Full Body C",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "sets": 3,
            "reps": "10/leg",
            "rest": "60s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "bulgarian-split-squat",
            "alternates": [
              {
                "name": "Reverse Lunge",
                "exerciseId": "reverse-lunge",
                "sets": 3,
                "reps": "10/leg"
              }
            ]
          },
          {
            "name": "Push-Up",
            "sets": 3,
            "reps": "15",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "push-up",
            "alternates": []
          },
          {
            "name": "Glute Bridge",
            "sets": 3,
            "reps": "20",
            "rest": "30s",
            "tempo": "2-0-2",
            "rpe": "7",
            "exerciseId": "glute-bridge",
            "alternates": []
          },
          {
            "name": "Side Plank",
            "sets": 3,
            "reps": "30s/side",
            "rest": "30s",
            "tempo": "2-0-2",
            "rpe": "6",
            "exerciseId": "side-plank",
            "alternates": [
              {
                "name": "Plank",
                "exerciseId": "plank",
                "sets": 3,
                "reps": "30s/side"
              }
            ]
          },
          {
            "name": "Burpee",
            "sets": 3,
            "reps": "10",
            "rest": "45s",
            "tempo": "2-0-2",
            "rpe": "8",
            "exerciseId": "burpee",
            "alternates": [
              {
                "name": "Mountain Climbers",
                "exerciseId": "mountain-climbers",
                "sets": 3,
                "reps": "10"
              }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * The preset closest to what the client asked for. Home-only training rules
 * out the gym splits entirely; otherwise it's whichever runs nearest to their
 * available days.
 */
export function pickPreset(daysPerWeek: number, atHome: boolean): Preset {
  const pool = atHome
    ? PRESETS.filter((p) => p.id === "home")
    : PRESETS.filter((p) => p.id !== "home");
  const candidates = pool.length > 0 ? pool : PRESETS;

  return [...candidates].sort(
    (a, b) => Math.abs(a.daysPerWeek - daysPerWeek) - Math.abs(b.daysPerWeek - daysPerWeek),
  )[0];
}
