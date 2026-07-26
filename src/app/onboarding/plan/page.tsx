"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Sparkles, UserCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ExerciseArt } from "@/components/exercise/ExerciseArt";
import { PLAN_PRESETS, type PlanPreset } from "@/lib/planPresets";
import type { ExperienceLevel, Goal } from "@/lib/planTemplates";

interface ProfileRow {
  full_name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  experience_level: ExperienceLevel | null;
  goal: Goal | null;
}

function PresetCard({
  preset,
  busy,
  onChoose,
}: {
  preset: PlanPreset;
  busy: boolean;
  onChoose: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]",
        preset.recommended ? "border-nova-accent ring-1 ring-nova-accent" : "border-nova-border/70",
      )}
    >
      <div className="p-4">
        {preset.recommended && (
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-nova-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            <Sparkles className="size-3" />
            Recommended
          </span>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-nova-text">{preset.name}</h3>
            <p className="mt-0.5 text-xs font-medium text-nova-accent">
              {preset.daysPerWeek} days a week · {preset.bestFor}
            </p>
          </div>
          <ExerciseArt
            name={preset.days[0]?.exercises[0]?.name ?? "Workout"}
            exerciseId={preset.days[0]?.exercises[0]?.exerciseId}
            size="md"
          />
        </div>

        <p className="mt-2 text-sm text-nova-muted">{preset.tagline}</p>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2.5 flex items-center gap-1 text-xs font-medium text-nova-accent"
        >
          {open ? "Hide the sessions" : "See the sessions"}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <ul className="mt-2.5 space-y-2 rounded-xl bg-nova-bg p-3">
            {preset.days.map((day) => (
              <li key={day.id}>
                <p className="text-xs font-semibold text-nova-text">{day.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-nova-muted">
                  {day.exercises.map((exercise) => exercise.name).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Button className="mt-4 w-full" disabled={busy} onClick={onChoose}>
          {busy ? "Setting up…" : `Start ${preset.name}`}
        </Button>
      </div>
    </div>
  );
}

export default function ChoosePlanPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/register");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, age, height_cm, weight_kg, experience_level, goal")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!active) return;

      // Details are step 1 — bounce back if they've been skipped.
      if (!data?.goal) {
        router.replace("/onboarding/details");
        return;
      }

      setUserId(sessionData.session.user.id);
      setProfile(data as ProfileRow);
      setChecking(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  /**
   * Free tier: a chosen plan is approved on the spot so training can start
   * now. Only the coach-built path waits for review.
   */
  async function createPlan(options: {
    presetId: string | null;
    days: PlanPreset["days"];
    goTo: string;
  }) {
    if (!userId || !profile) return;
    setError(null);
    setBusyId(options.presetId ?? "custom");

    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("plans").insert({
      client_id: userId,
      full_name: profile.full_name,
      age: profile.age,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      experience_level: profile.experience_level,
      goal: profile.goal,
      medical_conditions: [],
      preset_id: options.presetId,
      days: options.days,
      status: "approved",
      approved_at: now,
    });

    setBusyId(null);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(options.goTo);
  }

  if (checking || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-12 pt-8 md:max-w-2xl md:px-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-nova-accent">Step 2 of 2</p>
      <h1 className="mt-1.5 text-2xl font-semibold leading-snug text-nova-text">
        Pick how you want to train
      </h1>
      <p className="mt-2 text-sm text-nova-muted">
        Start free with a proven split — you can switch or edit it any time.
      </p>

      {error && <p className="mt-4 text-sm text-nova-danger">{error}</p>}

      <div className="mt-6 space-y-3">
        {PLAN_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            busy={busyId === preset.id}
            onChoose={() =>
              createPlan({ presetId: preset.id, days: preset.days, goTo: "/dashboard" })
            }
          />
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-nova-text">Rather do it your way?</h2>
        <button
          type="button"
          disabled={busyId !== null}
          onClick={() =>
            createPlan({ presetId: null, days: [], goTo: "/dashboard/plan-builder" })
          }
          className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 text-left transition-colors hover:border-nova-accent/40 disabled:opacity-60"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-nova-bg text-nova-muted">
            <Wrench className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-nova-text">Build my own plan</span>
            <span className="block text-xs text-nova-muted">
              Choose your days and pick every exercise yourself.
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-nova-accent" />
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-nova-accent/30 bg-nova-accent/[0.04] p-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-nova-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-nova-accent">
          Personal training
        </span>
        <h2 className="mt-2 flex items-center gap-2 text-sm font-semibold text-nova-text">
          <UserCheck className="size-4 text-nova-accent" />
          Want a coach to build it for you?
        </h2>
        <ul className="mt-2 space-y-1 text-xs text-nova-muted">
          <li className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-nova-accent" />
            A real coach writes your program around your goals and history
          </li>
          <li className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-nova-accent" />
            Adjusted for injuries, equipment and the days you can train
          </li>
          <li className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-nova-accent" />
            Reviewed and updated as you progress
          </li>
        </ul>
        <Button
          variant="outline"
          className="mt-3 w-full border-nova-accent text-nova-accent"
          onClick={() => router.push("/onboarding/coach-request")}
        >
          Tell us about you
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
