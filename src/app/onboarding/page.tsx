"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Entry point for onboarding — kept as a router so older links (and the
 * dashboard's "no plan yet" redirect) land people in the right step:
 *
 *   no account      → register
 *   no details yet  → details
 *   details, no plan → pick a plan
 *   plan exists     → dashboard (or the waiting screen if a coach has it)
 */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function route() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/register");
        return;
      }

      const userId = sessionData.session.user.id;

      const [{ data: profile }, { data: plan }] = await Promise.all([
        supabase.from("profiles").select("goal").eq("id", userId).single(),
        supabase
          .from("plans")
          .select("status")
          .eq("client_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (plan) {
        router.replace(plan.status === "approved" ? "/dashboard" : "/onboarding/review");
        return;
      }

      router.replace(profile?.goal ? "/onboarding/plan" : "/onboarding/details");
    }

    route();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-nova-muted">Getting you set up…</p>
    </div>
  );
}
