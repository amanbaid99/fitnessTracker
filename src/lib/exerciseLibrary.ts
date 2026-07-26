/**
 * A searchable catalog of exercises.
 *
 * The catalog is intentionally a plain module rather than a database table:
 * the app is a static export talking to Supabase from the browser, and this
 * list never changes per-user. Anything a user or coach types that isn't in
 * here becomes a "custom" exercise stored inline on their plan — see
 * `resolveExercise()` for how those still get a sensible icon.
 */

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "cardio"
  | "mobility"
  | "full-body";

/** Drives which animated illustration an exercise gets. */
export type MovementPattern =
  | "horizontal-press"
  | "vertical-press"
  | "fly"
  | "triceps"
  | "curl"
  | "row"
  | "pulldown"
  | "squat"
  | "hinge"
  | "lunge"
  | "calf"
  | "lateral-raise"
  | "core"
  | "cardio"
  | "carry"
  | "mobility";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "other";

export interface CatalogExercise {
  id: string;
  name: string;
  group: MuscleGroup;
  pattern: MovementPattern;
  equipment: Equipment;
  /** Extra search terms — gym slang, abbreviations, alternate spellings. */
  aliases?: string[];
  defaultSets: number;
  defaultReps: string;
  defaultRest: string;
}

function ex(
  id: string,
  name: string,
  group: MuscleGroup,
  pattern: MovementPattern,
  equipment: Equipment,
  defaults: [number, string, string],
  aliases?: string[],
): CatalogExercise {
  return {
    id,
    name,
    group,
    pattern,
    equipment,
    defaultSets: defaults[0],
    defaultReps: defaults[1],
    defaultRest: defaults[2],
    aliases,
  };
}

