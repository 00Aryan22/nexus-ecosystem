import { cn } from "@/lib/utils";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 mb-4">
        <Icon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="font-heading text-sm font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-4 border-border-muted hover:bg-white/5"
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

export { ErrorState };
