"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/marketing/AuthShell";
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
      <AuthShell
        title="Set a new password"
        intro="This is your first time logging in — choose a password only you know before continuing."
        aside={{
          src: "/images/auth-panel.jpg",
          quote: "Every programme here is read and approved by an ACSM-certified coach.",
        }}
      >
        <form onSubmit={handleSetNewPassword} className="space-y-4">
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
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      intro="Pick up where you left off — your plan, your numbers, your coach."
      footer={
        <>
          New here?{" "}
          <Link href="/auth/register" className="font-medium text-ft-text underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

    </AuthShell>
  );
}
