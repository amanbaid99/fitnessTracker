export interface PlanExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  tempo: string;
  rpe: string;
}

export interface PlanDay {
  id: string;
  title: string;
  exercises: PlanExercise[];
}

export type Goal = "build-muscle" | "fat-loss" | "general-fitness";

const TEMPLATES: Record<Goal, PlanDay[]> = {
  "build-muscle": [
    {
      id: "day-1",
      title: "Day 1 — Upper Body Push",
      exercises: [
        { name: "Barbell Bench Press", sets: 4, reps: "8", rest: "90s", tempo: "3-1-1", rpe: "8" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10", rest: "60s", tempo: "2-1-1", rpe: "7" },
        { name: "Cable Fly", sets: 3, reps: "12", rest: "45s", tempo: "2-1-2", rpe: "7" },
        { name: "Triceps Pushdown", sets: 3, reps: "12", rest: "45s", tempo: "2-0-2", rpe: "8" },
      ],
    },
    {
      id: "day-2",
      title: "Day 2 — Lower Body",
      exercises: [
        { name: "Back Squat", sets: 4, reps: "6", rest: "120s", tempo: "3-1-1", rpe: "8" },
        { name: "Romanian Deadlift", sets: 3, reps: "10", rest: "90s", tempo: "3-1-1", rpe: "7" },
        { name: "Leg Press", sets: 3, reps: "12", rest: "60s", tempo: "2-0-2", rpe: "8" },
        { name: "Standing Calf Raise", sets: 4, reps: "15", rest: "45s", tempo: "2-1-2", rpe: "7" },
      ],
    },
    {
      id: "day-3",
      title: "Day 3 — Upper Body Pull",
      exercises: [
        { name: "Pull-Up", sets: 4, reps: "8", rest: "90s", tempo: "2-1-1", rpe: "8" },
        { name: "Barbell Row", sets: 3, reps: "10", rest: "75s", tempo: "2-1-1", rpe: "7" },
        { name: "Lat Pulldown", sets: 3, reps: "12", rest: "60s", tempo: "2-1-2", rpe: "7" },
        { name: "Barbell Curl", sets: 3, reps: "12", rest: "45s", tempo: "2-0-2", rpe: "8" },
      ],
    },
  ],
  "fat-loss": [
    {
      id: "day-1",
      title: "Day 1 — Full Body Circuit",
      exercises: [
        { name: "Goblet Squat", sets: 3, reps: "15", rest: "45s", tempo: "2-0-2", rpe: "7" },
        { name: "Push-Up", sets: 3, reps: "12", rest: "45s", tempo: "2-0-2", rpe: "7" },
        { name: "Dumbbell Row", sets: 3, reps: "12", rest: "45s", tempo: "2-0-2", rpe: "7" },
        { name: "Kettlebell Swing", sets: 3, reps: "20", rest: "30s", tempo: "1-0-1", rpe: "8" },
      ],
    },
    {
      id: "day-2",
      title: "Day 2 — Conditioning",
      exercises: [
        { name: "Rowing Machine Intervals", sets: 6, reps: "250m", rest: "60s", tempo: "-", rpe: "8" },
        { name: "Walking Lunge", sets: 3, reps: "12/leg", rest: "45s", tempo: "2-0-2", rpe: "7" },
        { name: "Plank", sets: 3, reps: "45s", rest: "30s", tempo: "-", rpe: "6" },
        { name: "Mountain Climbers", sets: 3, reps: "30s", rest: "30s", tempo: "-", rpe: "7" },
      ],
    },
    {
      id: "day-3",
      title: "Day 3 — Full Body Strength",
      exercises: [
        { name: "Trap Bar Deadlift", sets: 3, reps: "10", rest: "75s", tempo: "2-1-1", rpe: "7" },
        { name: "Dumbbell Shoulder Press", sets: 3, reps: "12", rest: "45s", tempo: "2-0-2", rpe: "7" },
        { name: "Step-Up", sets: 3, reps: "12/leg", rest: "45s", tempo: "2-0-2", rpe: "7" },
        { name: "Cable Woodchopper", sets: 3, reps: "15/side", rest: "30s", tempo: "1-0-1", rpe: "6" },
      ],
    },
  ],
  "general-fitness": [
    {
      id: "day-1",
      title: "Day 1 — Full Body",
      exercises: [
        { name: "Bodyweight Squat", sets: 3, reps: "15", rest: "45s", tempo: "2-0-2", rpe: "6" },
        { name: "Incline Push-Up", sets: 3, reps: "12", rest: "45s", tempo: "2-0-2", rpe: "6" },
        { name: "Assisted Pull-Up", sets: 3, reps: "8", rest: "60s", tempo: "2-1-1", rpe: "7" },
        { name: "Dead Bug", sets: 3, reps: "10/side", rest: "30s", tempo: "-", rpe: "5" },
      ],
    },
    {
      id: "day-2",
      title: "Day 2 — Mobility & Core",
      exercises: [
        { name: "Hip Flexor Stretch", sets: 2, reps: "45s/side", rest: "20s", tempo: "-", rpe: "4" },
        { name: "Bird Dog", sets: 3, reps: "10/side", rest: "30s", tempo: "-", rpe: "5" },
        { name: "Glute Bridge", sets: 3, reps: "15", rest: "30s", tempo: "2-1-2", rpe: "6" },
        { name: "Standing Cat-Cow", sets: 2, reps: "10", rest: "20s", tempo: "-", rpe: "4" },
      ],
    },
    {
      id: "day-3",
      title: "Day 3 — Full Body",
      exercises: [
        { name: "Dumbbell Deadlift", sets: 3, reps: "12", rest: "60s", tempo: "2-1-1", rpe: "6" },
        { name: "Seated Row", sets: 3, reps: "12", rest: "45s", tempo: "2-0-2", rpe: "6" },
        { name: "Wall Sit", sets: 3, reps: "30s", rest: "30s", tempo: "-", rpe: "6" },
        { name: "Farmer's Carry", sets: 3, reps: "30m", rest: "45s", tempo: "-", rpe: "6" },
      ],
    },
  ],
};

const KNEE_SENSITIVE = new Set([
  "Back Squat",
  "Leg Press",
  "Walking Lunge",
  "Step-Up",
  "Bodyweight Squat",
  "Goblet Squat",
]);

const BACK_SENSITIVE = new Set([
  "Romanian Deadlift",
  "Trap Bar Deadlift",
  "Dumbbell Deadlift",
  "Barbell Row",
]);

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

function clampRpe(rpe: string, delta: number): string {
  const value = parseInt(rpe, 10);
  if (Number.isNaN(value)) return rpe;
  return String(Math.max(4, Math.min(9, value + delta)));
}

export function generatePlan(
  goal: Goal,
  medicalConditions: string[],
  experienceLevel: ExperienceLevel = "intermediate",
): PlanDay[] {
  const template = TEMPLATES[goal] ?? TEMPLATES["general-fitness"];
  const hasKneePain = medicalConditions.includes("knee-pain");
  const hasBackPain = medicalConditions.includes("back-pain");
  const rpeDelta = experienceLevel === "beginner" ? -1 : experienceLevel === "advanced" ? 1 : 0;
  const setDelta = experienceLevel === "beginner" ? -1 : 0;

  return template.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => {
      let result = {
        ...exercise,
        sets: Math.max(2, exercise.sets + setDelta),
        rpe: clampRpe(exercise.rpe, rpeDelta),
      };

      if (hasKneePain && KNEE_SENSITIVE.has(exercise.name)) {
        result = { ...result, name: `${exercise.name} (light load — knee caution)`, rpe: "5" };
      }
      if (hasBackPain && BACK_SENSITIVE.has(exercise.name)) {
        result = { ...result, name: `${exercise.name} (light load — back caution)`, rpe: "5" };
      }
      return result;
    }),
  }));
}
