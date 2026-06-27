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
  Code,
  CheckCircle2,
} from "lucide-react";
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

export default function ContractAuditorPage() {
  const [audits, setAudits] = useState<AuditPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AuditDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    contract_name: "",
    language: "Solidity",
    source_code: "",
  });

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

  const handleOpenSubmit = () => {
    setFormData({ contract_name: "", language: "Solidity", source_code: "" });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await submitAudit(formData);
      setAudits((prev) => [created, ...prev]);
      setIsSubmitOpen(false);
    } catch (err: any) {
      alert(err.message || "Audit submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityVariant = (severity: string): "danger" | "warning" | "info" | "neutral" => {
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

  const getRiskScore = (a: AuditPublic) => {
    if (a.overall_risk === "critical") return 20;
    if (a.overall_risk === "high") return 40;
    if (a.overall_risk === "medium") return 70;
    if (a.overall_risk === "low") return 95;
    return 100;
  };

  if (loading) {
    return <PageSpinner label="Loading audit history..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Smart Contract Auditor"
        description="Paste your Solidity code to instantly generate a comprehensive security vulnerability report."
        action={
          <Button className="neon-glow bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={handleOpenSubmit}>
            <ShieldAlert className="mr-2 h-4 w-4" /> New Audit
          </Button>
        }
      />

      <DataTable>
        <DataTableHeader>
          <h3 className="font-heading font-semibold text-base">Audit History</h3>
          <p className="text-xs text-muted-foreground">Past vulnerability reports and security scores.</p>
        </DataTableHeader>

        {audits.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No Audits Performed"
            description="Submit a smart contract to generate your first AI security report."
            action={<Button variant="outline" onClick={handleOpenSubmit}>Start Audit</Button>}
          />
        ) : (
          <DataTableContent>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Contract Name</DataTableHeadCell>
                <DataTableHeadCell>Language</DataTableHeadCell>
                <DataTableHeadCell className="text-center">Score</DataTableHeadCell>
                <DataTableHeadCell className="text-center">Vulnerabilities</DataTableHeadCell>
                <DataTableHeadCell>Date</DataTableHeadCell>
                <DataTableHeadCell className="text-right">Actions</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {audits.map((a) => (
                <DataTableRow key={a.id}>
                  <DataTableCell className="font-semibold text-foreground">{a.contract_name || "Contract.sol"}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="neutral">Solidity</Badge>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <span className={`font-mono font-bold ${getRiskScore(a) >= 80 ? "text-emerald-400" : getRiskScore(a) >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                      {getRiskScore(a)}/100
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <span className="font-mono text-muted-foreground">
                      {(a.critical_count || 0) + (a.high_count || 0) + (a.medium_count || 0) + (a.low_count || 0)} found
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 py-1 px-3 text-[10px] h-7"
                      onClick={() => handleViewReport(a.id)}
                    >
                      View Report
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableContent>
        )}
      </DataTable>

      <Dialog open={isSubmitOpen} onClose={() => setIsSubmitOpen(false)}>
        <DialogCloseButton onClose={() => setIsSubmitOpen(false)} />
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-amber-500" />
            <DialogTitle>Submit Code for Audit</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4" id="audit-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contract Name *
                </label>
                <Input
                  required
                  placeholder="e.g. StakingRewards.sol"
                  value={formData.contract_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contract_name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Language
                </label>
                <Select
                  value={formData.language}
                  onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                >
                  <option value="Solidity">Solidity</option>
                  <option value="Rust">Rust (Solana/Near)</option>
                  <option value="Move">Move (Aptos/Sui)</option>
                  <option value="Vyper">Vyper</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>Source Code *</span>
                <span className="text-neutral-500 normal-case font-normal">Paste your raw contract code</span>
              </label>
              <Textarea
                required
                rows={12}
                className="font-mono text-xs whitespace-pre bg-[#0d1117] border-neutral-800 focus:border-amber-500/50"
                placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.0;&#10;&#10;contract Vulnerable {&#10;  ...&#10;}"
                value={formData.source_code}
                onChange={(e) => setFormData((prev) => ({ ...prev, source_code: e.target.value }))}
              />
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Scanning..." : "Run Security Scan"}
          </Button>
        </DialogFooter>
      </Dialog>

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
                <div className="flex items-center justify-between border-b border-border-muted/50 pb-4">
                  <div>
                    <h4 className="font-semibold text-foreground">{selectedReport.contract_name}</h4>
                    <p className="text-xs text-muted-foreground">Scanned {new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Security Score</p>
                    <p className={`font-mono text-2xl font-bold ${getRiskScore(selectedReport) >= 80 ? "text-emerald-400" : getRiskScore(selectedReport) >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                      {getRiskScore(selectedReport)}/100
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Identified Vulnerabilities ({(selectedReport.report_json?.vulnerabilities || []).length})
                  </h4>
                  
                  {(!selectedReport.report_json?.vulnerabilities || selectedReport.report_json.vulnerabilities.length === 0) ? (
                    <div className="rounded bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 text-sm flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      No known vulnerabilities detected. The code appears structurally sound.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedReport.report_json.vulnerabilities.map((v: any, i: number) => (
                        <div key={i} className="rounded border border-border-muted bg-surface-obsidian p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-sm">{v.type}</div>
                            <Badge variant={getSeverityVariant(v.severity)}>
                              {v.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{v.description}</p>
                          <div className="rounded bg-neutral-900 p-2 text-[10px] font-mono text-amber-500/80 border border-neutral-800">
                            {v.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
