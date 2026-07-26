"use client";

import { useState } from "react";
import { Dumbbell, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExercisePicker } from "@/components/exercise/ExercisePicker";
import { ExerciseEditorCard } from "@/components/plan/ExerciseEditorCard";
import {
  customExercise,
  exerciseFromCatalog,
  emptyDay,
  type PlanDay,
  type PlanExercise,
} from "@/lib/planTemplates";

interface PlanEditorProps {
  days: PlanDay[];
  onChange: (days: PlanDay[]) => void;
  /** Show tempo/RPE inputs — coaches want them, clients mostly don't. */
  showCoachFields?: boolean;
  maxDays?: number;
}

/** Day ids end up on workout logs, so a new day must never reuse an old id. */
function nextDayId(days: PlanDay[]) {
  const used = new Set(days.map((d) => d.id));
  let n = days.length + 1;
  while (used.has(`day-${n}`)) n += 1;
  return `day-${n}`;
}

export function PlanEditor({
  days,
  onChange,
  showCoachFields = false,
  maxDays = 7,
}: PlanEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeDay = days.find((d) => d.id === activeId) ?? days[0];

  function updateDay(dayId: string, patch: Partial<PlanDay>) {
    onChange(days.map((day) => (day.id === dayId ? { ...day, ...patch } : day)));
  }

  function updateExercises(
    dayId: string,
    transform: (exercises: PlanExercise[]) => PlanExercise[],
  ) {
    onChange(
      days.map((day) =>
        day.id === dayId ? { ...day, exercises: transform(day.exercises) } : day,
      ),
    );
  }

  function addDay() {
    if (days.length >= maxDays) return;
    const day = { ...emptyDay(days.length), id: nextDayId(days) };
    onChange([...days, day]);
    setActiveId(day.id);
  }

  function removeDay(dayId: string) {
    const remaining = days.filter((day) => day.id !== dayId);
    onChange(remaining);
    if (activeId === dayId) setActiveId(remaining[0]?.id ?? null);
  }

  function moveExercise(dayId: string, index: number, direction: -1 | 1) {
    updateExercises(dayId, (exercises) => {
      const target = index + direction;
      if (target < 0 || target >= exercises.length) return exercises;
      const next = [...exercises];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {days.map((day) => {
          const active = day.id === activeDay?.id;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => setActiveId(day.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-nova-accent text-white"
                  : "bg-nova-surface text-nova-muted ring-1 ring-nova-border hover:text-nova-text",
              )}
            >
              {day.title.split("—")[0].trim() || "Untitled"}
              <span className={cn("ml-1.5 text-xs", active ? "text-white/70" : "text-nova-muted")}>
                {day.exercises.length}
              </span>
            </button>
          );
        })}

        {days.length < maxDays && (
          <button
            type="button"
            onClick={addDay}
            className="flex items-center gap-1 rounded-full border border-dashed border-nova-accent/50 px-3 py-1.5 text-sm font-medium text-nova-accent transition-colors hover:bg-nova-accent/[0.06]"
          >
            <Plus className="size-3.5" />
            Add day
          </button>
        )}
      </div>

      {!activeDay ? (
        <div className="mt-4 rounded-2xl border border-dashed border-nova-border bg-nova-surface p-8 text-center">
          <Dumbbell className="mx-auto size-6 text-nova-muted" />
          <p className="mt-2 text-sm font-medium text-nova-text">No training days yet</p>
          <p className="mt-1 text-xs text-nova-muted">
            Add a day to start building this program.
          </p>
          <Button size="sm" className="mt-4" onClick={addDay}>
            <Plus className="size-3.5" />
            Add day
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <Input
              value={activeDay.title}
              onChange={(e) => updateDay(activeDay.id, { title: e.target.value })}
              placeholder="Day name — e.g. Day 1 — Upper Body Push"
              className="h-10 text-sm font-medium"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${activeDay.title}`}
              onClick={() => removeDay(activeDay.id)}
              className="shrink-0 text-nova-muted hover:text-nova-danger"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="mt-3 space-y-2.5">
            {activeDay.exercises.length === 0 && (
              <p className="rounded-2xl border border-dashed border-nova-border bg-nova-surface px-4 py-6 text-center text-sm text-nova-muted">
                Nothing here yet — search below to add the first exercise.
              </p>
            )}

            {activeDay.exercises.map((exercise, i) => (
              <ExerciseEditorCard
                key={`${activeDay.id}-${i}-${exercise.name}`}
                exercise={exercise}
                showCoachFields={showCoachFields}
                canMoveUp={i > 0}
                canMoveDown={i < activeDay.exercises.length - 1}
                onMove={(direction) => moveExercise(activeDay.id, i, direction)}
                onChange={(updated) =>
                  updateExercises(activeDay.id, (exercises) =>
                    exercises.map((ex, index) => (index === i ? updated : ex)),
                  )
                }
                onRemove={() =>
                  updateExercises(activeDay.id, (exercises) =>
                    exercises.filter((_, index) => index !== i),
                  )
                }
              />
            ))}
          </div>

          <div className="mt-3">
            <ExercisePicker
              existingNames={activeDay.exercises.map((e) => e.name)}
              onPick={({ name, catalog }) =>
                updateExercises(activeDay.id, (exercises) => [
                  ...exercises,
                  catalog ? exerciseFromCatalog(catalog) : customExercise(name),
                ])
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
