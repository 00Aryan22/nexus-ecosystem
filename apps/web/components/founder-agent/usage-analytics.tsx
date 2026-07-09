"use client";

import {
  Activity,
  BarChart3,
  Clock,
  Cpu,
  Gauge,
  MessageSquare,
} from "lucide-react";

import type { UsageSummary } from "@/lib/api/founder-agent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  iconColor,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border-muted bg-surface-obsidian/50 p-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-muted bg-surface-slate ${iconColor ?? "text-muted-foreground"}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="font-heading text-2xl font-extrabold tracking-tight text-foreground mt-0.5">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

interface UsageAnalyticsProps {
  open: boolean;
  onClose: () => void;
  summary: UsageSummary | undefined;
  loading: boolean;
}

function UsageAnalytics({
  open,
  onClose,
  summary,
  loading,
}: UsageAnalyticsProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Usage Analytics</DialogTitle>
        <DialogCloseButton onClose={onClose} />
      </DialogHeader>

      <DialogBody>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !summary ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No usage data available yet. Start chatting to see analytics.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat
                icon={MessageSquare}
                label="Total Requests"
                value={formatNumber(summary.total_requests)}
                iconColor="text-neon-blue"
              />
              <Stat
                icon={Gauge}
                label="Avg Latency"
                value={`${summary.avg_latency_ms.toFixed(0)}ms`}
                iconColor="text-neon-purple"
              />
              <Stat
                icon={Activity}
                label="Tokens In"
                value={formatNumber(summary.total_tokens_input)}
                iconColor="text-emerald-400"
              />
              <Stat
                icon={BarChart3}
                label="Tokens Out"
                value={formatNumber(summary.total_tokens_output)}
                iconColor="text-orange-500"
              />
            </div>

            {Object.keys(summary.by_provider).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                    Provider Breakdown
                  </CardTitle>
                  <CardDescription>
                    Request count by LLM provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(summary.by_provider).map(
                      ([provider, count]) => (
                        <div
                          key={provider}
                          className="flex items-center justify-between rounded-lg border border-border-muted bg-surface-obsidian/50 px-3 py-2"
                        >
                          <Badge variant="neutral">{provider}</Badge>
                          <span className="font-heading text-sm font-bold text-foreground">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-center gap-1 pt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-mono">
                Data refreshes every 2 minutes
              </span>
            </div>
          </div>
        )}
      </DialogBody>
    </Dialog>
  );
}

export { UsageAnalytics };
