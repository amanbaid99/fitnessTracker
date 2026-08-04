"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Repeat2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExerciseArt } from "@/components/exercise/ExerciseArt";
import { ExercisePicker } from "@/components/exercise/ExercisePicker";
import {
  MAX_ALTERNATES,
  type PlanAlternate,
  type PlanExercise,
} from "@/lib/planTemplates";

interface ExerciseEditorCardProps {
  exercise: PlanExercise;
  onChange: (updated: PlanExercise) => void;
  onRemove: () => void;
  onMove?: (direction: -1 | 1) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Tempo and RPE are coach-facing; the client builder keeps it simpler. */
  showCoachFields?: boolean;
  defaultOpen?: boolean;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-ft-muted">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-center text-sm"
      />
    </label>
  );
}

export function ExerciseEditorCard({
  exercise,
  onChange,
  onRemove,
  onMove,
  canMoveUp = false,
  canMoveDown = false,
  showCoachFields = false,
  defaultOpen = false,
}: ExerciseEditorCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const alternates = exercise.alternates ?? [];

  function update(patch: Partial<PlanExercise>) {
    onChange({ ...exercise, ...patch });
  }

  function addAlternate(alternate: PlanAlternate) {
    if (alternates.length >= MAX_ALTERNATES) return;
    update({ alternates: [...alternates, alternate] });
  }

  function removeAlternate(index: number) {
    update({ alternates: alternates.filter((_, i) => i !== index) });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ft-border/70 bg-ft-surface">
      <div className="flex items-center gap-3 p-3">
        <ExerciseArt name={exercise.name} exerciseId={exercise.exerciseId} size="md" />

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-semibold text-ft-text">{exercise.name}</p>
          <p className="mt-0.5 text-xs text-ft-muted">
            {exercise.sets} × {exercise.reps} · Rest {exercise.rest}
          </p>
          {alternates.length > 0 && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-ft-accent/10 px-2 py-0.5 text-[11px] font-medium text-ft-accent">
              <Repeat2 className="size-3" />
              {alternates.length} alternate{alternates.length === 1 ? "" : "s"}
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center">
          {onMove && (
            <div className="flex flex-col">
              <button
                type="button"
                aria-label="Move up"
                disabled={!canMoveUp}
                onClick={() => onMove(-1)}
                className="text-ft-muted transition-colors hover:text-ft-text disabled:opacity-30"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={!canMoveDown}
                onClick={() => onMove(1)}
                className="text-ft-muted transition-colors hover:text-ft-text disabled:opacity-30"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse" : "Edit exercise"}
            className="ml-1 rounded-md p-1.5 text-ft-muted transition-colors hover:bg-ft-bg hover:text-ft-text"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-ft-border/70 px-3 py-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-ft-muted">
              Exercise name
            </span>
            <Input
              value={exercise.name}
              onChange={(e) => update({ name: e.target.value })}
              className="h-9 text-sm"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <Field
              label="Sets"
              type="number"
              value={String(exercise.sets)}
              onChange={(v) => update({ sets: Math.max(1, Number(v) || 1) })}
            />
            <Field label="Reps" value={exercise.reps} onChange={(v) => update({ reps: v })} />
            <Field label="Rest" value={exercise.rest} onChange={(v) => update({ rest: v })} />
          </div>

          {showCoachFields && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tempo" value={exercise.tempo} onChange={(v) => update({ tempo: v })} />
              <Field label="RPE" value={exercise.rpe} onChange={(v) => update({ rpe: v })} />
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-ft-muted">
              Alternate exercises ({alternates.length}/{MAX_ALTERNATES})
            </p>
            <p className="mt-0.5 text-[11px] text-ft-muted">
              Swaps you can log instead of {exercise.name} on any given week.
            </p>

            {alternates.length > 0 && (
              <ul className="mt-2 space-y-2">
                {alternates.map((alternate, i) => (
                  <li
                    key={`${alternate.name}-${i}`}
                    className="flex items-center gap-2 rounded-xl border border-ft-border/70 bg-ft-bg px-2 py-1.5"
                  >
                    <ExerciseArt
                      name={alternate.name}
                      exerciseId={alternate.exerciseId}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-ft-text">
                      {alternate.name}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${alternate.name}`}
                      onClick={() => removeAlternate(i)}
                      className="rounded-md p-1.5 text-ft-muted transition-colors hover:bg-ft-surface hover:text-ft-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {alternates.length < MAX_ALTERNATES && (
              <div className="mt-2">
                <ExercisePicker
                  placeholder="Add an alternate — e.g. dumbbell press"
                  existingNames={[exercise.name, ...alternates.map((a) => a.name)]}
                  onPick={({ name, catalog }) =>
                    addAlternate({
                      name,
                      exerciseId: catalog?.id,
                      sets: catalog?.defaultSets,
                      reps: catalog?.defaultReps,
                    })
                  }
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-ft-danger">
              <Trash2 className="size-3.5" />
              Remove exercise
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
