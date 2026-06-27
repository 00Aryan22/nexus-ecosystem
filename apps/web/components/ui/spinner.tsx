import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

function Spinner({ className, size = "md", label }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const innerSizeClasses = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            sizeClasses[size],
            "rounded-full border-t-2 border-r-2 border-neon-blue animate-spin"
          )}
        />
        <div
          className={cn(
            innerSizeClasses[size],
            "absolute rounded-full border-b-2 border-l-2 border-neon-purple animate-spin"
          )}
          style={{ animationDirection: "reverse" }}
        />
      </div>
      {label && (
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

/** Full-page spinner centered in parent */
function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Spinner size="md" label={label} />
    </div>
  );
}

export { Spinner, PageSpinner };
