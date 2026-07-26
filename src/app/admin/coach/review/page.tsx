"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExerciseReviewRow } from "@/components/coach/ExerciseReviewRow";
import { supabase } from "@/lib/supabase";
import type { PlanDay, PlanExercise } from "@/lib/planTemplates";

const GOAL_LABEL: Record<string, string> = {
  "build-muscle": "Build muscle",
  "fat-loss": "Fat loss",
  "general-fitness": "General fitness",
};

interface Plan {
  id: string;
  full_name: string;
  age: number | null;
  goal: string;
  medical_conditions: string[];
  medical_notes: string | null;
  days: PlanDay[];
  coach_notes: string | null;
  status: string;
}

function CoachReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [coachNotes, setCoachNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/admin");
        return;
      }
      if (!planId) {
        router.replace("/admin/coach");
        return;
      }

      const { data } = await supabase
        .from("plans")
        .select(
          "id, full_name, age, goal, medical_conditions, medical_notes, days, coach_notes, status",
        )
        .eq("id", planId)
        .maybeSingle();

      if (!active) return;

      if (!data) {
        router.replace("/admin/coach");
        return;
      }

      setPlan(data as Plan);
      setDays((data as Plan).days);
      setCoachNotes((data as Plan).coach_notes ?? "");
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [planId, router]);

  function updateExercise(dayId: string, index: number, updated: PlanExercise) {
    setSaved(false);
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((ex, i) => (i === index ? updated : ex)),
            }
          : day,
      ),
    );
  }

  async function handleSaveChanges() {
    if (!plan) return;
    setSaving(true);

    const { error } = await supabase
      .from("plans")
      .update({ days, coach_notes: coachNotes || null })
      .eq("id", plan.id);

    setSaving(false);
    if (!error) setSaved(true);
  }

  async function handleDecision(status: "approved" | "changes_requested") {
    if (!plan) return;
    setSaving(true);

    const { error } = await supabase
      .from("plans")
      .update({
        days,
        coach_notes: coachNotes || null,
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", plan.id);

    setSaving(false);
    if (!error) {
      router.push("/admin/coach");
    }
  }

  if (loading || !plan) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  const flaggedConditions = plan.medical_conditions.filter((c) => c !== "none");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-24 md:max-w-2xl">
      <header className="flex items-center gap-3 px-5 pt-6 md:px-0 md:pt-10">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => router.push("/admin/coach")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-nova-text md:text-xl">Review Plan</h1>
      </header>

      <div className="mx-5 mt-4 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)] md:mx-0">
        <p className="font-semibold text-nova-text">{plan.full_name}</p>
        <p className="text-sm text-nova-muted">
          {plan.age ? `${plan.age} yrs · ` : ""}Goal: {GOAL_LABEL[plan.goal] ?? plan.goal}
        </p>
        {flaggedConditions.length > 0 && (
          <span className="mt-2 inline-flex items-center rounded-full bg-nova-danger/10 px-2.5 py-1 text-xs font-medium text-nova-danger">
            ⚠ {flaggedConditions.join(", ")}
          </span>
        )}
        {plan.medical_notes && (
          <p className="mt-2 text-sm text-nova-muted">{plan.medical_notes}</p>
        )}
      </div>

      <main className="flex-1 px-5 md:px-0">
        <Tabs defaultValue={days[0]?.id} className="mt-5">
          <TabsList>
            {days.map((day) => (
              <TabsTrigger key={day.id} value={day.id}>
                {day.title.split("—")[0].trim()}
              </TabsTrigger>
            ))}
          </TabsList>

          {days.map((day) => (
            <TabsContent key={day.id} value={day.id} className="mt-4">
              <h2 className="text-sm font-semibold text-nova-text">{day.title}</h2>
              <p className="mt-0.5 text-xs text-nova-muted">
                Tap an exercise to edit its sets, reps, rest, tempo, or RPE.
              </p>

              <div className="mt-3 space-y-3">
                {day.exercises.map((exercise, i) => (
                  <ExerciseReviewRow
                    key={`${day.id}-${i}`}
                    exercise={exercise}
                    onChange={(updated) => updateExercise(day.id, i, updated)}
                    defaultOpen={false}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-nova-text">
            Coach notes (visible to the client)
          </label>
          <Textarea
            value={coachNotes}
            onChange={(e) => {
              setSaved(false);
              setCoachNotes(e.target.value);
            }}
            placeholder="Add notes about this program..."
            rows={3}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveChanges} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          {saved && <span className="text-sm text-nova-success">Saved</span>}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] gap-3 border-t border-nova-border bg-nova-bg/95 px-5 py-4 backdrop-blur md:max-w-2xl md:px-0">
        <Button
          variant="outline"
          className="flex-1"
          disabled={saving}
          onClick={() => handleDecision("changes_requested")}
        >
          Request Changes
        </Button>
        <Button className="flex-1" disabled={saving} onClick={() => handleDecision("approved")}>
          Approve &amp; Send
        </Button>
      </div>
    </div>
  );
}

export default function CoachReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-sm text-nova-muted">Loading…</p>
        </div>
      }
    >
      <CoachReviewContent />
    </Suspense>
  );
}