export const EXERCISE_LIBRARY: CatalogExercise[] = [
  // Chest
  ex("barbell-bench-press", "Barbell Bench Press", "chest", "horizontal-press", "barbell", [4, "8", "90s"], ["bench", "bp", "flat bench"]),
  ex("incline-barbell-press", "Incline Barbell Press", "chest", "horizontal-press", "barbell", [4, "8", "90s"], ["incline bench"]),
  ex("incline-dumbbell-press", "Incline Dumbbell Press", "chest", "horizontal-press", "dumbbell", [3, "10", "60s"], ["incline db press"]),
  ex("dumbbell-bench-press", "Dumbbell Bench Press", "chest", "horizontal-press", "dumbbell", [3, "10", "60s"], ["db press", "db bench"]),
  ex("machine-chest-press", "Machine Chest Press", "chest", "horizontal-press", "machine", [3, "12", "60s"]),
  ex("cable-fly", "Cable Fly", "chest", "fly", "cable", [3, "12", "45s"], ["cable crossover", "flye"]),
  ex("dumbbell-fly", "Dumbbell Fly", "chest", "fly", "dumbbell", [3, "12", "45s"], ["db fly", "flye"]),
  ex("push-up", "Push-Up", "chest", "horizontal-press", "bodyweight", [3, "12", "45s"], ["pushup", "press up"]),
  ex("incline-push-up", "Incline Push-Up", "chest", "horizontal-press", "bodyweight", [3, "12", "45s"], ["incline pushup"]),
  ex("dip", "Chest Dip", "chest", "horizontal-press", "bodyweight", [3, "10", "60s"], ["dips", "parallel bar dip"]),

  // Back
  ex("pull-up", "Pull-Up", "back", "pulldown", "bodyweight", [4, "8", "90s"], ["pullup", "chin up", "chin-up"]),
  ex("assisted-pull-up", "Assisted Pull-Up", "back", "pulldown", "machine", [3, "8", "60s"], ["band pull up"]),
  ex("lat-pulldown", "Lat Pulldown", "back", "pulldown", "cable", [3, "12", "60s"], ["pulldown", "lat pull down"]),
  ex("barbell-row", "Barbell Row", "back", "row", "barbell", [3, "10", "75s"], ["bent over row", "bb row"]),
  ex("dumbbell-row", "Dumbbell Row", "back", "row", "dumbbell", [3, "12", "45s"], ["db row", "single arm row"]),
  ex("seated-row", "Seated Cable Row", "back", "row", "cable", [3, "12", "45s"], ["seated row", "cable row"]),
  ex("chest-supported-row", "Chest Supported Row", "back", "row", "machine", [3, "12", "60s"], ["t bar row", "machine row"]),
  ex("face-pull", "Face Pull", "back", "row", "cable", [3, "15", "45s"], ["rear delt pull"]),
  ex("straight-arm-pulldown", "Straight-Arm Pulldown", "back", "pulldown", "cable", [3, "12", "45s"], ["lat pushdown"]),
  ex("inverted-row", "Inverted Row", "back", "row", "bodyweight", [3, "10", "60s"], ["body row", "australian pull up"]),

  // Legs
  ex("back-squat", "Back Squat", "legs", "squat", "barbell", [4, "6", "120s"], ["squat", "barbell squat"]),
  ex("front-squat", "Front Squat", "legs", "squat", "barbell", [3, "8", "120s"]),
  ex("goblet-squat", "Goblet Squat", "legs", "squat", "dumbbell", [3, "15", "45s"], ["kb squat"]),
  ex("bodyweight-squat", "Bodyweight Squat", "legs", "squat", "bodyweight", [3, "15", "45s"], ["air squat"]),
  ex("hack-squat", "Hack Squat", "legs", "squat", "machine", [3, "10", "90s"]),
  ex("leg-press", "Leg Press", "legs", "squat", "machine", [3, "12", "60s"]),
  ex("romanian-deadlift", "Romanian Deadlift", "legs", "hinge", "barbell", [3, "10", "90s"], ["rdl", "stiff leg deadlift"]),
  ex("conventional-deadlift", "Conventional Deadlift", "legs", "hinge", "barbell", [3, "5", "150s"], ["deadlift", "dl"]),
  ex("trap-bar-deadlift", "Trap Bar Deadlift", "legs", "hinge", "barbell", [3, "10", "75s"], ["hex bar deadlift"]),
  ex("dumbbell-deadlift", "Dumbbell Deadlift", "legs", "hinge", "dumbbell", [3, "12", "60s"], ["db deadlift"]),
  ex("hip-thrust", "Hip Thrust", "legs", "hinge", "barbell", [3, "12", "75s"], ["glute bridge barbell"]),
  ex("glute-bridge", "Glute Bridge", "legs", "hinge", "bodyweight", [3, "15", "30s"]),
  ex("kettlebell-swing", "Kettlebell Swing", "legs", "hinge", "kettlebell", [3, "20", "30s"], ["kb swing"]),
  ex("walking-lunge", "Walking Lunge", "legs", "lunge", "dumbbell", [3, "12/leg", "45s"], ["lunge"]),
  ex("reverse-lunge", "Reverse Lunge", "legs", "lunge", "dumbbell", [3, "12/leg", "45s"]),
  ex("bulgarian-split-squat", "Bulgarian Split Squat", "legs", "lunge", "dumbbell", [3, "10/leg", "60s"], ["split squat", "rear foot elevated"]),
  ex("step-up", "Step-Up", "legs", "lunge", "dumbbell", [3, "12/leg", "45s"]),
  ex("leg-extension", "Leg Extension", "legs", "squat", "machine", [3, "15", "45s"], ["quad extension"]),
  ex("leg-curl", "Leg Curl", "legs", "hinge", "machine", [3, "12", "45s"], ["hamstring curl"]),
  ex("standing-calf-raise", "Standing Calf Raise", "legs", "calf", "machine", [4, "15", "45s"], ["calf raise"]),
  ex("seated-calf-raise", "Seated Calf Raise", "legs", "calf", "machine", [4, "15", "45s"]),
  ex("wall-sit", "Wall Sit", "legs", "squat", "bodyweight", [3, "30s", "30s"]),

  // Shoulders
  ex("overhead-press", "Overhead Press", "shoulders", "vertical-press", "barbell", [4, "8", "90s"], ["ohp", "military press", "shoulder press"]),
  ex("dumbbell-shoulder-press", "Dumbbell Shoulder Press", "shoulders", "vertical-press", "dumbbell", [3, "12", "45s"], ["db shoulder press"]),
  ex("arnold-press", "Arnold Press", "shoulders", "vertical-press", "dumbbell", [3, "12", "60s"]),
  ex("lateral-raise", "Lateral Raise", "shoulders", "lateral-raise", "dumbbell", [3, "15", "45s"], ["side raise", "lat raise"]),
  ex("front-raise", "Front Raise", "shoulders", "lateral-raise", "dumbbell", [3, "12", "45s"]),
  ex("rear-delt-fly", "Rear Delt Fly", "shoulders", "lateral-raise", "dumbbell", [3, "15", "45s"], ["reverse fly"]),
  ex("upright-row", "Upright Row", "shoulders", "row", "barbell", [3, "12", "45s"]),
  ex("shrug", "Barbell Shrug", "shoulders", "carry", "barbell", [3, "15", "45s"], ["trap shrug"]),

  // Arms
  ex("barbell-curl", "Barbell Curl", "arms", "curl", "barbell", [3, "12", "45s"], ["bb curl", "bicep curl"]),
  ex("dumbbell-curl", "Dumbbell Curl", "arms", "curl", "dumbbell", [3, "12", "45s"], ["db curl", "bicep curl"]),
  ex("hammer-curl", "Hammer Curl", "arms", "curl", "dumbbell", [3, "12", "45s"]),
  ex("preacher-curl", "Preacher Curl", "arms", "curl", "machine", [3, "12", "45s"]),
  ex("cable-curl", "Cable Curl", "arms", "curl", "cable", [3, "15", "45s"]),
  ex("triceps-pushdown", "Triceps Pushdown", "arms", "triceps", "cable", [3, "12", "45s"], ["tricep pushdown", "rope pushdown"]),
  ex("overhead-triceps-extension", "Overhead Triceps Extension", "arms", "triceps", "dumbbell", [3, "12", "45s"], ["skull crusher", "tricep extension"]),
  ex("close-grip-bench", "Close-Grip Bench Press", "arms", "horizontal-press", "barbell", [3, "10", "75s"], ["cgbp"]),
  ex("bench-dip", "Bench Dip", "arms", "triceps", "bodyweight", [3, "12", "45s"]),

  // Core
  ex("plank", "Plank", "core", "core", "bodyweight", [3, "45s", "30s"]),
  ex("side-plank", "Side Plank", "core", "core", "bodyweight", [3, "30s/side", "30s"]),
  ex("dead-bug", "Dead Bug", "core", "core", "bodyweight", [3, "10/side", "30s"]),
  ex("bird-dog", "Bird Dog", "core", "core", "bodyweight", [3, "10/side", "30s"]),
  ex("hanging-leg-raise", "Hanging Leg Raise", "core", "core", "bodyweight", [3, "12", "45s"], ["leg raise"]),
  ex("cable-woodchopper", "Cable Woodchopper", "core", "core", "cable", [3, "15/side", "30s"], ["woodchop"]),
  ex("russian-twist", "Russian Twist", "core", "core", "bodyweight", [3, "20", "30s"]),
  ex("ab-wheel-rollout", "Ab Wheel Rollout", "core", "core", "other", [3, "10", "45s"], ["ab roller"]),
  ex("mountain-climbers", "Mountain Climbers", "core", "cardio", "bodyweight", [3, "30s", "30s"]),

  // Cardio & conditioning
  ex("treadmill-walk", "Treadmill Walk", "cardio", "cardio", "machine", [1, "20 min", "-"], ["walking", "incline walk"]),
  ex("treadmill-run", "Treadmill Run", "cardio", "cardio", "machine", [1, "20 min", "-"], ["running", "jog"]),
  ex("rowing-intervals", "Rowing Machine Intervals", "cardio", "cardio", "machine", [6, "250m", "60s"], ["erg", "rower"]),
  ex("assault-bike", "Assault Bike Intervals", "cardio", "cardio", "machine", [6, "30s", "60s"], ["air bike", "echo bike"]),
  ex("stair-climber", "Stair Climber", "cardio", "cardio", "machine", [1, "15 min", "-"], ["stairmaster"]),
  ex("jump-rope", "Jump Rope", "cardio", "cardio", "other", [3, "60s", "45s"], ["skipping"]),
  ex("burpee", "Burpee", "cardio", "cardio", "bodyweight", [3, "12", "45s"]),
  ex("farmers-carry", "Farmer's Carry", "full-body", "carry", "dumbbell", [3, "30m", "45s"], ["farmer walk", "loaded carry"]),
  ex("sled-push", "Sled Push", "full-body", "carry", "other", [4, "20m", "60s"], ["prowler"]),

  // Mobility & warm-up
  ex("hip-flexor-stretch", "Hip Flexor Stretch", "mobility", "mobility", "bodyweight", [2, "45s/side", "20s"]),
  ex("cat-cow", "Cat-Cow Stretch", "mobility", "mobility", "bodyweight", [2, "10", "20s"], ["standing cat cow"]),
  ex("thoracic-rotation", "Thoracic Rotation", "mobility", "mobility", "bodyweight", [2, "10/side", "20s"], ["t spine rotation"]),
  ex("band-pull-apart", "Band Pull-Apart", "mobility", "row", "band", [3, "15", "30s"]),
  ex("shoulder-dislocate", "Shoulder Dislocate", "mobility", "mobility", "band", [2, "12", "20s"], ["pass through"]),
  ex("arm-circles", "Arm Circles", "mobility", "mobility", "bodyweight", [2, "30s", "20s"]),
  ex("hamstring-stretch", "Hamstring Stretch", "mobility", "mobility", "bodyweight", [2, "45s/side", "20s"]),
];

