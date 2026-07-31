"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { WeekStrip } from "@/components/client/WeekStrip";
import { RecordsProgress, type PrHistoryRow } from "@/components/client/RecordsProgress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import type { PersonalRecord } from "@/lib/prs";

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

function thisMonth(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [history, setHistory] = useState<PrHistoryRow[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/login");
        return;
      }

      const clientId = sessionData.session.user.id;

      const [{ data }, { data: prRows }, { data: historyRows }] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("completed_at, plan_day_id")
          .eq("client_id", clientId)
          .order("completed_at", { ascending: false }),
        supabase
          .from("exercise_prs")
          .select(
            "exercise_key, exercise_name, weight_kg, reps, estimated_1rm, source, achieved_at, updated_at",
          )
          .eq("client_id", clientId),
        supabase
          .from("exercise_pr_history")
          .select(
            "exercise_key, exercise_name, weight_kg, reps, estimated_1rm, source, achieved_at",
          )
          .eq("client_id", clientId)
          .order("achieved_at", { ascending: true }),
      ]);

      if (!active) return;

      setLogs((data as LogRow[]) ?? []);
      setRecords((prRows as PersonalRecord[]) ?? []);
      setHistory((historyRows as PrHistoryRow[]) ?? []);
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
        <p className="text-sm text-ft-muted">Loading…</p>
      </div>
    );
  }

  const completedDates = new Set(logs.map((l) => dateKey(l.completed_at)));
  const streak = computeStreak(completedDates);
  const recordsThisMonth = history.filter(
    (row) => row.source === "logged" && thisMonth(row.achieved_at),
  ).length;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-ft-bg pb-24 md:pb-16">
      <BottomNav />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl">
        <header className="px-5 pt-6 md:px-0 md:pt-10">
          <h1 className="text-xl font-semibold text-ft-text md:text-2xl">Progress</h1>
          <p className="mt-1 text-sm text-ft-muted">
            Your training history and personal records.
          </p>
        </header>

        <main className="px-5 md:px-0">
          <Tabs defaultValue="activity" className="mt-5">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="records">
                Records
                {records.length > 0 && (
                  <span className="ml-1.5 text-xs text-ft-muted">{records.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-5">
              <div className="rounded-2xl border border-ft-border/70 bg-ft-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
                <WeekStrip completedDates={completedDates} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-ft-border/70 bg-ft-surface p-4 text-center shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
                  <p className="text-2xl font-semibold text-ft-text">{logs.length}</p>
                  <p className="mt-0.5 text-xs text-ft-muted">Workouts</p>
                </div>
                <div className="rounded-2xl border border-ft-border/70 bg-ft-surface p-4 text-center shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
                  <p className="text-2xl font-semibold text-ft-text">{streak}</p>
                  <p className="mt-0.5 text-xs text-ft-muted">Day streak</p>
                </div>
                <div className="rounded-2xl border border-ft-border/70 bg-ft-surface p-4 text-center shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
                  <p className="text-2xl font-semibold text-ft-text">{recordsThisMonth}</p>
                  <p className="mt-0.5 text-xs text-ft-muted">PRs this month</p>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-semibold text-ft-text">Recent workouts</h2>
                <div className="mt-3 divide-y divide-ft-border rounded-2xl border border-ft-border/70 bg-ft-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
                  {logs.length === 0 && (
                    <p className="px-4 py-3 text-sm text-ft-muted">
                      No workouts logged yet — complete one from your dashboard.
                    </p>
                  )}
                  {logs.slice(0, 10).map((log, i) => (
                    <div key={`${log.completed_at}-${i}`} className="px-4 py-3">
                      <p className="text-sm font-medium text-ft-text">
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
            </TabsContent>

            <TabsContent value="records" className="mt-5">
              <RecordsProgress records={records} history={history} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
