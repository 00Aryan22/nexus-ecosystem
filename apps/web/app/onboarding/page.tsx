"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Wallet,
  Award,
  Upload,
  Bot,
  LayoutDashboard,
  ArrowLeft,
  ArrowRight,
  Check,
  UploadCloud,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { NexusLogo } from "@/components/layout/logo";
import { ConnectWalletButton } from "@/components/auth/connect-wallet-button";
import { Button } from "@/components/ui/button";

const steps = [
  {
    id: "connect",
    icon: Wallet,
    title: "Connect Wallet",
    subtitle: "Step 1 of 5",
    description:
      "Link your Web3 wallet to get started with Nexus AI. Your wallet is your identity across the ecosystem — powering on-chain reputation, NFT credentials, and agentic workflows.",
  },
  {
    id: "passport",
    icon: Award,
    title: "Mint Your Passport",
    subtitle: "Step 2 of 5",
    description:
      "Prove your skills and mint a soulbound Skill Passport NFT on Polygon Amoy. Each passport is an on-chain credential verified by AI analysis of your GitHub history and evidence submissions.",
  },
  {
    id: "knowledge",
    icon: Upload,
    title: "Upload Knowledge",
    subtitle: "Step 3 of 5",
    description:
      "Feed your workspace with documentation, codebases, and research. The AI founder agent uses these sources to generate context-aware blueprints, tokenomics models, and pitch materials.",
  },
  {
    id: "agent",
    icon: Bot,
    title: "Chat with AI Founder Agent",
    subtitle: "Step 4 of 5",
    description:
      "Your personal AI co-founder. Brainstorm venture ideas, run market analysis, model tokenomics, and generate pitch decks — all through natural conversation with the agent.",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "View Your Dashboard",
    subtitle: "Step 5 of 5",
    description:
      "Your mission control center. Track projects, monitor skill passports, review audit reports, and manage your startup builder workspace — all in one place.",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback((index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  }, [currentStep]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-obsidian">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.2), transparent), radial-gradient(ellipse 60% 40% at 100% 80%, rgba(168,85,247,0.12), transparent)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
        {/* Header with logo */}
        <div className="flex items-center justify-between">
          <NexusLogo />
          <span className="font-mono text-xs text-muted-foreground">
            {step.subtitle}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-8 flex items-center gap-2">
          {steps.map((s, i) => {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                className="group flex items-center gap-1"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                    isActive
                      ? "border-neon-blue bg-neon-blue/20 text-neon-blue shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                      : isCompleted
                        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400"
                        : "border-border-muted bg-surface-slate/50 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <s.icon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span
                  className={`hidden text-[10px] font-medium tracking-wider sm:inline ${
                    isActive
                      ? "text-neon-blue"
                      : isCompleted
                        ? "text-emerald-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Thin progress line */}
        <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-border-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Step content */}
        <div className="mt-12 flex flex-1 items-center justify-center">
          <div className="w-full overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex flex-col items-center text-center"
              >
                {/* Icon */}
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border-muted bg-surface-slate shadow-lg">
                  <step.icon className="h-9 w-9 text-neon-blue" />
                </div>

                {/* Heading */}
                <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {step.title}
                </h2>

                {/* Description */}
                <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>

                {/* Step-specific content */}
                <div className="mt-8 w-full max-w-md">
                  {currentStep === 0 && <StepConnectWallet />}
                  {currentStep === 1 && <StepMintPassport />}
                  {currentStep === 2 && <StepUploadKnowledge />}
                  {currentStep === 3 && <StepFounderAgent />}
                  {currentStep === 4 && <StepDashboard />}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between pb-8">
          <div>
            {!isFirst && (
              <Button
                variant="outline"
                size="lg"
                onClick={prev}
                className="border-border-muted hover:bg-white/5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLast && (
              <Button
                size="lg"
                className="neon-glow"
                onClick={next}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Skip to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepConnectWallet() {
  return (
    <div className="space-y-6">
      <ConnectWalletButton />
      <div className="rounded-xl border border-border-muted bg-surface-slate/60 p-4 text-left">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-neon-purple" />
          Why connect your wallet?
        </h4>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon-blue" />
            Soulbound passports are minted directly to your wallet
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon-blue" />
            Founder agent sessions are linked to your wallet identity
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon-blue" />
            Sign-in with Ethereum (SIWE) for secure authentication
          </li>
        </ul>
      </div>
    </div>
  );
}

function StepMintPassport() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neon-purple/20 bg-gradient-to-br from-neon-purple/5 to-transparent p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-purple/20">
            <Award className="h-5 w-5 text-neon-purple" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Soulbound Skill Passport
            </p>
            <p className="text-xs text-muted-foreground">
              Non-transferable NFT credentials
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Submit evidence of your work — GitHub repos, audit reports, or any
          URL — and let AI evaluate your expertise. Once approved, mint a
          permanent on-chain credential.
        </p>
      </div>
      <Button
        size="lg"
        className="w-full bg-neon-purple text-white hover:bg-neon-purple/80 neon-glow"
        asChild
      >
        <Link href="/skill-passport">
          Go to Skill Passport <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function StepUploadKnowledge() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-muted bg-surface-slate/30 p-8 transition-colors hover:border-neon-blue/40 hover:bg-surface-slate/50">
        <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Drag &amp; drop files here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or open the workspace to upload knowledge
        </p>
      </div>
      <Button
        size="lg"
        className="w-full neon-glow"
        asChild
      >
        <Link href="/workspace">
          Open Workspace <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function StepFounderAgent() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border-muted bg-surface-slate/60 p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-blue/20">
            <Bot className="h-5 w-5 text-neon-blue" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              AI Founder Agent
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by Nexus AI
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Describe your startup idea and the agent will generate market
          analysis, tokenomics models, competitor research, and even a draft
          pitch deck — all in real time.
        </p>
      </div>
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90"
        asChild
      >
        <Link href="/founder-agent">
          Chat with Founder Agent <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function StepDashboard() {
  return (
    <div className="space-y-6">
      {/* Celebration particles */}
      <div className="relative flex items-center justify-center">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{
              background:
                i % 2 === 0 ? "#3b82f6" : "#a855f7",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, (i % 4 - 1.5) * 80],
              y: [0, -(Math.floor(i / 4) * 60 + 40)],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.12,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />
        ))}
        <Sparkles className="h-12 w-12 text-neon-blue" />
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-5 text-center">
        <Check className="mx-auto h-8 w-8 text-emerald-400" />
        <p className="mt-2 text-sm font-semibold text-foreground">
          You&apos;re all set!
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your ecosystem is ready. Start building, verifying, and shipping.
        </p>
      </div>

      <Button
        size="lg"
        className="w-full neon-glow"
        asChild
      >
        <Link href="/dashboard">
          Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
