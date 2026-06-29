import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Bell, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Notifications"
        description="Review recent system events, audit outcomes, and DAO activity." 
      />

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3 text-neon-blue">
          <Bell className="h-5 w-5" />
          <p className="text-sm font-medium">All of your latest alerts and notifications in one view.</p>
        </div>

        <div className="grid gap-4">
          {[
            { title: "Audit completed", body: "Your Solidity security scan finished successfully.", icon: CheckCircle2 },
            { title: "New proposal voting", body: "A new DAO proposal requires your vote.", icon: Clock },
            { title: "Profile role updated", body: "Your account role has been refreshed in settings.", icon: Bell },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border-muted bg-surface-slate/70 p-4">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-neon-purple" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button asChild className="neon-glow">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
