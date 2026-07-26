"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExerciseReviewRow } from "@/components/coach/ExerciseReviewRow";
import { supabase } from "@/lib/supabase";
import type { PlanDay } from "@/lib/planTemplates";

const ADMIN_SESSION_KEY = "nova_admin_session";

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
  status: string;
}

function AdminReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (localStorage.getItem(ADMIN_SESSION_KEY) !== "true") {
        router.replace("/admin");
        return;
      }
      if (!planId) {
        router.replace("/admin");
        return;
      }

      const { data } = await supabase.rpc("admin_list_plans");
      if (!active) return;

      const found = ((data as Plan[]) ?? []).find((p) => p.id === planId);
      if (!found) {
        router.replace("/admin");
        return;
      }

      setPlan(found);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [planId, router]);

  async function handleDecision(status: "approved" | "changes_requested") {
    if (!plan) return;
    setSaving(true);

    const { error } = await supabase.rpc("admin_update_plan_status", {
      p_id: plan.id,
      p_status: status,
    });

    setSaving(false);
    if (!error) {
      router.push("/admin");
    }
  }

  if (loading || !plan) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  const days: PlanDay[] = plan.days;
  const flaggedConditions = plan.medical_conditions.filter((c) => c !== "none");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-24 md:max-w-2xl">
      <header className="flex items-center gap-3 px-5 pt-6 md:px-0 md:pt-10">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-nova-text md:text-xl">
          Review Plan (Admin)
        </h1>
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

              <div className="mt-3 space-y-3">
                {day.exercises.map((exercise, i) => (
                  <ExerciseReviewRow
                    key={exercise.name}
                    {...exercise}
                    defaultOpen={i === 0}
                  />
                ))}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-nova-text">
                  Day Notes
                </label>
                <Textarea placeholder="Add notes for this day..." rows={3} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
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

export default function AdminReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-sm text-nova-muted">Loading…</p>
        </div>
      }
    >
      <AdminReviewContent />
    </Suspense>
  );
}
