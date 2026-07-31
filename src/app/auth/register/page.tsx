"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Sign-up is deliberately four fields. Everything else — goals, measurements,
 * which split to run — is asked after the account exists, so an abandoned
 * form doesn't cost the person their registration.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // Projects with email confirmation on return a user but no session.
    if (!data.session) {
      setNotice("Check your email to confirm your account, then log in to continue.");
      setSubmitting(false);
      return;
    }

    router.push("/onboarding/assessment");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12 md:max-w-md">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight text-ft-text">
        FitnessTracker
      </Link>

      <h1 className="text-2xl font-semibold text-ft-text">Create your account</h1>
      <p className="mt-2 text-sm text-ft-muted">
        Then a short assessment, and your coach builds your programme around it.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ft-text">First name</span>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              placeholder="Aman"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ft-text">Last name</span>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              placeholder="Baid"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ft-text">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ft-text">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            placeholder="At least 6 characters"
            required
          />
        </label>

        {error && <p className="text-sm text-ft-danger">{error}</p>}
        {notice && <p className="text-sm text-ft-success">{notice}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating your account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ft-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-ft-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
