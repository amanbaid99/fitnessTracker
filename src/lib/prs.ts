/**
 * Personal records.
 *
 * A "best" set is compared by estimated one-rep max rather than raw weight,
 * so 60kg × 10 correctly beats 65kg × 3 — otherwise a heavy low-rep day would
 * permanently freeze the record for everyone training in higher rep ranges.
 */

export interface LoggedSet {
  weight_kg: number | null;
  reps: number | null;
}

export interface PersonalRecord {
  exercise_key: string;
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  estimated_1rm: number | null;
  source: "starting" | "logged";
  achieved_at: string;
  updated_at?: string;
}

/** Catalog id when we have one, otherwise a normalised name. */
export function exerciseKey(name: string, exerciseId?: string): string {
  if (exerciseId) return exerciseId;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Epley: weight × (1 + reps / 30). Good enough up to ~10 reps. */
export function estimate1RM(weight: number | null, reps: number | null): number | null {
  if (!weight || !reps || weight <= 0 || reps <= 0) return null;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function bestSet(sets: LoggedSet[]): LoggedSet | null {
  let best: LoggedSet | null = null;
  let bestScore = 0;

  for (const set of sets) {
    const score = estimate1RM(set.weight_kg, set.reps);
    if (score === null) continue;
    if (score > bestScore) {
      best = set;
      bestScore = score;
    }
  }

  return best;
}

/** Does this set beat the record on the books? */
export function beatsRecord(set: LoggedSet, record: PersonalRecord | undefined): boolean {
  const score = estimate1RM(set.weight_kg, set.reps);
  if (score === null) return false;
  if (!record) return true;

  const current = record.estimated_1rm ?? estimate1RM(record.weight_kg, record.reps);
  if (current === null) return true;
  return score > current;
}

export function formatRecord(record: {
  weight_kg: number | null;
  reps: number | null;
}): string {
  if (!record.weight_kg) return record.reps ? `${record.reps} reps` : "—";
  if (!record.reps) return `${record.weight_kg} kg`;
  return `${record.weight_kg} kg × ${record.reps}`;
}

/**
 * What to aim for next: repeat the record's weight for one more rep, or add
 * load once the rep target is met. Deliberately conservative — it's a nudge
 * on the exercise card, not programming advice.
 */
export function nextTarget(
  record: PersonalRecord | undefined,
  targetReps: string,
): string | null {
  if (!record?.weight_kg || !record.reps) return null;

  const target = parseInt(targetReps, 10);
  if (!Number.isNaN(target) && record.reps >= target) {
    const step = record.weight_kg >= 60 ? 5 : 2.5;
    return `Try ${record.weight_kg + step} kg × ${target}`;
  }

  return `Try ${record.weight_kg} kg × ${record.reps + 1}`;
}
