"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  BookOpen,
  GraduationCap,
  Download,
  Shield,
  Heart,
  Globe,
  MessageCircle,
  BookMarked,
  ExternalLink,
  FileText,
  Search,
  Zap,
  Sparkles,
  Code2,
} from "lucide-react";

const STARTUP_TEMPLATES = [
  {
    id: "erc20",
    name: "ERC-20 Token",
    description:
      "Production-ready ERC-20 token template with minting, burning, pausing, and access control. Includes full test suite and deployment scripts.",
    icon: Zap,
    badge: "Popular",
    badgeVariant: "default" as const,
    files: ["Token.sol", "Token.test.ts", "deploy.ts", "README.md"],
    size: "12 KB",
  },
  {
    id: "nft-collection",
    name: "NFT Collection",
    description:
      "ERC-721A-based NFT collection with metadata, reveal mechanics, allowlist, and royalty support. Optimized for batch minting gas efficiency.",
    icon: Sparkles,
    badge: "New",
    badgeVariant: "secondary" as const,
    files: ["NFTCollection.sol", "MetadataRenderer.sol", "deploy.ts", "README.md"],
    size: "18 KB",
  },
  {
    id: "dao-setup",
    name: "DAO Setup",
    description:
      "Governance framework with proposal creation, voting, timelock, and treasury management. Based on OpenZeppelin Governor contracts.",
    icon: Globe,
    badge: "Advanced",
    badgeVariant: "info" as const,
    files: ["Governor.sol", "Timelock.sol", "Treasury.sol", "deploy.ts", "README.md"],
    size: "24 KB",
  },
  {
    id: "multisig-wallet",
    name: "Multi-sig Wallet",
    description:
      "Multi-signature wallet with configurable owners and threshold. Supports ETH, ERC-20 transfers, and arbitrary contract calls.",
    icon: Shield,
    badge: null,
    badgeVariant: null,
    files: ["MultiSigWallet.sol", "Wallet.test.ts", "deploy.ts", "README.md"],
    size: "15 KB",
  },
];

const AUDIT_REPORTS = [
  {
    id: "audit-1",
    project: "NexusToken Core",
    auditor: "Nexus Internal Security",
    date: "2026-06-15",
    severity: "Low",
    findings: 3,
    status: "Resolved",
  },
  {
    id: "audit-2",
    project: "CommunityTreasury",
    auditor: "Open Audit Collective",
    date: "2026-05-22",
    severity: "Informational",
    findings: 5,
    status: "Resolved",
  },
  {
    id: "audit-3",
    project: "GovernanceModule",
    auditor: "Nexus Internal Security",
    date: "2026-04-10",
    severity: "Medium",
    findings: 2,
    status: "In Progress",
  },
];

const MENTOR_PROMPTS = [
  "How do I design a tokenomics model for my project?",
  "What's the best architecture for a DeFi protocol?",
  "How should I structure my DAO governance?",
  "What security best practices should I follow for smart contracts?",
  "How do I create a sustainable revenue model for a public good?",
];

const COMMUNITY_LINKS = [
  {
    title: "GitHub",
    description: "Open-source repos, templates, and example projects",
    href: "https://github.com/nexus-ai",
    icon: Code2,
  },
  {
    title: "Discord",
    description: "Join the community for support, discussions, and collaboration",
    href: "https://discord.gg/nexus-ai",
    icon: MessageCircle,
  },
  {
    title: "Documentation",
    description: "Comprehensive guides, API references, and tutorials",
    href: "https://docs.nexus-ai",
    icon: BookOpen,
  },
  {
    title: "Community Forum",
    description: "Proposals, feature requests, and governance discussions",
    href: "https://forum.nexus-ai.com",
    icon: BookMarked,
  },
];

const KNOWLEDGE_BASE = [
  {
    title: "Smart Contract Development Guide",
    description: "Step-by-step guide from basics to advanced patterns",
    category: "Development",
    readTime: "25 min",
  },
  {
    title: "Tokenomics Design Handbook",
    description: "Framework for designing sustainable token economies",
    category: "Strategy",
    readTime: "40 min",
  },
  {
    title: "Security Best Practices",
    description: "Comprehensive checklist for secure smart contract development",
    category: "Security",
    readTime: "15 min",
  },
  {
    title: "DAO Governance Patterns",
    description: "Common governance structures and when to use each",
    category: "Governance",
    readTime: "30 min",
  },
  {
    title: "Gas Optimization Techniques",
    description: "Reduce deployment and execution costs on EVM chains",
    category: "Development",
    readTime: "20 min",
  },
  {
    title: "Public Goods Funding Models",
    description: "How to fund and sustain open-source projects in Web3",
    category: "Strategy",
    readTime: "35 min",
  },
];

