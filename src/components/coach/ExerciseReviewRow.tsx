"use client";

import { useState } from "react";
import { Pencil, Repeat, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ExerciseReviewRowProps {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  tempo: string;
  rpe: string;
  defaultOpen?: boolean;
}

export function ExerciseReviewRow({
  name,
  sets,
  reps,
  rest,
  tempo,
  rpe,
  defaultOpen = false,
}: ExerciseReviewRowProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-nova-border bg-nova-surface">
      <div className="flex w-full items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex-1 text-left"
        >
          <p className="text-sm font-medium text-nova-text">{name}</p>
          <p className="mt-0.5 text-xs text-nova-muted">
            {sets} × {reps}
          </p>
        </button>
        <div className="flex items-center gap-1 text-nova-muted">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Edit exercise"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Swap exercise"
          >
            <Repeat className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={open ? "Collapse exercise" : "Expand exercise"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-nova-border px-4 py-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-nova-bg py-2">
              <p className="font-semibold text-nova-text">{rest}</p>
              <p className="mt-0.5 text-nova-muted">Rest</p>
            </div>
            <div className="rounded-lg bg-nova-bg py-2">
              <p className="font-semibold text-nova-text">{tempo}</p>
              <p className="mt-0.5 text-nova-muted">Tempo</p>
            </div>
            <div className="rounded-lg bg-nova-bg py-2">
              <p className="font-semibold text-nova-text">{rpe}</p>
              <p className="mt-0.5 text-nova-muted">RPE</p>
            </div>
          </div>
          <Textarea placeholder="Coach notes..." rows={2} />
        </div>
      )}
    </div>
  );
}
