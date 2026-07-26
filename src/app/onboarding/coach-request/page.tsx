"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bandage,
  Bone,
  CircleOff,
  Droplet,
  Dumbbell,
  Footprints,
  HeartPulse,
  Home,
  Lock,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generatePlan, type ExperienceLevel, type Goal } from "@/lib/planTemplates";

const CONDITIONS = [
  { id: "heart-disease", label: "Heart disease", icon: HeartPulse },
  { id: "high-blood-pressure", label: "High BP", icon: HeartPulse },
  { id: "diabetes", label: "Diabetes", icon: Droplet },
  { id: "asthma", label: "Asthma", icon: Wind },
  { id: "back-pain", label: "Back pain", icon: Bone },
  { id: "knee-pain", label: "Knee pain", icon: Footprints },
  { id: "recent-injury", label: "Recent injury", icon: Bandage },
  { id: "none", label: "None", icon: CircleOff },
];

const TRAINS_AT = [
  { id: "gym", label: "Full gym", icon: Dumbbell },
  { id: "home", label: "Home", icon: Home },
];

const DAY_OPTIONS = [2, 3, 4, 5, 6];

/**
 * The extra intake a coach needs before writing a program. Kept behind the
 * "want a coach?" choice so self-serve members never see it.
 */
export default function CoachRequestPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    full_name: string;
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    experience_level: ExperienceLevel | null;
    goal: Goal | null;
  } | null>(null);

  const [conditions, setConditions] = useState<string[]>([]);
  const [trainsAt, setTrainsAt] = useState("gym");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [injuries, setInjuries] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

      if (!data?.goal) {
        router.replace("/onboarding/details");
        return;
      }

      setUserId(sessionData.session.user.id);
      setProfile(data);
      setChecking(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  function toggleCondition(id: string) {
    setConditions((prev) => {
      if (id === "none") return prev.includes("none") ? [] : ["none"];
      const next = prev.filter((c) => c !== "none");
      return next.includes(id) ? next.filter((c) => c !== id) : [...next, id];
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId || !profile) return;

    setError(null);
    setSubmitting(true);

    // A generated plan gives the coach a starting point to edit rather than a
    // blank page; it stays unapproved until they've been through it.
    const starter = generatePlan(
      profile.goal ?? "general-fitness",
      conditions,
      profile.experience_level ?? "beginner",
    );

    const { error: insertError } = await supabase.from("plans").insert({
      client_id: userId,
      full_name: profile.full_name,
      age: profile.age,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      experience_level: profile.experience_level,
      goal: profile.goal,
      medical_conditions: conditions,
      medical_notes: injuries || null,
      wants_coach: true,
      intake: { trains_at: trainsAt, days_per_week: daysPerWeek, injuries, notes },
      days: starter,
      status: "pending",
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/onboarding/review");
  }

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-12 pt-6 md:max-w-lg md:px-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => router.push("/onboarding/plan")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <p className="text-xs font-semibold uppercase tracking-wide text-nova-accent">
          Coach-built plan
        </p>
      </div>

      <h1 className="mt-2 text-2xl font-semibold leading-snug text-nova-text">
        Tell your coach about you
      </h1>
      <p className="mt-2 text-sm text-nova-muted">
        The more they know, the better your program fits.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex-1">
        <fieldset>
          <legend className="text-sm font-semibold text-nova-text">Where do you train?</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {TRAINS_AT.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTrainsAt(id)}
                aria-pressed={trainsAt === id}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border bg-nova-surface p-3.5 text-left transition-colors",
                  trainsAt === id
                    ? "border-nova-accent ring-1 ring-nova-accent"
                    : "border-nova-border/70",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    trainsAt === id ? "text-nova-accent" : "text-nova-muted",
                  )}
                />
                <span className="text-sm font-medium text-nova-text">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-semibold text-nova-text">
            How many days a week can you train?
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {DAY_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setDaysPerWeek(count)}
                aria-pressed={daysPerWeek === count}
                className={cn(
                  "min-w-14 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  daysPerWeek === count
                    ? "bg-nova-accent text-white"
                    : "bg-nova-surface text-nova-muted ring-1 ring-nova-border",
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-semibold text-nova-text">
            Anything medical we should know?
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {CONDITIONS.map(({ id, label, icon: Icon }) => {
              const selected = conditions.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCondition(id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border bg-nova-surface px-3 py-2.5 text-left transition-colors",
                    selected ? "border-nova-accent ring-1 ring-nova-accent" : "border-nova-border/70",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      selected ? "text-nova-accent" : "text-nova-muted",
                    )}
                  />
                  <span className="truncate text-xs font-medium text-nova-text">{label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-7 block">
          <span className="text-sm font-semibold text-nova-text">
            Injuries or movements to avoid
          </span>
          <Textarea
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            placeholder="Left shoulder hurts on overhead pressing…"
            rows={3}
            className="mt-2"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-nova-text">
            Anything else? <span className="font-normal text-nova-muted">(optional)</span>
          </span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Training for a wedding in June, can only train early mornings…"
            rows={3}
            className="mt-2"
          />
        </label>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-nova-muted">
          <Lock className="size-3.5" />
          Only your coach sees this.
        </p>

        {error && <p className="mt-4 text-sm text-nova-danger">{error}</p>}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Request my plan"}
        </Button>
      </form>
    </div>
  );
}
