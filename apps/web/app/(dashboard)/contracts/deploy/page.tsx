"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Rocket,
  Code,
  FileCode,
  Fuel,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { StatusBanner } from "@/components/ui/status-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

// ─── Types ────────────────────────────────────────────────────────────────

type DeployStatus = "idle" | "estimating" | "deploying" | "success" | "error";

type DeployStep = {
  label: string;
  key: string;
  icon: typeof Code;
  status: "pending" | "active" | "done";
};

type DeploymentRecord = {
  id: string;
  contractName: string;
  contractAddress: string;
  transactionHash: string;
  abi: string;
  deployerAddress: string;
  timestamp: number;
  chain: string;
};

const STEPS: DeployStep[] = [
  { label: "Compiling Solidity", key: "compile", icon: Code, status: "pending" },
  { label: "Deploying to Chain", key: "deploy", icon: Rocket, status: "pending" },
  { label: "Verifying Contract", key: "verify", icon: CheckCircle2, status: "pending" },
  { label: "Generating ABI", key: "abi", icon: FileCode, status: "pending" },
];

const CHAINS = [
  { value: "ethereum-sepolia", label: "Ethereum Sepolia" },
  { value: "ethereum-mainnet", label: "Ethereum Mainnet" },
  { value: "polygon-amoy", label: "Polygon Amoy" },
  { value: "arbitrum-sepolia", label: "Arbitrum Sepolia" },
  { value: "optimism-sepolia", label: "Optimism Sepolia" },
  { value: "base-sepolia", label: "Base Sepolia" },
];

const STORAGE_KEY = "nexus_deploy_history";

