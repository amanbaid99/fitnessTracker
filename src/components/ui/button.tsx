import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Pill by default: the reference layouts all use fully-rounded actions, and
  // it reads as more considered than a 6px radius at these sizes.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ft-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ft-bg",
  {
    variants: {
      variant: {
        default: "bg-ft-ink text-white hover:bg-ft-accent-hover",
        // The one loud action on a screen — used for the single next step.
        highlight: "bg-ft-highlight text-ft-ink hover:bg-ft-highlight-hover",
        success: "bg-ft-success text-white hover:bg-ft-success/90",
        destructive: "bg-ft-danger text-white hover:bg-ft-danger/90",
        outline:
          "border border-ft-border bg-ft-surface text-ft-text hover:border-ft-ink/30 hover:bg-ft-surface-alt",
        ghost: "bg-transparent text-ft-text hover:bg-ft-surface-alt",
        link: "text-ft-text underline underline-offset-4 decoration-ft-muted/50 hover:decoration-ft-ink",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
