"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/** The pipeline from the workflow doc, so the wait feels like progress. */
const STAGES = [
  { title: "Assessment submitted", done: true },
  { title: "Nova AI preparing your programme", done: false },
  { title: "Coach reviews and approves", done: false },
  { title: "Programme published to your dashboard", done: false },
];

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

      <h1 className="mt-8 text-2xl font-semibold text-nova-text">Assessment received</h1>
      <p className="mt-3 text-sm leading-relaxed text-nova-muted">
        Thank you for completing your assessment. Nova AI is analysing your information and
        preparing your personalised training programme.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-nova-muted">
        Your coach will carefully review the programme before it is published. Your workout
        plan will be available within the next 24 hours.
      </p>

      <ol className="mt-8 w-full space-y-3 text-left">
        {STAGES.map((stage, i) => (
          <li key={stage.title} className="flex items-center gap-3">
            <span
              className={
                stage.done
                  ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-nova-success text-white"
                  : "flex size-7 shrink-0 items-center justify-center rounded-full bg-nova-surface text-xs font-semibold text-nova-muted ring-1 ring-nova-border"
              }
            >
              {stage.done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={stage.done ? "text-sm font-medium text-nova-text" : "text-sm text-nova-muted"}>
              {stage.title}
            </span>
          </li>
        ))}
      </ol>

      <Link
        href="/dashboard/messages"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-nova-accent hover:underline"
      >
        Got a question? Message your coach
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
