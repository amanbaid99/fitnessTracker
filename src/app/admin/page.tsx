"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generatePlan, type Goal } from "@/lib/planTemplates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatTile } from "@/components/admin/StatTile";
import {
  AccountCreator,
  type StaffProfile,
} from "@/components/admin/AccountCreator";
import { CoachRow } from "@/components/admin/CoachRow";
import { AccountEditor } from "@/components/admin/AccountEditor";
import {
  TemplateWorkshop,
  type WorkoutTemplate,
} from "@/components/plan/TemplateWorkshop";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const ADMIN_SESSION_KEY = "ft_admin_session";

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

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-ft-warning/10 text-ft-warning",
  approved: "bg-ft-success/10 text-ft-success",
  changes_requested: "bg-ft-danger/10 text-ft-danger",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting review",
  approved: "Active",
  changes_requested: "Changes requested",
};

type Section =
  | "overview"
  | "members"
  | "coaches"
  | "assignments"
  | "plans"
  | "templates";

const SECTIONS: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "members", label: "Members", icon: Users },
  { id: "coaches", label: "Coaches", icon: ShieldCheck },
  { id: "assignments", label: "Assignments", icon: Link2 },
  { id: "plans", label: "Plans", icon: ClipboardCheck },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
];

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ft-accent/10 text-xs font-semibold text-ft-accent">
      {initials(name)}
    </span>
  );
}

