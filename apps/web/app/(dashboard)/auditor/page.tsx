"use client";

import { useEffect, useRef, useState } from "react";
import { fetchAudits, fetchAuditReport, AuditPublic, AuditDetail } from "@/lib/api/client";
import { ShieldAlert, Code, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  DataTableHeader,
  DataTableContent,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTableHeadCell,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────

type ProgressEvent = { event: "progress"; text: string };
type CompleteEvent = { event: "complete"; report: Record<string, any> };
type ErrorEvent = { event: "error"; text: string };
type SSEEvent = ProgressEvent | CompleteEvent | ErrorEvent;

// ─── Component ────────────────────────────────────────────────────────────

export default function ContractAuditorPage() {
  const [audits, setAudits] = useState<AuditPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AuditDetail | null>(null);

  // SSE analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({
    contract_name: "",
    language: "Solidity",
    source_code: "",
  });

  // ── Load existing audits ──────────────────────────────────────────────

  useEffect(() => {
    void loadAudits();
  }, []);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const data = await fetchAudits();
      setAudits(data);
    } catch (err: any) {
      setError(err.message || "Failed to load audit history");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit + SSE stream ───────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source_code.trim()) return;

    setIsAnalyzing(true);
    setProgressMessages(["Starting AI security scan..."]);
    setAnalyzeError(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/v1/auditor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contract_name: formData.contract_name || null,
          source_code: formData.source_code,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.detail ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      const completedAuditId: string | null = res.headers.get("X-Audit-Id");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") continue;

          try {
            const evt = JSON.parse(raw) as SSEEvent;
            if (evt.event === "progress") {
              setProgressMessages((p) => [...p, evt.text]);
            } else if (evt.event === "complete") {
              setProgressMessages((p) => [...p, "Analysis complete!"]);
              // Reload the audit list so the new record appears
              await loadAudits();
              setIsSubmitOpen(false);
              // Auto-open the report
              if (completedAuditId) {
                const detail = await fetchAuditReport(completedAuditId);
                setSelectedReport(detail);
              }
            } else if (evt.event === "error") {
              setAnalyzeError(evt.text);
            }
          } catch {
            // ignore parse errors in stream
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setAnalyzeError(err.message || "Analysis failed");
      }
    } finally {
      setIsAnalyzing(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsAnalyzing(false);
    setProgressMessages([]);
  };

  const handleOpenSubmit = () => {
    setFormData({ contract_name: "", language: "Solidity", source_code: "" });
    setProgressMessages([]);
    setAnalyzeError(null);
    setIsSubmitOpen(true);
  };

  const handleViewReport = async (id: string) => {
    try {
      const detail = await fetchAuditReport(id);
      setSelectedReport(detail);
    } catch (err: any) {
      alert(err.message || "Failed to load audit details");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────

  const getSeverityVariant = (
    severity: string
  ): "danger" | "warning" | "info" | "neutral" => {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "neutral";
    }
  };

  const getRiskScore = (a: AuditPublic | AuditDetail) => {
    if (a.overall_risk === "critical") return 20;
    if (a.overall_risk === "high") return 40;
    if (a.overall_risk === "medium") return 70;
    if (a.overall_risk === "low") return 95;
    return 100;
  };

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) return <PageSpinner label="Loading audit history..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Smart Contract Auditor"
        description="AI-powered security analysis with SSE streaming. Paste Solidity code for an instant vulnerability report."
        action={
          <Button
            className="neon-glow bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            onClick={handleOpenSubmit}
          >
            <ShieldAlert className="mr-2 h-4 w-4" /> New Audit
          </Button>
        }
      />

      {/* Audit history table */}
      <DataTable>
        <DataTableHeader>
          <h3 className="font-heading font-semibold text-base">Audit History</h3>
          <p className="text-xs text-muted-foreground">
            Past vulnerability reports and security scores.
          </p>
        </DataTableHeader>

        {audits.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No Audits Performed"
            description="Submit a smart contract to generate your first AI security report."
            action={
              <Button variant="outline" onClick={handleOpenSubmit}>
                Start Audit
              </Button>
            }
          />
        ) : (
          <DataTableContent>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Contract Name</DataTableHeadCell>
                <DataTableHeadCell>Language</DataTableHeadCell>
                <DataTableHeadCell className="text-center">Score</DataTableHeadCell>
                <DataTableHeadCell className="text-center">Issues</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell>Date</DataTableHeadCell>
                <DataTableHeadCell className="text-right">Actions</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {audits.map((a) => (
                <DataTableRow key={a.id}>
                  <DataTableCell className="font-semibold text-foreground">
                    {a.contract_name || "Contract.sol"}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="neutral">Solidity</Badge>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    {a.status === "complete" ? (
                      <span
                        className={`font-mono font-bold ${
                          getRiskScore(a) >= 80
                            ? "text-emerald-400"
                            : getRiskScore(a) >= 60
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {getRiskScore(a)}/100
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <span className="font-mono text-muted-foreground">
                      {a.status === "complete"
                        ? `${(a.critical_count || 0) + (a.high_count || 0) + (a.medium_count || 0) + (a.low_count || 0)} found`
                        : "—"}
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={
                        a.status === "complete"
                          ? "success"
                          : a.status === "failed"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {a.status}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    {a.status === "complete" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 py-1 px-3 text-[10px] h-7"
                        onClick={() => handleViewReport(a.id)}
                      >
                        View Report
                      </Button>
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableContent>
        )}
      </DataTable>

      {/* ── Submit / Analysis Dialog ── */}
      <Dialog open={isSubmitOpen} onClose={() => !isAnalyzing && setIsSubmitOpen(false)}>
        {!isAnalyzing && <DialogCloseButton onClose={() => setIsSubmitOpen(false)} />}
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-amber-500" />
            <DialogTitle>
              {isAnalyzing ? "AI Security Scan Running..." : "Submit Code for Audit"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          {isAnalyzing ? (
            /* Progress view */
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-semibold">Analyzing with AI…</span>
              </div>
              <div className="rounded bg-[#0d1117] border border-neutral-800 p-4 font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto">
                {progressMessages.map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-400">
                    <span className="text-emerald-600">›</span> {msg}
                  </div>
                ))}
              </div>
              {analyzeError && (
                <div className="flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {analyzeError}
                </div>
              )}
            </div>
          ) : (
            /* Input form */
            <form onSubmit={handleSubmit} className="space-y-4" id="audit-form">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contract Name
                  </label>
                  <Input
                    placeholder="e.g. StakingRewards.sol"
                    value={formData.contract_name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, contract_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Language
                  </label>
                  <Select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, language: e.target.value }))
                    }
                  >
                    <option value="Solidity">Solidity</option>
                    <option value="Vyper">Vyper</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                  <span>Source Code *</span>
                  <span className="text-neutral-500 normal-case font-normal">
                    Paste raw Solidity
                  </span>
                </label>
                <Textarea
                  required
                  rows={14}
                  className="font-mono text-xs bg-[#0d1117] border-neutral-800 focus:border-amber-500/50"
                  placeholder={"// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Vulnerable {\n  ...\n}"}
                  value={formData.source_code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, source_code: e.target.value }))
                  }
                />
              </div>
            </form>
          )}
        </DialogBody>
        <DialogFooter>
          {isAnalyzing ? (
            <Button
              type="button"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={handleCancel}
            >
              Cancel Scan
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="border-border-muted hover:bg-white/5"
                onClick={() => setIsSubmitOpen(false)}
              >
                Cancel
              </Button>
              <Button
                form="audit-form"
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6"
              >
                Run Security Scan
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* ── Report Viewer Dialog ── */}
      <Dialog open={!!selectedReport} onClose={() => setSelectedReport(null)}>
        {selectedReport && (
          <>
            <DialogCloseButton onClose={() => setSelectedReport(null)} />
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <DialogTitle>Security Audit Report</DialogTitle>
              </div>
            </DialogHeader>
            <DialogBody className="max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-border-muted/50 pb-4">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {selectedReport.contract_name || "Contract.sol"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Scanned {new Date(selectedReport.created_at).toLocaleString()} ·{" "}
                      {selectedReport.ai_model_used} ·{" "}
                      {selectedReport.processing_ms
                        ? `${(selectedReport.processing_ms / 1000).toFixed(1)}s`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Security Score
                    </p>
                    <p
                      className={`font-mono text-2xl font-bold ${
                        getRiskScore(selectedReport) >= 80
                          ? "text-emerald-400"
                          : getRiskScore(selectedReport) >= 60
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {getRiskScore(selectedReport)}/100
                    </p>
                  </div>
                </div>

                {/* Executive Summary */}
                {selectedReport.report_json?.executive_summary && (
                  <div className="rounded border border-border-muted bg-surface-obsidian/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Executive Summary
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {selectedReport.report_json.executive_summary}
                    </p>
                  </div>
                )}

                {/* Severity counts */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Critical", count: selectedReport.critical_count, color: "text-red-500 border-red-500/20 bg-red-500/5" },
                    { label: "High", count: selectedReport.high_count, color: "text-orange-400 border-orange-400/20 bg-orange-400/5" },
                    { label: "Medium", count: selectedReport.medium_count, color: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" },
                    { label: "Low", count: selectedReport.low_count, color: "text-blue-400 border-blue-400/20 bg-blue-400/5" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded border p-3 text-center ${s.color}`}
                    >
                      <p className="text-2xl font-bold font-mono">{s.count || 0}</p>
                      <p className="text-[10px] uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Vulnerabilities */}
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Identified Vulnerabilities (
                    {(selectedReport.report_json?.vulnerabilities || []).length})
                  </h4>

                  {(!selectedReport.report_json?.vulnerabilities ||
                    selectedReport.report_json.vulnerabilities.length === 0) ? (
                    <div className="rounded bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      No known vulnerabilities detected. The code appears structurally sound.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedReport.report_json.vulnerabilities.map(
                        (v: any, i: number) => (
                          <div
                            key={i}
                            className="rounded border border-border-muted bg-surface-obsidian p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="font-mono text-[10px] text-muted-foreground mr-2">
                                  {v.id}
                                </span>
                                <span className="font-semibold text-sm">{v.title}</span>
                              </div>
                              <Badge variant={getSeverityVariant(v.severity)}>
                                {v.severity}
                              </Badge>
                            </div>
                            {v.line_hint && (
                              <p className="text-[10px] font-mono text-amber-500/70 mb-2">
                                @ {v.line_hint}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                              {v.description}
                            </p>
                            <div className="rounded bg-neutral-900 p-2 text-[10px] font-mono text-emerald-400/80 border border-neutral-800">
                              ✓ {v.recommendation}
                            </div>
                            {v.code_fix && (
                              <pre className="mt-2 rounded bg-[#0d1117] p-2 text-[10px] font-mono text-amber-300/80 border border-neutral-800 overflow-x-auto whitespace-pre-wrap">
                                {v.code_fix}
                              </pre>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Best practices */}
                {selectedReport.report_json?.best_practices &&
                  selectedReport.report_json.best_practices.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Best Practices
                    </h4>
                    <ul className="space-y-1">
                      {selectedReport.report_json.best_practices.map(
                        (bp: string, i: number) => (
                          <li key={i} className="text-xs text-foreground flex items-start gap-2">
                            <span className="text-neon-blue mt-0.5">›</span> {bp}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-border-muted hover:bg-white/5"
                onClick={() => setSelectedReport(null)}
              >
                Close Report
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
