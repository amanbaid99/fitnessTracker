"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy, KeyRound, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import type { StaffProfile } from "@/components/admin/AccountCreator";

interface CoachRowProps {
  coach: StaffProfile;
  clientCount: number;
  onChanged: () => void;
  onToggleActive: () => void;
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
 * A coach in the admin list, with an inline editor.
 *
 * Name and the first-login password flag are stored on the profile, so the
 * panel can change them. Email and password live in Supabase's auth tables,
 * which need a service key the browser must never hold — so those are shown
 * read-only, and "require a new password" is offered instead of a reset.
 */
export function CoachRow({ coach, clientCount, onChanged, onToggleActive }: CoachRowProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(coach.full_name);
  const [mustChange, setMustChange] = useState(Boolean(coach.must_change_password));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = name.trim() !== coach.full_name || mustChange !== Boolean(coach.must_change_password);

  async function handleSave() {
    setError(null);
    setSaving(true);

    const { error: saveError } = await supabase.rpc("admin_update_profile", {
      p_id: coach.id,
      p_full_name: name.trim() || null,
      p_must_change_password: mustChange,
    });

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setSaved(true);
    onChanged();
  }

  return (
    <div className="rounded-xl border border-nova-border/70">
      <div className="flex items-center gap-3 p-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            coach.active ? "bg-nova-accent/10 text-nova-accent" : "bg-nova-bg text-nova-muted",
          )}
        >
          {initials(coach.full_name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-nova-text">
            {coach.full_name || "(no name)"}
          </p>
          <p className="truncate text-xs text-nova-muted">
            {clientCount} member{clientCount === 1 ? "" : "s"}
            {coach.email ? ` · ${coach.email}` : ""}
            {coach.active ? "" : " · Removed"}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          Edit
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </Button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-nova-border/70 p-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-nova-text">Name</span>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              className="h-9 text-sm"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-nova-text">
              Login ID (email)
            </span>
            <div className="flex items-center gap-2 rounded-md border border-nova-border bg-nova-bg px-3 py-2">
              <Mail className="size-3.5 shrink-0 text-nova-muted" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-nova-text">
                {coach.email ?? "—"}
              </span>
              {coach.email && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(coach.email!);
                    setCopied(true);
                  }}
                  className="shrink-0 text-nova-muted hover:text-nova-accent"
                  aria-label="Copy email"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-nova-muted">
              Emails are managed by the login system and can&apos;t be changed from here.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-nova-bg p-3">
            <input
              type="checkbox"
              checked={mustChange}
              onChange={(e) => {
                setMustChange(e.target.checked);
                setSaved(false);
              }}
              className="mt-0.5 size-4 accent-[var(--nova-accent)]"
            />
            <span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-nova-text">
                <KeyRound className="size-3.5" />
                Require a new password at next login
              </span>
              <span className="mt-0.5 block text-[11px] text-nova-muted">
                They&apos;ll be asked to set a new one before they can carry on.
              </span>
            </span>
          </label>

          {error && <p className="text-xs text-nova-danger">{error}</p>}

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && !dirty && <span className="text-xs text-nova-success">Saved</span>}
            <Button
              variant={coach.active ? "ghost" : "default"}
              size="sm"
              className={cn("ml-auto", coach.active && "text-nova-danger")}
              onClick={onToggleActive}
            >
              {coach.active ? "Remove coach" : "Restore coach"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
