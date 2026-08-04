import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "warning" | "success";
  onClick?: () => void;
}

const TONES = {
  default: "text-ft-accent bg-ft-accent/10",
  warning: "text-ft-warning bg-ft-warning/10",
  success: "text-ft-success bg-ft-success/10",
} as const;

export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  onClick,
}: StatTileProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-ft-border/70 bg-ft-surface p-4 text-left",
        onClick && "transition-colors hover:border-ft-accent/40 hover:bg-ft-accent/[0.03]",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold leading-tight text-ft-text">{value}</span>
        <span className="block truncate text-xs text-ft-muted">{hint ?? label}</span>
      </span>
    </Wrapper>
  );
}
