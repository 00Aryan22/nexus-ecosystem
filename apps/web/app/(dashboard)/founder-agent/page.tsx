"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

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
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title="AI Founder Agent"
        description="Conversational intelligence to validate ideas, structure tokenomics, and build blueprints."
      />
      <div className="glass-card flex flex-col flex-1 overflow-hidden">
        {/* Messages console area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <EmptyState 
              icon={Bot}
              title="Hello, Founder"
              description="I am your AI co-founder. Describe your startup idea, ask about market sizing, or request tokenomics models."
              className="h-full"
            />
          ) : (
            messages.map((m, idx) => {
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
            })
          )}

          {loading && (
            <PageSpinner label="Initializing AI Founder Agent..." />
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
            className="relative flex-1"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your AI co-founder..."
              className="w-full pr-12 h-12 rounded-xl text-base bg-surface-obsidian border-border-muted focus:border-neon-purple focus:ring-neon-purple/30"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
              className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-neon-purple hover:bg-neon-purple/80 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
