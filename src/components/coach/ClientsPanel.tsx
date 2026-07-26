"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AccountCreator } from "@/components/admin/AccountCreator";
import { supabase } from "@/lib/supabase";
import type { WorkoutTemplate } from "@/components/plan/TemplateWorkshop";

interface ClientRow {
  id: string;
  full_name: string;
  active: boolean;
}

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The coach's own roster. Everything here is scoped to clients assigned to
 * this coach — both in the query and, since migration 012, in the row-level
 * policies behind it — and anyone they add lands on their roster directly.
 */
export function CoachClientsPanel({
  coachId,
  onRosterChange,
}: {
  coachId: string;
  onRosterChange?: () => void;
}) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(
    () =>
      supabase
        .from("profiles")
        .select("id, full_name, active")
        .eq("assigned_coach_id", coachId)
        .order("created_at", { ascending: false }),
    [coachId],
  );

  const refresh = useCallback(async () => {
    const { data, error: loadError } = await fetchClients();
    if (loadError) setError(loadError.message);
    setClients((data as ClientRow[]) ?? []);
    setLoading(false);
  }, [fetchClients]);

  useEffect(() => {
    let active = true;

    async function load() {
      const [{ data, error: loadError }, { data: templateRows }] = await Promise.all([
        fetchClients(),
        supabase
          .from("workout_templates")
          .select("id, name, description, days, days_per_week, created_by, owner_role, updated_at")
          .order("updated_at", { ascending: false }),
      ]);
      if (!active) return;
      if (loadError) setError(loadError.message);
      setClients((data as ClientRow[]) ?? []);
      setTemplates((templateRows as WorkoutTemplate[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [fetchClients]);

  async function toggleActive(client: ClientRow) {
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active: !client.active })
      .eq("id", client.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    refresh();
    onRosterChange?.();
  }

  return (
    <section className="rounded-2xl border border-nova-border/70 bg-nova-surface shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
      <div className="flex items-start justify-between gap-2 border-b border-nova-border/70 px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-nova-text">My Clients</h2>
          <p className="mt-0.5 text-xs text-nova-muted">
            {loading ? "Loading…" : `${clients.filter((c) => c.active).length} active`}
          </p>
        </div>
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? <X className="size-3.5" /> : <UserPlus className="size-3.5" />}
          {showForm ? "Close" : "Add"}
        </Button>
      </div>

      <div className="p-4">
        {showForm && (
          <div className="mb-4 rounded-xl border border-nova-border/70 bg-nova-bg p-4">
            <AccountCreator
              role="client"
              claimForSignedInCoach
              templates={templates}
              onCreated={() => {
                refresh();
                onRosterChange?.();
              }}
            />
          </div>
        )}

        {error && <p className="mb-3 text-sm text-nova-danger">{error}</p>}

        {!loading && clients.length === 0 && (
          <p className="rounded-xl border border-dashed border-nova-border px-4 py-6 text-center text-sm text-nova-muted">
            No clients yet. Add one, or ask your admin to assign you some.
          </p>
        )}

        <ul className="space-y-1.5">
          {clients.map((client) => (
            <li key={client.id} className="flex items-center gap-2.5 rounded-xl px-1 py-1.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  client.active
                    ? "bg-nova-accent/10 text-nova-accent"
                    : "bg-nova-bg text-nova-muted",
                )}
              >
                {initials(client.full_name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-nova-text">
                  {client.full_name || "(no name)"}
                </span>
                {!client.active && <span className="text-xs text-nova-muted">Removed</span>}
              </span>
              <Button
                variant={client.active ? "ghost" : "default"}
                size="sm"
                onClick={() => toggleActive(client)}
              >
                {client.active ? "Remove" : <><Plus className="size-3.5" />Restore</>}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
