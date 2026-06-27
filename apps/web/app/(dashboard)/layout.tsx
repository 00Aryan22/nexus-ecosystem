"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X, Wallet, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { useUIStore } from "@/store/ui-store";
import { isFeatureEnabled, routeToFeatureFlag } from "@/lib/feature-flags";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, isAuthenticated, address, user, signOut } = useAuth();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard Overview";
    if (pathname.startsWith("/startup-builder")) return "Startup Builder Workspace";
    if (pathname.startsWith("/skill-passport")) return "Verifiable Skill Passports";
    if (pathname.startsWith("/auditor")) return "Smart Contract Auditor";
    if (pathname.startsWith("/analytics")) return "Product Analytics";
    if (pathname.startsWith("/founder-agent")) return "AI Founder Agent";
    if (pathname.startsWith("/settings")) return "System Settings";
    return "Nexus OS";
  };

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-obsidian text-foreground">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-neon-blue animate-spin" />
          <div className="absolute h-8 w-8 rounded-full border-b-2 border-l-2 border-neon-purple animate-spin" style={{ animationDirection: 'reverse' }} />
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          Securing session…
        </p>
      </div>
    );
  }

  // Fallback if client router hasn't finished middleware redirect yet
  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-obsidian text-foreground p-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          You must connect and sign in with your Web3 wallet to access this section of the OS.
        </p>
        <Button className="mt-6 neon-glow" asChild>
          <Link href="/auth/connect">Connect Wallet</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-obsidian text-foreground">
      {/* Background gradients */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(59,130,246,0.15), transparent), radial-gradient(ellipse 40% 30% at 90% 50%, rgba(168,85,247,0.10), transparent)",
        }}
      />

      {/* Sidebar Component */}
      <Sidebar />

      {/* Mobile Header Nav */}
      <header className="flex h-16 items-center justify-between border-b border-border-muted bg-surface-slate/85 px-4 backdrop-blur-xl md:hidden sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center font-bold text-white text-[10px] tracking-wider">
            N
          </div>
          <span className="font-heading font-bold text-sm tracking-tight">NEXUS AI</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded p-1.5 hover:bg-white/5"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-surface-obsidian/95 z-40 md:hidden p-6 flex flex-col space-y-4">
          <div className="flex-1 space-y-2">
            {[
              { name: "Dashboard", href: "/dashboard" },
              { name: "Startup Builder", href: "/startup-builder" },
              { name: "Skill Passport", href: "/skill-passport" },
              { name: "Contract Auditor", href: "/auditor" },
              { name: "Analytics", href: "/analytics" },
              { name: "Founder Agent", href: "/founder-agent" },
              { name: "Settings", href: "/settings" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                  pathname === link.href ? "bg-white/5 text-neon-blue" : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-border-muted pt-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono p-2 rounded bg-surface-slate/40 border border-border-muted">
              <Wallet className="h-4 w-4 text-neon-blue" />
              <span className="truncate">{truncatedAddress}</span>
            </div>
            <Button
              className="w-full justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
              onClick={() => {
                setMobileMenuOpen(false);
                void signOut();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="md:pl-[240px] min-h-screen flex flex-col">
        {/* Top bar header */}
        <header className="hidden h-16 items-center justify-between border-b border-border-muted bg-surface-slate/20 px-10 md:flex">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-md font-bold tracking-tight text-[#E3E2E3]">
              {getPageTitle()}
            </h1>
            <div className="flex items-center gap-1.5 rounded-full border border-neon-blue/20 bg-neon-blue/5 px-2.5 py-0.5 text-[10px] font-semibold text-neon-blue shadow-[0_0_8px_rgba(59,130,246,0.15)] animate-pulse">
              <Activity className="h-3 w-3" />
              Polygon Amoy
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md border border-border-muted bg-surface-slate/40 text-muted-foreground shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-neon-purple" />
              <span>SIWE SECURE</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md border border-border-muted bg-surface-slate/60">
              <div className="h-2 w-2 rounded-full bg-neon-blue shadow-[0_0_6px_#3b82f6]" />
              <span>{truncatedAddress}</span>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
          <PageTransition>
            {isFeatureEnabled(routeToFeatureFlag(pathname) ?? "dashboard") ? (
              children
            ) : (
              <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <div className="rounded-xl bg-surface-slate/60 border border-border-muted p-4 mb-4">
                  <Activity className="h-8 w-8 text-neon-blue" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Feature in Development</h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  This module is currently disabled by a feature flag. Check back later!
                </p>
              </div>
            )}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
