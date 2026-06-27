import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-border-muted bg-surface-obsidian px-3 py-2 text-sm text-foreground shadow-sm transition-colors resize-none",
        "placeholder:text-muted-foreground/60",
        "focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
