import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-mono font-semibold capitalize transition-colors",
  {
    variants: {
      variant: {
        default: "border-border-muted bg-muted text-foreground",
        primary: "border-neon-blue/20 bg-neon-blue/10 text-neon-blue",
        secondary: "border-neon-purple/20 bg-neon-purple/10 text-neon-purple",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
        danger: "border-red-500/20 bg-red-500/10 text-red-500",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-500",
        orange: "border-orange-500/20 bg-orange-500/10 text-orange-500",
        neutral: "border-neutral-500/20 bg-neutral-500/10 text-neutral-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        badgeVariants({ variant }),
        pulse && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
