"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Repeat2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlanEditor } from "@/components/plan/PlanEditor";
import { supabase } from "@/lib/supabase";
import { normalizeDays, type PlanDay } from "@/lib/planTemplates";

const ADMIN_SESSION_KEY = "nova_admin_session";

const GOAL_LABEL: Record<string, string> = {
  "build-muscle": "Build muscle",
  "fat-loss": "Fat loss",
  "general-fitness": "General fitness",
};

interface Plan {
  id: string;
  client_id: string;
  full_name: string;
  age: number | null;
  goal: string;
  medical_conditions: string[];
  medical_notes: string | null;
  days: PlanDay[] | null;
  coach_notes: string | null;
  status: string;
}

interface LogRow {
  planned_name: string;
  performed_name: string;
  is_alternate: boolean;
  sets_completed: number | null;
  reps: string | null;
  weight_kg: number | null;
  logged_at: string;
}

function AdminReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [coachNotes, setCoachNotes] = useState("");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      setDays(normalizeDays(found.days));
      setCoachNotes(found.coach_notes ?? "");

      const { data: logRows } = await supabase.rpc("admin_list_exercise_logs", {
        p_client_id: found.client_id,
      });

      if (!active) return;
      setLogs(((logRows as LogRow[]) ?? []).slice(0, 8));
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [planId, router]);

  async function saveDays() {
    if (!plan) return null;
    return supabase.rpc("admin_save_plan", {
      p_id: plan.id,
      p_days: days,
      p_coach_notes: coachNotes || null,
    });
  }

  async function handleSaveChanges() {
    setSaving(true);
    const result = await saveDays();
    setSaving(false);
    if (result && !result.error) setSaved(true);
  }

  async function handleDecision(status: "approved" | "changes_requested") {
    if (!plan) return;
    setSaving(true);

    const saveResult = await saveDays();
    if (saveResult?.error) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.rpc("admin_update_plan_status", {
      p_id: plan.id,
      p_status: status,
    });

    setSaving(false);
    if (!error) router.push("/admin");
  }

  if (loading || !plan) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  const flaggedConditions = plan.medical_conditions.filter((c) => c !== "none");
  const isPending = plan.status === "pending";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-28 md:max-w-2xl">
      <header className="flex items-center gap-3 px-5 pt-6 md:px-0 md:pt-10">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={() => router.push("/admin")}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-nova-text md:text-xl">
          {isPending ? "Review plan" : "Edit plan"}
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
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-nova-text">Workout</h2>
          <p className="mt-0.5 text-xs text-nova-muted">
            Add days, add exercises, and give each one up to three alternates.
          </p>
          <div className="mt-3">
            <PlanEditor
              days={days}
              showCoachFields
              onChange={(next) => {
                setSaved(false);
                setDays(next);
              }}
            />
          </div>
        </div>

        {logs.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-nova-text">Recent activity</h2>
            <ul className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface">
              {logs.map((log, i) => (
                <li key={`${log.logged_at}-${i}`} className="px-4 py-2.5">
                  <p className="text-sm text-nova-text">
                    {log.performed_name}
                    {log.is_alternate && (
                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-nova-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-nova-accent">
                        <Repeat2 className="size-3" />
                        swapped for {log.planned_name}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-nova-muted">
                    {log.sets_completed ?? "?"} × {log.reps ?? "?"}
                    {log.weight_kg ? ` @ ${log.weight_kg}kg` : ""} ·{" "}
                    {new Date(log.logged_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
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
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] items-center gap-3 border-t border-nova-border bg-nova-bg/95 px-5 py-4 backdrop-blur md:max-w-2xl md:px-0">
        {isPending ? (
          <>
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
          </>
        ) : (
          <>
            {saved && <span className="text-sm text-nova-success">Saved</span>}
            <Button className="ml-auto" disabled={saving} onClick={handleSaveChanges}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        )}
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
