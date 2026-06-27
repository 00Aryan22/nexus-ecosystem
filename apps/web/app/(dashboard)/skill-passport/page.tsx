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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "evaluating":
        return "bg-blue-500/10 text-neon-blue border-blue-500/20 animate-pulse";
      case "approved":
        return "bg-purple-500/10 text-neon-purple border-purple-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "minting":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse";
      case "minted":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
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
      {/* Top title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Ecosystem Reputation Passports</h2>
          <p className="text-sm text-muted-foreground">Verify coding skills, build validated profiles, and link credentials on-chain.</p>
        </div>
        <Button className="neon-glow bg-neon-purple hover:bg-neon-purple/80 text-white" onClick={handleOpenSubmit}>
          <Plus className="mr-2 h-4 w-4" /> Verify Skill
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Skills", val: passports.length, icon: Award, col: "text-neon-blue" },
          { label: "On-Chain Passports", val: passports.filter((p) => p.status === "minted").length, icon: Cpu, col: "text-neon-purple" },
          { label: "Review Pending", val: passports.filter((p) => p.status === "pending").length, icon: FileText, col: "text-yellow-400" },
          { label: "Ecosystem Reputation Score", val: "A+", icon: BadgeCheck, col: "text-emerald-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-heading text-xl font-bold">{stat.val}</p>
              </div>
              <div className={`rounded-lg bg-surface-slate/80 p-2.5 ${stat.col} border border-border-muted`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Passports Table / Workspace */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border-muted">
          <h3 className="font-heading font-semibold text-base">Verified Skills Index</h3>
          <p className="text-xs text-muted-foreground">Each item represents a distinct developer credentials evaluation linked to your address.</p>
        </div>

        {passports.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No skill passports verified yet. Submit a repository to verify!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-muted bg-surface-slate/40 text-muted-foreground uppercase font-bold tracking-wider text-[10px]">
                  <th className="p-4">Skill Category</th>
                  <th className="p-4">Skill Name</th>
                  <th className="p-4">Evidence</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/50">
                {passports.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-semibold text-foreground">{p.skill_category}</td>
                    <td className="p-4 text-muted-foreground">{p.skill_name}</td>
                    <td className="p-4">
                      <a
                        href={p.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-neon-blue hover:underline font-mono"
                      >
                        Proof link <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-foreground">
                      {p.evaluation_score > 0 ? `${p.evaluation_score}/100` : "—"}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-mono capitalize ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NFT Details custom Modal */}
      {selectedNft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 relative bg-surface-slate shadow-2xl border border-border">
            <button
              onClick={() => setSelectedNft(null)}
              className="absolute right-4 top-4 rounded p-1 hover:bg-white/5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-neon-purple" />
              <h3 className="font-heading text-lg font-bold tracking-tight">
                Soulbound NFT Record
              </h3>
            </div>

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

            <div className="mt-8 flex justify-end">
              <Button
                variant="outline"
                className="border-border-muted hover:bg-white/5"
                onClick={() => setSelectedNft(null)}
              >
                Close Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Verification request Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 relative bg-surface-slate shadow-2xl border border-border">
            <button
              onClick={() => setIsSubmitOpen(false)}
              className="absolute right-4 top-4 rounded p-1 hover:bg-white/5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-heading text-lg font-bold tracking-tight mb-6">
              Submit Skill Verification Request
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Skill Category
                  </label>
                  <select
                    className="w-full rounded border border-border-muted bg-surface-obsidian p-2.5 text-sm focus:border-neon-blue focus:outline-none"
                    value={formData.skill_category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, skill_category: e.target.value }))}
                  >
                    <option value="Development">Software Development</option>
                    <option value="Product Management">Product Management</option>
                    <option value="Design">UI/UX Design</option>
                    <option value="Marketing">Marketing / Tokenomics</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded border border-border-muted bg-surface-obsidian p-2.5 text-sm focus:border-neon-blue focus:outline-none"
                    placeholder="e.g. Solidity, Next.js, Rust"
                    value={formData.skill_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, skill_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proof of Work URL * (GitHub repository, portfolio item)
                </label>
                <input
                  type="url"
                  required
                  className="w-full rounded border border-border-muted bg-surface-obsidian p-2.5 text-sm focus:border-neon-blue focus:outline-none"
                  placeholder="https://github.com/your-username/your-repo"
                  value={formData.evidence_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, evidence_url: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Evidence Description (details about the proof)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded border border-border-muted bg-surface-obsidian p-2.5 text-sm focus:border-neon-blue focus:outline-none resize-none"
                  placeholder="Summarize the core accomplishments inside this proof of work..."
                  value={formData.evidence_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, evidence_description: e.target.value }))}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border-muted hover:bg-white/5"
                  onClick={() => setIsSubmitOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/80 text-white font-semibold px-6">
                  Submit Proof
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
