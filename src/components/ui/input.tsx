import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-xl border border-ft-border bg-ft-surface px-3.5 text-base text-ft-text transition-colors placeholder:text-ft-muted/70 outline-none focus-visible:border-ft-ink focus-visible:ring-1 focus-visible:ring-ft-ink disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