function loadHistory(): DeploymentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeploymentRecord[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: DeploymentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

function generateId() {
  return `dep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function truncateHash(h: string) {
  if (h.length <= 16) return h;
  return `${h.slice(0, 8)}...${h.slice(-6)}`;
}

function simulateDelay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ContractDeployPage() {
  const [history, setHistory] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [contractName, setContractName] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [deployerAddress, setDeployerAddress] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [chain, setChain] = useState("ethereum-sepolia");

  // Deployment state
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [steps, setSteps] = useState<DeployStep[]>(STEPS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    contractAddress: string;
    transactionHash: string;
    abi: string;
  } | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const reset = useCallback(() => {
    setStatus("idle");
    setSteps(STEPS);
    setErrorMessage(null);
    setResult(null);
    setGasEstimate(null);
    setShowResult(false);
  }, []);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
    setLoading(false);
  }, []);

  // ── Gas estimation ────────────────────────────────────────────────────

  const estimateGas = useCallback(async () => {
    if (!sourceCode.trim() || !deployerAddress.trim()) return;
    setStatus("estimating");
    setGasEstimate(null);
    await simulateDelay(1200);
    const eth = (Math.random() * 0.02 + 0.003).toFixed(6);
    const usd = (parseFloat(eth) * 2200).toFixed(2);
    setGasEstimate(`${eth} ETH (~$${usd} USD)`);
    setStatus("idle");
  }, [sourceCode, deployerAddress]);

  // ── Simulate deployment ───────────────────────────────────────────────

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCode.trim() || !deployerAddress.trim()) return;

    setStatus("deploying");
    setErrorMessage(null);
    setResult(null);
    setShowResult(false);

    const updated = steps.map((s) => ({ ...s, status: "pending" as const }));
    setSteps(updated);

    const advance = async (idx: number) => {
      setSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < idx ? "done" : i === idx ? "active" : "pending",
        }))
      );
    };

    try {
      // Step 0: Compiling
      await advance(0);
      await simulateDelay(1800 + Math.random() * 1200);

      // Step 1: Deploying
      await advance(1);
      await simulateDelay(2200 + Math.random() * 1800);

      // Step 2: Verifying
      await advance(2);
      await simulateDelay(1400 + Math.random() * 1000);

      // Step 3: Generating ABI
      await advance(3);
      await simulateDelay(800 + Math.random() * 600);

      // Mark all done
      setSteps((prev) => prev.map((s) => ({ ...s, status: "done" as const })));

      // Build synthetic result
      const address = `0x${Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      const txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      const abi = JSON.stringify(
        [
          {
            type: "function",
            name: "transfer",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
          },
          {
            type: "function",
            name: "balanceOf",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
          },
          {
            type: "constructor",
            inputs: [{ name: "initialSupply", type: "uint256" }],
            stateMutability: "nonpayable",
          },
        ],
        null,
        2
      );

      const deployment: DeploymentRecord = {
        id: generateId(),
        contractName: contractName || "Untitled",
        contractAddress: address,
        transactionHash: txHash,
        abi,
        deployerAddress,
        timestamp: Date.now(),
        chain,
      };

      // Persist
      const updatedHistory = [deployment, ...history];
      setHistory(updatedHistory);
      saveHistory(updatedHistory);

      setResult({ contractAddress: address, transactionHash: txHash, abi });
      setStatus("success");
      setShowResult(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Deployment failed");
      setStatus("error");
    }
  };

  // ── Copy / download helpers ───────────────────────────────────────────

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const downloadAbi = (abi: string, name: string) => {
    const blob = new Blob([abi], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}_abi.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const deleteRecord = (id: string) => {
    const filtered = history.filter((r) => r.id !== id);
    setHistory(filtered);
    saveHistory(filtered);
  };

  // ── Render helpers ────────────────────────────────────────────────────

  const blockExplorerUrl = (address: string) => {
    const base = chain === "ethereum-mainnet" ? "etherscan.io" : `${chain === "ethereum-sepolia" ? "sepolia.etherscan.io" : chain === "polygon-amoy" ? "amoy.polygonscan.com" : chain === "arbitrum-sepolia" ? "sepolia.arbiscan.io" : chain === "optimism-sepolia" ? "sepolia-optimism.etherscan.io" : "sepolia.basescan.org"}`;
    return `https://${base}/address/${address}`;
  };

  const txExplorerUrl = (txHash: string) => {
    const base = chain === "ethereum-mainnet" ? "etherscan.io" : `${chain === "ethereum-sepolia" ? "sepolia.etherscan.io" : chain === "polygon-amoy" ? "amoy.polygonscan.com" : chain === "arbitrum-sepolia" ? "sepolia.arbiscan.io" : chain === "optimism-sepolia" ? "sepolia-optimism.etherscan.io" : "sepolia.basescan.org"}`;
    return `https://${base}/tx/${txHash}`;
  };

  if (loading) return <PageSpinner label="Loading deployment environment..." />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Contract Deployer"
        description="Simulated smart contract deployment. Compile, deploy, verify, and generate ABI for your Solidity contracts."
        action={
          status !== "idle" ? undefined : (
            <Button
              className="neon-glow bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
              onClick={reset}
            >
              <Rocket className="mr-2 h-4 w-4" /> New Deployment
            </Button>
          )
        }
      />

      {/* ── Deployment Form ── */}
      <Card>
        <CardHeader>
          <CardTitle>Deploy Smart Contract</CardTitle>
          <CardDescription>
            Fill in the contract details and deploy to your chosen network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeploy} className="space-y-5" id="deploy-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contract Name
                </label>
                <Input
                  placeholder="e.g. Token.sol"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Network
                </label>
                <Select
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                >
                  {CHAINS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deployer Address *
              </label>
              <Input
                required
                placeholder="0x..."
                value={deployerAddress}
                onChange={(e) => setDeployerAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Initial Supply (for token contracts)
              </label>
              <Input
                placeholder="e.g. 1000000"
                value={initialSupply}
                onChange={(e) => setInitialSupply(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>Solidity Source Code *</span>
                <span className="text-neutral-500 normal-case font-normal">
                  Paste raw Solidity
                </span>
              </label>
              <Textarea
                required
                rows={12}
                className="font-mono text-xs bg-[#0d1117] border-neutral-800 focus:border-emerald-500/50"
                placeholder={
                  "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract MyToken {\n    string public name;\n    string public symbol;\n    uint8 public decimals;\n    uint256 public totalSupply;\n\n    constructor(uint256 _initialSupply) {\n        totalSupply = _initialSupply;\n    }\n}"
                }
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            {gasEstimate && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-white/5 rounded-lg px-3 py-1.5 border border-border-muted/50">
                <Fuel className="h-3.5 w-3.5 text-emerald-400" />
                Est. {gasEstimate}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 text-[10px] h-7"
              onClick={estimateGas}
              disabled={status === "estimating" || status === "deploying"}
            >
              {status === "estimating" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Fuel className="mr-1 h-3 w-3" />
              )}
              Estimate Gas
            </Button>
          </div>
          <Button
            form="deploy-form"
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6 w-full sm:w-auto"
            disabled={status === "estimating" || status === "deploying"}
          >
            {status === "deploying" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deploying...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" /> Deploy Contract
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* ── Deployment Progress ── */}
      {(status === "deploying" || status === "success" || status === "error") && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Progress</CardTitle>
            <CardDescription>
              {status === "deploying"
                ? "Your contract is being deployed. Please wait..."
                : status === "success"
                ? "Contract deployed successfully!"
                : "Deployment encountered an error."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    step.status === "done"
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : step.status === "active"
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-neutral-800 bg-transparent"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      step.status === "done"
                        ? "bg-emerald-500 text-black"
                        : step.status === "active"
                        ? "border-2 border-emerald-400 text-emerald-400"
                        : "border-2 border-neutral-700 text-neutral-600"
                    }`}
                  >
                    {step.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : step.status === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <step.icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step.status === "done"
                        ? "text-emerald-300"
                        : step.status === "active"
                        ? "text-emerald-200"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.status === "done" && (
                    <Badge variant="success" className="ml-auto text-[10px]">
                      Done
                    </Badge>
                  )}
                  {step.status === "active" && (
                    <Badge variant="warning" className="ml-auto text-[10px]">
                      In Progress
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="mt-4">
                <StatusBanner kind="error" message={errorMessage} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Deployment Result ── */}
      {result && showResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <CardTitle>Deployment Successful</CardTitle>
            </div>
            <CardDescription>
              Your contract <span className="font-semibold text-foreground">{contractName || "Untitled"}</span> has been deployed to{" "}
              {CHAINS.find((c) => c.value === chain)?.label ?? chain}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contract Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contract Address
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-[#0d1117] border border-neutral-800 px-3 py-2 text-xs font-mono text-emerald-300 break-all select-all">
                  {result.contractAddress}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 py-1 px-3 text-[10px] h-8 shrink-0"
                  onClick={() => copyToClipboard(result.contractAddress)}
                >
                  Copy
                </Button>
                <a
                  href={blockExplorerUrl(result.contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-border-muted hover:bg-white/5 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>

            {/* Transaction Hash */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transaction Hash
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-[#0d1117] border border-neutral-800 px-3 py-2 text-xs font-mono text-amber-300 break-all select-all">
                  {result.transactionHash}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 py-1 px-3 text-[10px] h-8 shrink-0"
                  onClick={() => copyToClipboard(result.transactionHash)}
                >
                  Copy
                </Button>
                <a
                  href={txExplorerUrl(result.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-border-muted hover:bg-white/5 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>

            {/* ABI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contract ABI
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 py-1 px-3 text-[10px] h-7"
                  onClick={() => downloadAbi(result.abi, contractName || "contract")}
                >
                  <FileCode className="mr-1 h-3 w-3" />
                  Download JSON
                </Button>
              </div>
              <pre className="rounded bg-[#0d1117] border border-neutral-800 p-3 text-[10px] font-mono text-neutral-300 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre select-all">
                {result.abi}
              </pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="border-border-muted hover:bg-white/5"
              onClick={reset}
            >
              <Rocket className="mr-2 h-4 w-4" /> Deploy Another
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── History ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>
                Past contract deployments stored locally in your browser.
              </CardDescription>
            </div>
            {history.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] h-7"
                onClick={clearHistory}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="No Deployments Yet"
              description="Deploy your first smart contract above to see the history here."
            />
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-4 rounded-lg border border-border-muted/50 bg-white/[0.01] p-4 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Code className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {record.contractName}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {truncateHash(record.contractAddress)}
                        </p>
                      </div>
                      <Badge variant="success" className="shrink-0 text-[10px]">
                        Deployed
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>{new Date(record.timestamp).toLocaleString()}</span>
                      <span className="text-neutral-700">·</span>
                      <span>{CHAINS.find((c) => c.value === record.chain)?.label ?? record.chain}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={blockExplorerUrl(record.contractAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View on Explorer
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 py-1 px-2.5 text-[10px] h-6"
                        onClick={() => downloadAbi(record.abi, record.contractName)}
                      >
                        <FileCode className="mr-1 h-3 w-3" />
                        ABI
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10 py-1 px-2.5 text-[10px] h-6 ml-auto"
                        onClick={() => deleteRecord(record.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
