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

      const { data: plan } = await supabase
        .from("plans")
        .select("status")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      // A published plan means training; anything else is still with the
      // coach, and no plan at all means the assessment hasn't been sent.
      router.replace(
        plan ? (plan.status === "approved" ? "/dashboard" : "/onboarding/review") : "/onboarding/assessment",
      );
    }

    route();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-ft-muted">Getting you set up…</p>
    </div>
  );
}
