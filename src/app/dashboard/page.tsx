"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, LogOut, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { WarmupCard } from "@/components/client/WarmupCard";
import { DaySelector } from "@/components/client/DaySelector";
import { ExerciseCard, type ExerciseLogDraft } from "@/components/client/ExerciseCard";
import { WeekStrip } from "@/components/client/WeekStrip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { normalizeDays, type PlanDay, type PlanSource } from "@/lib/planTemplates";
import {
  lastCompletedByDay,
  suggestNextDayId,
  type WorkoutHistoryEntry,
} from "@/lib/rotation";
import {
  beatsRecord,
  bestSet,
  estimate1RM,
  exerciseKey,
  type LoggedSet,
  type PersonalRecord,
} from "@/lib/prs";

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface PlanRow {
  id: string;
  full_name: string;
  status: string;
  days: PlanDay[] | null;
  coach_notes: string | null;
  created_at: string;
  approved_at: string | null;
}

interface ExerciseLogRow {
  id: string;
  plan_day_id: string;
  planned_name: string;
  performed_name: string;
  sets: { weight_kg: number | null; reps: number | null }[] | null;
  sets_completed: number | null;
  reps: string | null;
  weight_kg: number | null;
  logged_at: string;
}

const LOG_COLUMNS =
  "id, plan_day_id, planned_name, performed_name, sets, sets_completed, reps, weight_kg, logged_at";

