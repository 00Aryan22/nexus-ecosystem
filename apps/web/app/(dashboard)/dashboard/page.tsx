"use client";

import { useEffect, useState } from "react";
import { fetchDashboard, DashboardSummary } from "@/lib/api/client";
import {
  fetchDocuments,
  KnowledgeDocument,
} from "@/lib/api/memory";
import {
  fetchFounderConversations,
  fetchAIProviders,
  AIProviderPublic,
  AgentConversationPublic,
} from "@/lib/api/founder-agent";
import {
  Rocket,
  Award,
  ShieldAlert,
  ListRestart,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Wallet,
  Hexagon,
  Cpu,
  Bot,
  Globe,
  Database,
  FileText,
  Layers,
  MessageSquare,
  Users,

  BarChart3,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type WalletStatus = {
  connected: boolean;
  address: string;
  network: string;
  balance: string;
};

const MOCK_WALLET: WalletStatus = {
  connected: true,
  address: "0x71C7...8976F",
  network: "Polygon Amoy",
  balance: "12.45 MATIC",
};

const MOCK_PROVIDERS = [
  { name: "Gemini", model: "Gemini 1.5 Pro", status: "healthy", configured: true, supportsVision: true },
  { name: "OpenAI", model: "GPT-4o", status: "healthy", configured: true, supportsVision: true },
  { name: "Anthropic", model: "Claude 3.5 Sonnet", status: "unavailable", configured: false, supportsVision: true },
  { name: "Mistral", model: "Mistral Large", status: "healthy", configured: true, supportsVision: false },
];

export default function DashboardOverviewPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [conversations, setConversations] = useState<AgentConversationPublic[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const [providers, setProviders] = useState<AIProviderPublic[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

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

    async function loadDocuments() {
      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
      } catch {
        // silent
      } finally {
        setDocumentsLoading(false);
      }
    }

    async function loadConversations() {
      try {
        const convos = await fetchFounderConversations();
        setConversations(convos);
      } catch {
        // silent
      } finally {
        setConversationsLoading(false);
      }
    }

    async function loadProviders() {
      try {
        const provs = await fetchAIProviders();
        setProviders(provs);
      } catch {
        // silent
      } finally {
        setProvidersLoading(false);
      }
    }

    void loadData();
    void loadDocuments();
    void loadConversations();
    void loadProviders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
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

  const plansGenerated = conversations.filter((c) => c.title?.toLowerCase().includes("plan")).length;
  const memberSince = "March 2026";

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

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Projects"
          value={data?.total_projects ?? 0}
          icon={Rocket}
          iconColor="text-neon-blue"
          gradientColor="from-blue-500/20 to-cyan-500/5"
          href="/startup-builder"
        />
        <StatCard
          title="Passports"
          value={data?.total_passports ?? 0}
          icon={Award}
          iconColor="text-neon-purple"
          gradientColor="from-purple-500/20 to-pink-500/5"
          href="/skill-passport"
        />
        <StatCard
          title="Audits"
          value={data?.total_audits ?? 0}
          icon={ShieldAlert}
          iconColor="text-amber-400"
          gradientColor="from-amber-500/20 to-yellow-500/5"
          href="/auditor"
        />
        <StatCard
          title="Conversations"
          value={conversations.length}
          icon={MessageSquare}
          iconColor="text-emerald-400"
          gradientColor="from-emerald-500/20 to-teal-500/5"
          href="/founder-agent"
        />
        <StatCard
          title="Documents"
          value={documents.length}
          icon={FileText}
          iconColor="text-rose-400"
          gradientColor="from-rose-500/20 to-pink-500/5"
          href="/memory"
        />
        <StatCard
          title="AI Calls"
          value={data?.total_audits ?? 0}
          icon={Cpu}
          iconColor="text-cyan-400"
          gradientColor="from-cyan-500/20 to-blue-500/5"
          href="/founder-agent"
        />
      </div>

      {/* Statistical Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, idx) => (
          <StatCard key={idx} {...card} />
        ))}
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
                { name: "Open AI Founder Agent", desc: "Validate ideas and chat with the agent", href: "/founder-agent" },
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
                <EmptyState
                  icon={Clock}
                  title="No Recent Activity"
                  description="System events and user actions will appear here."
                  className="py-8"
                />
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

      {/* Wallet Status & NFT Passport Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wallet Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4.5 w-4.5 text-neon-blue" />
                Wallet Status
              </CardTitle>
              <Badge variant={MOCK_WALLET.connected ? "success" : "danger"} pulse={MOCK_WALLET.connected}>
                {MOCK_WALLET.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <CardDescription>Your connected wallet and network status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-surface-slate/40 px-4 py-3">
                <span className="text-xs text-muted-foreground">Address</span>
                <span className="font-mono text-xs font-semibold text-foreground">{MOCK_WALLET.address}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-slate/40 px-4 py-3">
                <span className="text-xs text-muted-foreground">Network</span>
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-neon-purple" />
                  <span className="font-mono text-xs font-semibold text-foreground">{MOCK_WALLET.network}</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-slate/40 px-4 py-3">
                <span className="text-xs text-muted-foreground">Balance</span>
                <span className="font-mono text-xs font-semibold text-foreground">{MOCK_WALLET.balance}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NFT Passport Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Hexagon className="h-4.5 w-4.5 text-neon-purple" />
                NFT Passport Status
              </CardTitle>
              <Badge variant="secondary">{data?.minted_passports ?? 0} Minted</Badge>
            </div>
            <CardDescription>Soulbound NFT credential overview.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-surface-slate/40 px-4 py-3">
                <span className="text-xs text-muted-foreground">Total Passports</span>
                <span className="font-heading text-lg font-bold text-foreground">{data?.total_passports ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-slate/40 px-4 py-3">
                <span className="text-xs text-muted-foreground">Minted NFTs</span>
                <span className="font-heading text-lg font-bold text-emerald-400">{data?.minted_passports ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-slate/40 px-4 py-3">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge variant={data && data.minted_passports > 0 ? "success" : "warning"}>
                  {data && data.minted_passports > 0 ? "Active Minting" : "No Minted NFTs"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory/Workspace Stats & AI Provider Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Memory/Workspace Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-cyan-400" />
                Memory / Workspace Stats
              </CardTitle>
              <Badge variant="info">{documents.length} Docs</Badge>
            </div>
            <CardDescription>Knowledge documents and recent uploads.</CardDescription>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-surface-slate/40 px-4 py-3">
                  <span className="text-xs text-muted-foreground">Total Documents</span>
                  <span className="font-heading text-lg font-bold text-foreground">{documents.length}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Recent Uploads
                  </p>
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border-muted/50 bg-surface-slate/20 px-3 py-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{doc.title}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{doc.source}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No Documents Yet"
                description="Upload documents to the memory workspace."
                className="py-6"
              />
            )}
          </CardContent>
        </Card>

        {/* AI Provider Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-4.5 w-4.5 text-emerald-400" />
                AI Provider Status
              </CardTitle>
              <Badge variant={providers.some((p) => p.healthy) ? "success" : "danger"}>
                {providers.filter((p) => p.healthy).length}/{providers.length} Online
              </Badge>
            </div>
            <CardDescription>Configured AI model providers and health.</CardDescription>
          </CardHeader>
          <CardContent>
            {providersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : providers.length > 0 ? (
              <div className="space-y-2">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border-muted/50 bg-surface-slate/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${p.healthy ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-red-500 shadow-[0_0_6px_#ef4444]"}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{p.displayName}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{p.defaultModel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.supportsVision && (
                        <Badge variant="info" className="text-[8px] px-1.5 py-0">
                          Vision
                        </Badge>
                      )}
                      <Badge variant={p.healthy ? "success" : "danger"} className="text-[8px] px-1.5 py-0">
                        {p.healthy ? "Healthy" : "Down"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {MOCK_PROVIDERS.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg border border-border-muted/50 bg-surface-slate/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${p.status === "healthy" ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-red-500 shadow-[0_0_6px_#ef4444]"}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{p.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{p.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.supportsVision && (
                        <Badge variant="info" className="text-[8px] px-1.5 py-0">
                          Vision
                        </Badge>
                      )}
                      <Badge
                        variant={p.status === "healthy" ? "success" : p.configured ? "warning" : "danger"}
                        className="text-[8px] px-1.5 py-0"
                      >
                        {p.status === "healthy" ? "Online" : p.configured ? "Unstable" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Founder Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-amber-400" />
              Founder Statistics
            </CardTitle>
            <Badge variant="orange">AI Agent</Badge>
          </div>
          <CardDescription>Usage metrics from the AI Founder Agent.</CardDescription>
        </CardHeader>
        <CardContent>
          {conversationsLoading ? (
            <SkeletonTable rows={2} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border-muted/50 bg-surface-slate/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">Conversations</span>
                </div>
                <p className="mt-2 font-heading text-2xl font-extrabold text-foreground">{conversations.length}</p>
              </div>
              <div className="rounded-lg border border-border-muted/50 bg-surface-slate/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">Plans Generated</span>
                </div>
                <p className="mt-2 font-heading text-2xl font-extrabold text-foreground">{plansGenerated}</p>
              </div>
              <div className="rounded-lg border border-border-muted/50 bg-surface-slate/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">Account Age</span>
                </div>
                <p className="mt-2 font-heading text-2xl font-extrabold text-foreground">{memberSince}</p>
              </div>
              <div className="rounded-lg border border-border-muted/50 bg-surface-slate/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">Active Projects</span>
                </div>
                <p className="mt-2 font-heading text-2xl font-extrabold text-foreground">{data?.total_projects ?? 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
