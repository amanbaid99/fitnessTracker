import type { PlanDay, PlanSource } from "@/lib/planTemplates";

export interface WorkoutHistoryEntry {
  dayId: string;
  completedAt: string;
  source: PlanSource;
}

/**
 * Where the client is in their rotation.
 *
 * Deliberately based on the last workout they *finished*, not on today's
 * date: a 4-day upper/lower split isn't tied to weekdays, so someone who
 * skips a day should come back to the next day in sequence rather than being
 * pushed forward to whatever day the calendar says. Picking a different day
 * re-anchors the rotation, because the next suggestion is always "the one
 * after whatever you did last".
 */
export function suggestNextDayId(
  days: PlanDay[],
  history: WorkoutHistoryEntry[],
): string | null {
  if (days.length === 0) return null;

  const sorted = [...history].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  for (const entry of sorted) {
    const index = days.findIndex((day) => day.id === entry.dayId);
    // Days can be removed or renamed by a coach; skip history that no longer
    // points at a day in this plan and keep looking further back.
    if (index !== -1) return days[(index + 1) % days.length].id;
  }

  return days[0].id;
}

/** Most recent completion per day id, for the "last done …" hints. */
export function lastCompletedByDay(history: WorkoutHistoryEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of history) {
    const current = map.get(entry.dayId);
    if (!current || new Date(entry.completedAt) > new Date(current)) {
      map.set(entry.dayId, entry.completedAt);
    }
  }
  return map;
}

const DAY_MS = 86_400_000;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function relativeDay(iso: string | undefined): string {
  if (!iso) return "Not done yet";

  const days = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(new Date(iso)).getTime()) / DAY_MS,
  );

  if (days <= 0) return "Done today";
  if (days === 1) return "Done yesterday";
  if (days < 7) return `Done ${days} days ago`;
  if (days < 14) return "Done last week";
  return `Done ${Math.floor(days / 7)} weeks ago`;
}