/** Week 1 starts the day the plan was approved (or created, if not yet). */
function weekNumber(plan: PlanRow) {
  const start = new Date(plan.approved_at ?? plan.created_at);
  start.setHours(0, 0, 0, 0);
  const days = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [completedDayKeys, setCompletedDayKeys] = useState<Set<string>>(new Set());
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogRow[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("active")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!active) return;

      if (profile?.active === false) {
        await supabase.auth.signOut();
        router.replace("/");
        return;
      }

      const { data } = await supabase
        .from("plans")
        .select(
          "id, full_name, status, days, coach_notes, created_at, approved_at",
        )
        .eq("client_id", sessionData.session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (!data) {
        router.replace("/onboarding");
        return;
      }

      const planRow = data as PlanRow;

      if (planRow.status !== "approved") {
        router.replace("/onboarding/review");
        return;
      }

      setUserId(sessionData.session.user.id);
      setPlan(planRow);

      const [{ data: logs }, { data: exLogs }, { data: prRows }] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("completed_at, plan_day_id, plan_source")
          .eq("client_id", sessionData.session.user.id),
        supabase
          .from("exercise_logs")
          .select(LOG_COLUMNS)
          .eq("client_id", sessionData.session.user.id)
          .order("logged_at", { ascending: false })
          .limit(300),
        supabase
          .from("exercise_prs")
          .select(
            "exercise_key, exercise_name, weight_kg, reps, estimated_1rm, source, achieved_at, updated_at",
          )
          .eq("client_id", sessionData.session.user.id),
      ]);

      if (!active) return;

      const rows = (logs ?? []) as {
        completed_at: string;
        plan_day_id: string;
        plan_source: PlanSource | null;
      }[];

      setCompletedDates(
        new Set(rows.map((log) => new Date(log.completed_at).toISOString().slice(0, 10))),
      );
      setCompletedDayKeys(
        new Set(
          rows.map(
            (log) =>
              `${new Date(log.completed_at).toISOString().slice(0, 10)}:${log.plan_day_id}`,
          ),
        ),
      );
      setWorkoutHistory(
        rows.map((log) => ({
          dayId: log.plan_day_id,
          completedAt: log.completed_at,
          source: log.plan_source ?? "coach",
        })),
      );
      setTotalCompleted(rows.length);
      setExerciseLogs((exLogs as ExerciseLogRow[]) ?? []);
      setRecords((prRows as PersonalRecord[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  // One programme, written by the coach — clients no longer author plans.
  const source: PlanSource = "coach";
  const days = useMemo(() => normalizeDays(plan?.days), [plan]);

  // Suggestion follows the rotation — the day after whatever was finished
  // last — so a skipped day never forces the wrong session on you, and
  // picking a different day just moves where the rotation carries on from.
  const historyForSource = useMemo(
    () => workoutHistory.filter((entry) => entry.source === "coach"),
    [workoutHistory],
  );
  const suggestedDayId = useMemo(
    () => suggestNextDayId(days, historyForSource),
    [days, historyForSource],
  );
  const lastCompleted = useMemo(
    () => lastCompletedByDay(historyForSource),
    [historyForSource],
  );
  const completedTodayDayIds = useMemo(() => {
    const key = todayKey();
    return new Set(
      [...completedDayKeys]
        .filter((entry) => entry.startsWith(`${key}:`))
        .map((entry) => entry.slice(key.length + 1)),
    );
  }, [completedDayKeys]);

  const activeDay =
    days.find((d) => d.id === activeDayId) ??
    days.find((d) => d.id === suggestedDayId) ??
    days[0];

  const todaysLogs = useMemo(() => {
    const key = todayKey();
    const map = new Map<string, ExerciseLogRow>();
    for (const log of exerciseLogs) {
      if (log.logged_at.slice(0, 10) !== key) continue;
      if (activeDay && log.plan_day_id !== activeDay.id) continue;
      if (!map.has(log.planned_name)) map.set(log.planned_name, log);
    }
    return map;
  }, [exerciseLogs, activeDay]);

  const recordsByKey = useMemo(
    () => new Map(records.map((record) => [record.exercise_key, record])),
    [records],
  );

  const recordFor = useCallback(
    (name: string, exerciseId?: string) => recordsByKey.get(exerciseKey(name, exerciseId)),
    [recordsByKey],
  );

  /** Sets from the most recent session for a slot, used to prefill today's. */
  const previousSetsFor = useCallback(
    (plannedName: string) => {
      const key = todayKey();
      const previous = exerciseLogs.find(
        (log) => log.planned_name === plannedName && log.logged_at.slice(0, 10) !== key,
      );
      return previous?.sets ?? undefined;
    },
    [exerciseLogs],
  );

  /** Most recent pick per slot from *before* today — powers "Last time: …". */
  const lastPerformed = useMemo(() => {
    const key = todayKey();
    const map = new Map<string, string>();
    for (const log of exerciseLogs) {
      if (log.logged_at.slice(0, 10) === key) continue;
      if (!map.has(log.planned_name)) map.set(log.planned_name, log.performed_name);
    }
    return map;
  }, [exerciseLogs]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  async function handleLogExercise(plannedName: string, draft: ExerciseLogDraft) {
    if (!userId || !activeDay || !plan) return;

    const existing = todaysLogs.get(plannedName);
    const best = bestSet(draft.sets);

    const payload = {
      client_id: userId,
      plan_day_id: activeDay.id,
      plan_source: source,
      planned_name: plannedName,
      performed_name: draft.performedName,
      is_alternate: draft.isAlternate,
      week_number: weekNumber(plan),
      sets: draft.sets,
      // Summary of the best set, kept alongside the detail so older readers
      // (and the coach's activity feed) still make sense.
      sets_completed: draft.sets.length,
      reps: best?.reps != null ? String(best.reps) : null,
      weight_kg: best?.weight_kg ?? null,
    };

    const { data, error } = existing
      ? await supabase
          .from("exercise_logs")
          .update(payload)
          .eq("id", existing.id)
          .select(LOG_COLUMNS)
          .single()
      : await supabase.from("exercise_logs").insert(payload).select(LOG_COLUMNS).single();

    if (error || !data) return;

    setExerciseLogs((prev) =>
      existing
        ? prev.map((log) => (log.id === existing.id ? (data as ExerciseLogRow) : log))
        : [data as ExerciseLogRow, ...prev],
    );

    if (best) await updateRecord(draft, best);
  }

  /** Promotes the session's best set to a personal record when it beats the
   * one on the books, and appends to the record's timeline. */
  async function updateRecord(draft: ExerciseLogDraft, best: LoggedSet) {
    if (!userId) return;

    const key = exerciseKey(draft.performedName, draft.performedExerciseId);
    const current = recordsByKey.get(key);
    if (!beatsRecord(best, current)) return;

    const achievedAt = new Date().toISOString();
    const record: PersonalRecord = {
      exercise_key: key,
      exercise_name: draft.performedName,
      weight_kg: best.weight_kg,
      reps: best.reps,
      estimated_1rm: estimate1RM(best.weight_kg, best.reps),
      source: "logged",
      achieved_at: achievedAt,
      updated_at: achievedAt,
    };

    const { error } = await supabase
      .from("exercise_prs")
      .upsert({ client_id: userId, ...record }, { onConflict: "client_id,exercise_key" });

    if (error) return;

    await supabase.from("exercise_pr_history").insert({
      client_id: userId,
      exercise_key: key,
      exercise_name: record.exercise_name,
      weight_kg: record.weight_kg,
      reps: record.reps,
      estimated_1rm: record.estimated_1rm,
      source: "logged",
      achieved_at: achievedAt,
    });

    setRecords((prev) => [...prev.filter((r) => r.exercise_key !== key), record]);
  }

  async function handleMarkComplete() {
    if (!activeDay || !userId) return;
    const key = `${todayKey()}:${activeDay.id}`;
    if (completedDayKeys.has(key)) return;

    setMarking(true);
    const { error } = await supabase.from("workout_logs").insert({
      client_id: userId,
      plan_day_id: activeDay.id,
      plan_source: source,
    });
    setMarking(false);

    if (!error) {
      setCompletedDates((prev) => new Set(prev).add(todayKey()));
      setCompletedDayKeys((prev) => new Set(prev).add(key));
      setWorkoutHistory((prev) => [
        { dayId: activeDay.id, completedAt: new Date().toISOString(), source },
        ...prev,
      ]);
      setTotalCompleted((prev) => prev + 1);
    }
  }

  if (loading || !plan) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading your plan…</p>
      </div>
    );
  }

  const firstName = plan.full_name.split(" ")[0] || "there";
  const dayDoneToday = activeDay
    ? completedDayKeys.has(`${todayKey()}:${activeDay.id}`)
    : false;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-24 md:pb-16">
      <BottomNav />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl lg:max-w-4xl">
        <header className="flex items-center justify-between gap-3 px-5 pt-5 md:px-0 md:pt-10">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-nova-text md:text-2xl">
              Hello, {firstName} 👋
            </h1>
            <p className="truncate text-xs text-nova-muted md:text-sm">{today}</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-nova-muted transition-colors hover:bg-nova-surface hover:text-nova-text"
          >
            <LogOut className="size-4" />
          </button>
        </header>

        <main className="px-5 md:px-0">
          {plan.coach_notes && (
            <div className="mt-3 rounded-xl border border-nova-accent/25 bg-nova-accent/[0.04] px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-nova-accent">
                <Sparkles className="size-3" />
                Note from your coach
              </p>
              <p className="mt-0.5 text-sm text-nova-text">{plan.coach_notes}</p>
            </div>
          )}

          {days.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-nova-border bg-nova-surface p-8 text-center">
              <CalendarDays className="mx-auto size-6 text-nova-muted" />
              <p className="mt-2 text-sm font-medium text-nova-text">
                Your coach is still putting this together
              </p>
              <p className="mt-1 text-xs text-nova-muted">
                They&apos;ll publish your programme shortly — message them if you need it sooner.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link href="/dashboard/messages">Message your coach</Link>
              </Button>
            </div>
          ) : (
            <>
              {activeDay && (
                <>
                  <div className="mt-4">
                    <DaySelector
                      days={days}
                      activeDayId={activeDay.id}
                      suggestedDayId={suggestedDayId}
                      lastCompleted={lastCompleted}
                      completedTodayDayIds={completedTodayDayIds}
                      onSelect={setActiveDayId}
                    />
                  </div>

                  <div className="mt-3">
                    <WarmupCard />
                  </div>

                  {activeDay.exercises.length === 0 && (
                    <p className="mt-4 rounded-2xl border border-dashed border-nova-border bg-nova-surface px-4 py-6 text-center text-sm text-nova-muted">
                      Nothing programmed for this day — pick another day above.
                    </p>
                  )}

                  {/* One exercise per row on every screen — a set-by-set
                      logging form needs the full width to stay tappable. */}
                  <div className="mt-4 space-y-3">
                    {activeDay.exercises.map((exercise, i) => (
                      <ExerciseCard
                        key={`${activeDay.id}-${i}-${exercise.name}`}
                        exercise={exercise}
                        logged={todaysLogs.get(exercise.name) ?? null}
                        lastPerformedName={lastPerformed.get(exercise.name)}
                        previousSets={previousSetsFor(exercise.name)}
                        recordFor={recordFor}
                        onLog={(draft) => handleLogExercise(exercise.name, draft)}
                      />
                    ))}
                  </div>

                  <Button
                    variant="success"
                    className="mt-5 w-full md:w-auto"
                    disabled={dayDoneToday || marking}
                    onClick={handleMarkComplete}
                  >
                    {dayDoneToday
                      ? "Completed today ✓"
                      : marking
                        ? "Saving…"
                        : "Mark Workout Complete"}
                  </Button>
                </>
              )}
            </>
          )}

          {/* Secondary by design: the session comes first on a phone, and
              the week's summary is what you scroll to afterwards. */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-nova-text">Your week</h2>
            <div className="mt-2 rounded-2xl border border-nova-border/70 bg-nova-surface p-3.5 shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
              <WeekStrip completedDates={completedDates} />
              <div className="mt-3 grid grid-cols-3 divide-x divide-nova-border border-t border-nova-border pt-3">
                <div className="px-1 text-center">
                  <p className="text-sm font-semibold text-nova-text">{totalCompleted}</p>
                  <p className="text-[11px] text-nova-muted">Workouts</p>
                </div>
                <div className="px-1 text-center">
                  <p className="text-sm font-semibold text-nova-text">Week {weekNumber(plan)}</p>
                  <p className="text-[11px] text-nova-muted">Programme</p>
                </div>
                <div className="px-1 text-center">
                  <p className="text-sm font-semibold text-nova-text">{days.length}-day</p>
                  <p className="text-[11px] text-nova-muted">Split</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
