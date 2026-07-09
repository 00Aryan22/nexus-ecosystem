import Link from "next/link";
import { ArrowRight, Wallet as WalletIcon, RefreshCw, ShieldCheck } from "lucide-react";

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-surface-obsidian px-6 py-12 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-neon-blue/30 bg-neon-blue/10 px-3 py-1 text-sm font-medium text-neon-blue">
              Wallet Hub
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Manage wallet state, balances, and on-chain activity.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            Connect a wallet, inspect your Polygon Amoy balances, and review recent transactions from a single place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/connect" className="inline-flex items-center gap-2 rounded-full bg-neon-blue px-4 py-2 text-sm font-medium text-white hover:bg-neon-blue/80">
              Connect wallet <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Back to dashboard <WalletIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-neon-blue" />
              <h2 className="text-xl font-semibold">Portfolio status</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Wallet data is now routed through the app shell and can be enriched by the active account connection.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-neon-purple" />
              <h2 className="text-xl font-semibold">Security posture</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              SIWE sign-in, session persistence, and wallet-aware access controls remain enabled for this experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
