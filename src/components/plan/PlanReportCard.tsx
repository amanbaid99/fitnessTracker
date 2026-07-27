"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/** What the generator wrote about this client, for the reviewer's eyes. */
export interface AiReport {
  summary?: string;
  red_flags?: string[];
  considerations?: string[];
  open_questions?: string[];
  weekly_structure?: string;
  progression?: string;
  /** Present only when generation fell back — why it did. */
  error?: string;
}

function Bullets({ title, items, tone }: { title: string; items: string[]; tone?: "danger" }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <p
        className={
          tone === "danger"
            ? "text-xs font-semibold text-nova-danger"
            : "text-xs font-semibold text-nova-muted"
        }
      >
        {title}
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-nova-text">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Nova's analysis, shown above the plan editor. This is the coach's briefing
 * on a client they haven't met — it leads the review screen deliberately, so
 * the programme is read in light of the reasoning behind it.
 */
export function PlanReportCard({
  report,
  generatedBy,
  onRegenerate,
  regenerating,
  error,
}: {
  report: AiReport | null;
  generatedBy: string | null;
  onRegenerate?: () => void;
  regenerating?: boolean;
  error?: string | null;
}) {
  const shown = error ?? report?.error;

  return (
    <section className="mt-4 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 shadow-[0_1px_2px_rgba(28,30,38,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-nova-text">
            <Sparkles className="size-4 text-nova-accent" />
            Nova&apos;s read
          </h2>
          <p className="mt-0.5 text-xs text-nova-muted">
            {generatedBy === "ai"
              ? "A draft for you to edit — the client sees nothing until you publish."
              : generatedBy === "fallback"
                ? "No AI analysis — a template was loaded instead."
                : "Nothing drafted yet."}
          </p>
        </div>
        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            disabled={regenerating}
            onClick={onRegenerate}
            className="shrink-0"
          >
            {regenerating ? "Drafting…" : "Regenerate"}
          </Button>
        )}
      </div>

      {shown && (
        <p className="mt-3 rounded-xl bg-nova-danger/[0.06] px-3 py-2 font-mono text-[11px] break-words text-nova-danger">
          {shown}
        </p>
      )}

      {report?.summary && (
        <p className="mt-3 text-sm whitespace-pre-line text-nova-text">{report.summary}</p>
      )}

      <Bullets title="Needs your decision" items={report?.red_flags ?? []} tone="danger" />
      <Bullets title="Programmed around" items={report?.considerations ?? []} />
      <Bullets title="Worth asking them" items={report?.open_questions ?? []} />

      {(report?.weekly_structure || report?.progression) && (
        <dl className="mt-3 space-y-1.5 border-t border-nova-border/70 pt-3 text-sm">
          {report.weekly_structure && (
            <div>
              <dt className="text-xs font-semibold text-nova-muted">The week</dt>
              <dd className="whitespace-pre-line text-nova-text">{report.weekly_structure}</dd>
            </div>
          )}
          {report.progression && (
            <div>
              <dt className="text-xs font-semibold text-nova-muted">Progression</dt>
              <dd className="whitespace-pre-line text-nova-text">{report.progression}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
