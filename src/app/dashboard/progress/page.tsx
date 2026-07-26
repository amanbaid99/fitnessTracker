"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { WeekStrip } from "@/components/client/WeekStrip";
import { supabase } from "@/lib/supabase";

interface LogRow {
  completed_at: string;
  plan_day_id: string;
}

function dateKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function computeStreak(dateKeys: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // If today isn't logged yet, the streak still counts through yesterday.
  if (!dateKeys.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateKeys.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/login");
        return;
      }

      const { data } = await supabase
        .from("workout_logs")
        .select("completed_at, plan_day_id")
        .eq("client_id", sessionData.session.user.id)
        .order("completed_at", { ascending: false });

      if (!active) return;
      setLogs((data as LogRow[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  const completedDates = new Set(logs.map((l) => dateKey(l.completed_at)));
  const streak = computeStreak(completedDates);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-24 md:pb-16">
      <BottomNav />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl">
        <header className="px-5 pt-6 md:px-0 md:pt-10">
          <h1 className="text-xl font-semibold text-nova-text md:text-2xl">Progress</h1>
          <p className="mt-1 text-sm text-nova-muted">Your training history at a glance.</p>
        </header>

        <main className="px-5 md:px-0">
          <div className="mt-6 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
            <WeekStrip completedDates={completedDates} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-nova-border/70 bg-nova-surface p-4 text-center shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
              <p className="text-2xl font-semibold text-nova-text">{logs.length}</p>
              <p className="mt-0.5 text-xs text-nova-muted">Total workouts</p>
            </div>
            <div className="rounded-2xl border border-nova-border/70 bg-nova-surface p-4 text-center shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
              <p className="text-2xl font-semibold text-nova-text">{streak}-day</p>
              <p className="mt-0.5 text-xs text-nova-muted">Current streak</p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-nova-text">Recent workouts</h2>
            <div className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
              {logs.length === 0 && (
                <p className="px-4 py-3 text-sm text-nova-muted">
                  No workouts logged yet — complete one from your dashboard.
                </p>
              )}
              {logs.slice(0, 10).map((log, i) => (
                <div key={`${log.completed_at}-${i}`} className="px-4 py-3">
                  <p className="text-sm font-medium text-nova-text">
                    {new Date(log.completed_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
