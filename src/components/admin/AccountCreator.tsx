"use client";

import { useState, type FormEvent } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { PLAN_PRESETS } from "@/lib/planPresets";
import type { PlanDay } from "@/lib/planTemplates";

export interface StaffProfile {
  id: string;
  full_name: string;
  active: boolean;
  assigned_coach_id: string | null;
  must_change_password?: boolean;
  email?: string | null;
  created_at?: string;
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
  /**
   * Coach context: put the new member straight onto the signed-in coach's
   * roster, and keep that coach signed in afterwards.
   */
  claimForSignedInCoach?: boolean;
  /** Saved templates offered alongside the built-in splits. */
  templates?: { id: string; name: string; days: PlanDay[] | null }[];
}

/**
 * Creates a coach or member account and shows the credentials once.
 *
 * Account creation goes through the normal browser sign-up call, which logs
 * this tab in as the new account. The admin panel's own login isn't a
 * Supabase session, so there it just signs back out; a coach, though, has a
 * real session to put back — hence the capture-and-restore below.
 */
export function AccountCreator({
  role,
  coaches = [],
  onCreated,
  claimForSignedInCoach = false,
  templates = [],
}: AccountCreatorProps) {
  const isCoach = role === "coach";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generatePassword(isCoach ? "Coach" : "Member"));
  const [coachId, setCoachId] = useState("");
  // "" = let them choose, "preset:<id>" or "template:<uuid>" = assign now.
  const [startingPlan, setStartingPlan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  /** Resolves the picked starting plan to days, or null for "decide later". */
  function startingPlanDays(): PlanDay[] | null {
    if (startingPlan.startsWith("preset:")) {
      const preset = PLAN_PRESETS.find((p) => p.id === startingPlan.slice("preset:".length));
      return preset ? preset.days : null;
    }
    if (startingPlan.startsWith("template:")) {
      const template = templates.find((t) => t.id === startingPlan.slice("template:".length));
      return template?.days?.length ? template.days : null;
    }
    return null;
  }

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

    // Captured before sign-up replaces the session with the new account's.
    const { data: sessionData } = await supabase.auth.getSession();
    const priorSession = sessionData.session;

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

    // Restore whoever was signed in before touching anything that depends on
    // auth.uid() — coach_claim_client assigns to the *calling* coach, so it
    // has to run as the coach and not as the account just created.
    if (priorSession) {
      await supabase.auth.setSession({
        access_token: priorSession.access_token,
        refresh_token: priorSession.refresh_token,
      });
    } else {
      await supabase.auth.signOut();
    }

    if (!isCoach) {
      if (claimForSignedInCoach) {
        await supabase.rpc("coach_claim_client", { p_client_id: data.user.id });
      } else if (coachId) {
        await supabase.rpc("admin_assign_coach", {
          p_client_id: data.user.id,
          p_coach_id: coachId,
        });
      }

      const days = startingPlanDays();
      if (days) {
        // Approved on creation: staff picked it deliberately, so there's
        // nothing left to review.
        const rpc = claimForSignedInCoach ? "coach_create_plan" : "admin_create_plan";
        const { error: planError } = await supabase.rpc(rpc, {
          p_client_id: data.user.id,
          p_goal: "general-fitness",
          p_days: days,
          p_status: "approved",
          p_preset_id: startingPlan.startsWith("preset:")
            ? startingPlan.slice("preset:".length)
            : null,
        });
        if (planError) setError(planError.message);
      }
    }

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
    setStartingPlan("");
    setPassword(generatePassword(isCoach ? "Coach" : "Member"));
    onCreated();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ft-text">Full name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCoach ? "Coach's full name" : "Member's full name"}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ft-text">Email</span>
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
            <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-ft-text">
              Temporary password
              <button
                type="button"
                onClick={() => setPassword(generatePassword(isCoach ? "Coach" : "Member"))}
                className="flex items-center gap-1 text-xs font-medium text-ft-accent hover:underline"
              >
                <RefreshCw className="size-3" />
                New
              </button>
            </span>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {!isCoach && !claimForSignedInCoach && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ft-text">
                Assign a coach <span className="text-ft-muted">(optional)</span>
              </span>
              <select
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-ft-border bg-ft-surface px-3 text-sm text-ft-text outline-none focus-visible:ring-2 focus-visible:ring-ft-accent"
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

        {!isCoach && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ft-text">
              Starting plan <span className="text-ft-muted">(optional)</span>
            </span>
            <select
              value={startingPlan}
              onChange={(e) => setStartingPlan(e.target.value)}
              className="flex h-11 w-full rounded-md border border-ft-border bg-ft-surface px-3 text-sm text-ft-text outline-none focus-visible:ring-2 focus-visible:ring-ft-accent"
            >
              <option value="">Let them choose</option>
              <optgroup label="Built-in splits">
                {PLAN_PRESETS.map((preset) => (
                  <option key={preset.id} value={`preset:${preset.id}`}>
                    {preset.name} · {preset.daysPerWeek} days
                  </option>
                ))}
              </optgroup>
              {templates.length > 0 && (
                <optgroup label="Templates">
                  {templates.map((template) => (
                    <option key={template.id} value={`template:${template.id}`}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        )}

        <p className="text-xs text-ft-muted">
          {claimForSignedInCoach && "They'll be added to your clients. "}
          They&apos;ll be asked to set their own password the first time they log in
          {isCoach ? "." : ", then fill in their intake form to get a plan."}
        </p>

        {error && <p className="text-sm text-ft-danger">{error}</p>}

        <Button type="submit" disabled={busy}>
          {busy ? "Creating…" : isCoach ? "Create coach" : "Create member"}
        </Button>
      </form>

      {created && (
        <div className="mt-4 rounded-2xl border border-ft-success/30 bg-ft-success/[0.05] p-4">
          <p className="text-sm font-medium text-ft-text">
            Account created — copy these now, they won&apos;t be shown again.
          </p>
          <div className="mt-2 space-y-0.5 font-mono text-sm text-ft-text">
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
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ft-accent hover:underline"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy credentials"}
          </button>
        </div>
      )}
    </div>
  );
}
