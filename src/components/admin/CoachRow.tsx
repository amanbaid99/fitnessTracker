"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AccountEditor } from "@/components/admin/AccountEditor";
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

/** A coach in the admin list, with their login details editable inline. */
export function CoachRow({ coach, clientCount, onChanged, onToggleActive }: CoachRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-ft-border/70">
      <div className="flex items-center gap-3 p-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            coach.active ? "bg-ft-ink text-white" : "bg-ft-bg text-ft-muted",
          )}
        >
          {initials(coach.full_name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ft-text">
            {coach.full_name || "(no name)"}
          </p>
          <p className="truncate text-xs text-ft-muted">
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
        <div className="space-y-3 border-t border-ft-border/70 p-3">
          <AccountEditor
            account={coach}
            mode="admin"
            onSaved={onChanged}
          />

          <div className="flex justify-end border-t border-ft-border/70 pt-3">
            <Button
              variant={coach.active ? "ghost" : "default"}
              size="sm"
              className={cn(coach.active && "text-ft-danger")}
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
