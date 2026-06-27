import * as React from "react";

import { cn } from "@/lib/utils";

function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-9 w-full rounded-md border border-border-muted bg-surface-obsidian px-3 py-2 text-sm text-foreground shadow-sm transition-colors appearance-none",
        "focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Select };
