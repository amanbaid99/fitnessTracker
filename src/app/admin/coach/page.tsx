"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, Plus } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { CoachClientsPanel } from "@/components/coach/ClientsPanel";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface PlanRow {
  id: string;
  client_id: string;
  full_name: string;
  goal: string;
  status: string;
  created_at: string;
  approved_at: string | null;
}

interface ClientProfile {
  id: string;
  full_name: string;
}

const GOAL_LABEL: Record<string, string> = {
  "build-muscle": "Build muscle",
  "fat-loss": "Fat loss",
  "general-fitness": "General fitness",
};

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState("Coach");
  const [pending, setPending] = useState<PlanRow[]>([]);
  const [approved, setApproved] = useState<PlanRow[]>([]);
  const [withoutPlan, setWithoutPlan] = useState<ClientProfile[]>([]);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Fetches everything the dashboard shows; returns null if not a coach. */
  const fetchDashboard = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace("/admin");
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, active")
      .eq("id", sessionData.session.user.id)
      .single();

    if (!profile || profile.role !== "coach" || profile.active === false) {
      await supabase.auth.signOut();
      router.replace("/admin");
      return null;
    }

    const coach = sessionData.session.user.id;

    const { data: assignedClients } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("assigned_coach_id", coach)
      .eq("active", true);

    const roster = (assignedClients as ClientProfile[]) ?? [];

    if (roster.length === 0) {
      return { coach, name: profile.full_name as string | null, rows: [] as PlanRow[], roster };
    }

    const { data: plans } = await supabase
      .from("plans")
      .select("id, client_id, full_name, goal, status, created_at, approved_at")
      .in(
        "client_id",
        roster.map((client) => client.id),
      )
      .order("created_at", { ascending: false });

    return {
      coach,
      name: profile.full_name as string | null,
      rows: (plans ?? []) as PlanRow[],
      roster,
    };
  }, [router]);

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchDashboard>>) => {
    if (!result) return;
    const clientsWithPlans = new Set(result.rows.map((plan) => plan.client_id));

    setCoachId(result.coach);
    setCoachName(result.name?.split(" ")[0] || "Coach");
    // 'awaiting_ai' belongs in the queue too: if generation failed, that plan
    // needs writing by hand, and it would otherwise be invisible to everyone.
    setPending(
      result.rows.filter((p) => p.status === "pending" || p.status === "awaiting_ai"),
    );
    setApproved(result.rows.filter((p) => p.status === "approved"));
    setWithoutPlan(result.roster.filter((client) => !clientsWithPlans.has(client.id)));
    setLoading(false);
  }, []);

  const reload = useCallback(async () => {
    apply(await fetchDashboard());
  }, [apply, fetchDashboard]);

  useEffect(() => {
    let active = true;

    async function load() {
      const result = await fetchDashboard();
      if (!active) return;
      apply(result);
    }

    load();
    return () => {
      active = false;
    };
  }, [apply, fetchDashboard]);

  /** Starts an empty program for a member who never filled in the intake form. */
  async function handleCreatePlan(clientId: string) {
    setError(null);
    setCreatingFor(clientId);

    const { data, error: createError } = await supabase.rpc("coach_create_plan", {
      p_client_id: clientId,
      p_goal: "general-fitness",
      p_days: [],
    });

    setCreatingFor(null);

    if (createError || !data) {
      setError(createError?.message ?? "Could not create the plan.");
      return;
    }

    router.push(`/admin/coach/review?id=${data as string}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-ft-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-ft-bg pb-24 md:pb-16">
      <BottomNav variant="coach" />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl lg:max-w-5xl">
        <header className="px-5 pt-6 md:px-0 md:pt-10">
          <h1 className="text-xl font-semibold text-ft-text md:text-2xl">Hi, {coachName} 👋</h1>
          <p className="mt-1 text-sm text-ft-muted">
            {pending.length === 0
              ? "No plans need your review right now"
              : `${pending.length} plan${pending.length === 1 ? "" : "s"} need your review`}
          </p>
        </header>

        <main className="px-5 md:px-0">
          {error && <p className="mt-4 text-sm text-ft-danger">{error}</p>}

          <div className="mt-6 lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <section>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-ft-text">Pending Review</h2>
                  {pending.length > 0 && (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-ft-warning/15 text-xs font-semibold text-ft-warning">
                      {pending.length}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-3">
                  {pending.length === 0 && (
                    <p className="text-sm text-ft-muted">You&apos;re all caught up.</p>
                  )}
                  {pending.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/admin/coach/review?id=${plan.id}`}
                      className="flex items-center justify-between rounded-2xl border-l-4 border-ft-warning bg-ft-surface p-4 transition-colors hover:bg-ft-accent/[0.03]"
                    >
                      <div>
                        <p className="text-sm font-medium text-ft-text">{plan.full_name}</p>
                        <p className="mt-0.5 text-xs text-ft-muted">
                          {plan.status === "awaiting_ai"
                            ? "Still being analysed"
                            : GOAL_LABEL[plan.goal] ?? plan.goal}{" "}
                          · Submitted {timeAgo(plan.created_at)}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-ft-accent">
                        Review
                        <ChevronRight className="size-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              {withoutPlan.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-sm font-semibold text-ft-text">Needs a program</h2>
                  <p className="mt-0.5 text-xs text-ft-muted">
                    Assigned to you, but no plan built yet.
                  </p>
                  <div className="mt-3 divide-y divide-ft-border rounded-2xl border border-ft-border/70 bg-ft-surface">
                    {withoutPlan.map((client) => (
                      <div key={client.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ft-accent/10 text-xs font-semibold text-ft-accent">
                          {initials(client.full_name)}
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ft-text">
                          {client.full_name || "(no name)"}
                        </p>
                        <Button
                          size="sm"
                          disabled={creatingFor === client.id}
                          onClick={() => handleCreatePlan(client.id)}
                        >
                          <Plus className="size-3.5" />
                          {creatingFor === client.id ? "Creating…" : "Build plan"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-8">
                <h2 className="text-sm font-semibold text-ft-text">Active Clients</h2>
                <p className="mt-0.5 text-xs text-ft-muted">
                  Open a client to add workouts, swap exercises, or set alternates.
                </p>
                <div className="mt-3 divide-y divide-ft-border rounded-2xl border border-ft-border/70 bg-ft-surface">
                  {approved.length === 0 && (
                    <p className="px-4 py-3 text-sm text-ft-muted">No approved clients yet.</p>
                  )}
                  {approved.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/admin/coach/review?id=${plan.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ft-accent/[0.03]"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ft-accent/10 text-xs font-semibold text-ft-accent">
                        {initials(plan.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ft-text">
                          {plan.full_name}
                        </p>
                        <p className="text-xs text-ft-muted">
                          {GOAL_LABEL[plan.goal] ?? plan.goal}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-ft-accent">
                        <Pencil className="size-3.5" />
                        Edit
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-8 lg:col-span-1 lg:mt-0">
              {coachId && <CoachClientsPanel coachId={coachId} onRosterChange={reload} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
