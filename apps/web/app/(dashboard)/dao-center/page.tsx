import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Users, ChartPie } from "lucide-react";

export default function DaoCenterPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="DAO Center"
        description="Governance, proposals, and collective decision-making for your ecosystem."
      />

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 text-neon-blue">
          <Users className="h-5 w-5" />
          <p className="text-sm font-medium">Collaborate with your community, review active proposals, and manage treasury priorities.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border-muted bg-surface-slate/70 p-4">
            <h3 className="text-sm font-semibold text-foreground">Governance Summary</h3>
            <p className="mt-2 text-sm text-muted-foreground">Proposal votes, quorum thresholds, and pending DAO actions are tracked here.</p>
          </div>
          <div className="rounded-xl border border-border-muted bg-surface-slate/70 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Ecosystem Metrics</h3>
              <ChartPie className="h-4 w-4 text-neon-purple" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Monitor participation, treasury health, and proposal outcomes in a single command center.</p>
          </div>
        </div>
        <Button asChild className="neon-glow">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
