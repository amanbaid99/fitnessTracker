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
  default: "text-nova-accent bg-nova-accent/10",
  warning: "text-nova-warning bg-nova-warning/10",
  success: "text-nova-success bg-nova-success/10",
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
        "flex items-center gap-3 rounded-2xl border border-nova-border/70 bg-nova-surface p-4 text-left shadow-[0_1px_2px_rgba(28,30,38,0.04)]",
        onClick && "transition-colors hover:border-nova-accent/40 hover:bg-nova-accent/[0.03]",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold leading-tight text-nova-text">{value}</span>
        <span className="block truncate text-xs text-nova-muted">{hint ?? label}</span>
      </span>
    </Wrapper>
  );
}
