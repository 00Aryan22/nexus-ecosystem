import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Clock, FileText } from "lucide-react";

export default function DashboardHistoryPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Dashboard History"
        description="Review past sessions, audit results, and system events within the Nexus dashboard." 
      />

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 text-neon-blue">
          <Clock className="h-5 w-5" />
          <p className="text-sm font-medium">Your historical activity and audit timeline are collected here for replay and compliance.</p>
        </div>

        <div className="rounded-xl border border-border-muted bg-surface-slate/70 p-4">
          <h3 className="text-sm font-semibold text-foreground">Recent events</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Audit completed: ERC-20 review with risk score 84/100</li>
            <li>DAO vote closed: treasury allocation approved</li>
            <li>Skill passport minted for Solidity credential</li>
          </ul>
        </div>

        <Button asChild className="neon-glow">
          <Link href="/dashboard">
            Back to Dashboard <FileText className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
