"use client";

import { useState } from "react";
import { Check, ChevronDown, History, Plus, Repeat2, Trash2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseArt } from "@/components/exercise/ExerciseArt";
import {
  EQUIPMENT_LABEL,
  MUSCLE_GROUP_LABEL,
  resolveExercise,
} from "@/lib/exerciseLibrary";
import { formatRecord, nextTarget, type LoggedSet, type PersonalRecord } from "@/lib/prs";
import { relativeDay } from "@/lib/rotation";
import type { PlanExercise } from "@/lib/planTemplates";

export interface ExerciseLogDraft {
  performedName: string;
  performedExerciseId?: string;
  isAlternate: boolean;
  sets: LoggedSet[];
}

export interface LoggedEntry {
  performed_name: string;
  sets: LoggedSet[] | null;
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
  /** Sets from the previous session, used to prefill today's. */
  previousSets?: LoggedSet[];
  /** Current record for whichever variant is selected. */
  recordFor?: (name: string, exerciseId?: string) => PersonalRecord | undefined;
  onLog?: (draft: ExerciseLogDraft) => Promise<void> | void;
}

function emptySet(): LoggedSet {
  return { weight_kg: null, reps: null };
}

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ExerciseCard({
  exercise,
  logged = null,
  lastPerformedName,
  previousSets,
  recordFor,
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
  const [saving, setSaving] = useState(false);

  const active = options[selected];
  const { group, catalog } = resolveExercise(active.name, active.exerciseId);
  const record = recordFor?.(active.name, active.exerciseId);

  // Start from what's already logged today, else last session's numbers, else
  // the record's weight — anything to avoid retyping the same thing daily.
  const [sets, setSets] = useState<LoggedSet[]>(() => {
    if (logged?.sets?.length) return logged.sets;
    if (previousSets?.length) return previousSets.map((s) => ({ ...s }));

    const targetReps = parseInt(exercise.reps, 10);
    return Array.from({ length: Math.max(1, exercise.sets) }, () => ({
      weight_kg: record?.weight_kg ?? null,
      reps: Number.isNaN(targetReps) ? null : targetReps,
    }));
  });

  function updateSet(index: number, patch: Partial<LoggedSet>) {
    setSets((prev) => prev.map((set, i) => (i === index ? { ...set, ...patch } : set)));
  }

  /** New sets copy the one above, which is how most sets actually go. */
  function addSet() {
    setSets((prev) => [...prev, prev.length > 0 ? { ...prev[prev.length - 1] } : emptySet()]);
  }

  function removeSet(index: number) {
    setSets((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSave() {
    if (!onLog) return;
    setSaving(true);
    await onLog({
      performedName: active.name,
      performedExerciseId: active.exerciseId,
      isAlternate: active.isAlternate,
      sets: sets.filter((set) => set.weight_kg !== null || set.reps !== null),
    });
    setSaving(false);
    setOpen(false);
  }

  const target = nextTarget(record, exercise.reps);
  const filledSets = sets.filter((set) => set.weight_kg !== null || set.reps !== null).length;

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

          {record ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-nova-warning">
                <Trophy className="size-3" />
                PR {formatRecord(record)}
              </span>
              <span className="text-nova-muted">
                · {record.source === "starting" ? "starting lift" : relativeDay(record.achieved_at)}
              </span>
              {target && <span className="text-nova-accent">· {target}</span>}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-nova-muted">
              No record yet — log a set to start tracking {active.name}.
            </p>
          )}

          {!logged && lastPerformedName && lastPerformedName !== exercise.name && (
            <p className="mt-1 flex items-center gap-1 text-xs text-nova-muted">
              <History className="size-3" />
              Last time you did: {lastPerformedName}
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
            {logged
              ? `Logged ${logged.sets?.length ?? logged.sets_completed ?? 0} sets — edit`
              : "Log your sets"}
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

              <div>
                <div className="flex items-center gap-2 px-1 pb-1">
                  <span className="w-7 text-[11px] font-medium text-nova-muted">Set</span>
                  <span className="flex-1 text-[11px] font-medium text-nova-muted">
                    Weight (kg)
                  </span>
                  <span className="flex-1 text-[11px] font-medium text-nova-muted">Reps</span>
                  <span className="w-8" />
                </div>

                <ul className="space-y-1.5">
                  {sets.map((set, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-nova-bg text-xs font-semibold text-nova-muted">
                        {i + 1}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.5"
                        value={set.weight_kg ?? ""}
                        onChange={(e) =>
                          updateSet(i, { weight_kg: numberOrNull(e.target.value) })
                        }
                        placeholder="—"
                        aria-label={`Set ${i + 1} weight in kilograms`}
                        className="h-9 flex-1 text-center text-sm"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={set.reps ?? ""}
                        onChange={(e) => updateSet(i, { reps: numberOrNull(e.target.value) })}
                        placeholder="—"
                        aria-label={`Set ${i + 1} reps`}
                        className="h-9 flex-1 text-center text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(i)}
                        disabled={sets.length <= 1}
                        aria-label={`Remove set ${i + 1}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-nova-muted transition-colors hover:bg-nova-bg hover:text-nova-danger disabled:opacity-30"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={addSet}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-nova-accent/50 py-2 text-sm font-medium text-nova-accent transition-colors hover:bg-nova-accent/[0.05]"
                >
                  <Plus className="size-4" />
                  Add set
                </button>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={handleSave}
                disabled={saving || filledSets === 0}
              >
                {saving
                  ? "Saving…"
                  : `Save ${filledSets} set${filledSets === 1 ? "" : "s"} — ${active.name}`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
