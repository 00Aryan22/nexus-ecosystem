import { cn } from "@/lib/utils";
import { Inbox, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="rounded-xl bg-surface-slate/60 border border-border-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="font-heading text-sm font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { EmptyState };
