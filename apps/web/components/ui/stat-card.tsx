import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  gradientColor?: string;
  href?: string;
  className?: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-neon-blue",
  gradientColor = "from-blue-500/20 to-cyan-500/5",
  href,
  className,
}: StatCardProps) {
  const content = (
    <>
      <div
        className={cn(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-40 blur-xl transition-all group-hover:scale-125",
          gradientColor
        )}
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 font-heading text-4xl font-extrabold tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "rounded-lg bg-surface-slate border border-border-muted p-3 shadow-inner",
            iconColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {description && (
        <div className="mt-4 flex items-center justify-between border-t border-border-muted/50 pt-4">
          <span className="text-xs text-muted-foreground">{description}</span>
          {href && (
            <span className="flex items-center text-xs font-medium text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity">
              Workspace <ArrowUpRight className="ml-1 h-3 w-3" />
            </span>
          )}
        </div>
      )}
    </>
  );

  const baseClassName = cn(
    "glass-card group relative block overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return <div className={baseClassName}>{content}</div>;
}

export { StatCard };
