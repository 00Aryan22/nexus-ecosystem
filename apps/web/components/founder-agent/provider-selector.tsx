"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Cpu, AlertTriangle, XCircle, Ban, Clock } from "lucide-react";

import type { AIProviderHealth, ProviderStatus } from "@/lib/api/founder-agent";
import { Button } from "@/components/ui/button";

type ProviderSelectorProps = {
  providers: ProviderStatus[];
  currentProvider: string;
  onSelect: (provider: string) => void;
  disabled?: boolean;
  loading?: boolean;
  healthDetails?: Record<string, AIProviderHealth>;
};

function statusColor(status?: string): string {
  switch (status) {
    case "healthy":
      return "bg-green-500";
    case "misconfigured":
    case "not_configured":
      return "bg-yellow-500";
    case "rate_limited":
      return "bg-orange-500";
    case "model_unavailable":
      return "bg-red-400";
    case "local_only":
      return "bg-blue-400";
    case "unavailable":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

function statusLabel(status?: string): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "misconfigured":
      return "Misconfigured";
    case "not_configured":
      return "Not Configured";
    case "rate_limited":
      return "Rate Limited";
    case "model_unavailable":
      return "Model Unavailable";
    case "local_only":
      return "Local Only";
    case "unavailable":
      return "Unavailable";
    default:
      return "Unknown";
  }
}

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case "healthy":
      return null;
    case "misconfigured":
    case "not_configured":
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    case "rate_limited":
      return <Clock className="h-3 w-3 text-orange-500" />;
    case "model_unavailable":
      return <XCircle className="h-3 w-3 text-red-400" />;
    case "local_only":
      return <Ban className="h-3 w-3 text-blue-400" />;
    case "unavailable":
      return <XCircle className="h-3 w-3 text-red-500" />;
    default:
      return <Ban className="h-3 w-3 text-gray-400" />;
  }
}

export function ProviderSelector({
  providers,
  currentProvider,
  onSelect,
  disabled,
  loading,
  healthDetails,
}: ProviderSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = providers.find((p) => p.name === currentProvider);
  const currentHealth = healthDetails?.[currentProvider];
  const currentStatus = currentHealth?.status;

  return (
    <div className="relative" ref={ref}>
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
        disabled={disabled || loading}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Selected provider: ${current?.displayName ?? currentProvider}`}
      >
        <Cpu className="h-4 w-4 mr-1.5" />
        {loading ? "Loading..." : current?.displayName ?? currentProvider}
        {currentStatus && (
          <span
            className={`ml-1.5 h-2 w-2 rounded-full ${statusColor(currentStatus)}`}
            title={statusLabel(currentStatus)}
          />
        )}
        <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />
      </Button>
      {open && (
        <div
          role="listbox"
          aria-label="Available providers"
          className="absolute right-0 z-50 mt-1 w-64 rounded-lg border border-border bg-background shadow-lg"
        >
          {providers.map((p) => {
            const detail = healthDetails?.[p.name];
            const status = detail?.status;
            const isActive = p.name === currentProvider;
            return (
              <button
                key={p.name}
                role="option"
                aria-selected={isActive}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted focus:bg-muted focus:outline-none ${
                  isActive ? "font-medium" : ""
                }`}
                onClick={() => {
                  onSelect(p.name);
                  setOpen(false);
                }}
              >
                {status ? (
                  <StatusIcon status={status} />
                ) : (
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${statusColor(status)}`}
                    title={detail ? statusLabel(status) : p.configured ? "Configured" : "Not configured"}
                  />
                )}
                <span className="flex-1 text-left">{p.displayName}</span>
                {status && (
                  <span
                    className={`text-[10px] uppercase tracking-wider ${
                      status === "healthy"
                        ? "text-green-500"
                        : status === "unavailable"
                          ? "text-red-400"
                          : status === "model_unavailable"
                            ? "text-red-400"
                            : status === "misconfigured" || status === "not_configured"
                              ? "text-yellow-400"
                              : status === "rate_limited"
                                ? "text-orange-400"
                                : status === "local_only"
                                  ? "text-blue-400"
                                  : "text-muted-foreground"
                    }`}
                  >
                    {statusLabel(status)}
                  </span>
                )}
                {isActive ? (
                  status && status !== "healthy" ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  )
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
