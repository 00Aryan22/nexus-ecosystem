"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type StatusBannerProps = {
  kind: "success" | "error" | "info";
  message: string;
  className?: string;
};

export function StatusBanner({ kind, message, className }: StatusBannerProps) {
  const styles = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    info: "border-neon-blue/30 bg-neon-blue/10 text-neon-blue",
  };

  const icons = {
    success: <CheckCircle2 className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  return (
    <div className={cn("flex items-start gap-2 rounded-xl border px-4 py-3 text-sm", styles[kind], className)}>
      <div className="mt-0.5">{icons[kind]}</div>
      <p>{message}</p>
    </div>
  );
}
