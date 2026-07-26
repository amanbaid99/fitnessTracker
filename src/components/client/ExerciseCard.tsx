"use client";

import { useState } from "react";
import { Check, ChevronDown, History, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseArt } from "@/components/exercise/ExerciseArt";
import {
  EQUIPMENT_LABEL,
  MUSCLE_GROUP_LABEL,
  resolveExercise,
} from "@/lib/exerciseLibrary";
import type { PlanExercise } from "@/lib/planTemplates";

export interface ExerciseLogDraft {
  performedName: string;
  isAlternate: boolean;
  setsCompleted: number;
  reps: string;
  weightKg: number | null;
}

export interface LoggedEntry {
  performed_name: string;
  sets_completed: number | null;
  reps: string | null;
  weight_kg: number | null;
}

interface ExerciseCardProps {
  exercise: PlanExercise;
  /** Today's log for this slot, if it's already been recorded. */
  logged?: LoggedEntry | null;
  /** What they picked for this slot the last time they trained it. */
  lastPerformedName?: string;
  onLog?: (draft: ExerciseLogDraft) => Promise<void> | void;
}

export function ExerciseCard({
  exercise,
  logged = null,
  lastPerformedName,
  onLog,
}: ExerciseCardProps) {
  const alternates = exercise.alternates ?? [];
  const options = [
    { name: exercise.name, exerciseId: exercise.exerciseId, isAlternate: false },
    ...alternates.map((a) => ({
      name: a.name,
      exerciseId: a.exerciseId,
      isAlternate: true,
    })),
  ];

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [sets, setSets] = useState(String(exercise.sets));
  const [reps, setReps] = useState(exercise.reps);
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const active = options[selected];
  const { group, catalog } = resolveExercise(active.name, active.exerciseId);

  async function handleLog() {
    if (!onLog) return;
    setSaving(true);
    await onLog({
      performedName: active.name,
      isAlternate: active.isAlternate,
      setsCompleted: Number(sets) || exercise.sets,
      reps,
      weightKg: weight ? Number(weight) : null,
    });
    setSaving(false);
    setOpen(false);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)] transition-colors",
        logged ? "border-nova-success/40" : "border-nova-border/70",
      )}
    >
      <div className="flex gap-3 p-3">
        <ExerciseArt name={active.name} exerciseId={active.exerciseId} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 truncate font-semibold text-nova-text">
              {exercise.name}
            </p>
            {logged && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-nova-success/10 px-2 py-0.5 text-[11px] font-medium text-nova-success">
                <Check className="size-3" />
                Logged
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-nova-muted">
            {exercise.sets} × {exercise.reps} · Rest {exercise.rest}
            {exercise.rpe && exercise.rpe !== "-" ? ` · RPE ${exercise.rpe}` : ""}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-nova-bg px-2 py-0.5 text-[11px] font-medium text-nova-muted">
              {MUSCLE_GROUP_LABEL[group]}
            </span>
            {catalog && (
              <span className="rounded-full bg-nova-bg px-2 py-0.5 text-[11px] font-medium text-nova-muted">
                {EQUIPMENT_LABEL[catalog.equipment]}
              </span>
            )}
            {alternates.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-nova-accent/10 px-2 py-0.5 text-[11px] font-medium text-nova-accent">
                <Repeat2 className="size-3" />
                {alternates.length} swap{alternates.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {logged && (
            <p className="mt-1.5 text-xs text-nova-success">
              {logged.performed_name} — {logged.sets_completed ?? exercise.sets} ×{" "}
              {logged.reps ?? exercise.reps}
              {logged.weight_kg ? ` @ ${logged.weight_kg}kg` : ""}
            </p>
          )}

          {!logged && lastPerformedName && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-nova-muted">
              <History className="size-3" />
              Last time: {lastPerformedName}
            </p>
          )}
        </div>
      </div>

      {onLog && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center justify-between border-t border-nova-border/70 px-4 py-2.5 text-sm font-medium text-nova-accent transition-colors hover:bg-nova-accent/[0.04]"
          >
            {logged ? "Update log" : "Log this exercise"}
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="space-y-3 border-t border-nova-border/70 px-4 py-3">
              {options.length > 1 && (
                <div>
                  <p className="text-[11px] font-medium text-nova-muted">
                    Which one did you do?
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {options.map((option, i) => (
                      <button
                        key={`${option.name}-${i}`}
                        type="button"
                        onClick={() => setSelected(i)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          i === selected
                            ? "bg-nova-accent text-white"
                            : "bg-nova-bg text-nova-muted ring-1 ring-nova-border hover:text-nova-text",
                        )}
                      >
                        {option.name}
                        {i === 0 && (
                          <span
                            className={cn(
                              "text-[10px]",
                              i === selected ? "text-white/70" : "text-nova-muted",
                            )}
                          >
                            main
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-nova-muted">
                    Sets done
                  </span>
                  <Input
                    type="number"
                    min={1}
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    className="h-9 text-center text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-nova-muted">Reps</span>
                  <Input
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="h-9 text-center text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-nova-muted">
                    Weight (kg)
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="—"
                    className="h-9 text-center text-sm"
                  />
                </label>
              </div>

              <Button size="sm" className="w-full" onClick={handleLog} disabled={saving}>
                {saving ? "Saving…" : `Save ${active.name}`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
