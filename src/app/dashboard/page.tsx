"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { WarmupCard } from "@/components/client/WarmupCard";
import { ExerciseCard } from "@/components/client/ExerciseCard";
import { WeekStrip } from "@/components/client/WeekStrip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { PlanDay } from "@/lib/planTemplates";

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface Plan {
  full_name: string;
  status: string;
  days: PlanDay[];
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [totalCompleted, setTotalCompleted] = useState(0);
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
        .select("full_name, status, days")
        .eq("client_id", sessionData.session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (!data) {
        router.replace("/onboarding");
        return;
      }

      if (data.status !== "approved") {
        router.replace("/onboarding/review");
        return;
      }

      setUserId(sessionData.session.user.id);
      setPlan(data as Plan);

      const { data: logs } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("client_id", sessionData.session.user.id);

      if (!active) return;

      const dates = new Set(
        (logs ?? []).map((log) => new Date(log.completed_at).toISOString().slice(0, 10)),
      );
      setCompletedDates(dates);
      setTotalCompleted(logs?.length ?? 0);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  async function handleMarkComplete() {
    if (!plan || !userId || completedDates.has(todayKey())) return;
    setMarking(true);

    const { error } = await supabase.from("workout_logs").insert({
      client_id: userId,
      plan_day_id: todayWorkoutId(plan),
    });

    setMarking(false);
    if (!error) {
      setCompletedDates((prev) => new Set(prev).add(todayKey()));
      setTotalCompleted((prev) => prev + 1);
    }
  }

  function todayWorkoutId(p: Plan) {
    return p.days[0]?.id ?? "day-1";
  }

  if (loading || !plan) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading your plan…</p>
      </div>
    );
  }

  const firstName = plan.full_name.split(" ")[0] || "there";
  const todayWorkout = plan.days[0];
  const alreadyDoneToday = completedDates.has(todayKey());

  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-24 md:pb-16">
      <BottomNav />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl lg:max-w-4xl">
        <header className="flex items-center justify-between px-5 pt-6 md:px-0 md:pt-10">
          <div>
            <h1 className="text-xl font-semibold text-nova-text md:text-2xl">
              Good morning, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-nova-muted">{today}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-nova-muted hover:text-nova-text"
          >
            Sign out
          </button>
        </header>

        <div className="mx-5 mt-5 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)] md:mx-0 md:mt-6">
          <WeekStrip completedDates={completedDates} />
        </div>

        <div className="mx-5 mt-3 grid grid-cols-2 divide-x divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)] md:mx-0">
          <div className="px-2 py-3.5 text-center md:py-5">
            <p className="text-sm font-semibold text-nova-text">{totalCompleted} workouts</p>
            <p className="mt-0.5 text-xs text-nova-muted">Total done</p>
          </div>
          <div className="px-2 py-3.5 text-center md:py-5">
            <p className="text-sm font-semibold text-nova-text">{plan.days.length}-day</p>
            <p className="mt-0.5 text-xs text-nova-muted">Plan</p>
          </div>
        </div>

        <main className="px-5 md:px-0">
          <div className="mt-6">
            <WarmupCard />
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-nova-text">
              Today&apos;s Workout
            </h2>
            <p className="mt-0.5 text-xs text-nova-muted">{todayWorkout.title}</p>

            <div className="mt-3 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {todayWorkout.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.name}
                  name={exercise.name}
                  sets={exercise.sets}
                  reps={exercise.reps}
                  restSeconds={parseInt(exercise.rest, 10) || 60}
                />
              ))}
            </div>
          </div>

          <Button
            variant="success"
            className="mt-6 w-full md:w-auto"
            disabled={alreadyDoneToday || marking}
            onClick={handleMarkComplete}
          >
            {alreadyDoneToday
              ? "Completed today ✓"
              : marking
                ? "Saving…"
                : "Mark Workout Complete"}
          </Button>
        </main>
      </div>
    </div>
  );
}
