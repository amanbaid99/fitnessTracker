import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ft-surface-alt text-ft-text",
        highlight: "border-transparent bg-ft-highlight text-ft-ink",
        ink: "border-transparent bg-ft-ink text-white",
        success: "border-transparent bg-ft-success/15 text-ft-success",
        warning: "border-transparent bg-ft-warning/15 text-ft-warning",
        destructive: "border-transparent bg-ft-danger/15 text-ft-danger",
        outline: "border-ft-border text-ft-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
