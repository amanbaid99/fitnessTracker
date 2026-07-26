"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Flame, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExperienceLevel, Goal } from "@/lib/planTemplates";

const GOALS: { value: Goal; label: string; hint: string; icon: typeof Dumbbell }[] = [
  { value: "build-muscle", label: "Build muscle", hint: "Get bigger and stronger", icon: Dumbbell },
  { value: "fat-loss", label: "Lose fat", hint: "Lean out, keep strength", icon: Flame },
  {
    value: "general-fitness",
    label: "Stay healthy",
    hint: "Feel good, move well",
    icon: HeartPulse,
  },
];

const LEVELS: { value: ExperienceLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "New, or back after a long break" },
  { value: "intermediate", label: "Intermediate", hint: "Training 6+ months" },
  { value: "advanced", label: "Advanced", hint: "Years under the bar" },
];

/** Step 2 of sign-up: the few facts a plan actually needs. */
export default function OnboardingDetailsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [goal, setGoal] = useState<Goal>("build-muscle");
  const [experience, setExperience] = useState<ExperienceLevel>("beginner");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/register");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, age, height_cm, weight_kg, experience_level, goal")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!active) return;

      if (profile) {
        setFirstName((profile.full_name ?? "").split(" ")[0] ?? "");
        if (profile.age) setAge(String(profile.age));
        if (profile.height_cm) setHeightCm(String(profile.height_cm));
        if (profile.weight_kg) setWeightKg(String(profile.weight_kg));
        if (profile.experience_level) setExperience(profile.experience_level as ExperienceLevel);
        if (profile.goal) setGoal(profile.goal as Goal);
      }

      setChecking(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace("/auth/login");
      return;
    }

    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        age: age ? Number(age) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        experience_level: experience,
        goal,
        details_completed_at: new Date().toISOString(),
      })
      .eq("id", sessionData.session.user.id);

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    router.push("/onboarding/plan");
  }

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-10 pt-8 md:max-w-lg md:px-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-nova-accent">Step 1 of 2</p>
      <h1 className="mt-1.5 text-2xl font-semibold leading-snug text-nova-text">
        {firstName ? `Nice to meet you, ${firstName}` : "A few quick details"}
      </h1>
      <p className="mt-2 text-sm text-nova-muted">
        This shapes your plan. You can change any of it later.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex-1">
        <fieldset>
          <legend className="text-sm font-semibold text-nova-text">
            What are you training for?
          </legend>
          <div className="mt-3 space-y-2">
            {GOALS.map(({ value, label, hint, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setGoal(value)}
                aria-pressed={goal === value}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border bg-nova-surface p-4 text-left transition-colors",
                  goal === value
                    ? "border-nova-accent ring-1 ring-nova-accent"
                    : "border-nova-border/70",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    goal === value
                      ? "bg-nova-accent/10 text-nova-accent"
                      : "bg-nova-bg text-nova-muted",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-nova-text">{label}</span>
                  <span className="block text-xs text-nova-muted">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-semibold text-nova-text">
            How much training have you done?
          </legend>
          <div className="mt-3 space-y-2">
            {LEVELS.map(({ value, label, hint }) => (
              <button
                key={value}
                type="button"
                onClick={() => setExperience(value)}
                aria-pressed={experience === value}
                className={cn(
                  "flex w-full items-baseline gap-2 rounded-2xl border bg-nova-surface px-4 py-3 text-left transition-colors",
                  experience === value
                    ? "border-nova-accent ring-1 ring-nova-accent"
                    : "border-nova-border/70",
                )}
              >
                <span className="text-sm font-medium text-nova-text">{label}</span>
                <span className="text-xs text-nova-muted">{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-semibold text-nova-text">
            Your numbers <span className="font-normal text-nova-muted">(optional)</span>
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-nova-muted">Age</span>
              <Input
                type="number"
                inputMode="numeric"
                min={13}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="28"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-nova-muted">Height (cm)</span>
              <Input
                type="number"
                inputMode="numeric"
                min={100}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-nova-muted">Weight (kg)</span>
              <Input
                type="number"
                inputMode="decimal"
                min={30}
                max={300}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="70"
              />
            </label>
          </div>
        </fieldset>

        {error && <p className="mt-5 text-sm text-nova-danger">{error}</p>}

        <Button type="submit" size="lg" className="mt-8 w-full" disabled={saving}>
          {saving ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
