"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = {
  sender: "agent" | "user";
  text: string;
  timestamp: string;
};

const SUGGESTIONS = [
  "How should I structure my utility token emissions schedule?",
  "What is the total addressable market TAM for decentralized Web3 identities?",
  "Can you draft a roadmap for launching a cross-chain liquidity aggregator?",
  "Recommend a standard security protection against reentrancy in Solidity.",
];

export default function FounderAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "agent",
      text: "Hello! I am your AI Founder Agent. I can help you draft roadmaps, size target markets, formulate token utility structures, and review contract security concepts. How can I assist you with your venture today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI response trigger
    setTimeout(() => {
      let reply = "";
      const lower = text.toLowerCase();

      if (lower.includes("token") || lower.includes("emission")) {
        reply = `### Tokenomics Modeling Recommendation\n\nFor a standard utility token, consider the following allocation structure:\n* **Community Rewards / Liquidity Mining**: 50%\n* **Team & Advisors**: 15% (vested over 3 years with a 1-year cliff)\n* **Ecosystem Growth**: 20%\n* **Public/Private Token Sale**: 15% (for seed capital)\n\n**Emission Schedule:** Standard linear decay emissions matching protocol utilization levels is recommended to protect token sink ratios.`;
      } else if (lower.includes("market") || lower.includes("tam") || lower.includes("identity")) {
        reply = `### TAM Analysis: Web3 Decentralized Identity (DID)\n\n* **Global Market Size (2025):** ~$1.2 Billion\n* **Estimated TAM (2030):** ~$14.8 Billion (compounding at a CAGR of 38%)\n* **Core Value Sinks:** Enterprise authorization middleware, verifiable reputation passports, and compliance tools (KYC/AML) for permissioned DeFi pools.`;
      } else if (lower.includes("roadmap") || lower.includes("cross-chain")) {
        reply = `### Draft Venture Launch Roadmap\n\n1. **Phase 1 (Month 1-2):** Design core smart contracts, complete mathematical simulation models of fee weights, and set up the Hardhat staging suite.\n2. **Phase 2 (Month 3-4):** Execute an automated AI security audit (via Auditor console), run a public testnet incentivization pool on Polygon Amoy, and deploy verified Soulbound skill badges to dev core.\n3. **Phase 3 (Month 5+):** Launch on Mainnet, bootstrap pool liquidity, and seed governance structures.`;
      } else if (lower.includes("reentrancy") || lower.includes("solidity")) {
        reply = `### Smart Contract Security Pattern\n\nTo prevent reentrancy exploits in Solidity:\n1. **Use Check-Effects-Interactions Pattern:** Perform state checks, update state variables, and only then interact with external addresses.\n2. **Use ReentrancyGuard:** Inherit OpenZeppelin's contract and apply the \`nonReentrant\` modifier to critical functions.\n\n\`\`\`solidity\nfunction withdraw() external nonReentrant {\n    uint256 amount = balances[msg.sender];\n    require(amount > 0);\n    balances[msg.sender] = 0; // Effect\n    payable(msg.sender).transfer(amount); // Interaction\n}\n\`\`\``;
      } else {
        reply = `Interesting query! In Phase 5, my models will fetch your database blueprints from the **Startup Builder** and scan code repositories directly. \n\nFor now, try asking me about: \n* **"Tokenomics emissions"**\n* **"Market size or TAM"**\n* **"Launch roadmap"**\n* **"Reentrancy defense"**`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "agent",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="glass-card flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto overflow-hidden">
      {/* Top Console status */}
      <div className="flex items-center justify-between border-b border-border-muted bg-surface-slate/40 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-tr from-neon-blue to-neon-purple text-white shadow-[0_0_8px_rgba(59,130,246,0.3)] animate-pulse">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-xs text-foreground flex items-center gap-1.5">
              Nexus Founder Agent (Phase 5 Preview)
            </h3>
            <div className="flex items-center gap-1 mt-0.5 text-[9px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ACTIVE MODEL: GEMINI 1.5 PRO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="px-6 pt-6 grid gap-2.5 sm:grid-cols-2">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              className="text-left text-[11px] p-2.5 rounded border border-border-muted/80 bg-surface-slate/20 text-muted-foreground hover:bg-surface-slate/50 hover:text-foreground transition-all duration-200"
              onClick={() => handleSend(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages console area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
        {messages.map((m, idx) => {
          const isAgent = m.sender === "agent";
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 max-w-[85%] ${isAgent ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 border ${
                  isAgent
                    ? "bg-neon-blue/10 border-neon-blue/20 text-neon-blue"
                    : "bg-neon-purple/10 border-neon-purple/20 text-neon-purple"
                }`}
              >
                {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>

              <div className="space-y-1.5">
                <div
                  className={`rounded-lg p-3.5 leading-relaxed whitespace-pre-wrap ${
                    isAgent
                      ? "bg-surface-slate/60 border border-border-muted text-foreground"
                      : "bg-neon-purple/10 border border-neon-purple/10 text-foreground"
                  }`}
                >
                  {/* Simple text formatting (like markdown headings and lists) */}
                  {m.text.split("\n").map((line, lIdx) => {
                    if (line.startsWith("### ")) {
                      return <h4 key={lIdx} className="font-heading font-bold text-sm text-foreground mt-2 mb-1.5">{line.substring(4)}</h4>;
                    }
                    if (line.startsWith("* ")) {
                      return <li key={lIdx} className="ml-4 list-disc text-muted-foreground mt-0.5">{line.substring(2)}</li>;
                    }
                    return <p key={lIdx} className={line === "" ? "h-2" : "text-muted-foreground"}>{line}</p>;
                  })}
                </div>
                <p className={`font-mono text-[9px] text-muted-foreground ${isAgent ? "text-left" : "text-right"}`}>
                  {m.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 mr-auto max-w-[80%]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-neon-blue/10 border-neon-blue/20 text-neon-blue flex-shrink-0">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg p-3.5 bg-surface-slate/60 border border-border-muted text-muted-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-blue"></span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider animate-pulse">Founder Agent is processing query…</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-border-muted bg-surface-slate/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            className="flex-1 rounded border border-border-muted bg-surface-obsidian p-2.5 px-4 text-xs focus:border-neon-blue focus:outline-none"
            placeholder="Ask AI Founder Agent about tokenomics, TAM, roadmaps, security..."
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-neon-blue hover:bg-neon-blue/80 text-white p-2.5 h-10 w-10 flex items-center justify-center rounded-md"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
