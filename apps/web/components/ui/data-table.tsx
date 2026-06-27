import * as React from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Data Table                                                                */
/* -------------------------------------------------------------------------- */

function DataTable({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("glass-card overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

function DataTableHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "p-6 border-b border-border-muted",
        className
      )}
      {...props}
    />
  );
}

function DataTableContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("overflow-x-auto", className)} {...props}>
      <table className="w-full text-left text-xs border-collapse">
        {children}
      </table>
    </div>
  );
}

function DataTableHead({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "border-b border-border-muted bg-surface-slate/40 text-muted-foreground uppercase font-bold tracking-wider text-[10px]",
        className
      )}
      {...props}
    />
  );
}

function DataTableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("divide-y divide-border-muted/50", className)}
      {...props}
    />
  );
}

function DataTableRow({
  className,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "hover:bg-white/[0.02] transition-colors",
        className
      )}
      {...props}
    />
  );
}

function DataTableCell({
  className,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td className={cn("p-4", className)} {...props} />
  );
}

function DataTableHeadCell({
  className,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th className={cn("p-4", className)} {...props} />
  );
}

export {
  DataTable,
  DataTableHeader,
  DataTableContent,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTableHeadCell,
};
