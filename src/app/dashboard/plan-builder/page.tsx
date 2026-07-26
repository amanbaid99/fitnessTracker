"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Info } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { PlanEditor } from "@/components/plan/PlanEditor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { emptyDay, normalizeDays, type PlanDay, type PlanSource } from "@/lib/planTemplates";

const DAY_OPTIONS = [2, 3, 4, 5, 6];

const SUGGESTED_TITLES = [
  "Day 1 — Upper Body",
  "Day 2 — Lower Body",
  "Day 3 — Push",
  "Day 4 — Pull",
  "Day 5 — Legs",
  "Day 6 — Full Body",
  "Day 7 — Conditioning",
];

function seedDays(count: number, existing: PlanDay[]): PlanDay[] {
  if (count <= existing.length) return existing.slice(0, count);
  const added = Array.from({ length: count - existing.length }, (_, i) => {
    const index = existing.length + i;
    return { ...emptyDay(index), title: SUGGESTED_TITLES[index] ?? `Day ${index + 1}` };
  });
  return [...existing, ...added];
}

export default function PlanBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coachDays, setCoachDays] = useState<PlanDay[]>([]);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [activePlan, setActivePlan] = useState<PlanSource>("coach");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/login");
        return;
      }

      const { data } = await supabase
        .from("plans")
        .select("days, custom_days, custom_days_per_week, active_plan")
        .eq("client_id", sessionData.session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (!data) {
        router.replace("/onboarding");
        return;
      }

      const existingCustom = normalizeDays(data.custom_days as PlanDay[] | null);
      setCoachDays(normalizeDays(data.days as PlanDay[] | null));
      setDays(existingCustom.length > 0 ? existingCustom : seedDays(3, []));
      setActivePlan((data.active_plan as PlanSource) ?? "coach");
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  function handleDaysPerWeek(count: number) {
    setSavedMessage(null);
    setDays((prev) => seedDays(count, prev));
  }

  function copyCoachPlan() {
    setSavedMessage(null);
    // Deep clone so editing the copy can't mutate what the coach assigned.
    setDays(JSON.parse(JSON.stringify(coachDays)) as PlanDay[]);
  }

  async function save(makeActive: boolean) {
    setError(null);
    setSavedMessage(null);

    if (days.every((day) => day.exercises.length === 0)) {
      setError("Add at least one exercise before saving.");
      return;
    }

    setSaving(true);
    const { error: saveError } = await supabase.rpc("save_custom_plan", {
      p_days: days,
      p_days_per_week: days.length,
      p_make_active: makeActive,
    });
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    if (makeActive) {
      router.push("/dashboard");
      return;
    }

    setSavedMessage(
      activePlan === "custom"
        ? "Saved."
        : "Saved as a draft — you're still training your coach's plan.",
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  const totalExercises = days.reduce((sum, day) => sum + day.exercises.length, 0);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-32 md:pb-24">
      <BottomNav />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl lg:max-w-4xl">
        <header className="flex items-center gap-3 px-5 pt-6 md:px-0 md:pt-10">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to dashboard"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-nova-text md:text-2xl">
              Build your own plan
            </h1>
            <p className="mt-0.5 text-sm text-nova-muted">
              Search the library or add your own exercises.
            </p>
          </div>
        </header>

        <main className="px-5 md:px-0">
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-nova-text">How many days a week?</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DAY_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleDaysPerWeek(count)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    days.length === count
                      ? "bg-nova-accent text-white"
                      : "bg-nova-surface text-nova-muted ring-1 ring-nova-border hover:text-nova-text",
                  )}
                >
                  {count} days
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-nova-muted">
              Lowering this removes the last days — their exercises go with them.
            </p>

            {coachDays.length > 0 && (
              <Button variant="outline" size="sm" className="mt-3" onClick={copyCoachPlan}>
                <Copy className="size-3.5" />
                Start from my coach&apos;s plan
              </Button>
            )}
          </section>

          <section className="mt-8">
            <PlanEditor days={days} onChange={(next) => {
              setSavedMessage(null);
              setDays(next);
            }} />
          </section>

          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-nova-border/70 bg-nova-surface p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-nova-muted" />
            <p className="text-xs text-nova-muted">
              Add up to three alternates per exercise (open an exercise to set them). When you
              log a workout you pick which one you actually did — so bench press one week and
              dumbbell press the next both count toward the same slot.
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-nova-danger">{error}</p>}
          {savedMessage && <p className="mt-4 text-sm text-nova-success">{savedMessage}</p>}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-40 mx-auto flex w-full max-w-[430px] items-center gap-3 border-t border-nova-border bg-nova-bg/95 px-5 py-3 backdrop-blur md:bottom-0 md:max-w-2xl md:px-0 lg:max-w-4xl">
        <p className="flex-1 text-xs text-nova-muted">
          {days.length} days · {totalExercises} exercise{totalExercises === 1 ? "" : "s"}
        </p>
        <Button variant="outline" disabled={saving} onClick={() => save(false)}>
          Save draft
        </Button>
        <Button disabled={saving} onClick={() => save(true)}>
          {saving ? "Saving…" : activePlan === "custom" ? "Save plan" : "Save & train this"}
        </Button>
      </div>
    </div>
  );
}
