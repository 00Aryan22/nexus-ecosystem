import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { User, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Profile"
        description="Review your session identity, wallet address, and developer role." 
      />

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 text-neon-blue">
          <User className="h-5 w-5" />
          <p className="text-sm font-medium">Manage your personal profile details and wallet identity.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border-muted bg-surface-slate/70 p-4">
            <h3 className="text-sm font-semibold text-foreground">Wallet Identity</h3>
            <p className="mt-2 text-sm text-muted-foreground">Connect and sign in with your Web3 wallet to access the Nexus dashboard.</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-neon-purple" />
                <span>SIWE authenticated session</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-neon-blue" />
                <span>Wallet address</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-muted bg-surface-slate/70 p-4">
            <h3 className="text-sm font-semibold text-foreground">Profile Actions</h3>
            <p className="mt-2 text-sm text-muted-foreground">Update your role and preferences from the settings page.</p>
            <Button asChild className="mt-4 neon-glow">
              <Link href="/settings">Open Settings</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
