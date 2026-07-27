"use client";

import { Loader2, PencilLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * What a reviewer sees while a plan is still in 'awaiting_ai'.
 *
 * Editing is deliberately blocked here: the generator overwrites `days` when
 * it finishes, so anything typed in the meantime would be silently thrown
 * away. Better to say "not yet" than to lose a coach's work.
 *
 * There is always a way out. Generation can fail quietly — a bad key, a
 * timeout, an assessment that never got picked up — and a plan that can only
 * ever be waited on is a plan no client will ever receive.
 */
export function PlanProcessing({
  clientName,
  onWriteByHand,
  onRetry,
  retrying,
  error,
}: {
  clientName: string;
  onWriteByHand: () => void;
  onRetry?: () => void;
  retrying?: boolean;
  error?: string | null;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-nova-border/70 bg-nova-surface p-6 text-center shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-nova-accent/10 text-nova-accent">
        {retrying ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <Sparkles className="size-6" />
        )}
      </span>

      <h2 className="mt-4 text-base font-semibold text-nova-text">
        Nova is analysing this assessment
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-nova-muted">
        {clientName.split(" ")[0]}&apos;s programme and report are being written. This page
        updates on its own — usually within a minute.
      </p>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-nova-muted">
        <Loader2 className="size-3.5 animate-spin" />
        Checking for the draft…
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-nova-danger/[0.06] px-3 py-2 font-mono text-[11px] break-words text-nova-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {onRetry && (
          <Button variant="outline" size="sm" disabled={retrying} onClick={onRetry}>
            {retrying ? "Trying again…" : "Try again"}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onWriteByHand}>
          <PencilLine className="size-4" />
          Write it by hand instead
        </Button>
      </div>

      <p className="mt-3 text-xs text-nova-muted">
        Taking too long? Writing it by hand skips the draft — nothing is lost.
      </p>
    </section>
  );
}
