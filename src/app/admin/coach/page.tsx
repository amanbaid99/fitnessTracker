"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { UserManagementSection } from "@/components/shared/UserManagementSection";
import { supabase } from "@/lib/supabase";

interface PlanRow {
  id: string;
  full_name: string;
  goal: string;
  status: string;
  created_at: string;
  approved_at: string | null;
}

const GOAL_LABEL: Record<string, string> = {
  "build-muscle": "Build muscle",
  "fat-loss": "Fat loss",
  "general-fitness": "General fitness",
};

function initials(name: string) {
  return name
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
  const [coachName, setCoachName] = useState("Coach");
  const [pending, setPending] = useState<PlanRow[]>([]);
  const [approved, setApproved] = useState<PlanRow[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/admin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, active")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!active) return;

      if (!profile || profile.role !== "coach") {
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }

      if (profile.active === false) {
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }

      setCoachName(profile.full_name?.split(" ")[0] || "Coach");

      const { data: plans } = await supabase
        .from("plans")
        .select("id, full_name, goal, status, created_at, approved_at")
        .order("created_at", { ascending: false });

      if (!active) return;

      const rows = (plans ?? []) as PlanRow[];
      setPending(rows.filter((p) => p.status === "pending"));
      setApproved(rows.filter((p) => p.status === "approved"));
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

  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-24 md:pb-16">
      <BottomNav variant="coach" />

      <div className="mx-auto w-full max-w-[430px] flex-1 md:max-w-2xl lg:max-w-5xl">
        <header className="px-5 pt-6 md:px-0 md:pt-10">
          <h1 className="text-xl font-semibold text-nova-text md:text-2xl">
            Hi, {coachName} 👋
          </h1>
          <p className="mt-1 text-sm text-nova-muted">
            {pending.length === 0
              ? "No plans need your review right now"
              : `${pending.length} plan${pending.length === 1 ? "" : "s"} need your review`}
          </p>
        </header>

        <main className="px-5 md:px-0">
          <div className="mt-6 lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <section>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-nova-text">
                    Pending Review
                  </h2>
                  {pending.length > 0 && (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-nova-warning/15 text-xs font-semibold text-nova-warning">
                      {pending.length}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-3">
                  {pending.length === 0 && (
                    <p className="text-sm text-nova-muted">
                      You&apos;re all caught up.
                    </p>
                  )}
                  {pending.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/admin/coach/review?id=${plan.id}`}
                      className="flex items-center justify-between rounded-2xl border-l-4 border-nova-warning bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)] transition-colors hover:bg-nova-accent/[0.03]"
                    >
                      <div>
                        <p className="text-sm font-medium text-nova-text">
                          {plan.full_name}
                        </p>
                        <p className="mt-0.5 text-xs text-nova-muted">
                          {GOAL_LABEL[plan.goal] ?? plan.goal} · Submitted{" "}
                          {timeAgo(plan.created_at)}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-nova-accent">
                        Review
                        <ChevronRight className="size-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-sm font-semibold text-nova-text">
                  Active Clients
                </h2>
                <div className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
                  {approved.length === 0 && (
                    <p className="px-4 py-3 text-sm text-nova-muted">
                      No approved clients yet.
                    </p>
                  )}
                  {approved.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nova-accent/10 text-xs font-semibold text-nova-accent">
                        {initials(plan.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-nova-text">
                          {plan.full_name}
                        </p>
                        <p className="text-xs text-nova-muted">
                          {GOAL_LABEL[plan.goal] ?? plan.goal}
                        </p>
                      </div>
                      <span className="size-2.5 shrink-0 rounded-full bg-nova-success" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-1">
              <UserManagementSection role="client" title="Manage Clients" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
