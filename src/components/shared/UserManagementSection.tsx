"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileRow {
  id: string;
  full_name: string;
  active: boolean;
}

interface InviteRow {
  email: string;
  created_at: string;
}

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserManagementSection({
  role,
  title,
}: {
  role: "coach" | "client";
  title: string;
}) {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [{ data: profileRows }, { data: inviteRows }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, active").eq("role", role),
      supabase.from("invited_roles").select("email, created_at").eq("role", role),
    ]);
    setProfiles((profileRows as ProfileRow[]) ?? []);
    setInvites((inviteRows as InviteRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      const [{ data: profileRows }, { data: inviteRows }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, active").eq("role", role),
        supabase.from("invited_roles").select("email, created_at").eq("role", role),
      ]);
      if (!active) return;
      setProfiles((profileRows as ProfileRow[]) ?? []);
      setInvites((inviteRows as InviteRow[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [role]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: insertError } = await supabase
      .from("invited_roles")
      .insert({ email: email.trim().toLowerCase(), role });

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setEmail("");
    refresh();
  }

  async function cancelInvite(inviteEmail: string) {
    setBusy(true);
    await supabase.from("invited_roles").delete().eq("email", inviteEmail);
    setBusy(false);
    refresh();
  }

  async function toggleActive(profile: ProfileRow) {
    setBusy(true);
    await supabase
      .from("profiles")
      .update({ active: !profile.active })
      .eq("id", profile.id);
    setBusy(false);
    refresh();
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-nova-text">{title}</h2>

      <form onSubmit={handleInvite} className="mt-3 flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`Invite a ${role} by email`}
        />
        <Button type="submit" disabled={busy} className="shrink-0">
          Invite
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-nova-danger">{error}</p>}

      <div className="mt-3 divide-y divide-nova-border rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
        {loading && (
          <p className="px-4 py-3 text-sm text-nova-muted">Loading…</p>
        )}

        {!loading && profiles.length === 0 && invites.length === 0 && (
          <p className="px-4 py-3 text-sm text-nova-muted">
            No {role}s yet — invite one above.
          </p>
        )}

        {invites.map((invite) => (
          <div key={invite.email} className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nova-warning/10 text-xs font-semibold text-nova-warning">
              {initials(invite.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-nova-text">{invite.email}</p>
              <p className="text-xs text-nova-muted">Invited — hasn&apos;t signed up yet</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => cancelInvite(invite.email)}
            >
              Cancel
            </Button>
          </div>
        ))}

        {profiles.map((profile) => (
          <div key={profile.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nova-accent/10 text-xs font-semibold text-nova-accent">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-nova-text">
                {profile.full_name || "(no name)"}
              </p>
              <p className="text-xs text-nova-muted">
                {profile.active ? "Active" : "Deactivated"}
              </p>
            </div>
            <Button
              variant={profile.active ? "outline" : "default"}
              size="sm"
              disabled={busy}
              onClick={() => toggleActive(profile)}
            >
              {profile.active ? "Remove" : "Restore"}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
