import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-xl border border-ft-border bg-ft-surface px-3.5 py-2.5 text-base text-ft-text transition-colors placeholder:text-ft-muted/70 outline-none focus-visible:border-ft-ink focus-visible:ring-1 focus-visible:ring-ft-ink disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
