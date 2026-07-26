"use client";

import { useState, type FormEvent } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export interface StaffProfile {
  id: string;
  full_name: string;
  active: boolean;
  assigned_coach_id: string | null;
}

function generatePassword(prefix: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${suffix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

interface AccountCreatorProps {
  role: "coach" | "client";
  /** Offered as an optional "assign straight away" step for new members. */
  coaches?: StaffProfile[];
  onCreated: () => void;
}

/**
 * Creates a coach or member account and shows the credentials once.
 *
 * Account creation goes through the normal browser sign-up call, which logs
 * this tab in as the new account — so it signs straight back out to leave the
 * admin session intact.
 */
export function AccountCreator({ role, coaches = [], onCreated }: AccountCreatorProps) {
  const isCoach = role === "coach";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generatePassword(isCoach ? "Coach" : "Nova"));
  const [coachId, setCoachId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    const trimmedEmail = email.trim();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { full_name: name.trim() } },
    });

    if (signUpError || !data.user) {
      setBusy(false);
      setError(signUpError?.message ?? `Could not create the ${role} account.`);
      return;
    }

    const { error: roleError } = isCoach
      ? await supabase.rpc("admin_promote_to_coach", { p_id: data.user.id })
      : await supabase.rpc("admin_flag_password_change", { p_id: data.user.id });

    if (!isCoach && coachId) {
      await supabase.rpc("admin_assign_coach", {
        p_client_id: data.user.id,
        p_coach_id: coachId,
      });
    }

    await supabase.auth.signOut();
    setBusy(false);

    if (roleError) {
      setError(roleError.message);
      return;
    }

    setCreated({ email: trimmedEmail, password });
    setCopied(false);
    setName("");
    setEmail("");
    setCoachId("");
    setPassword(generatePassword(isCoach ? "Coach" : "Nova"));
    onCreated();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-nova-text">Full name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCoach ? "Coach's full name" : "Member's full name"}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-nova-text">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isCoach ? "coach@example.com" : "member@example.com"}
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-nova-text">
              Temporary password
              <button
                type="button"
                onClick={() => setPassword(generatePassword(isCoach ? "Coach" : "Nova"))}
                className="flex items-center gap-1 text-xs font-medium text-nova-accent hover:underline"
              >
                <RefreshCw className="size-3" />
                New
              </button>
            </span>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {!isCoach && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-nova-text">
                Assign a coach <span className="text-nova-muted">(optional)</span>
              </span>
              <select
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-nova-border bg-nova-surface px-3 text-sm text-nova-text outline-none focus-visible:ring-2 focus-visible:ring-nova-accent"
              >
                <option value="">Decide later</option>
                {coaches
                  .filter((coach) => coach.active)
                  .map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.full_name || coach.id}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>

        <p className="text-xs text-nova-muted">
          They&apos;ll be asked to set their own password the first time they log in
          {isCoach ? "." : ", then fill in their intake form to get a plan."}
        </p>

        {error && <p className="text-sm text-nova-danger">{error}</p>}

        <Button type="submit" disabled={busy}>
          {busy ? "Creating…" : isCoach ? "Create coach" : "Create member"}
        </Button>
      </form>

      {created && (
        <div className="mt-4 rounded-2xl border border-nova-success/30 bg-nova-success/[0.05] p-4">
          <p className="text-sm font-medium text-nova-text">
            Account created — copy these now, they won&apos;t be shown again.
          </p>
          <div className="mt-2 space-y-0.5 font-mono text-sm text-nova-text">
            <p>ID: {created.email}</p>
            <p>Password: {created.password}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(
                `ID: ${created.email}\nPassword: ${created.password}`,
              );
              setCopied(true);
            }}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-nova-accent hover:underline"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy credentials"}
          </button>
        </div>
      )}
    </div>
  );
}
