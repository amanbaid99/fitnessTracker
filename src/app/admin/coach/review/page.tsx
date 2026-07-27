"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Repeat2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlanEditor } from "@/components/plan/PlanEditor";
import { supabase } from "@/lib/supabase";
import { normalizeDays, type PlanDay } from "@/lib/planTemplates";

const GOAL_LABEL: Record<string, string> = {
  "build-muscle": "Build muscle",
  "fat-loss": "Fat loss",
  "general-fitness": "General fitness",
};

/** What the generator wrote about this client, for the coach's eyes. */
interface AiReport {
  summary?: string;
  red_flags?: string[];
  considerations?: string[];
  open_questions?: string[];
  weekly_structure?: string;
  progression?: string;
  /** Present only when generation fell back — why it did. */
  error?: string;
}

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
        .select(
          "id, client_id, full_name, age, goal, medical_conditions, medical_notes, days, coach_notes, status, ai_report, generated_by",
        )
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
              approved_at: status === "approved" ? new Date().toISOString() : null,
            }
          : {}),
      })
      .eq("id", plan.id);
  }

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
      .select(
        "id, client_id, full_name, age, goal, medical_conditions, medical_notes, days, coach_notes, status, ai_report, generated_by",
      )
      .eq("id", plan.id)
      .maybeSingle();

    setRegenerating(false);

    if (data) {
      const row = data as Plan;
      setPlan(row);
      setDays(normalizeDays(row.days));
      setSaved(false);
      if (row.generated_by !== "ai") {
        setRegenError(row.ai_report?.error ?? "Nova couldn't draft this one.");
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
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  const flaggedConditions = plan.medical_conditions.filter((c) => c !== "none");
  // The generator's own error is worth showing even before the coach retries.
  const report = plan.ai_report;
  const isPending = plan.status === "pending";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-28 md:max-w-2xl">
      <header className="flex items-center gap-3 px-5 pt-6 md:px-0 md:pt-10">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => router.push("/admin/coach")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-nova-text md:text-xl">
          {isPending ? "Review Plan" : "Edit Plan"}
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
        <section className="mt-4 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-nova-text">
                <Sparkles className="size-4 text-nova-accent" />
                Nova&apos;s read
              </h2>
              <p className="mt-0.5 text-xs text-nova-muted">
                {plan.generated_by === "ai"
                  ? "A draft for you to edit — the client sees nothing until you publish."
                  : plan.generated_by === "fallback"
                    ? "Generation failed, so a template was loaded instead."
                    : "Nothing drafted yet."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={regenerating}
              onClick={handleRegenerate}
              className="shrink-0"
            >
              {regenerating ? "Drafting…" : "Regenerate"}
            </Button>
          </div>

          {(regenError ?? report?.error) && (
            <p className="mt-3 rounded-xl bg-nova-danger/[0.06] px-3 py-2 font-mono text-[11px] break-words text-nova-danger">
              {regenError ?? report?.error}
            </p>
          )}

          {report?.summary && <p className="mt-3 text-sm text-nova-text">{report.summary}</p>}

          {(report?.red_flags?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-nova-danger">Needs your decision</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-nova-text">
                {report!.red_flags!.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {(report?.considerations?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-nova-muted">Programmed around</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-nova-text">
                {report!.considerations!.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(report?.open_questions?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-nova-muted">Worth asking them</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-nova-text">
                {report!.open_questions!.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(report?.weekly_structure || report?.progression) && (
            <dl className="mt-3 space-y-1.5 border-t border-nova-border/70 pt-3 text-sm">
              {report.weekly_structure && (
                <div>
                  <dt className="text-xs font-semibold text-nova-muted">The week</dt>
                  <dd className="text-nova-text">{report.weekly_structure}</dd>
                </div>
              )}
              {report.progression && (
                <div>
                  <dt className="text-xs font-semibold text-nova-muted">Progression</dt>
                  <dd className="text-nova-text">{report.progression}</dd>
                </div>
              )}
            </dl>
          )}
        </section>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-nova-text">Workout</h2>
          <p className="mt-0.5 text-xs text-nova-muted">
            Add days, add exercises from the library or your own, and give each one up to three
            alternates the client can swap in.
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
