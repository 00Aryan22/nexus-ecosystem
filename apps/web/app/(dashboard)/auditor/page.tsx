"use client";

import { useEffect, useState } from "react";
import {
  fetchAudits,
  fetchAuditReport,
  submitAudit,
  AuditPublic,
  AuditDetail,
} from "@/lib/api/client";
import {
  ShieldAlert,
  Plus,
  Clock,
  Sparkles,
  FileCode,
  AlertTriangle,
  CheckCircle,
  Code,
  Info,
  ArrowLeft,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContractAuditorPage() {
  const [audits, setAudits] = useState<AuditPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mode state: list, submit_new, view_report
  const [mode, setMode] = useState<"list" | "submit" | "view">("list");
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [detailedReport, setDetailedReport] = useState<AuditDetail | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Form states
  const [contractName, setContractName] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Editor configuration
  const lineCount = sourceCode.split("\n").length;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAudits();
        setAudits(data);
      } catch (err: any) {
        setError(err.message || "Failed to load audit history");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const handleViewReport = async (id: string) => {
    setMode("view");
    setSelectedAuditId(id);
    setReportLoading(true);
    try {
      const detail = await fetchAuditReport(id);
      setDetailedReport(detail);
    } catch (err: any) {
      alert(err.message || "Failed to load audit details");
      setMode("list");
    } finally {
      setReportLoading(false);
    }
  };

  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCode.trim()) {
      alert("Please paste Solidity source code first.");
      return;
    }
    if (sourceCode.length > 200000) {
      alert("Source code exceeds maximum character limit of 200,000.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await submitAudit({
        contract_name: contractName || "Contract.sol",
        source_code: sourceCode,
      });
      setAudits((prev) => [created, ...prev]);
      handleViewReport(created.id);
    } catch (err: any) {
      alert(err.message || "Audit submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskColor = (risk: string | null) => {
    if (!risk) return "text-neutral-400";
    switch (risk) {
      case "critical":
        return "text-red-500 border-red-500/20 bg-red-500/10";
      case "high":
        return "text-orange-500 border-orange-500/20 bg-orange-500/10";
      case "medium":
        return "text-yellow-500 border-yellow-500/20 bg-yellow-500/10";
      case "low":
        return "text-blue-500 border-blue-500/20 bg-blue-500/10";
      default:
        return "text-neutral-400 border-neutral-500/20 bg-neutral-500/10";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Smart Contract Auditor</h2>
          <p className="text-sm text-muted-foreground">Scan Solidity contracts for critical exploits using LLMs and static analyzers.</p>
        </div>
        {mode === "list" && (
          <Button
            className="neon-glow bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            onClick={() => {
              setContractName("");
              setSourceCode("");
              setMode("submit");
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Audit Contract
          </Button>
        )}
      </div>

      {/* Mode Switch: 1. List Audits */}
      {mode === "list" && (
        <div className="space-y-6">
          {/* Quick Statistics Banner */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total Contracts Audited", val: audits.length, icon: FileCode, col: "text-neon-blue" },
              { label: "Critical Vulnerabilities Flaged", val: audits.reduce((acc, curr) => acc + curr.critical_count, 0), icon: ShieldAlert, col: "text-red-500" },
              { label: "High Vulnerabilities Flagged", val: audits.reduce((acc, curr) => acc + curr.high_count, 0), icon: AlertTriangle, col: "text-orange-500" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 font-heading text-xl font-bold">{stat.val}</p>
                  </div>
                  <div className={`rounded-lg bg-surface-slate/85 p-2.5 ${stat.col} border border-border-muted`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit Log Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border-muted">
              <h3 className="font-heading font-semibold text-base">Security Reports History</h3>
              <p className="text-xs text-muted-foreground">Vulnerability details linked to contract cryptographic hashes.</p>
            </div>

            {audits.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No contract audits found. Paste code to run your first check.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-muted bg-surface-slate/40 text-muted-foreground uppercase font-bold tracking-wider text-[10px]">
                      <th className="p-4">Contract Name</th>
                      <th className="p-4">Source Hash</th>
                      <th className="p-4 text-center">Issues (C/H/M/L)</th>
                      <th className="p-4">Overall Risk</th>
                      <th className="p-4">Scanned Date</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted/50">
                    {audits.map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          {a.contract_name}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground">
                          {a.source_hash.slice(0, 12)}...
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <span className="h-5 min-w-5 px-1 rounded-full bg-red-500/10 text-red-500 font-mono text-[10px] flex items-center justify-center font-bold">
                              {a.critical_count}
                            </span>
                            <span className="h-5 min-w-5 px-1 rounded-full bg-orange-500/10 text-orange-500 font-mono text-[10px] flex items-center justify-center font-bold">
                              {a.high_count}
                            </span>
                            <span className="h-5 min-w-5 px-1 rounded-full bg-yellow-500/10 text-yellow-500 font-mono text-[10px] flex items-center justify-center font-bold">
                              {a.medium_count}
                            </span>
                            <span className="h-5 min-w-5 px-1 rounded-full bg-blue-500/10 text-blue-500 font-mono text-[10px] flex items-center justify-center font-bold">
                              {a.low_count}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-mono capitalize ${getRiskColor(a.overall_risk)}`}>
                            {a.overall_risk ?? "unknown"}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-neon-blue hover:bg-neon-blue/10 h-7 text-[10px] px-3"
                            onClick={() => void handleViewReport(a.id)}
                          >
                            View Report
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode Switch: 2. Submit New Audit */}
      {mode === "submit" && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Form and Code Area */}
          <div className="lg:col-span-8 space-y-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-semibold text-base">Paste Smart Contract</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground border border-border-muted/50 hover:bg-white/5"
                  onClick={() => setMode("list")}
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to History
                </Button>
              </div>

              <form onSubmit={handleSubmitAudit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contract Filename (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded border border-border-muted bg-surface-obsidian p-2.5 text-sm focus:border-neon-blue focus:outline-none"
                    placeholder="e.g. LiquidityPool.sol"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Solidity Code Editor *
                    </label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {lineCount} lines | {sourceCode.length}/200,000 chars
                    </span>
                  </div>
                  <div className="relative border border-border-muted rounded bg-surface-obsidian overflow-hidden">
                    {/* Simulated editor lines */}
                    <div className="absolute left-0 top-0 bottom-0 w-11 bg-surface-slate text-right pr-2 pt-3 font-mono text-[10px] text-muted-foreground/40 select-none border-r border-border-muted/50">
                      {Array.from({ length: Math.min(lineCount, 50) }, (_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                      {lineCount > 50 && <div>...</div>}
                    </div>
                    <textarea
                      required
                      rows={18}
                      className="w-full bg-transparent p-3 pl-14 font-mono text-xs text-foreground focus:outline-none resize-none leading-5"
                      placeholder={`// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\ncontract MyContract {\n    // Paste code here...\n}`}
                      value={sourceCode}
                      onChange={(e) => setSourceCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border-muted hover:bg-white/5"
                    onClick={() => setMode("list")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6"
                  >
                    {submitting ? "Analyzing Exploits..." : "Start Security Audit"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Quick tips sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-border-muted pb-3">
                <Sparkles className="h-4 w-4" /> AI Scanner Rules
              </h4>
              <ul className="space-y-3 text-[11px] leading-relaxed text-muted-foreground list-disc pl-4">
                <li>Looks for **Reentrancy exploits** (external calls before updates).</li>
                <li>Flags critical access-control breaches (missing `onlyOwner` modifiers).</li>
                <li>Identifies integers overflows, uninitialized state arrays, and float compiler floats.</li>
                <li>Recommends standard implementation models from OpenZeppelin.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switch: 3. View Report Detail */}
      {mode === "view" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="border-border-muted hover:bg-white/5 text-xs text-muted-foreground"
              onClick={() => {
                setDetailedReport(null);
                setMode("list");
              }}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to History
            </Button>

            {detailedReport && (
              <span className={`rounded-full border px-3 py-1 font-mono text-xs uppercase ${getRiskColor(detailedReport.overall_risk)}`}>
                Overall Risk: {detailedReport.overall_risk}
              </span>
            )}
          </div>

          {reportLoading || !detailedReport ? (
            <div className="flex h-[30vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* Vulnerabilities scan results (Col 8) */}
              <div className="lg:col-span-8 space-y-6">
                {/* AI Summary card */}
                <div className="glass-card p-6 border-l-4 border-l-amber-500">
                  <h3 className="font-heading font-semibold text-base flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                    AI Auditor Executive Summary
                  </h3>
                  <p className="mt-4 text-xs text-foreground leading-relaxed bg-surface-obsidian/30 p-4 rounded border border-border-muted">
                    {detailedReport.report_summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted-foreground font-mono">
                    <div className="flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5 text-neon-blue" />
                      <span>Scanner: {detailedReport.ai_model_used}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-neon-purple" />
                      <span>Speed: {detailedReport.processing_ms} ms</span>
                    </div>
                  </div>
                </div>

                {/* Specific vulnerabilities */}
                <div className="space-y-4">
                  <h3 className="font-heading font-semibold text-base">Identified Security Issues</h3>
                  {!detailedReport.report_json?.vulnerabilities ||
                  detailedReport.report_json.vulnerabilities.length === 0 ? (
                    <div className="glass-card p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                      No significant vulnerabilities detected. Clean contract compilation!
                    </div>
                  ) : (
                    detailedReport.report_json.vulnerabilities.map((v: any, index: number) => (
                      <div key={index} className="glass-card p-5 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                            <span className="h-5 w-5 text-xs rounded bg-surface-slate border border-border-muted flex items-center justify-center font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                            {v.title}
                          </h4>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono capitalize ${getSeverityColor(v.severity)}`}>
                            {v.severity}
                          </span>
                        </div>
                        <div className="text-xs leading-relaxed text-muted-foreground space-y-2.5">
                          <p>{v.description}</p>
                          <div className="bg-surface-obsidian/40 border border-border-muted/80 p-3 rounded text-[11px] text-foreground">
                            <p className="font-semibold text-[9px] uppercase tracking-wider text-neon-blue mb-1">Recommendation</p>
                            <p>{v.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Source code review tab (Col 4) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="glass-card p-5 space-y-4 h-[600px] flex flex-col">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border-muted pb-3">
                    <Code className="h-4 w-4 text-neon-blue" /> Source File Snippet
                  </h4>
                  <div className="flex-1 rounded bg-surface-obsidian p-3 font-mono text-[10px] text-muted-foreground overflow-y-auto leading-relaxed border border-border-muted whitespace-pre-wrap select-text">
                    {detailedReport.source_code || `// Source code unavailable\n// Hash: ${detailedReport.source_hash}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