/** How a new client's first programme gets drafted. */
type GenerationMode = "ai" | "static";

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ft-border/70 bg-ft-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ft-border/70 px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-ft-text">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-ft-muted">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-ft-border px-4 py-6 text-center text-sm text-ft-muted">
      {children}
    </p>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState<Section>("overview");

  // Staff login (admin is a hardcoded local session; coaches use Supabase).
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [coachEmail, setCoachEmail] = useState("");
  const [coachPassword, setCoachPassword] = useState("");
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachSubmitting, setCoachSubmitting] = useState(false);

  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [previousPassword, setPreviousPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(
    null,
  );
  const [passwordChangeSubmitting, setPasswordChangeSubmitting] =
    useState(false);

  // Console data.
  const [coaches, setCoaches] = useState<StaffProfile[]>([]);
  const [clients, setClients] = useState<StaffProfile[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [creatingDummy, setCreatingDummy] = useState(false);

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState<
    "all" | "unassigned" | "removed"
  >("all");
  const [planFilter, setPlanFilter] = useState<"pending" | "approved" | "all">(
    "pending",
  );
  const [generationMode, setGenerationMode] = useState<GenerationMode>("ai");
  const [selectedForAssign, setSelectedForAssign] = useState<string[]>([]);
  const [bulkCoachId, setBulkCoachId] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  useEffect(() => {
    // localStorage only exists after mount — reading it during the static
    // prerender would cause a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAdmin(localStorage.getItem(ADMIN_SESSION_KEY) === "true");
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    if (isAdmin) refreshLists();
  }, [isAdmin]);

  async function refreshLists() {
    const [
      { data: coachRows },
      { data: clientRows },
      { data: planRows },
      { data: templateRows },
      { data: mode },
    ] = await Promise.all([
      supabase.rpc("admin_list_staff", { p_role: "coach" }),
      supabase.rpc("admin_list_staff", { p_role: "client" }),
      supabase.rpc("admin_list_plans"),
      supabase.rpc("admin_list_templates"),
      supabase.rpc("admin_get_setting", { p_key: "generation_mode" }),
    ]);
    setCoaches((coachRows as StaffProfile[]) ?? []);
    setClients((clientRows as StaffProfile[]) ?? []);
    setPlans((planRows as PlanRow[]) ?? []);
    setTemplates((templateRows as WorkoutTemplate[]) ?? []);
    setGenerationMode(mode === "static" ? "static" : "ai");
  }

  async function handleGenerationMode(next: GenerationMode) {
    const previous = generationMode;
    setGenerationMode(next); // optimistic — the switch should feel instant
    const { error } = await supabase.rpc("admin_set_setting", {
      p_key: "generation_mode",
      p_value: next,
    });
    if (error) {
      setGenerationMode(previous);
      setPanelError(error.message);
    }
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
      setCoachError(
        error?.message ??
          "Could not sign in. Check your details and try again.",
      );
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
      setCoachError(
        "These aren't valid coach credentials, or the account has been removed.",
      );
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
      setPasswordChangeError(
        "New password must be different from your current password.",
      );
      return;
    }

    setPasswordChangeSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
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

  // Spins up a fake member with a submitted plan, for trying the assign and
  // review flows without filling in the intake form by hand.
  async function handleCreateDummyUser() {
    setPanelError(null);
    setCreatingDummy(true);

    const suffix = Math.random().toString(36).slice(2, 8);
    const name = `Test User ${suffix}`;
    const email = `test-${suffix}@fitnesstracker.local`;
    const dummyPassword = `FT-${suffix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const goals: Goal[] = ["build-muscle", "fat-loss", "general-fitness"];
    const goal = goals[Math.floor(Math.random() * goals.length)];

    const { data, error } = await supabase.auth.signUp({
      email,
      password: dummyPassword,
      options: { data: { full_name: name } },
    });

    if (error || !data.user) {
      setPanelError(error?.message ?? "Could not create the dummy user.");
      setCreatingDummy(false);
      return;
    }

    const { error: insertError } = await supabase.from("plans").insert({
      client_id: data.user.id,
      full_name: name,
      age: 25 + Math.floor(Math.random() * 20),
      height_cm: 160 + Math.floor(Math.random() * 30),
      weight_kg: 60 + Math.floor(Math.random() * 40),
      experience_level: "intermediate",
      goal,
      medical_conditions: [],
      medical_notes: null,
      days: generatePlan(goal, [], "intermediate"),
      status: "pending",
    });

    await supabase.auth.signOut();
    setCreatingDummy(false);

    if (insertError) {
      setPanelError(insertError.message);
      return;
    }

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

  async function handleBulkAssign() {
    if (!bulkCoachId || selectedForAssign.length === 0) return;
    setPanelError(null);

    const results = await Promise.all(
      selectedForAssign.map((clientId) =>
        supabase.rpc("admin_assign_coach", {
          p_client_id: clientId,
          p_coach_id: bulkCoachId,
        }),
      ),
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) setPanelError(failed.error.message);

    setSelectedForAssign([]);
    setBulkCoachId("");
    refreshLists();
  }

  async function toggleActive(id: string, active: boolean) {
    setPanelError(null);
    const { error } = await supabase.rpc("admin_set_active", {
      p_id: id,
      p_active: !active,
    });
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

  const coachById = useMemo(
    () => new Map(coaches.map((coach) => [coach.id, coach])),
    [coaches],
  );

  /** Newest plan per member — that's the one worth showing and reviewing. */
  const planByClient = useMemo(() => {
    const map = new Map<string, PlanRow>();
    for (const plan of plans) {
      if (!map.has(plan.client_id)) map.set(plan.client_id, plan);
    }
    return map;
  }, [plans]);

  const activeCoaches = coaches.filter((coach) => coach.active);
  const activeClients = clients.filter((client) => client.active);
  const unassigned = activeClients.filter(
    (client) => !client.assigned_coach_id,
  );
  // A plan still waiting on generation needs a human just as much as one the
  // AI drafted, so both sit under "pending".
  const pendingPlans = plans.filter(
    (plan) => plan.status === "pending" || plan.status === "awaiting_ai",
  );

  const visibleMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    return clients
      .filter((client) => {
        if (memberFilter === "removed") return !client.active;
        if (memberFilter === "unassigned")
          return client.active && !client.assigned_coach_id;
        return client.active;
      })
      .filter(
        (client) =>
          !query || (client.full_name || "").toLowerCase().includes(query),
      );
  }, [clients, memberFilter, memberQuery]);

  const visiblePlans = useMemo(
    () =>
      planFilter === "all"
        ? plans
        : planFilter === "pending"
          ? pendingPlans
          : plans.filter((plan) => plan.status === planFilter),
    [plans, pendingPlans, planFilter],
  );

  if (checkingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-ft-muted">Loading…</p>
      </div>
    );
  }

  if (forcePasswordChange) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12 md:max-w-md">
        <span className="mb-8 text-lg font-semibold tracking-tight text-ft-text">
          FitnessTracker Staff
        </span>
        <h1 className="text-2xl font-semibold text-ft-text">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-ft-muted">
          This is your first time logging in — choose a new password before
          continuing.
        </p>

        <form onSubmit={handleSetNewPassword} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ft-text">
              New password
            </span>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ft-text">
              Confirm new password
            </span>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {passwordChangeError && (
            <p className="text-sm text-ft-danger">{passwordChangeError}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={passwordChangeSubmitting}
          >
            {passwordChangeSubmitting ? "Saving…" : "Set password & continue"}
          </Button>
        </form>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12 md:max-w-md">
        <span className="mb-8 text-lg font-semibold tracking-tight text-ft-text">
          FitnessTracker Staff
        </span>

        <Tabs defaultValue="admin">
          <TabsList>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="coach">Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="mt-6">
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ft-text">
                  ID
                </span>
                <Input
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ft-text">
                  Password
                </span>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </label>
              {adminError && (
                <p className="text-sm text-ft-danger">{adminError}</p>
              )}
              <Button type="submit" className="w-full">
                Log in as admin
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="coach" className="mt-6">
            <form onSubmit={handleCoachSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ft-text">
                  Coach ID
                </span>
                <Input
                  value={coachEmail}
                  onChange={(e) => setCoachEmail(e.target.value)}
                  placeholder="Given to you by your admin"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ft-text">
                  Password
                </span>
                <Input
                  type="password"
                  value={coachPassword}
                  onChange={(e) => setCoachPassword(e.target.value)}
                  required
                />
              </label>
              {coachError && (
                <p className="text-sm text-ft-danger">{coachError}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={coachSubmitting}
              >
                {coachSubmitting ? "Logging in…" : "Log in as coach"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ft-bg">
      <header className="sticky top-0 z-40 border-b border-ft-border bg-ft-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-ft-text">
              FitnessTracker Admin
            </p>
            <p className="truncate text-xs text-ft-muted">
              {activeClients.length} member
              {activeClients.length === 1 ? "" : "s"} · {activeCoaches.length}{" "}
              coach{activeCoaches.length === 1 ? "" : "es"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/coach">Coach view</Link>
            </Button>
            <button
              onClick={handleAdminSignOut}
              className="text-sm font-medium text-ft-muted hover:text-ft-text"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:grid md:grid-cols-[188px_1fr] md:gap-8">
        {/* Section nav: sidebar on desktop, scrollable pills on mobile. */}
        <nav className="-mx-5 mb-5 overflow-x-auto px-5 md:mx-0 md:mb-0 md:overflow-visible md:px-0">
          <ul className="flex gap-1.5 md:sticky md:top-24 md:flex-col">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = section === id;
              const badge =
                id === "plans"
                  ? pendingPlans.length
                  : id === "assignments"
                    ? unassigned.length
                    : 0;
              return (
                <li key={id} className="shrink-0 md:w-full">
                  <button
                    type="button"
                    onClick={() => setSection(id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-ft-ink text-white"
                        : "text-ft-muted hover:bg-ft-surface hover:text-ft-text",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                    {badge > 0 && (
                      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-ft-warning/15 px-1.5 text-xs font-semibold text-ft-warning">
                        {badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="space-y-5">
          {panelError && (
            <p className="rounded-xl border border-ft-danger/30 bg-ft-danger/[0.05] px-4 py-2.5 text-sm text-ft-danger">
              {panelError}
            </p>
          )}

          {section === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                  icon={Users}
                  label="Members"
                  value={activeClients.length}
                  hint="Members"
                  onClick={() => setSection("members")}
                />
                <StatTile
                  icon={ShieldCheck}
                  label="Coaches"
                  value={activeCoaches.length}
                  hint="Coaches"
                  onClick={() => setSection("coaches")}
                />
                <StatTile
                  icon={ClipboardCheck}
                  label="Awaiting review"
                  value={pendingPlans.length}
                  hint="To review"
                  tone={pendingPlans.length > 0 ? "warning" : "success"}
                  onClick={() => setSection("plans")}
                />
                <StatTile
                  icon={Link2}
                  label="Unassigned"
                  value={unassigned.length}
                  hint="No coach yet"
                  tone={unassigned.length > 0 ? "warning" : "success"}
                  onClick={() => setSection("assignments")}
                />
              </div>

              <SectionCard
                title="Needs attention"
                description="Everything waiting on you, in one place."
              >
                {unassigned.length === 0 && pendingPlans.length === 0 ? (
                  <p className="flex items-center gap-2 rounded-xl bg-ft-success/[0.06] px-4 py-4 text-sm text-ft-success">
                    <CheckCircle2 className="size-4" />
                    All clear — nothing needs your attention.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {unassigned.map((client) => (
                      <li
                        key={client.id}
                        className="flex flex-col gap-2 rounded-xl border border-ft-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={client.full_name} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ft-text">
                              {client.full_name || "(no name)"}
                            </p>
                            <p className="text-xs text-ft-muted">
                              Needs a coach
                            </p>
                          </div>
                        </div>
                        <select
                          defaultValue=""
                          onChange={(e) =>
                            e.target.value &&
                            handleAssignCoach(client.id, e.target.value)
                          }
                          className="h-9 shrink-0 rounded-md border border-ft-accent bg-ft-surface px-2 text-sm font-medium text-ft-accent outline-none focus-visible:ring-2 focus-visible:ring-ft-accent"
                        >
                          <option value="" disabled>
                            Assign a coach
                          </option>
                          {activeCoaches.map((coach) => (
                            <option key={coach.id} value={coach.id}>
                              {coach.full_name || coach.id}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}

                    {pendingPlans.map((plan) => (
                      <li key={plan.id}>
                        <Link
                          href={`/admin/review?id=${plan.id}`}
                          className="flex items-center justify-between rounded-xl border border-ft-border/70 p-3 transition-colors hover:border-ft-accent/40 hover:bg-ft-accent/[0.03]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={plan.full_name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ft-text">
                                {plan.full_name}
                              </p>
                              <p className="text-xs text-ft-muted">
                                {GOAL_LABEL[plan.goal] ?? plan.goal} · submitted{" "}
                                {timeAgo(plan.created_at)}
                              </p>
                            </div>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-ft-accent">
                            Review
                            <ArrowRight className="size-4" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Quick actions">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSection("members");
                      setShowMemberForm(true);
                    }}
                  >
                    <UserPlus className="size-3.5" />
                    Add member
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSection("coaches");
                      setShowCoachForm(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add coach
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCreateDummyUser}
                    disabled={creatingDummy}
                  >
                    <Wand2 className="size-3.5" />
                    {creatingDummy ? "Creating…" : "Add test member"}
                  </Button>
                </div>
              </SectionCard>
            </>
          )}

          {section === "members" && (
            <>
              <SectionCard
                title="Members"
                description="Everyone training at the gym."
                action={
                  <Button
                    size="sm"
                    variant={showMemberForm ? "outline" : "default"}
                    onClick={() => setShowMemberForm((v) => !v)}
                  >
                    {showMemberForm ? (
                      <X className="size-3.5" />
                    ) : (
                      <UserPlus className="size-3.5" />
                    )}
                    {showMemberForm ? "Close" : "Add member"}
                  </Button>
                }
              >
                {showMemberForm && (
                  <div className="mb-4 rounded-xl border border-ft-border/70 bg-ft-bg p-4">
                    <AccountCreator
                      role="client"
                      coaches={coaches}
                      templates={templates}
                      onCreated={() => refreshLists()}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ft-muted" />
                    <input
                      value={memberQuery}
                      onChange={(e) => setMemberQuery(e.target.value)}
                      placeholder="Search members"
                      className="flex h-10 w-full rounded-xl border border-ft-border bg-ft-surface pl-9 pr-3 text-sm text-ft-text outline-none placeholder:text-ft-muted focus-visible:ring-2 focus-visible:ring-ft-accent"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {(["all", "unassigned", "removed"] as const).map(
                      (filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setMemberFilter(filter)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                            memberFilter === filter
                              ? "bg-ft-accent text-white"
                              : "bg-ft-bg text-ft-muted ring-1 ring-ft-border hover:text-ft-text",
                          )}
                        >
                          {filter}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {visibleMembers.length === 0 && (
                    <EmptyState>No members here yet.</EmptyState>
                  )}

                  {visibleMembers.map((client) => {
                    const plan = planByClient.get(client.id);
                    const assignedCoach = client.assigned_coach_id
                      ? coachById.get(client.assigned_coach_id)
                      : undefined;
                    const editing = editingMemberId === client.id;

                    return (
                      <div
                        key={client.id}
                        className="rounded-xl border border-ft-border/70 p-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar name={client.full_name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ft-text">
                                {client.full_name || "(no name)"}
                              </p>
                              <p className="flex items-center gap-1.5 overflow-hidden text-xs text-ft-muted [&>span]:whitespace-nowrap">
                                {plan ? (
                                  <span
                                    className={cn(
                                      "rounded-full px-1.5 py-0.5 font-medium",
                                      STATUS_STYLE[plan.status] ?? "bg-ft-bg",
                                    )}
                                  >
                                    {STATUS_LABEL[plan.status] ?? plan.status}
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-ft-bg px-1.5 py-0.5">
                                    No plan yet
                                  </span>
                                )}
                                <span>
                                  ·{" "}
                                  {assignedCoach
                                    ? `Coach ${assignedCoach.full_name || "(no name)"}`
                                    : "No coach"}
                                </span>
                                {!client.active && <span>· Removed</span>}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                            <select
                              value={client.assigned_coach_id ?? ""}
                              onChange={(e) =>
                                handleAssignCoach(client.id, e.target.value)
                              }
                              aria-label={`Coach for ${client.full_name || "member"}`}
                              className="h-9 rounded-md border border-ft-border bg-ft-surface px-2 text-sm text-ft-text outline-none focus-visible:ring-2 focus-visible:ring-ft-accent"
                            >
                              <option value="">— No coach —</option>
                              {activeCoaches.map((coach) => (
                                <option key={coach.id} value={coach.id}>
                                  {assignedCoach?.id === coach.id
                                    ? "Coach: "
                                    : "Move to: "}
                                  {coach.full_name || coach.id}
                                </option>
                              ))}
                            </select>

                            {client.assigned_coach_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignCoach(client.id, "")}
                              >
                                Unassign
                              </Button>
                            )}

                            {plan && (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/review?id=${plan.id}`}>
                                  {plan.status === "pending"
                                    ? "Review"
                                    : "Edit plan"}
                                </Link>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingMemberId(editing ? null : client.id)
                              }
                            >
                              Edit
                            </Button>

                            <Button
                              variant={client.active ? "ghost" : "default"}
                              size="sm"
                              onClick={() =>
                                toggleActive(client.id, client.active)
                              }
                            >
                              {client.active ? "Remove" : "Restore"}
                            </Button>
                          </div>
                        </div>

                        {editing && (
                          <div className="mt-3 border-t border-ft-border/70 pt-3">
                            <AccountEditor
                              account={client}
                              mode="admin"
                              onSaved={refreshLists}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </>
          )}

          {section === "coaches" && (
            <SectionCard
              title="Coaches"
              description="Staff who build and approve plans."
              action={
                <Button
                  size="sm"
                  variant={showCoachForm ? "outline" : "default"}
                  onClick={() => setShowCoachForm((v) => !v)}
                >
                  {showCoachForm ? (
                    <X className="size-3.5" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  {showCoachForm ? "Close" : "Add coach"}
                </Button>
              }
            >
              {showCoachForm && (
                <div className="mb-4 rounded-xl border border-ft-border/70 bg-ft-bg p-4">
                  <AccountCreator
                    role="coach"
                    onCreated={() => refreshLists()}
                  />
                </div>
              )}

              <div className="space-y-2">
                {coaches.length === 0 && (
                  <EmptyState>No coaches yet.</EmptyState>
                )}

                {coaches.map((coach) => (
                  <CoachRow
                    key={coach.id}
                    coach={coach}
                    clientCount={
                      clients.filter(
                        (client) =>
                          client.assigned_coach_id === coach.id &&
                          client.active,
                      ).length
                    }
                    onChanged={refreshLists}
                    onToggleActive={() => toggleActive(coach.id, coach.active)}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {section === "assignments" && (
            <>
              <SectionCard
                title="Unassigned members"
                description="Pick members, then assign them to a coach in one go."
              >
                {unassigned.length === 0 ? (
                  <p className="flex items-center gap-2 rounded-xl bg-ft-success/[0.06] px-4 py-4 text-sm text-ft-success">
                    <CheckCircle2 className="size-4" />
                    Every member has a coach.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {unassigned.map((client) => {
                        const checked = selectedForAssign.includes(client.id);
                        return (
                          <li key={client.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                                checked
                                  ? "border-ft-accent bg-ft-accent/[0.04]"
                                  : "border-ft-border/70 hover:bg-ft-bg",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setSelectedForAssign((prev) =>
                                    e.target.checked
                                      ? [...prev, client.id]
                                      : prev.filter((id) => id !== client.id),
                                  )
                                }
                                className="size-4 accent-[var(--ft-accent)]"
                              />
                              <Avatar name={client.full_name} />
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ft-text">
                                {client.full_name || "(no name)"}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-ft-bg p-3">
                      <span className="text-sm text-ft-muted">
                        {selectedForAssign.length} selected
                      </span>
                      <select
                        value={bulkCoachId}
                        onChange={(e) => setBulkCoachId(e.target.value)}
                        className="h-9 rounded-md border border-ft-border bg-ft-surface px-2 text-sm text-ft-text outline-none focus-visible:ring-2 focus-visible:ring-ft-accent"
                      >
                        <option value="">Choose a coach…</option>
                        {activeCoaches.map((coach) => (
                          <option key={coach.id} value={coach.id}>
                            {coach.full_name || coach.id}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={
                          !bulkCoachId || selectedForAssign.length === 0
                        }
                        onClick={handleBulkAssign}
                      >
                        Assign
                      </Button>
                    </div>
                  </>
                )}
              </SectionCard>

              <SectionCard
                title="Coach rosters"
                description="Who's training with whom."
              >
                {activeCoaches.length === 0 ? (
                  <EmptyState>
                    Add a coach first, then you can allocate members.
                  </EmptyState>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeCoaches.map((coach) => {
                      const roster = clients.filter(
                        (client) =>
                          client.assigned_coach_id === coach.id &&
                          client.active,
                      );
                      return (
                        <div
                          key={coach.id}
                          className="rounded-xl border border-ft-border/70 p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar name={coach.full_name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ft-text">
                                {coach.full_name || "(no name)"}
                              </p>
                              <p className="text-xs text-ft-muted">
                                {roster.length} member
                                {roster.length === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>

                          <ul className="mt-2.5 space-y-1">
                            {roster.length === 0 && (
                              <li className="text-xs text-ft-muted">
                                No members yet.
                              </li>
                            )}
                            {roster.map((client) => (
                              <li
                                key={client.id}
                                className="flex items-center gap-2 rounded-lg bg-ft-bg px-2.5 py-1.5"
                              >
                                <span className="min-w-0 flex-1 truncate text-sm text-ft-text">
                                  {client.full_name || "(no name)"}
                                </span>
                                {activeCoaches.length > 1 && (
                                  <select
                                    value=""
                                    aria-label={`Move ${client.full_name || "member"} to another coach`}
                                    onChange={(e) =>
                                      e.target.value &&
                                      handleAssignCoach(
                                        client.id,
                                        e.target.value,
                                      )
                                    }
                                    className="h-7 shrink-0 rounded-md border border-ft-border bg-ft-surface px-1.5 text-xs text-ft-muted outline-none focus-visible:ring-2 focus-visible:ring-ft-accent"
                                  >
                                    <option value="">Move…</option>
                                    {activeCoaches
                                      .filter((other) => other.id !== coach.id)
                                      .map((other) => (
                                        <option key={other.id} value={other.id}>
                                          {other.full_name || other.id}
                                        </option>
                                      ))}
                                  </select>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAssignCoach(client.id, "")
                                  }
                                  className="shrink-0 text-xs font-medium text-ft-muted hover:text-ft-danger"
                                >
                                  Unassign
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {section === "templates" && (
            <SectionCard
              title="Workout templates"
              description="Reusable programs. Yours are editable by every admin; a coach's own template stays theirs to change."
            >
              <TemplateWorkshop mode="admin" />
            </SectionCard>
          )}

          {section === "plans" && (
            <div className="space-y-4">
              <SectionCard
                title="How plans get drafted"
                description="Applies to every new assessment. Coaches still review and publish either way."
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      id: "ai" as const,
                      title: "AI drafting",
                      blurb:
                        "Reads the assessment and writes a programme plus a report explaining it.",
                    },
                    {
                      id: "static" as const,
                      title: "Templates only",
                      blurb:
                        "No API calls. Loads the closest template, or a built-in split if there are none.",
                    },
                  ].map((option) => {
                    const active = generationMode === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleGenerationMode(option.id)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-ft-accent bg-ft-accent/[0.05] ring-1 ring-ft-accent"
                            : "border-ft-border/70 hover:border-ft-accent/40",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              active ? "text-ft-accent" : "text-ft-text",
                            )}
                          >
                            {option.title}
                          </span>
                          {active && (
                            <span className="rounded-full bg-ft-accent px-2 py-0.5 text-[11px] font-medium text-white">
                              On
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs text-ft-muted">
                          {option.blurb}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard
                title="Plans"
                description="Review what a coach built, or edit a plan yourself."
                action={
                  <div className="flex gap-1.5">
                    {(["pending", "approved", "all"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setPlanFilter(filter)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                          planFilter === filter
                            ? "bg-ft-accent text-white"
                            : "bg-ft-bg text-ft-muted ring-1 ring-ft-border hover:text-ft-text",
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="space-y-2">
                  {visiblePlans.length === 0 && (
                    <EmptyState>Nothing here right now.</EmptyState>
                  )}

                  {visiblePlans.map((plan) => {
                    const coach = coachById.get(
                      clients.find((c) => c.id === plan.client_id)
                        ?.assigned_coach_id ?? "",
                    );
                    return (
                      <Link
                        key={plan.id}
                        href={`/admin/review?id=${plan.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-ft-border/70 p-3 transition-colors hover:border-ft-accent/40 hover:bg-ft-accent/[0.03]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={plan.full_name} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ft-text">
                              {plan.full_name}
                            </p>
                            <p className="truncate text-xs text-ft-muted">
                              {GOAL_LABEL[plan.goal] ?? plan.goal} ·{" "}
                              {timeAgo(plan.created_at)}
                              {coach ? ` · Coach ${coach.full_name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={cn(
                              "hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline",
                              STATUS_STYLE[plan.status] ??
                                "bg-ft-bg text-ft-muted",
                            )}
                          >
                            {STATUS_LABEL[plan.status] ?? plan.status}
                          </span>
                          <ArrowRight className="size-4 text-ft-accent" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
