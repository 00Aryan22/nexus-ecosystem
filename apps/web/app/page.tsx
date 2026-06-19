import { ConnectWalletButton } from "@/components/auth/connect-wallet-button";

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

      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-5 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-neon-blue">
          NEXUS AI · Phase 1 Foundation
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-geist)] text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Agentic OS for Web3 Founders
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          AI-powered startup building, verifiable skill passports, smart contract
          audits, and DAO governance — one platform.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ConnectWalletButton />
          <a
            href="/auth/connect"
            className="inline-flex h-11 items-center rounded-md border border-border px-6 text-sm font-medium hover:bg-accent"
          >
            Sign In
          </a>
        </div>
        <p className="mt-16 font-mono text-xs text-muted-foreground">
          API: {process.env.NEXT_PUBLIC_API_URL ?? "not configured"} · Chain{" "}
          {process.env.NEXT_PUBLIC_CHAIN_ID ?? "80002"}
        </p>
      </main>
    </div>
  );
}
