"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  Activity,
  Droplet,
  Wind,
  Bone,
  Footprints,
  Bandage,
  CircleOff,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { generatePlan, type Goal } from "@/lib/planTemplates";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CONDITIONS = [
  { id: "heart-disease", label: "Heart disease", icon: HeartPulse },
  { id: "high-blood-pressure", label: "High blood pressure", icon: Activity },
  { id: "diabetes", label: "Diabetes", icon: Droplet },
  { id: "asthma", label: "Asthma", icon: Wind },
  { id: "back-pain", label: "Back pain", icon: Bone },
  { id: "knee-pain", label: "Knee pain", icon: Footprints },
  { id: "recent-injury", label: "Recent injury", icon: Bandage },
  { id: "none", label: "None of the above", icon: CircleOff },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: "build-muscle", label: "Build muscle" },
  { value: "fat-loss", label: "Fat loss" },
  { value: "general-fitness", label: "General fitness" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState<Goal>("build-muscle");
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;

      if (!sessionData.session) {
        setCheckingSession(false);
        return;
      }

      // Already logged in — most likely an admin-created account logging in
      // for the first time. Skip the account fields and prefill the name,
      // since this is just the intake form for an account that already
      // exists.
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!active) return;

      setExistingUserId(sessionData.session.user.id);
      setFullName(profile?.full_name ?? "");
      setCheckingSession(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    let userId = existingUserId;

    if (!userId) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }

      if (!data.session || !data.user) {
        setError(
          "Account created — check your email to confirm it, then log in to see your plan.",
        );
        setSubmitting(false);
        return;
      }

      userId = data.user.id;
    }

    const days = generatePlan(goal, selected);

    const { error: insertError } = await supabase.from("plans").insert({
      client_id: userId,
      full_name: fullName,
      age: age ? Number(age) : null,
      goal,
      medical_conditions: selected,
      medical_notes: notes || null,
      days,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    router.push("/onboarding/review");
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-16 md:max-w-2xl">
      <header className="px-5 pt-6 md:px-0 md:pt-10">
        <Link href="/" className="text-lg font-semibold tracking-tight text-nova-text">
          Nova
        </Link>
        <h1 className="mt-4 text-2xl font-semibold leading-snug text-nova-text md:text-3xl">
          Let&apos;s build your plan
        </h1>
        <p className="mt-2 text-sm text-nova-muted">
          Create your account and tell us a bit about yourself — your coach will
          tailor a program from this.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 px-5 pt-8 md:px-0">
        {existingUserId ? (
          <section>
            <h2 className="text-sm font-semibold text-nova-text">Your name</h2>
            <div className="mt-3">
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
          </section>
        ) : (
          <section>
            <h2 className="text-sm font-semibold text-nova-text">Your account</h2>
            <div className="mt-3 space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-nova-text">
                  Full name
                </label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aman Baid"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-nova-text">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-nova-text">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-nova-text">Your goal</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-nova-text">
                Age
              </label>
              <Input
                id="age"
                type="number"
                min={13}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="28"
              />
            </div>
            <div>
              <label htmlFor="goal" className="mb-1.5 block text-sm font-medium text-nova-text">
                Primary goal
              </label>
              <select
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="flex h-11 w-full rounded-md border border-nova-border bg-nova-surface px-3 text-sm text-nova-text outline-none focus-visible:ring-2 focus-visible:ring-nova-accent"
              >
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-nova-text">
            Any medical history we should know about?
          </h2>
          <p className="mt-1 text-sm text-nova-muted">
            This helps your coach keep your training safe and effective.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {CONDITIONS.map(({ id, label, icon: Icon }) => {
              const isSelected = selected.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-2xl border bg-nova-surface p-4 text-left shadow-[0_1px_2px_rgba(28,30,38,0.04)] transition-colors",
                    isSelected
                      ? "border-nova-accent bg-nova-accent/[0.04] ring-1 ring-nova-accent"
                      : "border-nova-border/70",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5",
                      isSelected ? "text-nova-accent" : "text-nova-muted",
                    )}
                  />
                  <span className="text-sm font-medium text-nova-text">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label htmlFor="medical-notes" className="mb-2 block text-sm font-medium text-nova-text">
              Anything else? (optional)
            </label>
            <Textarea
              id="medical-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Medications, past surgeries, doctor restrictions..."
              rows={4}
            />
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-nova-muted">
            <Lock className="size-3.5" />
            Your data is private and only shared with your coach.
          </p>
        </section>

        {error && <p className="mt-6 text-sm text-nova-danger">{error}</p>}

        <Button type="submit" className="mt-8 w-full md:w-auto" disabled={submitting}>
          {submitting
            ? "Getting your plan started…"
            : existingUserId
              ? "Get my plan"
              : "Create account & get my plan"}
        </Button>

        {!existingUserId && (
          <p className="mt-4 text-sm text-nova-muted">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-nova-accent hover:underline">
              Log in
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
