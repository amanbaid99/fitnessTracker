"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { PlanExercise } from "@/lib/planTemplates";

interface ExerciseReviewRowProps {
  exercise: PlanExercise;
  onChange: (updated: PlanExercise) => void;
  defaultOpen?: boolean;
}

function field(label: string, value: string, onChange: (v: string) => void) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-nova-muted">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-center text-sm"
      />
    </div>
  );
}

export function ExerciseReviewRow({
  exercise,
  onChange,
  defaultOpen = false,
}: ExerciseReviewRowProps) {
  const [open, setOpen] = useState(defaultOpen);

  function update(patch: Partial<PlanExercise>) {
    onChange({ ...exercise, ...patch });
  }

  return (
    <div className="rounded-xl border border-nova-border bg-nova-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-nova-text">{exercise.name}</p>
          <p className="mt-0.5 text-xs text-nova-muted">
            {exercise.sets} × {exercise.reps}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-nova-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-nova-border px-4 py-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-nova-muted">
              Exercise name
            </label>
            <Input
              value={exercise.name}
              onChange={(e) => update({ name: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {field("Sets", String(exercise.sets), (v) => update({ sets: Number(v) || 0 }))}
            {field("Reps", exercise.reps, (v) => update({ reps: v }))}
            {field("Rest", exercise.rest, (v) => update({ rest: v }))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {field("Tempo", exercise.tempo, (v) => update({ tempo: v }))}
            {field("RPE", exercise.rpe, (v) => update({ rpe: v }))}
          </div>
        </div>
      )}
    </div>
  );
}
