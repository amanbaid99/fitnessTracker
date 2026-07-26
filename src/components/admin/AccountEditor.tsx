"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export interface EditableAccount {
  id: string;
  full_name: string;
  email?: string | null;
  must_change_password?: boolean;
}

interface AccountEditorProps {
  account: EditableAccount;
  /**
   * "admin" edits anyone; "coach" goes through the roster-scoped function so
   * a coach can only ever change their own clients.
   */
  mode: "admin" | "coach";
  onSaved: () => void;
}

function generatePassword() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `Nova-${suffix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Edits the parts of an account that live in two different places: the name
 * and password-change flag on the profile, the email and password in the auth
 * tables. A single RPC applies whichever fields were actually filled in.
 */
export function AccountEditor({ account, mode, onSaved }: AccountEditorProps) {
  const [name, setName] = useState(account.full_name ?? "");
  const [email, setEmail] = useState(account.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mustChange, setMustChange] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameChanged = name.trim() !== (account.full_name ?? "");
  const emailChanged = email.trim().toLowerCase() !== (account.email ?? "").toLowerCase();
  const dirty = nameChanged || emailChanged || password.length > 0;

  async function handleSave() {
    setError(null);

    if (emailChanged && !email.includes("@")) {
      setError("That doesn't look like an email address.");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);

    const { error: saveError } = await supabase.rpc(
      mode === "admin" ? "admin_update_account" : "coach_update_client",
      {
        ...(mode === "admin" ? { p_id: account.id } : { p_client_id: account.id }),
        p_full_name: nameChanged ? name.trim() : null,
        p_email: emailChanged ? email.trim() : null,
        p_password: password || null,
        // Only force a re-set when a new password was actually issued.
        p_must_change_password: password ? mustChange : null,
      },
    );

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setSaved(true);
    onSaved();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
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

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-nova-text">
            Login email
          </span>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSaved(false);
            }}
            placeholder="name@example.com"
            className="h-9 text-sm"
          />
        </label>
      </div>

      <div>
        <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-nova-text">
          New password
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPassword(generatePassword());
                setShowPassword(true);
                setSaved(false);
              }}
              className="flex items-center gap-1 text-xs font-medium text-nova-accent hover:underline"
            >
              <RefreshCw className="size-3" />
              Generate
            </button>
            {password && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(password);
                  setCopied(true);
                }}
                className="flex items-center gap-1 text-xs font-medium text-nova-accent hover:underline"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </span>
        </span>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setCopied(false);
              setSaved(false);
            }}
            placeholder="Leave blank to keep the current one"
            className="h-9 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-nova-muted hover:text-nova-text"
          >
            {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-nova-muted">
          Copy it before saving — it can&apos;t be read back afterwards.
        </p>
      </div>

      {password && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-nova-bg p-2.5">
          <input
            type="checkbox"
            checked={mustChange}
            onChange={(e) => setMustChange(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--nova-accent)]"
          />
          <span className="flex items-center gap-1.5 text-xs text-nova-text">
            <KeyRound className="size-3.5 shrink-0 text-nova-muted" />
            Ask them to set their own password at next login
          </span>
        </label>
      )}

      {error && <p className="text-xs text-nova-danger">{error}</p>}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved && !dirty && <span className="text-xs text-nova-success">Saved</span>}
        <span className={cn("text-[11px] text-nova-muted", !dirty && "hidden")}>
          Unsaved changes
        </span>
      </div>
    </div>
  );
}
