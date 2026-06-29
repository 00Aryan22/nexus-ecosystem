import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HelpCircle, Mail, LifeBuoy } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Support"
        description="Get help with account setup, contract flows, or platform issues."
      />

      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-3 text-neon-blue">
          <HelpCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Troubleshoot your workflow with guided support resources and contact channels.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border-muted bg-surface-slate/70 p-4">
            <h3 className="text-sm font-semibold text-foreground">Contact Support</h3>
            <p className="mt-2 text-sm text-muted-foreground">Open a support request for technical issues or live onboarding assistance.</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-neon-purple" />
                <span>support@nexus.ai</span>
              </div>
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-neon-blue" />
                <span>Help center coming soon</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border-muted bg-surface-slate/70 p-4">
            <h3 className="text-sm font-semibold text-foreground">Self-Service Guides</h3>
            <p className="mt-2 text-sm text-muted-foreground">Use docs and templates to resolve common issues quickly.</p>
            <Button asChild className="mt-4 neon-glow">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