export default function PublicGoodsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredTemplates = STARTUP_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const filteredKnowledge = KNOWLEDGE_BASE.filter(
    (k) =>
      k.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      k.description.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      k.category.toLowerCase().includes(knowledgeSearch.toLowerCase())
  );

  async function handleDownload(templateId: string) {
    setDownloading(templateId);
    await new Promise((r) => setTimeout(r, 1500));
    setDownloading(null);
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <ErrorState
          title="Failed to load public goods"
          message={error}
          onRetry={() => {
            setError(null);
            setLoading(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      <PageHeader
        title="Public Goods & Community Resources"
        description="Free templates, educational tools, audit reports, and community resources to accelerate your journey."
      />

      {loading ? (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="h-8 w-64" />
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Open Startup Templates</h2>
                <p className="text-sm text-muted-foreground">
                  Battle-tested templates to launch your project in minutes
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card key={template.id} className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {template.badge && (
                            <Badge variant={template.badgeVariant!} className="text-xs">
                              {template.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {template.files.slice(0, 3).map((file) => (
                          <Badge key={file} variant="neutral" className="text-xs font-mono">
                            {file}
                          </Badge>
                        ))}
                        {template.files.length > 3 && (
                          <Badge variant="neutral" className="text-xs">
                            +{template.files.length - 3} more
                          </Badge>
                        )}
                        <span className="ml-2 text-xs text-muted-foreground">{template.size}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(template.id)}
                        disabled={downloading === template.id}
                      >
                        {downloading === template.id ? (
                          <Spinner className="mr-1 h-3 w-3" />
                        ) : (
                          <Download className="mr-1 h-3 w-3" />
                        )}
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredTemplates.length === 0 && (
                <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                  No templates match your search.
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <GraduationCap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Educational AI Mentor</h2>
                <p className="text-sm text-muted-foreground">
                  Get personalized guidance from the Nexus founder agent
                </p>
              </div>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <div className="flex flex-wrap gap-2">
                  {MENTOR_PROMPTS.map((prompt, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer px-3 py-1.5 text-sm hover:bg-primary/20 transition-colors"
                    >
                      {prompt}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
                  <Sparkles className="h-5 w-5 shrink-0 text-purple-500" />
                  <p className="text-sm text-muted-foreground">
                    Ask the AI mentor anything about startup strategy, tokenomics, governance, or
                    technical architecture.
                  </p>
                  <Button size="sm" className="shrink-0">
                    Open Founder Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Free Contract Audit Reports</h2>
                <p className="text-sm text-muted-foreground">
                  Publicly shared audit reports for community reference
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {AUDIT_REPORTS.map((report) => (
                <Card key={report.id}>
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{report.project}</CardTitle>
                      <Badge
                        variant={
                          report.status === "Resolved" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {report.auditor} &middot; {report.date}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="neutral" className="text-xs">
                        {report.severity}
                      </Badge>
                      <Badge variant="neutral" className="text-xs">
                        {report.findings} findings
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost">
                      <FileText className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <BookMarked className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Knowledge Base</h2>
                <p className="text-sm text-muted-foreground">
                  In-depth articles, guides, and best practices
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search knowledge base..."
                value={knowledgeSearch}
                onChange={(e) => setKnowledgeSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredKnowledge.map((article, i) => (
                <Card key={i} className="cursor-pointer transition-colors hover:bg-accent/50">
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral" className="text-xs">
                        {article.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{article.readTime}</span>
                    </div>
                    <CardTitle className="text-sm">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {article.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" variant="ghost" className="p-0">
                      Read Article
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {filteredKnowledge.length === 0 && (
                <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">
                  No articles match your search.
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Heart className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Community Resources</h2>
                <p className="text-sm text-muted-foreground">
                  Connect with the Nexus ecosystem
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {COMMUNITY_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Card
                    key={link.title}
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                    onClick={() => window.open(link.href, "_blank", "noopener,noreferrer")}
                  >
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {link.title}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>{link.description}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
            <Heart className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Built with{" "}
              <span className="font-medium text-primary">love</span> for the community.
            </p>
            <p className="text-xs text-muted-foreground">
              All resources are free and open-source.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
