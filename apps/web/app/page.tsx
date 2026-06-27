"use client";

import { ConnectWalletButton } from "@/components/auth/connect-wallet-button";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Bot, ShieldAlert, Rocket, Layers } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-obsidian">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.25), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(168,85,247,0.15), transparent)",
        }}
      />

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-5 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-neon-blue/30 bg-neon-blue/10 px-3 py-1 text-xs font-medium text-neon-blue backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-neon-blue mr-2 animate-pulse"></span>
            Nexus AI OS Phase 1 Live
          </div>
          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
            Agentic OS for <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              Web3 Founders
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            AI-powered startup building, verifiable skill passports, smart contract
            audits, and ecosystem analytics — one decentralized platform.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <ConnectWalletButton />
            <Button
              variant="outline"
              size="lg"
              className="border-border-muted hover:bg-white/5 w-full sm:w-auto"
              asChild
            >
              <Link href="/auth/connect">
                Access Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          {[
            {
              title: "AI Founder Agent",
              desc: "Automate market sizing, tokenomics modeling, and venture blueprinting.",
              icon: Bot,
              color: "text-neon-blue",
              bg: "bg-neon-blue/10 border-neon-blue/20",
            },
            {
              title: "Soulbound Skills",
              desc: "Verify your GitHub history and mint on-chain skill passports.",
              icon: Layers,
              color: "text-neon-purple",
              bg: "bg-neon-purple/10 border-neon-purple/20",
            },
            {
              title: "Instant Auditor",
              desc: "Paste Solidity code and get instant, AI-driven security reports.",
              icon: ShieldAlert,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card p-6 transition-all hover:scale-[1.02] hover:border-border cursor-default"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border ${feature.bg} ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 font-mono text-xs text-muted-foreground/60 flex items-center gap-2"
        >
          <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
          API: {process.env.NEXT_PUBLIC_API_URL ?? "connected"} · Chain{" "}
          {process.env.NEXT_PUBLIC_CHAIN_ID ?? "80002"}
        </motion.p>
      </main>
    </div>
  );
}
