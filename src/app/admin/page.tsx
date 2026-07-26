"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
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
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function generateCoachCredentials() {
  const suffix = randomSuffix();
  return {
    email: `coach-${suffix}@nova.local`,
    password: `Coach-${suffix}-${Math.floor(1000 + Math.random() * 9000)}`,
  };
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

  const [coaches, setCoaches] = useState<StaffProfile[]>([]);
  const [clients, setClients] = useState<StaffProfile[]>([]);
  const [generated, setGenerated] = useState<{ email: string; password: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

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
    const [{ data: coachRows }, { data: clientRows }] = await Promise.all([
      supabase.rpc("admin_list_profiles", { p_role: "coach" }),
      supabase.rpc("admin_list_profiles", { p_role: "client" }),
    ]);
    setCoaches((coachRows as StaffProfile[]) ?? []);
    setClients((clientRows as StaffProfile[]) ?? []);
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
      .select("role, active")
      .eq("id", data.session.user.id)
      .single();

    if (!profile || profile.role !== "coach" || profile.active === false) {
      await supabase.auth.signOut();
      setCoachError("These aren't valid coach credentials, or the account has been removed.");
      setCoachSubmitting(false);
      return;
    }

    router.push("/admin/coach");
  }

  async function handleGenerateCoach() {
    setPanelError(null);
    setGenerated(null);
    setGenerating(true);
    const creds = generateCoachCredentials();

    const { data, error } = await supabase.auth.signUp({
      email: creds.email,
      password: creds.password,
      options: { data: { full_name: `Coach ${creds.email.split("@")[0]}` } },
    });

    if (error || !data.user) {
      setPanelError(error?.message ?? "Could not create the coach account.");
      setGenerating(false);
      return;
    }

    const { error: promoteError } = await supabase.rpc("admin_promote_to_coach", {
      p_id: data.user.id,
    });

    // signUp() logs this browser in as the newly created coach — sign back
    // out immediately so the admin session isn't quietly replaced by it.
    await supabase.auth.signOut();
    setGenerating(false);

    if (promoteError) {
      setPanelError(promoteError.message);
      return;
    }

    setGenerated(creds);
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
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-nova-text">Coaches</h2>
            <Button size="sm" onClick={handleGenerateCoach} disabled={generating}>
              {generating ? "Generating…" : "Generate Coach Account"}
            </Button>
          </div>

          {generated && (
            <div className="mt-3 rounded-2xl border border-nova-accent/30 bg-nova-accent/[0.04] p-4">
              <p className="text-sm font-medium text-nova-text">
                New coach account created — copy these now, they won&apos;t be shown again:
              </p>
              <div className="mt-2 space-y-1 font-mono text-sm text-nova-text">
                <p>ID: {generated.email}</p>
                <p>Password: {generated.password}</p>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `ID: ${generated.email}\nPassword: ${generated.password}`,
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
          <h2 className="text-sm font-semibold text-nova-text">Clients</h2>
          <div className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
            {clients.length === 0 && (
              <p className="px-4 py-3 text-sm text-nova-muted">No clients yet.</p>
            )}
            {clients.map((client) => (
              <div key={client.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-nova-text">
                    {client.full_name || "(no name)"}
                  </p>
                  <p className="text-xs text-nova-muted">
                    {client.active ? "Active" : "Removed"}
                  </p>
                </div>
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
