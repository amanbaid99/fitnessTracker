"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Repeat2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlanEditor } from "@/components/plan/PlanEditor";
import { PlanProcessing } from "@/components/plan/PlanProcessing";
import {
  PlanReportCard,
  type AiReport,
} from "@/components/plan/PlanReportCard";
import { supabase } from "@/lib/supabase";
import { normalizeDays, type PlanDay } from "@/lib/planTemplates";

const PLAN_COLUMNS =
  "id, client_id, full_name, age, goal, medical_conditions, medical_notes, days, coach_notes, status, ai_report, generated_by";

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
  ai_report: AiReport | null;
  generated_by: string | null;
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

function CoachReviewContent() {
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
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

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
        .select(PLAN_COLUMNS)
        .eq("id", planId)
        .maybeSingle();

      if (!active) return;

      if (!data) {
        router.replace("/admin/coach");
        return;
      }

      const row = data as Plan;
      setPlan(row);
      setDays(normalizeDays(row.days));
      setCoachNotes(row.coach_notes ?? "");

      const { data: logRows } = await supabase
        .from("exercise_logs")
        .select(
          "planned_name, performed_name, is_alternate, sets_completed, reps, weight_kg, logged_at",
        )
        .eq("client_id", row.client_id)
        .order("logged_at", { ascending: false })
        .limit(8);

      if (!active) return;
      setLogs((logRows as LogRow[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [planId, router]);

  async function persist(status?: "approved" | "changes_requested") {
    if (!plan) return null;
    return supabase
      .from("plans")
      .update({
        days,
        coach_notes: coachNotes || null,
        ...(status
          ? {
              status,
              approved_at:
                status === "approved" ? new Date().toISOString() : null,
            }
          : {}),
      })
      .eq("id", plan.id);
  }

  /**
   * While a plan is in 'awaiting_ai' the generator still owns it — it
   * overwrites `days` when it lands. Poll until it's done rather than let a
   * coach type into a draft that's about to be replaced.
   */
  useEffect(() => {
    if (!plan || plan.status !== "awaiting_ai") return;

    let active = true;
    const timer = setInterval(async () => {
      const { data } = await supabase
        .from("plans")
        .select(PLAN_COLUMNS)
        .eq("id", plan.id)
        .maybeSingle();

      if (!active || !data) return;
      const row = data as Plan;
      if (row.status !== "awaiting_ai") {
        setPlan(row);
        setDays(normalizeDays(row.days));
      }
    }, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [plan]);

  /** Escape hatch: take the plan off the generator and edit it now. */
  const handleWriteByHand = useCallback(async () => {
    if (!plan) return;
    const { error } = await supabase
      .from("plans")
      .update({ status: "pending", generated_by: "coach" })
      .eq("id", plan.id);
    if (!error) setPlan({ ...plan, status: "pending", generated_by: "coach" });
  }, [plan]);

  /**
   * Re-runs the generator over the same assessment. `force` is required
   * because generation is otherwise idempotent — it refuses to overwrite a
   * plan that has already left 'awaiting_ai', which is every plan a coach is
   * looking at here.
   */
  async function handleRegenerate() {
    if (!plan) return;
    setRegenerating(true);
    setRegenError(null);

    const { error } = await supabase.functions.invoke("generate-program", {
      body: { planId: plan.id, force: true },
    });

    if (error) {
      setRegenerating(false);
      setRegenError(error.message);
      return;
    }

    const { data } = await supabase
      .from("plans")
      .select(PLAN_COLUMNS)
      .eq("id", plan.id)
      .maybeSingle();

    setRegenerating(false);

    if (data) {
      const row = data as Plan;
      setPlan(row);
      setDays(normalizeDays(row.days));
      setSaved(false);
      if (row.generated_by !== "ai") {
        setRegenError(row.ai_report?.error ?? "The AI couldn't draft this one.");
      }
    }
  }

  async function handleSaveChanges() {
    setSaving(true);
    const result = await persist();
    setSaving(false);
    if (result && !result.error) setSaved(true);
  }

  async function handleDecision(status: "approved" | "changes_requested") {
    setSaving(true);
    const result = await persist(status);
    setSaving(false);
    if (result && !result.error) router.push("/admin/coach");
  }

  if (loading || !plan) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-ft-muted">Loading…</p>
      </div>
    );
  }

  const flaggedConditions = plan.medical_conditions.filter((c) => c !== "none");
  const isPending = plan.status === "pending";
  // Nothing is editable until the generator has handed the plan over.
  const processing = plan.status === "awaiting_ai";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-ft-bg pb-28 md:max-w-2xl">
      <header className="flex items-center gap-3 px-5 pt-6 md:px-0 md:pt-10">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => router.push("/admin/coach")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-ft-text md:text-xl">
          {processing ? "Processing" : isPending ? "Review Plan" : "Edit Plan"}
        </h1>
      </header>

      <div className="mx-5 mt-4 rounded-2xl border border-ft-border/70 bg-ft-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)] md:mx-0">
        <p className="font-semibold text-ft-text">{plan.full_name}</p>
        <p className="text-sm text-ft-muted">
          {plan.age ? `${plan.age} yrs · ` : ""}Goal:{" "}
          {GOAL_LABEL[plan.goal] ?? plan.goal}
        </p>
        {flaggedConditions.length > 0 && (
          <span className="mt-2 inline-flex items-center rounded-full bg-ft-danger/10 px-2.5 py-1 text-xs font-medium text-ft-danger">
            ⚠ {flaggedConditions.join(", ")}
          </span>
        )}
        {plan.medical_notes && (
          <p className="mt-2 text-sm text-ft-muted">{plan.medical_notes}</p>
        )}
      </div>

      <main className="flex-1 px-5 md:px-0">
        {processing ? (
          <PlanProcessing
            clientName={plan.full_name}
            onWriteByHand={handleWriteByHand}
            onRetry={handleRegenerate}
            retrying={regenerating}
            error={regenError ?? plan.ai_report?.error ?? null}
          />
        ) : (
          <>
            <PlanReportCard
              report={plan.ai_report}
              generatedBy={plan.generated_by}
              onRegenerate={handleRegenerate}
              regenerating={regenerating}
              error={regenError}
            />

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-ft-text">Workout</h2>
              <p className="mt-0.5 text-xs text-ft-muted">
                Add days, add exercises from the library or your own, and give
                each one up to three alternates the client can swap in.
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
                <h2 className="text-sm font-semibold text-ft-text">
                  Recent activity
                </h2>
                <ul className="mt-3 divide-y divide-ft-border rounded-2xl border border-ft-border/70 bg-ft-surface">
                  {logs.map((log, i) => (
                    <li key={`${log.logged_at}-${i}`} className="px-4 py-2.5">
                      <p className="text-sm text-ft-text">
                        {log.performed_name}
                        {log.is_alternate && (
                          <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-ft-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-ft-accent">
                            <Repeat2 className="size-3" />
                            swapped for {log.planned_name}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ft-muted">
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
              <label className="mb-2 block text-sm font-medium text-ft-text">
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
          </>
        )}
      </main>

      {!processing && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] items-center gap-3 border-t border-ft-border bg-ft-bg/95 px-5 py-4 backdrop-blur md:max-w-2xl md:px-0">
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
              <Button
                className="flex-1"
                disabled={saving}
                onClick={() => handleDecision("approved")}
              >
                Approve &amp; Send
              </Button>
            </>
          ) : (
            <>
              {saved && (
                <span className="text-sm text-ft-success">Saved</span>
              )}
              <Button
                className="ml-auto"
                disabled={saving}
                onClick={handleSaveChanges}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CoachReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-sm text-ft-muted">Loading…</p>
        </div>
      }
    >
      <CoachReviewContent />
    </Suspense>
  );
}
