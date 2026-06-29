"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rocket,
  Award,
  ShieldAlert,
  BarChart3,
  Bot,
  Settings as SettingsIcon,
  LogOut,
  Wallet,
  Bell,
  User,
  Users,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NexusLogo } from "@/components/layout/logo";
import { isFeatureEnabled, FeatureFlag } from "@/lib/feature-flags";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  flag: FeatureFlag;
};

const NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    flag: "dashboard",
  },
  {
    name: "Startup Builder",
    href: "/startup-builder",
    icon: Rocket,
    flag: "startup_builder",
  },
  {
    name: "Skill Passport",
    href: "/skill-passport",
    icon: Award,
    flag: "skill_passport",
  },
  {
    name: "Contract Auditor",
    href: "/auditor",
    icon: ShieldAlert,
    flag: "contract_auditor",
  },
  {
    name: "AI Founder Agent",
    href: "/founder-agent",
    icon: Bot,
    flag: "founder_agent",
  },
  {
    name: "DAO Center",
    href: "/dao-center",
    icon: Users,
    flag: "dashboard",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    flag: "analytics",
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    flag: "settings",
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    flag: "settings",
  },
  {
    name: "Support",
    href: "/support",
    icon: HelpCircle,
    flag: "settings",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    flag: "settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, address, signOut } = useAuth();

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";

  return (
    <aside className="fixed bottom-0 left-0 top-0 hidden w-[240px] border-r border-border-muted bg-surface-slate/95 backdrop-blur-xl md:flex flex-col z-40">
      {/* Brand Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border-muted">
        <NexusLogo className="h-full" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {NAV_ITEMS.map((item) => {
          if (!isFeatureEnabled(item.flag)) return null;
          
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all group ${
                isActive
                  ? "bg-gradient-to-r from-neon-blue/10 to-transparent text-neon-blue"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[2px] rounded-r bg-neon-blue shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-neon-blue" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Wallet / Session Info */}
      <div className="p-4 border-t border-border-muted bg-surface-obsidian/30">
        <div className="flex items-center gap-3 rounded-lg border border-border-muted bg-surface-slate/40 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-blue/10 text-neon-blue">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-mono font-medium text-foreground">
              {truncatedAddress}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Role: {user?.role ?? "Founder"}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          className="mt-3 w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
