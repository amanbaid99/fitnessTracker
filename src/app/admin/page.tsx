"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const ADMIN_SESSION_KEY = "nova_admin_session";

interface StaffProfile {
  id: string;
  full_name: string;
  active: boolean;
  assigned_coach_id: string | null;
}

interface PlanRow {
  id: string;
  client_id: string;
  full_name: string;
  goal: string;
  status: string;
  created_at: string;
}

const GOAL_LABEL: Record<string, string> = {
  "build-muscle": "Build muscle",
  "fat-loss": "Fat loss",
  "general-fitness": "General fitness",
};

function generatePassword() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `Coach-${suffix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function AdminPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  const [coachEmail, setCoachEmail] = useState("");
  const [coachPassword, setCoachPassword] = useState("");
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachSubmitting, setCoachSubmitting] = useState(false);

  // Forced password change on a coach's first login.
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [previousPassword, setPreviousPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSubmitting, setPasswordChangeSubmitting] = useState(false);

  const [coaches, setCoaches] = useState<StaffProfile[]>([]);
  const [clients, setClients] = useState<StaffProfile[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [panelError, setPanelError] = useState<string | null>(null);

  // New-coach form.
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachEmail, setNewCoachEmail] = useState("");
  const [newCoachPassword, setNewCoachPassword] = useState(() => generatePassword());
  const [creatingCoach, setCreatingCoach] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  // New-user (client) form.
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState(() => generatePassword());
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(
    null,
  );

  useEffect(() => {
    // Reading localStorage only after mount avoids a server/client
    // hydration mismatch, since it doesn't exist during static prerendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAdmin(localStorage.getItem(ADMIN_SESSION_KEY) === "true");
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    if (isAdmin) refreshLists();
  }, [isAdmin]);

  async function refreshLists() {
    const [{ data: coachRows }, { data: clientRows }, { data: planRows }] = await Promise.all([
      supabase.rpc("admin_list_profiles", { p_role: "coach" }),
      supabase.rpc("admin_list_profiles", { p_role: "client" }),
      supabase.rpc("admin_list_plans"),
    ]);
    setCoaches((coachRows as StaffProfile[]) ?? []);
    setClients((clientRows as StaffProfile[]) ?? []);
    setPlans((planRows as PlanRow[]) ?? []);
  }

  function handleAdminSubmit(e: FormEvent) {
    e.preventDefault();
    if (adminUsername === ADMIN_USERNAME && adminPassword === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_SESSION_KEY, "true");
      setAdminError(null);
      setIsAdmin(true);
    } else {
      setAdminError("Incorrect ID or password.");
    }
  }

  async function handleCoachSubmit(e: FormEvent) {
    e.preventDefault();
    setCoachError(null);
    setCoachSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: coachEmail.trim(),
      password: coachPassword,
    });

    if (error || !data.session) {
      setCoachError(error?.message ?? "Could not sign in. Check your details and try again.");
      setCoachSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active, must_change_password")
      .eq("id", data.session.user.id)
      .single();

    if (!profile || profile.role !== "coach" || profile.active === false) {
      await supabase.auth.signOut();
      setCoachError("These aren't valid coach credentials, or the account has been removed.");
      setCoachSubmitting(false);
      return;
    }

    setCoachSubmitting(false);

    if (profile.must_change_password) {
      setPreviousPassword(coachPassword);
      setForcePasswordChange(true);
      return;
    }

    router.push("/admin/coach");
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

    router.push("/admin/coach");
  }

  async function handleCreateCoach(e: FormEvent) {
    e.preventDefault();
    setPanelError(null);
    setCreated(null);

    if (newCoachPassword.length < 6) {
      setPanelError("Password must be at least 6 characters.");
      return;
    }

    setCreatingCoach(true);

    const email = newCoachEmail.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: newCoachPassword,
      options: { data: { full_name: newCoachName.trim() } },
    });

    if (error || !data.user) {
      setPanelError(error?.message ?? "Could not create the coach account.");
      setCreatingCoach(false);
      return;
    }

    const { error: promoteError } = await supabase.rpc("admin_promote_to_coach", {
      p_id: data.user.id,
    });

    // signUp() logs this browser in as the newly created coach — sign back
    // out immediately so the admin session isn't quietly replaced by it.
    await supabase.auth.signOut();
    setCreatingCoach(false);

    if (promoteError) {
      setPanelError(promoteError.message);
      return;
    }

    setCreated({ email, password: newCoachPassword });
    setNewCoachName("");
    setNewCoachEmail("");
    setNewCoachPassword(generatePassword());
    refreshLists();
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    setPanelError(null);
    setCreatedUser(null);

    if (newUserPassword.length < 6) {
      setPanelError("Password must be at least 6 characters.");
      return;
    }

    setCreatingUser(true);

    const email = newUserEmail.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: newUserPassword,
      options: { data: { full_name: newUserName.trim() } },
    });

    if (error || !data.user) {
      setPanelError(error?.message ?? "Could not create the user account.");
      setCreatingUser(false);
      return;
    }

    const { error: flagError } = await supabase.rpc("admin_flag_password_change", {
      p_id: data.user.id,
    });

    // signUp() logs this browser in as the newly created user — sign back
    // out immediately so the admin session isn't quietly replaced by it.
    await supabase.auth.signOut();
    setCreatingUser(false);

    if (flagError) {
      setPanelError(flagError.message);
      return;
    }

    setCreatedUser({ email, password: newUserPassword });
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword(generatePassword());
    refreshLists();
  }

  async function handleAssignCoach(clientId: string, coachId: string) {
    setPanelError(null);
    const { error } = await supabase.rpc("admin_assign_coach", {
      p_client_id: clientId,
      p_coach_id: coachId || null,
    });
    if (error) {
      setPanelError(error.message);
      return;
    }
    refreshLists();
  }

  async function toggleActive(id: string, active: boolean) {
    setPanelError(null);
    const { error } = await supabase.rpc("admin_set_active", { p_id: id, p_active: !active });
    if (error) {
      setPanelError(error.message);
      return;
    }
    refreshLists();
  }

  function handleAdminSignOut() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdmin(false);
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-nova-muted">Loading…</p>
      </div>
    );
  }

  if (forcePasswordChange) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12 md:max-w-md">
        <span className="mb-8 text-lg font-semibold tracking-tight text-nova-text">
          Nova Staff
        </span>
        <h1 className="text-2xl font-semibold text-nova-text">Set a new password</h1>
        <p className="mt-2 text-sm text-nova-muted">
          This is your first time logging in — choose a new password before continuing.
        </p>

        <form onSubmit={handleSetNewPassword} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-nova-text">
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
            <label className="mb-1.5 block text-sm font-medium text-nova-text">
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
            <p className="text-sm text-nova-danger">{passwordChangeError}</p>
          )}
          <Button type="submit" className="w-full" disabled={passwordChangeSubmitting}>
            {passwordChangeSubmitting ? "Saving…" : "Set password & continue"}
          </Button>
        </form>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12 md:max-w-md">
        <span className="mb-8 text-lg font-semibold tracking-tight text-nova-text">
          Nova Staff
        </span>

        <Tabs defaultValue="admin">
          <TabsList>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="coach">Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="mt-6">
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-nova-text">ID</label>
                <Input
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-nova-text">Password</label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
              {adminError && <p className="text-sm text-nova-danger">{adminError}</p>}
              <Button type="submit" className="w-full">
                Log in as admin
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="coach" className="mt-6">
            <form onSubmit={handleCoachSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-nova-text">
                  Coach ID
                </label>
                <Input
                  value={coachEmail}
                  onChange={(e) => setCoachEmail(e.target.value)}
                  placeholder="Given to you by your admin"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-nova-text">Password</label>
                <Input
                  type="password"
                  value={coachPassword}
                  onChange={(e) => setCoachPassword(e.target.value)}
                  required
                />
              </div>
              {coachError && <p className="text-sm text-nova-danger">{coachError}</p>}
              <Button type="submit" className="w-full" disabled={coachSubmitting}>
                {coachSubmitting ? "Logging in…" : "Log in as coach"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-nova-bg pb-16 md:max-w-3xl">
      <header className="flex items-center justify-between px-5 pt-6 md:px-0 md:pt-10">
        <div>
          <h1 className="text-xl font-semibold text-nova-text md:text-2xl">Admin</h1>
          <p className="mt-1 text-sm text-nova-muted">Manage coaches and clients.</p>
        </div>
        <button
          onClick={handleAdminSignOut}
          className="text-sm font-medium text-nova-muted hover:text-nova-text"
        >
          Sign out
        </button>
      </header>

      <main className="px-5 md:px-0">
        {clients.filter((c) => !c.assigned_coach_id && c.active).length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-nova-text">New Signups</h2>
            <p className="mt-0.5 text-xs text-nova-muted">
              These clients don&apos;t have a coach yet.
            </p>
            <div className="mt-3 space-y-2">
              {clients
                .filter((c) => !c.assigned_coach_id && c.active)
                .map((client) => (
                  <div
                    key={client.id}
                    className="flex flex-col gap-2 rounded-2xl border-l-4 border-nova-accent bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-nova-text">
                        {client.full_name || "(no name)"} just joined
                      </p>
                      <p className="text-xs text-nova-muted">Assign them a coach to get started.</p>
                    </div>
                    <select
                      defaultValue=""
                      onChange={(e) => e.target.value && handleAssignCoach(client.id, e.target.value)}
                      className="h-9 rounded-md border border-nova-accent bg-nova-surface px-2 text-sm font-medium text-nova-accent outline-none focus-visible:ring-2 focus-visible:ring-nova-accent"
                    >
                      <option value="" disabled>
                        Assign a coach
                      </option>
                      {coaches
                        .filter((coach) => coach.active)
                        .map((coach) => (
                          <option key={coach.id} value={coach.id}>
                            {coach.full_name || coach.id}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
            </div>
          </section>
        )}

        {plans.filter((p) => p.status === "pending").length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-nova-text">Pending Plans</h2>
            <p className="mt-0.5 text-xs text-nova-muted">
              You can review and approve these yourself if needed, instead of waiting on a coach.
            </p>
            <div className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
              {plans
                .filter((p) => p.status === "pending")
                .map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/admin/review?id=${plan.id}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-nova-accent/[0.03]"
                  >
                    <div>
                      <p className="text-sm font-medium text-nova-text">{plan.full_name}</p>
                      <p className="mt-0.5 text-xs text-nova-muted">
                        {GOAL_LABEL[plan.goal] ?? plan.goal} · Submitted {timeAgo(plan.created_at)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-nova-accent">
                      Review
                      <ChevronRight className="size-4" />
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-nova-text">Add a coach</h2>

          <form
            onSubmit={handleCreateCoach}
            className="mt-3 space-y-3 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)]"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-nova-text">Name</label>
              <Input
                value={newCoachName}
                onChange={(e) => setNewCoachName(e.target.value)}
                placeholder="Coach's full name"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-nova-text">Email</label>
              <Input
                type="email"
                value={newCoachEmail}
                onChange={(e) => setNewCoachEmail(e.target.value)}
                placeholder="coach@example.com"
                required
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-nova-text">
                  Password (editable)
                </label>
                <button
                  type="button"
                  onClick={() => setNewCoachPassword(generatePassword())}
                  className="text-xs font-medium text-nova-accent hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <Input
                value={newCoachPassword}
                onChange={(e) => setNewCoachPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-nova-muted">
                The coach will be asked to set their own password the first time they log in.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={creatingCoach}>
              {creatingCoach ? "Creating…" : "Create Coach"}
            </Button>
          </form>

          {created && (
            <div className="mt-3 rounded-2xl border border-nova-accent/30 bg-nova-accent/[0.04] p-4">
              <p className="text-sm font-medium text-nova-text">
                Coach account created — copy these now, they won&apos;t be shown again:
              </p>
              <div className="mt-2 space-y-1 font-mono text-sm text-nova-text">
                <p>ID: {created.email}</p>
                <p>Password: {created.password}</p>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `ID: ${created.email}\nPassword: ${created.password}`,
                  )
                }
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-nova-accent hover:underline"
              >
                <Copy className="size-3.5" />
                Copy
              </button>
            </div>
          )}

          {panelError && <p className="mt-3 text-sm text-nova-danger">{panelError}</p>}

          <h2 className="mt-6 text-sm font-semibold text-nova-text">Coaches</h2>
          <div className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
            {coaches.length === 0 && (
              <p className="px-4 py-3 text-sm text-nova-muted">No coaches yet.</p>
            )}
            {coaches.map((coach) => (
              <div key={coach.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-nova-text">
                    {coach.full_name || "(no name)"}
                  </p>
                  <p className="text-xs text-nova-muted">
                    {coach.active ? "Active" : "Removed"}
                  </p>
                </div>
                <Button
                  variant={coach.active ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleActive(coach.id, coach.active)}
                >
                  {coach.active ? "Remove" : "Restore"}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-nova-text">Add a user</h2>

          <form
            onSubmit={handleCreateUser}
            className="mt-3 space-y-3 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)]"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-nova-text">Name</label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="User's full name"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-nova-text">Email</label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-nova-text">
                  Password (editable)
                </label>
                <button
                  type="button"
                  onClick={() => setNewUserPassword(generatePassword())}
                  className="text-xs font-medium text-nova-accent hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <Input
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-nova-muted">
                The user will be asked to set their own password the first time they log in, then
                complete their intake form to get a plan.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={creatingUser}>
              {creatingUser ? "Creating…" : "Create User"}
            </Button>
          </form>

          {createdUser && (
            <div className="mt-3 rounded-2xl border border-nova-accent/30 bg-nova-accent/[0.04] p-4">
              <p className="text-sm font-medium text-nova-text">
                User account created — copy these now, they won&apos;t be shown again:
              </p>
              <div className="mt-2 space-y-1 font-mono text-sm text-nova-text">
                <p>ID: {createdUser.email}</p>
                <p>Password: {createdUser.password}</p>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `ID: ${createdUser.email}\nPassword: ${createdUser.password}`,
                  )
                }
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-nova-accent hover:underline"
              >
                <Copy className="size-3.5" />
                Copy
              </button>
            </div>
          )}

          <h2 className="mt-6 text-sm font-semibold text-nova-text">Clients</h2>
          <div className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
            {clients.length === 0 && (
              <p className="px-4 py-3 text-sm text-nova-muted">No clients yet.</p>
            )}
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-nova-text">
                    {client.full_name || "(no name)"}
                  </p>
                  <p className="text-xs text-nova-muted">
                    {client.active ? "Active" : "Removed"}
                  </p>
                </div>
                <select
                  value={client.assigned_coach_id ?? ""}
                  onChange={(e) => handleAssignCoach(client.id, e.target.value)}
                  className="h-9 rounded-md border border-nova-border bg-nova-surface px-2 text-sm text-nova-text outline-none focus-visible:ring-2 focus-visible:ring-nova-accent"
                >
                  <option value="">Unassigned</option>
                  {coaches
                    .filter((coach) => coach.active)
                    .map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.full_name || coach.id}
                      </option>
                    ))}
                </select>
                <Button
                  variant={client.active ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleActive(client.id, client.active)}
                >
                  {client.active ? "Remove" : "Restore"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
