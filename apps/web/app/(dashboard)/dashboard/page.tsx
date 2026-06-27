"use client";

import { useEffect, useState } from "react";
import { fetchDashboard, DashboardSummary } from "@/lib/api/client";
import {
  Rocket,
  Award,
  ShieldAlert,
  ListRestart,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchDashboard();
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Projects",
      value: data?.total_projects ?? 0,
      description: "Startup workspaces",
      icon: Rocket,
      color: "from-blue-500/20 to-cyan-500/5",
      iconColor: "text-neon-blue",
      link: "/startup-builder",
    },
    {
      title: "Skill Passports",
      value: data?.total_passports ?? 0,
      description: `${data?.minted_passports ?? 0} Minted NFTs`,
      icon: Award,
      color: "from-purple-500/20 to-pink-500/5",
      iconColor: "text-neon-purple",
      link: "/skill-passport",
    },
    {
      title: "Security Audits",
      value: data?.total_audits ?? 0,
      description: `${data?.completed_audits ?? 0} Completed`,
      icon: ShieldAlert,
      color: "from-amber-500/20 to-yellow-500/5",
      iconColor: "text-amber-400",
      link: "/auditor",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner section */}
      <div className="relative overflow-hidden rounded-xl border border-border-muted bg-gradient-to-r from-neon-blue/10 via-neon-purple/5 to-transparent p-8 md:p-10">
        <div className="relative z-10 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-neon-blue font-semibold">
            SYSTEM ONLINE
          </span>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Welcome to Nexus AI OS
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Your decentralized launching pad. Build your venture structure, verify developer credentials via Soulbound NFTs, and perform instant security audits on Solidity contracts.
          </p>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-1/3 opacity-20 hidden md:block bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.4),transparent)]" />
      </div>

      {/* Statistical Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.link}
              className="glass-card group relative block overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
            >
              <div
                className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${card.color} opacity-40 blur-xl transition-all group-hover:scale-125`}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="mt-2 font-heading text-4xl font-extrabold tracking-tight">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-lg bg-surface-slate border border-border-muted p-3 ${card.iconColor} shadow-inner`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border-muted/50 pt-4">
                <span className="text-xs text-muted-foreground">{card.description}</span>
                <span className="flex items-center text-xs font-medium text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity">
                  Workspace <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main grids: Quick launch & Event logs */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quick launching tools (Col 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-heading font-semibold text-base flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-neon-blue" />
              Quick Action Center
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Trigger actions directly in the ecosystem.
            </p>

            <div className="mt-6 space-y-3">
              {[
                { name: "Create New Project", desc: "Build mock blueprint plans", href: "/startup-builder" },
                { name: "Submit Skill Verification", desc: "Prove smart contract experience", href: "/skill-passport" },
                { name: "Run Smart Contract Audit", desc: "Automated vulnerability check", href: "/auditor" },
              ].map((act, i) => (
                <Link
                  key={i}
                  href={act.href}
                  className="flex items-center justify-between rounded-lg border border-border-muted bg-surface-slate/40 p-3 hover:bg-surface-slate/80 hover:border-border transition-all group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-neon-blue transition-colors">
                      {act.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{act.desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-neon-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent logs feed (Col 3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base flex items-center gap-2">
                <ListRestart className="h-4.5 w-4.5 text-neon-purple" />
                Ecosystem Activity Log
              </h3>
              <Link
                href="/analytics"
                className="text-[10px] uppercase font-bold tracking-wider text-neon-purple hover:underline"
              >
                View all logs
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Real-time audit trails tracked on this account.
            </p>

            <div className="mt-6 flex-1 divide-y divide-border-muted/50 overflow-hidden">
              {!data?.recent_events || data.recent_events.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center text-muted-foreground text-xs">
                  <Clock className="h-6 w-6 mb-2 text-muted-foreground/50 animate-pulse" />
                  No events recorded yet.
                </div>
              ) : (
                data.recent_events.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-neon-purple shadow-[0_0_5px_#a855f7]" />
                      <span className="font-mono text-foreground font-semibold">
                        {ev.event_type}
                      </span>
                      {ev.event_data?.project_name && (
                        <span className="text-muted-foreground italic">
                          ({ev.event_data.project_name})
                        </span>
                      )}
                      {ev.event_data?.contract_name && (
                        <span className="text-muted-foreground italic">
                          ({ev.event_data.contract_name})
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(ev.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
