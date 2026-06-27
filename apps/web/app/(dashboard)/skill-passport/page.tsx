"use client";

import { useEffect, useState } from "react";
import {
  fetchPassports,
  createPassport,
  mintMockPassportNFT,
  SkillPassportPublic,
} from "@/lib/api/client";
import {
  Award,
  Plus,
  ExternalLink,
  Cpu,
  FileText,
  BadgeAlert,
  BadgeCheck,
  Zap,
  Activity,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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

export default function SkillPassportPage() {
  const [passports, setPassports] = useState<SkillPassportPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Detail state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<SkillPassportPublic["nft_record"] | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    skill_category: "Development",
    skill_name: "",
    evidence_url: "",
    evidence_description: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchPassports();
        setPassports(data);
      } catch (err: any) {
        setError(err.message || "Failed to load passports");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const handleOpenSubmit = () => {
    setFormData({
      skill_category: "Development",
      skill_name: "",
      evidence_url: "",
      evidence_description: "",
    });
    setIsSubmitOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.skill_name || !formData.evidence_url) {
      alert("Please fill in required fields.");
      return;
    }

    try {
      const created = await createPassport(formData);
      setPassports((prev) => [created, ...prev]);
      setIsSubmitOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to submit passport");
    }
  };

  const handleMint = async (id: string) => {
    try {
      const updated = await mintMockPassportNFT(id);
      setPassports((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      alert(err.message || "Failed to mint NFT");
    }
  };

  const getStatusVariant = (status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "orange" | "neutral" => {
    switch (status) {
      case "pending":
        return "warning";
      case "evaluating":
        return "primary";
      case "approved":
        return "secondary";
      case "rejected":
        return "danger";
      case "minting":
        return "orange";
      case "minted":
        return "success";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return <PageSpinner label="Loading skill passports..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ecosystem Reputation Passports"
        description="Verify coding skills, build validated profiles, and link credentials on-chain."
        action={
          <Button className="neon-glow bg-neon-purple hover:bg-neon-purple/80 text-white" onClick={handleOpenSubmit}>
            <Plus className="mr-2 h-4 w-4" /> Verify Skill
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Skills", val: passports.length, icon: Award, col: "text-neon-blue" },
          { label: "On-Chain Passports", val: passports.filter((p) => p.status === "minted").length, icon: Cpu, col: "text-neon-purple" },
          { label: "Review Pending", val: passports.filter((p) => p.status === "pending").length, icon: FileText, col: "text-yellow-400" },
          { label: "Ecosystem Reputation Score", val: "A+", icon: BadgeCheck, col: "text-emerald-400" },
        ].map((stat, i) => (
          <StatCard 
            key={i}
            title={stat.label}
            value={stat.val}
            icon={stat.icon}
            iconColor={stat.col}
            gradientColor="from-transparent to-transparent" // Disable glow for mini cards
            className="p-4 py-4"
          />
        ))}
      </div>

      <DataTable>
        <DataTableHeader>
          <h3 className="font-heading font-semibold text-base">Verified Skills Index</h3>
          <p className="text-xs text-muted-foreground">Each item represents a distinct developer credentials evaluation linked to your address.</p>
        </DataTableHeader>

        {passports.length === 0 ? (
          <EmptyState 
            title="No Skill Passports"
            description="Submit a repository or proof of work to start building your verified reputation."
            action={<Button variant="outline" onClick={handleOpenSubmit}>Submit Proof</Button>}
          />
        ) : (
          <DataTableContent>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Skill Category</DataTableHeadCell>
                <DataTableHeadCell>Skill Name</DataTableHeadCell>
                <DataTableHeadCell>Evidence</DataTableHeadCell>
                <DataTableHeadCell className="text-center">Score</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell className="text-right">Actions</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {passports.map((p) => (
                <DataTableRow key={p.id}>
                  <DataTableCell className="font-semibold text-foreground">{p.skill_category}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">{p.skill_name}</DataTableCell>
                  <DataTableCell>
                    <a
                      href={p.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-neon-blue hover:underline font-mono"
                    >
                      Proof link <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </DataTableCell>
                  <DataTableCell className="text-center font-mono font-bold text-foreground">
                    {p.evaluation_score > 0 ? `${p.evaluation_score}/100` : "—"}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={getStatusVariant(p.status)} pulse={p.status === "evaluating" || p.status === "minting"}>
                      {p.status}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === "approved" && (
                        <Button
                          size="sm"
                          className="bg-neon-purple hover:bg-neon-purple/80 text-white py-1 px-3 text-[10px] h-7"
                          onClick={() => void handleMint(p.id)}
                        >
                          <Zap className="mr-1 h-3 w-3" /> Mint SBT NFT
                        </Button>
                      )}
                      {p.status === "minted" && p.nft_record && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-neon-blue/20 text-neon-blue hover:bg-neon-blue/10 py-1 px-3 text-[10px] h-7"
                          onClick={() => setSelectedNft(p.nft_record || null)}
                        >
                          View NFT Receipt
                        </Button>
                      )}
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableContent>
        )}
      </DataTable>

      <Dialog open={!!selectedNft} onClose={() => setSelectedNft(null)}>
        {selectedNft && (
          <>
            <DialogCloseButton onClose={() => setSelectedNft(null)} />
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-neon-purple" />
                <DialogTitle>Soulbound NFT Record</DialogTitle>
              </div>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-3 border-b border-border-muted/50 pb-2">
                  <span className="text-muted-foreground">Token ID:</span>
                  <span className="col-span-2 text-foreground font-bold">{selectedNft.token_id}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-border-muted/50 pb-2">
                  <span className="text-muted-foreground">Smart Contract:</span>
                  <span className="col-span-2 text-foreground break-all">{selectedNft.contract_address}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-border-muted/50 pb-2">
                  <span className="text-muted-foreground">Chain ID:</span>
                  <span className="col-span-2 text-foreground">{selectedNft.chain_id} (Polygon Amoy Testnet)</span>
                </div>
                <div className="grid grid-cols-3 border-b border-border-muted/50 pb-2">
                  <span className="text-muted-foreground">Tx Hash:</span>
                  <span className="col-span-2 text-neon-blue break-all">{selectedNft.tx_hash}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-border-muted/50 pb-2">
                  <span className="text-muted-foreground">Block Number:</span>
                  <span className="col-span-2 text-foreground">{selectedNft.block_number}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">Minted At:</span>
                  <span className="col-span-2 text-foreground">{new Date(selectedNft.minted_at).toLocaleString()}</span>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-border-muted hover:bg-white/5"
                onClick={() => setSelectedNft(null)}
              >
                Close Receipt
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      <Dialog open={isSubmitOpen} onClose={() => setIsSubmitOpen(false)}>
        <DialogCloseButton onClose={() => setIsSubmitOpen(false)} />
        <DialogHeader>
          <DialogTitle>Submit Skill Verification Request</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4" id="skill-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Skill Category
                </label>
                <Select
                  value={formData.skill_category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, skill_category: e.target.value }))}
                >
                  <option value="Development">Software Development</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Design">UI/UX Design</option>
                  <option value="Marketing">Marketing / Tokenomics</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Skill Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Solidity, Next.js, Rust"
                  value={formData.skill_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, skill_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Proof of Work URL *
              </label>
              <Input
                type="url"
                required
                placeholder="https://github.com/your-username/your-repo"
                value={formData.evidence_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, evidence_url: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence Description
              </label>
              <Textarea
                rows={3}
                placeholder="Summarize the core accomplishments inside this proof of work..."
                value={formData.evidence_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, evidence_description: e.target.value }))}
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
          <Button form="skill-form" type="submit" className="bg-neon-purple hover:bg-neon-purple/80 text-white font-semibold px-6">
            Submit Proof
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
