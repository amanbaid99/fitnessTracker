"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export default function PlanUnderReviewPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "pending" | "none">("loading");

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/login");
        return;
      }

      const { data: plan } = await supabase
        .from("plans")
        .select("status")
        .eq("client_id", sessionData.session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (!plan) {
        router.replace("/onboarding");
        return;
      }

      if (plan.status === "approved") {
        router.replace("/dashboard");
        return;
      }

      setStatus("pending");
    }

    check();
    return () => {
      active = false;
    };
  }, [router]);

  if (status !== "pending") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-6 py-12 text-center md:max-w-xl">
      <div className="relative flex size-24 items-center justify-center">
        <span className="absolute inset-0 animate-pulse rounded-full border-2 border-nova-accent/40" />
        <span className="absolute inset-3 animate-pulse rounded-full border-2 border-nova-accent/70 [animation-delay:150ms]" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-nova-accent">
          <Check className="size-7 text-white" />
        </div>
      </div>

      <h1 className="mt-8 text-2xl font-semibold text-nova-text">
        Your plan is being crafted
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-nova-muted">
        Your coach is reviewing your profile and personalising your program.
        This usually takes 24–48 hours. We&apos;ll notify you the moment
        it&apos;s ready.
      </p>

      <div className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 text-left shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-nova-accent/10 text-sm font-semibold text-nova-accent">
          NC
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-nova-text">
            Assigned to your Nova coach
          </p>
          <Badge className="mt-1.5">ACSM Certified</Badge>
        </div>
      </div>

      <a
        href="#"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-nova-accent hover:underline"
      >
        Got a question? Ask your coach
        <ArrowRight className="size-4" />
      </a>
    </div>
  );
}
