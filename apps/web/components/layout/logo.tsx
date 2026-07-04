"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

type NexusLogoProps = {
  className?: string;
  showText?: boolean;
  small?: boolean;
  href?: string;
};

export function NexusLogo({
  className = "",
  showText = true,
  small = false,
  href,
}: NexusLogoProps) {
  const { isAuthenticated } = useAuth();
  const targetHref = href ?? (isAuthenticated ? "/dashboard" : "/");

  return (
    <Link href={targetHref} className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`relative overflow-hidden rounded-2xl border border-border-muted bg-surface-slate ${
          small ? "h-9 w-9" : "h-11 w-11"
        }`}
      >
        <Image
          src="/nexus-ai-logo.svg"
          alt="NEXUS AI logo"
          fill
          sizes={small ? "2.25rem" : "2.75rem"}
          className="object-contain"
        />
      </div>
      {showText ? (
        <span
          className={`font-heading font-bold tracking-tight text-foreground ${
            small ? "text-sm" : "text-lg"
          }`}
        >
          NEXUS AI
        </span>
      ) : null}
    </Link>
  );
}
