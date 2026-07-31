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

  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [previousPassword, setPreviousPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSubmitting, setPasswordChangeSubmitting] = useState(false);

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
      .select("active, must_change_password")
      .eq("id", data.session.user.id)
      .single();

    if (profile?.active === false) {
      await supabase.auth.signOut();
      setError("This account has been deactivated.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    if (profile?.must_change_password) {
      setPreviousPassword(password);
      setForcePasswordChange(true);
      return;
    }

    router.push("/dashboard");
  }

  async function handleSetNewPassword(e: FormEvent) {
    e.preventDefault();
    setPasswordChangeError(null);

    if (newPassword.length < 6) {
      setPasswordChangeError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("Passwords don't match.");
      return;
    }
    if (newPassword === previousPassword) {
      setPasswordChangeError("New password must be different from your current password.");
      return;
    }

    setPasswordChangeSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setPasswordChangeError(updateError.message);
      setPasswordChangeSubmitting(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", sessionData.session.user.id);
    }

    router.push("/dashboard");
  }

  if (forcePasswordChange) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12 md:max-w-md">
        <Link href="/" className="mb-8 text-lg font-semibold tracking-tight text-ft-text">
          FitnessTracker
        </Link>
        <h1 className="text-2xl font-semibold text-ft-text">Set a new password</h1>
        <p className="mt-2 text-sm text-ft-muted">
          This is your first time logging in — choose a new password before continuing.
        </p>

        <form onSubmit={handleSetNewPassword} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ft-text">
              New password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ft-text">
              Confirm new password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {passwordChangeError && (
            <p className="text-sm text-ft-danger">{passwordChangeError}</p>
          )}
          <Button type="submit" className="w-full" disabled={passwordChangeSubmitting}>
            {passwordChangeSubmitting ? "Saving…" : "Set password & continue"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12 md:max-w-md">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight text-ft-text">
        FitnessTracker
      </Link>

      <h1 className="text-2xl font-semibold text-ft-text">Welcome back</h1>
      <p className="mt-2 text-sm text-ft-muted">
        Log in to see your plan and track today&apos;s workout.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ft-text">
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
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ft-text">
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

        {error && <p className="text-sm text-ft-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ft-muted">
        New to FitnessTracker?{" "}
        <Link href="/auth/register" className="font-medium text-ft-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