const BY_ID = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));

export function getExerciseById(id: string | undefined): CatalogExercise | undefined {
  return id ? BY_ID.get(id) : undefined;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const BY_NORMALIZED_NAME = new Map(EXERCISE_LIBRARY.map((e) => [normalize(e.name), e]));

/** Exact-ish name lookup, used to re-link plans saved before ids existed. */
export function findExerciseByName(name: string): CatalogExercise | undefined {
  const key = normalize(name);
  const direct = BY_NORMALIZED_NAME.get(key);
  if (direct) return direct;
  return EXERCISE_LIBRARY.find((e) => e.aliases?.some((alias) => normalize(alias) === key));
}

/**
 * Keyword fallback for exercises that aren't in the catalog — custom entries
 * a user typed, or generated names like "Back Squat (light load — knee
 * caution)". Keeps the illustration meaningful instead of dropping to a
 * generic dumbbell for anything off-list.
 */
const PATTERN_KEYWORDS: [RegExp, MovementPattern, MuscleGroup][] = [
  [/pull ?up|chin ?up|pulldown|lat pull/, "pulldown", "back"],
  [/row/, "row", "back"],
  [/deadlift|rdl|hinge|swing|good ?morning|hip thrust|bridge/, "hinge", "legs"],
  [/lunge|split squat|step ?up/, "lunge", "legs"],
  [/calf/, "calf", "legs"],
  [/squat|leg press|leg extension|wall sit/, "squat", "legs"],
  [/lateral raise|side raise|front raise|rear delt|reverse fly/, "lateral-raise", "shoulders"],
  [/overhead press|shoulder press|military|ohp|arnold/, "vertical-press", "shoulders"],
  [/fly|flye|crossover|pec deck/, "fly", "chest"],
  [/tricep|pushdown|skull ?crusher|extension/, "triceps", "arms"],
  [/curl/, "curl", "arms"],
  [/bench|push ?up|press|dip/, "horizontal-press", "chest"],
  [/plank|crunch|sit ?up|ab |abs|core|dead bug|bird dog|twist|woodchop|leg raise/, "core", "core"],
  [/run|jog|sprint|bike|row(ing)? machine|erg|cardio|jump rope|skip|burpee|climber|stair|treadmill|elliptical/, "cardio", "cardio"],
  [/carry|farmer|sled|shrug/, "carry", "full-body"],
  [/stretch|mobility|foam roll|circles|dislocate|cat ?cow|rotation/, "mobility", "mobility"],
];

export interface ResolvedExercise {
  pattern: MovementPattern;
  group: MuscleGroup;
  catalog?: CatalogExercise;
}

/** Everything the UI needs to illustrate an exercise, catalog entry or not. */
export function resolveExercise(name: string, exerciseId?: string): ResolvedExercise {
  const catalog = getExerciseById(exerciseId) ?? findExerciseByName(name);
  if (catalog) {
    return { pattern: catalog.pattern, group: catalog.group, catalog };
  }

  const haystack = normalize(name);
  for (const [pattern, movement, group] of PATTERN_KEYWORDS) {
    if (pattern.test(haystack)) return { pattern: movement, group };
  }
  return { pattern: "horizontal-press", group: "full-body" };
}

export interface SearchResult extends CatalogExercise {
  score: number;
}

/**
 * Ranked search over the catalog. Every query token has to match somewhere,
 * so "incline db" finds "Incline Dumbbell Press" but "incline curl" doesn't
 * quietly return every incline movement.
 */
export function searchExercises(query: string, limit = 12): CatalogExercise[] {
  const q = normalize(query);
  if (!q) return EXERCISE_LIBRARY.slice(0, limit);

  const tokens = q.split(" ");

  const scored: SearchResult[] = [];
  for (const exercise of EXERCISE_LIBRARY) {
    const name = normalize(exercise.name);
    const aliases = (exercise.aliases ?? []).map(normalize);
    const haystack = [name, ...aliases, exercise.group, exercise.equipment].join(" ");

    if (!tokens.every((token) => haystack.includes(token))) continue;

    let score = 0;
    if (name === q) score += 100;
    if (name.startsWith(q)) score += 50;
    if (name.includes(q)) score += 25;
    if (aliases.some((alias) => alias === q)) score += 40;
    if (aliases.some((alias) => alias.includes(q))) score += 15;
    // Shorter names are usually the "main" version of a movement.
    score += Math.max(0, 20 - name.length / 2);

    scored.push({ ...exercise, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  cardio: "Cardio",
  mobility: "Mobility",
  "full-body": "Full body",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machine",
  cable: "Cable",
  bodyweight: "Bodyweight",
  kettlebell: "Kettlebell",
  band: "Band",
  other: "Other",
};
