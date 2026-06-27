"use client";

import { useAuth } from "@/hooks/use-auth";
import { recordAnalyticsEvent } from "@/lib/api/client";
import {
  User,
  ShieldCheck,
  Cpu,
  Globe,
  Settings,
  Briefcase,
  Search,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { user, setUser, address } = useAuth();

  const handleRoleChange = async (role: "founder" | "auditor" | "admin") => {
    if (!user) return;
    try {
      const updatedUser = { ...user, role };
      setUser(updatedUser);

      // Record profile change in analytics
      await recordAnalyticsEvent({
        event_type: "profile_updated",
        event_data: { updated_role: role },
      });
    } catch (err) {
      console.error("Failed to log role update", err);
    }
  };

  const roles = [
    {
      id: "founder",
      name: "Founder Persona",
      desc: "Ideal for scaffolding ventures, modeling token utility, and tracking product roadmap checklists.",
      icon: Briefcase,
      color: "border-neon-blue/20 text-neon-blue bg-neon-blue/5",
      activeColor: "border-neon-blue bg-neon-blue/10 text-neon-blue ring-1 ring-neon-blue",
    },
    {
      id: "auditor",
      name: "Auditor Persona",
      desc: "For security auditors and static checkers scanning contracts and publishing audit findings.",
      icon: Search,
      color: "border-amber-500/20 text-amber-400 bg-amber-500/5",
      activeColor: "border-amber-500 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500",
    },
    {
      id: "admin",
      name: "Admin / Evaluator",
      desc: "Used by ecosystem managers verifying proof links and transitioning skill statuses from approved to minted.",
      icon: Key,
      color: "border-neon-purple/20 text-neon-purple bg-neon-purple/5",
      activeColor: "border-neon-purple bg-neon-purple/10 text-neon-purple ring-1 ring-neon-purple",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="OS Configuration & Settings" 
        description="Manage Web3 identity roles and inspect platform endpoints."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile metadata panel (Col 1) */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border-muted pb-3">
              <User className="h-4 w-4 text-neon-blue" />
              Session Profile
            </h3>

            <div className="space-y-3.5 text-xs font-mono">
              <div>
                <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Wallet Address</p>
                <p className="mt-1 text-foreground truncate">{address || "Not Connected"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Verification State</p>
                <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>SIWE Secure</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Account Role</p>
                <p className="mt-1 text-foreground capitalize font-semibold">{user?.role || "Founder"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Persona Role Switcher (Col 2) */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="font-heading font-semibold text-base">Ecosystem Persona Selector</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Toggle your context role to test different workflows of the monorepo platform.
              </p>
            </div>

            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = user?.role === role.id;

                return (
                  <div
                    key={role.id}
                    onClick={() => void handleRoleChange(role.id as any)}
                    className={`flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-all ${
                      isActive ? role.activeColor : `${role.color} hover:bg-white/[0.02]`
                    }`}
                  >
                    <div className="rounded-lg bg-surface-slate p-2 border border-border-muted flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-foreground">{role.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                        {role.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Environment Specs */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border-muted pb-3">
              <Cpu className="h-4 w-4 text-neon-purple" />
              Developer Environment Constants
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 text-xs font-mono">
              <div>
                <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Internal API Host</p>
                <p className="mt-1 text-foreground">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Testnet RPC Gateway</p>
                <p className="mt-1 text-foreground truncate">https://polygon-amoy.g.alchemy.com/v2/...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
