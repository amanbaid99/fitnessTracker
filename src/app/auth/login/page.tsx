"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.session) {
      setError(signInError?.message ?? "Could not sign in. Check your details and try again.");
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .single();

    router.push(profile?.role === "coach" || profile?.role === "admin" ? "/coach" : "/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12 md:max-w-md">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight text-nova-text">
        Nova
      </Link>

      <h1 className="text-2xl font-semibold text-nova-text">Welcome back</h1>
      <p className="mt-2 text-sm text-nova-muted">
        Log in to see your plan and track today&apos;s workout.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-nova-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-nova-muted">
        New to Nova?{" "}
        <Link href="/onboarding" className="font-medium text-nova-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
