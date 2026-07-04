import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-surface-obsidian px-6 py-12 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-neon-blue/30 bg-neon-blue/10 px-3 py-1 text-sm font-medium text-neon-blue">
              Marketplace
            </div>
            <div className="rounded-full border border-neon-purple/30 bg-neon-purple/10 px-3 py-1 text-sm font-medium text-neon-purple">
              Live onboarding
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Discover AI-native startup tools and services.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            This marketplace hub surfaces launch-ready modules, agent services, and partner integrations for founders who need fast execution.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-neon-blue px-4 py-2 text-sm font-medium text-white hover:bg-neon-blue/80">
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/founder-agent" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Talk to founder agent <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Launch Copilot",
              description: "Automate startup planning, validation, and investor-ready messaging.",
              icon: TrendingUp,
            },
            {
              title: "Security Relay",
              description: "Protect your stack with wallet-aware access controls and audit workflows.",
              icon: ShieldCheck,
            },
            {
              title: "Passport Studio",
              description: "Publish verifiable skill credentials and reputation signals in one flow.",
              icon: Sparkles,
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <item.icon className="h-8 w-8 text-neon-blue" />
              <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
