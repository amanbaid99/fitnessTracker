"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseArt } from "@/components/exercise/ExerciseArt";
import { supabase } from "@/lib/supabase";
import { estimate1RM, exerciseKey, formatRecord, type PersonalRecord } from "@/lib/prs";
import type { PlanDay } from "@/lib/planTemplates";

interface StartingRecordsProps {
  days: PlanDay[];
  userId: string;
}

interface Draft {
  weight: string;
  reps: string;
}

/**
 * Lets an experienced lifter seed their current numbers so the app has
 * something to compare against from day one, instead of treating every first
 * session as a personal best.
 *
 * Records already earned through logging are shown but not editable here —
 * they're real results, and quietly overwriting them from a setup screen
 * would corrupt the progress history.
 */
export function StartingRecords({ days, userId }: StartingRecordsProps) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every distinct exercise in the plan, alternates included — you might swap
  // to one next week and want its number tracked too.
  const exercises = useMemo(() => {
    const seen = new Map<string, { name: string; exerciseId?: string }>();
    for (const day of days) {
      for (const exercise of day.exercises) {
        const key = exerciseKey(exercise.name, exercise.exerciseId);
        if (!seen.has(key)) seen.set(key, { name: exercise.name, exerciseId: exercise.exerciseId });

        for (const alternate of exercise.alternates ?? []) {
          const altKey = exerciseKey(alternate.name, alternate.exerciseId);
          if (!seen.has(altKey)) {
            seen.set(altKey, { name: alternate.name, exerciseId: alternate.exerciseId });
          }
        }
      }
    }
    return [...seen.entries()].map(([key, value]) => ({ key, ...value }));
  }, [days]);

  const fetchRecords = useCallback(
    () =>
      supabase
        .from("exercise_prs")
        .select(
          "exercise_key, exercise_name, weight_kg, reps, estimated_1rm, source, achieved_at, updated_at",
        )
        .eq("client_id", userId),
    [userId],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await fetchRecords();
      if (!active) return;

      const rows = (data as PersonalRecord[]) ?? [];
      setRecords(rows);
      setDrafts(
        Object.fromEntries(
          rows
            .filter((record) => record.source === "starting")
            .map((record) => [
              record.exercise_key,
              {
                weight: record.weight_kg != null ? String(record.weight_kg) : "",
                reps: record.reps != null ? String(record.reps) : "",
              },
            ]),
        ),
      );
    }

    load();
    return () => {
      active = false;
    };
  }, [fetchRecords]);

  const recordsByKey = useMemo(
    () => new Map(records.map((record) => [record.exercise_key, record])),
    [records],
  );

  function setDraft(key: string, patch: Partial<Draft>) {
    setSaved(false);
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...{ weight: "", reps: "" }, ...prev[key], ...patch },
    }));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const achievedAt = new Date().toISOString();
    const rows = exercises
      .filter((exercise) => recordsByKey.get(exercise.key)?.source !== "logged")
      .map((exercise) => {
        const draft = drafts[exercise.key];
        const weight = draft?.weight ? Number(draft.weight) : null;
        const reps = draft?.reps ? Number(draft.reps) : null;
        return { exercise, weight, reps };
      })
      .filter(({ weight, reps }) => weight !== null && reps !== null)
      .map(({ exercise, weight, reps }) => ({
        client_id: userId,
        exercise_key: exercise.key,
        exercise_name: exercise.name,
        weight_kg: weight,
        reps: reps,
        estimated_1rm: estimate1RM(weight, reps),
        source: "starting" as const,
        achieved_at: achievedAt,
        updated_at: achievedAt,
      }));

    if (rows.length === 0) {
      setSaving(false);
      setError("Add a weight and reps for at least one exercise.");
      return;
    }

    const { error: saveError } = await supabase
      .from("exercise_prs")
      .upsert(rows, { onConflict: "client_id,exercise_key" });

    if (saveError) {
      setSaving(false);
      setError(saveError.message);
      return;
    }

    // Seed the timeline too, so the progress chart has a starting point.
    await supabase.from("exercise_pr_history").insert(
      rows.map((row) => ({
        client_id: row.client_id,
        exercise_key: row.exercise_key,
        exercise_name: row.exercise_name,
        weight_kg: row.weight_kg,
        reps: row.reps,
        estimated_1rm: row.estimated_1rm,
        source: "starting",
        achieved_at: achievedAt,
      })),
    );

    const { data } = await fetchRecords();
    setRecords((data as PersonalRecord[]) ?? []);
    setSaving(false);
    setSaved(true);
  }

  if (exercises.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-nova-text">
            <Trophy className="size-3.5 text-nova-warning" />
            Starting numbers
          </h2>
          <p className="mt-0.5 text-xs text-nova-muted">
            Already lifting? Add your current bests so we can track progress from day one.
          </p>
        </div>
        <ChevronDown
          className={cn("size-4 shrink-0 text-nova-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-nova-border/70 p-4">
          <div className="flex items-center gap-2 px-1 pb-1.5">
            <span className="flex-1 text-[11px] font-medium text-nova-muted">Exercise</span>
            <span className="w-20 text-center text-[11px] font-medium text-nova-muted">kg</span>
            <span className="w-20 text-center text-[11px] font-medium text-nova-muted">Reps</span>
          </div>

          <ul className="space-y-2">
            {exercises.map((exercise) => {
              const record = recordsByKey.get(exercise.key);
              const locked = record?.source === "logged";

              return (
                <li key={exercise.key} className="flex items-center gap-2">
                  <ExerciseArt
                    name={exercise.name}
                    exerciseId={exercise.exerciseId}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-nova-text">
                      {exercise.name}
                    </p>
                    {locked && record && (
                      <p className="truncate text-[11px] text-nova-muted">
                        PR {formatRecord(record)} — tracked from your logs
                      </p>
                    )}
                  </div>

                  {locked ? (
                    <span className="w-[168px] text-right text-xs text-nova-muted">
                      Logged in training
                    </span>
                  ) : (
                    <>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.5"
                        value={drafts[exercise.key]?.weight ?? ""}
                        onChange={(e) => setDraft(exercise.key, { weight: e.target.value })}
                        placeholder="—"
                        aria-label={`${exercise.name} starting weight in kilograms`}
                        className="h-9 w-20 text-center text-sm"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={drafts[exercise.key]?.reps ?? ""}
                        onChange={(e) => setDraft(exercise.key, { reps: e.target.value })}
                        placeholder="—"
                        aria-label={`${exercise.name} starting reps`}
                        className="h-9 w-20 text-center text-sm"
                      />
                    </>
                  )}
                </li>
              );
            })}
          </ul>

          {error && <p className="mt-3 text-sm text-nova-danger">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save starting numbers"}
            </Button>
            {saved && <span className="text-sm text-nova-success">Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}
