"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function WarmupCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-ft-border bg-ft-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <div className="text-left">
          <p className="text-sm font-medium text-ft-text">
            Warm-up &amp; Stretches
          </p>
          <p className="mt-0.5 text-xs text-ft-muted">
            5 exercises · ~8 min
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ft-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <ul className="space-y-2 border-t border-ft-border px-4 py-3 text-sm text-ft-muted">
          <li>Arm circles — 30s</li>
          <li>Band pull-aparts — 15 reps</li>
          <li>Cat-cow stretch — 45s</li>
          <li>Shoulder dislocates — 12 reps</li>
          <li>Light treadmill walk — 3 min</li>
        </ul>
      )}
    </div>
  );
}
